/**
 * Issue Fine Script
 * Handles issuing fines to members
 * 
 * @version 1.0.0
 */

class IssueFine {
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
                this.submitFine(e);
            });
        }

        const cancelBtn = document.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                window.location.href = 'fines-collection.html';
            });
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    submitFine(e) {
        const form = e.target;
        const formData = new FormData(form);
        
        const fine = {
            memberId: formData.get('memberId'),
            amount: formData.get('amount'),
            reason: formData.get('reason'),
            dueDate: formData.get('dueDate')
        };

        console.log('Issuing fine:', fine);
        alert('Fine issued successfully!');
        window.location.href = 'fines-collection.html';
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            window.location.href = '../../index.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new IssueFine();
});
