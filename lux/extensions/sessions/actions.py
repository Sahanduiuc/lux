"""Authentication actions

This is a self contained module implementing the most common authentication
actions on a web site.

* login
* logout
* signup
* reset password
"""
from pulsar.apps.wsgi import Json
from pulsar import Http404, MethodNotAllowed

from lux.core import json_message, AuthenticationError
from lux.forms import Form, ValidationError, get_form_class


def signup(request):
    """Signup a new user
    """
    form = _auth_form(request, 'signup')

    if form.is_valid():
        auth_backend = request.cache.auth_backend
        try:
            data = auth_backend.signup(request, **form.cleaned_data)
            request.response.status_code = 201
        except (AuthenticationError, ValidationError) as exc:
            form.add_error_message(str(exc))
            data = form.tojson()
    else:
        data = form.tojson()

    return Json(data).http_response(request)


def logout(request):
    '''Logout a user
    '''
    form = Form(request, data=request.body_data() or {})

    if form.is_valid():
        request.cache.auth_backend.logout(request)
        return Json({'success': True}).http_response(request)
    else:
        return Json(form.tojson()).http_response(request)


def reset_password_request(request):
    """Request a reset password code/email
    """
    form = _auth_form(request, 'password-recovery')
    if form.is_valid():
        auth = request.cache.auth_backend
        email = form.cleaned_data['email']
        try:
            data = auth.password_recovery(request, email=email)
        except AuthenticationError as e:
            data = json_message(request, str(e), error=True)
    else:
        data = form.tojson()
    return Json(data).http_response(request)


def reset_password(request, key):
    """Reset password
    """
    form = _auth_form(request, 'reset-password')
    if form.is_valid():
        auth = request.cache.auth_backend
        password = form.cleaned_data['password']
        try:
            data = auth.set_password(request, password, auth_key=key)
        except AuthenticationError as e:
            data = json_message(request, str(e), error=True)
    else:
        data = form.tojson()
    return Json(data).http_response(request)


def _auth_form(request, form):
    form = get_form_class(request, form)
    if not form:
        raise Http404

    request.set_response_content_type(['application/json'])
    user = request.cache.user
    if user.is_authenticated():
        raise MethodNotAllowed

    return form(request, data=request.body_data())