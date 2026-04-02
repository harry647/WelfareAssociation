/**
 * Member Contribution History Script
 * Handles member contribution history page functionality
 * 
 * @version 1.0.0
 */

// Import services
import { authService, contributionService, apiService } from '../../../services/index.js';


import { showConfirm } from '../../../utils/utility-functions.js';
class MemberContributionHistory {
    constructor() {
        this.contributions = [];
        this.filteredContributions = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            year: '',
            month: '',
            status: '',
            search: ''
        };
        
        // Initialize on construction
        this.init();
    }

    init() {
        // Check authentication first
        console.log('MemberContributionHistory init() called');
        if (!this.checkAuth()) {
            console.log('checkAuth() returned false, exiting init');
            return; // Will redirect to login
        }
        console.log('checkAuth() passed, binding events and loading data');
        this.bindEvents();
        this.loadMemberData();
        this.loadContributionHistory();
    }

    checkAuth() {
        console.log('checkAuth() called');
        const isAuth = authService.isAuthenticated();
        console.log('authService.isAuthenticated() returned:', isAuth);
        
        if (!isAuth) {
            // Not logged in, redirect to login page
            console.log('User not authenticated, redirecting to login');
            window.location.href = '../../../auth/login-page.html?redirect=../member/member-contribution-history.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        console.log('Current user:', user);
        if (!user) {
            console.log('No current user found, redirecting to login');
            window.location.href = '../../../auth/login-page.html?redirect=../member/member-contribution-history.html';
            return false;
        }
        
        return true;
    }

    bindEvents() {
        // Logout button
        const logoutBtns = document.querySelectorAll('.logout-btn');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleLogout());
        });

        // Header notification bell (with delayed init for w3.includeHTML)
        const initNotificationBell = () => {
            const notificationBell = document.getElementById('notificationBell');
            if (notificationBell) {
                notificationBell.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleNotificationBellClick(notificationBell);
                });
            } else {
                setTimeout(initNotificationBell, 100);
            }
        };
        setTimeout(initNotificationBell, 500);

        const yearFilter = document.getElementById('yearFilter');
        const monthFilter = document.getElementById('monthFilter');
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        if (yearFilter) yearFilter.addEventListener('change', () => this.applyFilters());
        if (monthFilter) monthFilter.addEventListener('change', () => this.applyFilters());
        if (statusFilter) statusFilter.addEventListener('change', () => this.applyFilters());
        if (searchInput) searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });
        if (searchBtn) searchBtn.addEventListener('click', () => this.applyFilters());
    }

    async loadMemberData() {
        try {
            const user = authService.getCurrentUser();
            if (user) {
                // Update welcome message
                const welcomeElement = document.getElementById('welcome-message');
                if (welcomeElement) {
                    const firstName = user.firstName || user.first_name || '';
                    const lastName = user.lastName || user.last_name || '';
                    const fullName = (firstName + ' ' + lastName).trim();
                    if (fullName) {
                        welcomeElement.innerHTML = `<i class="fas fa-user-circle"></i> Welcome, ${fullName}`;
                        // Update avatar initials
                        const avatar = document.querySelector('.member-avatar');
                        if (avatar) avatar.textContent = (firstName[0] || '') + (lastName[0] || '');
                    }
                }
            }
        } catch (error) {
            console.error('Error loading member data:', error);
        }
    }

    async loadContributionHistory() {
        const loadingEl = document.getElementById('contributionsLoading');
        const tbody = document.getElementById('contributionsTableBody');
        const noDataEl = document.getElementById('contributionsNoData');
        
        if (!loadingEl || !tbody) return;

        try {
            loadingEl.style.display = 'block';
            tbody.innerHTML = '';
            if (noDataEl) noDataEl.style.display = 'none';

            const result = await contributionService.getAll();
            
            if (result.success && result.data) {
                this.contributions = result.data;
                this.populateYearFilter();
                this.applyFilters();
                this.updateSummaryCards();
            } else {
                throw new Error(result.message || 'Failed to load contribution history');
            }
        } catch (error) {
            console.error('Error loading contribution history:', error);
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #dc2626;">Error loading contribution history</td></tr>';
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    populateYearFilter() {
        const yearFilter = document.getElementById('yearFilter');
        if (!yearFilter || !this.contributions.length) return;

        const years = [...new Set(this.contributions.map(c => 
            new Date(c.date || c.createdAt).getFullYear()
        ))].sort((a, b) => b - a);

        yearFilter.innerHTML = '<option value="">All Years</option>';
        years.forEach(year => {
            yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
        });
    }

    applyFilters() {
        const yearFilter = document.getElementById('yearFilter');
        const monthFilter = document.getElementById('monthFilter');
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('searchInput');

        this.filters.year = yearFilter?.value || '';
        this.filters.month = monthFilter?.value || '';
        this.filters.status = statusFilter?.value || '';
        this.filters.search = searchInput?.value?.toLowerCase() || '';

        this.filteredContributions = this.contributions.filter(contribution => {
            // Year filter
            if (this.filters.year) {
                const contributionYear = new Date(contribution.date || contribution.createdAt).getFullYear();
                if (contributionYear !== parseInt(this.filters.year)) return false;
            }

            // Month filter
            if (this.filters.month !== '') {
                const contributionMonth = new Date(contribution.date || contribution.createdAt).getMonth();
                if (contributionMonth !== parseInt(this.filters.month)) return false;
            }

            // Status filter
            if (this.filters.status && contribution.status !== this.filters.status) {
                return false;
            }

            // Search filter
            if (this.filters.search) {
                const searchText = `${contribution.amount} ${contribution.method} ${contribution.type} ${contribution.reference || contribution.transactionId || ''}`.toLowerCase();
                if (!searchText.includes(this.filters.search)) return false;
            }

            return true;
        });

        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    updateSummaryCards() {
        const totalContributions = this.contributions.reduce((sum, contribution) => sum + parseFloat(contribution.amount || 0), 0);
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        
        const thisYearContributions = this.contributions
            .filter(contribution => {
                const contributionDate = new Date(contribution.date || contribution.createdAt);
                return contributionDate.getFullYear() === currentYear;
            })
            .reduce((sum, contribution) => sum + parseFloat(contribution.amount || 0), 0);
            
        const thisMonthContributions = this.contributions
            .filter(contribution => {
                const contributionDate = new Date(contribution.date || contribution.createdAt);
                return contributionDate.getFullYear() === currentYear && contributionDate.getMonth() === currentMonth;
            })
            .reduce((sum, contribution) => sum + parseFloat(contribution.amount || 0), 0);
            
        const pendingContributions = this.contributions.filter(contribution => contribution.status === 'pending').length;

        this.updateElement('totalContributions', `Ksh ${totalContributions.toLocaleString()}`);
        this.updateElement('thisYearContributions', `Ksh ${thisYearContributions.toLocaleString()}`);
        this.updateElement('thisMonthContributions', `Ksh ${thisMonthContributions.toLocaleString()}`);
        this.updateElement('pendingContributions', pendingContributions);
    }

    renderTable() {
        const tbody = document.getElementById('contributionsTableBody');
        const noDataEl = document.getElementById('contributionsNoData');
        
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredContributions.slice(startIndex, endIndex);

        if (pageData.length === 0) {
            if (noDataEl) noDataEl.style.display = 'block';
            tbody.innerHTML = '';
            return;
        }

        if (noDataEl) noDataEl.style.display = 'none';
        
        tbody.innerHTML = pageData.map(contribution => `
            <tr>
                <td>${new Date(contribution.date || contribution.createdAt).toLocaleDateString()}</td>
                <td><strong>Ksh ${parseFloat(contribution.amount || 0).toLocaleString()}</strong></td>
                <td>${this.formatPaymentMethod(contribution.method)}</td>
                <td>${this.formatContributionType(contribution.type)}</td>
                <td><span class="status ${this.getContributionStatusClass(contribution.status)}">
                    ${this.formatContributionStatus(contribution.status)}
                </span></td>
                <td>${contribution.reference || contribution.transactionId || 'N/A'}</td>
                <td>
                    <button onclick="window.location.href='../payments/receipt.html?id=${contribution.id}'" class="btn-small">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderPagination() {
        const paginationEl = document.getElementById('pagination');
        if (!paginationEl) return;

        const totalPages = Math.ceil(this.filteredContributions.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="memberContributionHistory.goToPage(${this.currentPage - 1})"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> Previous
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="memberContributionHistory.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="memberContributionHistory.goToPage(${this.currentPage + 1})"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationEl.innerHTML = paginationHTML;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredContributions.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTable();
            this.renderPagination();
            
            // Scroll to top of table
            const tableContainer = document.querySelector('.table-container');
            if (tableContainer) {
                tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    formatPaymentMethod(method) {
        const methodMap = {
            'mpesa': 'M-Pesa',
            'bank_transfer': 'Bank Transfer',
            'cash': 'Cash',
            'cheque': 'Cheque',
            'mobile_money': 'Mobile Money',
            'online': 'Online Payment'
        };
        return methodMap[method] || method || 'N/A';
    }

    formatContributionType(type) {
        const typeMap = {
            'monthly': 'Monthly Contribution',
            'development': 'Development Fund',
            'welfare': 'Welfare Fund',
            'emergency': 'Emergency Fund',
            'special': 'Special Contribution'
        };
        return typeMap[type] || type || 'Contribution';
    }

    getContributionStatusClass(status) {
        const statusMap = {
            'verified': 'received',
            'completed': 'received',
            'pending': 'pending',
            'processing': 'pending',
            'rejected': 'unpaid',
            'failed': 'unpaid',
            'cancelled': 'unpaid'
        };
        return statusMap[status] || 'pending';
    }

    formatContributionStatus(status) {
        const statusMap = {
            'verified': '✓ Verified',
            'completed': '✓ Completed',
            'pending': '⏳ Pending',
            'processing': '⏳ Processing',
            'rejected': '✗ Rejected',
            'failed': '✗ Failed',
            'cancelled': '✗ Cancelled'
        };
        return statusMap[status] || status || 'Unknown';
    }

    async handleLogout() {
        if (await showConfirm('Are you sure you want to logout?')) {
            authService.logout();
            window.location.href = '../auth/login-page.html';
        }
    }

    handleNotificationBellClick(bellElement) {
        let dropdown = document.getElementById('notifications-menu');
        if (dropdown) {
            dropdown.remove();
            return;
        }
        dropdown = document.createElement('div');
        dropdown.id = 'notifications-menu';
        dropdown.className = 'dropdown-menu';
        dropdown.innerHTML = `
            <div class="dropdown-header"><i class="fas fa-bell"></i> Notifications</div>
            <div class="dropdown-item" onclick="window.location.href='../../shared/notices.html'">
                <i class="fas fa-microphone"></i> View All Notices
            </div>
            <div class="dropdown-item disabled"><i class="fas fa-check-circle"></i> No new notifications</div>
        `;
        bellElement.parentElement.appendChild(dropdown);
        dropdown.style.position = 'absolute';
        dropdown.style.top = '100%';
        dropdown.style.right = '0';
        dropdown.style.marginTop = '8px';
        dropdown.style.minWidth = '220px';
        dropdown.style.zIndex = '1000';
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== bellElement) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }
}

// Initialize the member contribution history page
let memberContributionHistory;
document.addEventListener('DOMContentLoaded', () => {
    memberContributionHistory = new MemberContributionHistory();
});
