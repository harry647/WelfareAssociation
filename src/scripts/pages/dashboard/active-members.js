/**
 * Active Members Script
 * Handles active members page functionality with dynamic data from database
 * 
 * @version 1.1.0
 * Updated to fetch data from database
 */

// Import services
import { authService, memberService, contributionService } from '../../../services/index.js';

// Import utility functions
import { showNotification, formatDate, formatCurrency } from '../../../utils/utility-functions.js';

class ActiveMembers {
    constructor() {
        this.members = [];
        this.stats = {
            totalActive: 0,
            thisMonth: 0,
            activityRate: 0,
            fullyPaid: 0
        };
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        await this.loadActiveMembers();
    }

    /**
     * Check authentication
     */
    async checkAuth() {
        if (!authService.isAuthenticated()) {
            window.location.href = '../../pages/auth/login-page.html?redirect=../../pages/dashboard/active-members.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        const allowedRoles = ['admin', 'secretary', 'treasurer', 'chairman'];
        if (!user || !allowedRoles.includes(user.role)) {
            showNotification('Access denied. You do not have permission to view this page.', 'error');
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 2000);
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

    /**
     * Load active members from database
     */
    async loadActiveMembers() {
        const loadingEl = document.getElementById('loading-indicator');
        const errorEl = document.getElementById('error-message');

        try {
            // Show loading state
            if (loadingEl) loadingEl.style.display = 'block';
            if (errorEl) errorEl.style.display = 'none';

            // Fetch all members and filter for active ones
            const response = await memberService.getAllMembers({ limit: 100 });
            const allMembers = response.data || response || [];

            // Filter for active members
            this.members = allMembers.filter(m => m.membershipStatus === 'active');

            // Get contributions for each member to calculate totals
            await this.loadMemberContributions();

            // Calculate statistics
            this.calculateStats();

            // Update stats display
            this.updateStatsDisplay();

            // Render members table
            this.renderMembers();

            // Hide loading
            if (loadingEl) loadingEl.style.display = 'none';

        } catch (error) {
            console.error('Error loading active members:', error);
            
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) {
                errorEl.textContent = 'Failed to load active members. Please try again later.';
                errorEl.style.display = 'block';
            }
            
            this.showEmptyTable();
        }
    }

    /**
     * Load contributions for each member to get total contributed
     */
    async loadMemberContributions() {
        // For each active member, get their contributions
        for (let member of this.members) {
            try {
                const contribResponse = await contributionService.getAll({ memberId: member.id, limit: 1, sort: 'date:desc' });
                const contributions = contribResponse.data || contribResponse || [];
                
                // Get the last payment date
                if (contributions.length > 0) {
                    member.lastPaymentDate = contributions[0].createdAt || contributions[0].date;
                    member.lastPaymentAmount = contributions[0].amount;
                }

                // Calculate total contributed
                let totalContributed = 0;
                const allContribs = await contributionService.getAll({ memberId: member.id, limit: 100 });
                const allContribsData = allContribs.data || allContribs || [];
                totalContributed = allContribsData.reduce((sum, c) => sum + (c.amount || 0), 0);
                member.totalContributed = totalContributed;

            } catch (error) {
                console.error(`Error loading contributions for member ${member.id}:`, error);
                member.totalContributed = member.totalContributions || 0;
            }
        }
    }

    /**
     * Calculate statistics
     */
    calculateStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Total active members
        this.stats.totalActive = this.members.length;

        // This month payments (members who contributed this month)
        this.stats.thisMonth = this.members.filter(m => {
            if (!m.lastPaymentDate) return false;
            const paymentDate = new Date(m.lastPaymentDate);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        }).length;

        // Activity rate (percentage of members with recent payments)
        const recentDate = new Date();
        recentDate.setMonth(recentDate.getMonth() - 1); // Last month
        const activeMembers = this.members.filter(m => {
            if (!m.lastPaymentDate) return false;
            return new Date(m.lastPaymentDate) >= recentDate;
        }).length;
        this.stats.activityRate = this.stats.totalActive > 0 
            ? Math.round((activeMembers / this.stats.totalActive) * 100) 
            : 0;

        // Fully paid (based on contributions > 0)
        this.stats.fullyPaid = this.members.filter(m => (m.totalContributed || 0) > 0).length;
    }

