// Global interaction handlers for all visualizers - OPTIMIZED VERSION
function createGraphInteractionManager() {
    console.log("Creating interaction manager");

    let activeSimulation = null;
    let zoomBehavior = null;
    let dragBehavior = null;
    let isInitialized = false;

    // Cache for DOM elements to avoid repeated queries
    const domCache = new Map();

    // Helper to get cached DOM element
    function getCachedElement(selector) {
        if (!domCache.has(selector)) {
            domCache.set(selector, document.querySelector(selector));
        }
        return domCache.get(selector);
    }

    // Clear DOM cache when needed
    function clearDOMCache() {
        domCache.clear();
    }

    // Universal drag handler with D3 v4/v5 compatibility
    function createDragBehavior(simulation) {
        // Reuse existing drag behavior if simulation hasn't changed
        if (dragBehavior && activeSimulation === simulation) {
            return dragBehavior;
        }

        console.log("Creating new drag behavior");

        function dragstarted(d) {
            const event = d3.event;
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            const event = d3.event;
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(d) {
            const event = d3.event;
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        dragBehavior = d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);

        return dragBehavior;
    }

    // Universal zoom handler with D3 v4/v5 compatibility
    function createZoomBehavior(svg, container, labels = null) {
        console.log("Creating zoom behavior");

        // Ensure we have proper D3 selections
        const svgSelection = svg.node ? svg : d3.select(svg);
        const containerSelection = container.node ? container : d3.select(container);

        // Verify the container exists
        if (containerSelection.empty()) {
            console.error('Container element not found for zoom behavior');
            return null;
        }

        const zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .on("zoom", function() {
                const transform = d3.event ? d3.event.transform : d3.zoomTransform(this);

                if (!transform) {
                    console.error('Could not get zoom transform');
                    return;
                }

                // Apply transform to the container
                containerSelection.attr("transform", transform);

                // Handle label scaling if labels exist
                if (labels) {
                    const labelsSelection = labels.node ? labels : d3.select(labels);
                    if (!labelsSelection.empty()) {
                        const scale = transform.k;
                        labelsSelection
                            .style("font-size", `${Math.max(6, 10 / scale)}px`)
                            .style("display", scale > 0.6 ? "block" : "none");
                    }
                }
            });

        svgSelection.call(zoom);
        return zoom;
    }

    // Pan to specific coordinates
    function panTo(svg, x, y, scale = 1) {
        const svgSelection = svg.node ? svg : d3.select(svg);
        svgSelection.transition()
            .duration(750)
            .call(d3.zoom().transform, d3.zoomIdentity.translate(x, y).scale(scale));
    }

    // Reset view
    function resetView(svg) {
        const svgSelection = svg.node ? svg : d3.select(svg);
        svgSelection.transition()
            .duration(750)
            .call(d3.zoom().transform, d3.zoomIdentity);
    }

    // Set active simulation for external control
    function setActiveSimulation(simulation) {
        console.log("Setting active simulation");
        activeSimulation = simulation;
    }

    // REMOVED: enableInteractions - not being used effectively

    function enableSimpleVisualizerInteractions(visualizerInstance, enableDrag = true, enableZoom = true) {
        console.log("Enabling simple visualizer interactions");

        if (!visualizerInstance || !visualizerInstance.nodeData) {
            console.warn('Invalid visualizer instance provided');
            return null;
        }

        const { svg, container, nodeSelection, linkSelection, labelSelection, nodeData, linkData } = visualizerInstance;

        // Get SVG dimensions once
        const svgNode = svg.node();
        const width = svgNode.clientWidth || 800;
        const height = svgNode.clientHeight || 600;

        // Create force simulation for the static visualization
        const simulation = d3.forceSimulation(nodeData)
            .force("link", d3.forceLink(linkData).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => d.radius + 10))
            .on("tick", tick);

        // Optimized tick function - reduce DOM queries
        function tick() {
            // Batch DOM updates
            linkSelection
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            nodeSelection
                .attr("cx", d => {
                    d.x = Math.max(d.radius + 5, Math.min(width - d.radius - 5, d.x));
                    return d.x;
                })
                .attr("cy", d => {
                    d.y = Math.max(d.radius + 5, Math.min(height - d.radius - 5, d.y));
                    return d.y;
                });

            labelSelection
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        }

        // Set as active simulation
        setActiveSimulation(simulation);

        // Add drag behavior if requested
        if (enableDrag) {
            const dragBehavior = createDragBehavior(simulation);
            nodeSelection.call(dragBehavior);
        }

        // Add zoom behavior if requested
        if (enableZoom) {
            const zoomBehavior = createZoomBehavior(svg, container, labelSelection);
            svg.call(zoomBehavior);
        }

        // Delay fit to view to ensure proper rendering
        setTimeout(() => {
            console.log("Fitting graph to view");
            fitGraphToView(svg, container, nodeData, width, height);
        }, 150); // Increased delay to ensure DOM is ready

        return {
            simulation,
            restart: () => simulation.alpha(0.3).restart(),
            stop: () => simulation.stop(),
            fitToView: () => fitGraphToView(svg, container, nodeData, width, height)
        };
    }

    function fitGraphToView(svg, container, nodeData, width, height) {
        if (!nodeData || nodeData.length === 0) {
            console.warn("No node data for fitting to view");
            return;
        }

        const padding = 50;

        // Calculate bounds of all nodes
        const xExtent = d3.extent(nodeData, d => d.x);
        const yExtent = d3.extent(nodeData, d => d.y);

        if (!xExtent[0] || !yExtent[0]) {
            console.warn("Invalid node extents for fitting");
            return;
        }

        const graphWidth = xExtent[1] - xExtent[0];
        const graphHeight = yExtent[1] - yExtent[0];
        const graphCenterX = (xExtent[0] + xExtent[1]) / 2;
        const graphCenterY = (yExtent[0] + yExtent[1]) / 2;

        // Calculate scale to fit graph within bounds
        const scaleX = (width - padding * 2) / graphWidth;
        const scaleY = (height - padding * 2) / graphHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

        // Calculate translation to center the graph
        const translateX = width / 2 - graphCenterX * scale;
        const translateY = height / 2 - graphCenterY * scale;

        // Apply transform
        const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);

        const svgSelection = svg.node ? svg : d3.select(svg);

        svgSelection.transition()
            .duration(750)
            .call(d3.zoom().transform, transform);
    }

    // Get current view transform
    function getCurrentTransform(svg) {
        const svgSelection = svg.node ? svg : d3.select(svg);
        return d3.zoomTransform(svgSelection.node());
    }

    // Public API
    return {
        createDragBehavior,
        createZoomBehavior,
        panTo,
        resetView,
        setActiveSimulation,
        getCurrentTransform,
        enableSimpleVisualizerInteractions,
        fitGraphToView,
        clearDOMCache,
        isInitialized: () => isInitialized,
        setInitialized: (value) => { isInitialized = value; }
    };
}

