from . import Plugin
from abc import abstractmethod

class VisualizerPlugin(Plugin):
    """
    Base class for visualization plugins.
    """

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def visualize(self, data):
        """
        Method to visualize the data.
        Should be implemented by subclasses.
        """
        pass