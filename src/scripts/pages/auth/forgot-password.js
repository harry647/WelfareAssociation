/**
 * Forgot Password Page Script
 * Handles password reset request functionality
 * 
 * @version 1.0.0
 */

class ForgotPasswordPage {
    constructor() {
        this.form = document.getElementById('forgot-password-form');
        this.emailInput = document.getElementById('email');
        this.successMessage = document.getElementById('success-message');
        this.submitButton = this.form?.querySelector('button[type="submit"]');
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
            this.handlePasswordReset();
        });

        // Email input validation
        this.emailInput?.addEventListener('input', () => {
            this.removeAlerts();
        });
    }

    handlePasswordReset() {
        const email = this.emailInput?.value?.trim();

        // Validate email
        if (!email) {
            this.showError('Please enter your email address');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Simulate password reset request
        this.sendPasswordResetRequest(email);
    }

    async sendPasswordResetRequest(email) {
        try {
            // Show loading state
            this.setLoadingState(true);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Show success message
            this.showSuccessMessage();

        } catch (error) {
            this.showError('Failed to send reset link. Please try again.');
            console.error('Password reset error:', error);
        } finally {
            this.setLoadingState(false);
        }
    }

    showSuccessMessage() {
        // Hide form and show success message
        if (this.form) {
            this.form.style.display = 'none';
        }
        
        if (this.successMessage) {
            this.successMessage.style.display = 'block';
        }
    }

    setLoadingState(isLoading) {
        if (!this.submitButton) return;

        if (isLoading) {
            this.submitButton.disabled = true;
            this.submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        } else {
            this.submitButton.disabled = false;
            this.submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(message) {
        this.removeAlerts();
        
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-error';
        alertDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        const container = document.querySelector('.forgot-password-container');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => this.removeAlerts(), 5000);
    }

    removeAlerts() {
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ForgotPasswordPage();
});

// Export for module use
export default ForgotPasswordPage;
