/**
 * Member Loan History Script
 * Handles member loan history page functionality
 * 
 * @version 1.0.0
 */

// Import services
import { authService, loanService, apiService } from '../../../services/index.js';

class MemberLoanHistory {
    constructor() {
        this.loans = [];
        this.filteredLoans = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            year: '',
            status: '',
            type: '',
            search: ''
        };
        
        // Initialize on construction
        this.init();
    }

    init() {
        // Check authentication first
        console.log('MemberLoanHistory init() called');
        if (!this.checkAuth()) {
            console.log('checkAuth() returned false, exiting init');
            return; // Will redirect to login
        }
        console.log('checkAuth() passed, binding events and loading data');
        this.bindEvents();
        this.loadMemberData();
        this.loadLoanHistory();
        this.loadLoanEligibility();
    }

    checkAuth() {
        console.log('checkAuth() called');
        const isAuth = authService.isAuthenticated();
        console.log('authService.isAuthenticated() returned:', isAuth);
        
        if (!isAuth) {
            // Not logged in, redirect to login page
            console.log('User not authenticated, redirecting to login');
            window.location.href = '../../../auth/login-page.html?redirect=../member/member-loans-history.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        console.log('Current user:', user);
        if (!user) {
            console.log('No current user found, redirecting to login');
            window.location.href = '../../../auth/login-page.html?redirect=../member/member-loans-history.html';
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

        // Filter events
        const yearFilter = document.getElementById('yearFilter');
        const statusFilter = document.getElementById('statusFilter');
        const typeFilter = document.getElementById('typeFilter');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        if (yearFilter) yearFilter.addEventListener('change', () => this.applyFilters());
        if (statusFilter) statusFilter.addEventListener('change', () => this.applyFilters());
        if (typeFilter) typeFilter.addEventListener('change', () => this.applyFilters());
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

    async loadLoanHistory() {
        const loadingEl = document.getElementById('loansLoading');
        const tbody = document.getElementById('loansTableBody');
        const noDataEl = document.getElementById('loansNoData');
        
        if (!loadingEl || !tbody) return;

        try {
            loadingEl.style.display = 'block';
            tbody.innerHTML = '';
            if (noDataEl) noDataEl.style.display = 'none';

            const result = await loanService.getAll();
            
            if (result.success && result.data) {
                this.loans = result.data;
                this.populateYearFilter();
                this.applyFilters();
                this.updateSummaryCards();
            } else {
                throw new Error(result.message || 'Failed to load loan history');
            }
        } catch (error) {
            console.error('Error loading loan history:', error);
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #dc2626;">Error loading loan history</td></tr>';
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    async loadLoanEligibility() {
        const statusEl = document.getElementById('eligibilityStatus');
        const maxLoanEl = document.getElementById('maxLoanAmount');
        const scoreEl = document.getElementById('memberScore');
        const applyBtn = document.getElementById('applyLoanBtn');

        if (!statusEl || !maxLoanEl || !scoreEl) return;

        try {
            const result = await loanService.getEligibility();
            
            if (result.success && result.data) {
                const eligibility = result.data;
                
                // Update eligibility status
                const isEligible = eligibility.score >= 50;
                statusEl.className = `eligibility-status ${isEligible ? 'eligible' : 'not-eligible'}`;
                statusEl.querySelector('.status-icon').innerHTML = isEligible ? '✓' : '✗';
                statusEl.querySelector('.status-text').textContent = isEligible ? 'Eligible for Loan' : 'Not Eligible';
                
                // Update max loan amount
                maxLoanEl.textContent = `Ksh ${parseFloat(eligibility.maxLoan || 0).toLocaleString()}`;
                
                // Update member score
                scoreEl.textContent = eligibility.score || 0;
                
                // Enable/disable apply button
                if (applyBtn) {
                    applyBtn.disabled = !isEligible;
                    applyBtn.style.opacity = isEligible ? '1' : '0.5';
                    applyBtn.style.cursor = isEligible ? 'pointer' : 'not-allowed';
                }
            }
        } catch (error) {
            console.error('Error loading loan eligibility:', error);
            // Set default values on error
            statusEl.className = 'eligibility-status not-eligible';
            statusEl.querySelector('.status-icon').innerHTML = '✗';
            statusEl.querySelector('.status-text').textContent = 'Unable to check eligibility';
            maxLoanEl.textContent = 'Ksh 0';
            scoreEl.textContent = '0';
        }
    }

    async refreshEligibility() {
        const refreshBtn = event.target;
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Refreshing...';
        
        await this.loadLoanEligibility();
        
        setTimeout(() => {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync"></i> Refresh';
        }, 1000);
    }

    populateYearFilter() {
        const yearFilter = document.getElementById('yearFilter');
        if (!yearFilter || !this.loans.length) return;

        const years = [...new Set(this.loans.map(l => 
            new Date(l.applicationDate || l.createdAt).getFullYear()
        ))].sort((a, b) => b - a);

        yearFilter.innerHTML = '<option value="">All Years</option>';
        years.forEach(year => {
            yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
        });
    }

    applyFilters() {
        const yearFilter = document.getElementById('yearFilter');
        const statusFilter = document.getElementById('statusFilter');
        const typeFilter = document.getElementById('typeFilter');
        const searchInput = document.getElementById('searchInput');

        this.filters.year = yearFilter?.value || '';
        this.filters.status = statusFilter?.value || '';
        this.filters.type = typeFilter?.value || '';
        this.filters.search = searchInput?.value?.toLowerCase() || '';

        this.filteredLoans = this.loans.filter(loan => {
            // Year filter
            if (this.filters.year) {
                const loanYear = new Date(loan.applicationDate || loan.createdAt).getFullYear();
                if (loanYear !== parseInt(this.filters.year)) return false;
            }

            // Status filter
            if (this.filters.status && loan.status !== this.filters.status) {
                return false;
            }

            // Type filter
            if (this.filters.type && loan.type !== this.filters.type) {
                return false;
            }

            // Search filter
            if (this.filters.search) {
                const searchText = `${loan.loanNumber || loan.loan_number || loan.id} ${loan.amount} ${loan.type} ${loan.purpose || ''}`.toLowerCase();
                if (!searchText.includes(this.filters.search)) return false;
            }

            return true;
        });

        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    updateSummaryCards() {
        const activeLoans = this.loans.filter(loan => ['active', 'approved'].includes(loan.status)).length;
        const totalBorrowed = this.loans.reduce((sum, loan) => sum + parseFloat(loan.amount || loan.principalAmount || 0), 0);
        const outstandingBalance = this.loans
            .filter(loan => ['active', 'approved'].includes(loan.status))
            .reduce((sum, loan) => sum + parseFloat(loan.remainingBalance || loan.balance || 0), 0);
        const completedLoans = this.loans.filter(loan => loan.status === 'completed').length;

        this.updateElement('activeLoansCount', activeLoans);
        this.updateElement('totalBorrowed', `Ksh ${totalBorrowed.toLocaleString()}`);
        this.updateElement('outstandingBalance', `Ksh ${outstandingBalance.toLocaleString()}`);
        this.updateElement('completedLoansCount', completedLoans);
    }

    renderTable() {
        const tbody = document.getElementById('loansTableBody');
        const noDataEl = document.getElementById('loansNoData');
        
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredLoans.slice(startIndex, endIndex);

        if (pageData.length === 0) {
            if (noDataEl) noDataEl.style.display = 'block';
            tbody.innerHTML = '';
            return;
        }

        if (noDataEl) noDataEl.style.display = 'none';
        
        tbody.innerHTML = pageData.map(loan => `
            <tr>
                <td><strong>${loan.loanNumber || loan.loan_number || 'N/A'}</strong></td>
                <td>${this.formatLoanType(loan.type)}</td>
                <td><strong>Ksh ${parseFloat(loan.amount || loan.principalAmount || 0).toLocaleString()}</strong></td>
                <td><span class="status ${this.getLoanStatusClass(loan.status)}">
                    ${this.formatLoanStatus(loan.status)}
                </span></td>
                <td>${new Date(loan.applicationDate || loan.createdAt).toLocaleDateString()}</td>
                <td>${loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}</td>
                <td><strong>Ksh ${parseFloat(loan.remainingBalance || loan.balance || 0).toLocaleString()}</strong></td>
                <td>
                    <button onclick="window.location.href='../loans/details.html?id=${loan.id}'" class="btn-small">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${loan.status === 'active' ? `
                        <button onclick="window.location.href='../loans/repayment.html?id=${loan.id}'" class="btn-small" style="margin-left: 5px;">
                            <i class="fas fa-money-bill"></i> Repay
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    renderPagination() {
        const paginationEl = document.getElementById('pagination');
        if (!paginationEl) return;

        const totalPages = Math.ceil(this.filteredLoans.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="memberLoanHistory.goToPage(${this.currentPage - 1})"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> Previous
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="memberLoanHistory.goToPage(${i})">
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
                    onclick="memberLoanHistory.goToPage(${this.currentPage + 1})"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationEl.innerHTML = paginationHTML;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredLoans.length / this.itemsPerPage);
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

    formatLoanType(type) {
        const typeMap = {
            'emergency': 'Emergency Loan',
            'development': 'Development Loan',
            'education': 'Education Loan',
            'business': 'Business Loan',
            'personal': 'Personal Loan',
            'welfare': 'Welfare Loan'
        };
        return typeMap[type] || type || 'Loan';
    }

    getLoanStatusClass(status) {
        const statusMap = {
            'completed': 'received',
            'active': 'pending',
            'approved': 'pending',
            'pending': 'pending',
            'overdue': 'unpaid',
            'rejected': 'unpaid',
            'defaulted': 'unpaid'
        };
        return statusMap[status] || 'pending';
    }

    formatLoanStatus(status) {
        const statusMap = {
            'completed': '✓ Completed',
            'active': '🔄 Active',
            'approved': '✓ Approved',
            'pending': '⏳ Pending',
            'overdue': '⚠ Overdue',
            'rejected': '✗ Rejected',
            'defaulted': '✗ Defaulted'
        };
        return statusMap[status] || status || 'Unknown';
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
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

// Initialize the member loan history page
let memberLoanHistory;
document.addEventListener('DOMContentLoaded', () => {
    memberLoanHistory = new MemberLoanHistory();
});
