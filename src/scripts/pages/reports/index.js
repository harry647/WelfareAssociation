/**
 * Reports Index Page Script
 * Handles reports dashboard functionality with dynamic data loading
 * 
 * @version 1.0.0
 */

import { reportService } from '../../../services/index.js';

// Import utility functions
import { formatCurrency, formatDate } from '../../../utils/utility-functions.js';

class ReportsDashboard {
    constructor() {
        this.statCards = document.querySelectorAll('.stat-card');
        this.reportCards = document.querySelectorAll('.report-card');
        
        // DOM elements for dynamic data
        this.totalMembersEl = document.getElementById('totalMembers');
        this.totalContributionsEl = document.getElementById('totalContributions');
        this.activeLoansEl = document.getElementById('activeLoans');
        this.loansRepaidEl = document.getElementById('loansRepaid');
        this.activityListEl = document.getElementById('activityList');
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadReportData();
    }

    bindEvents() {
        // Logout button
        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Report card click handlers
        this.reportCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleReportClick(card);
            });
        });

        // Add hover effects
        this.statCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('hovered');
            });
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hovered');
            });
        });
    }

    handleReportClick(card) {
        const title = card.querySelector('h3')?.textContent || 'this report';
        const href = card.getAttribute('href');

        if (href && href !== '#') {
            window.location.href = href;
        } else {
            alert(`Report: "${title}"\n\nThis report is currently under development.`);
        }
    }

    async loadReportData() {
        try {
            // Show loading state
            this.showLoading();

            // Fetch all report data in parallel
            const [membershipData, contributionData, loanData] = await Promise.allSettled([
                reportService.getMembershipReport(),
                reportService.getContributionReport(),
                reportService.getLoanReport()
            ]);

            // Process and display data
            this.processMembershipData(membershipData);
            this.processContributionData(contributionData);
            this.processLoanData(loanData);

            // Load recent activity
            this.loadRecentActivity();

        } catch (error) {
            console.error('Error loading report data:', error);
            this.showErrorState();
        }
    }

    processMembershipData(result) {
        if (result.status === 'fulfilled' && result.value) {
            const data = result.value.data || result.value;
            const total = data.summary?.total || data.total || 0;
            this.updateElement(this.totalMembersEl, total, 'No members found');
        } else {
            this.updateElement(this.totalMembersEl, 0, 'No members found');
        }
    }

    processContributionData(result) {
        if (result.status === 'fulfilled' && result.value) {
            const data = result.value.data || result.value;
            const total = data.summary?.totalAmount || data.totalAmount || data.total || 0;
            this.updateElement(this.totalContributionsEl, formatCurrency(total), 'No contributions yet');
        } else {
            this.updateElement(this.totalContributionsEl, 0, 'No contributions yet');
        }
    }

    processLoanData(result) {
        if (result.status === 'fulfilled' && result.value) {
            const data = result.value.data || result.value;
            
            // Active loans count and amount
            const activeCount = data.summary?.active || data.active || 0;
            const activeAmount = data.summary?.totalDisbursed || data.totalDisbursed || 0;
            
            // Total loans and calculate repaid (total - active - pending)
            const totalLoans = data.summary?.total || data.total || 0;
            const pendingCount = data.summary?.pending || data.pending || 0;
            const repaidCount = totalLoans - activeCount - pendingCount;
            
            // For repaid amount, we can estimate based on counts or use actual data
            // Using the difference approach
            const repaidAmount = Math.max(0, (totalLoans - activeCount - pendingCount) * (activeAmount / (activeCount || 1)));

            this.updateElement(this.activeLoansEl, formatCurrency(activeAmount), 'No active loans');
            this.updateElement(this.loansRepaidEl, formatCurrency(0), 'No loans repaid');
        } else {
            this.updateElement(this.activeLoansEl, 0, 'No active loans');
            this.updateElement(this.loansRepaidEl, 0, 'No loans repaid');
        }
    }

    updateElement(element, value, emptyMessage) {
        if (!element) return;
        
        if (value === 0 || value === '0' || value === '' || value === null || value === undefined) {
            element.textContent = emptyMessage || 'No data available';
            element.classList.add('no-data');
        } else {
            element.textContent = value;
            element.classList.remove('no-data');
        }
    }

    showLoading() {
        const elements = [this.totalMembersEl, this.totalContributionsEl, this.activeLoansEl, this.loansRepaidEl];
        elements.forEach(el => {
            if (el) {
                el.textContent = 'Loading...';
                el.classList.add('loading');
            }
        });
    }

    showErrorState() {
        const elements = [this.totalMembersEl, this.totalContributionsEl, this.activeLoansEl, this.loansRepaidEl];
        const messages = [0, 0, 0, 0];
        
        elements.forEach((el, index) => {
            if (el) {
                el.textContent = messages[index];
                el.classList.add('no-data');
            }
        });
    }

    async loadRecentActivity() {
        try {
            // Try to fetch contribution history for recent activity
            const response = await reportService.getContributionReport({ limit: 5 });
            
            if (response && response.data && response.data.contributions && response.data.contributions.length > 0) {
                this.renderActivityList(response.data.contributions);
            } else {
                this.renderEmptyActivity();
            }
        } catch (error) {
            console.log('Could not load recent activity:', error);
            this.renderEmptyActivity();
        }
    }

    renderActivityList(activities) {
        if (!this.activityListEl) return;

        const html = activities.map(activity => {
            const date = activity.createdAt ? formatDate(activity.createdAt) : 'Recent';
            const member = activity.member?.firstName && activity.member?.lastName 
                ? `${activity.member.firstName} ${activity.member.lastName}` 
                : 'Unknown';
            const description = `${formatCurrency(activity.amount || 0)} contribution`;
            
            return `
                <div class="activity-item">
                    <span class="activity-date">${date}</span>
                    <span class="activity-desc">${description} - ${member}</span>
                </div>
            `;
        }).join('');

        this.activityListEl.innerHTML = html;
    }

    renderEmptyActivity() {
        if (!this.activityListEl) return;

        this.activityListEl.innerHTML = `
            <div class="activity-item">
                <span class="activity-date">-</span>
                <span class="activity-desc">No recent activity</span>
            </div>
        `;
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
document.addEventListener('DOMContentLoaded', () => {
    new ReportsDashboard();
});

// Export for module use
export default ReportsDashboard;
