import logging
import os
import config

import tornado.web

from ..dbclient.dbclientfactory import DbClientFactory
from ..tools.tools import hash_password


class LoginHandler(tornado.web.RequestHandler):
    def initialize(self):
        self.db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)
        self.logger = logging.getLogger('websocket')

    def get(self):
        self.render(os.path.join(config.HTML_ROOT, "login.html"))

    def post(self):
        login_id = self.get_argument("loginId")
        login_password = self.get_argument("loginPassword")
        redis_key = "users:%s" % login_id
        db_password = self.db_client.get(redis_key)
        if db_password:
            db_password = db_password.decode('utf-8')
            if db_password != hash_password(login_password):
                self.logger.debug("db_password was %s but login_password was %s" % (db_password,
                                                                                    login_password))
                self.finish('{"result": "failure"}')
                return
            self.logger.info("Logging in user %s", login_id)
            self.set_secure_cookie("loginId", login_id)
            self.finish('{"result": "success"}')
