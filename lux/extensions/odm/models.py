import json
from datetime import date, datetime
from enum import Enum

import pytz

from sqlalchemy import Column, desc, String
from sqlalchemy.orm import class_mapper, load_only
from sqlalchemy.sql.expression import func, cast
from sqlalchemy.exc import DataError
from sqlalchemy.orm.exc import NoResultFound

from pulsar import Http404
from pulsar.utils.html import nicename
from pulsar.utils.log import lazymethod

from odm.utils import get_columns

from lux.extensions import rest


def is_same_model(model1, model2):
    if type(model1) == type(model2):
        if model1 is not None:
            for pk in class_mapper(type(model1)).primary_key:
                if getattr(model1, pk.name) != getattr(model2, pk.name):
                    return False
            return True
        else:
            return True
    return False


RestColumn = rest.RestColumn
is_rel_column = rest.is_rel_column


class RestModel(rest.RestModel):
    '''A rest model based on SqlAlchemy ORM
    '''
    def rest_columns(self):
        self.columns()  # make sure columns are loaded
        return self._rest_columns

    def session(self, request):
        '''Obtain a session
        '''
        return request.app.odm().begin()

    def query(self, request, session, *args, **kwargs):
        """
        Returns a query object for the model.

        The loading of columns the user does not have read
        access to is deferred. This is only a performance enhancement.

        :param request:     request object
        :param session:     SQLAlchemy session
        :return:            query object
        """
        entities = self.columns_with_permission(request, 'read')
        db_model = self.db_model()
        db_columns = self.db_columns(self.column_fields(entities))
        query = session.query(db_model).options(load_only(*db_columns))
        if args:
            query = query.filter(*args)
        if kwargs:
            query = query.filter_by(**kwargs)
        return query

    def get_instance(self, request, session=None, *args, **kwargs):
        if not args and not kwargs:  # pragma    nocover
            raise Http404
        odm = request.app.odm()
        with odm.begin(session=session) as session:
            query = self.query(request, session, *args, **kwargs)
            try:
                return query.one()
            except (DataError, NoResultFound):
                raise Http404

    def get_list(self, request, session=None, *args, **kwargs):
        odm = request.app.odm()
        with odm.begin(session=session) as session:
            query = self.query(request, session, *args, **kwargs)
            return list(query)

    def meta(self, request, *filters, exclude=None):
        meta = super().meta(request, exclude=exclude)
        odm = request.app.odm()
        with odm.begin() as session:
            query = self.query(request, session, *filters)
            meta['total'] = query.count()
        return meta

    def db_model(self):
        '''Database model
        '''
        return self.app.odm()[self.name]

    def db_columns(self, columns=None):
        '''Return a list of columns available in the database table
        '''
        dbc = self._get_db_columns()
        if columns is None:
            return tuple(dbc.keys())
        else:
            return [c for c in columns if c in dbc]

    def set_model_attribute(self, instance, name, value):
        '''Set the the attribute ``name`` to ``value`` in a model ``instance``
        '''
        current_value = getattr(instance, name, None)
        col = self.rest_columns().get(name)
        if is_rel_column(col):
            rel_model = self.app.models.get(col.model)
            if isinstance(current_value, (list, set)):
                idfield = rel_model.id_field
                all = set((getattr(v, idfield) for v in value))
                avail = set()
                for item in tuple(current_value):
                    pkey = getattr(item, idfield)
                    if pkey not in all:
                        current_value.remove(item)
                    else:
                        avail.add(pkey)
                for item in value:
                    pkey = getattr(item, idfield)
                    if pkey not in avail:
                        current_value.append(item)
            elif not rel_model.same_instance(current_value, value):
                col.set(instance, value)
        else:
            setattr(instance, name, value)

    def tojson(self, request, obj, exclude=None, **kw):
        '''Override the method from the base class.

        It uses sqlalchemy model information about columns
        '''
        exclude = set(exclude or ())
        exclude.update(self._exclude)
        columns = self.columns()
        rest_columns = self.rest_columns()

        fields = {}
        for col in columns:
            name = col['name']
            restcol = rest_columns[name]
            if name in exclude:
                continue
            try:
                data = obj.__getattribute__(name)
                if hasattr(data, '__call__'):
                    data = data()
                if isinstance(data, date):
                    if isinstance(data, datetime) and not data.tzinfo:
                        data = pytz.utc.localize(data)
                    data = data.isoformat()
                elif isinstance(data, Enum):
                    data = data.name
                elif is_rel_column(restcol):
                    model = request.app.models.get(restcol.model)
                    if model:
                        data = self._related_model(request, model, data)
                    else:
                        data = None
                        request.logger.error(
                            'Could not fined model %s', restcol.model)
                else:   # Test Json
                    json.dumps(data)
            except TypeError:
                try:
                    data = str(data)
                except Exception:
                    continue
            if data is not None:
                if isinstance(data, list):
                    name = '%s[]' % name
                fields[name] = data
        # a json-encodable dict
        return fields

    def id_repr(self, request, obj):
        if obj:
            data = {'id': getattr(obj, self.id_field)}
            if self.repr_field != self.id_field:
                repr = getattr(obj, self.repr_field)
                if repr != data['id']:
                    data['repr'] = repr
            return data

    def create_model(self, request, data, session=None):
        odm = request.app.odm()
        db_model = self.db_model()
        with odm.begin(session=session) as session:
            instance = db_model()
            session.add(instance)
            for name, value in data.items():
                self.set_model_attribute(instance, name, value)
            session.flush()
        return instance

    def update_model(self, request, instance, data):
        odm = request.app.odm()
        session = odm.session_from_object(instance)
        with odm.begin(session=session) as session:
            session.add(instance)
            for name, value in data.items():
                self.set_model_attribute(instance, name, value)
        return instance

    def delete_model(self, request, instance):
        odm = request.app.odm()
        session = odm.session_from_object(instance)
        with odm.begin(session=session) as session:
            session.delete(instance)

    def same_instance(self, instance1, instance2):
        return is_same_model(instance1, instance2)

    # INTERNALS
    def _load_columns(self):
        '''List of column definitions
        '''
        self._rest_columns = {}
        db_columns = self._get_db_columns()
        input_columns = self._columns or []
        cols = db_columns._data.copy()
        columns = []

        # process input columns first
        for info in input_columns:
            col = RestColumn.make(info)
            if col.name not in self._rest_columns:
                dbcol = cols.pop(col.name, None)
                # If a database column
                if isinstance(dbcol, Column):
                    info = column_info(col.name, dbcol)
                    info.update(col.as_dict(self, defaults=False))
                else:
                    info = col.as_dict(self)
                self._append_col(col, columns, info)

        for name, col in cols.items():
            if name not in self._rest_columns:
                self._append_col(col, columns, column_info(name, col))

        return columns

    def _append_col(self, col, columns, info):
        name = info['name']
        self._rest_columns[name] = col
        if name in self._hidden:
            info['hidden'] = True
        columns.append(info)

    @lazymethod
    def _get_db_columns(self):
        return get_columns(self.db_model())

    def _related_model(self, request, model, obj):
        if isinstance(obj, list):
            return [self._related_model(request, model, d) for d in obj]
        else:
            return model.id_repr(request, obj)

    def _do_filter(self, request, query, field, op, value):
        """
        Applies filter conditions to a query.

        Notes on 'ne' op:

        Example data: [None, 'john', 'roger']
        ne:john would return only roger (i.e. nulls excluded)
        ne:     would return john and roger


        Notes on  'search' op:

        For some reason, SQLAlchemy uses to_tsquery rather than
        plainto_tsquery for the match operator

        to_tsquery uses operators (&, |, ! etc.) while
        plainto_tsquery tokenises the input string and uses AND between
        tokens, hence plainto_tsquery is what we want here

        For other database back ends, the behaviour of the match
        operator is completely different - see:
        http://docs.sqlalchemy.org/en/rel_1_0/core/sqlelement.html


        :param request:     request object
        :param query:       query object
        :param field:       field name
        :param op:          'eq', 'ne', 'gt', 'lt', 'ge', 'le' or 'search'
        :param value:       comparison value, string or list/tuple
        :return:
        """
        app = request.app
        odm = app.odm()
        field = getattr(odm[self.name], field)
        multiple = isinstance(value, (list, tuple))

        if value == '':
            value = None

        if multiple and op in ('eq', 'ne'):
            if op == 'eq':
                query = query.filter(field.in_(value))
            elif op == 'ne':
                query = query.filter(~field.in_(value))
        else:
            if multiple:
                assert len(value) > 0
                value = value[0]

            if op == 'eq':
                query = query.filter(field == value)
            elif op == 'ne':
                query = query.filter(field != value)
            elif op == 'search':
                dialect_name = odm.binds[odm[self.name].__table__].dialect.name
                if dialect_name == 'postgresql':
                    ts_config = field.info.get(
                        'text_search_config',
                        app.config['DEFAULT_TEXT_SEARCH_CONFIG']
                    )
                    query = query.filter(
                        func.to_tsvector(ts_config, cast(field, String)).op(
                            '@@')(func.plainto_tsquery(value))
                    )
                else:
                    query = query.filter(field.match(value))
            elif op == 'gt':
                query = query.filter(field > value)
            elif op == 'ge':
                query = query.filter(field >= value)
            elif op == 'lt':
                query = query.filter(field < value)
            elif op == 'le':
                query = query.filter(field <= value)
        return query

    def _do_sortby(self, request, query, entry, direction):
        columns = self.db_columns()
        if entry in columns:
            if direction == 'desc':
                entry = desc(entry)
            return query.order_by(entry)
        return query


class ModelMixin(rest.ModelMixin):
    RestModel = RestModel


def column_info(name, col):
    sortable = True
    filter = True
    try:
        python_type = col.type.python_type
        type = _types.get(python_type, 'string')
    except NotImplementedError:
        type = col.type.__class__.__name__.lower()
        sortable = False
        filter = False

    info = {'name': name,
            'field': col.name,
            'displayName': col.doc or nicename(name),
            'sortable': sortable,
            'filter': filter,
            'type': type}

    return info


_types = {int: 'integer',
          bool: 'boolean',
          date: 'date',
          datetime: 'datetime'}
