from datetime import datetime
from enum import Enum

from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey

from lux import forms
from lux.core import LuxExtension
from lux.extensions import odm
from lux.extensions.rest import RelationshipField, UniqueField
from lux.extensions.auth.views import PermissionCRUD, GroupCRUD

from odm.types import ChoiceType

from tests.config import *  # noqa

EXTENSIONS = ['lux.extensions.base',
              'lux.extensions.odm',
              'lux.extensions.rest',
              'lux.extensions.auth']

AUTHENTICATION_BACKENDS = ['lux.extensions.auth.TokenBackend']
CORS_ALLOWED_METHODS = 'GET, POST, DELETE'
API_URL = ''


class TestEnum(Enum):
    opt1 = '1'
    opt2 = '2'


class Extension(LuxExtension):

    def api_sections(self, app):
        return [CRUDTask(),
                CRUDPerson(),
                UserCRUD(),
                PermissionCRUD(),
                GroupCRUD()]


Model = odm.model_base('odmtest')


# ODM Models
class Person(Model):
    id = Column(Integer, primary_key=True)
    username = Column(String(250), unique=True)
    name = Column(String(250))


class Task(Model):
    id = Column(Integer, primary_key=True)
    subject = Column(String(250))
    done = Column(Boolean, default=False)
    created = Column(DateTime, default=datetime.utcnow)
    enum_field = Column(ChoiceType(TestEnum), default=TestEnum.opt1)
    desc = Column(String(250))

    @odm.declared_attr
    def assigned_id(cls):
        return Column(Integer, ForeignKey('person.id'))

    @odm.declared_attr
    def assigned(cls):
        return relationship('Person', backref='tasks')


# REST models
def person_model():
    return odm.RestModel('person', PersonForm, PersonForm, url='people')


def task_model():
    '''Rest model for the task
    '''
    model = odm.RestModel('task', TaskForm, TaskForm)
    model.add_related_column('assigned', person_model, 'assigned_id')
    return model


class TaskForm(forms.Form):
    subject = forms.CharField(required=True)
    done = forms.BooleanField(default=False)
    assigned = RelationshipField('persons',
                                 label='assigned',
                                 required=False)
    enum_field = forms.ChoiceField(options=TestEnum, default=TestEnum.opt1)
    desc = forms.CharField(required=False)


class PersonForm(forms.Form):
    model = 'persons'
    username = forms.CharField(validator=UniqueField())
    name = forms.CharField(required=True)


class UserForm(forms.Form):
    username = forms.CharField()
    email = forms.EmailField()
    first_name = forms.CharField(required=False)
    last_name = forms.CharField(required=False)
    superuser = forms.BooleanField()
    active = forms.BooleanField()


class CRUDTask(odm.CRUD):
    model = task_model()


class CRUDPerson(odm.CRUD):
    model = person_model()


class UserCRUD(odm.CRUD):
    '''Test custom CRUD view and RestModel
    '''
    model = odm.RestModel('user',
                          UserForm,
                          UserForm,
                          columns=('username', 'active', 'superuser'),
                          exclude=('password', 'permissions'))

    def tojson(self, request, o, exclude=None, **kw):
        return self.model.tojson(request, o, exclude=('superuser',), **kw)
