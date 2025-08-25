class VisualizerSwitcher {
    constructor() {
    console.log('1')
        this.selectElement = document.getElementById('visualizer-select');
        this.contentContainer = document.getElementById('visualizer-content');
        this.currentVisualizer = null;
        this.loadedVisualizers = new Set();

        this.init();
    }

    init() {
    console.log('2')

        if (!this.selectElement || !this.contentContainer) {
            console.warn('Required elements not found for visualizer switching');
            return;
        }

        // Set and mark the initial visualizer as loaded
        this.currentVisualizer = this.selectElement.value;
        this.loadedVisualizers.add(this.currentVisualizer);

        // Show initial visualizer
        this.showVisualizer(this.currentVisualizer, false);

        // Add event listener for switching
        this.selectElement.addEventListener('change', (e) => {
            this.switchToVisualizer(e.target.value);
        });
    }

    async switchToVisualizer(pluginId) {
    console.log('3')

        if (this.currentVisualizer === pluginId) return;

        try {
            if (this.loadedVisualizers.has(pluginId)) {
                this.showVisualizer(pluginId, false);
                return;
            }

            const response = await fetch(`/get_visualizer_html/${pluginId}/`);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            this.createVisualizerContainer(pluginId, data.html);
            this.loadedVisualizers.add(pluginId);
            this.showVisualizer(pluginId, true);

        } catch (error) {
            console.error('Error loading visualizer:', error);
            this.selectElement.value = this.currentVisualizer;
        }
    }

    createVisualizerContainer(pluginId, htmlContent) {

        const container = document.createElement('div');
        container.id = `visualizer-${pluginId}`;
        container.setAttribute('data-plugin-id', pluginId);
        container.innerHTML = htmlContent;
        container.style.display = 'none';
        this.contentContainer.appendChild(container);
    }

    showVisualizer(pluginId, isNewlyLoaded = false) {
        // Hide all visualizers
    console.log('1')

        this.contentContainer.querySelectorAll('[data-plugin-id]').forEach(viz => {
            viz.classList.remove('active');
            viz.style.display = 'none';
        });

        const visualizerElement = document.getElementById(`visualizer-${pluginId}`);
        if (visualizerElement) {
            visualizerElement.classList.add('active');
            visualizerElement.style.display = 'block';
            this.currentVisualizer = pluginId;

            if (isNewlyLoaded) {
    console.log('1')

                this.initializeNewVisualizer(visualizerElement, pluginId);
            } else {
    console.log('1')

                this.refreshVisualizer();
            }
        } else {
            console.warn(`Visualizer element not found: visualizer-${pluginId}`);
        }
    }

    initializeNewVisualizer(container, pluginId) {
    console.log('1')

        // Re-run scripts inside dynamic HTML
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            if (oldScript.src) {
                newScript.src = oldScript.src;
                newScript.onload = () => this.enableGenericInteractions(pluginId);
            } else {
                newScript.textContent = oldScript.textContent;
                setTimeout(() => this.enableGenericInteractions(pluginId), 100);
            }
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });

        // Trigger resize
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    }

    enableGenericInteractions(pluginId) {
    console.log('1')

        if (!window.graphInteractionManager) return;

        // Prepare pluginAPI structure
        window.simpleVisualizerAPI = window.simpleVisualizerAPI || {};
//        window.simpleVisualizerAPI[pluginId] = window.simpleVisualizerAPI[pluginId] || {};

        // The plugin instance must exist or be initialized by plugin script
        const pluginInstance = window.simpleVisualizerAPI.instance;
        if (!pluginInstance) {
//6
            console.warn(`No plugin instance found for ${pluginId}`);
            return;
        }

        try {
    console.log('1')

            // Call with the correct arguments: (instance, enableEvents=true, enableControl=true)
            const interactiveInstance = window.graphInteractionManager
                .enableGenericPluginInteractions(pluginInstance, true, true);

            if (interactiveInstance) {
                window.simpleVisualizerAPI.interactiveInstance = interactiveInstance;
            }
        } catch (error) {
            console.warn(`Generic interactions failed for ${pluginId}:`, error);
        }
    }

    refreshVisualizer() {
    console.log('1')

        setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    }

    // Public helpers
    getCurrentVisualizer() {
    console.log('1')
    return this.currentVisualizer; }
    switchTo(pluginId) {
    console.log('1')

        this.selectElement.value = pluginId;
        this.switchToVisualizer(pluginId);
    }
    getLoadedVisualizers() {
    console.log('1')
    return Array.from(this.loadedVisualizers); }
    async preloadVisualizer(pluginId) {
    console.log('1')

        if (!this.loadedVisualizers.has(pluginId)) {
            await this.switchToVisualizer(pluginId);
        }
    }
}

// Initialize
let visualizerSwitcher = null;
document.addEventListener('DOMContentLoaded', () => {
    console.log('1')

    visualizerSwitcher = new VisualizerSwitcher();
    window.visualizerSwitcher = visualizerSwitcher;
});

// Enhance graph interaction manager
function enhanceGraphInteractionManager() {
    console.log('1')

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
    console.log('1')

    enhanceGraphInteractionManager();
} else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(enhanceGraphInteractionManager, 100));
}
