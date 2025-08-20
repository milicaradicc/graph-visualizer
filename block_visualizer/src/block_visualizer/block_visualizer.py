from pathlib import Path
from jinja2 import Environment, FileSystemLoader

from api.components import VisualizerPlugin
from api.model import Graph
from .util import _convert_nodes_to_dict, _convert_edges_to_dict, _custom_tojson


class BlockVisualizer(VisualizerPlugin):
    """A block-style graph visualizer that renders nodes and edges using HTML templates."""

    TEMPLATE_NAME = "block_visualizer_template.html"
    PLUGIN_NAME = "Block Visualizer"
    PLUGIN_IDENTIFIER = "block_visualizer"

    def __init__(self) -> None:
        """Initialize the visualizer with Jinja2 template environment."""
        self._setup_template_environment()

    def _setup_template_environment(self) -> None:
        """Configure Jinja2 environment with custom filters and template loader."""
        template_path = Path(__file__).parent / "templates"
        if not template_path.exists():
            raise FileNotFoundError(f"Template folder not found: {template_path}")

        self._environment = Environment(loader=FileSystemLoader(str(template_path)))
        self._environment.filters['tojson'] = _custom_tojson
        self._template = self._environment.get_template(self.TEMPLATE_NAME)

    def visualize(self, data: Graph) -> str:
        """
        Generate HTML visualization of the graph data.

        """
        if not hasattr(data, "nodes") or not hasattr(data, "edges"):
            raise TypeError("Expected Graph object with 'nodes' and 'edges'")

        nodes_list = _convert_nodes_to_dict(data.nodes)
        edges_list = _convert_edges_to_dict(data.edges)
        directed = getattr(data, "directed", False)

        return self._template.render(
            nodes=nodes_list,
            edges=edges_list,
            directed=directed,
            name=self.identifier()
        )

    def name(self) -> str:
        """Return the human-readable name of the plugin."""
        return self.PLUGIN_NAME

    def identifier(self) -> str:
        """Return the unique identifier for the plugin."""
        return self.PLUGIN_IDENTIFIER
