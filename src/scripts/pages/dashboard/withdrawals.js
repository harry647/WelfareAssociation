/**
 * Withdrawals Script
 * Handles member withdrawals functionality
 * 
 * @version 1.0.0
 */

// Import services
import { authService, withdrawalService } from '../../../services/index.js';
import { showNotification, formatDate, formatCurrency } from '../../../utils/utility-functions.js';

class Withdrawals {
    constructor() {
        this.withdrawals = [];
        this.summary = {};
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        await this.loadWithdrawals();
        await this.loadSummary();
    }

    async checkAuth() {
        if (!authService.isAuthenticated()) {
            window.location.href = '../../../auth/login-page.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        if (!user || user.role !== 'admin') {
            window.location.href = '../../../auth/login-page.html';
            return false;
        }
        return true;
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
        try {
            console.log('Loading withdrawals...');
            const response = await withdrawalService.getAll();
            
            if (response.success) {
                this.withdrawals = response.data;
                this.renderPendingWithdrawals();
                this.renderWithdrawalHistory();
            } else {
                showNotification('Failed to load withdrawals', 'error');
                // Show empty state
                this.renderEmptyState();
            }
        } catch (error) {
            console.error('Error loading withdrawals:', error);
            showNotification('Failed to load withdrawals', 'error');
            // Show empty state
            this.renderEmptyState();
        }
    }

    renderEmptyState() {
        const pendingTbody = document.querySelector('section:first-of-type table tbody');
        const historyTbody = document.querySelector('section:last-of-type table tbody');
        
        if (pendingTbody) {
            pendingTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No withdrawal requests found</td></tr>';
        }
        
        if (historyTbody) {
            historyTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No withdrawal history found</td></tr>';
        }
        
        // Reset summary cards to 0
        this.updateSummaryCardsToZero();
    }

    updateSummaryCardsToZero() {
        const cards = document.querySelectorAll('.stat-number');
        cards.forEach(card => {
            if (card.textContent.includes('Ksh')) {
                card.textContent = 'Ksh 0';
            } else {
                card.textContent = '0';
            }
        });
    }

    async loadSummary() {
        try {
            const response = await withdrawalService.getSummary();
            
            if (response.success) {
                this.summary = response.data;
                this.updateSummaryCards();
            } else {
                console.log('Failed to load summary, using zeros');
                this.updateSummaryCardsToZero();
            }
        } catch (error) {
            console.error('Error loading summary:', error);
            this.updateSummaryCardsToZero();
        }
    }

    renderPendingWithdrawals() {
        const pendingWithdrawals = this.withdrawals.filter(w => w.status === 'pending');
        const tbody = document.querySelector('section:first-of-type table tbody');
        
        if (!tbody) return;

        if (pendingWithdrawals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No pending withdrawal requests</td></tr>';
            return;
        }

        tbody.innerHTML = pendingWithdrawals.map(withdrawal => `
            <tr data-withdrawal-id="${withdrawal.id}">
                <td>${withdrawal.withdrawalNumber}</td>
                <td>${withdrawal.member ? `${withdrawal.member.firstName} ${withdrawal.member.lastName}` : 'Unknown'}</td>
                <td>${withdrawal.member ? withdrawal.member.studentId : 'N/A'}</td>
                <td>${formatCurrency(withdrawal.amount)}</td>
                <td>${formatDate(withdrawal.requestDate)}</td>
                <td><span style="background: rgba(245,158,11,0.12); color: #f59e0b; padding: 3px 10px; border-radius: 20px; font-size: 11.5px;">Pending</span></td>
                <td>
                    <button class="btn approve" onclick="withdrawalsPage.approveWithdrawal('${withdrawal.id}')">✓ Approve</button>
                    <button class="btn btn-reject" onclick="withdrawalsPage.rejectWithdrawal('${withdrawal.id}')">✗ Reject</button>
                </td>
            </tr>
        `).join('');
    }

    renderWithdrawalHistory() {
        const processedWithdrawals = this.withdrawals.filter(w => w.status !== 'pending');
        const tbody = document.querySelector('section:last-of-type table tbody');
        
        if (!tbody) return;

        if (processedWithdrawals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No withdrawal history</td></tr>';
            return;
        }

        tbody.innerHTML = processedWithdrawals.map(withdrawal => `
            <tr>
                <td>${withdrawal.withdrawalNumber}</td>
                <td>${withdrawal.member ? `${withdrawal.member.firstName} ${withdrawal.member.lastName}` : 'Unknown'}</td>
                <td>${withdrawal.member ? withdrawal.member.studentId : 'N/A'}</td>
                <td>${formatCurrency(withdrawal.amount)}</td>
                <td>${formatDate(withdrawal.processedDate || withdrawal.requestDate)}</td>
                <td>
                    ${withdrawal.status === 'approved' ? 
                        '<span class="status received">Approved</span>' : 
                        '<span style="background: rgba(220,38,38,0.12); color: #dc3545; padding: 3px 10px; border-radius: 20px; font-size: 11.5px;">Rejected</span>'
                    }
                </td>
            </tr>
        `).join('');
    }

    updateSummaryCards() {
        // Update Total Withdrawn
        const totalCard = document.querySelector('.card:nth-child(1) .stat-number');
        if (totalCard) totalCard.textContent = formatCurrency(this.summary.thisMonthWithdrawn || 0);

        // Update Pending
        const pendingCard = document.querySelector('.card:nth-child(2) .stat-number');
        if (pendingCard) pendingCard.textContent = this.summary.pendingCount || 0;

        // Update Approved
        const approvedCard = document.querySelector('.card:nth-child(3) .stat-number');
        if (approvedCard) approvedCard.textContent = this.summary.approvedThisMonth || 0;

        // Update Rejected
        const rejectedCard = document.querySelector('.card:nth-child(4) .stat-number');
        if (rejectedCard) rejectedCard.textContent = this.summary.rejectedThisMonth || 0;
    }

    searchWithdrawals(query) {
        console.log('Searching withdrawals:', query);
    }

    filterWithdrawals(status) {
        console.log('Filtering by status:', status);
    }

    async approveWithdrawal(id) {
        if (confirm('Are you sure you want to approve this withdrawal?')) {
            try {
                const response = await withdrawalService.approve(id, {
                    approvalNotes: 'Approved by admin',
                    paymentMethod: 'cash'
                });

                if (response.success) {
                    showNotification('Withdrawal approved successfully!', 'success');
                    await this.loadWithdrawals();
                    await this.loadSummary();
                } else {
                    showNotification('Failed to approve withdrawal', 'error');
                }
            } catch (error) {
                console.error('Error approving withdrawal:', error);
                showNotification('Failed to approve withdrawal', 'error');
            }
        }
    }

    async rejectWithdrawal(id) {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason === null) return; // User cancelled

        try {
            const response = await withdrawalService.reject(id, {
                approvalNotes: reason
            });

            if (response.success) {
                showNotification('Withdrawal rejected successfully!', 'success');
                await this.loadWithdrawals();
                await this.loadSummary();
            } else {
                showNotification('Failed to reject withdrawal', 'error');
            }
        } catch (error) {
            console.error('Error rejecting withdrawal:', error);
            showNotification('Failed to reject withdrawal', 'error');
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

// Initialize when DOM is ready
let withdrawalsPage;

document.addEventListener('DOMContentLoaded', () => {
    withdrawalsPage = new Withdrawals();
});
