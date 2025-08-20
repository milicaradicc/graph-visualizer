import json
from typing import List, Dict, Union, Any
from datetime import datetime


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

    def to_dict(self) -> Dict[str, Any]:
        """Convert Node to dictionary for JSON serialization"""
        serialized_data = {}
        for key, value in self._data.items():
            if isinstance(value, datetime):
                serialized_data[key] = value.isoformat()
            else:
                serialized_data[key] = value

        return {
            "id": self._id,
            "data": serialized_data
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Node':
        """Create Node from dictionary (for deserialization)"""
        node_data = data["data"].copy()

        # Convert ISO format strings back to datetime objects
        for key, value in node_data.items():
            if isinstance(value, str) and value.count('T') == 1 and 'Z' in value or '+' in value or '-' in value:
                try:
                    node_data[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except ValueError:
                    pass  # Keep as string if not a valid datetime

        return cls(data["id"], node_data)

    def __str__(self):
        return self._id + "\n\t" + "\n\t".join(f"{key}: {value}" for key, value in self._data.items())

