/**
 * Withdrawals Script
 * Handles member withdrawals functionality
 * 
 * @version 2.0.0
 * Implements: types, balance calculation, create/approve/reject workflow
 */

// Import services
import { authService, withdrawalService, memberService, apiService, API_CONFIG } from '../../../services/index.js';
import { showNotification, formatDate, formatCurrency } from '../../../utils/utility-functions.js';

class Withdrawals {
    constructor() {
        this.withdrawals = [];
        this.summary = {};
        this.balance = {};
        this.members = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        await Promise.all([
            this.loadMembers(),
            this.loadWithdrawals(),
            this.loadSummary(),
            this.loadBalance()
        ]);
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
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderWithdrawals();
            });
        });

        // New Withdrawal button
        const newWithdrawalBtn = document.getElementById('newWithdrawalBtn');
        if (newWithdrawalBtn) {
            newWithdrawalBtn.addEventListener('click', () => this.openModal());
        }

        // Withdrawal form
        const form = document.getElementById('withdrawalForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCreateWithdrawal(e));
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadMembers() {
        try {
            const response = await memberService.getAllMembers();
            if (response.success) {
                this.members = response.data || [];
                this.populateMemberSelect();
            }
        } catch (error) {
            console.error('Error loading members:', error);
        }
    }

    populateMemberSelect() {
        const select = document.getElementById('withdrawalMember');
        if (!select) return;

        this.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = `${member.firstName} ${member.lastName} (${member.memberNumber || member.studentId})`;
            select.appendChild(option);
        });
    }

    async loadWithdrawals() {
        try {
            console.log('Loading withdrawals...');
            const response = await withdrawalService.getAll({ limit: 100 });
            
            if (response.success) {
                this.withdrawals = response.data;
                this.renderWithdrawals();
            } else {
                showNotification('Failed to load withdrawals', 'error');
                this.renderEmptyState();
            }
        } catch (error) {
            console.error('Error loading withdrawals:', error);
            showNotification('Failed to load withdrawals', 'error');
            this.renderEmptyState();
        }
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

    async loadBalance() {
        try {
            const response = await apiService.get(`${API_CONFIG.endpoints.withdrawals}/balance`, {}, true);
            
            if (response.success) {
                this.balance = response.data;
                this.updateBalanceDisplay();
            } else {
                console.log('Failed to load balance');
                this.updateBalanceToZero();
            }
        } catch (error) {
            console.error('Error loading balance:', error);
            this.updateBalanceToZero();
        }
    }

    updateBalanceDisplay() {
        // System Balance
        const balanceEl = document.getElementById('systemBalance');
        if (balanceEl) {
            balanceEl.textContent = `Ksh ${formatCurrency(this.balance.systemBalance || 0)}`;
        }

        // Cash Balance (available after withdrawals)
        const cashBalanceEl = document.getElementById('cashBalance');
        if (cashBalanceEl) {
            const availableBalance = (parseFloat(this.balance.totalContributions) || 0) - (parseFloat(this.balance.totalWithdrawals) || 0);
            cashBalanceEl.textContent = `Ksh ${formatCurrency(availableBalance)}`;
        }
    }

    updateBalanceToZero() {
        const balanceEl = document.getElementById('systemBalance');
        if (balanceEl) balanceEl.textContent = 'Ksh 0';

        const cashBalanceEl = document.getElementById('cashBalance');
        if (cashBalanceEl) cashBalanceEl.textContent = 'Ksh 0';
    }

    renderEmptyState() {
        const tbody = document.getElementById('withdrawalsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">No withdrawal requests found</td></tr>';
        }
        this.updateSummaryCardsToZero();
    }

    updateSummaryCardsToZero() {
        const cards = document.querySelectorAll('.stat-number');
        cards.forEach(card => {
            const parent = card.closest('.card');
            if (parent && card.id === 'cashBalance') return;
            
            if (card.textContent.includes('Ksh')) {
                card.textContent = 'Ksh 0';
            } else {
                card.textContent = '0';
            }
        });
    }

    updateSummaryCards() {
        // Total Withdrawn (all time approved)
        const totalCard = document.querySelector('.card:nth-child(1) .stat-number');
        if (totalCard) totalCard.textContent = formatCurrency(this.summary.totalWithdrawn || this.summary.thisMonthWithdrawn || 0);

        // Pending
        const pendingCard = document.querySelector('.card:nth-child(2) .stat-number');
        if (pendingCard) pendingCard.textContent = this.summary.pendingCount || 0;

        // Approved This Month
        const approvedCard = document.querySelector('.card:nth-child(3) .stat-number');
        if (approvedCard) approvedCard.textContent = this.summary.approvedThisMonth || 0;
    }

    getTypeBadgeClass(type) {
        const typeMap = {
            'loan_disbursement': 'type-loan_disbursement',
            'welfare': 'type-welfare',
            'event_expense': 'type-event_expense',
            'refund': 'type-refund',
            'other': 'type-other'
        };
        return typeMap[type] || 'type-other';
    }

    getTypeLabel(type) {
        const labels = {
            'loan_disbursement': 'Loan Disbursement',
            'welfare': 'Welfare',
            'event_expense': 'Event Expense',
            'refund': 'Refund',
            'other': 'Other'
        };
        return labels[type] || 'Other';
    }

    getStatusBadgeClass(status) {
        return `status-${status}`;
    }

    getStatusLabel(status) {
        const labels = {
            'pending': 'Pending',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'processed': 'Processed',
            'disbursed': 'Disbursed'
        };
        return labels[status] || status;
    }

    renderWithdrawals() {
        const tbody = document.getElementById('withdrawalsTableBody');
        if (!tbody) return;

        let filteredWithdrawals = this.withdrawals;
        
        // Apply filter
        if (this.currentFilter !== 'all') {
            filteredWithdrawals = this.withdrawals.filter(w => w.status === this.currentFilter);
        }

        if (filteredWithdrawals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">No withdrawal requests found</td></tr>';
            return;
        }

        tbody.innerHTML = filteredWithdrawals.map(withdrawal => `
            <tr data-withdrawal-id="${withdrawal.id}">
                <td><strong>${withdrawal.withdrawalNumber || 'N/A'}</strong></td>
                <td>${withdrawal.member ? `${withdrawal.member.firstName} ${withdrawal.member.lastName}` : 'Unknown'}</td>
                <td><span class="withdrawal-type-badge ${this.getTypeBadgeClass(withdrawal.type)}">${this.getTypeLabel(withdrawal.type)}</span></td>
                <td><strong>${formatCurrency(withdrawal.amount)}</strong></td>
                <td>${withdrawal.reason || '-'}</td>
                <td>${formatDate(withdrawal.requestDate || withdrawal.createdAt)}</td>
                <td><span class="withdrawal-type-badge ${this.getStatusBadgeClass(withdrawal.status)}" style="text-transform: capitalize;">${this.getStatusLabel(withdrawal.status)}</span></td>
                <td class="action-buttons">
                    ${withdrawal.status === 'pending' ? `
                        <button class="btn-action btn-approve" onclick="withdrawalsPage.approveWithdrawal('${withdrawal.id}')" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action btn-reject" onclick="withdrawalsPage.rejectWithdrawal('${withdrawal.id}')" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    <button class="btn-action btn-view" onclick="withdrawalsPage.viewWithdrawal('${withdrawal.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    viewWithdrawal(id) {
        const withdrawal = this.withdrawals.find(w => w.id === id);
        if (!withdrawal) return;

        alert(`
Withdrawal Details
==================
ID: ${withdrawal.withdrawalNumber}
Member: ${withdrawal.member ? `${withdrawal.member.firstName} ${withdrawal.member.lastName}` : 'Unknown'}
Type: ${this.getTypeLabel(withdrawal.type)}
Amount: Ksh ${formatCurrency(withdrawal.amount)}
Reason: ${withdrawal.reason || 'N/A'}
Status: ${this.getStatusLabel(withdrawal.status)}
Date: ${formatDate(withdrawal.requestDate || withdrawal.createdAt)}
${withdrawal.approvalNotes ? `Notes: ${withdrawal.approvalNotes}` : ''}
${withdrawal.paymentMethod ? `Payment Method: ${withdrawal.paymentMethod}` : ''}
${withdrawal.paymentReference ? `Reference: ${withdrawal.paymentReference}` : ''}
        `.trim());
    }

    async approveWithdrawal(id) {
        const method = prompt('Enter payment method (cash/mpesa/bank_transfer):', 'cash');
        if (!method) return;

        const reference = prompt('Enter payment reference (M-Pesa code or transaction ID):', '');
        
        if (confirm('Are you sure you want to APPROVE this withdrawal? This will mark it as DISBURSED.')) {
            try {
                const response = await withdrawalService.approve(id, {
                    approvalNotes: 'Approved and disbursed by admin',
                    paymentMethod: method,
                    paymentReference: reference
                });

                if (response.success) {
                    showNotification('Withdrawal approved and disbursed successfully!', 'success');
                    await Promise.all([
                        this.loadWithdrawals(),
                        this.loadSummary(),
                        this.loadBalance()
                    ]);
                } else {
                    showNotification(response.message || 'Failed to approve withdrawal', 'error');
                }
            } catch (error) {
                console.error('Error approving withdrawal:', error);
                showNotification('Failed to approve withdrawal', 'error');
            }
        }
    }

    async rejectWithdrawal(id) {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason === null || reason.trim() === '') {
            showNotification('Rejection reason is required', 'error');
            return;
        }

        try {
            const response = await withdrawalService.reject(id, {
                approvalNotes: reason
            });

            if (response.success) {
                showNotification('Withdrawal rejected successfully!', 'success');
                await Promise.all([
                    this.loadWithdrawals(),
                    this.loadSummary()
                ]);
            } else {
                showNotification(response.message || 'Failed to reject withdrawal', 'error');
            }
        } catch (error) {
            console.error('Error rejecting withdrawal:', error);
            showNotification('Failed to reject withdrawal', 'error');
        }
    }

    openModal() {
        const modal = document.getElementById('withdrawalModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeModal() {
        const modal = document.getElementById('withdrawalModal');
        if (modal) {
            modal.classList.remove('active');
        }
        // Reset form
        const form = document.getElementById('withdrawalForm');
        if (form) form.reset();
    }

    async handleCreateWithdrawal(e) {
        e.preventDefault();

        const memberId = document.getElementById('withdrawalMember').value;
        const type = document.getElementById('withdrawalType').value;
        const amount = parseFloat(document.getElementById('withdrawalAmount').value);
        const reason = document.getElementById('withdrawalReason').value;

        if (!memberId || !type || !amount) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            const response = await withdrawalService.add({
                memberId,
                type,
                amount,
                reason
            });

            if (response.success) {
                showNotification('Withdrawal request created successfully!', 'success');
                this.closeModal();
                await Promise.all([
                    this.loadWithdrawals(),
                    this.loadSummary(),
                    this.loadBalance()
                ]);
            } else {
                showNotification(response.message || 'Failed to create withdrawal', 'error');
            }
        } catch (error) {
            console.error('Error creating withdrawal:', error);
            showNotification('Failed to create withdrawal', 'error');
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
    // Make functions globally available for onclick handlers after initialization
    window.withdrawalsPage = withdrawalsPage;
});
