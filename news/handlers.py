import logging
import datetime

from django.utils import simplejson as json
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from tornado.web import asynchronous, HTTPError

from newebe.lib import json_util
from newebe.lib.date_util import getDateFromDbDate, getDbDateFromUrlDate
from newebe.news.models import MicroPostManager, MicroPost
from newebe.activities.models import Activity
from newebe.core.models import ContactManager, UserManager
from newebe.core.handlers import NewebeHandler, NewebeAuthHandler

# When a new post is created, it is forwarded to contacts. CONTACT_PATH is 
# the end of the URI to post the data. Full URI is contact UR + CONTACT_PATH
CONTACT_PATH = 'news/microposts/contacts/'

# Long polling queue
connections = []

# Logging stuff
logger = logging.getLogger("newebe.news")



class NewsSuscribeHandler(NewebeAuthHandler):
    '''
    Handler that managers long polling connections.
    '''

    @asynchronous
    def get(self):
        '''
        Add request to the waiting queue. When a new post will come, this
        handler callback will be called then a response with new post 
        will be sent to client that made this request.
        '''
        logger.info("Long polling incoming")
        connections.append(self.async_callback(self.on_new_post))


    def on_new_post(self, response_data):
        '''
        When new post arrives, it sends it to client requesting for new
        posts.
        '''
        self.write(response_data)
        self.finish()


class MicropostHandler(NewebeAuthHandler):
    '''
    Manage single post data :
    * GET request returns post corresponding to the id given in the request URL.
    * DELETE request deletes post corresponding to the id given in the request 
    URL. Then send the delete request to contacts.
    '''
    
    def __init__(self, application, request, **kwargs):
        '''
        Initialize contacts dictionnary. This dictionary linked a request to
        a contact to handle error if request fails.
        '''
        NewebeHandler.__init__(self, application, request, **kwargs)
        self.contacts = dict()


    def get(self, postId):
        '''
        GET request returns post corresponding to the id given in the request 
        URL.
        '''

        micropost = MicroPostManager.getMicropost(postId)
        if micropost:
            self.returnJson(micropost.toJson())
        else:
            self.returnFailure("Micropost not found.", 404)


    @asynchronous
    def delete(self, postId):
        '''
        Deletes the post of which id is equal to postId, add an activity and 
        forwards the delete request to each trusted contact.

        put instead of delete because tornado does not support body in DELETE 
        requests...
        '''

        micropost = MicroPostManager.getMicropost(postId)
        if micropost:
            self.set_status(200)

            user = UserManager.getUser()
            self.activity = Activity(
                authorKey = user.key,
                author = user.name,
                verb = "deletes",
                docType = "micropost",
                docId = micropost._id,
                method = "DELETE"
            )
            micropost.delete()
            self.activity.save()

            # Forward delete to contacts
            if micropost.authorKey == user.key:
                httpClient = AsyncHTTPClient()            
                for contact in ContactManager.getTrustedContacts():
                    url = contact.url.encode("utf-8") + CONTACT_PATH
                    body = micropost.toJson()
                    request = HTTPRequest(url, method = "PUT", body = body)
                    self.contacts[request] = (contact, micropost)
                    try:
                        httpClient.fetch(request, self.onContactResponse)
                    except:
                        activityError = {                    
                            "contactKey" : contact.key,
                            "contactUrl" : contact.name,
                            "extra" : micropost.date
                        }
                        self.activity.errors.append(activityError)
                        self.activity.save()

            self.returnSuccess("Micropost deletion succeeds.")
            
        else:
            raise HTTPError("Micropost not found.", 404)


    def onContactResponse(self, response, **kwargs):
        '''
        Callback for delete request sent to contacts. If error occurs it 
        marks it inside the activity for which error occurs.
        '''

        if response.error: 
            logger.error("Sending delete request to a contact failed, error infos are stored inside activity.")

            (contact, micropost) = self.contacts[response.request]
            activityError = {                    
                    "contactKey" : contact.key,
                    "contactUrl" : contact.name,
                    "extra" : micropost.date
            }
            if not self.activity.errors:
                self.activity.errors = []
            self.activity.errors.append(activityError)
            self.activity.save()

            del self.contacts[response.request]

        else: 
            logger.info("Delete post successfully sent.")


