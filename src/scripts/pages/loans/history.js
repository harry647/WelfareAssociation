/**
 * Loan History Script
 * Handles loan history display, filtering, analytics, and interactions
 * Ready for backend API integration
 */

import { loanService } from '../../../services/index.js';
import { API_CONFIG } from '../../../config/app-config.js';


import { showAlert } from '../../../utils/utility-functions.js';
import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';
// Demo data for display
let loansData = [];
let paymentsData = [];
let currentUserRole = 'admin'; // admin, finance, auditor

// Initialize the loan history functionality
document.addEventListener('DOMContentLoaded', () => {
    initLoanHistory();
});

function initLoanHistory() {
    // Initialize all features
    initRealTimeUpdates();
    initFilters();
    initSearch();
    initBulkOperations();
    initExportDropdown();
    initNotificationBell();
    initApprovalWorkflow();
    initModals();
    
    // Load data in sequence
    loadLoanHistory().then(() => {
        loadPaymentHistory();
        checkForOverdueLoans();
        // Initialize charts after data is loaded
        initCharts();
    });
    loadAnalytics();
    
    // Initialize table sorting
    initTableSorting();
}

// ============================================
// REAL-TIME UPDATES
// ============================================
function initRealTimeUpdates() {
    // Auto-refresh loan updates every 30 seconds
    setInterval(fetchLoanUpdates, 30000);
    
    // Show syncing indicator
    const liveIndicator = document.getElementById('liveIndicator');
    const liveStatus = document.getElementById('liveStatus');
    
    if (liveIndicator && liveStatus) {
        liveIndicator.classList.add('syncing');
        liveStatus.textContent = 'Syncing...';
        
        setTimeout(() => {
            liveIndicator.classList.remove('syncing');
            liveStatus.textContent = 'Synced';
        }, 2000);
    }
}

async function fetchLoanUpdates() {
    const liveIndicator = document.getElementById('liveIndicator');
    const liveStatus = document.getElementById('liveStatus');
    
    try {
        if (liveIndicator && liveStatus) {
            liveIndicator.classList.add('syncing');
            liveStatus.textContent = 'Syncing...';
        }
        
        // Fetch fresh data from backend API
        const response = await loanService.getAll();
        loansData = response.data || [];
        renderLoanHistory(loansData);
        
        // Also refresh statistics and charts
        await loadAnalytics();
        initCharts(); // Reinitialize charts with new data
        
        if (liveIndicator && liveStatus) {
            liveIndicator.classList.remove('syncing');
            liveStatus.textContent = 'Synced';
        }
    } catch (error) {
        console.error('Error fetching loan updates:', error);
        if (liveIndicator && liveStatus) {
            liveIndicator.classList.remove('syncing');
            liveStatus.textContent = 'Sync failed';
        }
    }
}

// Chart instances storage
let loanGrowthChart = null;
let repaymentChart = null;

