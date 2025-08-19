import os
import pickle
from typing import List, Tuple

import requests
from dateutil.parser import parse as parse_date
from packaging.requirements import Requirement

from api.components import DataSourcePlugin
from api.model import Edge, Graph, Node

from .models import Package


class PyPIDatasource(DataSourcePlugin):
    def __init__(self):
        super().__init__()
        self._cache_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "cache")
        )
        os.makedirs(self._cache_dir, exist_ok=True)

    def name(self) -> str:
        return "PyPI Datasource"

    def identifier(self) -> str:
        return "pypi_datasource"

    def load(self, **kwargs) -> Graph:
        start_package = kwargs.get("start_package", "requests")
        depth = kwargs.get("depth", 1)
        cache_file = os.path.join(
            self._cache_dir, f"pypi_graph_{start_package}_{depth}.pkl"
        )

        graph = self._load_graph_from_file(cache_file)
        if graph:
            return graph

        nodes = {}
        edges = []
        to_visit = [(start_package, 0)]
        visited = set()

        while to_visit:
            package_name, level = to_visit.pop()
            if package_name in visited or level > depth:
                continue
            visited.add(package_name)
            package, dependencies = self._fetch_metadata(package_name)
            if not package:
                continue

            node = Node(package_name, vars(package))
            nodes[package_name] = node

            for dep in dependencies:
                dep_name = Requirement(dep).name
                if dep_name not in visited:
                    to_visit.append((dep_name, level + 1))
                edges.append(Edge(node, nodes.get(dep_name, Node(dep_name, {}))))

        graph = Graph(list(nodes.values()), edges, True)
        self._save_graph_to_file(graph, cache_file)
        return graph

    def _fetch_metadata(self, package_name: str) -> Tuple[Package | None, List[str]]:
        url = f"https://pypi.org/pypi/{package_name}/json"

        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return None, []

        data = response.json()
        info = data.get("info", {})
        releases = data.get("releases", {})
        latest_version = info.get("version")
        release_files = releases.get(latest_version, [])

        release_date = None
        if release_files:
            release_date_str = release_files[0].get("upload_time_iso_8601")
            if release_date_str:
                release_date = parse_date(release_date_str)

        requires_dist = info.get("requires_dist") or []
        return Package(info, release_date=release_date), requires_dist

    # Graph persistence for not making too many requests again
    def _save_graph_to_file(self, graph, filename):
        with open(filename, "wb") as f:
            pickle.dump(graph, f)

    def _load_graph_from_file(self, filename):
        if os.path.exists(filename):
            with open(filename, "rb") as f:
                return pickle.load(f)
        return None
