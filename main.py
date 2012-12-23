import logging
import json
import os
import threading
from zlib import compress
from urllib.parse import quote
from base64 import b64encode

import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
import redis

LISTENERS = {}

logger = logging.getLogger('websocket')
logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.DEBUG)

def redis_listener(room_name):
    logger.info("Starting listener thread for room %s" % room_name)
    rr = redis.Redis(host='localhost', db=2)
    r = rr.pubsub()
    r.subscribe(room_name)
    for message in r.listen():
      for listener in LISTENERS.get(room_name, []):
        logger.debug("Sending message to room %s" % room_name)
        listener.send_message(message['data'])

class RealtimeHandler(tornado.websocket.WebSocketHandler):
    room_name = ''
    paths = []
    redis_client = None

    def open(self):
        logger.info("Open connection")
        self.send_message(json.dumps({'event': 'ready'}))
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
          logger.info("Initializing with room name %s" % self.room_name)

          if data['room'] not in LISTENERS:
            threading.Thread(target=redis_listener, args=(data['room'],)).start()

          self.leave_room(self.room_name)
          self.room_name = data['room']
          self.join_room(self.room_name)

          if not self.paths:
            key = "%s" % self.room_name
            p = self.redis_client.get(key)
            if p:
              self.paths = json.loads(p.decode('utf-8').replace("'",'"'))
              self.send_message(json.dumps({'event':'draw-many', 'data': {'datas':self.paths}}))
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
      self.leave_room(self.room_name)

    def broadcast_message(self, message):
      self.leave_room(self.room_name, False)
      self.redis_client.publish(self.room_name, message)
      self.join_room(self.room_name)

    def send_message(self, message):
      if type(message) == type(b''):
        logger.info("Decoding binary string")
        message = message.decode('utf-8')
      elif type(message) != type(''):
        logger.info("Converting message from %s to %s" % (type(message),
                                                          type('')))
        message = str(message)
      message = b64encode(compress(bytes(quote(message), 'utf-8'), 9))
      self.write_message(message)

    def leave_room(self, room_name, clear_paths = True):
      logger.info("Leaving room %s" % room_name)
      if self in LISTENERS.get(room_name, []):
        LISTENERS[room_name].remove(self)
      if clear_paths:
        self.paths = []

    def join_room(self, room_name):
      logger.info("Joining room %s" % room_name)
      LISTENERS.setdefault(room_name, []).append(self)

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
