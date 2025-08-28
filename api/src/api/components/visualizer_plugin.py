from . import Plugin
from abc import abstractmethod

class VisualizerPlugin(Plugin):
    """
    Base class for visualization plugins.

    Every visualizer plugin must meet the following requirements
    for interactions (zoom, pan, drag) to work correctly:
   
    1. Required SVG structure:
       - A root SVG with an element having class ".visualization-container"
       - Nodes must be grouped as <g class="node-group"> 
         containing shape elements (e.g. <rect class="node"> or <circle class="node">).
       - Edges must be paths: <path class="links">
       - Labels (if used) should use one of the following classes:
           - .node-label (for node names)
           - .attrText (for attribute labels)
    
    2. Required attributes:
       - All interactive elements must include attribute enabled
         (e.g. <path class="links" enabled="true">, <g class="node-group" enabled="false">).
         This explicitly marks which nodes and edges participate in graph operations
         (e.g. zooming, panning, dragging, selection).
       - Node objects in nodeData must include id.
       - If x and y are missing, they will be randomized,
         but providing initial positions improves stability.

    3. Styling requirements:
       - All CSS rules must be scoped under the SVG plugin identifier:
           #plugin_identifier .node { ... }
           #plugin_identifier .links { ... }
           #plugin_identifier .node-label { ... }
         This prevents style collisions between different plugins.
    
    These conventions ensure that graph_interactions.js can correctly
    select nodes/edges and attach zoom, pan, and drag behaviors.
    """
    @abstractmethod
    def visualize(self, data):
        """
        Method to visualize the data.
        Should be implemented by subclasses.
        """
        pass