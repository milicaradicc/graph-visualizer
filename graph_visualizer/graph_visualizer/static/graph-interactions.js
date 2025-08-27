function createGraphInteractionManager() {
    let activeSimulation = null;
    let isInitialized = false;

    function createDragBehavior(simulation) {
        function dragStarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragEnded(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded);
    }

    function createZoomBehavior(svg, container, labels = null) {
        const zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .on("zoom", function() {
                const transform = d3.event.transform;
                container.attr("transform", transform);

                if (labels) {
                    const scale = transform.k;
                    labels
                        .style("font-size", `${Math.max(6, 10 / scale)}px`)
                        .style("display", scale > 0.6 ? "block" : "none");
                }

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

    function enableGenericPluginInteractions(visualizerInstance, enableDrag = true, enableZoom = true, isDirected = true) {
        if (!visualizerInstance || !visualizerInstance.nodeData) {
            console.warn('Invalid visualizer instance', visualizerInstance);
            return null;
        }

        const { svg, container, nodeSelection, linkSelection, nodeData, linkData } = visualizerInstance;
        const width = svg.node().clientWidth || 800;
        const height = svg.node().clientHeight || 600;

        const simulation = d3.forceSimulation(nodeData)
            .force("link", d3.forceLink(linkData).id(d => d.id).distance(200))
            .force("charge", d3.forceManyBody().strength(0))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(70))
            .force("gravity", d3.forceManyBody().strength(-100))
            .on("tick", tick);

        function tick() {
            linkSelection
                .attr("d", function (d) {
                    const reverse = linkData.find(
                        (l) => l.source.id === d.target.id && l.target.id === d.source.id
                    );

                    if (reverse && reverse !== d) {
                        const offset = 20;
                        const dx = d.target.x - d.source.x;
                        const dy = d.target.y - d.source.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist > 0) {
                            const nx = -dy / dist;
                            const ny = dx / dist;

                            const mx = (d.source.x + d.target.x) / 2 + nx * offset;
                            const my = (d.source.y + d.target.y) / 2 + ny * offset;

                            return `M${d.source.x},${d.source.y} Q${mx},${my} ${d.target.x},${d.target.y}`;
                        }
                    }
                    return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`;
                });

                nodeSelection
                    .attr("transform", (d) => `translate(${d.x},${d.y})`);
            }

        if (enableDrag && nodeSelection) {
            nodeSelection.call(createDragBehavior(simulation));
        }

        if (enableZoom) {
            createZoomBehavior(svg, container);
        }

        setTimeout(() => fitGraphToView(svg, container, nodeData, width, height), 150);

        return {
            simulation,
            restart: () => simulation.alpha(0.3).restart(),
            stop: () => simulation.stop(),
            fitToView: () => fitGraphToView(svg, container, nodeData, width, height)
        };
    }

    function fitGraphToView(svg, container, nodeData, width, height) {
        if (!nodeData || nodeData.length === 0) return;

        const padding = 50;

        const xExtent = d3.extent(nodeData, d => d.x);
        const yExtent = d3.extent(nodeData, d => d.y);

        const graphWidth = Math.max(xExtent[1] - xExtent[0], 1);
        const graphHeight = Math.max(yExtent[1] - yExtent[0], 1);

        const graphCenterX = (xExtent[0] + xExtent[1]) / 2;
        const graphCenterY = (yExtent[0] + yExtent[1]) / 2;

        const availableWidth = width - padding * 2;
        const availableHeight = height - padding * 2;

        const scaleX = availableWidth / graphWidth;
        const scaleY = availableHeight / graphHeight;

        const scale = Math.min(scaleX, scaleY, 2);

        const translateX = width / 2 - graphCenterX * scale;
        const translateY = height / 2 - graphCenterY * scale;

        const zoom = d3.zoom();
        svg.transition()
            .duration(750)
            .ease(d3.easeQuadInOut)
            .call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
    }

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

            const transform = d3.zoomTransform(mainSvgNode);
            const scale = transform.k;
            const translateX = transform.x;
            const translateY = transform.y;

            const viewportWidth = (mainWidth / scale) * birdScale;
            const viewportHeight = (mainHeight / scale) * birdScale;

            const viewportX = birdTranslateX - (translateX / scale) * birdScale;
            const viewportY = birdTranslateY - (translateY / scale) * birdScale;

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

            mainContentGroup.selectAll("*").remove();
            const contentWrapper = mainContentGroup.append("g").attr("class", "content-wrapper");
            contentWrapper.html(mainViewHtml);

            contentWrapper.selectAll("*")
                .style("cursor", "default")
                .on(".drag", null)
                .on(".zoom", null);

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

window.graphInteractionManager = createGraphInteractionManager();

function initializeVisualizerSwitching() {
    const selectElement = document.getElementById('visualizer-select');
    if (!selectElement) return;

    selectElement.addEventListener('change', function(e) {
        const selectedVisualizer = e.target.value;

        document.querySelectorAll('.visualizer-content > div').forEach(div => {
            div.style.display = 'none';
            div.classList.remove('active');
        });

        const targetDiv = document.getElementById(`visualizer-${selectedVisualizer}`);
        if (targetDiv) {
            targetDiv.style.display = 'block';
            targetDiv.classList.add('active');

            setTimeout(() => {
                if (window.birdViewManager) {
                    window.birdViewManager.updateBirdView();
                }
            }, 300);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    if (!window.graphInteractionManager.isInitialized()) {
        initializeVisualizerSwitching();
        window.graphInteractionManager.setInitialized(true);
    }
});