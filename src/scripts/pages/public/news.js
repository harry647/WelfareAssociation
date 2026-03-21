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
            alert('Thank you for subscribing! You will receive our latest news and updates.');
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
