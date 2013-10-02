__author__ = 'anand'

import logging
import threading

import redis

import config
from .pubsubinterface import PubSubInterface


# TODOS
## Thread pooling

class RedisPubSubClient(PubSubInterface):

    t = None

    def __init__(self):
        self.logger = logging.getLogger('websocket')
        self.redis_client = redis.Redis(host=config.REDIS_IP_ADDRESS, port=config.REDIS_PORT, db=1)
        self.pubsub_client = self.redis_client.pubsub()
        self.logger.info("Initialized redis pubsub client")

    def subscribe(self, topic, listener):
        self.logger.debug("Subscribing to topic %s" % topic)
        self.pubsub_client.subscribe(topic)
        self.t = threading.Thread(target=self._redis_listener, args=(topic, listener, self.pubsub_client))
        self.t.start()

    def unsubscribe(self, topic, listener):
        self.logger.debug("Unsubscribing from topic %s" % topic)

        if self.t:
            self.pubsub_client.unsubscribe(topic)
            self.t.join()

    def publish(self, topic, message, publisher):
        self.logger.debug("Publishing to topic %s" % topic)
        # TODO If publisher is subscribed to topic
        self.redis_client.publish(topic, message)

    def _redis_listener(self, topic, listener, pubsub_client):
        self.logger.info("Starting listener thread for topic %s" % topic)
        for message in pubsub_client.listen():
            self.logger.debug("Sending message to topic %s" % topic)
            listener.send_message(message['data'])