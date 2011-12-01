# -*- coding: utf-8 -*-
import sys

from lettuce import step, world, before

sys.path.append("../../../")
from newebe.settings import TORNADO_PORT
from newebe.lib.test_util import NewebeClient

from newebe.pictures.models import PictureManager

SECOND_NEWEBE_ROOT_URL = u"http://localhost:%d/" % (TORNADO_PORT + 10)

@before.all
def set_browers():
    world.browser = NewebeClient()
    world.browser.set_default_user()
    world.browser.login("password")

    world.browser2 = NewebeClient()
    world.browser2.root_url = SECOND_NEWEBE_ROOT_URL
    world.browser2.login("password")


# Models

@step(u'When I get last pictures')
def when_i_get_last_pictures(step):
    world.pictures = PictureManager.get_last_pictures()

@step(u'I have three pictures ordered by date')
def i_have_three_pictures_ordered_by_date(step):
    assert 3 == len(world.pictures)
    assert world.pictures[1].date <  world.pictures[0].date
    assert world.pictures[2].date <  world.pictures[1].date

@step(u'When I get first from its id')
def when_i_get_first_from_its_id(step):
    world.picture = PictureManager.get_picture(world.createdPictures[0]._id)

@step(u'I have one picture corresponding to id')
def i_have_one_picture_correponsding_to_id(step):
    assert world.createdPictures[0]._id == world.picture._id


# Handlers

@step(u'Clear all pictures')
def clear_all_pictures(step):
    pictures = PictureManager.get_last_pictures()
    while pictures:
        for picture in pictures:
            picture.delete()
        pictures = PictureManager.get_last_pictures()
                
@step(u'From seconde Newebe, clear all pictures')
def from_seconde_newebe_clear_all_pictures(step):
    pictures = world.brower2.fetch_documents("pictures/last/")
    while pictures:
        for picture in pictures:
            world.browser2.delete("pictures/%s/" % picture["_id"])
        pictures = world.brower2.fetch_documents("pictures/last/")

@step(u'Post a new picture via the dedicated resource')
def post_a_new_picture_via_the_dedicated_resource(step):
    file = open("test.jpg", "r")
    assert False, 'This step must be implemented'

@step(u'Retrieve last pictures')
def retrieve_last_pictures(step):
    world.pictures = world.brower.fetch_documents("pictures/last/")

@step(u'Download first returned picture')
def download_first_returned_picture(step):
    assert False, 'This step must be implemented'    

@step(u'Ensure it is the same that posted picture')
def ensure_it_is_the_same_that_posted_picture(step):
    assert False, 'This step must be implemented'

@step(u'Retrieve last activities')
def retrieve_last_activities(step):
    world.activities = world.brower.fetch_documents("activities/")

@step(u'Check that last activity correspond to a picture creation')
def check_that_last_activity_correspond_to_a_picture_creation(step):
    assert len(world.activities) >= 1
    activity = world.activties[0]
    assert activity["verb"] == "posted"
    assert activity["docType"] == "Picture"

@step(u'From second Newebe, retrieve last pictures')
def from_second_newebe_retrieve_last_pictures(step):
    world.pictures = world.brower2.fetch_documents("pictures/last/")

@step(u'From second Newebe, retrieve last activities')
def from_second_newebe_retrieve_last_activities(step):
    world.activities = world.brower2.fetch_documents("activities/")

@step(u'Add three pictures to the database with different dates')
def add_three_pictures_to_the_database_with_different_dates(step):
    assert False, 'This step must be implemented'

@step(u'Retrieve all pictures through handlers')
def retrieve_all_pictures_through_handlers(step):
    world.pictures = world.browser.fetch_documents("pictures/")

@step(u'Check that there is three pictures with the most recent one as first picture')
def check_that_there_is_three_pictures_with_the_most_recent_one_as_first_picture(step):
    assert 3 == len(world.pictures)
    assert world.pictures[1].get("date", None) <  \
            world.pictures[0].get("date", None)
    assert world.pictures[2].get("date", None) <  \
            world.pictures[1].get("date", None)

@step(u'Retrieve first picture hrough handler via its ID.')
def retrieve_first_picture_hrough_handler_via_its_id(step):
    assert False, 'This step must be implemented'

@step(u'Check that picture title is the same that first picture')
def check_that_picture_title_is_the_same_that_first_picture(step):
    assert world.picture.title == world.pictures[0].get("title", "")

@step(u'Through handler delete first picture')
def through_handler_delete_first_picture(step):
    activity = world.activities[0]
    world.browser.delete("pictures/%s/" + activity.get("_id", ""))

@step(u'Check that there are no picture')
def check_that_there_are_no_picture(step):
    assert 0 == len(world.pictures) 

@step(u'Check that last activity correspond to a picture deletion')
def check_that_last_activity_correspond_to_a_picture_deletion(step):
    activity = world.activities[0]
    assert "deletes" == activity.get("verb", "")
    assert "Picture" == activity.get("docType", "")
    assert "DELETE" == activity.get("method", "")

