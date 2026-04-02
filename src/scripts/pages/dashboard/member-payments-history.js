/**
 * Member Payment History Script
 * Handles member payment history page functionality
 * 
 * @version 1.0.0
 */

// Import services
import { authService, paymentService, apiService } from '../../../services/index.js';


import { showConfirm } from '../../../utils/utility-functions.js';
class MemberPaymentHistory {
    constructor() {
        this.payments = [];
        this.filteredPayments = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            year: '',
            month: '',
            type: '',
            status: '',
            search: ''
        };
        
        // Initialize on construction
        this.init();
    }

    init() {
        // Check authentication first
        console.log('MemberPaymentHistory init() called');
        if (!this.checkAuth()) {
            console.log('checkAuth() returned false, exiting init');
            return; // Will redirect to login
        }
        console.log('checkAuth() passed, binding events and loading data');
        this.bindEvents();
        this.loadMemberData();
        this.loadPaymentHistory();
    }

    checkAuth() {
        console.log('checkAuth() called');
        const isAuth = authService.isAuthenticated();
        console.log('authService.isAuthenticated() returned:', isAuth);
        
        if (!isAuth) {
            // Not logged in, redirect to login page
            console.log('User not authenticated, redirecting to login');
            window.location.href = '../../../auth/login-page.html?redirect=../member/member-payments-history.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        console.log('Current user:', user);
        if (!user) {
            console.log('No current user found, redirecting to login');
            window.location.href = '../../../auth/login-page.html?redirect=../member/member-payments-history.html';
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
        const monthFilter = document.getElementById('monthFilter');
        const typeFilter = document.getElementById('typeFilter');
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        if (yearFilter) yearFilter.addEventListener('change', () => this.applyFilters());
        if (monthFilter) monthFilter.addEventListener('change', () => this.applyFilters());
        if (typeFilter) typeFilter.addEventListener('change', () => this.applyFilters());
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

    async loadPaymentHistory() {
        const loadingEl = document.getElementById('paymentsLoading');
        const tbody = document.getElementById('paymentsTableBody');
        const noDataEl = document.getElementById('paymentsNoData');
        
        if (!loadingEl || !tbody) return;

        try {
            loadingEl.style.display = 'block';
            tbody.innerHTML = '';
            if (noDataEl) noDataEl.style.display = 'none';

            const result = await paymentService.getAll();
            
            if (result.success && result.data) {
                this.payments = result.data;
                this.populateYearFilter();
                this.applyFilters();
                this.updateSummaryCards();
            } else {
                throw new Error(result.message || 'Failed to load payment history');
            }
        } catch (error) {
            console.error('Error loading payment history:', error);
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #dc2626;">Error loading payment history</td></tr>';
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    populateYearFilter() {
        const yearFilter = document.getElementById('yearFilter');
        if (!yearFilter || !this.payments.length) return;

        const years = [...new Set(this.payments.map(p => 
            new Date(p.paymentDate || p.date || p.createdAt).getFullYear()
        ))].sort((a, b) => b - a);

        yearFilter.innerHTML = '<option value="">All Years</option>';
        years.forEach(year => {
            yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
        });
    }

    applyFilters() {
        const yearFilter = document.getElementById('yearFilter');
        const monthFilter = document.getElementById('monthFilter');
        const typeFilter = document.getElementById('typeFilter');
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('searchInput');

        this.filters.year = yearFilter?.value || '';
        this.filters.month = monthFilter?.value || '';
        this.filters.type = typeFilter?.value || '';
        this.filters.status = statusFilter?.value || '';
        this.filters.search = searchInput?.value?.toLowerCase() || '';

        this.filteredPayments = this.payments.filter(payment => {
            // Year filter
            if (this.filters.year) {
                const paymentYear = new Date(payment.paymentDate || payment.date || payment.createdAt).getFullYear();
                if (paymentYear !== parseInt(this.filters.year)) return false;
            }

            // Month filter
            if (this.filters.month !== '') {
                const paymentMonth = new Date(payment.paymentDate || payment.date || payment.createdAt).getMonth();
                if (paymentMonth !== parseInt(this.filters.month)) return false;
            }

            // Type filter
            if (this.filters.type && payment.type !== this.filters.type) {
                return false;
            }

            // Status filter
            if (this.filters.status && payment.status !== this.filters.status) {
                return false;
            }

            // Search filter
            if (this.filters.search) {
                const searchText = `${payment.paymentNumber || payment.payment_id || payment.id} ${payment.amount} ${payment.method} ${payment.type} ${payment.reference || payment.transactionId || ''}`.toLowerCase();
                if (!searchText.includes(this.filters.search)) return false;
            }

            return true;
        });

        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    updateSummaryCards() {
        const totalPayments = this.payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const thisMonthPayments = this.payments
            .filter(payment => {
                const paymentDate = new Date(payment.paymentDate || payment.date || payment.createdAt);
                return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
            })
            .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
            
        const pendingPayments = this.payments.filter(payment => payment.status === 'pending').length;
        const successfulPayments = this.payments.filter(payment => payment.status === 'completed').length;

        this.updateElement('totalPayments', `Ksh ${totalPayments.toLocaleString()}`);
        this.updateElement('thisMonthPayments', `Ksh ${thisMonthPayments.toLocaleString()}`);
        this.updateElement('pendingPayments', pendingPayments);
        this.updateElement('successfulPayments', successfulPayments);
    }

    renderTable() {
        const tbody = document.getElementById('paymentsTableBody');
        const noDataEl = document.getElementById('paymentsNoData');
        
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredPayments.slice(startIndex, endIndex);

        if (pageData.length === 0) {
            if (noDataEl) noDataEl.style.display = 'block';
            tbody.innerHTML = '';
            return;
        }

        if (noDataEl) noDataEl.style.display = 'none';
        
        tbody.innerHTML = pageData.map(payment => `
            <tr>
                <td><strong>${payment.paymentNumber || payment.payment_id || payment.id}</strong></td>
                <td>${this.formatPaymentType(payment.type)}</td>
                <td><strong>Ksh ${parseFloat(payment.amount || 0).toLocaleString()}</strong></td>
                <td>${this.formatPaymentMethod(payment.method)}</td>
                <td>${new Date(payment.paymentDate || payment.date || payment.createdAt).toLocaleDateString()}</td>
                <td><span class="status ${this.getPaymentStatusClass(payment.status)}">
                    ${this.formatPaymentStatus(payment.status)}
                </span></td>
                <td>${payment.reference || payment.transactionId || 'N/A'}</td>
                <td>
                    <button onclick="window.location.href='../payments/receipt.html?id=${payment.id}'" class="btn-small">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderPagination() {
        const paginationEl = document.getElementById('pagination');
        if (!paginationEl) return;

        const totalPages = Math.ceil(this.filteredPayments.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="memberPaymentHistory.goToPage(${this.currentPage - 1})"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> Previous
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="memberPaymentHistory.goToPage(${i})">
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
                    onclick="memberPaymentHistory.goToPage(${this.currentPage + 1})"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationEl.innerHTML = paginationHTML;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredPayments.length / this.itemsPerPage);
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

    formatPaymentType(type) {
        const typeMap = {
            'contribution': 'Contribution',
            'loan_payment': 'Loan Payment',
            'fine_payment': 'Fine Payment',
            'membership_fee': 'Membership Fee',
            'development_fee': 'Development Fee',
            'welfare_fee': 'Welfare Fee',
            'emergency_fee': 'Emergency Fee'
        };
        return typeMap[type] || type || 'Payment';
    }

    formatPaymentMethod(method) {
        const methodMap = {
            'mpesa': 'M-Pesa',
            'bank_transfer': 'Bank Transfer',
            'cash': 'Cash',
            'cheque': 'Cheque',
            'mobile_money': 'Mobile Money',
            'online': 'Online Payment',
            'credit_card': 'Credit Card',
            'debit_card': 'Debit Card'
        };
        return methodMap[method] || method || 'N/A';
    }

    getPaymentStatusClass(status) {
        const statusMap = {
            'completed': 'received',
            'successful': 'received',
            'verified': 'received',
            'pending': 'pending',
            'processing': 'pending',
            'failed': 'unpaid',
            'rejected': 'unpaid',
            'cancelled': 'unpaid',
            'refunded': 'unpaid'
        };
        return statusMap[status] || 'pending';
    }

    formatPaymentStatus(status) {
        const statusMap = {
            'completed': '✓ Completed',
            'successful': '✓ Successful',
            'verified': '✓ Verified',
            'pending': '⏳ Pending',
            'processing': '⏳ Processing',
            'failed': '✗ Failed',
            'rejected': '✗ Rejected',
            'cancelled': '✗ Cancelled',
            'refunded': '↩ Refunded'
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

// Initialize the member payment history page
let memberPaymentHistory;
document.addEventListener('DOMContentLoaded', () => {
    memberPaymentHistory = new MemberPaymentHistory();
});
