__author__ = 'anand'

import subprocess
import glob
import os
import logging

import config
from ..dbclient.dbclientfactory import DbClientFactory


def process_uploaded_file(dir_path, fname, key):
    logger = logging.getLogger('websocket')
    db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)

    file_path = os.path.join(dir_path, fname)
    logger.info("Processing file %s" % file_path)
    # Split the pdf files by pages
    subprocess.call(['pdfseparate', file_path, dir_path + '/%d_image.pdf'])
    # Convert the pdf files to png
    subprocess.call(['mogrify', '-format', 'png', '--', dir_path + '/*image.pdf'])
    # Delete all the files
    del_files = glob.glob(dir_path + '/*image.pdf')
    for f in del_files:
        os.remove(f)
    logger.info("Finished processing file")
    # Insert the number of pages processed for that room
    key = "info:%s:npages" % key
    db_client.set(key, len(glob.glob('files/%s/*.png' % key)))