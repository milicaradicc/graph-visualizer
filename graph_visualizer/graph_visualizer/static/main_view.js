document.addEventListener("DOMContentLoaded", () => {
  const svg = d3.select("svg[id^='svg-']");

  const nodeElements = svg.selectAll("g.node[enabled='true']").nodes();
  const linkElements = svg.selectAll("path.link[enabled='true']").nodes();

  const nodes = nodeElements.map((elem) => {
    const data = elem.__data__;
    const radius = 34; // Default radius from your template
    return {
      id: elem.id,
      radius: radius,
      ...data,
    };
  });

  const links = linkElements.map((elem) => {
    const data = elem.__data__;
    return {
      ...data,
      source: nodes.find((n) => n.id === elem.__data__.source.id),
      target: nodes.find((n) => n.id === elem.__data__.target.id),
    };
  });

  // Get SVG dimensions
  const svgNode = svg.node();
  const width = svgNode.clientWidth || 1000;
  const height = svgNode.clientHeight || 800;

  // Setup force simulation with improved parameters
  const simulation = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(150))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => (d.radius || 34) + 30))
    .force("gravity", d3.forceManyBody().strength(-100))
    .on("tick", tick);

  function tick() {
    // Update curved link paths for bidirectional links
    svg
      .selectAll("path.link")
      .data(links)
      .attr("d", function (d) {
        const reverse = links.find(
          (l) => l.source.id === d.target.id && l.target.id === d.source.id
        );

        if (reverse && reverse !== d) {
          const offset = 20;
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist === 0) return `M${d.source.x},${d.source.y}`;

          const nx = -dy / dist;
          const ny = dx / dist;

          const mx = (d.source.x + d.target.x) / 2 + nx * offset;
          const my = (d.source.y + d.target.y) / 2 + ny * offset;

          return `M${d.source.x},${d.source.y} Q${mx},${my} ${d.target.x},${d.target.y}`;
        } else {
          return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`;
        }
      });

    // Update node positions with boundary constraints
    svg
      .selectAll("g.node")
      .data(nodes)
      .attr("transform", (d) => {
        // Constrain nodes to stay within SVG boundaries
        d.x = Math.max(d.radius || 34, Math.min(width - (d.radius || 34), d.x));
        d.y = Math.max(d.radius || 34, Math.min(height - (d.radius || 34), d.y));
        return `translate(${d.x},${d.y})`;
      });
  }

  // Wait for interaction manager and then register simulation
  function registerInteractions() {
    if (window.graphInteractionManager) {
      window.graphInteractionManager.setActiveSimulation(simulation);

      // Apply drag behavior from interaction manager
      const dragBehavior = window.graphInteractionManager.createDragBehavior(simulation);
      if (dragBehavior) {
        d3.selectAll("g.node[drag='true']").call(dragBehavior);
      } else {
        // Fallback to original drag behavior
        d3.selectAll("g.node[drag='true']").call(
          d3
            .drag()
            .on("start", (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on("end", (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        );
      }

      // Apply zoom behavior from interaction manager
      const g = d3.select("svg[zoom='true'] g");
      const zoomBehavior = window.graphInteractionManager.createZoomBehavior(svg, g);
      if (zoomBehavior) {
        d3.selectAll("svg[zoom='true']").call(zoomBehavior);
      }
    } else {
      // Fallback to original behaviors if interaction manager not available
      d3.selectAll("g.node[drag='true']").call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

      var g = d3.select("svg[zoom='true'] g");
      const handleZoom = (e) => g.attr("transform", e.transform);
      const zoom = d3.zoom().on("zoom", handleZoom);
      d3.selectAll("svg[zoom='true']").call(zoom);
    }
  }

  // Register interactions after a brief delay
  setTimeout(registerInteractions, 50);

  // Node click focus functionality
  d3.selectAll("g.node[click-focus='true']").on("click", function (event, d) {
    dispatchNodeFocusEvent(d.id);
    handleNodeFocus(d.id);
  });

  function handleNodeFocus(nodeId) {
    d3.selectAll(".active-node")
      .selectAll("*:not(text)")
      .style("stroke", "#04446fff")
      .style("stroke-width", "1.5px");
    d3.selectAll(".active-node").classed("active-node", false);

    const g = d3.select("svg[zoom='true'] g");
    const focusedNode = g.selectAll(".node").filter((d) => d.id === nodeId);
    focusedNode.classed("active-node", true);
    focusedNode
      .selectAll("*:not(text)")
      .style("stroke", "#04446fff")
      .style("stroke-width", "4px");
    focusedNode.select("text").style("fill", "#04446fff");

    if (!focusedNode.empty()) {
      const svg = d3.select("svg[zoom='true']");
      const svgNode = svg.node();
      const transform = d3.zoomTransform(svgNode);

      const svgWidth = svgNode.clientWidth;
      const svgHeight = svgNode.clientHeight;

      const nodeDatum = focusedNode.datum();
      const targetX = nodeDatum.x;
      const targetY = nodeDatum.y;

      const newTransform = d3.zoomIdentity
        .translate(
          svgWidth / 2 - targetX * transform.k,
          svgHeight / 2 - targetY * transform.k
        )
        .scale(transform.k);

      const zoom = d3.zoom();
      svg.transition().duration(750).call(zoom.transform, newTransform);
    }
  }

  // Tooltip functionality
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "white")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  d3.selectAll("g.node[tooltip='true']")
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 0.9);

      let formattedData = "N/A";
      if (d.data && typeof d.data === "object") {
        formattedData = Object.entries(d.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join("<br/>");
      }
      tooltip
        .html(
          `
                    ${d.id}<br/>
                    ${formattedData}
                `
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // External event listener for node focus
  document.addEventListener("node-focus", (e) => {
    const nodeId = e.detail;
    handleNodeFocus(nodeId);
  });

  // Helper function to dispatch node focus events
  function dispatchNodeFocusEvent(nodeId) {
    const event = new CustomEvent("node-focus", { detail: nodeId });
    document.dispatchEvent(event);
  }

  // Handle window resize
  window.addEventListener('resize', function() {
    const newWidth = svgNode.clientWidth || 1000;
    const newHeight = svgNode.clientHeight || 800;

    // Update center force
    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
    simulation.alpha(0.3).restart();
  });
});