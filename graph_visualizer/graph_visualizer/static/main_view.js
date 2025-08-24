document.addEventListener("DOMContentLoaded", () => {
    console.log("Main view DOM loaded");

    const svg = d3.select("svg");

    // Early exit if no SVG found
    if (svg.empty()) {
        console.warn("No SVG element found in main view");
        return;
    }

    const nodeElements = svg.selectAll("g.node[enabled='true']").nodes();
    const linkElements = svg.selectAll("path.link[enabled='true']").nodes();

    // Only proceed if we have pre-existing nodes and links (not for simple visualizer)
    if (nodeElements.length === 0 && linkElements.length === 0) {
        console.log("No traditional graph elements found - checking for simple visualizer");

        // Separate function to initialize bird view regardless of interaction state
        const initializeBirdViewIfNeeded = () => {
            // Check if bird view is already initialized
            if (window.simpleVisualizerAPI && window.simpleVisualizerAPI.birdViewManager) {
                console.log("Bird view already initialized - skipping");
                return;
            }

            // Verify bird view SVG exists
            const birdSvg = document.getElementById('bird-svg');
            if (!birdSvg) {
                console.error("Bird view SVG not found in DOM");
                return;
            }

            console.log("Initializing bird view independent of interactions");
            const birdViewManager = window.graphInteractionManager
                .initializeBirdView('#simple_visualizer', 'bird-svg');

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

        // Function to handle interactions
        const setupInteractionsIfNeeded = () => {
            if (window.simpleVisualizerAPI && window.simpleVisualizerAPI.interactiveInstance) {
                console.log("Simple visualizer interactions already enabled - skipping interactions");
                return;
            }

            if (window.simpleVisualizerAPI && window.simpleVisualizerAPI.instance) {
                console.log("Simple visualizer detected - adding interactions from main_view");

                const mainView = document.getElementById('main-view');
                const visualizerContent = document.getElementById('visualizer-content');
                const simpleVisualizerSvg = document.getElementById('simple_visualizer');

                if (mainView && visualizerContent && simpleVisualizerSvg &&
                    mainView.contains(simpleVisualizerSvg) && window.graphInteractionManager) {

                    console.log("Enabling simple visualizer interactions from main_view");

                    const interactiveInstance = window.graphInteractionManager
                        .enableSimpleVisualizerInteractions(window.simpleVisualizerAPI.instance, true, true);

                    if (interactiveInstance) {
                        console.log("Interactive instance created successfully from main_view");
                        window.simpleVisualizerAPI.interactiveInstance = interactiveInstance;
                    } else {
                        console.warn("Failed to create interactive instance from main_view");
                    }
                } else {
                    console.log("Simple visualizer not in main view or required elements missing");
                }
            }
        };

        // Check for simple visualizer and set up both interactions and bird view
        const checkForSimpleVisualizer = () => {
            if (window.simpleVisualizerAPI && window.simpleVisualizerAPI.instance) {
                console.log("Simple visualizer API ready - setting up interactions and bird view");

                // Set up interactions first
                setupInteractionsIfNeeded();

                // Then set up bird view (independent of interactions)
                setTimeout(() => {
                    initializeBirdViewIfNeeded();
                }, 200); // Small delay to ensure interactions are set up first

            } else {
                console.log("Simple visualizer API not ready yet - will retry");
                // Retry once more after a longer delay if first attempt fails
                setTimeout(checkForSimpleVisualizer, 300);
            }
        };

        // Also try to initialize bird view even if interactions already exist
        setTimeout(() => {
            if (window.graphInteractionManager) {
                initializeBirdViewIfNeeded();
            }
        }, 800); // Try bird view initialization after a delay regardless

        // Start the check process
        setTimeout(checkForSimpleVisualizer, 200);
        return;
    }

    console.log(`Found ${nodeElements.length} nodes and ${linkElements.length} links`);

    // Traditional graph processing would go here if needed

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
                const { simulation } = window.simpleVisualizerAPI.interactiveInstance;
                if (simulation) {
                    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
                    simulation.alpha(0.3).restart();
                }
            }

            // Update bird view after resize
            if (window.simpleVisualizerAPI && window.simpleVisualizerAPI.birdViewManager) {
                setTimeout(() => {
                    window.simpleVisualizerAPI.birdViewManager.updateBirdView();
                }, 100);
            }
        }, 150);
    });
});