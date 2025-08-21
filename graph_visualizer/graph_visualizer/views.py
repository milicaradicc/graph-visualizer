from django.http import JsonResponse
from django.shortcuts import render
from core.use_cases import WorkspaceService, PluginService
from django.apps import apps
from django.shortcuts import redirect
from django.contrib import messages
from .apps import datasource_group,visualizer_group


def index(request):
    plugin_service: PluginService = apps.get_app_config('graph_visualizer').plugin_service
    datasource_plugins = plugin_service.plugins[datasource_group]
    workspace_service: WorkspaceService = apps.get_app_config('graph_visualizer').workspace_service
    graph=workspace_service.get_current_workspace().graph
    visualizer_plugins = plugin_service.plugins[visualizer_group]
    return render(request, 'index.html', {
        'title': 'Index',
        'datasource_plugins': datasource_plugins,
        'workspaces':workspace_service.get_workspaces(),
        'current_workspace': workspace_service.get_current_workspace(),
        'block_visualizer_html':'' if graph is None else visualizer_plugins[0].visualize(graph)})

