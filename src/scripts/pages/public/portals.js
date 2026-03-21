/**
 * Portals Page Script
 * Handles portals page navigation
 * 
 * @version 1.0.0
 */

class PortalsPage {
    constructor() {
        this.portalCards = document.querySelectorAll('.portal-card');
        this.quickLinks = document.querySelectorAll('.quick-link');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Portal card interactions
        this.portalCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('hovered');
            });
            
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hovered');
            });
        });

        // Quick link interactions
        this.quickLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                link.classList.add('hovered');
            });
            
            link.addEventListener('mouseleave', () => {
                link.classList.remove('hovered');
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PortalsPage();
});

// Export for module use
export default PortalsPage;
