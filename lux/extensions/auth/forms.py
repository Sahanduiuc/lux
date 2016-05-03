import json

from lux import forms
from lux.forms import Layout, Fieldset, Submit, formreg
from lux.extensions.odm import RestModel
from lux.extensions.rest import (AuthenticationError, RestColumn,
                                 RelationshipField, UniqueField)
from lux.extensions.rest.views.forms import PasswordForm
from lux.extensions.rest.policy import validate_policy
from lux.utils.auth import ensure_authenticated


full_name = RestColumn(
    'full_name',
    displayName='name',
    field=('first_name', 'last_name', 'username', 'email')
)


class UserModel(RestModel):

    @classmethod
    def create(cls):
        return cls(
            'user',
            'create-user',
            'user',
            id_field='username',
            repr_field='name',
            exclude=('password',),
            columns=(
                full_name,
                RestColumn('groups', model='groups')
            )
        )

    def create_model(self, request, data, session=None):
        '''Override create model so that it calls the backend method
        '''
        if session:
            data['odm_session'] = session
        return request.cache.auth_backend.create_user(request, **data)


class TokenModel(RestModel):
    """REST model for tokens
    """
    @classmethod
    def create(cls, user_model):
        TokenForm = forms.create_form(
            'TokenForm',
            forms.TextField('description', required=True, maxlength=256))
        model = cls('token', TokenForm)
        model.add_related_column('user', user_model, 'user_id')
        return model

    def create_model(self, request, data, session=None):
        user = ensure_authenticated(request)
        auth = request.cache.auth_backend
        data['session'] = False
        return auth.create_token(request, user, **data)


class PermissionForm(forms.Form):
    model = 'permissions'
    id = forms.HiddenField(required=False)
    name = forms.CharField()
    description = forms.TextField()
    policy = forms.JsonField(text_edit=json.dumps({'mode': 'json'}))

    def clean(self):
        policy = self.cleaned_data['policy']
        self.cleaned_data['policy'] = validate_policy(policy)


class GroupForm(forms.Form):
    model = 'groups'
    id = forms.HiddenField(required=False)
    name = forms.SlugField(validator=UniqueField())
    permissions = RelationshipField('permissions',
                                    multiple=True,
                                    required=False)


class UserForm(forms.Form):
    id = forms.HiddenField(required=False)
    username = forms.SlugField()
    email = forms.EmailField(required=False)
    first_name = forms.CharField(required=False)
    last_name = forms.CharField(required=False)
    superuser = forms.BooleanField()
    active = forms.BooleanField()
    joined = forms.DateTimeField(readonly=True, required=False)
    groups = RelationshipField('groups', multiple=True, required=False)


class ChangePasswordForm(PasswordForm):
    old_password = forms.PasswordField()

    def clean_old_password(self, value):
        request = self.request
        user = request.cache.user
        auth_backend = request.cache.auth_backend
        try:
            if user.is_authenticated():
                auth_backend.authenticate(request, user=user, password=value)
            else:
                raise AuthenticationError('not authenticated')
        except AuthenticationError as exc:
            raise forms.ValidationError(str(exc))
        return value


class RegistrationForm(forms.Form):
    expiry = forms.DateTimeField(required=False)


class NewTokenForm(forms.Form):
    """Form to create tokens for the current user
    """
    description = forms.TextField(minlength=2, maxlength=256)

#
# HTML FORM REGISTRATION
formreg['create-group'] = Layout(
    GroupForm,
    Fieldset(all=True),
    Submit('Create new group')
)


formreg['group'] = Layout(
    GroupForm,
    Fieldset(all=True),
    Submit('Update group')
)


formreg['create-permission'] = Layout(
    PermissionForm,
    Fieldset(all=True),
    Submit('Create new permissions')
)


formreg['permission'] = Layout(
    PermissionForm,
    Fieldset(all=True),
    Submit('Update permissions')
)
