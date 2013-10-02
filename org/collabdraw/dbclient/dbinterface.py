__author__ = 'anand'


class DbInterface():
    def set(self, key, value):
        raise RuntimeError("DB Interface method %s not implemented" % "set")

    def get(self, key):
        raise RuntimeError("DB Interface method %s not implemented" % "get")

    def delete(self, key):
        raise RuntimeError("DB Interface method %s not implemented" % "delete")