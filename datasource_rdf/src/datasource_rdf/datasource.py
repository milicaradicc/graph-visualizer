from api.model import Graph, Node, Edge
from api.components.data_source_plugin import DataSourcePlugin, DataSourceParameter
from rdflib import Graph as RdfGraph, RDF, Literal, XSD
from typing import List

def _convert_literal(literal: Literal):
    """Convert RDF literal into int, float, date, or string"""
    dt = literal.datatype

    if dt in (XSD.integer, XSD.int, XSD.long, XSD.short):
        return int(literal)
    elif dt in (XSD.float, XSD.double, XSD.decimal):
        return float(literal)
    elif dt in (XSD.date, XSD.dateTime):
        return literal.toPython()
    else:
        return str(literal)


class RdfDataSource(DataSourcePlugin):
    def name(self) -> str:
        return "Rdf file Datasource"

    def identifier(self) -> str:
        return "datasource_rdf"

    def get_parameters(self) -> List[DataSourceParameter]:
        return [
            DataSourceParameter(
                'file_path',
                str,
                'File path'
            )
        ]

    def load(self, **kwargs) -> Graph:
        file_path = kwargs['file_path']
        rdf_graph = RdfGraph()
        rdf_graph.parse(file_path, format='turtle')

        nodes = {}
        edges = []

        for s, p, o in rdf_graph:
            s = str(s)
            if s not in nodes:
                nodes[s] = Node(s, {})
            if o.__class__.__name__ == 'Literal':
                value = _convert_literal(o)
                nodes[s].data[str(p)] = value
            elif p == RDF.type:
                nodes[s].data['type'] = str(o)
            else:
                o = str(o)
                if s not in nodes:
                    nodes[s] = Node(s, {})
                if o not in nodes:
                    nodes[o] = Node(o, {})
                edges.append(Edge(nodes[s], nodes[o]))

        return Graph(nodes.values(), edges, True)
