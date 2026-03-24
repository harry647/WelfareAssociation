/**
 * Send Announcement Script
 * Handles sending announcements to members
 * 
 * @version 1.0.0
 */

class SendAnnouncement {
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
                this.sendAnnouncement(e);
            });
        }

        const cancelBtn = document.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                window.location.href = 'notices.html';
            });
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    sendAnnouncement(e) {
        const form = e.target;
        const formData = new FormData(form);
        
        const announcement = {
            title: formData.get('title'),
            message: formData.get('message'),
            recipients: formData.get('recipients'),
            scheduledDate: formData.get('scheduledDate')
        };

        console.log('Sending announcement:', announcement);
        alert('Announcement sent successfully!');
        window.location.href = 'notices.html';
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
    new SendAnnouncement();
});
