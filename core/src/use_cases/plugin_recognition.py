from importlib.metadata import entry_points
from typing import List

from api.components import DataSourcePlugin, VisualizerPlugin


class PluginService(object):
    def __init__(self):
        self.plugins: dict[str, List[DataSourcePlugin | VisualizerPlugin]] = {}

    def load_plugins(self, group: str):
        """
        Dynamically loads plugins based on entrypoint group.
        """
        self.plugins[group] = []
        for ep in entry_points(group=group):
            p = ep.load()
            plugin = p()
            self.plugins[group].append(plugin)