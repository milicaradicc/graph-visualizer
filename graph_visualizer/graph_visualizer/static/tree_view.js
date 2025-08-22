// TODO: enable scroll when many items are opened
// TODO: graph change - detect change in main using observer and render new tree
(function() {
    const container = document.getElementById("tree-container");
    console.log(container)
    const graph = graphData;

    if (!graph) {
        container.innerHTML = "<p>No graph data available.</p>";
        return;
    }

    let nodes = graph.nodes || [];
    let edges = graph.edges || [];

    if (nodes.length === 0) {
        container.innerHTML = "<p>No valid nodes found.</p>";
        return;
    }

    // map nodes by id
    const nodeMap = {};
    nodes.forEach(node => {
        nodeMap[node.id] = { ...node, children: [] };
    });

    // link parent and child nodes
    edges.forEach(edge => {
        const parent = nodeMap[edge.src];
        const child = nodeMap[edge.dest];
        if (parent && child) {
            parent.children.push(child);
        } else {
        }
    });

    // --- hybrid root node detection ---
    function findRoots(nodes, edges) {
        // create set of nodes that have parents
        const hasParent = new Set();
        edges.forEach(edge => {
            hasParent.add(edge.dest);
        });

        // first add all nodes without parents (acyclic roots)
        const roots = [];
        const processedNodes = new Set();

        nodes.forEach(node => {
            if (!hasParent.has(node.id)) {
                roots.push(nodeMap[node.id]);
                // mark all reachable nodes from this root
                markReachableNodes(node.id, edges, processedNodes);
            }
        });

        // for remaining nodes (in cycles), use DFS approach
        nodes.forEach(node => {
            if (!processedNodes.has(node.id)) {
                roots.push(nodeMap[node.id]);
                markReachableNodes(node.id, edges, processedNodes);
            }
        });

        return roots;
    }

    function markReachableNodes(startNodeId, edges, processedNodes) {
        const stack = [startNodeId];
        const visited = new Set();

        while (stack.length > 0) {
            const nodeId = stack.pop();
            if (visited.has(nodeId)) continue;

            visited.add(nodeId);
            processedNodes.add(nodeId);

            // add all reachable nodes
            edges.forEach(edge => {
                if (edge.src === nodeId && !visited.has(edge.dest)) {
                    stack.push(edge.dest);
                }
            });
        }
    }

    const roots = findRoots(nodes, edges);

    // --- create tree node with lazy loading ---
    function createTreeNode(node, visited = new Set()) {
        const li = document.createElement("li");
        li.classList.add("tree-node");

        const span = document.createElement("span");
        span.classList.add("tree-node-label");

        const toggleBtn = document.createElement("span");
        toggleBtn.classList.add("toggle-btn");

        if (node.children.length > 0) {
            toggleBtn.textContent = "+";
            toggleBtn.style.cursor = "pointer";
        } else {
            toggleBtn.textContent = "";
        }

        span.appendChild(toggleBtn);
        span.appendChild(document.createTextNode(node.id));
        li.appendChild(span);

        // container for node attributes
        const dataDiv = document.createElement("div");
        dataDiv.classList.add("node-data");
        if (node.data && Object.keys(node.data).length > 0) {
            dataDiv.innerHTML = Object.entries(node.data)
                .map(([k, v]) => `<strong>${k}</strong>: ${v}`)
                .join("<br>");
        }
        li.appendChild(dataDiv);

        // lazy loading click
        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();

            if (li.querySelector("ul")) {
                const ul = li.querySelector("ul");
                const hidden = ul.style.display === "none";
                ul.style.display = hidden ? "block" : "none";
                dataDiv.style.display = hidden ? "block" : "none";
                toggleBtn.textContent = hidden ? "-" : "+";
            } else {
                if (!visited.has(node.id)) {
                    visited.add(node.id);

                    const ul = document.createElement("ul");
                    node.children.forEach(child => {
                        ul.appendChild(createTreeNode(child, new Set(visited)));
                    });
                    li.appendChild(ul);

                    dataDiv.style.display = "block";
                    toggleBtn.textContent = "-";

                    visited.delete(node.id);
                } else {
                    const ul = document.createElement("ul");
                    const cycleLi = document.createElement("li");
                    cycleLi.textContent = `(circular reference)`;
                    cycleLi.style.color = "red";
                    ul.appendChild(cycleLi);
                    li.appendChild(ul);

                    dataDiv.style.display = "block";
                }
            }
        });

        dataDiv.style.display = "none";

        return li;
    }

    // render root nodes
    const treeRoot = document.createElement("ul");
    treeRoot.classList.add("tree-root");
    roots.forEach(root => treeRoot.appendChild(createTreeNode(root)));

    container.appendChild(treeRoot);
})();
