import json
from datetime import datetime, date
from typing import List, Dict, Any

class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime and date objects."""
    def default(self, obj: Any) -> str:
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


def convert_nodes_to_dict(nodes) -> List[Dict[str, Any]]:
    """Convert node objects to dictionary representation."""
    return [{'id': node.id} for node in nodes]


def convert_edges_to_dict(edges) -> List[Dict[str, str]]:
    """Convert edge objects to dictionary representation."""
    return [{'source': edge.src.id, 'target': edge.dest.id} for edge in edges]


def custom_tojson(obj: Any, **kwargs) -> str:
    """Custom JSON serialization filter for Jinja2 templates."""
    return json.dumps(obj, cls=DateTimeEncoder, **kwargs)
