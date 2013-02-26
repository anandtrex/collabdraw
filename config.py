import os

# App's host and port
APP_IP_ADDRESS = "collab.cloudapp.net"
APP_PORT = str(os.environ.get('PORT', 6000))

# Port in which websocket client should listen
# Usually same ass APP_PORT unless some other
# port forwarding is set up
PUBLIC_LISTEN_PORT = "80" #APP_PORT

# Redis host and port
REDIS_IP_ADDRESS = 'localhost'
REDIS_PORT = 6379

# Full path of "collabdraw" directory
ROOT_DIR = "/".join(os.path.realpath(__file__).split('/')[:-1])
RESOURCE_DIR = ROOT_DIR + '/resource'
