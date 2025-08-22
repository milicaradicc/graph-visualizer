from datetime import datetime
from typing import Union
import json

from api.model import Graph, Node, Edge
from api.components import DataSourcePlugin


def convert_json_value(value) -> Union[int, float, str, datetime]:
    """Convert a JSON value into int, float, str, or datetime if possible."""
    if isinstance(value, str):
        for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S"):
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
        return value
    if isinstance(value, (int, float)):
        return value
    return str(value)

class JsonDataSource(DataSourcePlugin):
    def __init__(self):
        self.nodes: dict[str, Node] = {}
        self.edges_ids: set[tuple[str, str]] = set()

    def name(self) -> str:
        return "JsonDataSource"

    def identifier(self) -> str:
        return "JsonDataSource"

    def load(self, **kwargs) -> Graph:
        file_path = kwargs["file_path"]

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, list):
            for item in data:
                self._process_item(item)
        elif isinstance(data, dict):
            self._process_item(data)
        else:
            raise ValueError("JSON root must be a dict or a list of dicts")

        edge_objs = [Edge(self.nodes[src], self.nodes[tgt]) for src, tgt in self.edges_ids]
        return Graph(list(self.nodes.values()), edge_objs, True)

    def _process_item(self, item, parent_id=None):
        if isinstance(item, dict):
            node_id = item["id"]
            if node_id not in self.nodes:
                new_node = Node(node_id, {})
                for key, value in item.items():
                    if not isinstance(value, (dict, list)):
                        new_node.data[key] = convert_json_value(value)
                    else:
                        child_id = self._process_item(value, node_id)
                        if child_id:
                            self.edges_ids.add((node_id, child_id))
                self.nodes[node_id] = new_node

            if parent_id:
                self.edges_ids.add((parent_id, node_id))
            return node_id

        elif isinstance(item, list):
            for elem in item:
                child_id = self._process_item(elem, parent_id)
                if parent_id and child_id:
                    self.edges_ids.add((parent_id, child_id))
            return None

        else:
            if isinstance(item, str): #item is node id (reference)
                if parent_id:
                    self.edges_ids.add((parent_id, item))
                return item
            return None