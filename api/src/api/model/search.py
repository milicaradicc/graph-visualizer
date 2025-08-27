from . import Node

class Search:
    _id = 0
    def __init__(self, query: str):
        Search._id += 1
        self._id = Search._id
        self._query = query

    @property
    def id(self):
        return self._id

    @property
    def query(self) -> str:
        return self._query

    def __call__(self, node: Node) -> bool:
        return self._query.lower() in [str(value).lower() for value in node.data.values()] \
                or self._query.lower() in [str(key) for key in node.data.keys()]

    def to_dict(self):
        return {
            "id": self._id,
            "query": self._query
        }
