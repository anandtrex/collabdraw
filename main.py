import logging
import os

import tornado.httpserver
import tornado.ioloop
import tornado.web

from websockethandler import RealtimeHandler
from uploadhandler import UploadHandler

logger = logging.getLogger('websocket')
logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.DEBUG)

class Application(tornado.web.Application):
  def __init__(self):
    handlers = [
      (r'/realtime/', RealtimeHandler),
      (r'/resource/(.*)', tornado.web.StaticFileHandler,
        dict(path=os.path.join(os.path.dirname(__file__), "resource"))),
      (r'/upload', UploadHandler),
      (r'/(.*)', tornado.web.StaticFileHandler, dict(path=os.path.dirname(__file__))),
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
  http_server.listen(8888)
  tornado.ioloop.IOLoop.instance().start()
