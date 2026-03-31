/**
 * Public Pages Shared Script
 * Handles shared functionality across all public pages
 * 
 * @version 1.0.0
 */

import { apiService } from '../../../services/api-service.js';

/**
 * Newsletter Subscription Handler
 * Handles newsletter signup from the footer across all public pages
 */
class NewsletterHandler {
    constructor() {
        this.form = document.getElementById('newsletter-form');
        this.messageDiv = document.getElementById('newsletter-message');
        this.submitBtn = document.getElementById('footer-button');
        
        if (this.form) {
            this.init();
        }
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubscribe();
        });
    }

    async handleSubscribe() {
        const emailInput = document.getElementById('emails');
        const email = emailInput?.value?.trim().toLowerCase();

        if (!email) {
            this.showMessage('Please enter your email address', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }

        // Show loading state
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'Subscribing...';

        try {
            const response = await apiService.post('/newsletter', { email });
            
            if (response.success) {
                this.showMessage('Thank you for subscribing! You will receive our latest updates.', 'success');
                this.form.reset();
            } else {
                // Check for already subscribed
                if (response.message && response.message.includes('already')) {
                    this.showMessage('This email is already subscribed! We will keep you updated.', 'error');
                } else {
                    this.showMessage(response.message || 'Failed to subscribe. Please try again.', 'error');
                }
            }
        } catch (error) {
            console.error('Newsletter signup error:', error);
            this.showMessage('Failed to subscribe. Please try again.', 'error');
        } finally {
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'Subscribe';
        }
    }

    showMessage(message, type) {
        // Remove existing messages
        const existing = this.messageDiv?.querySelector('.newsletter-status');
        if (existing) existing.remove();

        if (!this.messageDiv) return;

        // Create styled message
        const msg = document.createElement('div');
        msg.className = `newsletter-status newsletter-${type}`;
        msg.textContent = message;
        msg.style.cssText = `
            margin-top: 10px;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            color: ${type === 'success' ? '#155724' : '#721c24'};
            background-color: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
        `;
        this.messageDiv.appendChild(msg);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (msg.parentNode) msg.remove();
        }, 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NewsletterHandler();
});

export default NewsletterHandler;