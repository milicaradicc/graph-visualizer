// Enhanced Visualizer switching functionality with on-demand loading
class VisualizerSwitcher {
    constructor() {
        this.selectElement = document.getElementById('visualizer-select');
        this.contentContainer = document.getElementById('visualizer-content');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.errorMessage = document.getElementById('error-message');
        this.currentVisualizer = null;
        this.loadedVisualizers = new Set(); // Track which visualizers are already loaded

        this.init();
    }

    init() {
        // Set initial visualizer
        this.currentVisualizer = this.selectElement.value;

        // Mark the initial visualizer as loaded
        this.loadedVisualizers.add(this.currentVisualizer);

        // Show initial visualizer
        this.showVisualizer(this.currentVisualizer, false);

        // Add event listener for switching
        this.selectElement.addEventListener('change', (e) => {
            const selectedVisualizer = e.target.value;
            this.switchToVisualizer(selectedVisualizer);
        });

        console.log(`Initialized with visualizer: ${this.currentVisualizer}`);
    }

    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'block';
        }
    }

    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
    }

    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
        }
        console.error('Visualizer error:', message);
    }

    hideError() {
        if (this.errorMessage) {
            this.errorMessage.style.display = 'none';
        }
    }

    async switchToVisualizer(pluginId) {
        // Don't switch if already on this visualizer
        if (this.currentVisualizer === pluginId) {
            return;
        }

        this.hideError();

        try {
            // Check if visualizer is already loaded
            if (this.loadedVisualizers.has(pluginId)) {
                // Just show the existing visualizer
                console.log(`Switching to already loaded visualizer: ${pluginId}`);
                this.showVisualizer(pluginId, false);
                return;
            }

            // Load the visualizer via AJAX
            console.log(`Loading new visualizer: ${pluginId}`);
            this.showLoading();

            const response = await fetch(`/get_visualizer_html/${pluginId}/`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Create new visualizer container
            this.createVisualizerContainer(pluginId, data.html);
            this.loadedVisualizers.add(pluginId);
            this.showVisualizer(pluginId, true);

            console.log(`Successfully loaded and switched to: ${pluginId}`);

        } catch (error) {
            this.showError(`Failed to load visualizer: ${error.message}`);

            // Revert select to previous value
            this.selectElement.value = this.currentVisualizer;
        } finally {
            this.hideLoading();
        }
    }

    createVisualizerContainer(pluginId, htmlContent) {
        // Create new container div
        const container = document.createElement('div');
        container.id = `visualizer-${pluginId}`;
        container.setAttribute('data-plugin-id', pluginId);
        container.innerHTML = htmlContent;
        container.style.display = 'none'; // Initially hidden

        // Add to content container
        this.contentContainer.appendChild(container);

        console.log(`Created container for visualizer: ${pluginId}`);
    }

    showVisualizer(pluginId, isNewlyLoaded = false) {
        console.log(`Showing visualizer: ${pluginId}, newly loaded: ${isNewlyLoaded}`);

        // Hide all visualizers
        const allVisualizers = this.contentContainer.querySelectorAll('[data-plugin-id]');
        allVisualizers.forEach((viz) => {
            viz.classList.remove('active');
            viz.style.display = 'none';
        });

        // Find and show the selected visualizer
        const visualizerElement = document.getElementById(`visualizer-${pluginId}`);

        if (visualizerElement) {
            visualizerElement.classList.add('active');
            visualizerElement.style.display = 'block';
            this.currentVisualizer = pluginId;

            // If newly loaded, initialize it
            if (isNewlyLoaded) {
                this.initializeNewVisualizer(visualizerElement, pluginId);
            } else {
                // For existing visualizers, trigger refresh
                this.refreshVisualizer(visualizerElement, pluginId);
            }

            console.log(`Successfully showed visualizer: ${pluginId}`);
        } else {
            this.showError(`Visualizer container not found: ${pluginId}`);
        }
    }

    initializeNewVisualizer(container, pluginId) {
        console.log(`Initializing new visualizer: ${pluginId}`);

        // Execute any scripts in the newly loaded content
        const scripts = container.querySelectorAll('script');
        scripts.forEach((oldScript, index) => {
            const newScript = document.createElement('script');
            if (oldScript.src) {
                newScript.src = oldScript.src;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });

        // Trigger window resize to help D3 visualizations adjust
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }

    refreshVisualizer(container, pluginId) {
        console.log(`Refreshing visualizer: ${pluginId}`);

        // Check for specific visualizer refresh methods
        if (pluginId.includes('simple') && window.simpleVisualizerAPI) {
            window.simpleVisualizerAPI.restart();
        } else if (pluginId.includes('block') && window.blockVisualizerAPI) {
            window.blockVisualizerAPI.restart();
        }

        // Generic refresh - trigger resize event
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }

    // Public method to get current visualizer
    getCurrentVisualizer() {
        return this.currentVisualizer;
    }

    // Public method to programmatically switch visualizer
    switchTo(pluginId) {
        this.selectElement.value = pluginId;
        this.switchToVisualizer(pluginId);
    }

    // Public method to get loaded visualizers
    getLoadedVisualizers() {
        return Array.from(this.loadedVisualizers);
    }

    // Public method to preload a visualizer
    async preloadVisualizer(pluginId) {
        if (!this.loadedVisualizers.has(pluginId)) {
            console.log(`Preloading visualizer: ${pluginId}`);
            await this.switchToVisualizer(pluginId);
        }
    }
}

// Initialize when DOM is ready
let visualizerSwitcher = null;

document.addEventListener('DOMContentLoaded', function() {
    visualizerSwitcher = new VisualizerSwitcher();

    // Make it globally available
    window.visualizerSwitcher = visualizerSwitcher;

    console.log('VisualizerSwitcher initialized and available globally');
});

// Enhanced graph interaction manager integration
function enhanceGraphInteractionManager() {
    if (!window.graphInteractionManager) {
        console.warn('graphInteractionManager not found, skipping enhancement');
        return;
    }

    const originalManager = window.graphInteractionManager;

    // Enhanced version that works with plugin switching
    window.graphInteractionManager = {
        ...originalManager,

        // Override to handle multiple visualizers
        setActiveSimulation: function(simulation, pluginId = null) {
            this.activeSimulation = simulation;
            this.activePluginId = pluginId;

            // Store simulation reference for the specific plugin
            if (pluginId) {
                this.simulations = this.simulations || {};
                this.simulations[pluginId] = simulation;
            }
        },

        // Get simulation for specific plugin
        getSimulation: function(pluginId = null) {
            if (pluginId && this.simulations && this.simulations[pluginId]) {
                return this.simulations[pluginId];
            }
            return this.activeSimulation;
        },

        // Enhanced createDragBehavior that works with multiple visualizers
        createDragBehavior: function(simulation, pluginId = null) {
            // Store simulation reference
            this.setActiveSimulation(simulation, pluginId);

            // Call original method
            return originalManager.createDragBehavior(simulation);
        },

        // Enhanced createZoomBehavior
        createZoomBehavior: function(svg, container, labels = null, pluginId = null) {
            // Call original method
            const zoomBehavior = originalManager.createZoomBehavior(svg, container, labels);

            // Store reference for plugin
            if (pluginId) {
                this.zoomBehaviors = this.zoomBehaviors || {};
                this.zoomBehaviors[pluginId] = zoomBehavior;
            }

            return zoomBehavior;
        }
    };
}

// Enhance the interaction manager when it's ready
if (window.graphInteractionManager) {
    enhanceGraphInteractionManager();
} else {
    // Wait for it to be loaded
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(enhanceGraphInteractionManager, 100);
    });
}