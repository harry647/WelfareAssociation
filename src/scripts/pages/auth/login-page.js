/**
 * Login Page Script
 * Handles login form functionality and validation
 * 
 * @version 1.0.0
 */

class LoginPage {
    constructor() {
        this.form = document.querySelector('form');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.rememberCheckbox = document.getElementById('remember');
        this.init();
    }

    init() {
        if (this.form) {
            this.bindEvents();
            this.checkSavedCredentials();
        }
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Forgot password handler
        const forgotLink = document.querySelector('.forgot-password');
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }

        // Password visibility toggle
        this.addPasswordToggle();
    }

    addPasswordToggle() {
        const passwordGroup = this.passwordInput?.parentElement;
        if (!passwordGroup) return;

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
        toggleBtn.setAttribute('aria-label', 'Toggle password visibility');
        
        toggleBtn.addEventListener('click', () => {
            const type = this.passwordInput.type === 'password' ? 'text' : 'password';
            this.passwordInput.type = type;
            toggleBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });

        passwordGroup.style.position = 'relative';
        passwordGroup.appendChild(toggleBtn);
    }

    handleLogin() {
        const username = this.usernameInput?.value?.trim();
        const password = this.passwordInput?.value;
        const remember = this.rememberCheckbox?.checked || false;

        // Basic validation
        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        // Validate email format if it looks like an email
        if (username.includes('@') && !this.isValidEmail(username)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Simulate login (in real app, call authentication service)
        this.performLogin(username, remember);
    }

    async performLogin(username, remember) {
        try {
            // Show loading state
            const submitBtn = this.form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            submitBtn.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Store remember preference
            if (remember) {
                localStorage.setItem('swa_remember', 'true');
                localStorage.setItem('swa_username', username);
            } else {
                localStorage.removeItem('swa_remember');
                localStorage.removeItem('swa_username');
            }

            // Show success and redirect
            this.showSuccess('Login successful! Redirecting...');
            
            // Get redirect URL from query parameter or default to member portal
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect') || '../dashboard/member-portal.html';
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);

        } catch (error) {
            this.showError('Login failed. Please try again.');
            console.error('Login error:', error);
        } finally {
            const submitBtn = this.form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            submitBtn.disabled = false;
        }
    }

    handleForgotPassword() {
        alert('Please contact the SWA administrator to reset your password.\n\nEmail: swateam@gmail.com\nPhone: +254 123 439 040');
    }

    checkSavedCredentials() {
        const remember = localStorage.getItem('swa_remember');
        const savedUsername = localStorage.getItem('swa_username');

        if (remember === 'true' && savedUsername && this.usernameInput) {
            this.usernameInput.value = savedUsername;
            if (this.rememberCheckbox) {
                this.rememberCheckbox.checked = true;
            }
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(message) {
        // Create error alert
        this.removeAlerts();
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-error';
        alertDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        const container = document.querySelector('.login-container');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => this.removeAlerts(), 5000);
    }

    showSuccess(message) {
        this.removeAlerts();
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        const container = document.querySelector('.login-container');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
        }
    }

    removeAlerts() {
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});

// Export for module use
export default LoginPage;
