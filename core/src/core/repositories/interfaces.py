from abc import ABC, abstractmethod
from typing import Optional
from api.model import Graph

class GraphRepository(ABC):
    @abstractmethod
    def get_graph(self) -> Optional[Graph]:
        """Retrieve a graph or None if not found."""
        pass

    @abstractmethod
    def save_graph(self, graph: Graph) -> None:
        """Save or update a graph."""
        pass

    @abstractmethod
    def delete_graph(self) -> None:
        """Delete the graph."""
        pass

    @abstractmethod
    def has_graph(self) -> bool:
        """Return True if a graph is present."""
        pass
