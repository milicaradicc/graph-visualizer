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
        Returns a subgraph of the current graph filtered by the workspace's filters and searches.
        """
        if not self._graph:
            return None

        nodes = self._graph.nodes

        if self._filters:
            nodes = [
                node for node in nodes
                if all(filter_obj(node) for filter_obj in self._filters)
            ]

        if self._searches:
            nodes = [
                node for node in nodes
                if any(search_obj(node) for search_obj in self._searches)
            ]

        filtered_node_ids = {node.id for node in nodes}

        filtered_edges = [
            edge for edge in self._graph.edges
            if edge.src.id in filtered_node_ids and edge.dest.id in filtered_node_ids
        ]

        return Graph(nodes, filtered_edges, self._graph.directed)

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

    def add_search(self, query: str):
        from . import Search
        self._searches.append(Search(query))

    def remove_search(self, search_id):
        self._searches = [s for s in self._searches if s.id != search_id]