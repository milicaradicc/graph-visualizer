const cliInput = document.getElementById('cliInput');
const cliHistory = document.getElementById('cliHistory');
const cliForm = document.getElementById('cliForm');

const commandHistory = [];
let historyIndex = -1;

function addToHistory(text, type = 'info') {
    const line = document.createElement('div');
    line.textContent = text;

    switch(type) {
        case 'success': line.style.color = '#28a745'; break;
        case 'error': line.style.color = '#dc3545'; break;
        case 'warning': line.style.color = '#ffc107'; break;
        default: line.style.color = '#1e1e1e';
    }

    cliHistory.appendChild(line);
    cliHistory.scrollTop = cliHistory.scrollHeight;
}

if (typeof cliHistoryData !== 'undefined') {
    cliHistoryData.forEach(item => {
        addToHistory("> " + item.command);
        addToHistory(item.response, item.status);
        commandHistory.push(item.command);
    });
    historyIndex = commandHistory.length;
}

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

cliInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        e.preventDefault();
        cliForm.submit();
    }
});

cliInput.focus();
