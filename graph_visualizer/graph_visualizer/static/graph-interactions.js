// Global interaction handlers for all visualizers
function createGraphInteractionManager() {
    let activeSimulation = null;

    // Universal drag handler with D3 v4/v5 compatibility
    function createDragBehavior(simulation) {
        function dragstarted(d) {
            // D3 v4/v5 compatibility
            const event = d3.event;
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            // D3 v4/v5 compatibility
            const event = d3.event;
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(d) {
            // D3 v4/v5 compatibility
            const event = d3.event;
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    // Universal zoom handler with D3 v4/v5 compatibility
    function createZoomBehavior(svg, container, labels = null) {
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
                // D3 v4/v5 compatibility - get transform from d3.event or event parameter
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

    // Pan to specific coordinates with D3 v4/v5 compatibility
    function panTo(svg, x, y, scale = 1) {
        const svgSelection = svg.node ? svg : d3.select(svg);
        svgSelection.transition()
            .duration(750)
            .call(d3.zoom().transform, d3.zoomIdentity.translate(x, y).scale(scale));
    }

    // Reset view with D3 v4/v5 compatibility
    function resetView(svg) {
        const svgSelection = svg.node ? svg : d3.select(svg);
        svgSelection.transition()
            .duration(750)
            .call(d3.zoom().transform, d3.zoomIdentity);
    }

    // Set active simulation for external control
    function setActiveSimulation(simulation) {
        activeSimulation = simulation;
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
        getCurrentTransform
    };
}

// Global instance
window.graphInteractionManager = createGraphInteractionManager();

// Event handlers for visualizer switching
function initializeVisualizerSwitching() {
    const selectElement = document.getElementById('visualizer-select');
    if (!selectElement) return;

    selectElement.addEventListener('change', function(e) {
        const selectedVisualizer = e.target.value;
        console.log('Switching to visualizer:', selectedVisualizer);

        // Hide all visualizers
        document.querySelectorAll('.graph-view svg').forEach(svg => {
            svg.style.display = 'none';
        });

        // Show selected visualizer
        const targetSvg = document.getElementById(`${selectedVisualizer}_visualizer`);
        if (targetSvg) {
            targetSvg.style.display = 'block';
            // Trigger resize event if needed
            window.dispatchEvent(new Event('resize'));
        }
    });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeVisualizerSwitching();
});