/**
 * Resources Page Script
 * Handles resources page functionality
 * 
 * @version 1.0.0
 */

class ResourcesPage {
    constructor() {
        this.resourceCards = document.querySelectorAll('.resource-card, .support-card, .career-item');
        this.init();
    }

    init() {
        this.bindEvents();
        this.trackExternalLinks();
    }

    bindEvents() {
        // Resource card hover effects
        this.resourceCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('hovered');
            });
            
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hovered');
            });
        });
    }

    trackExternalLinks() {
        // Track clicks on external links for analytics
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                console.log(`External link clicked: ${href}`);
                // In production, send to analytics
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ResourcesPage();
});

// Export for module use
export default ResourcesPage;
