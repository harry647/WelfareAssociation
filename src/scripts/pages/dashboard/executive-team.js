/**
 * Executive Team Script
 * Handles executive team management functionality
 * 
 * @version 1.0.0
 */

class ExecutiveTeam {
    constructor() {
        this.teamMembers = [];
        this.init();
    }

    init() {
        this.initSidebar();
        this.initEventListeners();
        this.loadTeam();
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
        // Add officer button
        const addOfficerBtn = document.querySelector('.add-officer-btn');
        if (addOfficerBtn) {
            addOfficerBtn.addEventListener('click', () => {
                window.location.href = 'add-officer.html';
            });
        }

        // Edit/Delete buttons
        document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memberId = e.target.closest('tr')?.dataset?.memberId;
                if (memberId) {
                    if (e.target.classList.contains('edit-btn')) {
                        this.editMember(memberId);
                    } else {
                        this.deleteMember(memberId);
                    }
                }
            });
        });

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadTeam() {
        console.log('Loading executive team...');
    }

    editMember(memberId) {
        console.log('Editing member:', memberId);
    }

    deleteMember(memberId) {
        if (confirm('Are you sure you want to delete this team member?')) {
            console.log('Deleting member:', memberId);
        }
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
    new ExecutiveTeam();
});
