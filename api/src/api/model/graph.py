import json
from typing import List, Dict, Any
from . import Node, Edge

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

    @property
    def directed(self):
        return self._directed

    @directed.setter
    def directed(self, value: bool):
        if not isinstance(value, bool):
            raise TypeError('Directed must be a boolean')
        self._directed = value

    def to_dict(self) -> Dict[str, Any]:
        """Convert Graph to dictionary for JSON serialization"""
        return {
            "nodes": [node.to_dict() for node in self._nodes],
            "edges": [edge.to_dict() for edge in self._edges],
            "directed": self._directed
        }

    def to_json(self, indent: int = None) -> str:
        """Convert Graph to JSON string"""
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Graph':
        """Create Graph from dictionary (for deserialization)"""
        # First create all nodes
        nodes = [Node.from_dict(node_data) for node_data in data["nodes"]]

        # Create lookup dictionary for nodes by ID
        nodes_lookup = {node.id: node for node in nodes}

        # Create edges using the nodes lookup
        edges = [Edge.from_dict(edge_data, nodes_lookup) for edge_data in data["edges"]]

        return cls(nodes, edges, data["directed"])

    @classmethod
    def from_json(cls, json_str: str) -> 'Graph':
        """Create Graph from JSON string"""
        data = json.loads(json_str)
        return cls.from_dict(data)

    def __str__(self):
        nodes_str = "\n".join(str(node) for node in self.nodes)
        edges_str = "\n".join(str(edge) for edge in self.edges)
        return f"Nodes:\n{nodes_str}\nEdges:\n{edges_str}"

