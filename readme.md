[![No Maintenance Intended](http://unmaintained.tech/badge.svg)](http://unmaintained.tech/)


ABOUT:
-------------
Collabdraw is an open-source online whiteboard application built to work on desktops and  tablets
alike. The user interface is HTML5 (using enyojs), and the backend runs on python tornado and redis.


FEATURES:
-------------
1. Works on most tablets out of the box, interface designed for touch interfaces
2. Multiple rooms, pages for collaboration
3. Take quick snapshots of the board
4. Upload pdf and annotate on whiteboard
5. Support for SSL, and authentication
6. Fast, handles lots of users simultaneously
7. **Runs on heroku out of the box!**

SERVER REQUIREMENTS:
-------------
1. Python 3.2+
2. Redis server
3. All python packages specified in requirements.txt (which might involve installing other
non-python dependencies like cairo, redis)
4. libpoppler (for pdfseparate), imagemagick (for mogrify) for upload functionality
5. ffmpeg to enable video functionality

INSTALLATION:
-------------
1. Install all system requirements. If on Ubuntu/Debian do:
```
apt-get install python3 redis-server poppler-utils imagemagick ffmpeg python3-pip git pkg-config libcairo2-dev
```

2. Clone the git repository 
```
git clone git://github.com/anandtrex/collabdraw.git
```   

3. Initialize submodules to get enyojs libraries.
```
cd collabdraw
git submodule init
git submodule update
```

4. Install python library requirements
```
pip-3.2 install virtualenv
virtualenv venv
source venv/bin/activate
pip install -r requirements.txt
```

5. Set the hostnames, ports and other options in config.py. Most of the options are explained in the
config file. You need the url that points to your redis server, and the url that points to your
websocket endpoint

6. Test if your setup works
```
collabdraw> ./run_tests.sh
```
    
RUNNING:
-------------
1. Start the redis server (On Ubuntu/Debian, on most setups, this is started automatically on installation)
2. Run `python main.py`


HEROKU DEPLOYMENT:
--------------------
1. Create a [heroku](http://heroku.com) account, create an app, and add the "Redis cloud" plugin.
Install heroku toolbelt on your box. Login to heroku with `heroku login`. You can follow the
instructions on the [heroku quickstart page](https://devcenter.heroku.com/articles/quickstart)
2. Clone the git repository `git clone git://github.com/anandtrex/collabdraw.git && cd collabdraw`
3. Edit config.py to point to your app. If you use the "Redis cloud" heroku addon, you can leave the
redis url as it is.
4. Add your app as a remote in git with:
```
heroku git:remote -a <your heroku app name>
```
5. Run `./set_heroku_path.sh` to set the LD_LIBRARY_PATH in your heroku app config to point properly
to ffmpeg
6. Run:
```
git push heroku master
```
7. Profit!!!
8. You can check your heroku installation by logging into the heroku dynamo with `heroku run bash`, and running `./run_tests.sh`. If this passes, all's good.



NOTES:
-------------
* All rooms are currently "public". Anyone registered user can join any room, if they know the room name. Private rooms on the way.
