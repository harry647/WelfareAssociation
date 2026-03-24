/**
 * Notices Script
 * Handles notices management functionality
 * 
 * @version 1.0.0
 */

class Notices {
    constructor() {
        this.notices = [];
        this.init();
    }

    init() {
        this.initSidebar();
        this.initEventListeners();
        this.loadNotices();
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
        // Create notice button
        const createNoticeBtn = document.querySelector('.create-notice-btn');
        if (createNoticeBtn) {
            createNoticeBtn.addEventListener('click', () => {
                window.location.href = 'create-notice.html';
            });
        }

        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchNotices(e.target.value));
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadNotices() {
        console.log('Loading notices...');
    }

    searchNotices(query) {
        console.log('Searching notices:', query);
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_refresh_token');
            localStorage.removeItem('swa_user');
            window.location.href = '../../index.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Notices();
});
