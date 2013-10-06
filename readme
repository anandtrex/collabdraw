ABOUT:
-------------
Collabdraw is an open-source online whiteboard application built to work on desktops and  tablets alike. The user interface is HTML5 (using enyojs), and the backend runs on python tornado and redis.

FEATURES:
-------------
1. Works on most tablets out of the box, interface designed for touch interfaces
1. Multiple rooms, pages for collaboration
1. Take quick snapshots of the board
1. Upload pdf and annotate on whiteboard
1. Support for SSL, and authentication
1. Fast, handles lots of users simultaneously

SERVER REQUIREMENTS:
-------------
1. Python 3.2+
1. Redis server
1. All python packages specified in requirements.txt (which might involve installing other
non-python dependencies like cairo, redis)
1. libpoppler (for pdfseparate), imagemagick (for mogrify) for upload functionality
1. ffmpeg to enable video functionality

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

5. Set the hostnames, ports and other options in config.py

6. Test if your setup works
```
collabdraw> ./run_tests.sh
```
    
RUNNING:
-------------
1. Start the redis server (On Ubuntu/Debian, on most setups, this is started automatically on installation)
1. Run `python main.py`

NOTES:
-------------
* All rooms are currently "public". Anyone registered user can join any room, if they know the room name. Private rooms on the way.