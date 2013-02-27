import logging
import uuid

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.template as template

from websockethandler import RealtimeHandler
from uploadhandler import UploadHandler
from loginhandler import LoginHandler
from registerhandler import RegisterHandler
import config

logger = logging.getLogger('websocket')
logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.DEBUG)

class IndexHandler(tornado.web.RequestHandler):
    def get_current_user(self):
        return self.get_secure_cookie("user")

    @tornado.web.authenticated
    def get(self):
        loader = template.Loader(config.ROOT_DIR)
        return_str = loader.load("index.html").generate(app_ip_address=config.APP_IP_ADDRESS, app_port=config.PUBLIC_LISTEN_PORT)
        self.finish(return_str)

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
                (r'/realtime/', RealtimeHandler),
                (r'/resource/(.*)', tornado.web.StaticFileHandler,
                    dict(path=config.RESOURCE_DIR)),
                (r'/upload.html', UploadHandler),
                (r'/login.html', LoginHandler),
                (r'/register.html', RegisterHandler),
                (r'/index.html', IndexHandler),
                (r'/', IndexHandler),
                (r'/(.*)', tornado.web.StaticFileHandler,
                    dict(path=config.ROOT_DIR)),
                ]

        self.LISTENERS = {}
        self.LISTENER_THREADS = {}

        settings = dict(
            auto_reload = True,
            gzip = True,
            login_url = "login.html",
            cookie_secret = str(uuid.uuid4()),
        )

        tornado.web.Application.__init__(self, handlers, **settings)

if __name__ == "__main__":
    http_server = tornado.httpserver.HTTPServer(Application())
    logger.info("Listening on port %s" % config.APP_PORT)
    http_server.listen(config.APP_PORT)
    tornado.ioloop.IOLoop.instance().start()
