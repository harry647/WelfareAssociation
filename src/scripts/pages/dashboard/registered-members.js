/**
 * Registered Members Script
 * Handles registered members functionality with dynamic data from database
 * 
 * @version 1.1.0
 * Updated to fetch data from database
 */

// Import services
import { authService, memberService } from '../../../services/index.js';

// Import utility functions
import { showNotification, formatDate, formatCurrency } from '../../../utils/utility-functions.js';


import { showConfirm } from '../../../utils/utility-functions.js';
class RegisteredMembers {
    constructor() {
        this.members = [];
        this.stats = {
            total: 0,
            thisMonth: 0,
            female: 0,
            male: 0
        };
        this.currentPage = 1;
        this.limit = 50;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        await this.loadMembers();
    }

    /**
     * Check authentication
     */
    async checkAuth() {
        if (!authService.isAuthenticated()) {
            window.location.href = '../../../auth/login-page.html?redirect=../admin/registered-members.html';
            return false;
        }
        
        // Check for admin/secretary role
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
        // Logout button
        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

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

        // View buttons in table
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn') && e.target.textContent.trim() === 'View') {
                const row = e.target.closest('tr');
                const memberId = row?.dataset?.memberId;
                if (memberId) {
                    this.viewMember(memberId);
                }
            }
        });
    }

    /**
     * Load members from database
     */
    async loadMembers() {
        const loadingEl = document.getElementById('loading-indicator');
        const errorEl = document.getElementById('error-message');
        const tableBody = document.querySelector('table tbody');

        try {
            // Show loading state
            if (loadingEl) loadingEl.style.display = 'block';
            if (errorEl) errorEl.style.display = 'none';

            // Fetch all members (no pagination limit for registered members list)
            const response = await memberService.getAllMembers({ limit: this.limit, page: this.currentPage });
            
            // Handle different response formats
            this.members = response.data || response || [];
            
            // Calculate statistics
            this.calculateStats();

            // Update stats display
            this.updateStatsDisplay();

            // Render members table
            this.renderMembers();

            // Hide loading
            if (loadingEl) loadingEl.style.display = 'none';

        } catch (error) {
            console.error('Error loading members:', error);
            
            // Show error message
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) {
                errorEl.textContent = 'Failed to load members. Please try again later.';
                errorEl.style.display = 'block';
            }
            
            // Show empty state in table
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="9" class="no-data-message">
                            <i class="fas fa-exclamation-circle"></i>
                            Unable to load members. Please ensure the server is running.
                        </td>
                    </tr>
                `;
            }
        }
    }

    /**
     * Calculate statistics from members data
     */
    calculateStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        this.stats.total = this.members.length;
        
        // This month's registrations
        this.stats.thisMonth = this.members.filter(member => {
            const joinDate = new Date(member.joinDate || member.createdAt);
            return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
        }).length;

        // Gender breakdown
        this.stats.female = this.members.filter(m => 
            m.gender === 'female' || m.gender === 'Female'
        ).length;
        
        this.stats.male = this.members.filter(m => 
            m.gender === 'male' || m.gender === 'Male'
        ).length;
    }

    /**
     * Update statistics display in the UI
     */
    updateStatsDisplay() {
        // Total Registered
        const totalEl = document.getElementById('total-registered');
        if (totalEl) {
            totalEl.textContent = this.stats.total;
        }

        // This Month
        const monthEl = document.getElementById('this-month');
        if (monthEl) {
            monthEl.textContent = this.stats.thisMonth;
        }

        // Female
        const femaleEl = document.getElementById('female-count');
        if (femaleEl) {
            femaleEl.textContent = this.stats.female;
        }

        // Male
        const maleEl = document.getElementById('male-count');
        if (maleEl) {
            maleEl.textContent = this.stats.male;
        }
    }

    /**
     * Render members table with dynamic data
     */
    renderMembers() {
        const tableBody = document.getElementById('members-table-body');
        if (!tableBody) return;

        if (!this.members || this.members.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data-message">
                        <i class="fas fa-users"></i>
                        No registered members found. Members will appear here once they register.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.members.map((member, index) => {
            const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
            const memberNumber = member.memberNumber || `REG/${String(index + 1).padStart(3, '0')}`;
            const email = member.email || 'N/A';
            const phone = member.phone || 'N/A';
            
            // Extract institution details
            const institution = member.institution || {};
            const studentId = institution.studentId || member.studentId || 'N/A';
            const course = institution.course || member.course || 'N/A';
            const year = institution.year || member.year || 'N/A';
            
            // Format dates
            const joinDate = member.joinDate || member.createdAt;
            const formattedDate = joinDate ? formatDate(joinDate) : 'N/A';

            return `
                <tr data-member-id="${member.id}">
                    <td>${memberNumber}</td>
                    <td>${fullName}</td>
                    <td>${studentId}</td>
                    <td>${email}</td>
                    <td>${phone}</td>
                    <td>${course}</td>
                    <td>${year}</td>
                    <td>${formattedDate}</td>
                    <td>
                        <button class="btn">View</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * View member details
     */
    viewMember(memberId) {
        window.location.href = `member-details.html?memberId=${memberId}`;
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        if (await showConfirm('Are you sure you want to logout?')) {
            authService.logout();
            window.location.href = '../../index.html';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.registeredMembers = new RegisteredMembers();
});
