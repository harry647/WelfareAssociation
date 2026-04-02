import { showAlert } from '../../../utils/utility-functions.js';
import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';

/**
 * Add Officer Script
 * Handles adding new executive officers
 * 
 * @version 1.0.0
 */

class AddOfficer {
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
                if (sidebarOverlay) {
                    sidebarOverlay.classList.toggle('active');
                }
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
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit(e);
            });
        }

        // Logout button
        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleSubmit(e) {
        const form = e.target;
        const formData = new FormData(form);
        
        const officerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            position: formData.get('position'),
            department: formData.get('department'),
            startDate: formData.get('startDate')
        };

        try {
            // Simulate API call
            console.log('Adding officer:', officerData);
            showAlert('Officer added successfully!', 'Information', 'info');
            form.reset();
        } catch (error) {
            console.error('Error adding officer:', error);
            showAlert('Failed to add officer. Please try again.', 'Information', 'info');
        }
    }

    handleLogout() {
        if (await showConfirm(Are you sure you want to logout?)) {
            sessionStorage.clear();
            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_refresh_token');
            localStorage.removeItem('swa_user');
            window.location.href = '../../index.html';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AddOfficer();
});
