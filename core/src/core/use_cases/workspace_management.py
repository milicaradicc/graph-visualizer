from api.model import Workspace

INITIAL_WORKSPACE_NAME = 'workspace1'


class WorkspaceService(object):
    def __init__(self):
        self._max_id = 1
        initial_workspace = Workspace(self._max_id, None, INITIAL_WORKSPACE_NAME, [], [])
        self._workspaces = []
        self._workspaces.append(initial_workspace)
        self._current_workspace = initial_workspace

    def create_workspace(self, name):
        self._max_id += 1
        new_workspace = Workspace(self._max_id, None, name, [], [])
        self._workspaces.append(new_workspace)
        self._current_workspace = new_workspace

    def select_workspace(self, workspace_id):
        for ws in self._workspaces:
            if ws.id == workspace_id:
                self._current_workspace = ws
                return
        raise Exception("Workspace with given id not found")

    def get_workspaces(self):
        return self._workspaces

    def get_current_workspace(self):
        return self._current_workspace
