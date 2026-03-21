/**
 * FAQs Page Script
 * Handles FAQ accordion functionality
 * 
 * @version 1.0.0
 */

class FAQsPage {
    constructor() {
        this.faqItems = document.querySelectorAll('.faq-item');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        this.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            if (question) {
                question.addEventListener('click', () => {
                    this.toggleFAQ(item);
                });
                
                // Allow keyboard navigation
                question.setAttribute('tabindex', '0');
                question.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.toggleFAQ(item);
                    }
                });
            }
        });
    }

    toggleFAQ(item) {
        const isActive = item.classList.contains('active');
        
        // Close all other FAQs (accordion behavior)
        this.faqItems.forEach(faq => {
            faq.classList.remove('active');
            const icon = faq.querySelector('.faq-question i');
            if (icon) {
                icon.classList.remove('fa-minus');
                icon.classList.add('fa-plus');
            }
        });

        // Toggle current FAQ
        if (!isActive) {
            item.classList.add('active');
            const icon = item.querySelector('.faq-question i');
            if (icon) {
                icon.classList.remove('fa-plus');
                icon.classList.add('fa-minus');
            }
        }
    }

    // Search functionality
    searchFAQs(query) {
        const lowerQuery = query.toLowerCase();
        
        this.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question span')?.textContent.toLowerCase() || '';
            const answer = item.querySelector('.faq-answer')?.textContent.toLowerCase() || '';
            
            if (question.includes(lowerQuery) || answer.includes(lowerQuery)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new FAQsPage();
});
