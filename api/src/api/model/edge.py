from typing import Dict, Any

from . import Node

class Edge(object):
    def __init__(self, src: Node, dest: Node):
        self._src = src
        self._dest = dest

    @property
    def src(self) -> Node:
        return self._src

    @src.setter
    def src(self, value: Node):
        if not isinstance(value, Node):
            raise TypeError('Source must be of type Node')
        self._src = value

    @property
    def dest(self) -> Node:
        return self._dest

    @dest.setter
    def dest(self, value: Node):
        if not isinstance(value, Node):
            raise TypeError('Destination must be of type Node')
        self._dest = value

    def to_dict(self) -> Dict[str, Any]:
        """Convert Edge to dictionary for JSON serialization"""
        return {
            "src": self._src.id,  # Only store IDs to avoid circular references
            "dest": self._dest.id
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], nodes_lookup: Dict[str, Node]) -> 'Edge':
        """Create Edge from dictionary using nodes lookup"""
        src_node = nodes_lookup[data["src"]]
        dest_node = nodes_lookup[data["dest"]]
        return cls(src_node, dest_node)

    def __str__(self):
        return f"{self.src.id} -> {self.dest.id}"