// ============================================
// CHARTS (Chart.js)
// ============================================
function initCharts() {
    // Destroy existing charts before creating new ones
    if (loanGrowthChart) {
        loanGrowthChart.destroy();
        loanGrowthChart = null;
    }
    if (repaymentChart) {
        repaymentChart.destroy();
        repaymentChart = null;
    }

    // Loan Growth Chart
    const loanGrowthCtx = document.getElementById('loanGrowthChart');
    if (loanGrowthCtx) {
        // Prepare real data or use defaults
        const monthlyData = getMonthlyLoanData();
        loanGrowthChart = new Chart(loanGrowthCtx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Loans Disbursed',
                    data: monthlyData.data,
                    borderColor: '#11998e',
                    backgroundColor: 'rgba(17, 153, 142, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Repayment Trends Chart
    const repaymentCtx = document.getElementById('repaymentChart');
    if (repaymentCtx) {
        // Prepare real payment data or use defaults
        const paymentData = getMonthlyPaymentData();
        repaymentChart = new Chart(repaymentCtx, {
            type: 'bar',
            data: {
                labels: paymentData.labels,
                datasets: [{
                    label: 'Repayments Received',
                    data: paymentData.data,
                    backgroundColor: '#38ef7d',
                    borderColor: '#11998e',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Ksh ' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
}

// Helper functions to extract monthly data from loans
function getMonthlyLoanData() {
    if (!loansData || loansData.length === 0) {
        return {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            data: [0, 0, 0, 0, 0, 0]
        };
    }
    
    const monthlyCounts = {};
    const currentYear = new Date().getFullYear();
    
    loansData.forEach(loan => {
        if (loan.disbursementDate) {
            const date = new Date(loan.disbursementDate);
            if (date.getFullYear() === currentYear) {
                const month = date.toLocaleDateString('en-US', { month: 'short' });
                monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
            }
        }
    });
    
    // Get last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthName = months[monthIndex];
        last6Months.push(monthName);
        data.push(monthlyCounts[monthName] || 0);
    }
    
    return { labels: last6Months, data };
}

function getMonthlyPaymentData() {
    if (!loansData || loansData.length === 0) {
        return {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            data: [0, 0, 0, 0, 0, 0]
        };
    }
    
    const monthlyPayments = {};
    const currentYear = new Date().getFullYear();
    
    loansData.forEach(loan => {
        if (loan.payments && Array.isArray(loan.payments)) {
            loan.payments.forEach(payment => {
                if (payment.date) {
                    const date = new Date(payment.date);
                    if (date.getFullYear() === currentYear) {
                        const month = date.toLocaleDateString('en-US', { month: 'short' });
                        monthlyPayments[month] = (monthlyPayments[month] || 0) + parseFloat(payment.amount || 0);
                    }
                }
            });
        }
    });
    
    // Get last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthName = months[monthIndex];
        last6Months.push(monthName);
        data.push(monthlyPayments[monthName] || 0);
    }
    
    return { labels: last6Months, data };
}

// ============================================
// OVERDUE LOANS DETECTION & PENALTY
// ============================================

/**
 * Calculate penalty for overdue loan
 * Formula: Penalty = Balance × 1% per day × Days Overdue
 * @param {number} balance - Remaining balance
 * @param {number} daysOverdue - Number of days overdue
 * @returns {number} Penalty amount
 */
function calculatePenalty(balance, daysOverdue) {
    const dailyRate = 0.01; // 1% per day
    const penalty = balance * dailyRate * daysOverdue;
    return penalty;
}

/**
 * Check if loan is overdue and calculate days
 * @param {string|Date} dueDate - The due date of the loan
 * @returns {number} Number of days overdue (0 if not overdue)
 */
function checkOverdue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (today > due) {
        const diffTime = today - due;
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return days;
    }
    return 0;
}

/**
 * Filter to show only overdue loans
 */
function filterOverdue() {
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.value = 'overdue';
        filterLoanHistory();
    }
}

// Expose filterOverdue globally for the onclick in HTML
window.filterOverdue = filterOverdue;

// ============================================
// FILTERS & SEARCH
// ============================================
function initFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const yearFilter = document.getElementById('yearFilter');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterLoanHistory);
    }
    
    if (yearFilter) {
        yearFilter.addEventListener('change', filterLoanHistory);
    }
    
    if (dateFrom) {
        dateFrom.addEventListener('change', filterLoanHistory);
    }
    
    if (dateTo) {
        dateTo.addEventListener('change', filterLoanHistory);
    }
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterLoanHistory, 300));
    }
}

function filterLoanHistory() {
    const searchValue = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const yearFilter = document.getElementById('yearFilter')?.value || 'all';
    const dateFrom = document.getElementById('dateFrom')?.value;
    const dateTo = document.getElementById('dateTo')?.value;
    
    const tableRows = document.querySelectorAll('#loanTableBody tr');
    
    tableRows.forEach(row => {
        let showRow = true;
        
        // Search filter
        if (searchValue) {
            const text = row.textContent.toLowerCase();
            if (!text.includes(searchValue)) {
                showRow = false;
            }
        }
        
        // Status filter
        if (statusFilter !== 'all' && showRow) {
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge) {
                const status = getStatusFromBadge(statusBadge);
                if (status !== statusFilter) {
                    showRow = false;
                }
            }
        }
        
        // Year filter
        if (yearFilter !== 'all' && showRow) {
            const dateCell = row.cells[3]; // Date column
            if (dateCell) {
                const dateText = dateCell.textContent;
                const year = dateText.split(',')[1]?.trim() || '';
                if (year !== yearFilter) {
                    showRow = false;
                }
            }
        }
        
        // Date range filter
        if (dateFrom && showRow) {
            const dateCell = row.cells[3];
            if (dateCell) {
                const cellDate = new Date(dateCell.textContent);
                if (cellDate < new Date(dateFrom)) {
                    showRow = false;
                }
            }
        }
        
        if (dateTo && showRow) {
            const dateCell = row.cells[3];
            if (dateCell) {
                const cellDate = new Date(dateCell.textContent);
                if (cellDate > new Date(dateTo)) {
                    showRow = false;
                }
            }
        }
        
        row.style.display = showRow ? '' : 'none';
    });
    
    updateFilteredCount();
}

