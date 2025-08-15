from . import Graph
from typing import List, Tuple

class Workspace(object):
    def __init__(self, graph: Graph, filters: List[Tuple[str, str, str]], searches: List[str]):
        self._graph = graph
        self._filters = filters
        self._searches = searches