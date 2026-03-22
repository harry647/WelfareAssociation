/**
 * Active Members Script
 * Handles active members page functionality
 * 
 * @version 1.0.0
 */

class ActiveMembers {
    constructor() {
        this.members = [];
        this.init();
    }

    init() {
        this.initSidebar();
        this.initEventListeners();
        this.loadActiveMembers();
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
        // View buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const memberId = row?.dataset?.memberId;
                if (memberId) {
                    this.viewMember(memberId);
                }
            });
        });

        // Quick action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const href = btn.getAttribute('href');
                if (href) {
                    window.location.href = href;
                }
            });
        });

        // Logout button
        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadActiveMembers() {
        // Load active members data
        try {
            // Simulated data loading
            this.members = [
                { id: 1, name: 'Vincent Otieno', memberNumber: 'SWA/001', contribution: 8500, status: 'Active' },
                { id: 2, name: 'Sarah Johnson', memberNumber: 'SWA/002', contribution: 7000, status: 'Active' },
                { id: 3, name: 'James Wilson', memberNumber: 'SWA/003', contribution: 6500, status: 'Active' },
                { id: 4, name: 'Mary Chen', memberNumber: 'SWA/004', contribution: 9200, status: 'Active' },
            ];
            this.renderMembers();
        } catch (error) {
            console.error('Error loading active members:', error);
        }
    }

    renderMembers() {
        const tableBody = document.querySelector('table tbody');
        if (!tableBody) return;

        tableBody.innerHTML = this.members.map(member => `
            <tr data-member-id="${member.id}">
                <td>${member.memberNumber}</td>
                <td>${member.name}</td>
                <td>Ksh ${member.contribution.toLocaleString()}</td>
                <td><span class="status received">${member.status}</span></td>
                <td><button class="btn">View</button></td>
            </tr>
        `).join('');
    }

    viewMember(memberId) {
        console.log('Viewing member:', memberId);
        // Navigate to member details
        window.location.href = `members.html?memberId=${memberId}`;
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            window.location.href = '../../index.html';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ActiveMembers();
});
