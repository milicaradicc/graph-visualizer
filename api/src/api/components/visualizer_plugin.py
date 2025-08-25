from . import Plugin
from abc import abstractmethod

class VisualizerPlugin(Plugin):
    """
    Base class for visualization plugins.
    """

    # todo: restrictions
    @abstractmethod
    def visualize(self, data):
        """
        Method to visualize the data.
        Should be implemented by subclasses.
        """
        pass