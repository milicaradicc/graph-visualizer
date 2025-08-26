from typing import List, Union, TYPE_CHECKING
from datetime import datetime

from . import Graph, Node, Edge

if TYPE_CHECKING:
    from . import Filter, Search

class Workspace(object):
    def __init__(self, id, graph: Graph, name: str, filters: List['Filter'], searches: List['Search']):
        self._graph = graph
        self._filters = filters
        self._searches = searches
        self._name = name
        self._id = id
        self._cli_history=[] #always initialize

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

    @property
    def cli_history(self) -> List[str]:
        return self._cli_history

    def add_node(self,node:Node):
        if any(n.id == node.id for n in self._graph.nodes):
            return False
        self._graph.nodes.append(node)
        return True

    def edit_node(self,node_id:str,**attributes):
        node = next((n for n in self._graph.nodes if n.id == node_id), None)
        if not node:
            return False
        node.data.update(attributes)
        return True

    def delete_node(self,node_id: str):
        node = next((n for n in self._graph.nodes if n.id == node_id), None)
        if not node:
            return False
        self._graph.nodes = [n for n in self._graph.nodes if n.id != node_id]
        self._graph.edges = [e for e in self._graph.edges if e.src.id != node_id and e.dest.id != node_id]
        return True

    def add_edge(self,parent_id: str, child_id: str):
        src = next((n for n in self._graph.nodes if n.id == parent_id), None)
        dest = next((n for n in self._graph.nodes if n.id == child_id), None)
        if not src or not dest:
            return False
        if any(e.src.id == parent_id and e.dest.id == child_id for e in self._graph.edges):
            return False
        self._graph.edges.append(Edge(src, dest))
        return True

    def edit_edge(self,old_parent: str, old_child: str, new_parent: str, new_child:str):
        edge = next((e for e in self._graph.edges if e.src.id == old_parent and e.dest.id == old_child), None)
        if not edge:
            return False
        src = next((n for n in self._graph.nodes if n.id == new_parent), None)
        dest = next((n for n in self._graph.nodes if n.id == new_child), None)
        if not src or not dest:
            return False
        edge.src = src
        edge.dest = dest
        return True

    def delete_edge(self,parent_id: str, child_id: str):
        initial_len = len(self._graph.edges)
        self._graph.edges = [e for e in self._graph.edges if
                                          not (e.src.id == parent_id and e.dest.id == child_id)]
        if len(self._graph.edges) == initial_len:
            return False
        return True

    def clean_start(self):
        """Remove all nodes and edges from the graph"""
        self._graph.nodes=[]
        self._graph.edges=[]

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

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "graph": {
                "nodes": [n.to_dict() for n in self.graph.nodes],
                "edges": [e.to_dict() for e in self.graph.edges],
            } if self.graph else None,
            "searches": [s.to_dict() for s in self.searches],
            "filters": [f.to_dict() for f in self.filters],
        }