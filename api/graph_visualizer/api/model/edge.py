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

    def __str__(self):
        return f"{self.src} -> {self.dest}"