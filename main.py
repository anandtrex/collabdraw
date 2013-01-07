import logging
import os

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.template as template

from websockethandler import RealtimeHandler
from uploadhandler import UploadHandler
import config

logger = logging.getLogger('websocket')
logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.DEBUG)

class IndexHandler(tornado.web.RequestHandler):
  def get(self):
    loader = template.Loader(os.path.dirname(__file__))
    return_str = loader.load("index.html").generate(app_ip_address=config.APP_IP_ADDRESS,
                                       app_port=config.APP_PORT)
    self.finish(return_str)

class Application(tornado.web.Application):
  def __init__(self):
    handlers = [
      (r'/realtime/', RealtimeHandler),
      (r'/resource/(.*)', tornado.web.StaticFileHandler,
        dict(path=os.path.join(os.path.dirname(__file__), "resource"))),
      (r'/upload', UploadHandler),
      (r'/index.html', IndexHandler),
      (r'/(.*)', tornado.web.StaticFileHandler,
        dict(path=os.path.dirname(__file__))),
    ]

    self.LISTENERS = {}
    self.LISTENER_THREADS = {}

    settings = dict(
      auto_reload = True,
      gzip = True,
    )

    tornado.web.Application.__init__(self, handlers, **settings)

if __name__ == "__main__":
  http_server = tornado.httpserver.HTTPServer(Application())
  http_server.listen(config.APP_PORT)
  tornado.ioloop.IOLoop.instance().start()
