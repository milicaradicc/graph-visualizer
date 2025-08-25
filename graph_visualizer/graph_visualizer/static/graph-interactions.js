// Simplified Graph Interaction Manager
function createGraphInteractionManager() {
    console.log("Creating interaction manager");

    let activeSimulation = null;
    let isInitialized = false;

    // Create drag behavior for nodes
    function createDragBehavior(simulation) {
        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    // Create zoom behavior for SVG
    function createZoomBehavior(svg, container, labels = null) {
        const zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .on("zoom", function() {
                const transform = d3.event.transform;
                container.attr("transform", transform);

                // Scale labels based on zoom level
                if (labels) {
                    const scale = transform.k;
                    labels
                        .style("font-size", `${Math.max(6, 10 / scale)}px`)
                        .style("display", scale > 0.6 ? "block" : "none");
                }

                // Update bird view and viewport
                if (window.birdViewManager) {
                    clearTimeout(window.birdViewTimeout);
                    window.birdViewTimeout = setTimeout(() => {
                        window.birdViewManager.updateBirdView();
                        window.birdViewManager.updateViewport(svg);
                    }, 50);
                }
            });

        svg.call(zoom);
        return zoom;
    }

    // Enable interactions for visualizer
    function enableGenericPluginInteractions(visualizerInstance, enableDrag = true, enableZoom = true) {
        if (!visualizerInstance || !visualizerInstance.nodeData) {
            console.warn('Invalid visualizer instance', visualizerInstance);
            return null;
        }
        console.log(visualizerInstance)

        const { svg, container, nodeSelection, linkSelection, labelSelection, nodeData, linkData } = visualizerInstance;
        const width = svg.node().clientWidth || 800;
        const height = svg.node().clientHeight || 600;

        // Create simulation
        const simulation = d3.forceSimulation(nodeData)
            .force("link", d3.forceLink(linkData).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => d.radius + 10))
            .on("tick", tick);

        function tick() {
            linkSelection
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            nodeSelection
                .attr("cx", d => d.x = Math.max(d.radius + 5, Math.min(width - d.radius - 5, d.x)))
                .attr("cy", d => d.y = Math.max(d.radius + 5, Math.min(height - d.radius - 5, d.y)));

            labelSelection
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        }

        activeSimulation = simulation;

        // Add behaviors
        if (enableDrag) {
            nodeSelection.call(createDragBehavior(simulation));
        }

        if (enableZoom) {
            createZoomBehavior(svg, container, labelSelection);
        }

        // Fit to view after initialization
        setTimeout(() => fitGraphToView(svg, container, nodeData, width, height), 150);

        return {
            simulation,
            restart: () => simulation.alpha(0.3).restart(),
            stop: () => simulation.stop(),
            fitToView: () => fitGraphToView(svg, container, nodeData, width, height)
        };
    }

    // Fit graph to view
    function fitGraphToView(svg, container, nodeData, width, height) {
        if (!nodeData || nodeData.length === 0) return;

        const padding = 50;
        const xExtent = d3.extent(nodeData, d => d.x);
        const yExtent = d3.extent(nodeData, d => d.y);

        const graphWidth = xExtent[1] - xExtent[0];
        const graphHeight = yExtent[1] - yExtent[0];
        const graphCenterX = (xExtent[0] + xExtent[1]) / 2;
        const graphCenterY = (yExtent[0] + yExtent[1]) / 2;

        const scaleX = (width - padding * 2) / graphWidth;
        const scaleY = (height - padding * 2) / graphHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        const translateX = width / 2 - graphCenterX * scale;
        const translateY = height / 2 - graphCenterY * scale;

        svg.transition()
            .duration(750)
            .call(d3.zoom().transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
    }

    // Initialize bird view observer
    function initializeBirdView(mainViewSelector, birdViewSvgId) {
        let isUpdating = false;
        const configuration = { attributes: true, childList: true, subtree: true };

        const birdViewSvg = d3.select(`#${birdViewSvgId}`);
        if (birdViewSvg.empty()) {
            console.error(`Bird view SVG not found: ${birdViewSvgId}`);
            return null;
        }

        birdViewSvg.selectAll("*").remove();
        const mainContentGroup = birdViewSvg.append("g").attr("id", "main-content-group");

        // Create viewport rectangle
        const viewportRect = birdViewSvg.append("rect")
            .attr("id", "viewport-rect")
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("opacity", 0.7)
            .style("pointer-events", "none");

        let birdScale = 1;
        let birdTranslateX = 0;
        let birdTranslateY = 0;

        function updateViewport(mainSvg) {
            const mainViewSvg = mainSvg || d3.select(mainViewSelector);
            if (mainViewSvg.empty()) return;

            const mainSvgNode = mainViewSvg.node();
            const mainWidth = mainSvgNode.clientWidth || 800;
            const mainHeight = mainSvgNode.clientHeight || 600;

            // Get current transform from main view
            const transform = d3.zoomTransform(mainSvgNode);
            const scale = transform.k;
            const translateX = transform.x;
            const translateY = transform.y;

            // Calculate viewport dimensions in bird view coordinates
            const viewportWidth = (mainWidth / scale) * birdScale;
            const viewportHeight = (mainHeight / scale) * birdScale;

            // Calculate viewport position in bird view
            const viewportX = birdTranslateX - (translateX / scale) * birdScale;
            const viewportY = birdTranslateY - (translateY / scale) * birdScale;

            // Update viewport rectangle
            viewportRect
                .attr("x", viewportX)
                .attr("y", viewportY)
                .attr("width", viewportWidth)
                .attr("height", viewportHeight);
        }

        function updateBirdView() {
            if (isUpdating) return;
            isUpdating = true;

            const mainViewSvg = d3.select(mainViewSelector);
            if (mainViewSvg.empty()) return;

            const mainContent = mainViewSvg.select('.visualization-container');
            if (mainContent.empty()) return;

            const mainViewHtml = mainContent.html();
            if (!mainViewHtml) return;

            // Update bird view content
            mainContentGroup.selectAll("*").remove();
            const contentWrapper = mainContentGroup.append("g").attr("class", "content-wrapper");
            contentWrapper.html(mainViewHtml);

            // Remove interactions from cloned content
            contentWrapper.selectAll("*")
                .style("cursor", "default")
                .on(".drag", null)
                .on(".zoom", null);

            // Scale to fit bird view
            setTimeout(() => {
                const birdViewNode = birdViewSvg.node();
                const birdViewWidth = birdViewNode.clientWidth || 300;
                const birdViewHeight = birdViewNode.clientHeight || 200;

                const bBox = contentWrapper.node().getBBox();
                if (bBox.width > 0 && bBox.height > 0) {
                    const padding = 15;
                    const xScale = (birdViewWidth - padding * 2) / bBox.width;
                    const yScale = (birdViewHeight - padding * 2) / bBox.height;
                    const minScale = Math.min(xScale, yScale, 0.8);

                    birdScale = minScale;
                    birdTranslateX = (birdViewWidth - bBox.width * minScale) / 2 - bBox.x * minScale;
                    birdTranslateY = (birdViewHeight - bBox.height * minScale) / 2 - bBox.y * minScale;

                    contentWrapper.attr("transform", `translate(${birdTranslateX}, ${birdTranslateY}) scale(${minScale})`);

                    // Update viewport after content is scaled
                    setTimeout(() => updateViewport(), 50);
                }
                isUpdating = false;
            }, 100);
        }

        const observer = new MutationObserver(() => {
            if (!isUpdating) {
                clearTimeout(window.birdViewTimeout);
                window.birdViewTimeout = setTimeout(updateBirdView, 200);
            }
        });

        const mainViewSvg = d3.select(mainViewSelector);
        if (!mainViewSvg.empty()) {
            observer.observe(mainViewSvg.node(), configuration);
            setTimeout(updateBirdView, 200);
        }

        return {
            updateBirdView,
            updateViewport,
            stopObserving: () => observer.disconnect()
        };
    }

    return {
        createDragBehavior,
        createZoomBehavior,
        enableGenericPluginInteractions,
        fitGraphToView,
        initializeBirdView,
        isInitialized: () => isInitialized,
        setInitialized: (value) => { isInitialized = value; }
    };
}

// Initialize global instance
window.graphInteractionManager = createGraphInteractionManager();

// Initialize visualizer switching
function initializeVisualizerSwitching() {
    const selectElement = document.getElementById('visualizer-select');
    if (!selectElement) return;

    selectElement.addEventListener('change', function(e) {
        const selectedVisualizer = e.target.value;

        // Hide all visualizers
        document.querySelectorAll('.visualizer-content > div').forEach(div => {
            div.style.display = 'none';
            div.classList.remove('active');
        });

        // Show selected visualizer
        const targetDiv = document.getElementById(`visualizer-${selectedVisualizer}`);
        if (targetDiv) {
            targetDiv.style.display = 'block';
            targetDiv.classList.add('active');

            // Update bird view
            setTimeout(() => {
                if (window.birdViewManager) {
                    window.birdViewManager.updateBirdView();
                }
            }, 300);
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (!window.graphInteractionManager.isInitialized()) {
        initializeVisualizerSwitching();
        window.graphInteractionManager.setInitialized(true);
    }
});