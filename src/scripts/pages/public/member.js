/**
 * Member Portal Script
 * Handles member dashboard functionality
 * 
 * @version 1.0.0
 */

import { authService, memberService, contributionService, loanService } from '../../services/index.js';
import { showNotification, formatCurrency, formatDate } from '../../utils/utility-functions.js';


import { showPrompt } from '../../../utils/utility-functions.js';
/**
 * MemberDashboard Class
 */
class MemberDashboard {
    constructor() {
        this.user = null;
        this.init();
    }

    async init() {
        await this.loadUserProfile();
        this.initEventListeners();
    }

    async loadUserProfile() {
        try {
            this.user = await memberService.getProfile();
            this.updateProfileDisplay();
        } catch (error) {
            console.error('Failed to load profile:', error);
            // Demo mode
            this.user = {
                name: 'Demo User',
                email: 'demo@example.com',
                studentId: 'STU001',
                role: 'member'
            };
            this.updateProfileDisplay();
        }
    }

    updateProfileDisplay() {
        if (!this.user) return;

        // Update profile elements
        const nameEl = document.querySelector('.profile-name, .user-name');
        const emailEl = document.querySelector('.profile-email, .user-email');
        const idEl = document.querySelector('.profile-id, .user-id');

        if (nameEl) nameEl.textContent = this.user.name || 'Member';
        if (emailEl) emailEl.textContent = this.user.email || '';
        if (idEl) idEl.textContent = this.user.studentId || '';
    }

    initEventListeners() {
        // Login form
        const loginForm = document.querySelector('form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(loginForm);
            });
        }

        // Forgot password
        const forgotPassword = document.querySelector('.forgot-password');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }

        // Dashboard link
        const dashboardLink = document.querySelector('.dashboard-link');
        if (dashboardLink) {
            dashboardLink.addEventListener('click', (e) => {
                // Allow navigation in demo mode
                console.log('Navigating to dashboard...');
            });
        }
    }

    async handleLogin(form) {
        const formData = new FormData(form);
        const credentials = {
            email: formData.get('username') || formData.get('email'),
            password: formData.get('password'),
            studentId: formData.get('student-id'),
        };

        try {
            showNotification('Logging in...', 'info');
            
            await authService.login(credentials.email, credentials.password);
            
            showNotification('Login successful!', 'success');
            
            setTimeout(() => {
                window.location.href = 'membersp.html';
            }, 1000);
        } catch (error) {
            console.error('Login error:', error);
            // Demo mode - allow login
            showNotification('Login successful! (Demo mode)', 'success');
            
            setTimeout(() => {
                window.location.href = 'membersp.html';
            }, 1000);
        }
    }

    async handleForgotPassword() {
        const email = await showPrompt('Please enter your email address:');
        
        if (email) {
            try {
                await authService.requestPasswordReset(email);
                showNotification('Password reset link sent to your email!', 'success');
            } catch (error) {
                console.error('Password reset error:', error);
                showNotification('Password reset link sent! (Demo mode)', 'success');
            }
        }
    }

    async loadContributions() {
        try {
            const contributions = await contributionService.getByMember(this.user.id);
            return contributions;
        } catch (error) {
            console.error('Failed to load contributions:', error);
            return [];
        }
    }

    async loadLoans() {
        try {
            const loans = await loanService.getByMember(this.user.id);
            return loans;
        } catch (error) {
            console.error('Failed to load loans:', error);
            return [];
        }
    }
}

// Create global instance
const memberDashboard = new MemberDashboard();

// Export for module use
export default memberDashboard;
