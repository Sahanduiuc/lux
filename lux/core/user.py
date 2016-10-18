from importlib import import_module

from pulsar.utils.structures import AttributeDictionary
from pulsar.utils.pep import to_bytes


UNUSABLE_PASSWORD = '!'


class UserMixin:
    '''Mixin for a User model
    '''
    email = None

    def is_superuser(self):
        return False

    def is_authenticated(self):
        '''Return ``True`` if the user is is_authenticated
        '''
        return True

    def is_active(self):
        return False

    def is_anonymous(self):
        return False

    def get_id(self):
        raise NotImplementedError

    def get_oauths(self):
        '''Return a dictionary of oauths account'''
        return {}

    def set_oauth(self, name, data):
        raise NotImplementedError

    def remove_oauth(self, name):
        '''Remove a connected oauth account.
        Return ``True`` if successfully removed
        '''
        raise NotImplementedError

    def todict(self):
        '''Return a dictionary with information about the user'''

    def email_user(self, app, subject, body, sender=None):
        backend = app.email_backend
        backend.send_mail(sender, self.email, subject, body)

    @classmethod
    def get_by_username(cls, username):
        '''Retrieve a user from username
        '''
        raise NotImplementedError

    @classmethod
    def get_by_email(cls, email):
        raise NotImplementedError

    @classmethod
    def get_by_oauth(cls, name, identifier):
        '''Retrieve a user from OAuth ``name`` with ``identifier``
        '''
        raise NotImplementedError


class Anonymous(AttributeDictionary, UserMixin):

    def __repr__(self):
        return self.__class__.__name__.lower()

    def is_authenticated(self):
        return False

    def is_anonymous(self):
        return True

    def get_id(self):
        return 0


class PasswordMixin:
    '''Adds password encryption to an authentication backend.

    It has two basic methods,
    :meth:`.encrypt` and :meth:`.decrypt`.
    '''
    def on_config(self, app):
        cfg = app.config
        self.encoding = cfg['ENCODING']
        self.secret_key = cfg['PASSWORD_SECRET_KEY'].encode()
        ckwargs = cfg['CRYPT_ALGORITHM']
        if not isinstance(ckwargs, dict):
            ckwargs = dict(module=ckwargs)
        self.ckwargs = ckwargs.copy()
        self.crypt_module = import_module(self.ckwargs.pop('module'))

    def encrypt(self, string_or_bytes):
        '''Encrypt ``string_or_bytes`` using the algorithm specified
        in the :setting:`CRYPT_ALGORITHM` setting.

        Return an encrypted string
        '''
        b = to_bytes(string_or_bytes, self.encoding)
        p = self.crypt_module.encrypt(b, self.secret_key, **self.ckwargs)
        return p.decode(self.encoding)

    def crypt_verify(self, encrypted, raw):
        '''Verify if the ``raw`` string match the ``encrypted`` string
        '''
        return self.crypt_module.verify(to_bytes(encrypted),
                                        to_bytes(raw),
                                        self.secret_key,
                                        **self.ckwargs)

    def decrypt(self, string_or_bytes):
        b = to_bytes(string_or_bytes, self.encoding)
        p = self.crypt_module.decrypt(b, self.secret_key)
        return p.decode(self.encoding)

    def password(self, raw_password=None):
        '''Return an encrypted password
        '''
        if raw_password:
            return self.encrypt(raw_password)
        else:
            return UNUSABLE_PASSWORD


class User(AttributeDictionary, UserMixin):
    '''A dictionary-based user

    Used by the :class:`.ApiSessionBackend`
    '''
    def is_superuser(self):
        return self.superuser

    def is_active(self):
        return True

    def __str__(self):
        return self.username or self.email or 'user'

    def todict(self):
        return self.__dict__.copy()
