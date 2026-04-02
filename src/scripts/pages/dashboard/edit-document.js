import { showAlert } from '../../../utils/utility-functions.js';
import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';

/**
 * Edit Document Script
 * Handles editing existing documents
 * 
 * @version 1.0.0
 */

class EditDocument {
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
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDocument(e);
            });
        }

        const cancelBtn = document.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                window.location.href = 'documentation.html';
            });
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    saveDocument(e) {
        console.log('Saving document...');
        showAlert('Document saved successfully!', 'Information', 'info');
        window.location.href = 'documentation.html';
    }

    async handleLogout() {
        if (await showConfirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_refresh_token');
            localStorage.removeItem('swa_user');
            window.location.href = '../../index.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EditDocument();
});
