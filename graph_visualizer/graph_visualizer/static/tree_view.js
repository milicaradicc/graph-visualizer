(function() {
    const container = document.getElementById("tree-container");
    const graph = window.graphData; // može biti string ili JS objekat
    console.log("Raw graph data:", graph);

    if (!graph) {
        console.log("Graph data is missing");
        container.innerHTML = "<p>No graph data available.</p>";
        return;
    }

    let nodes = [];
    let edges = [];

    // Ako graph dolazi kao string
    if (typeof graph === "string") {
        console.log("Graph is a string");
        const nodeLines = graph.match(/Nodes:\n([\s\S]*?)\nEdges:/);
        const edgeLines = graph.match(/Edges:\n([\s\S]*)/);

        if (nodeLines) {
            const lines = nodeLines[1].split("\n");
            let currentNode = null;

            lines.forEach(line => {
                if (!line.startsWith("\t")) {
                    // Nova noda
                    if (currentNode) {
                        nodes.push(currentNode);
                    }
                    currentNode = { id: line.trim(), data: {} };
                } else {
                    // Atribut
                    const attrLine = line.trim();
                    const colonIndex = attrLine.indexOf(':');
                    if (colonIndex > -1) {
                        const key = attrLine.substring(0, colonIndex).trim();
                        const value = attrLine.substring(colonIndex + 1).trim();
                        currentNode.data[key] = value;
                    }
                }
            });

            if (currentNode) {
                nodes.push(currentNode);
            }

            console.log("Parsed nodes:", nodes);
        }


        if (edgeLines) {
            console.log("Edge lines found:", edgeLines[1]);
            edgeLines[1].split("\n").forEach(line => {
                const trimmed = line.trim();
                if (trimmed) {
                    const m = trimmed.match(/^(\S+)\s*->\s*(\S+)$/);
                    if (m) {
                        const edgeObj = {src: m[1], dest: m[2]};
                        console.log("Parsed edge:", edgeObj);
                        edges.push(edgeObj);
                    }
                }
            });
        }
    }  else {
        nodes = graph.nodes || [];
        edges = graph.edges || [];
    }

    if (nodes.length === 0) {
        container.innerHTML = "<p>No valid nodes found.</p>";
        return;
    }

    // Mapiranje čvorova
    const nodeMap = {};
    nodes.forEach(node => {
        nodeMap[node.id] = { ...node, children: [] };
    });

    // Povezivanje čvorova
    edges.forEach(edge => {
        const parent = nodeMap[edge.src];
        const child = nodeMap[edge.dest];
        if (parent && child) {
            parent.children.push(child);
        }
    });

    // Pronalazimo korene
    const allDestinations = new Set(edges.map(e => e.dest));
    let roots = nodes.filter(n => !allDestinations.has(n.id)).map(n => nodeMap[n.id]);
    if (roots.length === 0 && nodes.length > 0) {
        roots = [nodeMap[nodes[0].id]];
    }

    // Kreiranje stabla sa lazy loading
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
            toggleBtn.textContent = ""; // nema toggle
        }

        span.appendChild(toggleBtn);
        span.appendChild(document.createTextNode(node.id));
        li.appendChild(span);

        // Div za atribute čvora
        const dataDiv = document.createElement("div");
        dataDiv.classList.add("node-data");
        if (node.data && Object.keys(node.data).length > 0) {
            dataDiv.innerHTML = Object.entries(node.data)
                .map(([k, v]) => `<strong>${k}</strong>: ${v}`)
                .join("<br>");
        }
        li.appendChild(dataDiv);

        // Lazy loading klik
toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    if (li.querySelector("ul")) {
        // Deca su već prikazana, sakrij/prikaži
        const ul = li.querySelector("ul");
        const hidden = ul.style.display === "none";
        ul.style.display = hidden ? "block" : "none";
        dataDiv.style.display = hidden ? "block" : "none"; // Prikazi/sakrij i atribute
        toggleBtn.textContent = hidden ? "-" : "+";
    } else {
        if (!visited.has(node.id)) {
            visited.add(node.id);

            // Kreiraj listu dece
            const ul = document.createElement("ul");
            node.children.forEach(child => {
                ul.appendChild(createTreeNode(child, new Set(visited)));
            });
            li.appendChild(ul);

            // Prikaži atribute kad se otvori
            dataDiv.style.display = "block";
            toggleBtn.textContent = "-";

            visited.delete(node.id);
        } else {
            // Ciklus
            const ul = document.createElement("ul");
            const cycleLi = document.createElement("li");
            cycleLi.textContent = `(circular reference)`;
            cycleLi.style.color = "red";
            ul.appendChild(cycleLi);
            li.appendChild(ul);

            // Prikazi atribute i kod ciklusa
            dataDiv.style.display = "block";
        }
    }
});

// Po defaultu sakrij atributi
dataDiv.style.display = "none";


        return li;
    }

    // Render root čvorova
    const treeRoot = document.createElement("ul");
    treeRoot.classList.add("tree-root");
    roots.forEach(root => treeRoot.appendChild(createTreeNode(root)));

    container.appendChild(treeRoot);
})();
