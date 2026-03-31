import { newsService } from '../../../services/index.js';
import { showNotification } from '../../../utils/utility-functions.js';

/**
 * News Page Script
 * Handles news page functionality including newsletter signup
 * 
 * @version 1.0.0
 */

class NewsPage {
    constructor() {
        this.newsletterForm = document.querySelector('.newsletter-form');
        this.readMoreButtons = document.querySelectorAll('.read-more');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Newsletter signup
        if (this.newsletterForm) {
            this.newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSignup();
            });
        }

        // Read more buttons
        this.readMoreButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleReadMore(btn);
            });
        });
    }

    async handleNewsletterSignup() {
        const emailInput = this.newsletterForm.querySelector('input[type="email"]');
        const email = emailInput?.value?.trim().toLowerCase();

        if (!email) {
            showNotification('Please enter your email address', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Show loading
        const submitBtn = this.newsletterForm.querySelector('button');
        this.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Subscribing...';
        submitBtn.disabled = true;

        try {
            // Call the actual API
            const response = await newsService.subscribe(email);

            if (response.success) {
                showNotification('Thank you for subscribing! You will receive our latest news and updates.', 'success');
                this.newsletterForm.reset();
            } else {
                // Check for already subscribed
                if (response.message && response.message.includes('already')) {
                    showNotification('This email is already subscribed! We will keep you updated.', 'error');
                } else {
                    showNotification(response.message || 'Failed to subscribe. Please try again.', 'error');
                }
            }

        } catch (error) {
            console.error('Newsletter signup error:', error);
            showNotification('Failed to subscribe. Please try again.', 'error');
        } finally {
            const submitBtn = this.newsletterForm.querySelector('button');
            if (submitBtn) {
                submitBtn.textContent = this.originalText;
                submitBtn.disabled = false;
            }
        }
    }

    handleReadMore(btn) {
        const newsCard = btn.closest('.news-card');
        const title = newsCard?.querySelector('h3')?.textContent || 'this article';
        
        alert(`Full article: "${title}"\n\nFull article content is coming soon!`);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NewsPage();
});

// Export for module use
export default NewsPage;
