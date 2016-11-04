import os

from tests.config import redis_cache_server

EXTENSIONS = (
    'lux.extensions.base',
    'lux.extensions.rest',
    'lux.extensions.content',
    'lux.extensions.admin',
    'lux.extensions.auth',
    'lux.extensions.odm'
)


APP_NAME = COPYRIGHT = HTML_TITLE = 'website.com'

SESSION_BACKEND = redis_cache_server
EMAIL_DEFAULT_FROM = 'admin@lux.com'
EMAIL_BACKEND = 'lux.core.mail.LocalMemory'
SESSION_COOKIE_NAME = 'test-website'

DATASTORE = 'postgresql+green://lux:luxtest@127.0.0.1:5432/luxtests'


SERVE_STATIC_FILES = os.path.join(os.path.dirname(__file__), 'media')
CONTENT_REPO = os.path.dirname(__file__)
CONTENT_LOCATION = 'content'
CONTENT_GROUPS = {
    "articles": {
        "path": "articles",
        "body_template": "home.html",
        "meta": {
            "priority": 1
        }
    },
    "site": {
        "path": "*",
        "body_template": "home.html",
        "meta": {
            "priority": 1,
            "image": "/media/lux/see.jpg"
        }
    }
}

DEFAULT_POLICY = [
    {
        "resource": "contents:*",
        "action": "read"
    }
]
