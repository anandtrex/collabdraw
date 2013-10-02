__author__ = 'anand'

import logging

import redis

import config
from .dbinterface import DbInterface


class RedisDbClient(DbInterface):
    def __init__(self):
        self.redis_client = redis.Redis(host=config.REDIS_IP_ADDRESS, port=config.REDIS_PORT, db=2)
        self.logger = logging.getLogger('websocket')

    def set(self, key, value):
        self.redis_client.set(key, value)

    def get(self, key):
        return self.redis_client.get(key)

    def delete(self, key):
        self.redis_client.delete(key)