function getStatusFromBadge(badge) {
    const text = badge.textContent.toLowerCase();
    if (text.includes('progress') || text.includes('active')) return 'active';
    if (text.includes('repaid') || text.includes('paid')) return 'repaid';
    if (text.includes('overdue')) return 'overdue';
    if (text.includes('pending')) return 'pending';
    if (text.includes('approved')) return 'approved';
    if (text.includes('rejected')) return 'rejected';
    return 'all';
}

function updateFilteredCount() {
    const visibleRows = document.querySelectorAll('#loanTableBody tr:not([style*="display: none"])');
    console.log(`Showing ${visibleRows.length} loans`);
}

// ============================================
// BULK OPERATIONS
// ============================================
function initBulkOperations() {
    const headerCheckbox = document.getElementById('headerCheckbox');
    const selectAllLoans = document.getElementById('selectAllLoans');
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    const bulkApproveBtn = document.getElementById('bulkApproveBtn');
    const bulkRejectBtn = document.getElementById('bulkRejectBtn');
    const bulkExportBtn = document.getElementById('bulkExportBtn');
    
    // Header checkbox
    if (headerCheckbox) {
        headerCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('#loanTableBody .row-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
            });
            updateBulkActionsVisibility();
        });
    }
    
    // Row checkboxes
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-checkbox')) {
            updateBulkActionsVisibility();
        }
    });
    
    // Bulk actions
    if (bulkApproveBtn) {
        bulkApproveBtn.addEventListener('click', () => bulkAction('approve'));
    }
    
    if (bulkRejectBtn) {
        bulkRejectBtn.addEventListener('click', () => bulkAction('reject'));
    }
    
    if (bulkExportBtn) {
        bulkExportBtn.addEventListener('click', () => bulkAction('export'));
    }
}

function updateBulkActionsVisibility() {
    const checkboxes = document.querySelectorAll('#loanTableBody .row-checkbox:checked');
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (checkboxes.length > 0) {
        bulkActions?.classList.add('show');
        if (selectedCount) {
            selectedCount.textContent = `${checkboxes.length} selected`;
        }
    } else {
        bulkActions?.classList.remove('show');
    }
}

async function bulkAction(action) {
    const checkboxes = document.querySelectorAll('#loanTableBody .row-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(cb => {
        return cb.closest('tr').dataset.loanId;
    });
    
    if (selectedIds.length === 0) return;
    
    const confirmed = await showConfirm(`Are you sure you want to ${action} ${selectedIds.length} loan(s)?`);
    if (!confirmed) return;
    
    try {
        switch (action) {
            case 'approve':
                await Promise.all(selectedIds.map(id => loanService.approve(id)));
                showSuccessMessage(`${selectedIds.length} loans approved`);
                break;
            case 'reject':
                await Promise.all(selectedIds.map(id => loanService.reject(id)));
                showSuccessMessage(`${selectedIds.length} loans rejected`);
                break;
            case 'export':
                exportData('excel', selectedIds);
                return;
        }
        
        // Refresh data
        await fetchLoanUpdates();
    } catch (error) {
        console.error('Bulk action error:', error);
        showErrorMessage('Failed to perform bulk action');
    }
}

// ============================================
// EXPORT FUNCTIONALITY
// ============================================
function initExportDropdown() {
    const exportBtn = document.getElementById('exportBtn');
    const exportMenu = document.getElementById('exportMenu');
    
    if (exportBtn && exportMenu) {
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            exportMenu.classList.remove('show');
        });
    }
    
    // Send reminders button
    const sendRemindersBtn = document.getElementById('sendRemindersBtn');
    if (sendRemindersBtn) {
        sendRemindersBtn.addEventListener('click', sendManualReminders);
    }
    
    // Auto reminders button
    const autoRemindBtn = document.getElementById('autoRemindBtn');
    if (autoRemindBtn) {
        autoRemindBtn.addEventListener('click', toggleAutoReminders);
    }
}

