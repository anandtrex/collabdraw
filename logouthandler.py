import logging

import tornado.web

class LogoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.redirect("./login.html")

    def post(self):
        self.logout()
    
    def logout(self):
        self.logger = logging.getLogger('websocket')
        loginId = self.get_secure_cookie("loginId")
        self.logger.info("Logging out %s" % loginId)
        self.set_secure_cookie("loginId", "")
