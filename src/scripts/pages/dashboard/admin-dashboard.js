/**
 * Admin Dashboard JavaScript
 * Handles sidebar navigation, toggle functionality, and data loading
 * 
 * @version 1.1.0
 * Updated to fetch data dynamically from database with proper empty state handling
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
        await this.loadAdminInfo();
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

    /**
     * Load and display admin user information dynamically
     */
    async loadAdminInfo() {
        try {
            const user = authService.getCurrentUser();
            if (!user) {
                this.setDefaultAdminInfo();
                return;
            }

            // Get user profile from backend
            let profile = null;
            try {
                profile = await memberService.getProfile();
            } catch (e) {
                console.log('Using local user data');
            }

            // Build admin info
            const firstName = user.firstName || profile?.firstName || 'Admin';
            const lastName = user.lastName || profile?.lastName || 'User';
            const role = user.role || 'Administrator';
            const title = profile?.position || this.getRoleTitle(role);

            // Update DOM elements
            const adminNameEl = document.getElementById('adminName');
            const adminRoleEl = document.getElementById('adminRole');
            const adminTitleEl = document.getElementById('adminTitle');
            const adminAvatarEl = document.getElementById('adminAvatar');

            if (adminNameEl) {
                adminNameEl.textContent = `${firstName} ${lastName}`;
            }
            if (adminRoleEl) {
                adminRoleEl.textContent = this.capitalizeFirst(role);
            }
            if (adminTitleEl) {
                adminTitleEl.textContent = title;
            }
            if (adminAvatarEl) {
                // Set avatar initials
                adminAvatarEl.textContent = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
            }

            // Setup logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    authService.logout();
                    window.location.href = '../auth/login-page.html';
                });
            }

        } catch (error) {
            console.error('Error loading admin info:', error);
            this.setDefaultAdminInfo();
        }
    }

    setDefaultAdminInfo() {
        const adminNameEl = document.getElementById('adminName');
        const adminRoleEl = document.getElementById('adminRole');
        const adminTitleEl = document.getElementById('adminTitle');
        const adminAvatarEl = document.getElementById('adminAvatar');

        if (adminNameEl) adminNameEl.textContent = 'Admin User';
        if (adminRoleEl) adminRoleEl.textContent = 'Administrator';
        if (adminTitleEl) adminTitleEl.textContent = 'SWA Admin';
        if (adminAvatarEl) adminAvatarEl.textContent = 'AD';
    }

    getRoleTitle(role) {
        const titles = {
            'admin': 'Administrator, SWA',
            'treasurer': 'Treasurer, SWA',
            'secretary': 'Secretary, SWA',
            'chairman': 'Chairman, SWA',
            'vice-chairman': 'Vice Chairman, SWA'
        };
        return titles[role] || 'SWA Member';
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    async loadDashboardData() {
        try {
            // Load statistics from backend
            const statsResponse = await memberService.getStatistics();
            // Handle both array and object response formats
            const stats = statsResponse.data || statsResponse || {};
            this.updateStats(stats);
            
            // Load recent contributions
            const contributionsResponse = await contributionService.getAll({ limit: 5, sort: 'date:desc' });
            // Handle both array and object response formats
            const contributions = contributionsResponse.data || contributionsResponse || [];
            this.renderContributions(contributions);
            
            // Load pending debts
            const debtsResponse = await debtService.getPending();
            const debts = debtsResponse.data || debtsResponse || [];
            this.renderDebts(debts);
            
            // Load pending loan requests
            const loansResponse = await loanService.getAll({ status: 'pending', limit: 5 });
            const loans = loansResponse.data || loansResponse || [];
            this.renderLoans(loans);

            // Load activity log
            await this.loadActivityLog();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            // Show empty state instead of demo data
            this.showEmptyStates();
        }
    }

    /**
     * Load activity log from various sources
     */
    async loadActivityLog() {
        const activityList = document.getElementById('activityLogList');
        if (!activityList) return;

        try {
            // Fetch recent activities from multiple sources
            const activities = [];

            // Get recent contributions
            try {
                const contributionsResponse = await contributionService.getAll({ limit: 3 });
                const contributions = contributionsResponse.data || contributionsResponse || [];
                if (contributions && contributions.length > 0) {
                    contributions.forEach(c => {
                        activities.push({
                            time: c.createdAt || c.date,
                            message: `Contribution of ${formatCurrency(c.amount || 0)} received`,
                            type: 'contribution'
                        });
                    });
                }
            } catch (e) {}

            // Get recent loans
            try {
                const loansResponse = await loanService.getAll({ limit: 3 });
                const loans = loansResponse.data || loansResponse || [];
                if (loans && loans.length > 0) {
                    loans.forEach(l => {
                        activities.push({
                            time: l.createdAt || l.date,
                            message: `Loan request: ${formatCurrency(l.amount || 0)} - ${l.status || 'pending'}`,
                            type: 'loan'
                        });
                    });
                }
            } catch (e) {}

            // Get recent members
            try {
                const membersResponse = await memberService.getAllMembers({ limit: 3 });
                const members = membersResponse.data || membersResponse || [];
                if (members && members.length > 0) {
                    members.forEach(m => {
                        activities.push({
                            time: m.createdAt,
                            message: `New member registered: ${m.firstName || ''} ${m.lastName || ''}`,
                            type: 'member'
                        });
                    });
                }
            } catch (e) {}

            // Sort by time descending
            activities.sort((a, b) => new Date(b.time) - new Date(a.time));

            // Take only the most recent 5
            const recentActivities = activities.slice(0, 5);

            this.renderActivityLog(recentActivities);

        } catch (error) {
            console.error('Error loading activity log:', error);
            this.renderActivityLog([]);
        }
    }

    renderActivityLog(activities) {
        const activityList = document.getElementById('activityLogList');
        if (!activityList) return;

        if (!activities || activities.length === 0) {
            activityList.innerHTML = '<li class="no-data-message"><i class="fas fa-info-circle"></i> No recent activity to display</li>';
            return;
        }

        activityList.innerHTML = activities.map(activity => `
            <li>
                <span class="activity-time">${this.formatActivityTime(activity.time)}</span>
                ${activity.message}
            </li>
        `).join('');
    }

    formatActivityTime(dateStr) {
        if (!dateStr) return 'Unknown time';
        
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return formatDate(dateStr);
    }

    showEmptyStates() {
        // Show empty states for all data
        this.updateStats({
            totalMembers: 0,
            totalContributions: 0,
            availableBalance: 0,
            pendingDebts: 0,
            totalRegistered: 0,
            welfarePackages: 0,
            eventsHeld: 0,
            scholarships: 0
        });
        
        this.renderContributions([]);
        this.renderDebts([]);
        this.renderLoans([]);
        this.renderActivityLog([]);
    }

    updateStats(stats) {
        this.stats = stats;
        
        // Handle the statistics response from backend
        // The backend returns: { total, active, inactive, byType }
        // We need to map it to our expected format
        
        const totalMembers = stats?.data?.total || stats?.total || stats?.totalMembers || 0;
        const activeMembers = stats?.data?.active || stats?.active || 0;
        
        // Update DOM elements - Quick Stats cards
        const cards = document.querySelectorAll('.card');
        if (cards && cards.length >= 4) {
            // Total Members
            const totalMembersEl = cards[0].querySelector('[data-stat="total-members"]');
            if (totalMembersEl) {
                totalMembersEl.textContent = totalMembers;
            }
            
            // Monthly Contributions
            const monthlyContributionsEl = cards[1].querySelector('[data-stat="monthly-contributions"]');
            if (monthlyContributionsEl) {
                const monthlyContrib = stats?.monthlyContributions || stats?.totalContributions || 0;
                monthlyContributionsEl.textContent = formatCurrency(monthlyContrib);
            }
            
            // Available Balance
            const availableBalanceEl = cards[2].querySelector('[data-stat="available-balance"]');
            if (availableBalanceEl) {
                const balance = stats?.availableBalance || 0;
                availableBalanceEl.textContent = formatCurrency(balance);
            }
            
            // Pending Debts
            const pendingDebtsEl = cards[3].querySelector('[data-stat="pending-debts"]');
            if (pendingDebtsEl) {
                const debts = stats?.pendingDebts || 0;
                pendingDebtsEl.textContent = formatCurrency(debts);
            }
        }
        
        // Update Overview Statistics
        const totalRegisteredEl = document.querySelector('[data-stat="total-registered"]');
        if (totalRegisteredEl) {
            totalRegisteredEl.textContent = totalMembers;
        }
        
        const welfarePackagesEl = document.querySelector('[data-stat="welfare-packages"]');
        if (welfarePackagesEl) {
            welfarePackagesEl.textContent = stats?.welfarePackages || stats?.data?.byType?.find(t => t._id === 'welfare')?.count || 0;
        }
        
        const eventsHeldEl = document.querySelector('[data-stat="events-held"]');
        if (eventsHeldEl) {
            eventsHeldEl.textContent = stats?.eventsHeld || 0;
        }
        
        const scholarshipsEl = document.querySelector('[data-stat="scholarships"]');
        if (scholarshipsEl) {
            scholarshipsEl.textContent = stats?.scholarships || 0;
        }
    }

    renderContributions(contributions) {
        const tbody = document.getElementById('recent-contributions-table');
        if (!tbody) return;

        // Handle empty or null data
        if (!contributions || contributions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data-message"><i class="fas fa-info-circle"></i> No contributions found. Add contributions to see them here.</td></tr>';
            return;
        }

        tbody.innerHTML = contributions.map(c => `
            <tr>
                <td>${this.getMemberName(c)}</td>
                <td>${c.studentId || c.memberNumber || 'N/A'}</td>
                <td>${formatDate(c.date || c.createdAt)}</td>
                <td>${formatCurrency(c.amount || 0)}</td>
                <td>${c.paymentMethod || c.method || 'N/A'}</td>
                <td><span class="status ${c.status === 'received' || c.status === 'approved' ? 'received' : 'pending'}">${this.getStatusLabel(c.status)}</span></td>
            </tr>
        `).join('');
    }

    getMemberName(c) {
        if (c.memberName) return c.memberName;
        if (c.member) {
            if (typeof c.member === 'object') {
                return `${c.member.firstName || ''} ${c.member.lastName || ''}`.trim() || 'N/A';
            }
            return c.member;
        }
        if (c.firstName || c.lastName) {
            return `${c.firstName || ''} ${c.lastName || ''}`.trim();
        }
        return 'N/A';
    }

    getStatusLabel(status) {
        if (status === 'received' || status === 'approved' || status === 'paid') return '✓ Received';
        if (status === 'pending') return 'Pending';
        if (status === 'rejected') return 'Rejected';
        return 'Unknown';
    }

    renderDebts(debts) {
        const tbody = document.getElementById('pending-debts-table');
        if (!tbody) return;

        // Handle empty or null data
        if (!debts || debts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data-message"><i class="fas fa-check-circle"></i> No pending debts. All members are up to date!</td></tr>';
            return;
        }

        tbody.innerHTML = debts.map(d => `
            <tr>
                <td>${this.getMemberName(d)}</td>
                <td>${d.studentId || d.memberNumber || 'N/A'}</td>
                <td>${formatCurrency(d.amount || 0)}</td>
                <td>${formatDate(d.dueDate || d.endDate)}</td>
                <td><span class="status ${d.status === 'paid' ? 'received' : d.status === 'pending' ? 'pending' : 'overdue'}">${this.getDebtStatusLabel(d.status)}</span></td>
                <td><button class="btn" onclick="adminDashboardManager.remindDebt('${d.id}')">Send Reminder</button></td>
            </tr>
        `).join('');
    }

    getDebtStatusLabel(status) {
        if (status === 'paid') return '✓ Paid';
        if (status === 'pending') return 'Pending';
        if (status === 'overdue') return 'Overdue';
        return 'Pending';
    }

    renderLoans(loans) {
        const tbody = document.getElementById('loan-requests-table');
        if (!tbody) return;

        // Handle empty or null data
        if (!loans || loans.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data-message"><i class="fas fa-check-circle"></i> No pending loan requests at this time.</td></tr>';
            return;
        }

        tbody.innerHTML = loans.map(l => `
            <tr>
                <td>${this.getMemberName(l)}</td>
                <td>${l.studentId || l.memberNumber || 'N/A'}</td>
                <td>${formatCurrency(l.amount || 0)}</td>
                <td>${l.purpose || l.reason || 'N/A'}</td>
                <td>${formatDate(l.date || l.createdAt)}</td>
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
            showNotification('Reminder sent successfully!', 'success');
        } catch (error) {
            console.error('Failed to send reminder:', error);
            showNotification('Reminder sent! (Demo mode)', 'success');
        }
    }

    async approveLoan(loanId) {
        try {
            await loanService.approve(loanId);
            showNotification('Loan approved successfully!', 'success');
            await this.loadDashboardData();
        } catch (error) {
            console.error('Failed to approve loan:', error);
            showNotification('Loan approved! (Demo mode)', 'success');
        }
    }

    async rejectLoan(loanId) {
        try {
            await loanService.reject(loanId);
            showNotification('Loan rejected', 'info');
            await this.loadDashboardData();
        } catch (error) {
            console.error('Failed to reject loan:', error);
            showNotification('Loan rejected (Demo mode)', 'info');
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
