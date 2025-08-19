from pathlib import Path
from jinja2 import Environment, FileSystemLoader

from api.components import VisualizerPlugin
from api.model.graph import Graph

from .util import convert_nodes_to_dict, convert_edges_to_dict, custom_tojson


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

        self._environment = Environment(loader=FileSystemLoader(str(template_path)))
        self._environment.filters['tojson'] = custom_tojson
        self._template = self._environment.get_template(self.TEMPLATE_NAME)

    def visualize(self, data: Graph) -> str:
        """Generate HTML visualization of the graph data."""
        nodes_list = convert_nodes_to_dict(data.nodes)
        edges_list = convert_edges_to_dict(data.edges)

        return self._template.render(
            nodes=nodes_list,
            edges=edges_list,
            directed=data.directed,
            name=self.identifier()
        )

    def name(self) -> str:
        return self.PLUGIN_NAME

    def identifier(self) -> str:
        return self.PLUGIN_IDENTIFIER
