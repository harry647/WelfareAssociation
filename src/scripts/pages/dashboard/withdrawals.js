/**
 * Withdrawals Script
 * Handles member withdrawals functionality
 * 
 * @version 2.0.0
 * Implements: types, balance calculation, create/approve/reject workflow
 */

// Import services
import { authService, withdrawalService, memberService, apiService, API_CONFIG } from '../../../services/index.js';
import { showNotification, formatDate, formatCurrency, showPrompt, showConfirm } from '../../../utils/utility-functions.js';


import { showConfirm } from '../../../utils/utility-functions.js';
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

        // Create modal content
        const modalContent = `
            <div class="withdrawal-details-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-info-circle"></i> Withdrawal Details</h2>
                    <button class="modal-close" onclick="this.closest('.withdrawal-details-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Withdrawal Number:</label>
                            <span>${withdrawal.withdrawalNumber}</span>
                        </div>
                        <div class="detail-item">
                            <label>Member:</label>
                            <span>${withdrawal.member ? `${withdrawal.member.firstName} ${withdrawal.member.lastName}` : 'Unknown'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Type:</label>
                            <span class="type-badge type-${withdrawal.type}">${this.getTypeLabel(withdrawal.type)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Amount:</label>
                            <span class="amount">Ksh ${formatCurrency(withdrawal.amount)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-badge status-${withdrawal.status}">${this.getStatusLabel(withdrawal.status)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Request Date:</label>
                            <span>${formatDate(withdrawal.requestDate || withdrawal.createdAt)}</span>
                        </div>
                        ${withdrawal.reason ? `
                        <div class="detail-item full-width">
                            <label>Reason:</label>
                            <span>${withdrawal.reason}</span>
                        </div>
                        ` : ''}
                        ${withdrawal.approvalNotes ? `
                        <div class="detail-item full-width">
                            <label>Approval Notes:</label>
                            <span>${withdrawal.approvalNotes}</span>
                        </div>
                        ` : ''}
                        ${withdrawal.paymentMethod ? `
                        <div class="detail-item">
                            <label>Payment Method:</label>
                            <span class="payment-method">${withdrawal.paymentMethod}</span>
                        </div>
                        ` : ''}
                        ${withdrawal.paymentReference ? `
                        <div class="detail-item">
                            <label>Payment Reference:</label>
                            <span class="payment-reference">${withdrawal.paymentReference}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        // Create and show modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);

        // Add styles
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }

            .withdrawal-details-modal {
                background: white;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid #e0e0e0;
                background: linear-gradient(135deg, #2d7c5b, #1a5c4a);
                color: white;
                border-radius: 12px 12px 0 0;
            }

            .modal-header h2 {
                margin: 0;
                font-size: 1.5em;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .modal-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.2em;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: background 0.3s ease;
            }

            .modal-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .modal-body {
                padding: 24px;
            }

            .detail-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }

            .detail-item {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .detail-item.full-width {
                grid-column: 1 / -1;
            }

            .detail-item label {
                font-weight: 600;
                color: #666;
                font-size: 0.9em;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .detail-item span {
                font-size: 1.1em;
                color: #333;
                padding: 8px 12px;
                background: #f8f9fa;
                border-radius: 6px;
                border: 1px solid #e9ecef;
            }

            .amount {
                font-weight: 600;
                color: #2d7c5b !important;
                font-size: 1.2em !important;
            }

            .type-badge {
                padding: 6px 12px !important;
                border-radius: 20px !important;
                font-size: 0.9em !important;
                font-weight: 500 !important;
                text-transform: capitalize !important;
                border: none !important;
            }

            .type-loan_disbursement { background: #e3f2fd; color: #1976d2; }
            .type-welfare { background: #f3e5f5; color: #7b1fa2; }
            .type-event_expense { background: #fff3e0; color: #f57c00; }
            .type-refund { background: #e8f5e8; color: #388e3c; }
            .type-other { background: #f5f5f5; color: #616161; }

            .status-badge {
                padding: 6px 12px !important;
                border-radius: 20px !important;
                font-size: 0.9em !important;
                font-weight: 500 !important;
                text-transform: capitalize !important;
                border: none !important;
            }

            .status-pending { background: #fff3cd; color: #856404; }
            .status-approved { background: #d4edda; color: #155724; }
            .status-rejected { background: #f8d7da; color: #721c24; }
            .status-processed { background: #cce5ff; color: #004085; }
            .status-disbursed { background: #d1ecf1; color: #0c5460; }

            .payment-method, .payment-reference {
                font-family: 'Courier New', monospace !important;
                text-transform: uppercase !important;
                font-weight: 600 !important;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            @media (max-width: 768px) {
                .withdrawal-details-modal {
                    width: 95%;
                    margin: 20px;
                }
                
                .detail-grid {
                    grid-template-columns: 1fr;
                }
                
                .modal-body {
                    padding: 16px;
                }
            }
        `;
        
        document.head.appendChild(styleElement);

        // Close modal when clicking overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async approveWithdrawal(id) {
        const method = await showPrompt('Enter payment method:', 'cash', 'Payment Method');
        if (!method) return;

        const reference = await showPrompt('Enter payment reference (M-Pesa code or transaction ID):', '', 'Payment Reference');
        
        const confirmed = await showConfirm(
            'Are you sure you want to APPROVE this withdrawal? This will mark it as DISBURSED.',
            'Confirm Withdrawal Approval'
        );
        
        if (confirmed) {
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
        const reason = await showPrompt('Please provide a reason for rejection:', '', 'Rejection Reason');
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

    async handleLogout() {
        if (await showConfirm('Are you sure you want to logout?')) {
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
