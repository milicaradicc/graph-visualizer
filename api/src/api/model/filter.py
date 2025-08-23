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

        try:
            if isinstance(attr_value, datetime):
                compare_value = datetime.strptime(self._value, "%Y-%m-%d")
                if attr_value.tzinfo is not None and compare_value.tzinfo is None:
                    compare_value = compare_value.replace(tzinfo=attr_value.tzinfo)
            else:
                if isinstance(self._value, str):
                    compare_value = type(attr_value)(self._value.strip())
                else:
                    compare_value = type(attr_value)(self._value)
        except (ValueError, TypeError):
            raise ValueError(f"Cannot compare values of types: {type(attr_value)} and {type(self._value)}")

        if self._operator == FilterOperator.EQUAL:
            return attr_value == compare_value
        elif self._operator == FilterOperator.NOT_EQUAL:
            return attr_value != compare_value
        elif self._operator == FilterOperator.GREATER_THAN:
            return attr_value > compare_value
        elif self._operator == FilterOperator.GREATER_THAN_OR_EQUAL:
            return attr_value >= compare_value
        elif self._operator == FilterOperator.LESS_THAN:
            return attr_value < compare_value
        elif self._operator == FilterOperator.LESS_THAN_OR_EQUAL:
            return attr_value <= compare_value
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
