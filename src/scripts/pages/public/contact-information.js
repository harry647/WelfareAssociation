/**
 * Contact Information Page Script
 * Handles contact form submission and validation
 * 
 * @version 1.0.0
 */

class ContactPage {
    constructor() {
        this.form = document.querySelector('.contact-form');
        this.init();
    }

    init() {
        if (this.form) {
            this.bindEvents();
        }
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Real-time validation
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Phone number formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^\d+]/g, '');
                if (!value.startsWith('+')) {
                    value = '+254' + value.replace(/^\+?254/, '').replace(/^0/, '');
                }
                e.target.value = value;
            });
        }
    }

    validateField(input) {
        const name = input.name;
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        if (input.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        if (name === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        if ((name === 'phone') && value) {
            const phoneRegex = /^\+254[7-9]\d{8}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        if (!isValid) {
            this.showFieldError(input, errorMessage);
        } else {
            this.clearFieldError(input);
        }

        return isValid;
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        input.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        input.parentElement.appendChild(errorDiv);
    }

    clearFieldError(input) {
        input.classList.remove('error');
        const errorDiv = input.parentElement?.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    async handleSubmit() {
        // Clear any existing feedback messages
        const existingFeedback = this.form.querySelectorAll('.feedback-success, .feedback-error');
        existingFeedback.forEach(el => el.remove());

        // Validate all fields
        const inputs = this.form.querySelectorAll('input, textarea, select');
        let allValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                allValid = false;
            }
        });

        if (!allValid) {
            this.showError('Please fix the errors in the form.');
            return;
        }

        // Collect form data
        const formData = new FormData(this.form);
        const firstName = formData.get('first-name');
        const lastName = formData.get('last-name');
        
        const contactData = {
            name: `${firstName} ${lastName}`,
            email: formData.get('email'),
            phone: formData.get('phone'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            category: this.mapSubjectToCategory(formData.get('subject'))
        };

        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        try {
            // Real API call
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to send message');
            }

            // Show success
            this.showSuccess('Thank you for your message! We will get back to you soon.');
            
            // Reset form
            this.form.reset();

        } catch (error) {
            console.error('Contact form error:', error);
            this.showError(error.message || 'Failed to send message. Please try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    showError(message) {
        const errorDiv = this.createFeedbackDiv('error', message);
        this.form.insertBefore(errorDiv, this.form.firstChild);
        // Remove after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }

    showSuccess(message) {
        // Hide form, show full success message covering form area
        this.form.style.display = 'none';
        
        const successContainer = document.createElement('div');
        successContainer.className = 'success-message-container';
        successContainer.style.cssText = `
            padding: 60px 40px;
            background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
            color: white;
            border-radius: 16px;
            text-align: center;
            margin: 20px 0;
        `;
        
        successContainer.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 4rem; margin-bottom: 20px;"></i>
            <h2 style="margin: 0 0 15px 0; font-size: 1.8rem;">Thank You!</h2>
            <p style="margin: 0; font-size: 1.2rem; opacity: 0.95;">${message}</p>
            <button type="button" onclick="location.reload()" style="
                margin-top: 25px;
                padding: 14px 35px;
                background: white;
                color: #28a745;
                border: none;
                border-radius: 30px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
            ">Send Another Message</button>
        `;
        
        this.form.parentNode.insertBefore(successContainer, this.form);
    }

    createFeedbackDiv(type, message) {
        const div = document.createElement('div');
        div.className = `feedback-${type}`;
        div.style.cssText = `
            padding: 20px 25px;
            margin-bottom: 20px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 15px;
            text-align: center;
            justify-content: center;
        `;
        if (type === 'success') {
            div.style.cssText += 'background: #d4edda; color: #155724; border: 2px solid #28a745;';
            div.innerHTML = `<i class="fas fa-check-circle" style="font-size: 1.5rem;"></i> <span>${message}</span>`;
        } else {
            div.style.cssText += 'background: #f8d7da; color: #721c24; border: 2px solid #dc3545;';
            div.innerHTML = `<i class="fas fa-exclamation-circle" style="font-size: 1.5rem;"></i> <span>${message}</span>`;
        }
        return div;
    }

    mapSubjectToCategory(subject) {
        const categoryMap = {
            'membership': 'membership',
            'loan': 'loan',
            'welfare': 'general',
            'volunteer': 'general',
            'partnership': 'general',
            'feedback': 'feedback',
            'complaint': 'complaint',
            'other': 'other'
        };
        return categoryMap[subject] || 'general';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ContactPage();
});
