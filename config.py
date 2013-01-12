import os

APP_IP_ADDRESS = 'collabdraw.heroku.com'
APP_PORT = os.environ['PORT'] if os.environ['PORT'] else 5000

REDIS_IP_ADDRESS = 'pub-redis-15544.us-east-1-4.3.ec2.garantiadata.com'
REDIS_PORT = 15544 