// Global instance
window.graphInteractionManager = createGraphInteractionManager();

// Optimized visualizer switching with reduced DOM queries
function initializeVisualizerSwitching() {
    console.log("Initializing visualizer switching");

    const selectElement = document.getElementById('visualizer-select');
    if (!selectElement) {
        console.warn("Visualizer select element not found");
        return;
    }

    // Cache frequently accessed elements
    const visualizerContents = document.querySelectorAll('.visualizer-content > div');

    selectElement.addEventListener('change', function(e) {
        const selectedVisualizer = e.target.value;
        console.log('Switching to visualizer:', selectedVisualizer);

        // Hide all visualizers efficiently
        visualizerContents.forEach(div => {
            div.style.display = 'none';
            div.classList.remove('active');
        });

        // Show selected visualizer
        const targetDiv = document.getElementById(`visualizer-${selectedVisualizer}`);
        if (targetDiv) {
            targetDiv.style.display = 'block';
            targetDiv.classList.add('active');

            // Clear DOM cache when switching visualizers
            if (window.graphInteractionManager) {
                window.graphInteractionManager.clearDOMCache();
            }

            // Trigger resize event if needed
            window.dispatchEvent(new Event('resize'));
        } else {
            console.warn(`Target visualizer not found: visualizer-${selectedVisualizer}`);
        }
    });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded - initializing visualizer switching");

    // Only initialize once
    if (!window.graphInteractionManager.isInitialized()) {
        initializeVisualizerSwitching();
        window.graphInteractionManager.setInitialized(true);
    }
});