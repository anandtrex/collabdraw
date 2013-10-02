__author__ = 'anand'

class PubSubInterface():
    def subscribe(self, topic, listener):
        raise RuntimeError("PubSub Interface method %s not implemented" % "subscribe")

    def unsubscribe(self, topic, listener):
        raise RuntimeError("PubSub Interface method %s not implemented" % "unsubscribe")

    def publish(self, topic, message, publisher):
        raise RuntimeError("PubSub Interface method %s not implemented" % "publish")

