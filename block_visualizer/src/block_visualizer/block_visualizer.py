from api.components import VisualizerPlugin

class BlockVisualizer(VisualizerPlugin):
    def visualize(self, data):
        pass

    def name(self) -> str:
        return "Block Visualizer"

    def identifier(self) -> str:
        return "block_visualizer"