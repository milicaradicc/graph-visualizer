from api.model import Node, Workspace, Edge

class CommandHandler:
    def __init__(self, workspace: Workspace):
        self.workspace = workspace

    def add_node(self, node_id: str, **attributes):
        new_node = Node(node_id, attributes)
        if self.workspace.add_node(new_node):
            return f"Node {node_id} added."
        return f"Node {node_id} already exists."

    def edit_node(self, node_id: str, **attributes):
        if self.workspace.edit_node(node_id, **attributes):
            return f"Node {node_id} updated with {attributes}."
        return f"Node {node_id} does not exist."

    def delete_node(self, node_id: str):
        if self.workspace.delete_node(node_id):
            return f"Node {node_id} and its edges deleted."
        return f"Node {node_id} does not exist."

    def add_edge(self, parent_id: str, child_id: str):
        if self.workspace.add_edge(parent_id, child_id):
            return f"Edge {parent_id} -> {child_id} created."
        return f"Something with adding edge {parent_id} -> {child_id} went wrong."

    def edit_edge(self, old_parent: str, old_child: str, new_parent: str, new_child: str):
        if self.workspace.edit_edge(old_parent,old_child,new_parent,new_child):
            return f"Edge {old_parent} -> {old_child} updated to {new_parent} -> {new_child}."
        return f"Something with editing old edge {old_parent} -> {old_child} went wrong."

    def delete_edge(self, parent_id: str, child_id: str):
        if self.workspace.delete_edge(parent_id, child_id):
            return f"Edge {parent_id} -> {child_id} deleted."
        return f"Edge {parent_id} -> {child_id} does not exist."

    def clean_start(self):
        self.workspace.clean_start()
        return "Workspace cleared (all nodes and edges deleted)."

class CLIHandler:
    def __init__(self, workspace: Workspace):
        self.manager = CommandHandler(workspace)

    def parse_args(self,args):
        #TODO: add type validation for attributes
        result = {}
        for arg in args:
            if "=" not in arg:
                raise ValueError(f"Invalid argument: {arg}")
            key, value = arg.split("=", 1)
            result[key] = value
        return result

    def run_command(self, command: str):
        parts = command.strip().split()
        if not parts:
            return "No command entered.", self.manager.workspace

        if len(parts) >= 2 and f"{parts[0].lower()} {parts[1].lower()}" in [
            "add node", "edit node", "delete node", "add edge", "edit edge", "delete edge", "clean start"
        ]:
            cmd = f"{parts[0].lower()} {parts[1].lower()}"
            args_start = 2
        else:
            cmd = parts[0].lower()
            args_start = 1

        try:
            if cmd == "add node":
                node_id = parts[args_start]
                attrs = self.parse_args(parts[args_start + 1:])
                return self.manager.add_node(node_id, **attrs), self.manager.workspace

            elif cmd == "edit node":
                node_id = parts[args_start]
                attrs = self.parse_args(parts[args_start + 1:])
                return self.manager.edit_node(node_id, **attrs), self.manager.workspace

            elif cmd == "delete node":
                node_id = parts[args_start]
                return self.manager.delete_node(node_id), self.manager.workspace

            elif cmd == "add edge":
                parent, child = parts[args_start], parts[args_start + 1]
                return self.manager.add_edge(parent, child), self.manager.workspace

            elif cmd == "edit edge":
                return self.manager.edit_edge(parts[args_start], parts[args_start + 1], parts[args_start + 2],
                                              parts[args_start + 3]), self.manager.workspace

            elif cmd == "delete edge":
                return self.manager.delete_edge(parts[args_start], parts[args_start + 1]), self.manager.workspace

            elif cmd == "clean start":
                return self.manager.clean_start(), self.manager.workspace

            elif cmd in ["filter", "search"]:
                return f"{cmd} command not implemented yet.", self.manager.workspace

            else:
                return f"Unknown command: {cmd}", self.manager.workspace

        except Exception as e:
            return f"Error: {e}", self.manager.workspace
