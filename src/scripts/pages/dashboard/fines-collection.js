/**
 * Fines Collection Script
 * Handles fines collection functionality with dynamic data from database
 * 
 * @version 1.1.0
 * Updated to fetch data from database
 */

// Import services
import { authService, fineService } from '../../../services/index.js';

// Import utility functions
import { showNotification, formatDate, formatCurrency } from '../../../utils/utility-functions.js';


import { showConfirm } from '../../../utils/utility-functions.js';
class FinesCollection {
    constructor() {
        this.fines = [];
        this.stats = {
            totalFines: 0,
            totalAmount: 0,
            collected: 0,
            pending: 0
        };
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        await this.loadFines();
    }

    /**
     * Check authentication
     */
    async checkAuth() {
        if (!authService.isAuthenticated()) {
            window.location.href = '../../../auth/login-page.html?redirect=../admin/fines-collection.html';
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
     * Load fines from database
     */
    async loadFines() {
        const loadingEl = document.getElementById('loading-indicator');
        const errorEl = document.getElementById('error-message');

        try {
            // Show loading state
            if (loadingEl) loadingEl.style.display = 'block';
            if (errorEl) errorEl.style.display = 'none';

            // Fetch statistics
            const statsResponse = await fineService.getStatistics();
            const stats = statsResponse.data || statsResponse || {};
            
            // Update stats
            this.stats.totalFines = stats.unpaid || 0;
            this.stats.totalAmount = stats.totalOutstanding || 0;
            this.stats.collected = stats.paid || 0;
            this.stats.pending = stats.totalOutstanding || 0;

            // Fetch pending fines (outstanding)
            const pendingResponse = await fineService.getPending();
            const pendingFines = pendingResponse.data || pendingResponse || [];

            // Fetch paid fines
            const paidResponse = await fineService.getPaid();
            const paidFines = paidResponse.data || paidResponse || [];

            // Calculate this month's collected
            const now = new Date();
            const thisMonthFines = paidFines.filter(f => {
                if (!f.paidDate) return false;
                const paidDate = new Date(f.paidDate);
                return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
            });
            this.stats.collected = thisMonthFines.reduce((sum, f) => sum + (f.amount || 0), 0);

            // Update stats display
            this.updateStatsDisplay();

            // Render outstanding fines
            this.renderOutstandingFines(pendingFines);

            // Render collected fines
            this.renderCollectedFines(thisMonthFines);

            // Hide loading
            if (loadingEl) loadingEl.style.display = 'none';

        } catch (error) {
            console.error('Error loading fines:', error);
            
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) {
                errorEl.textContent = 'Failed to load fines. Please try again later.';
                errorEl.style.display = 'block';
            }
            
            this.showEmptyTables();
        }
    }

    /**
     * Update statistics display
     */
    updateStatsDisplay() {
        // Total Fines Count
        const totalFinesEl = document.getElementById('totalFinesCount');
        if (totalFinesEl) totalFinesEl.textContent = this.stats.totalFines;

        // Total Amount Outstanding
        const totalAmountEl = document.getElementById('totalFinesAmount');
        if (totalAmountEl) totalAmountEl.textContent = `Ksh ${formatCurrency(this.stats.totalAmount)}`;

        // Collected This Month
        const collectedEl = document.getElementById('collectedFines');
        if (collectedEl) collectedEl.textContent = `Ksh ${formatCurrency(this.stats.collected)}`;

        // Pending
        const pendingEl = document.getElementById('pendingFines');
        if (pendingEl) pendingEl.textContent = `Ksh ${formatCurrency(this.stats.pending)}`;
    }

    /**
     * Render outstanding fines table
     */
    renderOutstandingFines(fines) {
        const tableBody = document.getElementById('outstandingFinesTable');
        if (!tableBody) return;

        if (!fines || fines.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data-message">
                        <i class="fas fa-check-circle"></i>
                        No outstanding fines. Great job!
                    </td>
                </tr>
            `;
            return;
        }

        const now = new Date();

        tableBody.innerHTML = fines.map(fine => {
            const member = fine.member || {};
            const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown Member';
            const memberNumber = member.memberNumber || 'N/A';
            const institution = member.institution || {};
            const studentId = institution.studentId || 'N/A';
            
            const fineType = fine.fineType?.name || fine.fineType || 'General Fine';
            const amount = fine.amount || 0;
            const dateIssued = fine.createdAt ? formatDate(fine.createdAt) : 'N/A';
            const dueDate = fine.dueDate ? formatDate(fine.dueDate) : 'N/A';
            
            // Status calculation
            const due = new Date(fine.dueDate);
            let statusHtml;
            if (fine.status === 'paid') {
                statusHtml = '<span class="status received">Paid</span>';
            } else if (due < now) {
                statusHtml = '<span class="status overdue">Overdue</span>';
            } else {
                statusHtml = '<span class="status pending">Pending</span>';
            }

            return `
                <tr data-fine-id="${fine.id}">
                    <td>${memberName}</td>
                    <td>${studentId}</td>
                    <td>${fineType}</td>
                    <td>Ksh ${formatCurrency(amount)}</td>
                    <td>${dateIssued}</td>
                    <td>${dueDate}</td>
                    <td>${statusHtml}</td>
                    <td><button class="btn" onclick="sendFineReminder('${fine.id}')">Send Reminder</button></td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Render collected fines table
     */
    renderCollectedFines(fines) {
        const tableBody = document.getElementById('collectedFinesTable');
        if (!tableBody) return;

        if (!fines || fines.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data-message">
                        <i class="fas fa-info-circle"></i>
                        No fines collected this month.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = fines.map(fine => {
            const member = fine.member || {};
            const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown Member';
            const institution = member.institution || {};
            const studentId = institution.studentId || 'N/A';
            
            const fineType = fine.fineType?.name || fine.fineType || 'General Fine';
            const amount = fine.amount || 0;
            const datePaid = fine.paidDate ? formatDate(fine.paidDate) : 'N/A';
            const paymentMethod = fine.paymentMethod || 'N/A';

            return `
                <tr>
                    <td>${memberName}</td>
                    <td>${studentId}</td>
                    <td>${fineType}</td>
                    <td>Ksh ${formatCurrency(amount)}</td>
                    <td>${datePaid}</td>
                    <td>${paymentMethod}</td>
                    <td><span class="status received">✓ Paid</span></td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Show empty tables
     */
    showEmptyTables() {
        const outstandingTable = document.getElementById('outstandingFinesTable');
        if (outstandingTable) {
            outstandingTable.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data-message">
                        <i class="fas fa-exclamation-circle"></i>
                        Unable to load fines. Please ensure the server is running.
                    </td>
                </tr>
            `;
        }

        const collectedTable = document.querySelector('#section-fines .data-section:nth-of-type(3) table tbody');
        if (collectedTable) {
            collectedTable.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data-message">
                        <i class="fas fa-exclamation-circle"></i>
                        Unable to load collected fines.
                    </td>
                </tr>
            `;
        }
    }

    async handleLogout() {
        if (await showConfirm('Are you sure you want to logout?')) {
            authService.logout();
            window.location.href = '../../index.html';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.finesCollection = new FinesCollection();
});

// Global function to send reminder
async function sendFineReminder(fineId) {
    try {
        const { fineService } = await import('../../../services/index.js');
        await fineService.sendReminder(fineId);
        showNotification('Reminder sent successfully!', 'success');
    } catch (error) {
        console.error('Error sending reminder:', error);
        showNotification('Failed to send reminder. Please try again.', 'error');
    }
}
