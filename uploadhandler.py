import subprocess
import logging
import os
import threading

import tornado.web

import config

class UploadHandler(tornado.web.RequestHandler):
  def get(self):
      self.render("upload.html")

  def post(self):
    self.logger = logging.getLogger('websocket')
    return_str = "<html><head><meta http-equiv='REFRESH'\
          content='5;url=http://"+config.APP_IP_ADDRESS+":"+str(config.PUBLIC_LISTEN_PORT)+"/upload.html#room=%s'></head><body>%s. Will redirect back to the upload page in 5\
          seconds</body></html>"
    room_name = self.get_argument('room', '')
    if not room_name:
      self.logger.error("Unknown room name. Ignoring upload")
      response_str = "Room name not provided"
      self.finish(return_str % (room_name, response_str))
      return
    self.logger.debug("Room name is %s" % room_name)
    fileinfo = self.request.files['fileToUpload'][0]
    fname = fileinfo['filename']
    fext = os.path.splitext(fname)[1]
    if fext.lower() != '.pdf':
      self.logger.error("Extension is not pdf. It is %s" % fext)
      response_str = "Only pdf files are allowed"
      self.finish(return_str % (room_name, response_str))
      return
    dir_path = "files/"+room_name+"/"
    os.makedirs(dir_path, exist_ok=True)
    file_path = dir_path + fname
    fh = open(file_path, 'wb')
    fh.write(fileinfo['body'])
    fh.close()
    threading.Thread(target=self.process_uploaded_file, args=(file_path,)).start()
    response_str = "Upload finished successfully"
    self.finish(return_str % (room_name, response_str))

  def process_uploaded_file(self, file_path):
    dir_path = '/'.join(file_path.split('/')[:-1])
    self.logger.info("Processing file %s" % file_path)
    subprocess.call(['pdfseparate', file_path, dir_path+'/%d_image.pdf'])
    subprocess.call(['mogrify', '-format', 'png', '--', dir_path+'/*image.pdf'])
    subprocess.call(['rm', dir_path+'/*image.pdf'])
    self.logger.info("Finished processing file")
