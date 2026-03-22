/**
 * Security Settings Script
 * Handles security settings functionality
 * 
 * @version 1.0.0
 */

class SecuritySettings {
    constructor() {
        this.init();
    }

    init() {
        this.initSidebar();
        this.initEventListeners();
    }

    initSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        }
    }

    initEventListeners() {
        // Password change form
        const passwordForm = document.querySelector('.password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword(e);
            });
        }

        // Two-factor toggle
        const twoFactorToggle = document.getElementById('twoFactorToggle');
        if (twoFactorToggle) {
            twoFactorToggle.addEventListener('change', (e) => {
                this.toggleTwoFactor(e.target.checked);
            });
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    changePassword(e) {
        const form = e.target;
        const newPassword = form.querySelector('input[name="newPassword"]')?.value;
        const confirmPassword = form.querySelector('input[name="confirmPassword"]')?.value;

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        console.log('Changing password...');
        alert('Password changed successfully!');
        form.reset();
    }

    toggleTwoFactor(enabled) {
        console.log('Two-factor authentication:', enabled ? 'enabled' : 'disabled');
        alert(`Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully!`);
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            window.location.href = '../../index.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SecuritySettings();
});
