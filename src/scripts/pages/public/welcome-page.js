/**
 * Welcome Page Script
 * Handles welcome page functionality with show/hide login and register forms
 * 
 * @version 1.0.0
 */

class WelcomePage {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.init();
    }

    init() {
        if (this.loginForm || this.registerForm) {
            this.bindEvents();
        }
    }

    bindEvents() {
        // Make functions available globally for onclick handlers
        window.showRegister = this.showRegister.bind(this);
        window.showLogin = this.showLogin.bind(this);

        // Form submissions
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Sign up/in links
        const signUpLink = this.registerForm?.querySelector('span');
        if (signUpLink) {
            signUpLink.addEventListener('click', () => {
                this.showLogin();
            });
        }

        const signInLink = this.loginForm?.querySelector('.register-form span');
        if (signInLink) {
            signInLink.addEventListener('click', () => {
                this.showRegister();
            });
        }
    }

    showLogin() {
        if (this.loginForm) {
            this.loginForm.classList.remove('hidden');
        }
        if (this.registerForm) {
            this.registerForm.classList.add('hidden');
        }
    }

    showRegister() {
        if (this.loginForm) {
            this.loginForm.classList.add('hidden');
        }
        if (this.registerForm) {
            this.registerForm.classList.remove('hidden');
        }
    }

    async handleLogin() {
        const form = this.loginForm;
        const inputs = form.querySelectorAll('input');
        const username = inputs[0]?.value?.trim();
        const password = inputs[1]?.value;

        if (!username || !password) {
            alert('Please enter both username and password');
            return;
        }

        try {
            // Show loading
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Show success and redirect
            alert('Login successful! Redirecting to Member Portal...');
            window.location.href = '../dashboard/member-portal.html';

        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    async handleRegister() {
        const form = this.registerForm;
        const inputs = form.querySelectorAll('input');
        
        const fullName = inputs[0]?.value?.trim();
        const email = inputs[1]?.value?.trim();
        const studentId = inputs[2]?.value?.trim();
        const password = inputs[3]?.value;

        if (!fullName || !email || !studentId || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        try {
            // Show loading
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Registering...';
            submitBtn.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Show success and redirect
            alert('Registration successful! Welcome to SWA!');
            window.location.href = '../dashboard/member-portal.html';

        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WelcomePage();
});

// Export for module use
export default WelcomePage;
