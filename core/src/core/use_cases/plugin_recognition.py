from importlib.metadata import entry_points
from typing import List

from api.components import DataSourcePlugin, VisualizerPlugin


class PluginService(object):
    def __init__(self):
        self.plugins: dict[str, List[DataSourcePlugin | VisualizerPlugin]] = {}
        self._current_visualizer: VisualizerPlugin | None = None

    def load_plugins(self, group: str):
        """
        Dynamically loads plugins based on entrypoint group.
        """
        self.plugins[group] = []
        for ep in entry_points(group=group):
            p = ep.load()
            plugin = p()
            self.plugins[group].append(plugin)

    def get_current_visualizer(self) -> VisualizerPlugin | None:
        return self._current_visualizer

    def set_current_visualizer(self, visualizer: VisualizerPlugin):
        visualizer_group = "visualizer_group"
        if visualizer_group in self.plugins and visualizer not in self.plugins[visualizer_group]:
            raise ValueError("Visualizer is not loaded in the plugin service.")
        self._current_visualizer = visualizer
