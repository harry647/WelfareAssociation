/**
 * Send SMS Script
 * Handles sending SMS to members
 * 
 * @version 1.0.0
 */

class SendSMS {
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
                this.sendSMS(e);
            });
        }

        const cancelBtn = document.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                window.location.href = '../admin/admin-dashboard.html';
            });
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    sendSMS(e) {
        const form = e.target;
        const formData = new FormData(form);
        
        const sms = {
            recipients: formData.get('recipients'),
            message: formData.get('message')
        };

        console.log('Sending SMS:', sms);
        alert('SMS sent successfully!');
        window.location.href = '../admin/admin-dashboard.html';
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
    new SendSMS();
});
