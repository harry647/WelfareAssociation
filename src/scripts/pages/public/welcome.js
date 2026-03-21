/**
 * Welcome Page Script
 * Handles welcome page functionality with modern ES6 patterns
 * 
 * @version 1.0.0
 */

// Original functionality wrapped in a class
class WelcomePage {
    constructor() {
        this.container = document.getElementById("container");
        this.init();
    }

    init() {
        if (!this.container) {
            console.warn('Container element not found');
            return;
        }
        
        this.bindEvents();
    }

    bindEvents() {
        // Make functions available globally for onclick handlers
        window.showRegister = this.showRegister.bind(this);
        window.showLogin = this.showLogin.bind(this);
    }

    showRegister() {
        if (this.container) {
            this.container.classList.add("active");
        }
    }

    showLogin() {
        if (this.container) {
            this.container.classList.remove("active");
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WelcomePage();
});

// Export for module use
export default WelcomePage;