function exportData(format, selectedIds = null) {
    // Call backend API (ready for integration)
    const exportEndpoint = format === 'pdf' ? API_CONFIG.endpoints.exportPdf : API_CONFIG.endpoints.exportExcel;
    
    console.log(`Exporting as ${format}`, { selectedIds });
    
    // Demo: Create export
    let content = '';
    let filename = `loans_export_${new Date().toISOString().split('T')[0]}`;
    let mimeType = 'text/plain';
    
    if (format === 'pdf') {
        showAlert('PDF export will be generated by backend', 'Information', 'info');
        return;
    } else if (format === 'excel' || format === 'csv') {
        content = 'Loan ID,Borrower,Date,Amount,Purpose,Status\n';
        content += 'LN/2025/001,John Doe,Jan 15 2025,5000,Academic Fees,Active\n';
        content += 'LN/2024/015,Jane Smith,Nov 10 2024,3000,Books,Repaid\n';
        filename += `.${format === 'excel' ? 'xlsx' : 'csv'}`;
        mimeType = format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv';
    }
    
    // Download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccessMessage(`Exported as ${format.toUpperCase()}`);
}

async function sendManualReminders() {
    const confirmed = await showConfirm('Send payment reminders to all borrowers with overdue loans?');
    if (!confirmed) return;
    
    try {
        // Call backend API
        await callAPI(API_CONFIG.endpoints.sendReminder, {
            method: 'POST',
            body: JSON.stringify({ type: 'manual' })
        });
        
        showSuccessMessage('Reminders sent successfully');
    } catch (error) {
        console.error('Error sending reminders:', error);
        showSuccessMessage('Reminders sent (Demo)');
    }
}

async function toggleAutoReminders() {
    const confirmed = await showConfirm('Enable automatic payment reminders?');
    if (!confirmed) return;
    
    try {
        // Call backend API
        callAPI(API_CONFIG.endpoints.autoReminders, {
            method: 'POST',
            body: JSON.stringify({ enabled: true })
        });
        
        showSuccessMessage('Auto-reminders enabled');
    } catch (error) {
        showSuccessMessage('Auto-reminders enabled (Demo)');
    }
}

// ============================================
// NOTIFICATION BELL
// ============================================
function initNotificationBell() {
    const bell = document.getElementById('notificationBell');
    const dropdown = document.getElementById('notificationDropdown');
    
    if (bell && dropdown) {
        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
    }
    
    // Load notifications
    loadNotifications();
}

async function loadNotifications() {
    try {
        const response = await callAPI(API_CONFIG.endpoints.notifications);
        // Update notification UI
        // updateNotificationUI(response.notifications);
    } catch (error) {
        console.log('Using demo notifications');
    }
}

// ============================================
// APPROVAL WORKFLOW
// ============================================
function initApprovalWorkflow() {
    const approveBtn = document.getElementById('approveLoanBtn');
    const rejectBtn = document.getElementById('rejectLoanBtn');
    
    if (approveBtn) {
        approveBtn.addEventListener('click', () => handleLoanAction('approve'));
    }
    
    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => handleLoanAction('reject'));
    }
}

async function handleLoanAction(action) {
    const loanId = window.currentSelectedLoanId;
    if (!loanId) return;
    
    const confirmed = await showConfirm(`Are you sure you want to ${action} this loan?`);
    if (!confirmed) return;
    
    try {
        if (action === 'approve') {
            await loanService.approve(loanId);
            showSuccessMessage('Loan approved successfully');
        } else {
            await loanService.reject(loanId);
            showSuccessMessage('Loan rejected');
        }
        
        closeLoanDetails();
        await fetchLoanUpdates();
    } catch (error) {
        console.error('Error:', error);
        showSuccessMessage(`${action === 'approve' ? 'Approved' : 'Rejected'} (Demo)`);
        closeLoanDetails();
    }
}

// ============================================
// LOAN DETAILS MODAL
// ============================================
function initModals() {
    // Close modal on overlay click
    const modal = document.getElementById('loanDetailsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLoanDetails();
            }
        });
    }
}

