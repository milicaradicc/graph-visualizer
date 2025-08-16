from typing import Optional
from api.model import Graph
from .interfaces import GraphRepository
from ..services.mock_graph_generator import generate_mock_graph

class MockGraphRepository(GraphRepository):
    def __init__(self, graph: Optional[Graph] = None):
        self._graph = graph or generate_mock_graph()

    def get_graph(self) -> Optional[Graph]:
        return self._graph

    def save_graph(self, graph: Graph) -> None:
        self._graph = graph
        print("Graph saved in mock repository.")

    def delete_graph(self) -> None:
        self._graph = None
        print("Graph deleted from mock repository.")

    def has_graph(self) -> bool:
        return self._graph is not None
