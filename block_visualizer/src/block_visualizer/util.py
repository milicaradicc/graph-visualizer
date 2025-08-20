import json
from datetime import datetime, date
from typing import List, Dict, Any

class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime and date objects."""
    def default(self, obj: Any) -> str:
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


def _convert_nodes_to_dict(nodes) -> List[Dict[str, Any]]:
    """Convert node objects (dict or Node) to dictionary representation."""
    converted = []
    for node in nodes:
        if isinstance(node, dict):
            # vec je dict
            converted.append({
                'id': node.get('id'),
                **{k: v for k, v in node.items() if k != 'id'}
            })
        else:
            # pretpostavljamo da je Node objekat
            converted.append({
                'id': getattr(node, "id", None),
                'data': getattr(node, "data", {})
            })
    return converted


def _convert_edges_to_dict(edges) -> List[Dict[str, str]]:
    """Convert edge objects (dict or Edge) to dictionary representation."""
    converted = []
    for e in edges:
        if isinstance(e, dict):
            if "source" in e and "target" in e:
                converted.append({"source": e["source"], "target": e["target"]})
        else:
            converted.append({
                "source": getattr(getattr(e, "src", None), "id", None),
                "target": getattr(getattr(e, "dest", None), "id", None)
            })
    return converted


def _custom_tojson(obj: Any, **kwargs) -> str:
    """Custom JSON serialization filter for Jinja2 templates."""
    return json.dumps(obj, cls=DateTimeEncoder, **kwargs)
