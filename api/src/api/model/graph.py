from typing import List
from . import Node, Edge

# TODO: Document methods
class Graph(object):
    def __init__(self, nodes: List[Node], edges: List[Edge], directed: bool):
        self._nodes = nodes
        self._edges = edges
        self._directed = directed

    @property
    def nodes(self) -> List[Node]:
        return self._nodes

    @nodes.setter
    def nodes(self, value: List[Node]):
        if not isinstance(value, list):
            raise TypeError('Nodes must be a list')
        for node in value:
            if not isinstance(node, Node):
                raise TypeError('All items in the list must be of type Node')
        self._nodes = value

    @property
    def edges(self) -> List[Edge]:
        return self._edges

    @edges.setter
    def edges(self, value: List[Edge]):
        if not isinstance(value, list):
            raise TypeError('Edges must be a list')
        for edge in value:
            if not isinstance(edge, Edge):
                raise TypeError('All items in the list must be of type Edge')
        self._edges = value

    def __str__(self):
        nodes_str = "\n".join(str(node) for node in self.nodes)
        edges_str = "\n".join(str(edge) for edge in self.edges)
        return f"Nodes:\n{nodes_str}\nEdges:\n{edges_str}"

    @property
    def directed(self):
        return self._directed

    @directed.setter
    def directed(self, value: bool):
        if not isinstance(value, bool):
            raise TypeError('Directed must be a boolean')
        self._directed = value