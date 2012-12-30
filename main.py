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

import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
import redis
import cairo

from pystacia import read

LISTENERS = {}
LISTENER_THREADS = {}

logger = logging.getLogger('websocket')
logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.DEBUG)

def construct_key(room_name, page_no):
  publish_key = "%s:%s" % (room_name, page_no)
  return publish_key

def hexColorToRGB(colorstring):
  """ convert #RRGGBB to an (R, G, B) tuple """
  colorstring = colorstring.strip()
  if colorstring == "black":
    return (0, 0, 0)
  elif colorstring == "blue":
    return (0, 0, 255)
  elif colorstring == "green":
    return (0, 255, 0)
  elif colorstring == "red":
    return (255, 0, 0)
  logger.debug("Converting string %s to rgb" % colorstring)
  if colorstring[0] == '#': colorstring = colorstring[1:]
  if len(colorstring) != 6:
    logger.error("input #%s is not in #RRGGBB format" % colorstring)
    return (0, 0, 0)
  r, g, b = colorstring[:2], colorstring[2:4], colorstring[4:]
  r, g, b = [int(n, 16) for n in (r, g, b)]
  logger.debug("Returning %d, %d, %d" % (r, g, b))
  return (r, g, b)

def redis_listener(room_name, page_no):
    logger.info("Starting listener thread for room %s" % room_name)
    rr = redis.Redis(host='localhost', db=2)
    r = rr.pubsub()
    r.subscribe(construct_key(room_name, page_no))
    for message in r.listen():
      for listener in LISTENERS.get(room_name, {}).get(page_no, []):
        logger.debug("Sending message to room %s" % room_name)
        listener.send_message(message['data'])

def create_cairo_context(w, h):
  surface = cairo.ImageSurface(cairo.FORMAT_RGB24, w, h)
  ctx = cairo.Context(surface)
  ctx.set_source_rgb(255, 255, 255)
  ctx.rectangle(0, 0, w, h)
  ctx.fill()
  return ctx
  
