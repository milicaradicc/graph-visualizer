from django.apps import AppConfig
from core.use_cases import PluginService
from core.use_cases import WorkspaceService

datasource_group = 'core.datasource'
visualizer_group = 'core.visualizer'


class GraphVisualizerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'graph_visualizer'

    plugin_service = PluginService()
    workspace_service = WorkspaceService()

    def ready(self):
        self.plugin_service.load_plugins(datasource_group)
        self.plugin_service.load_plugins(visualizer_group)
