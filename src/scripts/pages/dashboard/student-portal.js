import { showAlert } from '../../../utils/utility-functions.js';
import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';

/**
 * Student Portal Script
 * Handles student portal functionality including login and registration
 * 
 * @version 1.0.0
 */

class StudentPortal {
    constructor() {
        this.loginForm = document.querySelector('.login-section form');
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkExistingSession();
    }

    bindEvents() {
        // Login form submission
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Card click handlers for guided links
        document.querySelectorAll('.guide-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Allow normal link behavior
            });
        });
    }

    checkExistingSession() {
        // Check if user is already logged in
        const session = localStorage.getItem('swa_session');
        if (session) {
            // User is logged in, redirect to member portal
            // Uncomment below in production
            // window.location.href = 'member-portal.html';
        }
    }

    async handleLogin() {
        const username = this.loginForm.querySelector('#username')?.value?.trim();
        const password = this.loginForm.querySelector('#password')?.value;
        const remember = this.loginForm.querySelector('#remember')?.checked || false;

        // Basic validation
        if (!username || !password) {
            showAlert('Please enter both username and password', 'Information', 'info');
            return;
        }

        try {
            // Show loading
            const submitBtn = this.loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            submitBtn.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Store session
            const sessionData = {
                username,
                loginTime: new Date().toISOString(),
                remember
            };
            localStorage.setItem('swa_session', JSON.stringify(sessionData));

            // Show success and redirect
            showAlert('Login successful! Redirecting to Member Portal...', 'Information', 'info');
            window.location.href = '/pages/dashboard/member/member-portal.html';

        } catch (error) {
            console.error('Login error:', error);
            showAlert('Login failed. Please check your credentials and try again.', 'Information', 'info');
        } finally {
            const submitBtn = this.loginForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
                submitBtn.disabled = false;
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new StudentPortal();
});

// Export for module use
export default StudentPortal;
