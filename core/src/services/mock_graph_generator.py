from api.model import Node, Edge, Graph
from datetime import datetime, timedelta
import random

def generate_mock_graph(num_nodes=5, num_edges=7, directed=True) -> Graph:
    nodes = []
    for i in range(num_nodes):
        node_data = {
            "id": i,
            "name": f"Node-{i}",
            "value": round(random.uniform(10, 100), 2),
            "timestamp": datetime.now() - timedelta(minutes=i * 5)
        }
        node = Node(node_data)
        nodes.append(node)

    edges = []
    for _ in range(num_edges):
        src, dest = random.sample(nodes, 2)
        edge = Edge(src=src, dest=dest)
        edges.append(edge)

    graph = Graph(nodes=nodes, edges=edges, directed=directed)

    return graph