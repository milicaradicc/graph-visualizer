from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name="index"),
    path("plugin/<str:plugin_identifier>/params/", views.get_plugin_params, name="get_plugin_params"),
    path('plugin/visualizer/set', views.set_current_visualizer, name='set_current_visualizer'),
    path("load-data/", views.load_data, name="load_data"),
    path("workspace/add/", views.add_workspace, name="add_workspace"),
    path("workspace/set/", views.set_workspace, name="set_workspace"),
    path("workspace/edit/", views.edit_workspace, name="edit_workspace"),
    path('search/', views.add_search, name='add_search'),
    path('remove-search/', views.remove_search, name='remove_search'),
    path('filter/', views.add_filter, name='add_filter'),
    path('remove-filter/', views.remove_filter, name='remove_filter'),
    path("workspace/cli/", views.run_cli_command, name="run_cli_command"),
]
