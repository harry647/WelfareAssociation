/**
 * Events Page Script
 * Handles events page functionality including registration and newsletter signup
 * 
 * @version 1.0.0
 */

class EventsPage {
    constructor() {
        this.eventButtons = document.querySelectorAll('.event-btn');
        this.newsletterForm = document.querySelector('.signup-form');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Event registration buttons
        this.eventButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleEventRegistration(btn);
            });
        });

        // Newsletter signup
        if (this.newsletterForm) {
            this.newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSignup();
            });
        }
    }

    handleEventRegistration(btn) {
        const eventName = btn.closest('.event-card')?.querySelector('h3')?.textContent || 'this event';
        
        alert(`Registration for "${eventName}" will be available soon!\n\nYou will be notified when registration opens.`);
    }

    async handleNewsletterSignup() {
        const emailInput = this.newsletterForm.querySelector('input[type="email"]');
        const email = emailInput?.value?.trim();

        if (!email) {
            alert('Please enter your email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        try {
            // Show loading
            const submitBtn = this.newsletterForm.querySelector('button');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Subscribing...';
            submitBtn.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Show success
            alert('Thank you for subscribing! You will receive updates about our events.');
            this.newsletterForm.reset();

        } catch (error) {
            console.error('Newsletter signup error:', error);
            alert('Failed to subscribe. Please try again.');
        } finally {
            const submitBtn = this.newsletterForm.querySelector('button');
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new EventsPage();
});

// Export for module use
export default EventsPage;
