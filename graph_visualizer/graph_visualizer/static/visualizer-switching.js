// Enhanced Visualizer switching functionality with debugging
class VisualizerSwitcher {
    constructor() {
        this.selectElement = document.getElementById('visualizer-select');
        this.contentContainer = document.getElementById('visualizer-content');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.errorMessage = document.getElementById('error-message');
        this.currentVisualizer = null;

        console.log('VisualizerSwitcher initializing...');
        console.log('Select element:', this.selectElement);
        console.log('Content container:', this.contentContainer);

        this.init();
    }

    init() {
        if (!this.selectElement || !this.contentContainer) {
            console.error('Required elements not found for visualizer switching');
            console.error('Select element found:', !!this.selectElement);
            console.error('Content container found:', !!this.contentContainer);
            return;
        }

        // Set initial visualizer
        this.currentVisualizer = this.selectElement.value;
        console.log('Initial visualizer:', this.currentVisualizer);

        // Show initial visualizer
        this.showVisualizer(this.currentVisualizer, false);

        // Add event listener for switching
        this.selectElement.addEventListener('change', (e) => {
            const selectedVisualizer = e.target.value;
            console.log('Switching from', this.currentVisualizer, 'to', selectedVisualizer);
            this.switchToVisualizer(selectedVisualizer);
        });

        // Debug: List all available visualizers
        this.debugAvailableVisualizers();

        console.log('Visualizer switcher initialized successfully');
    }

