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

        // Check if interactions are already enabled to prevent double initialization
        if (window.simpleVisualizerAPI && window.simpleVisualizerAPI.interactiveInstance) {
            console.log("Simple visualizer interactions already enabled - skipping");
            return;
        }

        // Optimized simple visualizer detection with single timeout
        const checkForSimpleVisualizer = () => {
            if (window.simpleVisualizerAPI && window.simpleVisualizerAPI.instance) {
                // Double-check that interactions aren't already added
                if (window.simpleVisualizerAPI.interactiveInstance) {
                    console.log("Interactions already exist - skipping duplicate initialization");
                    return;
                }

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
            } else {
                console.log("Simple visualizer API not ready yet - will retry");

                // Retry once more after a longer delay if first attempt fails
                setTimeout(checkForSimpleVisualizer, 200);
            }
        };

        // Single timeout instead of immediate execution
        setTimeout(checkForSimpleVisualizer, 150);
        return;
    }

    console.log(`Found ${nodeElements.length} nodes and ${linkElements.length} links`);

    // Traditional graph processing would go here if needed
    // (The commented-out code from original would be here)

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
        }, 150); // Debounce resize events
    });
});