from . import Graph
from typing import List, Tuple


class Workspace(object):
    def __init__(self, id, graph: Graph, name: str, filters: List[Tuple[str, str, str]], searches: List[str]):
        self._graph = graph
        self._filters = filters
        self._searches = searches
        self._name = name
        self._id = id

    @property
    def id(self) -> int:
        return self._id

    @property
    def graph(self) -> Graph:
        return self._graph

    @graph.setter
    def graph(self, value: Graph):
        self._graph = value

    @property
    def name(self) -> str:
        return self._name

    @name.setter
    def name(self, value: str):
        self._name = value

    @property
    def filters(self) -> List[Tuple[str, str, str]]:
        return self._filters

    @filters.setter
    def filters(self, value: List[Tuple[str, str, str]]):
        self._filters = value

    @property
    def searches(self) -> List[str]:
        return self._searches

    @searches.setter
    def searches(self, value: List[str]):
        self._searches = value
