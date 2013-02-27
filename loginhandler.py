import logging
import tornado.web

class LoginHandler(tornado.web.RequestHandler):
  def get(self):
      self.render("login.html")

  def post(self):
      self.logger = logging.getLogger('websocket')
      user_name = self.get_argument("username")
      self.logger.info("Logging in user %s", user_name)
      self.set_secure_cookie("user", user_name)
      self.finish('{"result": "success"}')
