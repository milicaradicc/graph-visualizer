import os
import json
from datetime import datetime, date
from jinja2 import Environment, FileSystemLoader
from api.components import VisualizerPlugin

def serialize_node(node):
    new_node = {}
    for k, v in node.items():
        if isinstance(v, (datetime, date)):
            new_node[k] = v.isoformat()
        else:
            new_node[k] = v
    return new_node

class BlockVisualizer(VisualizerPlugin):
    def __init__(self):
        template_path = os.path.join(os.path.dirname(__file__), "templates")
        self.env = Environment(loader=FileSystemLoader(template_path))

    def visualize(self, data):
        try:
            template_path = os.path.join(os.path.dirname(__file__), "templates")

            self.env = Environment(loader=FileSystemLoader(template_path))

            template = self.env.get_template("block_view.html")

            if not isinstance(data, dict):
                data = {"nodes": [], "edges": []}

            data.setdefault("nodes", [])
            data.setdefault("edges", [])

            data["nodes"] = [serialize_node(node) for node in data["nodes"]]

            for node in data["nodes"]:
                node.setdefault("id", "unknown")
                node.setdefault("label", node.get("id", ""))
                node.setdefault("color", "#69b3a2")

            graph_json = json.dumps(data)

            rendered_html = template.render(graph_html=graph_json)
            return rendered_html

        except Exception as e:
            return f"<p>Error in visualization: {e}</p>"

    def name(self) -> str:
        return "Block Visualizer"

    def identifier(self) -> str:
        return "block_visualizer"