class NewsHandler(NewebeAuthHandler):
    '''
    This handler handles request that retrieve lists of news.
    GET : Retrieve last NEWS_LIMIT microposts published before a given date.
    POST : Creates a new microposts and forward the activity to contacts.
    '''


    def __init__(self, application, request, **kwargs):
        NewebeHandler.__init__(self, application, request, **kwargs)
        self.contacts = dict()


    @asynchronous
    def get(self, startKey=None):
        '''
        Return microposts by pack of NEWS_LIMIT at JSON format. If a start key 
        is given in URL (it means a date like 2010-10-05-12-30-48), 
        microposts from this date are returned. Else latest news are returned. 

        Arguments:
            *startKey* The date from where news should be returned.
        '''

        microposts = list()

        if startKey:
            dateString = getDbDateFromUrlDate(startKey)
            microposts = MicroPostManager.getList(dateString)

        else:
            microposts = MicroPostManager.getList()

        self.returnJson(json_util.getJsonFromDocList(microposts))


    @asynchronous
    def post(self):
        '''
        When post request is recieved, micropost data are expected as
        a JSON object. It is extracted from it
        then stored inside a new Microposts object. Micropost author is 
        automatically set with current user and current date is set as date.

        Created microposts are forwarded to contacts.
        '''
        
        logger.info("Micropost post received.")

        data = self.request.body
        if data:

            # Save post locally
            postedMicropost = json.loads(data)

            user = UserManager.getUser()
            micropost = MicroPost(
                authorKey = user.key,
                author = user.name,
                content = postedMicropost['content'],
                date = datetime.datetime.now(),
            )
            micropost.save()

            # Save corresponding activity
            self.activity = Activity(
                authorKey = user.key,
                author = user.name,
                verb = "writes",
                docType = "micropost",
                docId = micropost._id
            )
            self.activity.save()
    
            # Forward post to contacts
            httpClient = AsyncHTTPClient()            
            for contact in ContactManager.getTrustedContacts():
                url = contact.url.encode("utf-8") + CONTACT_PATH
                body = micropost.toJson()
                request = HTTPRequest(url, method="POST", body=body)
                self.contacts[request] = contact
                try:
                    httpClient.fetch(request, self.onContactResponse)
                except:
                    activityError = {                    
                        "contactKey" : contact.key,
                        "contactUrl" : contact.name
                    }
                    self.activity.errors.append(activityError)
                    self.activity.save()

            self.set_status(201)
            self.returnJson(micropost.toJson())
    
        else: 
            raise HTTPError(405,
                    "Sent data were incorrects. No post was created.")


    def onContactResponse(self, response, **kwargs):
        '''
        Callback for post request sent to contacts. If error occurs it 
        marks it inside the activity for which error occurs. Else 
        it logs that micropost posting succeeds.
        '''

        if response.error: 
            logger.error("Post to a contact failed, error infos are stored" \
                    "inside activity.")
            contact = self.contacts[response.request]
            activityError = {                    
                    "contactKey" : contact.key,
                    "contactUrl" : contact.name
            }
            if not self.activity.errors:
                self.activity.errors = []
            self.activity.errors.append(activityError)
            self.activity.save()

            del self.contacts[response.request]

        else: 
            logger.info("Post successfully sent.")
        

