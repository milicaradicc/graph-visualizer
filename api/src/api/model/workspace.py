from typing import List, Union, TYPE_CHECKING
from datetime import datetime

from . import Graph


if TYPE_CHECKING:
    from . import Filter, Search

class Workspace(object):
    def __init__(self, id, graph: Graph, name: str, filters: List['Filter'], searches: List['Search']):
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
        """
        Returns a subgraph of the current graph filtered by the workspace's filters.
        """
        if not self._filters:
            return self._graph

        filtered_nodes = [
            node for node in self._graph.nodes
            if all(filter_obj(node) for filter_obj in self._filters)
        ]
        filtered_node_ids = {node.id for node in filtered_nodes}

        filtered_edges = [
            edge for edge in self._graph.edges
            if edge.src.id in filtered_node_ids and edge.dest.id in filtered_node_ids
        ]

        return Graph(filtered_nodes, filtered_edges, self._graph.directed)

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
    def filters(self) -> List['Filter']:
        return self._filters

    @filters.setter
    def filters(self, value: List['Filter']):
        self._filters = value

    @property
    def searches(self) -> List['Search']:
        return self._searches

    @searches.setter
    def searches(self, value: List['Search']):
        self._searches = value

    def add_filter(self, attribute: str, operator: str, value: Union[str, int, float, datetime]):
        from . import Filter, FilterOperator
        self._filters.append(Filter(attribute, FilterOperator(operator), value))

    def remove_filter(self, filter_id):
        self._filters = [f for f in self._filters if f.id != filter_id]