"""
URL configuration for graph_visualizer project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

urlpatterns = [
    path('', views.index, name="index"),
    path("plugin/<str:plugin_identifier>/params/", views.get_plugin_params, name="get_plugin_params"),
    path("load-data/", views.load_data, name="load_data"),
    path("workspace/add/", views.add_workspace, name="add_workspace"),
    path("workspace/set/", views.set_workspace, name="set_workspace"),
    path("workspace/edit/", views.edit_workspace, name="edit_workspace"),
]
