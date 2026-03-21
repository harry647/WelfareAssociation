/**
 * Our Team Page Script
 * Handles team page functionality
 * 
 * @version 1.0.0
 */

class OurTeamPage {
    constructor() {
        this.init();
    }

    init() {
        this.addScrollAnimations();
    }

    addScrollAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe team member cards
        document.querySelectorAll('.team-member-card').forEach(el => {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new OurTeamPage();
});

// Export for module use
export default OurTeamPage;
