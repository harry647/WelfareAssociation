/**
 * Debts Script
 * Handles debts management functionality
 * 
 * @version 1.0.0
 */

// Import services
import { authService, debtService } from '../../../services/index.js';
import { showNotification, formatDate, formatCurrency } from '../../../utils/utility-functions.js';


import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';
class Debts {
    constructor() {
        this.debts = [];
        this.statistics = {};
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        await this.loadDebts();
        await this.loadStatistics();
    }

    async checkAuth() {
        if (!authService.isAuthenticated()) {
            window.location.href = '../../auth/login-page.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        if (!user || user.role !== 'admin') {
            window.location.href = '../../auth/login-page.html';
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
            searchInput.addEventListener('input', (e) => this.searchDebts(e.target.value));
        }

        // Logout button
        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadDebts() {
        try {
            console.log('Loading debts...');
            const response = await debtService.getAll();
            
            if (response.success) {
                this.debts = response.data;
                this.renderDebts();
            } else {
                showNotification('Failed to load debts', 'error');
                this.renderEmptyState();
            }
        } catch (error) {
            console.error('Error loading debts:', error);
            showNotification('Failed to load debts', 'error');
            this.renderEmptyState();
        }
    }

    async loadStatistics() {
        try {
            const response = await debtService.getStatistics();
            
            if (response.success) {
                this.statistics = response.data;
                this.updateSummaryCards();
            } else {
                console.log('Failed to load statistics, using zeros');
                this.updateSummaryCardsToZero();
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.updateSummaryCardsToZero();
        }
    }

    renderEmptyState() {
        const tbody = document.querySelector('table tbody');
        
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No debts found</td></tr>';
        }
        
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

    renderDebts() {
        const tbody = document.querySelector('table tbody');
        
        if (!tbody) return;

        if (this.debts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No debts found</td></tr>';
            return;
        }

        tbody.innerHTML = this.debts.map(debt => {
            const member = debt.member || {};
            const daysOverdue = this.calculateDaysOverdue(debt.dueDate);
            const statusClass = this.getStatusClass(debt.status, daysOverdue);
            
            return `
                <tr>
                    <td>${member.firstName || 'Unknown'} ${member.lastName || ''}</td>
                    <td>${member.studentId || 'N/A'}</td>
                    <td>${formatDate(debt.dueDate)}</td>
                    <td>${formatCurrency(debt.remainingBalance || debt.amount)}</td>
                    <td><span style="color: ${this.getDaysOverdueColor(daysOverdue)}; font-weight:500;">${daysOverdue}</span></td>
                    <td><span style="${statusClass}">${this.getStatusText(debt.status, daysOverdue)}</span></td>
                    <td>
                        <button class="btn" onclick="debtsPage.sendReminder('${debt.id}')">Send Reminder</button>
                        <button class="btn" onclick="debtsPage.recordPayment('${debt.id}')">Record Payment</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    calculateDaysOverdue(dueDate) {
        const due = new Date(dueDate);
        const today = new Date();
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `${Math.abs(diffDays)} days`;
        } else if (diffDays <= 3) {
            return `${diffDays} days`;
        } else {
            return 'Not due';
        }
    }

    getDaysOverdueColor(daysOverdue) {
        if (daysOverdue.includes('days') && !daysOverdue.includes('Not')) {
            const days = parseInt(daysOverdue);
            if (days < 0) return 'var(--red)';
            if (days <= 3) return 'var(--amber)';
        }
        return 'var(--text3)';
    }

    getStatusClass(status, daysOverdue) {
        if (status === 'paid') return 'class="status received"';
        if (status === 'waived') return 'class="status received"';
        
        if (daysOverdue.includes('days') && !daysOverdue.includes('Not')) {
            const days = parseInt(daysOverdue);
            if (days < 0) return 'style="background: rgba(220,38,38,0.12); color: #dc3545; padding: 3px 10px; border-radius: 20px; font-size: 11.5px;"';
            return 'style="background: rgba(245,158,11,0.12); color: #f59e0b; padding: 3px 10px; border-radius: 20px; font-size: 11.5px;"';
        }
        
        return 'class="status received"';
    }

    getStatusText(status, daysOverdue) {
        if (status === 'paid') return 'Paid';
        if (status === 'waived') return 'Waived';
        
        if (daysOverdue.includes('days') && !daysOverdue.includes('Not')) {
            const days = parseInt(daysOverdue);
            if (days < 0) return 'Overdue';
            return 'Due Soon';
        }
        
        return 'Current';
    }

    updateSummaryCards() {
        // Update Total Outstanding
        const totalCard = document.querySelector('.card:nth-child(1) .stat-number');
        if (totalCard) totalCard.textContent = formatCurrency(this.statistics.totalOutstanding || 0);

        // Update Members in Debt
        const membersCard = document.querySelector('.card:nth-child(2) .stat-number');
        if (membersCard) membersCard.textContent = this.statistics.membersInDebt || 0;

        // Update Overdue
        const overdueCard = document.querySelector('.card:nth-child(3) .stat-number');
        if (overdueCard) overdueCard.textContent = this.statistics.overdueCount || 0;

        // Update Recovered
        const recoveredCard = document.querySelector('.card:nth-child(4) .stat-number');
        if (recoveredCard) recoveredCard.textContent = formatCurrency(this.statistics.paidThisMonth || 0);
    }

    async sendReminder(debtId) {
        if (await showConfirm('Are you sure you want to send a reminder for this debt?')) {
            try {
                const response = await debtService.sendReminder(debtId);
                
                if (response.success) {
                    showNotification('Reminder sent successfully!', 'success');
                } else {
                    showNotification('Failed to send reminder', 'error');
                }
            } catch (error) {
                console.error('Error sending reminder:', error);
                showNotification('Failed to send reminder', 'error');
            }
        }
    }

    async recordPayment(debtId) {
        const amount = await showPrompt('Enter payment amount:');
        if (amount === null) return; // User cancelled

        const method = await showPrompt('Enter payment method (cash, mpesa, bank_transfer, cheque, other):', 'cash');
        if (method === null) return;

        try {
            const response = await debtService.markAsPaid(debtId, {
                paymentAmount: parseFloat(amount),
                paymentMethod: method,
                notes: 'Payment recorded by admin'
            });

            if (response.success) {
                showNotification('Payment recorded successfully!', 'success');
                await this.loadDebts();
                await this.loadStatistics();
            } else {
                showNotification('Failed to record payment', 'error');
            }
        } catch (error) {
            console.error('Error recording payment:', error);
            showNotification('Failed to record payment', 'error');
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
let debtsPage;

document.addEventListener('DOMContentLoaded', () => {
    debtsPage = new Debts();
});
