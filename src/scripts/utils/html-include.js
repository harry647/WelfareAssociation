/**
 * HTML Include Utility
 * Local replacement for w3schools w3.js HTML includes
 */

class HTMLInclude {
    constructor() {
        this.cache = new Map();
        this.init();
    }

    init() {
        // Process all w3-include-html elements
        const elements = document.querySelectorAll('[w3-include-html]');
        this.processElements(elements);
    }

    async processElements(elements) {
        for (const element of elements) {
            await this.includeHTML(element);
        }
    }

    async includeHTML(element) {
        const file = element.getAttribute('w3-include-html');
        if (!file) return;

        try {
            // Check cache first
            if (this.cache.has(file)) {
                element.innerHTML = this.cache.get(file);
                return;
            }

            // Fetch the file
            const response = await fetch(file);
            if (!response.ok) {
                throw new Error(`Failed to load ${file}: ${response.status}`);
            }

            const html = await response.text();
            
            // Cache the result
            this.cache.set(file, html);
            
            // Set the inner HTML
            element.innerHTML = html;

            // Execute any scripts in the included content
            this.executeScripts(element);

        } catch (error) {
            console.error('HTML Include Error:', error);
            element.innerHTML = `<div style="color: red; padding: 10px;">Failed to load content: ${file}</div>`;
        }
    }

    executeScripts(element) {
        const scripts = element.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            
            // Copy all attributes
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            
            // Copy the script content
            newScript.textContent = oldScript.textContent;
            
            // Replace the old script
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }
}

// Create global w3 object for compatibility
window.w3 = {
    includeHTML: function() {
        new HTMLInclude();
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.w3.includeHTML();
});

// Export for module use
export default HTMLInclude;
