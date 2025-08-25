function getCurrentSelectedPlugin() {
    const selectElement = document.getElementById('visualizer-select');
    return selectElement ? selectElement.value : null;
}

// Usage anywhere in main.js
const pluginId = getCurrentSelectedPlugin();
document.addEventListener("DOMContentLoaded", () => {
    const svg = d3.select("svg");

    // Early exit if no SVG found
    if (svg.empty()) {
        console.warn("No SVG element found in main view");
        return;
    }

    const nodeElements = svg.selectAll("g.node[enabled='true']").nodes();

    const linkElements = svg.selectAll("path.link[enabled='true']").nodes();

    // Only proceed if we have pre-existing nodes and links (not for visualizer)
    if (nodeElements.length === 0 && linkElements.length === 0) {
        console.log("No traditional graph elements found - checking for visualizer");

        // Separate function to initialize bird view regardless of interaction state
        const initializeBirdViewIfNeeded = () => {
            // Check if bird view is already initialized
            if (window.pluginAPI && window.pluginAPI[pluginId] && window.pluginAPI[pluginId].birdViewManager) {
                console.log("Bird view already initialized - skipping", window.pluginAPI[pluginId]);
                return;
            }

            // Verify bird view SVG exists
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

                // Force an initial update
                setTimeout(() => {
                    birdViewManager.updateBirdView();
                }, 100);
            } else {
                console.error("Failed to initialize bird view manager");
            }
        };
        // Function to handle interactions
        const setupInteractionsIfNeeded = () => {
            console.log(pluginId)
            if (window.pluginAPI[pluginId] && window.pluginAPI[pluginId].interactiveInstance) {
                console.log(`#${pluginId} visualizer interactions already enabled - skipping interactions`);
                return;
            }
            console.log(window.pluginAPI)
            if (window.pluginAPI[pluginId] && window.pluginAPI[pluginId].instance) {
            console.log(window.pluginAPI[pluginId])
                const mainView = document.getElementById('main-view');
                const visualizerContent = document.getElementById('visualizer-content');
                const visualizerSvg = document.getElementById(`#${pluginId}`);

                if (mainView && visualizerContent && visualizerSvg &&
                    mainView.contains(visualizerSvg) && window.graphInteractionManager) {

                    const interactiveInstance = window.graphInteractionManager
                        .enableGenericPluginInteractions(window.pluginAPI[pluginId].instance, true, true);
                    if (interactiveInstance) {
                        window.pluginAPI[pluginId].interactiveInstance = interactiveInstance;
                        console.log("Interactive instance created successfully from main_view", interactiveInstance);
                    } else {
                        console.warn("Failed to create interactive instance from main_view");
                    }
                } else {
                    console.log("visualizer not in main view or required elements missing");
                }
            }
        };
        // Check for visualizer and set up both interactions and bird view
        // In main_view.js - replace the checkForVisualizer function with:

function checkForVisualizer() {
    // Look for visualizer elements with enabled="true"
    const svg = document.querySelector(`#${pluginId}`);
    console.log(`#${pluginId}`);
    console.log(svg);
    if (svg) {
        // Create the API instance in Django app code
        const container = svg.querySelector('.visualization-container');
        const nodeData = window.graphData ? window.graphData.nodes : [];
        const linkDataUnprocessed = window.graphData ? window.graphData.edges : [];
        const linkData = linkDataUnprocessed.map(link => ({
            source: link.src,
            target: link.dest
        }));

        // Create D3 selections from existing DOM elements
        const svgSelection = d3.select(`#${pluginId}`);
        const containerSelection = d3.select(container);

        // CRITICAL FIX: Bind data to the selections for drag functionality
        const nodeSelection = svgSelection.selectAll('circle.node[enabled="true"]')
            .data(nodeData, d => d.id); // Bind nodeData to circles

        const linkSelection = svgSelection.selectAll('line.link.directed[enabled="true"]')
            .data(linkData); // Bind linkData to lines

        const labelSelection = svgSelection.selectAll('text.node-label[enabled="true"]')
            .data(nodeData, d => d.id); // Bind nodeData to labels

        // Ensure the data binding is complete by updating positions if needed
        nodeSelection
            .attr('cx', d => d.x || 0)
            .attr('cy', d => d.y || 0);

        labelSelection
            .attr('x', d => d.x || 0)
            .attr('y', d => d.y || 0);

        // Ensure nodes have initial positions for force simulation
        const svgNode = svgSelection.node();
        const width = svgNode.clientWidth || 800;
        const height = svgNode.clientHeight || 600;

        nodeData.forEach(d => {
            if (d.x === undefined) d.x = Math.random() * width;
            if (d.y === undefined) d.y = Math.random() * height;
            if (d.radius === undefined) d.radius = 8; // default radius
        });

        window.pluginAPI = window.pluginAPI || {};
        window.pluginAPI[pluginId] = window.pluginAPI[pluginId] || {};
        // Create the API instance
        window.pluginAPI[pluginId] = {
            instance: {
                svg: svgSelection,
                container: containerSelection,
                nodeSelection: nodeSelection,
                linkSelection: linkSelection,
                labelSelection: labelSelection,
                nodeData: nodeData,
                linkData: linkData
            }
        };

        console.log("visualizer API instance created with data binding", window.pluginAPI[pluginId].instance);

        // Now enable interactions
        setupInteractionsIfNeeded();

        // Initialize bird view
        setTimeout(() => {
            initializeBirdViewIfNeeded();
        }, 200);

    } else {
        setTimeout(checkForVisualizer, 300);
    }
}
        // Also try to initialize bird view even if interactions already exist
        setTimeout(() => {
            if (window.graphInteractionManager) {
                initializeBirdViewIfNeeded();
            }
        }, 800); // Try bird view initialization after a delay regardless

        // Start the check process
        setTimeout(checkForVisualizer, 200);
        return;
    }

    // Optimized resize handler - debounced
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const svgNode = svg.node();
            if (!svgNode) return;

            const newWidth = svgNode.clientWidth || 1000;
            const newHeight = svgNode.clientHeight || 800;

            // Update any active simulations
            if (window.pluginAPI[pluginId] && window.pluginAPI[pluginId].interactiveInstance) {
                const { simulation } = window.pluginAPI[pluginId].interactiveInstance;
                if (simulation) {
                    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
                    simulation.alpha(0.3).restart();
                }
            }

            // Update bird view after resize
            if (window.pluginAPI[pluginId] && window.pluginAPI[pluginId].birdViewManager) {
                setTimeout(() => {
                    window.pluginAPI[pluginId].birdViewManager.updateBirdView();
                }, 100);
            }
        }, 150);
    });
});