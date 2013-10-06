__author__ = 'anand'

import os
import subprocess
import json
import uuid
import logging

import config
from ..tools.tools import hexColorToRGB, createCairoContext
from ..dbclient.dbclientfactory import DbClientFactory
from ..tools.tools import delete_files


def make_video(key):
    logger = logging.getLogger('websocket')
    db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)

    p = db_client.get(key)
    tmp_path = os.path.abspath("./tmp")
    os.makedirs(tmp_path, exist_ok=True)
    path_prefix = os.path.join(tmp_path, str(uuid.uuid4()))
    if p:
        points = json.loads(p)
        i = 0
        c = createCairoContext(920, 550)
        for point in points:
            c.set_line_width(float(point['lineWidth'].replace('px', '')))
            c.set_source_rgb(*hexColorToRGB(point['lineColor']))
            if point['type'] == 'dragstart' or point['type'] == 'touchstart':
                c.move_to(point['oldx'], point['oldy'])
            elif point['type'] == 'drag' or point['type'] == 'touchmove':
                c.move_to(point['oldx'], point['oldy'])
                c.line_to(point['x'], point['y'])
            c.stroke()
            f = open(path_prefix + "_img_" + str(i) + ".png", "wb")
            c.get_target().write_to_png(f)
            f.close()
            i += 1
        video_file_name = path_prefix + '_video.mp4'
        retval = subprocess.call(['ffmpeg', '-f', 'image2', '-i', path_prefix + '_img_%d.png', video_file_name])
        logger.info("Image for key %s successfully created. File name is %s" % (key, video_file_name))
        if retval == 0:
            # Clean up if successful
            cleanup_files = path_prefix + '_img_*'
            logger.info("Cleaning up %s" % cleanup_files)
            delete_files(cleanup_files)