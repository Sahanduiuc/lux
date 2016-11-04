"""Multi application extension.
"""
from lux.core import LuxExtension, Parameter
from lux.utils.countries import common_timezones, country_names

from .rest import ApplicationCRUD
from .auth import AuthBackend
from .multi import MultiBackend
from .plugins import has_plugin, is_html
from .info import Info, api_info_routes


__all__ = ['AuthBackend', 'MultiBackend', 'has_plugin', 'is_html']


class Extension(LuxExtension):
    _config = (
        Parameter('MASTER_APPLICATION_ID', None,
                  "Unique ID of the MASTER application. The master application"
                  " is assumed by default when no header or JWT is available"),
        Parameter('API_INFO_URL', 'info',
                  "Url for information routes")
    )

    def on_config(self, app):
        self.require(app, 'lux.extensions.auth')

    def api_sections(self, app):
        yield ApplicationCRUD()
        if app.config['API_INFO_URL']:
            yield Info(app.config['API_INFO_URL'])
            routes = api_info_routes(app)
            routes['timezones'] = lambda r: common_timezones
            routes['countries'] = lambda r: country_names

    def on_query(self, app, query):
        if query.model.field('application_id'):
            app_id = self._app_id(query.request)
            if not app_id:
                app.logger.error('Application model query without app ID')
            else:
                query.filter(application_id=app_id)

    def on_before_flush(self, app, session):
        app_id = self._app_id(session.request)
        for instance in session.new:
            if 'application_id' in instance._sa_class_manager:
                if not app_id:
                    app_id = getattr(instance, 'application_id', None)
                    model = instance.__class__.__name__.lower()
                    if not app_id:
                        app.logger.error(
                            'creating %s %s without app ID', instance, model)
                    else:
                        app.logger.warning(
                            'creating %s %s for app %s',
                            instance, model, app_id
                        )
                else:
                    instance.application_id = app_id

    def _app_id(self, request):
        if request:
            user = request.cache.user
            return user.application_id if user else None
