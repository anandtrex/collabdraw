__author__ = 'anand'

import subprocess
import glob
import os
import logging

import config
from ..dbclient.dbclientfactory import DbClientFactory
from org.collabdraw.tools.tools import delete_files


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
    delete_files(dir_path + '/*image.pdf')
    logger.info("Finished processing file")
    # Insert the number of pages processed for that room
    db_key = "info:%s:npages" % key
    db_client.set(db_key, len(glob.glob(dir_path + '/*.png')))