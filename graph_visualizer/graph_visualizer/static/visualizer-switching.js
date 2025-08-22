// Enhanced Visualizer switching functionality with debugging
class VisualizerSwitcher {
    constructor() {
        this.selectElement = document.getElementById('visualizer-select');
        this.contentContainer = document.getElementById('visualizer-content');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.errorMessage = document.getElementById('error-message');
        this.currentVisualizer = null;

        this.init();
    }

    init() {
        // Set initial visualizer
        this.currentVisualizer = this.selectElement.value;

        // Show initial visualizer
        this.showVisualizer(this.currentVisualizer, false);

        // Add event listener for switching
        this.selectElement.addEventListener('change', (e) => {
            const selectedVisualizer = e.target.value;
            this.switchToVisualizer(selectedVisualizer);
        });

        // Debug: List all available visualizers
        this.debugAvailableVisualizers();
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
    }

    hideError() {
        if (this.errorMessage) {
            this.errorMessage.style.display = 'none';
        }
    }

    async switchToVisualizer(pluginId) {
        this.hideError();

        try {
            // Check if visualizer already exists in DOM
            const existingVisualizer = document.getElementById(`visualizer-${pluginId}`);

            if (existingVisualizer) {
                // Just show the existing visualizer
                this.showVisualizer(pluginId, false);
                return;
            }

            // If we get here, we need to load via AJAX
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
            this.showVisualizer(pluginId, true);

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

        // Add to content container
        this.contentContainer.appendChild(container);
    }

    showVisualizer(pluginId, isNewlyLoaded = false) {

        // Hide all visualizers - both original and dynamically created ones
        const allVisualizers = this.contentContainer.querySelectorAll('[data-plugin-id]');

        allVisualizers.forEach((viz, index) => {
            const wasVisible = viz.classList.contains('active');
            viz.classList.remove('active');
            viz.style.display = 'none';
        });

        // Show selected visualizer - try both original and dynamically created versions
        const possibleIds = [
            `${pluginId}`,                      // Direct plugin ID: simple_visualizer, block_visualizer
            `visualizer-${pluginId}`,           // Dynamic format: visualizer-simple_visualizer
            `${pluginId.replace('_visualizer', '')}_visualizer`, // Original format: simple_visualizer (from simple_visualizer)
            `visualizer-${pluginId.replace('_visualizer', '')}` // Dynamic format: visualizer-simple (from simple_visualizer)
        ];

        let foundElements = [];
        let foundIds = [];

        // Find ALL matching elements (both container divs and SVG elements)
        for (const id of possibleIds) {
            const element = document.getElementById(id);
            if (element) {
                foundElements.push(element);
                foundIds.push(id);
            }
        }

        if (foundElements.length > 0) {
            // Show all found elements (both container and content elements)
            foundElements.forEach((element, index) => {
                element.classList.add('active');
                element.style.display = 'block';
            });

            this.currentVisualizer = pluginId;

            // Use the first found element for content checking and initialization
            const primaryElement = foundElements[0];

            // Check if there's any content in the visualizer
            const hasContent = primaryElement.innerHTML.trim().length > 0;

            // If newly loaded, trigger initialization
            if (isNewlyLoaded) {
                this.initializeNewVisualizer(primaryElement, pluginId);
            } else {
                // For existing visualizers, trigger resize/refresh
                this.refreshVisualizer(primaryElement, pluginId);
            }
        } else {
            this.showError(`Visualizer container not found: ${pluginId}`);
        }
    }

    initializeNewVisualizer(container, pluginId) {

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

        // Check for specific visualizer refresh methods
        if (pluginId === 'simple' && window.simpleVisualizerAPI) {
            window.simpleVisualizerAPI.restart();
        } else if (pluginId === 'block' && window.blockVisualizerAPI) {
            window.blockVisualizerAPI.restart();
        } else {
            console.log('No specific API found, using generic refresh');
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
}

// Initialize when DOM is ready
let visualizerSwitcher = null;

document.addEventListener('DOMContentLoaded', function() {
    visualizerSwitcher = new VisualizerSwitcher();

    // Make it globally available
    window.visualizerSwitcher = visualizerSwitcher;

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