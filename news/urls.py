from django.conf.urls.defaults import patterns

from newebe.lib.rest import DirectTemplateResource
from newebe.news.views import MicroPostResource

news_item_handler = MicroPostResource()

urlpatterns = patterns('',
    (r'^$', 
        DirectTemplateResource("news/news.html")),
    (r'^content/$', 
        DirectTemplateResource("news/news_content.html")),

    (r'^microposts/$', 
        news_item_handler),
    (r'^microposts/(?P<startKey>[0-9\-]+)/$', 
        news_item_handler),
)
