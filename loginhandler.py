import logging

import tornado.web
import redis

import config
from tools import hash_password

class LoginHandler(tornado.web.RequestHandler):
  def get(self):
      self.render("login.html")

  def post(self):
      self.redis_client = redis.Redis(host=config.REDIS_IP_ADDRESS, db=2)
      self.logger = logging.getLogger('websocket')
      login_id = self.get_argument("loginId")
      login_password = self.get_argument("loginPassword")
      redis_key = "users:%s" % login_id
      db_password = self.redis_client.get(redis_key)
      db_password = db_password.decode('utf-8')
      if db_password != hash_password(login_password):
        self.logger.debug("db_password was %s but login_password was %s" % (db_password,
            login_password))
        self.finish('{"result": "failure"}')
        return
      self.logger.info("Logging in user %s", login_id)
      self.set_secure_cookie("loginId", login_id)
      self.finish('{"result": "success"}')
