from datetime import datetime
from typing import Dict, Union

class Node(object):
    def __init__(self, data: Dict[str, Union[str, int, float, datetime]]):
        self._data = data

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
        return "\n".join(f"{key}: {value}" for key, value in self._data.items())