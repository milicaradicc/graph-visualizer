const cliInput = document.getElementById('cliInput');
const cliHistory = document.getElementById('cliHistory');
const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

const commandHistory = [];
let historyIndex = -1;

function addToHistory(text, type = 'info') {
    const line = document.createElement('div');
    line.textContent = text;

    switch(type) {
        case 'success': line.style.color = '#28a745'; break;
        case 'error': line.style.color = '#dc3545'; break;
        case 'warning': line.style.color = '#ffc107'; break;
        default: line.style.color = '#f1f1f1';
    }

    cliHistory.appendChild(line);
    cliHistory.scrollTop = cliHistory.scrollHeight;
}

function runCommand(command) {
    if(!command) return;

    addToHistory("> " + command);
    commandHistory.push(command);
    historyIndex = commandHistory.length;

    fetch(`/workspace/cli/`, {
        method: "POST",
        body: new URLSearchParams({ command: command }),
        headers: {
            "X-CSRFToken": csrftoken
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            addToHistory(data.message, "success");
            console.log("Workspace:", data.workspace);
        } else {
            addToHistory(data.message, "error");
        }
    })
    .catch(err => {
        addToHistory("Error: " + err, "error");
    });

}

cliInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        runCommand(cliInput.value.trim());
        cliInput.value = '';
    }
});

cliInput.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowUp') {
        if(historyIndex > 0) {
            historyIndex--;
            cliInput.value = commandHistory[historyIndex];
        }
    } else if(e.key === 'ArrowDown') {
        if(historyIndex < commandHistory.length - 1) {
            historyIndex++;
            cliInput.value = commandHistory[historyIndex];
        } else {
            historyIndex = commandHistory.length;
            cliInput.value = '';
        }
    }
});

cliInput.focus();
