from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.auth.decorators import login_required
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.generic import TemplateView
from tastypie.api import Api

from apps.api.res import BuildingResource, EdgeResource, NodeResource, RouteResource

v1_api = Api(api_name='v1')
v1_api.register(BuildingResource())
v1_api.register(EdgeResource());
v1_api.register(NodeResource());
v1_api.register(RouteResource())

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/', include(v1_api.urls)),
    url(r'^accounts/login/', 'apps.account.views.login_view'),
    url(r'^accounts/logout/', 'apps.account.views.logout_view'),
    url(r'^visualizations/', TemplateView.as_view(template_name='visualizations.html')),
    url(r'^contact/', TemplateView.as_view(template_name='contact.html')),
    url(r'^edit/', login_required(TemplateView.as_view(template_name='edit.html'))),
    url(r'^$', TemplateView.as_view(template_name='home.html')),
) + staticfiles_urlpatterns()