    /**
     * Update statistics display
     */
    updateStatsDisplay() {
        // Total Active
        const totalEl = document.getElementById('total-active');
        if (totalEl) totalEl.textContent = this.stats.totalActive;

        // This Month
        const monthEl = document.getElementById('this-month-paid');
        if (monthEl) monthEl.textContent = this.stats.thisMonth;

        // Activity Rate
        const rateEl = document.getElementById('activity-rate');
        if (rateEl) rateEl.textContent = `${this.stats.activityRate}%`;

        // Fully Paid
        const paidEl = document.getElementById('fully-paid');
        if (paidEl) paidEl.textContent = this.stats.fullyPaid;
    }

    /**
     * Render members table
     */
    renderMembers() {
        const tableBody = document.getElementById('active-members-table');
        if (!tableBody) return;

        if (!this.members || this.members.length === 0) {
            this.showEmptyTable();
            return;
        }

        tableBody.innerHTML = this.members.map((member, index) => {
            const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
            const memberNumber = member.memberNumber || `ACT/${String(index + 1).padStart(3, '0')}`;
            const email = member.email || 'N/A';
            
            // Institution details
            const institution = member.institution || {};
            const studentId = institution.studentId || member.studentId || 'N/A';
            
            // Payment info
            const lastPaymentDate = member.lastPaymentDate 
                ? formatDate(member.lastPaymentDate) 
                : 'N/A';
            const totalContributed = member.totalContributed || member.totalContributions || 0;
            
            // Status calculation
            const now = new Date();
            const lastPayment = member.lastPaymentDate ? new Date(member.lastPaymentDate) : null;
            const daysSincePayment = lastPayment ? Math.floor((now - lastPayment) / (1000 * 60 * 60 * 24)) : null;
            
            let statusHtml;
            if (!lastPayment || daysSincePayment === null) {
                statusHtml = '<span style="background: rgba(107,114,128,0.12); color: #6b7280; padding: 3px 10px; border-radius: 20px; font-size: 11.5px;">No Payments</span>';
            } else if (daysSincePayment <= 30) {
                statusHtml = '<span class="status received">Active</span>';
            } else if (daysSincePayment <= 60) {
                statusHtml = '<span style="background: rgba(245,158,11,0.12); color: #f59e0b; padding: 3px 10px; border-radius: 20px; font-size: 11.5px;">Due Soon</span>';
            } else {
                statusHtml = '<span style="background: rgba(239,68,68,0.12); color: #ef4444; padding: 3px 10px; border-radius: 20px; font-size: 11.5px;">Inactive</span>';
            }

            return `
                <tr data-member-id="${member.id}">
                    <td>${memberNumber}</td>
                    <td>${fullName}</td>
                    <td>${studentId}</td>
                    <td>${email}</td>
                    <td>${lastPaymentDate}</td>
                    <td>Ksh ${formatCurrency(totalContributed)}</td>
                    <td>${statusHtml}</td>
                    <td>
                        <button class="btn">View</button>
                    </td>
                </tr>
            `;
        }).join('');

        // Re-attach click handlers to buttons
        this.attachViewButtonHandlers();
    }

    /**
     * Attach view button handlers
     */
    attachViewButtonHandlers() {
        document.querySelectorAll('#active-members-table .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const memberId = row?.dataset?.memberId;
                if (memberId) {
                    this.viewMember(memberId);
                }
            });
        });
    }

    /**
     * Show empty table state
     */
    showEmptyTable() {
        const tableBody = document.getElementById('active-members-table');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data-message">
                    <i class="fas fa-user-check"></i>
                    No active members found. Members with active membership status will appear here.
                </td>
            </tr>
        `;
    }

    viewMember(memberId) {
        window.location.href = `member-details.html?memberId=${memberId}`;
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
    window.activeMembers = new ActiveMembers();
});
