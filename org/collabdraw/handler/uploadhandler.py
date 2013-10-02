import subprocess
import logging
import threading
import glob
import config

import os
import redis
import tornado.web
import tornado.template as template


class UploadHandler(tornado.web.RequestHandler):
    def get(self):
        self.logger = logging.getLogger('websocket')
        self.room_name = self.get_argument('room', '')
        loader = template.Loader(config.ROOT_DIR)
        return_str = loader.load(os.path.join(config.HTML_ROOT, "upload.html")).generate(room=self.room_name)
        self.logger.info("Room name is %s" % self.room_name)
        self.finish(return_str)

    def post(self):
        self.logger = logging.getLogger('websocket')
        return_str = "<html><head><meta http-equiv='REFRESH'\
            content='5;url=http://" + config.APP_IP_ADDRESS + ":" + str(config.PUBLIC_LISTEN_PORT) + \
                     "/upload.html#room=%s'></head><body>%s. Will redirect back to the upload page in 5\
                     seconds</body></html>"
        self.room_name = self.get_argument('room', '')
        self.logger.info("Room name is %s" % self.room_name)
        if not self.room_name:
            self.logger.error("Unknown room name. Ignoring upload")
            response_str = "Room name not provided"
            self.finish(return_str % (self.room_name, response_str))
            return
        self.logger.debug("Room name is %s" % self.room_name)
        fileinfo = self.request.files['file'][0]
        fname = fileinfo['filename']
        fext = os.path.splitext(fname)[1]
        if fext.lower() != '.pdf':
            self.logger.error("Extension is not pdf. It is %s" % fext)
            response_str = "Only pdf files are allowed"
            self.finish(return_str % (self.room_name, response_str))
            return
        dir_path = os.path.join(config.ROOT_DIR, files, self.room_name)
        os.makedirs(dir_path, exist_ok=True)
        file_path = os.path.join(dir_path, fname)
        fh = open(file_path, 'wb')
        fh.write(fileinfo['body'])
        fh.close()
        threading.Thread(target=self.process_uploaded_file, args=(dir_path, fname)).start()
        response_str = "Upload finished successfully"
        self.finish(return_str % (self.room_name, response_str))

    def process_uploaded_file(self, dir_path, fname):
        file_path = os.path.join(dir_path, fname)
        self.logger.info("Processing file %s" % file_path)
        # Split the pdf files by pages
        subprocess.call(['pdfseparate', file_path, dir_path + '/%d_image.pdf'])
        # Convert the pdf files to png
        subprocess.call(['mogrify', '-format', 'png', '--', dir_path + '/*image.pdf'])
        # Delete all the files
        del_files = glob.glob(dir_path + '/*image.pdf')
        for f in del_files:
            os.remove(f)
        self.logger.info("Finished processing file")
        # Insert the number of pages processed for that room
        self.redis_client = redis.Redis(host=config.REDIS_IP_ADDRESS, db=2)
        key = "info:%s:npages" % self.room_name
        self.redis_client.set(key, len(glob.glob('files/%s/*.png' % self.room_name)))
