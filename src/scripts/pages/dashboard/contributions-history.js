// Import services
import { authService, contributionService } from '../../../services/index.js';
import { showNotification, formatDate, formatCurrency } from '../../../utils/utility-functions.js';


import { showConfirm } from '../../../utils/utility-functions.js';
class ContributionsHistory {
    constructor() {
        this.contributions = [];
        this.filters = {
            type: 'all',
            year: 'all',
            status: 'all'
        };
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        this.loadContributions();
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
        // Filter functionality
        const typeFilter = document.getElementById('typeFilter');
        const yearFilter = document.getElementById('yearFilter');
        const statusFilter = document.getElementById('statusFilter');

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.loadContributions();
            });
        }

        if (yearFilter) {
            yearFilter.addEventListener('change', (e) => {
                this.filters.year = e.target.value;
                this.loadContributions();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.loadContributions();
            });
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadContributions() {
        try {
            console.log('Loading contributions...');
            
            // Build query parameters based on filters
            const params = {};
            if (this.filters.type !== 'all') params.type = this.filters.type;
            if (this.filters.year !== 'all') params.year = this.filters.year;
            if (this.filters.status !== 'all') params.status = this.filters.status;

            this.contributions = await contributionService.getAll(params);
            this.renderContributions();
            this.updateSummaryStats();
        } catch (error) {
            console.error('Failed to load contributions:', error);
            showNotification('Failed to load contributions', 'error');
        }
    }

    renderContributions() {
        const tbody = document.getElementById('contributions-history-table');
        if (!tbody) return;

        if (this.contributions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No contributions found</td></tr>';
            return;
        }

        tbody.innerHTML = this.contributions.map(contribution => `
            <tr>
                <td>${formatDate(contribution.date)}</td>
                <td>${contribution.receipt || contribution.reference || 'N/A'}</td>
                <td>${contribution.type || 'N/A'}</td>
                <td>${formatCurrency(contribution.amount)}</td>
                <td>${contribution.paymentMethod || 'N/A'}</td>
                <td><span class="status-badge ${contribution.status === 'verified' ? 'success' : contribution.status === 'pending' ? 'warning' : ''}">${contribution.status === 'verified' ? 'Verified' : contribution.status === 'pending' ? 'Pending' : 'Unknown'}</span></td>
                <td><a href="#" class="action-link">View</a></td>
            </tr>
        `).join('');
    }

    updateSummaryStats() {
        // Update summary cards
        const totalContributions = this.contributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        const thisMonthContributions = this.contributions
            .filter(c => {
                const contributionDate = new Date(c.date);
                const now = new Date();
                return contributionDate.getMonth() === now.getMonth() && 
                       contributionDate.getFullYear() === now.getFullYear();
            })
            .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

        const verifiedContributions = this.contributions.filter(c => c.status === 'verified').length;
        const pendingContributions = this.contributions.filter(c => c.status === 'pending').length;

        // Update summary cards
        const totalCard = document.querySelector('.summary-card:nth-child(1) .stat-number');
        if (totalCard) totalCard.textContent = this.contributions.length;

        const amountCard = document.querySelector('.summary-card:nth-child(2) .stat-number');
        if (amountCard) amountCard.textContent = formatCurrency(totalContributions);

        const monthCard = document.querySelector('.summary-card:nth-child(3) .stat-number');
        if (monthCard) monthCard.textContent = formatCurrency(thisMonthContributions);

        // Update trend chart (simplified version)
        const verifiedCard = document.querySelector('.summary-card:nth-child(4) .stat-number');
        if (verifiedCard) verifiedCard.textContent = verifiedContributions;

        const pendingCard = document.querySelector('.summary-card:nth-child(5) .stat-number');
        if (pendingCard) pendingCard.textContent = pendingContributions;
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
document.addEventListener('DOMContentLoaded', () => {
    new ContributionsHistory();
});
