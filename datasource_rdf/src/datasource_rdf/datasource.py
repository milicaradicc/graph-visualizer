from api.model import Graph, Node, Edge
from api.components.data_source_plugin import DataSourcePlugin
from rdflib import Graph as RdfGraph


class RdfDataSource(DataSourcePlugin):
    def name(self) -> str:
        return "Rdf file Datasource"

    def identifier(self) -> str:
        return "datasource_rdf"

    def load(self, **kwargs) -> Graph:
        pass

