__author__ = 'anand'

import logging

from .redisdbclient import RedisDbClient
from .dbclienttypes import DbClientTypes
from .dbinterface import DbInterface


class DbClientFactory:
    @staticmethod
    def getDbClient(db_client_type_str):
        """
        @param db_client_type_str:
        @rtype : DbInterface
        """
        logger = logging.getLogger('websocket')
        logger.info("Initializing with db client type %s" % db_client_type_str)
        if db_client_type_str == DbClientTypes.redis:
            return RedisDbClient()
        elif db_client_type_str == DbClientTypes.in_memory:
            pass
        else:
            raise RuntimeError("Unknown db client type %s" % db_client_type_str)