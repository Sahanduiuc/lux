from pulsar.api import BadRequest, Http401, MethodNotAllowed


def ensure_service_user(request, errorCls=None):
    # user must be anonymous
    if not request.cache.user.is_anonymous():
        raise (errorCls or BadRequest)
    # the service user must be authenticated
    if not request.cache.user.is_authenticated():
        raise Http401('Token')
    return request.cache.token
