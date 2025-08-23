from django.apps import apps
from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import redirect
from django.shortcuts import render

from core.use_cases import WorkspaceService, PluginService
from .apps import datasource_group, visualizer_group
from .util import serialize_to_json


def index(request):
    plugin_service: PluginService = apps.get_app_config('graph_visualizer').plugin_service
    datasource_plugins = plugin_service.plugins[datasource_group]
    workspace_service: WorkspaceService = apps.get_app_config('graph_visualizer').workspace_service
    workspace = workspace_service.get_current_workspace()
    visualizer_plugins = plugin_service.plugins[visualizer_group]

    try:
        graph = workspace.graph
    except ValueError as e:
        messages.error(request, str(e))
        graph = None


    graph_json = 'null'
    if graph is not None:
        graph_json = serialize_to_json(graph)

    return render(request, 'index.html', {
        'title': 'Index',
        'datasource_plugins': datasource_plugins,
        'workspaces': workspace_service.get_workspaces(),
        'current_workspace': workspace,
        'graph_html': '' if graph is None else visualizer_plugins[0].visualize(graph),
        'graph_json': graph_json,
        'filter_operators': WorkspaceService.get_filter_operators(),
        'active_searches': [search.to_dict() for search in workspace.searches],
        'active_filters': [f.to_dict() for f in workspace.filters],
    })

def get_plugin_params(request, plugin_identifier):
    plugin_service: PluginService = apps.get_app_config('graph_visualizer').plugin_service
    datasource_plugins = plugin_service.plugins[datasource_group]

    selected_plugin = None
    for plugin in datasource_plugins:
        if plugin.identifier() == plugin_identifier:
            selected_plugin = plugin

    params = selected_plugin.get_parameters()

    result = []
    for p in params:
        result.append({
            "name": p.name,
            "type": p.param_type.__name__,
            "display_name": p.display_name,
        })

    return JsonResponse(result, safe=False)

def load_data(request):
    if request.method != "POST":
        messages.error(request, "Invalid request")
        return redirect("index")

    plugin_service: PluginService = apps.get_app_config('graph_visualizer').plugin_service
    datasource_plugins = plugin_service.plugins[datasource_group]

    plugin_id = request.POST.get("plugin")
    selected_plugin = None
    for plugin in datasource_plugins:
        if plugin.identifier() == plugin_id:
            selected_plugin = plugin

    if not selected_plugin:
        messages.error(request, "Plugin not found")
        return redirect("index")

    # Collect plugin parameters using parameter identifiers
    params = {}
    for param in selected_plugin.get_parameters():
        value = request.POST.get(param.name)  # use identifier
        if value is not None:
            try:
                if param.param_type == int:
                    value = int(value)
                elif param.param_type == float:
                    value = float(value)
                elif param.param_type == bool:
                    value = value.lower() in ["true", "1", "on"]
            except ValueError:
                messages.error(request, f"Invalid value for {param.display_name}")
                return redirect("index")
            params[param.name] = value

    workspace_service: WorkspaceService = apps.get_app_config('graph_visualizer').workspace_service
    current_workspace = workspace_service.get_current_workspace()

    try:
        graph = selected_plugin.load(**params)
        current_workspace.graph = graph
        messages.success(request, f"Data loaded successfully using {selected_plugin.name()}")
    except Exception as e:
        messages.error(request, f"Failed to load data: {str(e)}")

    return redirect("index")

def add_workspace(request):
    if request.method != "POST":
        messages.error(request, "Invalid request")
        return redirect("index")

    workspace_name = request.POST.get("workspace_name")
    if not workspace_name:
        messages.error(request, "Workspace name cannot be empty")
        return redirect("index")

    # Create the workspace
    try:
        workspace_service: WorkspaceService = apps.get_app_config('graph_visualizer').workspace_service
        workspace_service.create_workspace(workspace_name)
        messages.success(request, f"Workspace '{workspace_name}' created successfully")
    except Exception as e:
        messages.error(request, f"Failed to create workspace: {str(e)}")

    return redirect("index")

def edit_workspace(request):
    if request.method != "POST":
        messages.error(request, "Invalid request")
        return redirect("index")

    workspace_name = request.POST.get("workspace_name")
    if not workspace_name:
        messages.error(request, "Workspace name cannot be empty")
        return redirect("index")

    workspace_service: WorkspaceService = apps.get_app_config('graph_visualizer').workspace_service
    workspace_service.get_current_workspace().name = workspace_name
    messages.success(request, f"Workspace '{workspace_name}' updated successfully")

    return redirect("index")

def set_workspace(request):
    if request.method != "POST":
        messages.error(request, "Invalid request")
        return redirect("index")
    workspace_id = request.POST.get("workspace_id")
    if not workspace_id:
        messages.error(request, "No workspace selected")
        return redirect("index")
    workspace_id=int(workspace_id)

    workspace_service: WorkspaceService = apps.get_app_config('graph_visualizer').workspace_service
    workspace_service.select_workspace(workspace_id)
    messages.success(request, "Workspace changed successfully")

    return redirect("index")

def add_search(request):
    if request.method != "POST":
        messages.error(request, "Invalid request")
        return redirect("index")

    query = request.POST.get("query").strip()
    print(f"Query: '{query}'")
    if not query:
        messages.error(request, "Search query cannot be empty")
        return redirect("index")

    workspace_service: WorkspaceService = apps.get_app_config('graph_visualizer').workspace_service
    current_workspace = workspace_service.get_current_workspace()
    current_workspace.add_search(query)
    messages.success(request, f"Search '{query}' added successfully")

    return redirect("index")

def remove_search(request):
    if request.method != "POST":
        messages.error(request, "Invalid request")
        return redirect("index")

    search_id = request.POST.get("search_id")
    if not search_id:
        messages.error(request, "No search specified")
        return redirect("index")

    workspace_service: WorkspaceService = apps.get_app_config('graph_visualizer').workspace_service
    current_workspace = workspace_service.get_current_workspace()
    current_workspace.remove_search(int(search_id))
    messages.success(request, "Search removed successfully")

    return redirect("index")

def add_filter(request):
    if request.method != "POST":
        messages.error(request, "Invalid request")
        return redirect("index")

    attribute = request.POST.get("attribute").strip()
    operator = request.POST.get("operator")
    value = request.POST.get("value").strip()

    if not attribute or not operator or not value:
        messages.error(request, "All filter fields are required")
        return redirect("index")

    workspace_service: WorkspaceService = apps.get_app_config('graph_visualizer').workspace_service
    current_workspace = workspace_service.get_current_workspace()
    try:
        current_workspace.add_filter(attribute, operator, value)
        messages.success(request, f"Filter on '{attribute} {operator} {value}' added successfully")
    except ValueError as e:
        messages.error(request, e)

    return redirect("index")

def remove_filter(request):
    if request.method != "POST":
        messages.error(request, "Invalid request")
        return redirect("index")

    filter_id = request.POST.get("filter_id")
    if not filter_id:
        messages.error(request, "No filter specified")
        return redirect("index")

    workspace_service: WorkspaceService = apps.get_app_config('graph_visualizer').workspace_service
    current_workspace = workspace_service.get_current_workspace()
    current_workspace.remove_filter(int(filter_id))
    messages.success(request, "Filter removed successfully")

    return redirect("index")
