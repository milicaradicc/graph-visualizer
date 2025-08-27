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
        if visualizer_group in self.plugin_service.plugins and self.plugin_service.plugins[visualizer_group] and len(self.plugin_service.plugins[visualizer_group]) != 0:
            self.plugin_service.set_current_visualizer(self.plugin_service.plugins[visualizer_group][0])
