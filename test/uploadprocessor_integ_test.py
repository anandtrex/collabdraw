import unittest
import os
import glob

import config
from org.collabdraw.tools.uploadprocessor import process_uploaded_file
from org.collabdraw.dbclient.dbclientfactory import DbClientFactory
from org.collabdraw.tools.tools import delete_files


class UploadProcessorIntegTest(unittest.TestCase):
    def uploadprocessor_test(self):
        dir_path = os.path.abspath("./files")
        key = "nosetest:upload"
        process_uploaded_file(dir_path, "sample.pdf", key)
        output_files = os.listdir(dir_path)
        self.assertEquals(len(output_files), 11)
        self.assertIn("sample.pdf", output_files)
        for i in range(0, 10):
            self.assertIn(str(i + 1) + "_image.png", output_files)

        key = "info:%s:npages" % key
        db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)
        self.assertEquals(int(db_client.get(key)), 10)

        # Cleanup
        db_client.delete(key)
        delete_files(dir_path + "/*.png")