from datetime import datetime
from typing import Dict, Union


class Node(object):
    def __init__(self, id: str, data: Dict[str, Union[str, int, float, datetime]]):
        self._id = id
        self._data = data

    @property
    def id(self) -> str:
        return self._id

    @id.setter
    def id(self, value: str):
        if not isinstance(value, str):
            raise TypeError("id must be a string")
        if not value.strip():
            raise ValueError("id cannot be empty")
        self._id = value

    @property
    def data(self) -> Dict[str, Union[str, int, float, datetime]]:
        return self._data

    @data.setter
    def data(self, value: Dict[str, Union[str, int, float, datetime]]):
        if not isinstance(value, dict):
            raise TypeError('Value must be a dictionary')

        for data in value.values():
            if not isinstance(data, (str, int, float, datetime)):
                raise TypeError('All values in the dictionary must be of type str, int, float, or datetime')

        self._data = value

    def __str__(self):
        return self._id+ "\n\t" + "\n\t".join(f"{key}: {value}" for key, value in self._data.items())