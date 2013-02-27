import logging
import tornado.web

class RegisterHandler(tornado.web.RequestHandler):
  def get(self):
      self.render("register.html")

  def post(self):
      self.logger = logging.getLogger('websocket')
      self.set_secure_cookie("user", self.get_argument("username"))
      self.redirect("index.html")
