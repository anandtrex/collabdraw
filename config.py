import os

# App's host and port
APP_IP_ADDRESS = "collab.cloudapp.net"
APP_PORT = os.environ.get('PORT', 5000)

# Port in which websocket client should listen
# Usually same ass APP_PORT unless some other
# port forwarding is set up
PUBLIC_LISTEN_PORT = 80

# Redis host and port
REDIS_IP_ADDRESS = 'localhost'
REDIS_PORT = 6379

# Full path of "bollacboard" directory
ROOT_DIR = "/".join(os.path.realpath(__file__).split('/')[:-1])
RESOURCE_DIR = ROOT_DIR + '/resource'

# Hash salt for storing password in database
HASH_SALT = "bollacboard"

# Enable SSL/TLS
ENABLE_SSL = False
SERVER_CERT = os.path.join(os.getcwd(), "server.crt")
SERVER_KEY = os.path.join(os.getcwd(),"server.key")

# Demo mode disables login requirement
DEMO_MODE = True
