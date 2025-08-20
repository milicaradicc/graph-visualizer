(function() {
    const container = document.getElementById("tree-container");
    const graph = window.graphData;
    console.log("Raw graph data:", graph);

    if (!graph) {
        console.log("Graph data is missing");
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
        }
    });

    // find root nodes
    const allDestinations = new Set(edges.map(e => e.dest));
    let roots = nodes.filter(n => !allDestinations.has(n.id)).map(n => nodeMap[n.id]);
    if (roots.length === 0 && nodes.length > 0) {
        roots = [nodeMap[nodes[0].id]];
    }

    // create tree node with lazy loading
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
