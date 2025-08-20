import json

def serialize_to_json(obj, indent=2):
    """Smart JSON serialization with multiple fallback strategies"""
    strategies = [
        lambda o: o.to_json(indent=indent) if hasattr(o, 'to_json') else None,
        lambda o: json.dumps(o.to_dict(), indent=indent, ensure_ascii=False) if hasattr(o, 'to_dict') else None,
        lambda o: o.serialize(format="json-ld").decode("utf-8") if hasattr(o, 'serialize') else None,
        lambda o: json.dumps(o, indent=indent, default=str, ensure_ascii=False)
    ]

    for strategy in strategies:
        try:
            result = strategy(obj)
            if result is not None:
                return result
        except Exception:
            continue

    return json.dumps({"error": "Serialization failed"}, indent=indent)
