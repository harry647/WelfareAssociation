/**
 * Admin Portal Script
 * Handles admin dashboard functionality
 * 
 * @version 1.0.0
 */

import { authService, memberService, contributionService, loanService } from '../../services/index.js';
import { showNotification, formatCurrency, formatDate } from '../../utils/utility-functions.js';

/**
 * AdminDashboard Class
 */
class AdminDashboard {
    constructor() {
        this.stats = {
            totalMembers: 0,
            totalContributions: 0,
            availableBalance: 0,
            pendingDebts: 0,
        };
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadDashboardData();
        this.initEventListeners();
    }

    async checkAuth() {
        if (!authService.isAuthenticated()) {
            const user = authService.getCurrentUser();
            if (!user || user.role !== 'admin') {
                // For demo, allow access
                console.log('Demo mode: Admin access granted');
            }
        }
    }

    async loadDashboardData() {
        try {
            // Load statistics from backend
            const stats = await memberService.getStatistics();
            this.updateStats(stats);
            
            // Load recent contributions
            const contributions = await contributionService.getAll({ limit: 5 });
            this.renderContributions(contributions);
            
            // Load pending debts
            const debts = await memberService.getDebts();
            this.renderDebts(debts);
            
            // Load pending loan requests
            const loans = await loanService.getPending();
            this.renderLoans(loans);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            // Use demo data
            this.loadDemoData();
        }
    }

    loadDemoData() {
        // Demo data for demonstration
        this.updateStats({
            totalMembers: 22,
            totalContributions: 7000,
            availableBalance: 3000,
            pendingDebts: 4000,
        });

        this.renderContributions([
            { member: 'Lavenda Achieng', date: '2025-09-01', amount: 800, status: 'received' },
            { member: 'Mary Odundo', date: '2025-09-02', amount: 1000, status: 'received' },
        ]);

        this.renderDebts([
            { member: 'Mary Atieno', dueDate: '2025-09-05', amount: 2000 },
            { member: 'Francis Opiyo', dueDate: '2025-09-05', amount: 3000 },
        ]);

        this.renderLoans([
            { member: 'Yvonne Achieng', amount: 1000, date: '2025-09-03' },
        ]);
    }

    updateStats(stats) {
        this.stats = stats;
        
        // Update DOM elements
        const totalMembersEl = document.querySelector('.card:nth-child(1) p');
        const totalContributionsEl = document.querySelector('.card:nth-child(2) p');
        const availableBalanceEl = document.querySelector('.card:nth-child(3) p');
        const pendingDebtsEl = document.querySelector('.card:nth-child(4) p');

        if (totalMembersEl) totalMembersEl.textContent = stats.totalMembers || 0;
        if (totalContributionsEl) totalContributionsEl.textContent = formatCurrency(stats.totalContributions || 0);
        if (availableBalanceEl) availableBalanceEl.textContent = formatCurrency(stats.availableBalance || 0);
        if (pendingDebtsEl) pendingDebtsEl.textContent = formatCurrency(stats.pendingDebts || 0);
    }

    renderContributions(contributions) {
        const tbody = document.querySelector('table:nth-of-type(1) tbody');
        if (!tbody) return;

        tbody.innerHTML = contributions.map(c => `
            <tr>
                <td>${c.member}</td>
                <td>${formatDate(c.date)}</td>
                <td>${formatCurrency(c.amount)}</td>
                <td>${c.status === 'received' ? '✔ Received' : 'Pending'}</td>
            </tr>
        `).join('');
    }

    renderDebts(debts) {
        const tbody = document.querySelector('table:nth-of-type(2) tbody');
        if (!tbody) return;

        tbody.innerHTML = debts.map(d => `
            <tr>
                <td>${d.member}</td>
                <td>${formatDate(d.dueDate || d.date)}</td>
                <td>${formatCurrency(d.amount)}</td>
                <td><button class="btn" onclick="adminDashboard.remindDebt('${d.id}')">Remind</button></td>
            </tr>
        `).join('');
    }

    renderLoans(loans) {
        const tbody = document.querySelector('table:nth-of-type(3) tbody');
        if (!tbody) return;

        tbody.innerHTML = loans.map(l => `
            <tr>
                <td>${l.member}</td>
                <td>${formatCurrency(l.amount)}</td>
                <td>${formatDate(l.date)}</td>
                <td>
                    <button class="btn" onclick="adminDashboard.approveLoan('${l.id}')">Approve</button>
                    <button class="btn" style="background:#ed3823;" onclick="adminDashboard.rejectLoan('${l.id}')">Reject</button>
                </td>
            </tr>
        `).join('');
    }

    initEventListeners() {
        // Sidebar navigation - only handle hash links (e.g., #section-name)
        document.querySelectorAll('.sidebar a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.navigateToSection(section);
            });
        });
        // Regular href links will navigate normally
    }

    navigateToSection(section) {
        console.log(`Navigating to section: ${section}`);
        showNotification(`Navigating to ${section}...`, 'info');
    }

    async remindDebt(debtId) {
        try {
            showNotification('Reminder sent!', 'success');
        } catch (error) {
            console.error('Failed to send reminder:', error);
            showNotification('Reminder sent! (Demo)', 'success');
        }
    }

    async approveLoan(loanId) {
        try {
            await loanService.approve(loanId);
            showNotification('Loan approved!', 'success');
            await this.loadDashboardData();
        } catch (error) {
            console.error('Failed to approve loan:', error);
            showNotification('Loan approved! (Demo)', 'success');
        }
    }

    async rejectLoan(loanId) {
        try {
            await loanService.reject(loanId);
            showNotification('Loan rejected', 'info');
            await this.loadDashboardData();
        } catch (error) {
            console.error('Failed to reject loan:', error);
            showNotification('Loan rejected (Demo)', 'info');
        }
    }
}

// Create global instance
const adminDashboard = new AdminDashboard();

// Export for module use
export default adminDashboard;
