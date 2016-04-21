from lux.utils import test

from tests.auth.user import UserMixin
from tests.auth.password import PasswordMixin
from tests.auth.odm import OdmMixin
from tests.auth.permissions import PermissionsMixin
from tests.auth.commands import AuthCommands


class AuthUtils:

    # INTERNALS
    async def _create_objective(self, token, subject='My objective', **data):
        data['subject'] = subject
        request = await self.client.post(
            '/objectives', body=data, token=token,
            content_type='application/json')
        response = request.response
        self.assertEqual(response.status_code, 201)
        data = self.json(response)
        self.assertIsInstance(data, dict)
        self.assertTrue('id' in data)
        self.assertEqual(data['subject'], subject)
        self.assertTrue('created' in data)
        return data

    async def _new_credentials(self):
        username = test.randomname()
        password = test.randomname()

        credentials = {
            'username': username,
            'password': password
        }

        email = '%s@%s.com' % (username, test.randomname())
        user = await self.create_superuser(username, email, password)
        self.assertEqual(user.username, username)
        self.assertNotEqual(user.password, password)
        return credentials

    async def _token(self, credentials=None):
        '''Return a token for a new superuser
        '''
        if credentials is None:
            credentials = await self._new_credentials()

        # Get new token
        request = await self.client.post('/authorizations',
                                         content_type='application/json',
                                         body=credentials)
        user = request.cache.user
        self.assertFalse(user.is_authenticated())
        data = self.json(request.response, 201)
        self.assertTrue('token' in data)
        return data['token']


class TestSqlite(test.AppTestCase,
                 AuthCommands,
                 UserMixin,
                 OdmMixin,
                 PasswordMixin,
                 PermissionsMixin,
                 AuthUtils):
    config_file = 'tests.auth'
    config_params = {'DATASTORE': 'sqlite://'}

    su_credentials = {'username': 'bigpippo',
                      'password': 'pluto'}
    user_credentials = {'username': 'littlepippo',
                        'password': 'charon'}

    @classmethod
    def populatedb(cls):
        backend = cls.app.auth_backend
        odm = cls.app.odm()
        backend.create_superuser(cls.app.wsgi_request(),
                                 email='bigpippo@pluto.com',
                                 first_name='Big Pippo',
                                 **cls.su_credentials)
        user = backend.create_user(cls.app.wsgi_request(),
                                   email='littlepippo@charon.com',
                                   first_name='Little Pippo',
                                   active=True,
                                   **cls.user_credentials)

        with odm.begin() as session:
            group = odm.group(name='permission_test')
            secret_group = odm.group(name='secret-readers')
            group.users.append(user)
            session.add(group)
            session.add(secret_group)
            permission = odm.permission(
                name='objective subject',
                description='Can use objective:subject',
                policy={
                    'resource': 'objective:subject',
                    'action': '*'
                })
            group.permissions.append(permission)
            #
            # Create the read permission for secret resource
            spermission = odm.permission(
                name='secret-read',
                description='Can read secret resources',
                policy={
                    'resource': 'secret',
                    'effect': 'allow'
                })
            secret_group.permissions.append(spermission)