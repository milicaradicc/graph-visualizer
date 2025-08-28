from datetime import datetime
from typing import Union, List
import json
import uuid

from api.model import Graph, Node, Edge
from api.components import DataSourcePlugin, DataSourceParameter


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
        self._initialize_graph()

    def _initialize_graph(self):
        self.nodes: dict[str, Node] = {}
        self.edges: set[tuple[str, str]] = set()
        self.id_index: dict[str, str] = {}

    def name(self) -> str:
        return "JsonDataSource"

    def identifier(self) -> str:
        return "JsonDataSource"

    def get_parameters(self) -> List[DataSourceParameter]:
        return [
            DataSourceParameter(
                'file_path',
                str,
                'File path'
            )
        ]

    def load(self, **kwargs) -> Graph:
        """Load JSON data, parse nodes and edges into a Graph."""
        self._initialize_graph()
        file_path = kwargs["file_path"]
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self._collect_nodes(data)
        self._collect_edges(data)

        edge_objs = [Edge(self.nodes[src], self.nodes[tgt]) for src, tgt in self.edges]
        return Graph(list(self.nodes.values()), edge_objs, True)

    def _collect_nodes(self, item):
        """Recursively collect nodes from dicts/lists."""
        if isinstance(item, dict):
            node_id = item.get("id", str(uuid.uuid4()))
            if node_id not in self.nodes:
                new_node = Node(node_id, {
                    k: convert_json_value(v)
                    for k, v in item.items() if not isinstance(v, (dict, list))
                })
                self.nodes[node_id] = new_node
                if "id" in item:
                    self.id_index[item["id"]] = node_id
            for v in item.values():
                if isinstance(v, (dict, list)):
                    self._collect_nodes(v)
        elif isinstance(item, list):
            for elem in item:
                self._collect_nodes(elem)

    def _collect_edges(self, item, parent_id=None):
        """Recursively collect edges based on references and nested structures."""
        if isinstance(item, dict):
            node_id = self._resolve_node_id(item)
            if not node_id:
                scalar_data = {k: convert_json_value(v) for k, v in item.items() if not isinstance(v, (dict, list))}
                node_id = self._resolve_node_id(scalar_data)
            if not node_id:
                return

            for key, value in item.items():
                if isinstance(value, list):
                    for ref in value:
                        child_id = self._resolve_node_id(ref)
                        if child_id:
                            self.edges.add((node_id, child_id))
                elif isinstance(value, dict):
                    child_id = self._resolve_node_id(value)
                    if child_id:
                        self.edges.add((node_id, child_id))

            for value in item.values():
                if isinstance(value, (dict, list)):
                    self._collect_edges(value, node_id)

        elif isinstance(item, list):
            for elem in item:
                self._collect_edges(elem, parent_id)
        elif isinstance(item, str) and parent_id:
            child_id = self.id_index.get(item)
            if child_id:
                self.edges.add((parent_id, child_id))

    def _resolve_node_id(self, value):
        """Resolve node id from a string, dict with id, or by matching scalar data."""
        if isinstance(value, str):
            return self.id_index.get(value)
        if isinstance(value, dict):
            if "id" in value:
                return value["id"]
            scalar_data = {k: v for k, v in value.items() if not isinstance(v, (dict, list))}
            for nid, node in self.nodes.items():
                if node.data == scalar_data:
                    return nid
        return None