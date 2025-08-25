document.addEventListener("DOMContentLoaded", () => {
    console.log("Main view DOM loaded");

    const svg = d3.select("svg");

    // Early exit if no SVG found
    if (svg.empty()) {
        console.warn("No SVG element found in main view");
        return;
    }

    const nodeElements = svg.selectAll("g.node[enabled='true']").nodes();
    console.log("cvorovi", nodeElements);

    const linkElements = svg.selectAll("path.link[enabled='true']").nodes();

    // Only proceed if we have pre-existing nodes and links (not for simple visualizer)
    if (nodeElements.length === 0 && linkElements.length === 0) {
        console.log("No traditional graph elements found - checking for simple visualizer");

        // Separate function to initialize bird view regardless of interaction state
        const initializeBirdViewIfNeeded = () => {
        console.log("inicijalizuje bird");
//8
            // Check if bird view is already initialized
            if (window.simpleVisualizerAPI && window.simpleVisualizerAPI.birdViewManager) {
     //9
                console.log("Bird view already initialized - skipping", window.simpleVisualizerAPI);
                return;
            }

            // Verify bird view SVG exists
            const birdSvg = document.getElementById('bird-svg');
        console.log("inicijalizuje bird u", birdSvg);

            if (!birdSvg) {
                console.error("Bird view SVG not found in DOM");
                return;
            }

            const birdViewManager = window.graphInteractionManager
                .initializeBirdView('#simple_visualizer', 'bird-svg');
            console.log("Initializing bird view independent of interactions", birdViewManager);

            if (birdViewManager) {
                console.log("Bird view initialized successfully");
                window.simpleVisualizerAPI = window.simpleVisualizerAPI || {};
                window.simpleVisualizerAPI.birdViewManager = birdViewManager;

                // Force an initial update
                setTimeout(() => {
                    console.log("Forcing initial bird view update");
                    birdViewManager.updateBirdView();
                }, 100);
            } else {
                console.error("Failed to initialize bird view manager");
            }
        };
//2
        // Function to handle interactions
        const setupInteractionsIfNeeded = () => {
        console.log("usao u setup inter ako treba");

            if (window.simpleVisualizerAPI && window.simpleVisualizerAPI.interactiveInstance) {
                console.log("Simple visualizer interactions already enabled - skipping interactions");
                return;
            }

            if (window.simpleVisualizerAPI && window.simpleVisualizerAPI.instance) {
      //3
                console.log("Simple visualizer detected - adding interactions from main_view");

                const mainView = document.getElementById('main-view');
                const visualizerContent = document.getElementById('visualizer-content');
                const simpleVisualizerSvg = document.getElementById('simple_visualizer');

                if (mainView && visualizerContent && simpleVisualizerSvg &&
                    mainView.contains(simpleVisualizerSvg) && window.graphInteractionManager) {
//4
                    console.log("Enabling simple visualizer interactions from main_view", window.graphInteractionManager);

                    const interactiveInstance = window.graphInteractionManager
                        .enableGenericPluginInteractions(window.simpleVisualizerAPI.instance, true, true);
//5
                    if (interactiveInstance) {
                        window.simpleVisualizerAPI.interactiveInstance = interactiveInstance;
                        console.log("Interactive instance created successfully from main_view", interactiveInstance);
                    } else {
                        console.warn("Failed to create interactive instance from main_view");
                    }
                } else {
                    console.log("Simple visualizer not in main view or required elements missing");
                }
            }
        };
//1
        // Check for visualizer and set up both interactions and bird view
        // In main_view.js - replace the checkForVisualizer function with:

function checkForVisualizer() {
    // Look for simple visualizer elements with enabled="true"
    const svg = document.querySelector('#simple_visualizer');

    if (svg) {
        console.log("Found simple visualizer elements - creating API instance");

        // Create the API instance in Django app code
        const container = svg.querySelector('.visualization-container');
        const nodeData = window.graphData ? window.graphData.nodes : [];
        const linkDataUnprocessed = window.graphData ? window.graphData.edges : [];
        const linkData = linkDataUnprocessed.map(link => ({
            source: link.src,
            target: link.dest
        }));

        // Create D3 selections from existing DOM elements
        const svgSelection = d3.select('#simple_visualizer');
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

        // Create the API instance
        window.simpleVisualizerAPI = {
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

        console.log("Simple visualizer API instance created with data binding", window.simpleVisualizerAPI.instance);

        // Now enable interactions
        setupInteractionsIfNeeded();

        // Initialize bird view
        setTimeout(() => {
            initializeBirdViewIfNeeded();
        }, 200);

    } else {
        console.log("Simple visualizer elements not ready yet - will retry");
        setTimeout(checkForVisualizer, 300);
    }
}
        // Also try to initialize bird view even if interactions already exist
        setTimeout(() => {
            if (window.graphInteractionManager) {
                console.log('bird pokusaj 2')

                initializeBirdViewIfNeeded();
            }
        }, 800); // Try bird view initialization after a delay regardless

        // Start the check process
        setTimeout(checkForVisualizer, 200);
        return;
    }

    console.log(`Found ${nodeElements.length} nodes and ${linkElements.length} links`);

    // Optimized resize handler - debounced
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("Handling resize event");

            const svgNode = svg.node();
            if (!svgNode) return;

            const newWidth = svgNode.clientWidth || 1000;
            const newHeight = svgNode.clientHeight || 800;

            // Update any active simulations
            if (window.simpleVisualizerAPI && window.simpleVisualizerAPI.interactiveInstance) {
            console.log('update aktivnr')
                const { simulation } = window.simpleVisualizerAPI.interactiveInstance;
                if (simulation) {
                console.log('simulacija')

                    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
                    simulation.alpha(0.3).restart();
                }
            }

            // Update bird view after resize
            if (window.simpleVisualizerAPI && window.simpleVisualizerAPI.birdViewManager) {
                setTimeout(() => {
                console.log('bird nakon resize')
                    window.simpleVisualizerAPI.birdViewManager.updateBirdView();
                }, 100);
            }
        }, 150);
    });
});