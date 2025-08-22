// Global interaction handlers for all visualizers
function createGraphInteractionManager() {
    let activeSimulation = null;

    // Universal drag handler
    function createDragBehavior(simulation) {
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    // Universal zoom handler
    function createZoomBehavior(svg, container, labels = null) {
        const zoom = d3.zoom()
            .scaleExtent([0.1, 5])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);

                // Handle label scaling if labels exist
                if (labels) {
                    labels.style("font-size", `${12 / event.transform.k}px`);
                    labels.style("display", event.transform.k > 1.5 ? "block" : "none");
                }
            });

        svg.call(zoom);
        return zoom;
    }

    // Pan to specific coordinates
    function panTo(svg, x, y, scale = 1) {
        const zoom = d3.zoom();
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(scale));
    }

    // Reset view
    function resetView(svg) {
        const zoom = d3.zoom();
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
    }

    // Set active simulation for external control
    function setActiveSimulation(simulation) {
        activeSimulation = simulation;
    }

    // Get current view transform
    function getCurrentTransform(svg) {
        return d3.zoomTransform(svg.node());
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

// Keyboard shortcuts for interactions
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        const svg = document.querySelector('.graph-view svg:not([style*="display: none"])');
        if (!svg) return;

        switch(e.key) {
            case 'r':
            case 'R':
                // Reset view
                window.graphInteractionManager.resetView(d3.select(svg));
                break;
            case '=':
            case '+':
                // Zoom in
                const zoomIn = d3.zoom().scaleBy;
                d3.select(svg).transition().call(zoomIn, 1.2);
                break;
            case '-':
            case '_':
                // Zoom out
                const zoomOut = d3.zoom().scaleBy;
                d3.select(svg).transition().call(zoomOut, 0.8);
                break;
        }
    });
}

// Add visual feedback for interactions
function addInteractionFeedback() {
    // Add loading indicator styles
    const style = document.createElement('style');
    style.textContent = `
        .graph-loading {
            pointer-events: none;
            opacity: 0.7;
        }
        .graph-loading::after {
            content: "Loading...";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
        }
        .graph-controls {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 5px;
            border-radius: 3px;
            font-size: 12px;
            z-index: 1000;
        }
    `;
    document.head.appendChild(style);
}

// Utility functions for graph management
function showGraphLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.add('graph-loading');
    }
}

function hideGraphLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.remove('graph-loading');
    }
}

function addGraphControls(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const controls = document.createElement('div');
    controls.className = 'graph-controls';
    controls.innerHTML = `
        <div>Controls:</div>
        <div>R - Reset view</div>
        <div>+/- - Zoom in/out</div>
        <div>Drag nodes to move</div>
        <div>Mouse wheel to zoom</div>
    `;

    container.style.position = 'relative';
    container.appendChild(controls);

    // Hide controls after 5 seconds
    setTimeout(() => {
        controls.style.opacity = '0';
        setTimeout(() => controls.remove(), 300);
    }, 5000);
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeVisualizerSwitching();
    initializeKeyboardShortcuts();
    addInteractionFeedback();

    // Add controls to main view
    addGraphControls('main-view');
});

// Export for use in other scripts
window.GraphInteractions = {
    showLoading: showGraphLoading,
    hideLoading: hideGraphLoading,
    addControls: addGraphControls
};