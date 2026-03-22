/**
 * Loan History Script
 * Handles loan history display, filtering, analytics, and interactions
 * Ready for backend API integration
 */

import { loanService } from '../../../services/loan-service.js';

// API Configuration - Ready for backend integration
const API_CONFIG = {
    baseUrl: '/api',
    endpoints: {
        loans: '/loans',
        loanDetails: '/loans/:id',
        loanApprove: '/loans/:id/approve',
        loanReject: '/loans/:id/reject',
        payments: '/payments',
        paymentVerify: '/payments/verify',
        sendReminder: '/reminders/send',
        autoReminders: '/reminders/auto',
        exportPdf: '/export/pdf',
        exportExcel: '/export/excel',
        auditLog: '/audit/log',
        notifications: '/notifications',
        analytics: '/analytics/loans'
    }
};

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
    initCharts();
    initFilters();
    initSearch();
    initBulkOperations();
    initExportDropdown();
    initNotificationBell();
    initApprovalWorkflow();
    initModals();
    
    // Load data
    loadLoanHistory();
    loadPaymentHistory();
    loadAnalytics();
    checkForOverdueLoans();
    
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
        
        // Call backend API (ready for integration)
        const response = await callAPI(API_CONFIG.endpoints.loans);
        
        // Update UI with new data
        // renderLoanHistory(response.loans);
        
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

