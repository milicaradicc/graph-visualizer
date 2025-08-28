from enum import Enum

class FilterOperator(Enum):
    EQUAL = "="
    NOT_EQUAL = "!="
    GREATER_THAN = ">"
    GREATER_THAN_OR_EQUAL = ">="
    LESS_THAN = "<"
    LESS_THAN_OR_EQUAL = "<="

    @classmethod
    def choices(cls):
        return [(operator.name, operator.value) for operator in cls]
