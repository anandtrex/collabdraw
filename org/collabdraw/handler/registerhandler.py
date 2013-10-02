import logging
import os
import config

import tornado.web

from ..dbclient.dbclientfactory import DbClientFactory
from ..tools.tools import hash_password


class RegisterHandler(tornado.web.RequestHandler):
    def initialize(self):
        self.logger = logging.getLogger('websocket')
        self.db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)

    def get(self):
        self.render(os.path.join(config.HTML_ROOT, "register.html"))

    def post(self):
        login_id = self.get_argument("loginId")
        login_password = self.get_argument("loginPassword")
        redis_key = "users:%s" % login_id
        if self.db_client.get(redis_key):
            self.finish('{"result": "conflict"}')
            return
        self.db_client.set(redis_key, hash_password(login_password))
        self.logger.info("Logging in user %s", login_id)
        self.set_secure_cookie("loginId", login_id)
        self.finish('{"result": "success"}')
