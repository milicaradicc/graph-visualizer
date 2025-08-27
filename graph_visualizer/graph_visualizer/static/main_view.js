document.addEventListener("DOMContentLoaded", () => {
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

                const newWidth = svgNode.clientWidth || 1000;
                const newHeight = svgNode.clientHeight || 800;

                if (window.pluginAPI && window.pluginAPI[pluginId] && window.pluginAPI[pluginId].interactiveInstance) {
                    const { simulation } = window.pluginAPI[pluginId].interactiveInstance;
                    if (simulation) {
                        simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
                        simulation.alpha(0.3).restart();
                    }
                }

                if (window.pluginAPI[pluginId] && window.pluginAPI[pluginId].birdViewManager) {
                    setTimeout(() => {
                        window.pluginAPI[pluginId].birdViewManager.updateBirdView();
                    }, 100);
                }
            }, 150);
        });
    }
});

window.checkForVisualizer = function(pluginId) {
    const svg = document.querySelector(`#${pluginId}`);
    if (svg) {
        const container = svg.querySelector('.visualization-container');
        const nodeData = window.graphData ? window.graphData.nodes : [];
        const linkDataUnprocessed = window.graphData ? window.graphData.edges : [];
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

        window.pluginAPI = window.pluginAPI || {};
        window.pluginAPI[pluginId] = window.pluginAPI[pluginId] || {};
        window.pluginAPI[pluginId] = {
            instance: {
                svg: svgSelection,
                container: containerSelection,
                nodeSelection: nodeSelection,
                linkSelection: linkSelection,
                nodeData: nodeData,
                linkData: linkData
            }
        };
        setupInteractionsIfNeeded(pluginId);
        setTimeout(() => {
            initializeBirdViewIfNeeded(pluginId);
        }, 200);
    }
    return;
}

function setupInteractionsIfNeeded(pluginId) {
    if (window.pluginAPI && window.pluginAPI[pluginId] && window.pluginAPI[pluginId].interactiveInstance) {
        return;
    }
    if (window.pluginAPI[pluginId] && window.pluginAPI[pluginId].instance) {
        const mainView = document.getElementById('main-view');
        const visualizerContent = document.getElementById('visualizer-content');
        const visualizerSvg = document.getElementById(`${pluginId}`);

        if (mainView && visualizerContent && visualizerSvg &&
            mainView.contains(visualizerSvg) && window.graphInteractionManager) {

            const interactiveInstance = window.graphInteractionManager
                .enableGenericPluginInteractions(window.pluginAPI[pluginId].instance, true, true, true);
            if (interactiveInstance) {
                window.pluginAPI[pluginId].interactiveInstance = interactiveInstance;
            } else {
                console.warn("Failed to create interactive instance from main_view");
            }
        } else {
            console.warn("Visualizer is not in the main view");
        }
    }
}

function initializeBirdViewIfNeeded(pluginId) {
    if (window.pluginAPI && window.pluginAPI[pluginId] && window.pluginAPI[pluginId].birdViewManager) {
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
    const birdViewManager = window.graphInteractionManager
        .initializeBirdView(`#${pluginId}`, 'bird-svg');

    if (birdViewManager) {
        window.pluginAPI = window.pluginAPI || {};
        window.pluginAPI[pluginId] = window.pluginAPI[pluginId] || {};
        window.pluginAPI[pluginId].birdViewManager = birdViewManager;

        setTimeout(() => {
            birdViewManager.updateBirdView();
        }, 100);
    } else {
        console.error("Failed to initialize bird view manager");
    }
};