from django.http import JsonResponse
from django.shortcuts import render
from core.use_cases import WorkspaceService, PluginService
from django.apps import apps
from django.shortcuts import redirect
from django.contrib import messages
from .apps import datasource_group,visualizer_group


def index(request):
    plugin_service: PluginService = apps.get_app_config('graph_visualizer').plugin_service
    datasource_plugins = plugin_service.plugins[datasource_group]
    workspace_service: WorkspaceService = apps.get_app_config('graph_visualizer').workspace_service
    graph=workspace_service.get_current_workspace().graph
    visualizer_plugins = plugin_service.plugins[visualizer_group]
    return render(request, 'index.html', {
        'title': 'Index',
        'datasource_plugins': datasource_plugins,
        'workspaces':workspace_service.get_workspaces(),
        'current_workspace': workspace_service.get_current_workspace(),
        'block_visualizer_html':'' if graph is None else visualizer_plugins[0].visualize(graph)})

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
            "required": p.required,
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
        messages.success(request, f"Data loaded successfully using {selected_plugin.display_name}")
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
    print(workspace_service.get_current_workspace())

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

