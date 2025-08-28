class VisualizerSwitcher {
    constructor() {
        this.selectElement = document.getElementById('visualizer-select');
        this.contentContainer = document.getElementById('visualizer-content');
        this.currentVisualizer = null;

        this.init();
    }

    init() {
        if (!this.selectElement || !this.contentContainer) {
            console.warn('Required elements not found for visualizer switching');
            return;
        }

        this.currentVisualizer = this.selectElement.value;

        this.selectElement.addEventListener('change', (e) => {
            this.switchToVisualizer(e.target.value);
        });
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    }

    async switchToVisualizer(pluginId) {
        if (this.currentVisualizer === pluginId) return;
        this.currentVisualizer = pluginId;
        try {
            const response = await fetch(`plugin/visualizer/set`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({ plugin_identifier: pluginId }),
                redirect: 'manual'
            });

            if (response.type === 'opaqueredirect' || response.status === 302) {
                window.location.href = '';
            }
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (error) {
            console.error('Error loading visualizer:', error);
            this.selectElement.value = this.currentVisualizer;
        }
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}