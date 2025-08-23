from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name="index"),
    path("plugin/<str:plugin_identifier>/params/", views.get_plugin_params, name="get_plugin_params"),
    path("load-data/", views.load_data, name="load_data"),
    path("workspace/add/", views.add_workspace, name="add_workspace"),
    path("workspace/set/", views.set_workspace, name="set_workspace"),
    path("workspace/edit/", views.edit_workspace, name="edit_workspace"),
    path('search/', views.add_search, name='add_search'),
    path('remove-search/', views.remove_search, name='remove_search'),
]