class NewsContactHandler(NewebeHandler):
    '''
    This resource allows authorized contacts to send their microposts.
    '''

    def post(self):
        '''
        When post request is received, micropost content is expected inside
        a string under *content* of JSON object. It is extracted from it
        then stored inside a new Microposts object. Micropost author and date
        are set from incoming data.
        '''
        data = self.request.body

        if data:
            postedMicropost = json.loads(data)
            date = getDateFromDbDate(postedMicropost["date"])

            micropost = MicroPost(
                authorKey = postedMicropost["authorKey"],
                author = postedMicropost["author"],
                content = postedMicropost['content'],
                date = date,
                isMine = False
            )
            micropost.save()

            self.create_write_activity(micropost, date)
            self.notify_suscribers(micropost)
            self.write_create_log(micropost)
            
            self.returnJson(micropost.toJson(), 201)

        else:
            raise HTTPError(405, "No data sent.")


    def create_write_activity(self, micropost, date):
        '''
        Creates an activity telling that a micropost has been written.
        The activity is linked to *micropost* and its date is set to *date*.
        '''

        activity = Activity(
            authorKey = micropost.authorKey,
            author = micropost.author,
            verb = "writes",
            docType = "micropost",
            docId = micropost._id,
            isMine = False,
            date = date
        )
        activity.save()


    def notify_suscribers(self, micropost):
        '''
        Notify suscribed client (long polling requests) that a *micropost*
        has been saved. It sends them the micropost content.
        '''

        while connections:
            connection = connections.pop() 
            connection(micropost.toJson())


    def write_create_log(self, micropost):
        '''
        Print a log telling that an incoming micropost has been saved.
        '''

        logger.info("Micropost from %s recieved" % micropost.author)


    def put(self):
        '''
        When a delete request from a contact is incoming, it executes the 
        delete request locally then it creates a new activity corresponding
        to this deletion.
        '''

        data = self.request.body

        if data:
            deletedMicropost = json.loads(data)
            micropost = MicroPostManager.getContactMicropost(
                 deletedMicropost["authorKey"], deletedMicropost["date"])
            
            if micropost:
                self.create_delete_activity(micropost)
                micropost.delete()

                self.write_delete_log(micropost)
                self.returnSuccess()

            else:
                self.returnFailure("Micropost not found", 404)

        else:
            self.returnFailure("No data sent.", 405)


    def write_delete_log(self, micropost):
        '''
        Print a log telling that an incoming micropost has been saved.
        '''

        logger.info("Micropost deletion from %s received" % micropost.author)


    def create_delete_activity(self, micropost):
        '''
        Creates an activity telling that a micropost deletion occured.
        *micropost* data are set in the activity.
        '''

        activity = Activity(
            authorKey = micropost.authorKey,
            author = micropost.author,
            docId = micropost._id,
            verb = "deletes",
            isMine = False,
            method = "DELETE"
        )
        activity.save()


class MicropostTHandler(NewebeAuthHandler):
    '''
    This handler allows to retrieve micropost at HTML format.
    * GET: Return for given id the HTML representation of corresponding 
           micropost.
    '''
    
    def get(self, postId):
        '''
        Returns for given id the HTML representation of corresponding 
        micropost.
        '''

        micropost = MicroPostManager.getMicropost(postId)
        if micropost:   
            self.render("../templates/news/micropost.html", micropost=micropost)
        else:
            raise HTTPError("Micropost not found.", 404)


class MyNewsHandler(NewebeAuthHandler):
    '''
    This handler handles request that retrieve lists of news published by
    Newebe owner.
    GET : Retrieve last 10 microposts published before a given date by owner.
    '''

    def get(self, startKey=None):
        '''
        Return microposts by pack of NEWS_LIMIT at JSON format. If a start key 
        is given in URL (it means a date like 2010-10-05-12-30-48), 
        microposts from this date are returned. Else latest news are returned. 
        Only microposts published by Newebe owner are returned.

        Arguments:
            *startKey* The date from where news should be returned.
        '''

        microposts = list()

        if startKey:
            dateString = getDbDateFromUrlDate(startKey)
            microposts = MicroPostManager.getMine(dateString)

        else:
            microposts = MicroPostManager.getMine()

        self.returnJson(json_util.getJsonFromDocList(microposts))
    

class NewsTHandler(NewebeAuthHandler):
    def get(self):
        self.render("../templates/news/news.html")


class NewsContentTHandler(NewebeAuthHandler):
    def get(self):
        self.render("../templates/news/news_content.html")


class NewsTutorial1THandler(NewebeAuthHandler):
    def get(self):
        self.render("../templates/news/tutorial_1.html")


class NewsTutorial2THandler(NewebeAuthHandler):
    def get(self):
        self.render("../templates/news/tutorial_2.html")

