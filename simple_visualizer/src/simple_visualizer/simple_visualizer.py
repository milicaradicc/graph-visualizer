from api.components import VisualizerPlugin


class SimpleVisualizer(VisualizerPlugin):
    def visualize(self, data):
        pass

    def name(self) -> str:
        return "Simple Visualizer"

    def identifier(self) -> str:
        return "simple_visualizer"