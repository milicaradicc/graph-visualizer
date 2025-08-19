import json
import os
from datetime import datetime, date
from pathlib import Path
from typing import List, Dict, Any

from jinja2 import Environment, FileSystemLoader

from api.components import VisualizerPlugin
from api.model.graph import Graph


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime and date objects."""

    def default(self, obj: Any) -> str:
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


def _convert_nodes_to_dict(nodes) -> List[Dict[str, Any]]:
    """Convert node objects to dictionary representation."""
    return [
        {
            'id': node.id,
        }
        for node in nodes
    ]


def _convert_edges_to_dict(edges) -> List[Dict[str, str]]:
    """Convert edge objects to dictionary representation."""
    return [
        {
            'source': edge.src.id,
            'target': edge.dest.id
        }
        for edge in edges
    ]


def _custom_tojson(obj: Any, **kwargs) -> str:
    """Custom JSON serialization filter for Jinja2 templates."""
    return json.dumps(obj, cls=DateTimeEncoder, **kwargs)


class SimpleVisualizer(VisualizerPlugin):
    """A simple graph visualizer that renders nodes and edges using HTML templates."""

    TEMPLATE_NAME = "simple_visualizer_template.html"
    PLUGIN_NAME = "Simple Visualizer"
    PLUGIN_IDENTIFIER = "simple_visualizer"

    def __init__(self) -> None:
        """Initialize the visualizer with Jinja2 template environment."""
        self._setup_template_environment()

    def _setup_template_environment(self) -> None:
        """Configure Jinja2 environment with custom filters and template loader."""
        template_path = Path(__file__).parent / "templates"

        self._environment = Environment(
            loader=FileSystemLoader(str(template_path))
        )

        # Register custom JSON filter that handles datetime objects
        self._environment.filters['tojson'] = _custom_tojson
        self._template = self._environment.get_template(self.TEMPLATE_NAME)

    def visualize(self, data: Graph) -> str:
        """
        Generate HTML visualization of the graph data.

        Args:
            data: Graph object containing nodes and edges

        Returns:
            Rendered HTML string
        """
        nodes_list = _convert_nodes_to_dict(data.nodes)
        edges_list = _convert_edges_to_dict(data.edges)

        return self._template.render(
            nodes=nodes_list,
            edges=edges_list,
            directed=data.directed,
            name=self.identifier()
        )

    def name(self) -> str:
        """Return the human-readable name of the plugin."""
        return self.PLUGIN_NAME

    def identifier(self) -> str:
        """Return the unique identifier for the plugin."""
        return self.PLUGIN_IDENTIFIER