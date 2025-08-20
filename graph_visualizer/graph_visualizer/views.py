import json
from django.shortcuts import render
from django.apps import apps
from block_visualizer.block_visualizer import BlockVisualizer
from simple_visualizer import SimpleVisualizer
from .apps import datasource_group, visualizer_group


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


def index(request):
    """Graph visualization view"""
    # Load data
    plugin_service = apps.get_app_config('graph_visualizer').plugin_service
    datasource_plugin = plugin_service.plugins[datasource_group][0]

    file_path = r"C:\Users\Lenovo\Desktop\projects\graph-visualizer\datasource_rdf\src\datasource_rdf\data\data.ttl"
    data = datasource_plugin.load(file_path=file_path)

    # Generate visualizations
    context = {
        "block_visualizer_html": BlockVisualizer().visualize(data),
        "simple_visualizer_html": SimpleVisualizer().visualize(data),
        "graph_json": serialize_to_json(data),
    }

    return render(request, "index.html", context)