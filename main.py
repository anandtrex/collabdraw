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
        message_data = json.loads(message['data'].decode('utf-8').replace("'",'"'))
        m = json.dumps({'event': 'draw', 'data': {'singlePath': message_data}})
        listener.write_message(m)

class RealtimeHandler(tornado.websocket.WebSocketHandler):
    room_name = ''

    def open(self):
        LISTENERS.append(self)
        logger.info("Open connection")
        self.write_message(json.dumps({'event': 'ready'}))
        self.paths = []

    def on_message(self, message):
        m = json.loads(message)
        event = m['event'].strip()
        data = m['data']

        r = redis.Redis(host='localhost', db=2)

        if event == "init":
          self.room_name = data['room']
          logger.info("Initializing with room name %s" % self.room_name)
          if not self.paths:
            key = "%s" % self.room_name
            p = r.get(key)
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
          LISTENERS.remove(self)
          r.publish(self.room_name, singlePath)
          LISTENERS.append(self)
          key = "%s" % self.room_name
          r.set(key, self.paths)

    def on_close(self):
        LISTENERS.remove(self)


settings = {
    'auto_reload': True,
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
