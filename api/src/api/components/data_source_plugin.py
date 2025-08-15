from . import Plugin
from ..model import Graph
from abc import abstractmethod


class DataSourcePlugin(Plugin):
    """
    An abstraction representing a plugin for loading data from a specific data source.
    """

    @abstractmethod
    def load(self, **kwargs) -> Graph:
        """
        Loads data from the data source and returns it as `Graph` object.

        :param kwargs: Arbitrary keyword arguments for customization or filtering of the data loading process.
        :type kwargs: dict
        :return: A `Graph` object loaded from the data source.
        :rtype: Graph
        """
        pass