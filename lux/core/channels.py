import json
from collections import namedtuple

from pulsar import ProtocolError
from pulsar.utils.string import to_string
from pulsar.apps.data import create_store, Channels
from pulsar.utils.importer import module_attribute

from .component import AppComponent


regex_callbacks = namedtuple('regex_callbacks', 'regex callbacks')


class LuxChannels(AppComponent):
    """Manage channels for publish/subscribe
    """
    @classmethod
    def create(cls, app):
        protocol = module_attribute(app.config['PUBSUB_PROTOCOL'])()
        addr = app.config['PUBSUB_STORE']
        if not addr or not app.green_pool:
            return
        store = create_store(addr)
        return cls(app, store.pubsub(protocol=protocol))

    def __init__(self, app, pubsub):
        super().__init__(app)
        self.channels = Channels(pubsub, namespace=app.config['PUBSUB_PREFIX'])

    def register(self, channel_name, event, callback):
        return self.app.green_pool.wait(
            self.channels.register(channel_name, event, callback)
        )

    def unregister(self, channel_name, event, callback):
        return self.app.green_pool.wait(
            self.channels.unregister(channel_name, event, callback)
        )

    def publish(self, channel_name, event, data=None, user=None):
        if user:
            if not data:
                data = {}
            data['user'] = user
        return self.app.green_pool.wait(
            self.channels.publish(channel_name, event, data)
        )

    # INTERNALS
    def middleware(self, environ, start_response):
        """Add a middleeware when running with greenlets.

        This middleware register the app.reload callback to
        the server.reload event
        """
        app = self.app
        self.register('server', 'reload', app.reload)


class Json:

    def encode(self, msg):
        return json.dumps(msg)

    def decode(self, msg):
        try:
            return json.loads(to_string(msg))
        except Exception as exc:
            raise ProtocolError('Invalid JSON') from exc
