/**
 * Withdrawals Script
 * Handles member withdrawals functionality
 * 
 * @version 1.0.0
 */

class Withdrawals {
    constructor() {
        this.withdrawals = [];
        this.init();
    }

    init() {
        this.initSidebar();
        this.initEventListeners();
        this.loadWithdrawals();
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
        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchWithdrawals(e.target.value));
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterWithdrawals(e.target.dataset.status);
            });
        });

        // Approve/Reject buttons
        document.querySelectorAll('.approve-btn, .reject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const withdrawalId = e.target.closest('tr')?.dataset?.withdrawalId;
                if (withdrawalId) {
                    if (e.target.classList.contains('approve-btn')) {
                        this.approveWithdrawal(withdrawalId);
                    } else {
                        this.rejectWithdrawal(withdrawalId);
                    }
                }
            });
        });

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadWithdrawals() {
        console.log('Loading withdrawals...');
    }

    searchWithdrawals(query) {
        console.log('Searching withdrawals:', query);
    }

    filterWithdrawals(status) {
        console.log('Filtering by status:', status);
    }

    approveWithdrawal(id) {
        if (confirm('Are you sure you want to approve this withdrawal?')) {
            console.log('Approving withdrawal:', id);
            alert('Withdrawal approved successfully!');
        }
    }

    rejectWithdrawal(id) {
        if (confirm('Are you sure you want to reject this withdrawal?')) {
            console.log('Rejecting withdrawal:', id);
            alert('Withdrawal rejected.');
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            window.location.href = '../../index.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Withdrawals();
});
