let graphInteractionManager = null;
let visualizerSwitcher = null;
let birdViewManager = null;
let interactiveInstance = null;
document.addEventListener("DOMContentLoaded", () => {
    graphInteractionManager = createGraphInteractionManager();
    visualizerSwitcher = new VisualizerSwitcher();
    const pluginId = document.getElementById('visualizer-select')
                        ? document.getElementById('visualizer-select').value
                        : null;
    const svg = d3.select("svg");

    if (svg.empty()) {
        console.warn("No SVG element found in main view");
        return;
    }

    const nodeElements = svg.selectAll("g.node[enabled='true']").nodes();
    const linkElements = svg.selectAll("path.link[enabled='true']").nodes();

    if (nodeElements.length === 0 && linkElements.length === 0) {
        checkForVisualizer(pluginId)

        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const svgNode = svg.node();
                if (!svgNode) return;

                const width = svgNode.clientWidth || 800;
                const height = svgNode.clientHeight || 600;

                if (!interactiveInstance) return;
                const simulation = interactiveInstance.simulation;
                if (!simulation) return;
                simulation.force("center", d3.forceCenter(width / 2, height / 2));
                simulation.alpha(0.3).restart();
                if (birdViewManager) {
                    setTimeout(() => birdViewManager.updateBirdView(), 100);
                }
            }, 150);
        });
    }
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
});

function checkForVisualizer(pluginId) {
    const svg = document.querySelector(`#${pluginId}`);
    if (svg) {
        const container = svg.querySelector('.visualization-container');
        const nodeData = window.graphData ? window.graphData.nodes : [];
        const linkDataUnprocessed = window.graphData ? window.graphData.edges : [];
        const isGraphDirected = window.graphData ? window.graphData.directed : true;
        const linkData = linkDataUnprocessed.map(link => ({
            source: link.src,
            target: link.dest
        }));

        const svgSelection = d3.select(`#${pluginId}`);
        const containerSelection = d3.select(container);

        const nodeSelection = svgSelection.selectAll('g.node-group[enabled="true"]')
        .data(nodeData, d => d.id);

        const linkSelection = svgSelection.selectAll('path.links[enabled="true"]')
        .data(linkData);

        nodeSelection
            .attr('cx', d => d.x || 0)
            .attr('cy', d => d.y || 0);

        const svgNode = svgSelection.node();
        const width = svgNode.clientWidth || 800;
        const height = svgNode.clientHeight || 600;

        nodeData.forEach(d => {
            if (d.x === undefined) d.x = Math.random() * width;
            if (d.y === undefined) d.y = Math.random() * height;
            if (d.radius === undefined) d.radius = 8;
        });

        visualizerInstance = {
                svg: svgSelection,
                container: containerSelection,
                nodeSelection: nodeSelection,
                linkSelection: linkSelection,
                nodeData: nodeData,
                linkData: linkData
        };
        setupInteractionsIfNeeded(pluginId, visualizerInstance, isGraphDirected);
        setTimeout(() => {
            initializeBirdViewIfNeeded(pluginId);
        }, 200);
    }
    return;
}

function setupInteractionsIfNeeded(pluginId, visualizerInstance, isGraphDirected) {

    if (visualizerInstance) {
        const mainView = document.getElementById('main-view');
        const visualizerContent = document.getElementById('visualizer-content');
        const visualizerSvg = document.getElementById(`${pluginId}`);

        if (mainView && visualizerContent && visualizerSvg &&
            mainView.contains(visualizerSvg) && graphInteractionManager) {
            const newInteractiveInstance = graphInteractionManager
                .enableGenericPluginInteractions(visualizerInstance, true, true, isGraphDirected);
            if (newInteractiveInstance) {
                interactiveInstance = newInteractiveInstance;
            } else {
                console.warn("Failed to create interactive instance from main_view");
            }
        } else {
            console.warn("Visualizer is not in the main view");
        }
    }
}

function initializeBirdViewIfNeeded(pluginId) {
    if (birdViewManager) {
        setTimeout(() => {
            birdViewManager.updateBirdView();
        }, 100);
        return;
    }

    const birdSvg = document.getElementById('bird-svg');

    if (!birdSvg) {
        console.error("Bird view SVG not found in DOM");
        return;
    }
    birdViewManager = graphInteractionManager.createBirdViewManager(`#${pluginId}`, 'bird-svg');

    if (birdViewManager) {
        setTimeout(() => {
            birdViewManager.updateBirdView();
        }, 100);
    } else {
        console.error("Failed to initialize bird view manager");
    }
};