from api.model import Graph, Node, Edge
from api.components.data_source_plugin import DataSourcePlugin
from rdflib import Graph as RdfGraph,RDF


class RdfDataSource(DataSourcePlugin):
    def name(self) -> str:
        return "Rdf file Datasource"

    def identifier(self) -> str:
        return "datasource_rdf"

    def load(self, **kwargs) -> Graph:
        file_path = kwargs['file_path']
        rdf_graph = RdfGraph()
        rdf_graph.parse(file_path, format='turtle')

        nodes = {}
        edges = []

        for s, p, o in rdf_graph:
            if s not in nodes:
                    nodes[s] = {}
            if o.__class__.__name__ == 'Literal':
                nodes[s][p] = str(o)
            elif p == RDF.type:
                nodes[s]['type'] = str(o)
            else:
                edges.append((s, o))
                if s not in nodes:
                    nodes[s] = {}
                if o not in nodes:
                    nodes[o] = {}

        graph_nodes = [Node(identifier, data) for identifier, data in nodes.items()]
        graph_edges = [Edge(e[0], e[1]) for e in edges]

        return Graph(graph_nodes, graph_edges, True)

