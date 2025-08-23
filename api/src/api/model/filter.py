from datetime import datetime
from typing import Union, TYPE_CHECKING

from . import Node

if TYPE_CHECKING:
    from . import FilterOperator

class Filter:
    _current_id = 0
    def __init__(self, attribute: str, operator: 'FilterOperator', value: Union[str, int, float, datetime]):
        Filter._current_id += 1
        self._id = Filter._current_id
        self._attribute = attribute
        self._operator = operator
        self._value = value

    @property
    def id(self):
        return self._id

    def __call__(self, node: Node) -> bool:
        from . import FilterOperator

        if self._attribute not in node.data:
            return False
        attr_value = node.data[self._attribute]

        # Allow for comparisons between same types or between numeric types
        if not isinstance(attr_value, (type(self._value), int, float)) or \
           (isinstance(attr_value, (int, float)) and not isinstance(self._value, (int, float))):
            raise ValueError(f"Cannot compare values of types: {type(attr_value)} and {type(self._value)}")

        if self._operator == FilterOperator.EQUAL:
            return attr_value == self._value
        elif self._operator == FilterOperator.NOT_EQUAL:
            return attr_value != self._value
        elif self._operator == FilterOperator.GREATER_THAN:
            return attr_value > self._value
        elif self._operator == FilterOperator.GREATER_THAN_OR_EQUAL:
            return attr_value >= self._value
        elif self._operator == FilterOperator.LESS_THAN:
            return attr_value < self._value
        elif self._operator == FilterOperator.LESS_THAN_OR_EQUAL:
            return attr_value <= self._value
        else:
            raise ValueError(f"Unsupported operator: {self._operator}")

    def __str__(self):
        return f"{self._attribute} {self._operator.name} {self._value}"

    def to_dict(self):
        return {
            "id": self._id,
            "attribute": self._attribute,
            "operator": self._operator.value,
            "value": self._value.isoformat() if isinstance(self._value, datetime) else self._value
        }
