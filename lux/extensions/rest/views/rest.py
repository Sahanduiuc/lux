from pulsar import BadRequest, MethodNotAllowed
from pulsar.apps.wsgi import route

from lux.core import JsonRouter, GET_HEAD, POST_PUT
from lux.forms import get_form_class

from ..models import ModelMixin, RestModel


REST_CONTENT_TYPES = ['application/json']
DIRECTIONS = ('asc', 'desc')


class RestRoot(JsonRouter):
    '''Api Root

    Provide a get method for displaying a dictionary of api names - api urls
    key - value pairs
    '''
    response_content_types = REST_CONTENT_TYPES

    def apis(self, request):
        routes = {}
        for router in self.routes:
            url = '%s%s' % (request.absolute_uri(), router.route.rule)
            if isinstance(router, RestRouter):
                routes[router.model.api_name] = url
            else:
                routes[router.name] = url
        return routes

    def get(self, request):
        return self.json_response(request, self.apis(request))


class RestRouter(JsonRouter):
    '''A mixin to be used in conjunction with Routers, usually
    as the first class in the multi-inheritance declaration
    '''
    response_content_types = REST_CONTENT_TYPES

    def __init__(self, *args, **kwargs):
        url = None
        if args:
            url_or_model, args = args[0], args[1:]
            if isinstance(url_or_model, RestModel):
                self.model = url_or_model
            else:
                url = url_or_model

        if not isinstance(self.model, RestModel):
            raise TypeError('REST model not available in %s router' %
                            self.__class__.__name__)

        url = url or self.model.identifier
        assert url is not None, "Model %s has no valid url" % self.model
        super().__init__(url, *args, **kwargs)

    def json_data_files(self, request):
        content_type, _ = request.content_type_options
        try:
            assert content_type == 'application/json'
            return request.data_and_files()
        except AssertionError:
            raise BadRequest('Expected application/json content type')
        except ValueError:
            raise BadRequest('Problems parsing JSON')

    def urlargs(self, request):
        return request.urlargs

    # RestView implementation
    def get_instance(self, request, session=None, check_permission=None,
                     **args):
        args = args or self.urlargs(request)
        return self.model.get_instance(request, session=session,
                                       check_permission=check_permission,
                                       **args)

    def get_list(self, request, *filters, check_permission=None, **params):
        """Return a list of models satisfying user queries

        :param request: WSGI request with url data
        :param filters: positional filters passed by the application
        :param params: key-value filters passed by the application (the url
            data parameters will update this dictionary)
        :return: a pagination object as return by the
            :meth:`.query_data` method
        """
        cfg = request.config
        params.update(request.url_data)
        params['limit'] = params.pop(cfg['API_LIMIT_KEY'], None)
        params['offset'] = params.pop(cfg['API_OFFSET_KEY'], None)
        params['search'] = params.pop(cfg['API_SEARCH_KEY'], None)
        params['check_permission'] = check_permission
        return self.model.query_data(request, *filters, **params)

    def options(self, request):
        '''Handle the CORS preflight request
        '''
        request.app.fire('on_preflight', request)
        return request.response


class MetadataMixin:
    """Mixin to use with a :class:`.RestRouter` for serving
    metadata information
    """
    @route(method=('get', 'head', 'options'))
    def metadata(self, request):
        '''Model metadata'''
        if request.method == 'OPTIONS':
            request.app.fire('on_preflight', request, methods=GET_HEAD)
            return request.response

        meta = self.model.meta(request, check_permission='read')
        return self.json_response(request, meta)


class CRUD(MetadataMixin, RestRouter):
    '''A Router for handling CRUD JSON requests for a database model

    This class adds routes to the :class:`.RestRouter`
    '''
    def urlargs(self, request):
        return {self.model.id_field: request.urlargs['id']}

    def get(self, request):
        '''Get a list of models
        '''
        data = self.get_list(request, check_permission='read')
        return self.json_response(request, data)

    def post(self, request):
        '''Create a new model
        '''
        model = self.model
        form_class = get_form_class(request, model.form)
        if not form_class:
            raise MethodNotAllowed

        fields = model.fields_with_permission(request, 'create')
        instance = model.instance(fields=fields)

        data, files = request.data_and_files()
        form = form_class(request, data=data, files=files)
        if form.is_valid():
            with model.session(request) as session:
                try:
                    instance = model.create_model(request,
                                                  instance,
                                                  form.cleaned_data,
                                                  session=session)
                except Exception as exc:
                    request.logger.exception('Could not create model')
                    form.add_error_message(str(exc))
                    data = form.tojson()
                else:
                    data = model.tojson(request, instance)
                    request.response.status_code = 201
        else:
            data = form.tojson()

        return self.json_response(request, data)

    # Additional Routes
    @route('<id>',
           position=100,
           method=('get', 'post', 'put', 'delete', 'head', 'options'))
    def read_update_delete(self, request):
        if request.method == 'OPTIONS':
            request.app.fire('on_preflight', request)
            return request.response

        model = self.model
        with model.session(request) as session:
            if request.method in GET_HEAD:
                instance = self.get_instance(request, session=session,
                                             check_permission='read')
                data = model.tojson(request, instance)

            elif request.method in POST_PUT:
                form_class = get_form_class(request, model.updateform)

                if not form_class:
                    raise MethodNotAllowed

                instance = self.get_instance(request, session=session,
                                             check_permission='update')

                data, files = request.data_and_files()
                form = form_class(request, data=data, files=files,
                                  previous_state=instance)
                if form.is_valid(exclude_missing=True):
                    instance = model.update_model(request,
                                                  instance,
                                                  form.cleaned_data,
                                                  session=session)
                    data = model.tojson(request, instance)
                else:
                    data = form.tojson()

            elif request.method == 'DELETE':
                instance = self.get_instance(request, session=session,
                                             check_permission='delete')
                model.delete_model(request, instance, session=session)
                request.response.status_code = 204
                return request.response

            else:
                raise MethodNotAllowed

            return self.json_response(request, data)