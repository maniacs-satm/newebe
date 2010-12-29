
import threading

from couchdbkit import Server, Consumer
from couchdbkit.schema import Document, IntegerProperty
from urllib2 import Request, urlopen
from newebe.platform.contactmodels import ContactManager

class LastSequence(Document):
    lastSequence = IntegerProperty(required=True, default=0)

class LastSequenceManager():

    @staticmethod
    def getLastSequence():
        lastSequences = LastSequence.view("platform/lastsequence")

        if lastSequences:
            return lastSequences.first().lastSequence
        else:
            lastSequence = LastSequence()
            lastSequence.save()
            return lastSequence.lastSequence

    @staticmethod
    def setLastSequence(value):
        lastSequences = LastSequence.view("platform/lastsequence")

        if lastSequences:
            lastSequence = lastSequences.first()
            lastSequence.lastSequence = value
        else:
            lastSequence = LastSequence()
            lastSequence.lastSequence = value

        lastSequence.save()
        



server = Server()
db = server.get_or_create_db("newebe")

LastSequence.set_db(db)

def print_line(line):
    #f = open('changes.log', 'a')

    isNotDeleted = "deleted" not in line or not line["deleted"]

    if isNotDeleted:
        doc = db.get(line["id"])

        if doc and "doc_type" in doc and isNotDeleted :
            if doc["doc_type"] == "MicroPost":
                LastSequenceManager.setLastSequence(line["seq"])
                for contact in ContactManager.getTrustedContacts():
                    print contact
                    print doc

                    #f.write(doc["doc_type"] + "\n")
                    #f.close()


class ChangeListener(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)


    def run(self):
        consumer = Consumer(db)
        consumer.register_callback(print_line)
        consumer.wait(since=LastSequenceManager.getLastSequence())

