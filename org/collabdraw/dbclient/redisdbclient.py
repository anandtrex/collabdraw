__author__ = 'anand'

import logging

import redis

import config
import auth
from .dbinterface import DbInterface


class RedisDbClient(DbInterface):
    redis_client = redis.Redis(host=config.REDIS_IP_ADDRESS, port=config.REDIS_PORT, db=0, password=auth.REDIS_PASSWORD)

    def __init__(self):
        self.logger = logging.getLogger('websocket')

    def set(self, key, value):
        self.redis_client.set(key, value)

    def get(self, key):
        value = self.redis_client.get(key)
        if value:
            return value.decode('utf-8').replace("'", '"')

    def delete(self, key):
        self.redis_client.delete(key)
