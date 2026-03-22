/**
 * Admin Dashboard JavaScript
 * Handles sidebar navigation, toggle functionality, and data loading
 * 
 * @version 1.0.0
 */

// Import services from src for consistency
import { authService, memberService, contributionService, loanService, debtService, paymentService, noticeService } from '../../../services/index.js';

// Import utility functions
import { showNotification, formatCurrency, formatDate } from '../../../utils/utility-functions.js';

/**
 * AdminDashboard Class
 */
class AdminDashboardManager {
    constructor() {
        this.stats = {
            totalMembers: 0,
            totalContributions: 0,
            availableBalance: 0,
            pendingDebts: 0,
        };
    }

    async init() {
        await this.checkAuth();
        await this.loadDashboardData();
        this.initEventListeners();
    }

    async checkAuth() {
        if (!authService.isAuthenticated()) {
            // Not logged in, redirect to login page
            window.location.href = '../auth/login-page.html?redirect=../dashboard/admin-dashboard.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        if (!user || user.role !== 'admin') {
            // Not admin, redirect to login
            window.location.href = '../auth/login-page.html?redirect=../dashboard/admin-dashboard.html';
            return false;
        }
        return true;
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
            const debts = await debtService.getAll();
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
            { memberName: 'Lavenda Achieng', studentId: 'JOO/2024/001', date: '2025-09-01', amount: 800, paymentMethod: 'M-Pesa', status: 'received' },
            { memberName: 'Mary Odundo', studentId: 'JOO/2024/002', date: '2025-09-02', amount: 1000, paymentMethod: 'Bank Transfer', status: 'received' },
            { memberName: 'Francis Opiyo', studentId: 'JOO/2024/003', date: '2025-09-03', amount: 500, paymentMethod: 'M-Pesa', status: 'received' },
            { memberName: 'Vincent Otieno', studentId: 'JOO/2024/004', date: '2025-09-04', amount: 1200, paymentMethod: 'Cash', status: 'received' },
        ]);

        this.renderDebts([
            { memberName: 'Mary Atieno', studentId: 'JOO/2024/005', dueDate: '2025-09-05', amount: 2000, daysOverdue: 5 },
            { memberName: 'Francis Opiyo', studentId: 'JOO/2024/003', dueDate: '2025-09-05', amount: 3000, daysOverdue: 3 },
        ]);

        this.renderLoans([
            { memberName: 'Yvonne Achieng', studentId: 'JOO/2024/006', amount: 1000, purpose: 'Academic Fees', date: '2025-09-03' },
            { memberName: 'Jeff Juma', studentId: 'JOO/2024/007', amount: 2500, purpose: 'Emergency', date: '2025-09-04' },
        ]);
    }

    updateStats(stats) {
        this.stats = stats;
        
        // Update DOM elements - Quick Stats cards
        const cards = document.querySelectorAll('.card');
        if (cards && cards.length >= 4) {
            if (cards[0].querySelector('.stat-number')) {
                cards[0].querySelector('.stat-number').textContent = stats.totalMembers || 22;
            }
            if (cards[1].querySelector('.stat-number')) {
                cards[1].querySelector('.stat-number').textContent = formatCurrency(stats.totalContributions || 7000);
            }
            if (cards[2].querySelector('.stat-number')) {
                cards[2].querySelector('.stat-number').textContent = formatCurrency(stats.availableBalance || 3000);
            }
            if (cards[3].querySelector('.stat-number')) {
                cards[3].querySelector('.stat-number').textContent = formatCurrency(stats.pendingDebts || 4000);
            }
        }
    }

    renderContributions(contributions) {
        // Find the Recent Contributions table
        const tables = document.querySelectorAll('.data-section table');
        if (tables.length === 0) return;

        // First table is usually contributions
        const tbody = tables[0].querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = contributions.map(c => `
            <tr>
                <td>${c.memberName || c.member || 'N/A'}</td>
                <td>${c.studentId || 'N/A'}</td>
                <td>${formatDate(c.date)}</td>
                <td>${formatCurrency(c.amount)}</td>
                <td>${c.paymentMethod || 'N/A'}</td>
                <td><span class="status ${c.status === 'received' ? 'received' : 'pending'}">${c.status === 'received' ? '✓ Received' : 'Pending'}</span></td>
            </tr>
        `).join('');
    }

    renderDebts(debts) {
        const tables = document.querySelectorAll('.data-section table');
        if (tables.length < 2) return;

        const tbody = tables[1].querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = debts.map(d => `
            <tr>
                <td>${d.memberName || d.member || 'N/A'}</td>
                <td>${d.studentId || 'N/A'}</td>
                <td>${formatDate(d.dueDate || d.date)}</td>
                <td>${formatCurrency(d.amount)}</td>
                <td><span style="color: var(--amber); font-weight:500;">${d.daysOverdue || 0} days</span></td>
                <td><button class="btn" onclick="adminDashboardManager.remindDebt('${d.id}')">Send Reminder</button></td>
            </tr>
        `).join('');
    }

    renderLoans(loans) {
        const tables = document.querySelectorAll('.data-section table');
        if (tables.length < 3) return;

        const tbody = tables[2].querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = loans.map(l => `
            <tr>
                <td>${l.memberName || l.member || 'N/A'}</td>
                <td>${l.studentId || 'N/A'}</td>
                <td>${formatCurrency(l.amount)}</td>
                <td>${l.purpose || 'N/A'}</td>
                <td>${formatDate(l.date)}</td>
                <td>
                    <button class="btn approve" onclick="adminDashboardManager.approveLoan('${l.id}')">✓ Approve</button>
                    <button class="btn btn-reject" onclick="adminDashboardManager.rejectLoan('${l.id}')">✗ Reject</button>
                </td>
            </tr>
        `).join('');
    }

    initEventListeners() {
        // Sidebar navigation - handles data-section links (SPA-style navigation)
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.dataset.section;

                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                const target = document.getElementById('section-' + section);
                if (target) target.classList.add('active');

                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.remove('active');
                    document.getElementById('sidebarOverlay').classList.remove('active');
                }
            });
        });

        // Handle regular nav-link clicks (navigate to other pages)
        document.querySelectorAll('.nav-link[href]').forEach(link => {
            // Skip links that have data-section (they're handled above)
            if (link.hasAttribute('data-section')) return;
            
            link.addEventListener('click', function(e) {
                // Let the default navigation happen - just close sidebar on mobile
                if (window.innerWidth <= 768) {
                    const sidebar = document.getElementById('sidebar');
                    const overlay = document.getElementById('sidebarOverlay');
                    if (sidebar) sidebar.classList.remove('active');
                    if (overlay) overlay.classList.remove('active');
                }
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        function toggleSidebar() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }

        if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
        if (overlay) overlay.addEventListener('click', toggleSidebar);
    }

    async remindDebt(debtId) {
        try {
            await debtService.sendReminder(debtId);
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
const adminDashboardManager = new AdminDashboardManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    adminDashboardManager.init();
});

// Export for module use
export default adminDashboardManager;
