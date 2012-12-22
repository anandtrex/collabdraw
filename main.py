import logging
import json
import os
import threading

import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
import redis

LISTENERS = []

logger = logging.getLogger('websocket')
logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.DEBUG)

def redis_listener():
    rr = redis.Redis(host='localhost', db=2)
    r = rr.pubsub()
    r.subscribe('one')
    for message in r.listen():
      for listener in LISTENERS:
        listener.write_message(message['data'])

class RealtimeHandler(tornado.websocket.WebSocketHandler):
    room_name = ''
    redis_client = None

    def open(self):
        LISTENERS.append(self)
        logger.info("Open connection")
        self.write_message(json.dumps({'event': 'ready'}))
        self.paths = []
        self.redis_client = redis.Redis(host='localhost', db=2)

    def on_message(self, message):
        m = json.loads(message)
        event = m.get('event', '').strip()
        data = m.get('data', {})

        logger.debug("Processing event %s" % event)
        if not event:
          logger.error("No event specified")
          return

        key = ''

        if event == "init":
          self.room_name = data['room']
          logger.info("Initializing with room name %s" % self.room_name)
          if not self.paths:
            key = "%s" % self.room_name
            p = self.redis_client.get(key)
            if p:
              self.paths = json.loads(p.decode('utf-8').replace("'",'"'))
              self.write_message(json.dumps({'event':'draw-many', 'data': {'datas':self.paths}}))
            else:
              logger.info("No data in database")

        if event == "draw-click":
          singlePath = data['singlePath']
          if not self.paths:
            logger.debug("None")
            self.paths = []
            
          self.paths.extend(singlePath)
          m = json.dumps({'event': 'draw', 'data': {'singlePath': singlePath}})
          self.broadcast_message(m)
          key = "%s" % self.room_name
          self.redis_client.set(key, self.paths)

        if event == "clear":
          m = json.dumps({'event': 'clear'})
          self.broadcast_message(m)
          key = "%s" % self.room_name
          self.redis_client.delete(key)

    def on_close(self):
        LISTENERS.remove(self)

    def broadcast_message(self, message):
        LISTENERS.remove(self)
        self.redis_client.publish(self.room_name, message)
        LISTENERS.append(self)


settings = {
    'auto_reload': True,
    'gzip': True,
}

application = tornado.web.Application([
    (r'/realtime/', RealtimeHandler),
    (r'/resource/(.*)', tornado.web.StaticFileHandler,
      dict(path=os.path.join(os.path.dirname(__file__), "resource"))),
    (r'/(.*)', tornado.web.StaticFileHandler, dict(path=os.path.dirname(__file__))),
], **settings)

t = threading.Thread(target=redis_listener)
t.start()
http_server = tornado.httpserver.HTTPServer(application)
http_server.listen(8888)
tornado.ioloop.IOLoop.instance().start()


'''
socket.on('init', function(data)
socket.on('get-image', function(data)
socket.on('draw-click', function(input)
socket.on('clear', function(data)
socket.on('save-canvas', function(data)
socket.on('getCanvasList', function(data)
socket.on('video', function(data)
'''
