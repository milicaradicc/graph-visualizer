from . import Plugin
from ..model import Graph
from abc import abstractmethod
from typing import Type, List


class DataSourceParameter(object):
    """
    Represents a single configuration parameter required by a DataSourcePlugin.
    """

    def __init__(self, name: str, param_type: Type, display_name: str):
        self._name = name
        self._param_type = param_type
        self._display_name = display_name

    @property
    def name(self) -> str:
        return self._name

    @name.setter
    def name(self, value: str) -> None:
        self._name = value

    @property
    def param_type(self) -> Type:
        return self._param_type

    @param_type.setter
    def param_type(self, value: Type) -> None:
        self._param_type = value

    @property
    def display_name(self) -> str:
        return self._display_name

    @display_name.setter
    def display_name(self, value: str) -> None:
        self._display_name = value


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

    @abstractmethod
    def get_parameters(self) -> List[DataSourceParameter]:
        """
        Returns a list of configuration parameters required by this data source plugin.

        :return: List of DataSourceParameter objects describing required parameters.
        :rtype: List[DataSourceParameter]
        """
        pass
