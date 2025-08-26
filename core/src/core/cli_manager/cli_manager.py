from typing import Tuple, Dict
from api.model import Node, Workspace
import json
import datetime
import shlex

from core.cli_manager.status import Status

class CommandHandler:
    def __init__(self, workspace: Workspace):
        self.workspace = workspace

    def add_node(self, node_id: str, **attributes):
        new_node = Node(node_id, attributes)
        if self.workspace.add_node(new_node):
            return Status.SUCCESS,f"Node {node_id} added."
        return Status.ERROR,f"Node {node_id} already exists."

    def edit_node(self, node_id: str, **attributes):
        if self.workspace.edit_node(node_id, **attributes):
            return Status.SUCCESS,f"Node {node_id} updated with {attributes}."
        return Status.ERROR,f"Node {node_id} does not exist."

    def delete_node(self, node_id: str):
        if self.workspace.delete_node(node_id):
            return Status.WARNING,f"Node {node_id} and its edges deleted."
        return Status.ERROR,f"Node {node_id} does not exist."

    def add_edge(self, parent_id: str, child_id: str):
        if self.workspace.add_edge(parent_id, child_id):
            return Status.SUCCESS,f"Edge {parent_id} -> {child_id} created."
        return Status.ERROR,f"Something with adding edge {parent_id} -> {child_id} went wrong."

    def edit_edge(self, old_parent: str, old_child: str, new_parent: str, new_child: str):
        if self.workspace.edit_edge(old_parent,old_child,new_parent,new_child):
            return Status.SUCCESS,f"Edge {old_parent} -> {old_child} updated to {new_parent} -> {new_child}."
        return Status.ERROR,f"Something with editing old edge {old_parent} -> {old_child} went wrong."

    def delete_edge(self, parent_id: str, child_id: str):
        if self.workspace.delete_edge(parent_id, child_id):
            return Status.WARNING,f"Edge {parent_id} -> {child_id} deleted."
        return Status.ERROR,f"Edge {parent_id} -> {child_id} does not exist."

    def clean_start(self):
        self.workspace.clean_start()
        return Status.SUCCESS,"Workspace cleared (all nodes and edges deleted)."


def convert_value(value):
    """Convert value string to int, float, or date if applicable."""
    if isinstance(value, str):
        # try int
        if value.isdigit():
            return int(value)
        # try float
        try:
            return float(value)
        except ValueError:
            pass
        # try date
        try:
            return datetime.datetime.strptime(value, "%d-%m-%Y").date()
        except ValueError:
            pass
    return value  # fallback as string

def parse_flags(args: list[str]) -> Dict[str, str]:
    """Parse --key value style flags."""
    flags = {}
    i = 0
    while i < len(args):
        arg = args[i]
        if arg.startswith("--"):
            key = arg[2:]
            if i + 1 >= len(args):
                raise ValueError(f"Flag {arg} requires a value")
            value = args[i + 1]
            flags[key] = value
            i += 2
        else:
            raise ValueError(f"Unexpected argument: {arg}")
    return flags

def parse_data_json(data_str: str) -> Dict:
    """Parse JSON string and convert supported types."""
    try:
        raw_data = json.loads(data_str.replace("'", '"'))
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON data: {e}")

    parsed_data = {}
    for k, v in raw_data.items():
        parsed_data[k] = convert_value(v)
    return parsed_data

class CLIHandler:
    INSTRUCTION="""
    Commands:
        add node:
            add-node --id <id> --data [data]
                e.g. add-node --id 1 --data {"name":"Emily", "age":22, "birthday": 12-01-2000}
        edit node:
            edit-node --id <id> --data [partial data]
                e.g. edit-node --id 1 --data {"name":"Emilia", last_name":"Johnson"}
            ps it will contain name, age, birthday, last_name
        delete node:
            delete-node --id <id>
                e.g. delete-node --id 1
        add edge:
            add-edge --parent <parent_id> --child <child_id>
                e.g. add-edge --parent 1 --child 2
        edit edge:
            edit-edge --parent <parent_id> --child <child_id> --new_parent <new_parent> --new_child <new_child>
                e.g. edit-edge --parent 1 --child 1 --new_parent 2 --new_child 1
        delete edge:
            delete-edge --parent <parent_id> --child <child_id>
                e.g. delete-edge --parent 1 --child 2
        clear workspace:
            clear-start
        help:
            help
        clear console:
            clear
        ps data types that are supported: string ("str"), integer (1), float (1.0) , date (d-m-y)
    """

    def __init__(self, workspace: Workspace):
        self.manager = CommandHandler(workspace)

    def run_command(self, command: str) -> Tuple[Status,str,Workspace]:
        parts = shlex.split(command.strip())
        if not parts:
            return Status.ERROR,"No command entered.", self.manager.workspace

        cmd = parts[0].lower()

        try:
            if cmd == "add-node":
                flags = parse_flags(parts[1:])
                node_id = flags.get("id")
                if not node_id:
                    raise ValueError("Missing --id")
                data = parse_data_json(flags.get("data", "{}"))
                status, message = self.manager.add_node(node_id, **data)
                return status,message, self.manager.workspace

            elif cmd == "edit-node":
                flags = parse_flags(parts[1:])
                node_id = flags.get("id")
                if not node_id:
                    raise ValueError("Missing --id")
                data = parse_data_json(flags.get("data", "{}"))
                status, message = self.manager.edit_node(node_id, **data)
                return status,message, self.manager.workspace

            elif cmd == "delete-node":
                flags = parse_flags(parts[1:])
                node_id = flags.get("id")
                if not node_id:
                    raise ValueError("Missing --id")
                status, message = self.manager.delete_node(node_id)
                return status,message, self.manager.workspace

            elif cmd == "add-edge":
                flags = parse_flags(parts[1:])
                parent = flags.get("parent")
                child = flags.get("child")
                if not parent or not child:
                    raise ValueError("Missing --parent or --child")
                status, message = self.manager.add_edge(parent, child)
                return status,message, self.manager.workspace

            elif cmd == "edit-edge":
                flags = parse_flags(parts[1:])
                old_parent = flags.get("parent")
                old_child = flags.get("child")
                new_parent = flags.get("new_parent")
                new_child = flags.get("new_child")
                if not all([old_parent, old_child, new_parent, new_child]):
                    raise ValueError("Missing flags for edit-edge")
                status,message = self.manager.edit_edge(old_parent, old_child, new_parent, new_child)
                return status,message, self.manager.workspace

            elif cmd == "delete-edge":
                flags = parse_flags(parts[1:])
                parent = flags.get("parent")
                child = flags.get("child")
                if not parent or not child:
                    raise ValueError("Missing --parent or --child")
                status,message = self.manager.delete_edge(parent, child)
                return status,message, self.manager.workspace

            elif cmd == "clear-start":
                status,message = self.manager.clean_start()
                return status,message, self.manager.workspace

            elif cmd == "help":
                return Status.SUCCESS, self.INSTRUCTION, self.manager.workspace

            else:
                return Status.ERROR,f"Unknown command: {cmd}", self.manager.workspace

        except Exception as e:
            return Status.ERROR,f"Error: {e}", self.manager.workspace