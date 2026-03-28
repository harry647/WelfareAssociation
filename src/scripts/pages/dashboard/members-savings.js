/**
 * Members Savings Script
 * Handles members savings functionality with dynamic data from database
 * 
 * @version 1.1.0
 * Updated to fetch data from database
 */

// Import services
import { authService, savingsService } from '../../../services/index.js';

// Import utility functions
import { showNotification, formatDate, formatCurrency } from '../../../utils/utility-functions.js';

class MembersSavings {
    constructor() {
        this.savings = [];
        this.stats = {
            totalMembers: 0,
            totalSavings: 0,
            monthDeposits: 0,
            monthWithdrawals: 0
        };
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        await this.loadSavings();
    }

    /**
     * Check authentication
     */
    async checkAuth() {
        if (!authService.isAuthenticated()) {
            window.location.href = '../../../auth/login-page.html?redirect=../admin/members-savings.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        const allowedRoles = ['admin', 'secretary', 'treasurer'];
        if (!user || !allowedRoles.includes(user.role)) {
            showNotification('Access denied. You do not have permission to view this page.', 'error');
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 2000);
            return false;
        }
        
        // Update admin header with user data
        this.updateAdminHeader(user);
        
        return true;
    }

    /**
     * Update admin header with user info
     */
    updateAdminHeader(user) {
        const avatarEl = document.getElementById('adminAvatar');
        const nameEl = document.getElementById('adminName');
        const roleEl = document.getElementById('adminRole');
        const titleEl = document.getElementById('adminTitle');
        
        if (avatarEl && user.firstName) {
            avatarEl.textContent = user.firstName.charAt(0) + (user.lastName ? user.lastName.charAt(0) : '');
        }
        if (nameEl) {
            nameEl.textContent = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.email || 'Admin');
        }
        if (roleEl) {
            roleEl.textContent = user.role || 'Administrator';
        }
        if (titleEl) {
            titleEl.textContent = user.role === 'admin' ? 'Administrator' : (user.role === 'treasurer' ? 'Treasurer' : 'Secretary');
        }
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

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    /**
     * Load savings from database
     */
    async loadSavings() {
        const loadingEl = document.getElementById('loading-indicator');
        const errorEl = document.getElementById('error-message');

        try {
            // Show loading state
            if (loadingEl) loadingEl.style.display = 'block';
            if (errorEl) errorEl.style.display = 'none';

            // Fetch statistics
            const statsResponse = await savingsService.getStatistics();
            const stats = statsResponse.data || statsResponse || {};
            
            // Update stats
            this.stats.totalMembers = stats.membersWithSavings || 0;
            this.stats.totalSavings = stats.totalSavings || 0;
            this.stats.monthDeposits = stats.monthDeposits || 0;
            this.stats.monthWithdrawals = stats.monthWithdrawals || 0;

            // Update stats display
            this.updateStatsDisplay();

            // Fetch savings goals
            const goalsResponse = await savingsService.getAllGoals({ limit: 100 });
            const goals = goalsResponse.data || goalsResponse || [];
            
            // Render individual savings accounts
            this.renderIndividualSavings(goals);

            // Fetch recent transactions
            const transactionsResponse = await savingsService.getTransactions(20);
            const transactions = transactionsResponse.data || transactionsResponse || [];
            
            // Render recent transactions
            this.renderRecentTransactions(transactions);

            // Render savings goals
            this.renderSavingsGoals(goals);

            // Hide loading
            if (loadingEl) loadingEl.style.display = 'none';

        } catch (error) {
            console.error('Error loading savings:', error);
            
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) {
                errorEl.textContent = 'Failed to load savings data. Please try again later.';
                errorEl.style.display = 'block';
            }
            
            this.showEmptyTables();
        }
    }

    /**
     * Update statistics display
     */
    updateStatsDisplay() {
        // Total Members
        const totalMembersEl = document.getElementById('totalMembersCount');
        if (totalMembersEl) totalMembersEl.textContent = this.stats.totalMembers;

        // Total Savings
        const totalSavingsEl = document.getElementById('totalSavingsAmount');
        if (totalSavingsEl) totalSavingsEl.textContent = `Ksh ${formatCurrency(this.stats.totalSavings)}`;

        // Month Deposits
        const depositsEl = document.getElementById('monthDeposits');
        if (depositsEl) depositsEl.textContent = `Ksh ${formatCurrency(this.stats.monthDeposits)}`;

        // Month Withdrawals
        const withdrawalsEl = document.getElementById('monthWithdrawals');
        if (withdrawalsEl) withdrawalsEl.textContent = `Ksh ${formatCurrency(this.stats.monthWithdrawals)}`;

        // Calculate growth rate (example: compare with last month)
        const growthRate = this.stats.totalSavings > 0 ? 
            ((this.stats.monthDeposits - this.stats.monthWithdrawals) / this.stats.totalSavings * 100).toFixed(1) : 0;
        
        const growthEl = document.getElementById('growthRate');
        if (growthEl) {
            growthEl.textContent = `${growthRate >= 0 ? '+' : ''}${growthRate}%`;
        }

        // Additional stats - Interest Rate (hardcoded 5% for now, could be dynamic)
        const interestRateEl = document.getElementById('interestRate');
        if (interestRateEl) interestRateEl.textContent = '5%';

        // Average savings per member
        const avgSavingsEl = document.getElementById('avgSavings');
        if (avgSavingsEl && this.stats.totalMembers > 0) {
            const avg = this.stats.totalSavings / this.stats.totalMembers;
            avgSavingsEl.textContent = `Ksh ${formatCurrency(avg)}`;
        } else if (avgSavingsEl) {
            avgSavingsEl.textContent = '--';
        }

        // Top saver (placeholder - would need separate query)
        const topSaverEl = document.getElementById('topSaver');
        if (topSaverEl) topSaverEl.textContent = '--';
    }

    /**
     * Render individual savings accounts table
     */
    renderIndividualSavings(goals) {
        const tableBody = document.getElementById('individualSavingsTable');
        if (!tableBody) return;

        if (!goals || goals.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data-message">
                        <i class="fas fa-piggy-bank"></i>
                        No savings accounts found.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = goals.map(goal => {
            const member = goal.member || {};
            const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown Member';
            const memberNumber = member.memberNumber || 'N/A';
            
            const currentAmount = parseFloat(goal.currentAmount || 0);
            const targetAmount = parseFloat(goal.targetAmount || 0);
            const deposits = currentAmount; // Simplified - in reality would calculate from transactions
            const withdrawals = 0; // Simplified
            const interest = 0; // Simplified
            
            const openingDate = goal.createdAt ? formatDate(goal.createdAt) : 'N/A';
            
            return `
                <tr data-goal-id="${goal.id}">
                    <td>${memberName}</td>
                    <td>${memberNumber}</td>
                    <td>${openingDate}</td>
                    <td>Ksh ${formatCurrency(deposits)}</td>
                    <td>Ksh ${formatCurrency(withdrawals)}</td>
                    <td>Ksh ${formatCurrency(interest)}</td>
                    <td><strong>Ksh ${formatCurrency(currentAmount)}</strong></td>
                    <td><button class="btn" onclick="viewSavingsGoal('${goal.id}')">View</button></td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Render recent transactions table
     */
    renderRecentTransactions(transactions) {
        const tableBody = document.getElementById('recentTransactionsTable');
        if (!tableBody) return;

        if (!transactions || transactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data-message">
                        <i class="fas fa-exchange-alt"></i>
                        No recent transactions.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = transactions.slice(0, 10).map(t => {
            const date = t.date ? formatDate(t.date) : 'N/A';
            const memberName = t.memberName || 'Unknown';
            const amount = parseFloat(t.amount || 0);
            const isDeposit = t.type === 'deposit';
            
            return `
                <tr>
                    <td>${date}</td>
                    <td>${memberName}</td>
                    <td>${isDeposit ? 'Deposit' : 'Withdrawal'}</td>
                    <td class="${isDeposit ? 'positive' : 'negative'}">
                        ${isDeposit ? '+' : '-'}Ksh ${formatCurrency(amount)}
                    </td>
                    <td>Ksh ${formatCurrency(0)}</td>
                    <td>${t.recordedBy || 'Admin'}</td>
                    <td><span class="status received">✓ Complete</span></td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Render savings goals table
     */
    renderSavingsGoals(goals) {
        const tableBody = document.getElementById('savingsGoalsTable');
        if (!tableBody) return;

        const activeGoals = goals.filter(g => g.status === 'active');

        if (!activeGoals || activeGoals.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data-message">
                        <i class="fas fa-bullseye"></i>
                        No active savings goals.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = activeGoals.map(goal => {
            const member = goal.member || {};
            const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown Member';
            
            const currentAmount = parseFloat(goal.currentAmount || 0);
            const targetAmount = parseFloat(goal.targetAmount || 0);
            const progress = targetAmount > 0 ? Math.min((currentAmount / targetAmount * 100), 100) : 0;
            
            const targetDate = goal.targetDate ? formatDate(goal.targetDate) : 'N/A';
            
            return `
                <tr>
                    <td>${memberName}</td>
                    <td>${goal.name || 'Savings Goal'}</td>
                    <td>Ksh ${formatCurrency(targetAmount)}</td>
                    <td>Ksh ${formatCurrency(currentAmount)}</td>
                    <td>
                        <div style="background: var(--light-gray); border-radius: 10px; height: 20px; width: 100px; overflow: hidden;">
                            <div style="background: var(--primary); height: 100%; width: ${progress}%;"></div>
                        </div>
                        <small>${progress.toFixed(0)}%</small>
                    </td>
                    <td>${targetDate}</td>
                    <td><span class="status pending">In Progress</span></td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Show empty tables
     */
    showEmptyTables() {
        const tables = ['individualSavingsTable', 'recentTransactionsTable', 'savingsGoalsTable'];
        
        tables.forEach(tableId => {
            const tableBody = document.getElementById(tableId);
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="no-data-message">
                            <i class="fas fa-exclamation-circle"></i>
                            Unable to load data. Please ensure the server is running.
                        </td>
                    </tr>
                `;
            }
        });
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            authService.logout();
            window.location.href = '../../index.html';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.membersSavings = new MembersSavings();
});

// Global function to view savings goal
function viewSavingsGoal(goalId) {
    window.location.href = `savings-goal.html?id=${goalId}`;
}
