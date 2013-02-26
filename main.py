import logging

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.template as template
from tornado.options import options

from websockethandler import RealtimeHandler
from uploadhandler import UploadHandler
import config

logger = logging.getLogger('websocket')
logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.DEBUG)

class IndexHandler(tornado.web.RequestHandler):
  def get(self):
    loader = template.Loader(config.ROOT_DIR)
    return_str = loader.load("index.html").generate(app_ip_address=config.APP_IP_ADDRESS,
                                       app_port=config.PUBLIC_LISTEN_PORT)
    self.finish(return_str)

class Application(tornado.web.Application):
  def __init__(self):
    handlers = [
      (r'/realtime/', RealtimeHandler),
      (r'/resource/(.*)', tornado.web.StaticFileHandler,
        dict(path=config.RESOURCE_DIR)),
      (r'/upload', UploadHandler),
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
    )

    tornado.web.Application.__init__(self, handlers, **settings)

if __name__ == "__main__":
  http_server = tornado.httpserver.HTTPServer(Application())
  logger.info("Listening on port %s" % config.APP_PORT)
  http_server.listen(config.APP_PORT)
  tornado.ioloop.IOLoop.instance().start()
