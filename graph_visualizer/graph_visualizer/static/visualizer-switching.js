class VisualizerSwitcher {
    constructor() {
        this.selectElement = document.getElementById('visualizer-select');
        this.contentContainer = document.getElementById('visualizer-content');
        this.currentVisualizer = null;
        this.loadedVisualizers = new Set();

        this.init();
    }

    init() {
        if (!this.selectElement || !this.contentContainer) {
            console.warn('Required elements not found for visualizer switching');
            return;
        }

        this.currentVisualizer = this.selectElement.value;
        this.loadedVisualizers.add(this.currentVisualizer);

        this.selectElement.addEventListener('change', (e) => {
            this.switchToVisualizer(e.target.value);
        });
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    }

    async switchToVisualizer(pluginId) {
        if (this.currentVisualizer === pluginId) return;
        this.currentVisualizer = pluginId;
        try {
            if (this.loadedVisualizers.has(pluginId)) {
                window.graphInteractionManager.initializeBirdView(`#${pluginId}`, 'bird-svg');
                return;
            }

            const response = await fetch(`plugin/visualizer/set`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({ plugin_identifier: pluginId }),
                redirect: 'manual' // prevent fetch from following redirect automatically
            });

            if (response.type === 'opaqueredirect' || response.status === 302) {
                window.location.href = '';  // force browser redirect
            }
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (error) {
            console.error('Error loading visualizer:', error);
            this.selectElement.value = this.currentVisualizer;
        }
    }
}

let visualizerSwitcher = null;
document.addEventListener('DOMContentLoaded', () => {
    visualizerSwitcher = new VisualizerSwitcher();
    window.visualizerSwitcher = visualizerSwitcher;
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function enhanceGraphInteractionManager() {
    if (!window.graphInteractionManager) {
        console.warn('graphInteractionManager not found, skipping enhancement');
        return;
    }

    const originalManager = window.graphInteractionManager;
    window.graphInteractionManager = {
        ...originalManager,

        setActiveSimulation(simulation, pluginId = null) {
            this.activeSimulation = simulation;
            this.activePluginId = pluginId;
            if (pluginId) {
                this.simulations = this.simulations || {};
                this.simulations[pluginId] = simulation;
            }
        },

        getSimulation(pluginId = null) {
            return pluginId && this.simulations ? this.simulations[pluginId] : this.activeSimulation;
        },

        createDragBehavior(simulation, pluginId = null) {
            this.setActiveSimulation(simulation, pluginId);
            return originalManager.createDragBehavior(simulation);
        },

        createZoomBehavior(svg, container, labels = null, pluginId = null) {
            const zoomBehavior = originalManager.createZoomBehavior(svg, container, labels);
            if (pluginId) {
                this.zoomBehaviors = this.zoomBehaviors || {};
                this.zoomBehaviors[pluginId] = zoomBehavior;
            }
            return zoomBehavior;
        }
    };
}

if (window.graphInteractionManager) {
    enhanceGraphInteractionManager();
} else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(enhanceGraphInteractionManager, 100));
}