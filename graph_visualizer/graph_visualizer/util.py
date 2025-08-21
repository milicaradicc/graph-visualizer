import json
import traceback


def serialize_to_json(obj, indent=2):
    """Smart JSON serialization with multiple fallback strategies and debug logs"""
    strategies = [
        lambda o: o.to_json(indent=indent) if hasattr(o, 'to_json') else None,
        lambda o: json.dumps(o.to_dict(), indent=indent, ensure_ascii=False) if hasattr(o, 'to_dict') else None,
        lambda o: o.serialize(format="json-ld").decode("utf-8") if hasattr(o, 'serialize') else None,
        lambda o: json.dumps(o, indent=indent, default=str, ensure_ascii=False)
    ]

    for i, strategy in enumerate(strategies, start=1):
        try:
            obj_id = getattr(obj, 'id', None) or getattr(obj, '_id', None)
            if obj_id is None and hasattr(obj, 'src') and hasattr(obj, 'dest'):
                obj_id = f"{getattr(obj.src, 'id', '?')}->{getattr(obj.dest, 'id', '?')}"

            print(f"[DEBUG] Trying strategy {i} for object type {type(obj)}, object id: {obj_id}")

            result = strategy(obj)
            if result is not None:
                print(f"[DEBUG] Strategy {i} succeeded for object id: {obj_id}")
                return result
            else:
                print(f"[DEBUG] Strategy {i} returned None for object id: {obj_id}")
        except Exception as e:
            print(f"[DEBUG] Strategy {i} failed for object id: {obj_id} with exception: {e}")
            traceback.print_exc()

    print("[DEBUG] All strategies failed, returning error JSON")
    return json.dumps({"error": "Serialization failed"}, indent=indent)
