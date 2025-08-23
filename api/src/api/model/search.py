from . import Node

class Search:
    _id = 0
    def __init__(self, query: str):
        self._id = Search._id
        Search._id += 1
        self._query = query

    @property
    def id(self):
        return self._id

    def __call__(self, node: Node) -> bool:
        return self._query.lower() in [str(value).lower() for value in node.data.values()] \
                or self._query.lower() in [str(key) for key in node.data.keys()]