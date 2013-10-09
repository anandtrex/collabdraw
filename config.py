import os

# App's host and port
APP_IP_ADDRESS = "collabdraw.herokuapp.com"
APP_PORT = os.environ.get('PORT', 5000)

# Port in which websocket client should listen
# Usually same ass APP_PORT unless some other
# port forwarding is set up
PUBLIC_LISTEN_PORT = 80

PUBSUB_CLIENT_TYPE = 'redis' # only redis supported now
DB_CLIENT_TYPE = 'redis'  # only redis supported now

REDIS_URL = os.environ.get('REDISCLOUD_URL', 'redis://localhost:6379')

# Full path of "collabdraw" directory
ROOT_DIR = "/".join(os.path.realpath(__file__).split('/')[:-1])
RESOURCE_DIR = os.path.join(ROOT_DIR, 'resource')
HTML_ROOT = os.path.join(RESOURCE_DIR, 'html')

# Hash salt for storing password in database
HASH_SALT = "bollacboard"

# Enable SSL/TLS
ENABLE_SSL = False
SERVER_CERT = os.path.join(os.getcwd(), "server.crt")
SERVER_KEY = os.path.join(os.getcwd(), "server.key")

# Demo mode disables login requirement
DEMO_MODE = True
