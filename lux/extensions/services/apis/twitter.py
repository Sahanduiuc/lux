import re
import time
from datetime import datetime

from lux.extensions.services import API, api_function, OAuth2, oauth2


class Twitter(API):
    TWITTER_CHECK_AUTH = 'https://twitter.com/account/verify_credentials.json'

    def user_data(self, access_token):
        request = self.oauth_request(access_token, self.TWITTER_CHECK_AUTH)
        data = self.fetch_response(request)
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            data = None
        return data, access_token.key, access_token.secret

    def get_user_details(self, response):
        name = response['name']
        return {'uid': response['id'],
                'email': '',
                'username': response['screen_name'],
                'fullname': name,
                'first_name': name,
                'description': response.get('description', ''),
                'location': response.get('location', ''),
                'profile_image_url': response.get('profile_image_url', None),
                'url': response.get('url', None),
                'last_name': ''}

    def authenticated_api(self, key, secret):
        auth = tweepy.OAuthHandler(*self.tokens)
        auth.set_access_token(key, secret)
        return tweepy.API(auth)


class Tweet(object):
    """Store the tweet info
    """
    id = None
    username = None
    url = None
    user_avatar_url = None
    tweet_url = None
    profile_url = None
    html_text = None
    retweeted = None
    retweet_user = None
    date = None

    def __init__(self, plain_text):
        """convert plain text into html text with http, user and hashtag links
        """
        re_http = re.compile(r"(http://[^ ]+)")
        self.html_text = re_http.sub(r'\1', plain_text)

        re_https = re.compile(r"(https://[^ ]+)")
        self.html_text = re_https.sub(r'\1', self.html_text)

        re_user = re.compile(r'@[0-9a-zA-Z+_]*', re.IGNORECASE)
        for iterator in re_user.finditer(self.html_text):
            a_username = iterator.group(0)
            username = a_username.replace('@', '')
            link = '' + a_username + ''
            self.html_text = self.html_text.replace(a_username, link)

        re_hash = re.compile(r'#[0-9a-zA-Z+_]*', re.IGNORECASE)
        for iterator in re_hash.finditer(self.html_text):
            h_tag = iterator.group(0)
            link_tag = h_tag.replace('#', '%23')
            link = '' + h_tag + ''
            self.html_text = self.html_text.replace(h_tag + " ", link + " ")
            #check last tag
            offset = len(self.html_text) - len(h_tag)
            index = self.html_text.find(h_tag, offset)
            if index >= 0:
                self.html_text = self.html_text[:index] + " " + link

    def set_profile_url(self):
        """Create the url profile
        """
        if self.retweeted:
            self.profile_url = "http://www.twitter.com/%s" % self.retweet_user
        else:
            self.profile_url = "http://www.twitter.com/%s" % self.username

    def set_tweet_url(self):
        """Create the url of the tweet
        """
        self.tweet_url = ("http://www.twitter.com/%s/status/%s"
                          % (self.username, self.id))
