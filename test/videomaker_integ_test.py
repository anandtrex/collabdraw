__author__ = 'anand'

import unittest
import glob
import os

import config
from org.collabdraw.dbclient.dbclientfactory import DbClientFactory
from org.collabdraw.tools.videomaker import make_video
from org.collabdraw.tools.tools import delete_files

class VideoMakerIntegTest(unittest.TestCase):
    def videomaker_test(self):
        # Make sure tmp directory is clean to start with
        delete_files("tmp/*.mp4")

        key = "nosetest:video"
        path = [{'lineColor': 'black', 'y': 397, 'oldx': 813, 'oldy': 397, 'lineWidth': '3px', 'type': 'touchmove', 'x': 811},
                {'lineColor': 'black', 'y': 398, 'oldx': 811, 'oldy': 397, 'lineWidth': '3px', 'type': 'touchmove', 'x': 809},
                {'lineColor': 'black', 'y': 398, 'oldx': 809, 'oldy': 398, 'lineWidth': '3px', 'type': 'touchend', 'x': 809},
                {'lineColor': 'black', 'y': 399, 'oldx': 809, 'oldy': 398, 'lineWidth': '3px', 'type': 'touchend', 'x': 900},
                {'lineColor': 'black', 'y': 400, 'oldx': 900, 'oldy': 399, 'lineWidth': '3px', 'type': 'touchend', 'x': 910},
                {'lineColor': 'black', 'y': 401, 'oldx': 910, 'oldy': 400, 'lineWidth': '3px', 'type': 'touchend', 'x': 920},
                {'lineColor': 'black', 'y': 402, 'oldx': 920, 'oldy': 401, 'lineWidth': '3px', 'type': 'touchend', 'x': 930},
                {'lineColor': 'black', 'y': 403, 'oldx': 930, 'oldy': 402, 'lineWidth': '3px', 'type': 'touchend', 'x': 940},
                {'lineColor': 'black', 'y': 404, 'oldx': 940, 'oldy': 403, 'lineWidth': '3px', 'type': 'touchend', 'x': 950},
                {'lineColor': 'black', 'y': 500, 'oldx': 950, 'oldy': 404, 'lineWidth': '3px', 'type': 'touchend', 'x': 960},
                {'lineColor': 'black', 'y': 508, 'oldx': 960, 'oldy': 500, 'lineWidth': '3px', 'type': 'touchend', 'x': 1000},
                {'lineColor': 'black', 'y': 511, 'oldx': 1000, 'oldy': 508, 'lineWidth': '3px', 'type': 'touchend', 'x': 900},
               ]
        db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)
        db_client.set(key, path)
        make_video(key)

        # Validation
        files = glob.glob("tmp/*")
        self.assertEquals(len(files), 1, "Expecting exactly one file in tmp directory")
        self.assertIn("mp4", files[0], "Expecting an video file")

        # Cleanup
        db_client.delete(key)
        delete_files("tmp/*.mp4")
        os.rmdir("tmp")