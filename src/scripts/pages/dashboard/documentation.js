/**
 * Documentation Script
 * Handles documentation page functionality
 * 
 * @version 1.0.0
 */

class Documentation {
    constructor() {
        this.documents = [];
        this.init();
    }

    init() {
        this.initSidebar();
        this.initEventListeners();
        this.loadDocuments();
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
        // Create folder button
        const createFolderBtn = document.querySelector('.create-folder-btn');
        if (createFolderBtn) {
            createFolderBtn.addEventListener('click', () => {
                window.location.href = 'create-folder.html';
            });
        }

        // Upload button
        const uploadBtn = document.querySelector('.upload-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                window.location.href = 'upload-document.html';
            });
        }

        // Logout button
        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadDocuments() {
        console.log('Loading documentation...');
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            window.location.href = '../../index.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Documentation();
});
