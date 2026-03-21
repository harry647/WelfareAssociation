/**
 * About Us Page Script
 * Handles about page functionality
 * 
 * @version 1.0.0
 */

class AboutUsPage {
    constructor() {
        this.init();
    }

    init() {
        this.addScrollAnimations();
        this.initSmoothScroll();
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

        // Observe elements that should animate
        document.querySelectorAll('.value-card, .timeline-item, .program-item, .achievement-card, .option-card').forEach(el => {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
        });
    }

    initSmoothScroll() {
        // Smooth scroll for CTA buttons
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId !== '#') {
                    e.preventDefault();
                    const target = document.querySelector(targetId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AboutUsPage();
});

// Export for module use
export default AboutUsPage;
