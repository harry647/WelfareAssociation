/**
 * Fines Collection Script
 * Handles fines collection functionality
 * 
 * @version 1.0.0
 */

class FinesCollection {
    constructor() {
        this.fines = [];
        this.init();
    }

    init() {
        this.initSidebar();
        this.initEventListeners();
        this.loadFines();
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
        // Issue fine button
        const issueFineBtn = document.querySelector('.issue-fine-btn');
        if (issueFineBtn) {
            issueFineBtn.addEventListener('click', () => {
                window.location.href = 'issue-fine.html';
            });
        }

        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchFines(e.target.value));
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadFines() {
        console.log('Loading fines...');
    }

    searchFines(query) {
        console.log('Searching fines:', query);
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            window.location.href = '../../index.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FinesCollection();
});