class RealtimeHandler(tornado.websocket.WebSocketHandler):
    room_name = ''
    paths = []
    redis_client = None
    page_no = 1
    num_pages = 1

    def open(self):
        logger.info("Open connection")
        self.send_message(self.construct_message("ready"))
        self.redis_client = redis.Redis(host='localhost', db=2)

    def on_message(self, message):
        m = json.loads(message)
        event = m.get('event', '').strip()
        data = m.get('data', {})

        logger.debug("Processing event %s" % event)
        if not event:
          logger.error("No event specified")
          return

        if event == "init":
          logger.info("Initializing with room name %s" % self.room_name)

          if data['room'] not in LISTENERS or data['page'] not in LISTENERS[data['room']]:
            t = threading.Thread(target=redis_listener, args=(data['room'], data['page']))
            t.start()
            LISTENER_THREADS.setdefault(data['room'], {}).setdefault(data['page'], []).append(t)

          self.leave_room(self.room_name)
          self.room_name = data['room']
          self.page_no = data['page']
          self.join_room(self.room_name)
          self.num_pages = len(glob.glob('files/%s/*.png' % self.room_name))


          # First send the image if it exists
          image_url, width, height = self.get_image_data(self.room_name, self.page_no)
          self.send_message(self.construct_message("image", {'url': image_url,
                                                             'width': width, 'height': height}))

          # Then send the paths
          p = self.redis_client.get(construct_key(self.room_name, self.page_no))
          if p:
            self.paths = json.loads(p.decode('utf-8').replace("'",'"'))
            self.send_message(self.construct_message("draw-many",
                                                     {'datas':self.paths, 'npages': self.num_pages}))
          else:
            logger.info("No data in database")

        elif event == "draw-click":
          singlePath = data['singlePath']
          if not self.paths:
            logger.debug("None")
            self.paths = []
            
          self.paths.extend(singlePath)
          self.broadcast_message(self.construct_message("draw", {'singlePath': singlePath}))
          self.redis_client.set(construct_key(self.room_name, self.page_no), self.paths)

        elif event == "clear":
          self.broadcast_message(self.construct_message("clear"))
          self.redis_client.delete(construct_key(self.room_name, self.page_no))

        elif event == "get-image":
          if self.room_name != data['room'] or self.page_no != data['page']:
            logger.warning("Room name %s and/or page no. %s doesn't match with current room name %s and/or page no. %s. Ignoring" % (data['room'],
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
      self.redis_client.publish(construct_key(self.room_name, self.page_no), message)
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
      if self in LISTENERS.get(room_name, {}).get(self.page_no, []):
        LISTENERS[room_name][self.page_no].remove(self)
      if clear_paths:
        self.paths = []

    def join_room(self, room_name):
      logger.info("Joining room %s" % room_name)
      LISTENERS.setdefault(room_name, {}).setdefault(self.page_no, []).append(self)

    def get_image_data(self, room_name, page_no):
      image_url = "files/" + room_name + "/" + str(page_no) + "_image.png";
      image_path = os.path.realpath(__file__).replace(__file__, '') + image_url
      try:
        image = read(image_path)
      except IOError as e:
        logger.error("Error %s while reading image at location %s" % (e,
          image_path))
        return '', -1, -1
      width, height = image.size
      return image_url, width, height

    def make_video(self, room_name, page_no):
      p = self.redis_client.get(construct_key(room_name, page_no))
      os.makedirs('tmp', exist_ok=True)
      prefix = 'tmp/'+str(uuid.uuid4())
      if p:
        points = json.loads(p.decode('utf-8').replace("'",'"'))
        i = 0
        c = create_cairo_context(920, 550)
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
        logger.info("Image for room %s and page %s successfully created. File name is %s" % (room_name, page_no, video_file_name))
        if retval == 0:
          # Clean up if successfull
          cleanup_files = prefix+'_img_*'
          logger.info("Cleaning up %s" % cleanup_files)
          subprocess.call(['rm', cleanup_files])

def process_uploaded_file(file_path):
  dir_path = '/'.join(file_path.split('/')[:-1])
  logger.info("Processing file %s" % file_path)
  subprocess.call(['pdfseparate', file_path, dir_path+'/%d_image.pdf'])
  subprocess.call(['mogrify', '-format', 'png', '--', dir_path+'/*image.pdf'])
  subprocess.call(['rm', dir_path+'/*image.pdf'])
  logger.info("Finished processing file")

class Upload(tornado.web.RequestHandler):
  def post(self):
    return_str = "<html><head><meta http-equiv='REFRESH'\
          content='5;url=http://192.168.1.134:8888/upload.html#room=%s'></head><body>%s. Will redirect back to the upload page in 5\
          seconds</body></html>"
    room_name = self.get_argument('room', '')
    if not room_name:
      logger.error("Unknown room name. Ignoring upload")
      response_str = "Room name not provided"
      self.finish(return_str % (room_name, response_str))
      return
    logger.debug("Room name is %s" % room_name)
    fileinfo = self.request.files['fileToUpload'][0]
    fname = fileinfo['filename']
    fext = os.path.splitext(fname)[1]
    if fext.lower() != '.pdf':
      logger.error("Extension is not pdf. It is %s" % fext)
      response_str = "Only pdf files are allowed"
      self.finish(return_str % (room_name, response_str))
      return
    dir_path = "files/"+room_name+"/"
    os.makedirs(dir_path, exist_ok=True)
    file_path = dir_path + fname
    fh = open(file_path, 'wb')
    fh.write(fileinfo['body'])
    fh.close()
    threading.Thread(target=process_uploaded_file, args=(file_path,)).start()
    response_str = "Upload finished successfully"
    self.finish(return_str % (room_name, response_str))

settings = {
    'auto_reload': True,
    'gzip': True,
}

application = tornado.web.Application([
    (r'/realtime/', RealtimeHandler),
    (r'/resource/(.*)', tornado.web.StaticFileHandler,
      dict(path=os.path.join(os.path.dirname(__file__), "resource"))),
    (r'/upload', Upload),
    (r'/(.*)', tornado.web.StaticFileHandler, dict(path=os.path.dirname(__file__))),
], **settings)

http_server = tornado.httpserver.HTTPServer(application)
http_server.listen(8888)
tornado.ioloop.IOLoop.instance().start()
