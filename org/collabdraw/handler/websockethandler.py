import logging
import json
from zlib import compress
from urllib.parse import quote
import config

import os
from base64 import b64encode
import tornado.websocket
import tornado.web
from pystacia import read

from ..dbclient.dbclientfactory import DbClientFactory
from ..pubsub.pubsubclientfactory import PubSubClientFactory


class RealtimeHandler(tornado.websocket.WebSocketHandler):
    room_name = ''
    paths = []
    db_client = None
    page_no = 1
    num_pages = 1

    def construct_key(self, namespace, key, *keys):
        return "-".join([str(namespace), str(key)] + list(map(str, keys)))

    def open(self):
        self.logger = logging.getLogger('websocket')
        self.logger.info("Open connection")
        self.db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)
        self.pubsub_client = PubSubClientFactory.getPubSubClient(config.PUBSUB_CLIENT_TYPE)
        self.send_message(self.construct_message("ready"))

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
            room_name = data.get('room', '')
            if not room_name:
                self.logger.error("Room name not provided. Can't initialize")
                return
            page_no = data.get('page', '1')

            self.init(room_name, page_no)

        elif event == "draw-click":
            self.logger.debug("Received draw-click")
            single_path = data['singlePath']
            if not self.paths:
                self.logger.debug("None")
                self.paths = []

            self.paths.extend(single_path)
            self.broadcast_message(self.construct_message("draw", {'singlePath': single_path}))
            self.db_client.set(self.construct_key(self.room_name, self.page_no), self.paths)

        elif event == "clear":
            self.broadcast_message(self.construct_message("clear"))
            self.db_client.delete(self.construct_key(self.room_name, self.page_no))

        elif event == "get-image":
            if self.room_name != data['room'] or self.page_no != data['page']:
                self.logger.warning("Room name %s and/or page no. %s doesn't match with current room name %s and/or",
                                    "page no. %s. Ignoring" % (
                                    data['room'], data['page'], self.room_name, self.page_no))
            image_url, width, height = self.get_image_data(self.room_name, self.page_no)
            self.send_message(self.construct_message("image", {'url': image_url,
                                                               'width': width, 'height': height}))

        elif event == "video":
            self.make_video(self.construct_key(self.room_name, self.page_no))

        elif event == "new-page":
            self.logger.info("num_pages was %d" % self.num_pages)
            self.db_client.set(self.construct_key("info", self.room_name, "npages"),
                                  self.num_pages + 1)
            self.num_pages += 1
            self.logger.info("num_pages is now %d" % self.num_pages)
            self.init(self.room_name, self.num_pages)

    def on_close(self):
        self.leave_room(self.room_name)

    def construct_message(self, event, data={}):
        m = json.dumps({"event": event, "data": data})
        return m

    def broadcast_message(self, message):
        self.pubsub_client.publish(self.construct_key(self.room_name, self.page_no), message, self)

    def send_message(self, message):
        if type(message) == type(b''):
            # self.logger.info("Decoding binary string")
            message = message.decode('utf-8')
        elif type(message) != type(''):
            # self.logger.info("Converting message from %s to %s" % (type(message),
            #                                                       type('')))
            message = str(message)
        message = b64encode(compress(bytes(quote(message), 'utf-8'), 9))
        self.write_message(message)

    def leave_room(self, room_name, clear_paths=True):
        self.logger.info("Leaving room %s" % room_name)
        self.pubsub_client.unsubscribe(self.construct_key(room_name, self.page_no), self)
        if clear_paths:
            self.paths = []

    def join_room(self, room_name):
        self.logger.info("Joining room %s" % room_name)
        self.pubsub_client.subscribe(self.construct_key(room_name, self.page_no), self)

    def init(self, room_name, page_no):
        self.logger.info("Initializing %s and %s" % (room_name, page_no))

        self.room_name = room_name
        self.page_no = page_no
        self.join_room(self.room_name)

        n_pages = self.db_client.get(self.construct_key("info", self.room_name, "npages"))
        if n_pages:
            self.num_pages = int(n_pages.decode('utf-8'))
            # First send the image if it exists
        image_url, width, height = self.get_image_data(self.room_name, self.page_no)
        self.send_message(self.construct_message("image", {'url': image_url,
                                                           'width': width, 'height': height}))
        # Then send the paths
        p = self.db_client.get(self.construct_key(self.room_name, self.page_no))
        if p:
            self.paths = json.loads(p.decode('utf-8').replace("'", '"'))
        else:
            self.paths = []
            self.logger.info("No data in database")
        self.send_message(self.construct_message("draw-many",
                                                 {'datas': self.paths, 'npages': self.num_pages}))

    def get_image_data(self, room_name, page_no):
        image_url = os.path.join("files", room_name, str(page_no) + "_image.png")
        image_path = os.path.join(config.ROOT_DIR, image_url)
        try:
            image = read(image_path)
        except IOError as e:
            self.logger.error("Error %s while reading image at location %s" % (e,
                                                                               image_path))
            return '', -1, -1
        width, height = image.size
        return image_url, width, height