async function openLoanDetails(loanId) {
    window.currentSelectedLoanId = loanId;
    
    const modal = document.getElementById('loanDetailsModal');
    const content = document.getElementById('loanDetailsContent');
    
    if (!modal || !content) return;
    
    try {
        // Fetch loan details from API
        const response = await loanService.getById(loanId);
        const loan = response.success ? response.data : null;
        
        if (!loan) {
            content.innerHTML = `
                <div class="text-center" style="padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f44336; margin-bottom: 15px;"></i>
                    <p style="color: #666; font-size: 16px; margin: 0;">Loan details not found</p>
                </div>
            `;
            modal.classList.add('show');
            return;
        }
        
        const member = loan.member || {};
        const borrowerName = `${member.firstName || 'Unknown'} ${member.lastName || ''}`.trim();
        const applicationDate = loan.applicationDate ? new Date(loan.applicationDate).toLocaleDateString() : 'N/A';
        const dueDate = loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A';
        const principalAmount = loan.principalAmount ? `Ksh ${parseFloat(loan.principalAmount).toLocaleString()}` : 'Ksh 0';
        const interestAmount = loan.interestAmount ? `Ksh ${parseFloat(loan.interestAmount).toLocaleString()}` : 'Ksh 0';
        const totalAmount = loan.totalAmount ? `Ksh ${parseFloat(loan.totalAmount).toLocaleString()}` : 'Ksh 0';
        const paidAmount = loan.paidAmount ? `Ksh ${parseFloat(loan.paidAmount).toLocaleString()}` : 'Ksh 0';
        const remainingBalance = loan.remainingBalance ? `Ksh ${parseFloat(loan.remainingBalance).toLocaleString()}` : 'Ksh 0';
        const repaymentPeriod = loan.repaymentPeriod ? `${loan.repaymentPeriod} months` : 'N/A';
        const purpose = loan.purpose || 'Not specified';
        const purposeDescription = loan.purposeDescription || '';
        
        content.innerHTML = `
            <div class="loan-detail-section">
                <h4><i class="fas fa-user"></i> Borrower Information</h4>
                <div class="detail-grid">
                    <div><strong>Name:</strong> ${borrowerName}</div>
                    <div><strong>Student ID:</strong> ${member.memberNumber || 'N/A'}</div>
                    <div><strong>Phone:</strong> ${member.phone || 'N/A'}</div>
                    <div><strong>Email:</strong> ${member.email || 'N/A'}</div>
                </div>
            </div>
            
            <div class="loan-detail-section">
                <h4><i class="fas fa-money-check"></i> Loan Information</h4>
                <div class="detail-grid">
                    <div><strong>Loan ID:</strong> ${loan.loanNumber || loan.id}</div>
                    <div><strong>Amount:</strong> ${principalAmount}</div>
                    <div><strong>Interest (${loan.interestRate || 10}%):</strong> ${interestAmount}</div>
                    <div><strong>Total Due:</strong> ${totalAmount}</div>
                    <div><strong>Amount Paid:</strong> ${paidAmount}</div>
                    <div><strong>Balance:</strong> ${remainingBalance}</div>
                    <div><strong>Repayment Period:</strong> ${repaymentPeriod}</div>
                    <div><strong>Due Date:</strong> ${dueDate}</div>
                    <div><strong>Status:</strong> ${getStatusBadge(loan.status)}</div>
                    <div><strong>Purpose:</strong> ${purpose}${purposeDescription ? ` - ${purposeDescription}` : ''}</div>
                </div>
            </div>
            
            ${loan.guarantors && loan.guarantors.length > 0 ? `
            <div class="loan-detail-section">
                <h4><i class="fas fa-user-shield"></i> Guarantor Information</h4>
                <div class="detail-grid">
                    ${loan.guarantors.map(guarantor => `
                        <div><strong>Name:</strong> ${guarantor.name || 'N/A'}</div>
                        <div><strong>Student ID:</strong> ${guarantor.memberNumber || 'N/A'}</div>
                        <div><strong>Phone:</strong> ${guarantor.phone || 'N/A'}</div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            ${loan.payments && loan.payments.length > 0 ? `
            <div class="loan-detail-section">
                <h4><i class="fas fa-history"></i> Payment Timeline</h4>
                <ul class="timeline">
                    <li class="timeline-item loan-issued">
                        <div class="timeline-date">${applicationDate}</div>
                        <div class="timeline-title">Loan Issued</div>
                        <div class="timeline-detail">${principalAmount} disbursed</div>
                    </li>
                    ${loan.payments.map(payment => `
                        <li class="timeline-item payment">
                            <div class="timeline-date">${payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}</div>
                            <div class="timeline-title">Payment Received</div>
                            <div class="timeline-detail">Ksh ${parseFloat(payment.amount || 0).toLocaleString()} via ${payment.method || 'N/A'} ${payment.reference ? `(${payment.reference})` : ''}</div>
                        </li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}
            
            <div class="loan-detail-section">
                <h4><i class="fas fa-file-alt"></i> Audit Log</h4>
                <div class="audit-log">
                    <div class="audit-entry">
                        <span class="admin-name">System</span> created loan <span class="loan-id">${loan.loanNumber || loan.id}</span> 
                        at <span class="timestamp">${applicationDate}</span>
                    </div>
                    ${loan.approvalDate ? `
                    <div class="audit-entry">
                        <span class="admin-name">Admin</span> approved loan 
                        at <span class="timestamp">${new Date(loan.approvalDate).toLocaleDateString()}</span>
                    </div>
                    ` : ''}
                    ${loan.disbursementDate ? `
                    <div class="audit-entry">
                        <span class="admin-name">System</span> disbursed ${principalAmount} 
                        at <span class="timestamp">${new Date(loan.disbursementDate).toLocaleDateString()}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        modal.classList.add('show');
    } catch (error) {
        console.error('Error fetching loan details:', error);
        content.innerHTML = `
            <div class="text-center" style="padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f44336; margin-bottom: 15px;"></i>
                <p style="color: #666; font-size: 16px; margin: 0;">Error loading loan details</p>
                <p style="color: #999; font-size: 14px; margin: 5px 0 0 0;">Please try again later</p>
            </div>
        `;
        modal.classList.add('show');
    }
}

function closeLoanDetails() {
    const modal = document.getElementById('loanDetailsModal');
    if (modal) {
        modal.classList.remove('show');
    }
    window.currentSelectedLoanId = null;
}

// ============================================
// LOAD DATA
// ============================================
async function loadLoanHistory() {
    try {
        const response = await loanService.getAll();
        loansData = response.data || [];
        console.log('Loan history loaded:', loansData.length);
        renderLoanHistory(loansData);
    } catch (error) {
        console.error('Error loading loan history:', error);
        renderLoanHistory([]);
        showErrorMessage('Failed to load loan history');
    }
}

async function loadPaymentHistory() {
    try {
        // For now, extract payments from loan data
        const allPayments = [];
        loansData.forEach(loan => {
            if (loan.payments && Array.isArray(loan.payments)) {
                loan.payments.forEach(payment => {
                    allPayments.push({
                        ...payment,
                        loanId: loan.loanNumber || loan.id,
                        loanMember: loan.member?.firstName + ' ' + loan.member?.lastName
                    });
                });
            }
        });
        paymentsData = allPayments;
        console.log('Payment history loaded:', paymentsData.length);
        renderPaymentHistory(paymentsData);
    } catch (error) {
        console.error('Error loading payment history:', error);
        renderPaymentHistory([]);
    }
}

async function loadAnalytics() {
    try {
        const response = await loanService.getStatistics();
        if (response.success && response.data) {
            updateStatisticsCards(response.data);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        // Keep default values if API fails
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function renderLoanHistory(loans) {
    const tableBody = document.getElementById('loanTableBody');
    if (!tableBody) return;
    
    if (!loans || loans.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center" style="padding: 40px;">
                    <i class="fas fa-inbox" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                    <p style="color: #666; font-size: 16px; margin: 0;">No loan records found</p>
                    <p style="color: #999; font-size: 14px; margin: 5px 0 0 0;">Loan applications will appear here once submitted</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = loans.map(loan => {
        const member = loan.member || {};
        const borrowerName = `${member.firstName || 'Unknown'} ${member.lastName || ''}`.trim();
        const loanId = loan.loanNumber || loan.id || 'N/A';
        const applicationDate = loan.applicationDate ? new Date(loan.applicationDate).toLocaleDateString() : 'N/A';
        const amount = loan.principalAmount ? `Ksh ${parseFloat(loan.principalAmount).toLocaleString()}` : 'Ksh 0';
        const purpose = loan.purpose || 'Not specified';
        const repaymentPeriod = loan.repaymentPeriod ? `${loan.repaymentPeriod} months` : 'N/A';
        const status = getStatusBadge(loan.status);
        
        return `
            <tr data-loan-id="${loanId}">
                <td><input type="checkbox" class="row-checkbox"></td>
                <td>${loanId}</td>
                <td>${borrowerName}</td>
                <td>${applicationDate}</td>
                <td>${amount}</td>
                <td>${purpose}</td>
                <td>${repaymentPeriod}</td>
                <td>${status}</td>
                <td>
                    <a href="../payments/make-payment.html?category=loan&loanId=${loanId}" class="action-link">Repay</a>
                    <a href="#" class="action-link" onclick="openLoanDetails('${loanId}')">Details</a>
                    <a href="#" class="action-link" onclick="generateReceipt('${loanId}')">Receipt</a>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPaymentHistory(payments) {
    const tableBody = document.getElementById('paymentTableBody');
    if (!tableBody) return;
    
    if (!payments || payments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center" style="padding: 40px;">
                    <i class="fas fa-receipt" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                    <p style="color: #666; font-size: 16px; margin: 0;">No payment records found</p>
                    <p style="color: #999; font-size: 14px; margin: 5px 0 0 0;">Payment records will appear here once payments are made</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = payments.map(payment => {
        const paymentId = payment.id || `PMT/${Date.now()}`;
        const date = payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A';
        const amount = payment.amount ? `Ksh ${parseFloat(payment.amount).toLocaleString()}` : 'Ksh 0';
        const method = payment.method || 'N/A';
        const reference = payment.reference || payment.transactionId || 'N/A';
        const status = getStatusBadge(payment.status || 'verified');
        
        return `
            <tr>
                <td>${paymentId}</td>
                <td>${date}</td>
                <td>${payment.loanId || 'N/A'}</td>
                <td>${amount}</td>
                <td>${method}</td>
                <td>${reference}</td>
                <td>${status}</td>
                <td><a href="#" class="action-link" onclick="generatePaymentReceipt('${paymentId}')"><i class="fas fa-file-pdf"></i> Receipt</a></td>
            </tr>
        `;
    }).join('');
}

function updateStatisticsCards(stats) {
    // Update Total Loans
    const totalLoansEl = document.querySelector('.stat-card:nth-child(1) .stat-number');
    if (totalLoansEl && stats.totalLoans !== undefined) {
        totalLoansEl.textContent = stats.totalLoans;
    }
    
    // Update Fully Repaid
    const fullyRepaidEl = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (fullyRepaidEl && stats.completed !== undefined) {
        fullyRepaidEl.textContent = stats.completed;
    }
    
    // Update Active Loans
    const activeLoansEl = document.querySelector('.stat-card:nth-child(3) .stat-number');
    if (activeLoansEl && stats.active !== undefined) {
        activeLoansEl.textContent = stats.active;
    }
    
    // Update Default Rate (calculate if not provided)
    const defaultRateEl = document.querySelector('.stat-card.danger .stat-number');
    if (defaultRateEl) {
        if (stats.defaultRate !== undefined) {
            defaultRateEl.textContent = `${stats.defaultRate}%`;
        } else if (stats.totalLoans > 0) {
            const defaultRate = ((stats.overdue || 0) / stats.totalLoans * 100).toFixed(1);
            defaultRateEl.textContent = `${defaultRate}%`;
        }
    }
    
    // Update Total Disbursed
    const totalDisbursedEl = document.querySelector('.stat-card.success .stat-number');
    if (totalDisbursedEl && stats.totalDisbursed !== undefined) {
        totalDisbursedEl.textContent = `Ksh ${parseFloat(stats.totalDisbursed).toLocaleString()}`;
    }
    
    // Update Interest Earned (calculate if not provided)
    const interestEarnedEl = document.querySelector('.stat-card.info .stat-number');
    if (interestEarnedEl) {
        if (stats.interestEarned !== undefined) {
            interestEarnedEl.textContent = `Ksh ${parseFloat(stats.interestEarned).toLocaleString()}`;
        } else {
            // Calculate from loans data
            const totalInterest = loansData.reduce((sum, loan) => {
                return sum + (parseFloat(loan.interestAmount) || 0);
            }, 0);
            interestEarnedEl.textContent = `Ksh ${totalInterest.toLocaleString()}`;
        }
    }
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': '<span class="status-badge pending">Pending Approval</span>',
        'approved': '<span class="status-badge approved">Approved</span>',
        'active': '<span class="status-badge success">Active</span>',
        'completed': '<span class="status-badge success">Fully Repaid</span>',
        'overdue': '<span class="status-badge danger">Overdue</span>',
        'rejected': '<span class="status-badge danger">Rejected</span>',
        'defaulted': '<span class="status-badge danger">Defaulted</span>',
        'verified': '<span class="status-badge success">Verified</span>',
        'pending_verification': '<span class="status-badge warning">Pending</span>'
    };
    
    return statusMap[status?.toLowerCase()] || '<span class="status-badge">Unknown</span>';
}

function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert alert-danger';
    messageDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>${message}</span>`;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f8d7da;
        color: #721c24;
        padding: 15px 25px;
        border-radius: 6px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// Expose functions globally for onclick handlers
window.openLoanDetails = openLoanDetails;
window.generateReceipt = function(loanId) {
    console.log('Generate receipt for loan:', loanId);
    // TODO: Implement receipt generation
};
window.generatePaymentReceipt = function(paymentId) {
    console.log('Generate receipt for payment:', paymentId);
    // TODO: Implement payment receipt generation
};

// ============================================
// OVERDUE CHECK
// ============================================
function checkForOverdueLoans() {
    let totalOverdue = 0;
    let totalPenalty = 0;
    
    // Check actual loans data
    loansData.forEach(loan => {
        const daysOverdue = loanService.checkOverdue(loan.dueDate);
        if (daysOverdue > 0 && (loan.status === 'active' || loan.status === 'overdue')) {
            totalOverdue++;
            const remainingBalance = parseFloat(loan.remainingBalance) || (parseFloat(loan.totalAmount) - parseFloat(loan.paidAmount || 0));
            const penalty = loanService.calculatePenalty(remainingBalance, daysOverdue);
            totalPenalty += penalty;
        }
    });
    
    // Update the overdue alert
    const overdueAlert = document.getElementById('overdueAlert');
    const overdueCount = document.getElementById('overdueCount');
    const totalPenaltyEl = document.getElementById('totalPenalty');
    
    if (overdueAlert && totalOverdue > 0) {
        overdueAlert.classList.add('show');
        if (overdueCount) overdueCount.textContent = totalOverdue;
        if (totalPenaltyEl) totalPenaltyEl.textContent = `Ksh ${totalPenalty.toLocaleString()}`;
    } else if (overdueAlert) {
        overdueAlert.classList.remove('show');
    }
    
    console.log(`Overdue loans: ${totalOverdue}, Total penalty: Ksh ${totalPenalty.toLocaleString()}`);
    return { totalOverdue, totalPenalty };
}

// ============================================
// TABLE SORTING
// ============================================
function initTableSorting() {
    const table = document.getElementById('loanTableBody')?.closest('table');
    if (!table) return;
    
    const headers = table.querySelectorAll('th');
    
    headers.forEach((header, index) => {
        if (index === 0) return; // Skip checkbox column
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => sortTable(index));
        
        // Add sort indicator
        header.innerHTML += ' <i class="fas fa-sort" style="font-size: 0.8rem; color: #999;"></i>';
    });
}

function sortTable(columnIndex) {
    const table = document.getElementById('loanTableBody')?.closest('table');
    const tbody = document.getElementById('loanTableBody');
    if (!table || !tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const isAscending = table.dataset.sortDir !== 'asc';
    table.dataset.sortDir = isAscending ? 'asc' : 'desc';
    
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex]?.textContent.trim() || '';
        const bValue = b.cells[columnIndex]?.textContent.trim() || '';
        
        // Try numeric comparison
        const aNum = parseFloat(aValue.replace(/[Ksh,]/g, ''));
        const bNum = parseFloat(bValue.replace(/[Ksh,]/g, ''));
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return isAscending ? aNum - bNum : bNum - aNum;
        }
        
        return isAscending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

// ============================================
// HELPER FUNCTIONS
// ============================================
async function callAPI(endpoint, options = {}) {
    console.log(`API Call to ${endpoint}:`, options);
    // Demo response
    return { success: true };
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert alert-success';
    messageDiv.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d4edda;
        color: #155724;
        padding: 15px 25px;
        border-radius: 6px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 5000);
}

// Make functions globally available
window.openLoanDetails = openLoanDetails;
window.closeLoanDetails = closeLoanDetails;
window.exportData = exportData;

// Export for potential module use
export { initLoanHistory, filterLoanHistory };