    debugAvailableVisualizers() {
        const allVisualizers = this.contentContainer.querySelectorAll('[data-plugin-id]');
        console.log('Available visualizers in DOM:');
        allVisualizers.forEach((viz, index) => {
            console.log(`  ${index + 1}. ID: ${viz.id}, Plugin: ${viz.getAttribute('data-plugin-id')}, Visible: ${viz.style.display !== 'none'}`);
        });
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
        console.error('Visualizer error:', message);
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
        console.log(`Attempting to switch to visualizer: ${pluginId}`);

        if (pluginId === this.currentVisualizer) {
            console.log('Already showing this visualizer, skipping switch');
            return;
        }

        this.hideError();

        try {
            // Check if visualizer already exists in DOM
            const existingVisualizer = document.getElementById(`visualizer-${pluginId}`);
            console.log(`Existing visualizer found: ${!!existingVisualizer}`);

            if (existingVisualizer) {
                // Just show the existing visualizer
                this.showVisualizer(pluginId, false);
                return;
            }

            // If we get here, we need to load via AJAX
            console.log('Loading visualizer via AJAX...');
            this.showLoading();

            const response = await fetch(`/get_visualizer_html/${pluginId}/`);
            console.log('AJAX response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('AJAX response data:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            // Create new visualizer container
            this.createVisualizerContainer(pluginId, data.html);
            this.showVisualizer(pluginId, true);

        } catch (error) {
            console.error('Error switching visualizer:', error);
            this.showError(`Failed to load visualizer: ${error.message}`);

            // Revert select to previous value
            this.selectElement.value = this.currentVisualizer;
        } finally {
            this.hideLoading();
        }
    }

    createVisualizerContainer(pluginId, htmlContent) {
        console.log(`Creating container for plugin: ${pluginId}`);

        // Create new container div
        const container = document.createElement('div');
        container.id = `visualizer-${pluginId}`;
        container.setAttribute('data-plugin-id', pluginId);
        container.innerHTML = htmlContent;

        // Add to content container
        this.contentContainer.appendChild(container);
        console.log('Container created and added to DOM');
    }

    showVisualizer(pluginId, isNewlyLoaded = false) {
        console.log(`Showing visualizer: ${pluginId}, newly loaded: ${isNewlyLoaded}`);

        // Hide all visualizers - both original and dynamically created ones
        const allVisualizers = this.contentContainer.querySelectorAll('[data-plugin-id]');
        console.log(`Found ${allVisualizers.length} visualizers to hide`);

        allVisualizers.forEach((viz, index) => {
            const wasVisible = viz.classList.contains('active');
            viz.classList.remove('active');
            viz.style.display = 'none';
            console.log(`  ${index + 1}. ${viz.id} - was visible: ${wasVisible}, now hidden`);
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

        console.log('Tried IDs:', possibleIds);
        console.log('Found elements with IDs:', foundIds);
        console.log('Found elements:', foundElements);

        if (foundElements.length > 0) {
            // Show all found elements (both container and content elements)
            foundElements.forEach((element, index) => {
                element.classList.add('active');
                element.style.display = 'block';
                console.log(`Showing element ${index + 1}: ${foundIds[index]}`);
            });

            this.currentVisualizer = pluginId;
            console.log(`Successfully switched to: ${pluginId} (using IDs: ${foundIds.join(', ')})`);

            // Use the first found element for content checking and initialization
            const primaryElement = foundElements[0];

            // Check if there's any content in the visualizer
            const hasContent = primaryElement.innerHTML.trim().length > 0;
            console.log(`Primary visualizer has content: ${hasContent}`);

            if (!hasContent) {
                console.warn('Primary visualizer container is empty!');
            }

            // If newly loaded, trigger initialization
            if (isNewlyLoaded) {
                this.initializeNewVisualizer(primaryElement, pluginId);
            } else {
                // For existing visualizers, trigger resize/refresh
                this.refreshVisualizer(primaryElement, pluginId);
            }
        } else {
            console.error(`Visualizer container not found for any of these IDs:`, possibleIds);
            this.showError(`Visualizer container not found: ${pluginId}`);
        }
    }

    initializeNewVisualizer(container, pluginId) {
        console.log(`Initializing new visualizer: ${pluginId}`);

        // Execute any scripts in the newly loaded content
        const scripts = container.querySelectorAll('script');
        console.log(`Found ${scripts.length} scripts to execute`);

        scripts.forEach((oldScript, index) => {
            console.log(`Executing script ${index + 1}/${scripts.length}`);
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
            console.log('Triggering resize event for new visualizer');
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }

    refreshVisualizer(container, pluginId) {
        console.log(`Refreshing existing visualizer: ${pluginId}`);

        // Check for specific visualizer refresh methods
        if (pluginId === 'simple' && window.simpleVisualizerAPI) {
            console.log('Calling simpleVisualizerAPI.restart()');
            window.simpleVisualizerAPI.restart();
        } else if (pluginId === 'block' && window.blockVisualizerAPI) {
            console.log('Calling blockVisualizerAPI.restart()');
            window.blockVisualizerAPI.restart();
        } else {
            console.log('No specific API found, using generic refresh');
        }

        // Generic refresh - trigger resize event
        setTimeout(() => {
            console.log('Triggering resize event for existing visualizer');
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
    console.log('DOM loaded, initializing visualizer switcher...');
    visualizerSwitcher = new VisualizerSwitcher();

    // Make it globally available
    window.visualizerSwitcher = visualizerSwitcher;

    // Debug: Check what's in the DOM
    setTimeout(() => {
        console.log('=== DOM DEBUG INFO ===');
        const visualizerContent = document.getElementById('visualizer-content');
        if (visualizerContent) {
            console.log('Visualizer content HTML:', visualizerContent.innerHTML);
        }

        // Check for D3
        console.log('D3 available:', typeof d3 !== 'undefined');

        // Check graph data
        console.log('Graph data available:', typeof window.graphData !== 'undefined');
        if (window.graphData) {
            console.log('Graph data:', window.graphData);
        }
    }, 1000);
});

// Enhanced graph interaction manager integration
function enhanceGraphInteractionManager() {
    if (!window.graphInteractionManager) {
        console.warn('graphInteractionManager not found, skipping enhancement');
        return;
    }

    const originalManager = window.graphInteractionManager;
    console.log('Enhancing graph interaction manager');

    // Enhanced version that works with plugin switching
    window.graphInteractionManager = {
        ...originalManager,

        // Override to handle multiple visualizers
        setActiveSimulation: function(simulation, pluginId = null) {
            console.log('Setting active simulation for plugin:', pluginId);
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
            console.log('Creating drag behavior for plugin:', pluginId);
            // Store simulation reference
            this.setActiveSimulation(simulation, pluginId);

            // Call original method
            return originalManager.createDragBehavior(simulation);
        },

        // Enhanced createZoomBehavior
        createZoomBehavior: function(svg, container, labels = null, pluginId = null) {
            console.log('Creating zoom behavior for plugin:', pluginId);
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