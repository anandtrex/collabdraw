import logging
import json
import os
import threading
import subprocess
import glob
import uuid
from zlib import compress
from urllib.parse import quote
from base64 import b64encode

import tornado.websocket
import redis
from pystacia import read

from tools import hexColorToRGB, createCairoContext
import config

class RealtimeHandler(tornado.websocket.WebSocketHandler):
    room_name = ''
    paths = []
    redis_client = None
    page_no = 1
    num_pages = 1

    def construct_paths_key(self, room_name, page_no):
        publish_key = "%s:%s" % (room_name, page_no)
        return publish_key

    def redis_listener(self, room_name, page_no):
        self.logger.info("Starting listener thread for room %s" % room_name)
        rr = redis.Redis(host=config.REDIS_IP_ADDRESS, db=2)
        r = rr.pubsub()
        r.subscribe(self.construct_paths_key(room_name, page_no))
        for message in r.listen():
          for listener in self.application.LISTENERS.get(room_name, {}).get(page_no, []):
            self.logger.debug("Sending message to room %s" % room_name)
            listener.send_message(message['data'])

    def open(self):
        self.logger = logging.getLogger('websocket')
        self.logger.info("Open connection")
        self.send_message(self.construct_message("ready"))
        self.redis_client = redis.Redis(host=config.REDIS_IP_ADDRESS, db=2)

    def on_message(self, message):
        m = json.loads(message)
        event = m.get('event', '').strip()
        data = m.get('data', {})

        self.logger.debug("Processing event %s" % event)
        if not event:
          self.logger.error("No event specified")
          return

        if event == "init":
          self.logger.info("Initializing with room name %s" % self.room_name)

          room_name = data.get('room','')
          if not room_name:
            self.logger.error("Room name not provided. Can't initialize")
            return

          page_no = data.get('page','1')

          if room_name not in self.application.LISTENERS or page_no not in self.application.LISTENERS[room_name]:
            t = threading.Thread(target=self.redis_listener, args=(room_name, page_no))
            t.start()
            self.application.LISTENER_THREADS.setdefault(room_name, {}).setdefault(page_no, []).append(t)

          self.leave_room(self.room_name)
          self.room_name = room_name
          self.page_no = page_no
          self.join_room(self.room_name)
          self.num_pages = len(glob.glob('files/%s/*.png' % self.room_name))


          # First send the image if it exists
          image_url, width, height = self.get_image_data(self.room_name, self.page_no)
          self.send_message(self.construct_message("image", {'url': image_url,
                                                             'width': width, 'height': height}))

          # Then send the paths
          p = self.redis_client.get(self.construct_paths_key(self.room_name, self.page_no))
          if p:
            self.paths = json.loads(p.decode('utf-8').replace("'",'"'))
            self.send_message(self.construct_message("draw-many",
                                                     {'datas':self.paths, 'npages': self.num_pages}))
          else:
            self.logger.info("No data in database")

        elif event == "draw-click":
          singlePath = data['singlePath']
          if not self.paths:
            self.logger.debug("None")
            self.paths = []
            
          self.paths.extend(singlePath)
          self.broadcast_message(self.construct_message("draw", {'singlePath': singlePath}))
          self.redis_client.set(self.construct_paths_key(self.room_name, self.page_no), self.paths)

        elif event == "clear":
          self.broadcast_message(self.construct_message("clear"))
          self.redis_client.delete(self.construct_paths_key(self.room_name, self.page_no))

        elif event == "get-image":
          if self.room_name != data['room'] or self.page_no != data['page']:
            self.logger.warning("Room name %s and/or page no. %s doesn't match with current room name %s and/or page no. %s. Ignoring" % (data['room'],
                              data['page'], self.room_name, self.page_no))
          image_url, width, height = self.get_image_data(self.room_name, self.page_no)
          self.send_message(self.construct_message("image", {'url': image_url,
                                                             'width': width, 'height': height}))

        elif event == "video":
          self.make_video(self.room_name, self.page_no)
          pass

    def on_close(self):
      self.leave_room(self.room_name)

    def construct_message(self, event, data = {}):
      m = json.dumps({"event": event, "data": data})
      return m

    def broadcast_message(self, message):
      self.leave_room(self.room_name, False)
      self.redis_client.publish(self.construct_paths_key(self.room_name, self.page_no), message)
      self.join_room(self.room_name)

    def send_message(self, message):
      if type(message) == type(b''):
        self.logger.info("Decoding binary string")
        message = message.decode('utf-8')
      elif type(message) != type(''):
        self.logger.info("Converting message from %s to %s" % (type(message),
                                                          type('')))
        message = str(message)
      message = b64encode(compress(bytes(quote(message), 'utf-8'), 9))
      self.write_message(message)

    def leave_room(self, room_name, clear_paths = True):
      self.logger.info("Leaving room %s" % room_name)
      if self in self.application.LISTENERS.get(room_name, {}).get(self.page_no, []):
        self.application.LISTENERS[room_name][self.page_no].remove(self)
      if clear_paths:
        self.paths = []

    def join_room(self, room_name):
      self.logger.info("Joining room %s" % room_name)
      self.application.LISTENERS.setdefault(room_name, {}).setdefault(self.page_no, []).append(self)

    def get_image_data(self, room_name, page_no):
      image_url = "files/" + room_name + "/" + str(page_no) + "_image.png";
      image_path = os.path.realpath(__file__).replace(__file__, '') + image_url
      try:
        image = read(image_path)
      except IOError as e:
        self.logger.error("Error %s while reading image at location %s" % (e,
          image_path))
        return '', -1, -1
      width, height = image.size
      return image_url, width, height

    def make_video(self, room_name, page_no):
      p = self.redis_client.get(self.construct_paths_key(room_name, page_no))
      os.makedirs('tmp', exist_ok=True)
      prefix = 'tmp/'+str(uuid.uuid4())
      if p:
        points = json.loads(p.decode('utf-8').replace("'",'"'))
        i = 0
        c = createCairoContext(920, 550)
        for point in points:
          c.set_line_width(float(point['lineWidth'].replace('px','')))
          c.set_source_rgb(*hexColorToRGB(point['lineColor']))
          if point['type'] == 'dragstart' or point['type'] == 'touchstart':
            c.move_to(point['oldx'], point['oldy'])
          elif point['type'] == 'drag' or point['type'] == 'touchmove':
            c.move_to(point['oldx'], point['oldy'])
            c.line_to(point['x'], point['y'])
          c.stroke()
          f = open(prefix+"_img_"+str(i)+".png", "wb")
          c.get_target().write_to_png(f)
          f.close()
          i += 1
        video_file_name = prefix+'_video.mp4'
        retval = subprocess.call(['ffmpeg', '-f', 'image2', '-i', prefix+'_img_%d.png', video_file_name])
        self.logger.info("Image for room %s and page %s successfully created. File name is %s" % (room_name, page_no, video_file_name))
        if retval == 0:
          # Clean up if successfull
          cleanup_files = prefix+'_img_*'
          self.logger.info("Cleaning up %s" % cleanup_files)
          subprocess.call(['rm', cleanup_files])
