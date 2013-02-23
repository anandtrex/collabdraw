import os

APP_IP_ADDRESS = '192.168.1.134' #'collabdraw.heroku.com'
APP_PORT = os.environ.get('PORT', 5000)

REDIS_IP_ADDRESS = 'localhost' #'pub-redis-15544.us-east-1-4.3.ec2.garantiadata.com'
REDIS_PORT = 6379 #15544 
ROOT_DIR = '.' #'/app'
RESOURCE_DIR = ROOT_DIR + '/resource'