// ============================================
// CHARTS (Chart.js)
// ============================================
function initCharts() {
    // Loan Growth Chart
    const loanGrowthCtx = document.getElementById('loanGrowthChart');
    if (loanGrowthCtx) {
        new Chart(loanGrowthCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Loans Disbursed',
                    data: [5, 8, 12, 15, 18, 22],
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
        new Chart(repaymentCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Repayments Received',
                    data: [15000, 18000, 22000, 25000, 28000, 32000],
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
    
    const confirmed = confirm(`Are you sure you want to ${action} ${selectedIds.length} loan(s)?`);
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
        alert('PDF export will be generated by backend');
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
    const confirmed = confirm('Send payment reminders to all borrowers with overdue loans?');
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

function toggleAutoReminders() {
    const confirmed = confirm('Enable automatic payment reminders?');
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
    
    const confirmed = confirm(`Are you sure you want to ${action} this loan?`);
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

function openLoanDetails(loanId) {
    window.currentSelectedLoanId = loanId;
    
    const modal = document.getElementById('loanDetailsModal');
    const content = document.getElementById('loanDetailsContent');
    
    if (!modal || !content) return;
    
    // Populate with demo data
    content.innerHTML = `
        <div class="loan-detail-section">
            <h4><i class="fas fa-user"></i> Borrower Information</h4>
            <div class="detail-grid">
                <div><strong>Name:</strong> John Doe</div>
                <div><strong>Student ID:</strong> JOO/2024/001</div>
                <div><strong>Phone:</strong> +254712345678</div>
                <div><strong>Email:</strong> john.doe@student.joust.ac.ke</div>
            </div>
        </div>
        
        <div class="loan-detail-section">
            <h4><i class="fas fa-money-check"></i> Loan Information</h4>
            <div class="detail-grid">
                <div><strong>Loan ID:</strong> ${loanId}</div>
                <div><strong>Amount:</strong> Ksh 5,000</div>
                <div><strong>Interest (5%):</strong> Ksh 250</div>
                <div><strong>Total Due:</strong> Ksh 5,250</div>
                <div><strong>Amount Paid:</strong> Ksh 2,000</div>
                <div><strong>Balance:</strong> Ksh 3,250</div>
                <div><strong>Repayment Period:</strong> 3 months</div>
                <div><strong>Due Date:</strong> March 25, 2025</div>
            </div>
        </div>
        
        <div class="loan-detail-section">
            <h4><i class="fas fa-user-shield"></i> Guarantor Information</h4>
            <div class="detail-grid">
                <div><strong>Name:</strong> Jane Smith</div>
                <div><strong>Student ID:</strong> JOO/2024/002</div>
                <div><strong>Phone:</strong> +254723456789</div>
            </div>
        </div>
        
        <div class="loan-detail-section">
            <h4><i class="fas fa-history"></i> Payment Timeline</h4>
            <ul class="timeline">
                <li class="timeline-item loan-issued">
                    <div class="timeline-date">Jan 15, 2025</div>
                    <div class="timeline-title">Loan Issued</div>
                    <div class="timeline-detail">Ksh 5,000 disbursed via M-Pesa</div>
                </li>
                <li class="timeline-item payment">
                    <div class="timeline-date">Feb 15, 2025</div>
                    <div class="timeline-title">Payment Received</div>
                    <div class="timeline-detail">Ksh 1,000 via M-Pesa (MPO123456789)</div>
                </li>
                <li class="timeline-item payment">
                    <div class="timeline-date">Feb 28, 2025</div>
                    <div class="timeline-title">Payment Received</div>
                    <div class="timeline-detail">Ksh 1,000 via M-Pesa (MPO987654321)</div>
                </li>
            </ul>
        </div>
        
        <div class="loan-detail-section">
            <h4><i class="fas fa-file-alt"></i> M-Pesa Transactions</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Disbursement</td>
                        <td>MPO111111111</td>
                        <td>Ksh 5,000</td>
                        <td><span class="status-badge success">Completed</span></td>
                    </tr>
                    <tr>
                        <td>Payment</td>
                        <td>MPO123456789</td>
                        <td>Ksh 1,000</td>
                        <td><span class="status-badge success">Verified</span></td>
                    </tr>
                    <tr>
                        <td>Payment</td>
                        <td>MPO987654321</td>
                        <td>Ksh 1,000</td>
                        <td><span class="status-badge success">Verified</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="loan-detail-section">
            <h4><i class="fas fa-history"></i> Audit Log</h4>
            <div class="audit-log">
                <div class="audit-entry">
                    <span class="admin-name">Admin</span> created loan <span class="loan-id">${loanId}</span> 
                    at <span class="timestamp">Jan 15, 2025 10:32 AM</span>
                </div>
                <div class="audit-entry">
                    <span class="admin-name">System</span> disbursed Ksh 5,000 
                    at <span class="timestamp">Jan 15, 2025 10:35 AM</span>
                </div>
                <div class="audit-entry">
                    <span class="admin-name">System</span> received payment Ksh 1,000 
                    at <span class="timestamp">Feb 15, 2025 2:15 PM</span>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
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
    } catch (error) {
        console.error('Error loading loan history:', error);
    }
}

async function loadPaymentHistory() {
    try {
        const response = await loanService.getPaymentHistory();
        paymentsData = response.data || [];
        console.log('Payment history loaded:', paymentsData.length);
    } catch (error) {
        console.error('Error loading payment history:', error);
    }
}

async function loadAnalytics() {
    try {
        const response = await callAPI(API_CONFIG.endpoints.analytics);
        // Update analytics UI
    } catch (error) {
        console.log('Using demo analytics');
    }
}

// ============================================
// OVERDUE CHECK
// ============================================
function checkForOverdueLoans() {
    // In production, this would come from the API
    const overdueCount = 2;
    const overdueAlert = document.getElementById('overdueAlert');
    const overdueMessage = document.getElementById('overdueMessage');
    
    if (overdueCount > 0 && overdueAlert && overdueMessage) {
        overdueAlert.style.display = 'flex';
        overdueMessage.textContent = `⚠️ ${overdueCount} loan(s) are overdue`;
    }
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

function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert alert-error';
    messageDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>${message}</span>`;
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
    setTimeout(() => messageDiv.remove(), 5000);
}

// Make functions globally available
window.openLoanDetails = openLoanDetails;
window.closeLoanDetails = closeLoanDetails;
window.exportData = exportData;

// Export for potential module use
export { initLoanHistory, filterLoanHistory };
