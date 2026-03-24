/**
 * Contribution History Script
 * Handles contribution history display and filtering - Dynamic from Database
 */

import { contributionService } from '../../../services/index.js';
import { formatDate } from '../../../utils/utility-functions.js';

// Store contributions data globally for filtering
let contributionsData = [];

// Initialize contribution history functionality
document.addEventListener('DOMContentLoaded', () => {
    initContributionHistory();
    initLogout();
});

function initLogout() {
    const logoutBtn = document.querySelector('.logout-btn-header');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.clear();
                localStorage.removeItem('swa_auth_token');
                localStorage.removeItem('swa_refresh_token');
                localStorage.removeItem('swa_user');
                window.location.href = '../../index.html';
            }
        });
    }
}

function initContributionHistory() {
    // Initialize filters
    initFilters();
    
    // Initialize trend chart interactions
    initTrendChart();
    
    // Load contribution data from API
    loadContributionHistory();
}

function initFilters() {
    const typeFilter = document.getElementById('typeFilter');
    const yearFilter = document.getElementById('yearFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            filterContributions();
        });
    }
    
    if (yearFilter) {
        yearFilter.addEventListener('change', () => {
            filterContributions();
            updateYearFilterOptions();
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            filterContributions();
        });
    }
}

function updateYearFilterOptions() {
    const yearFilter = document.getElementById('yearFilter');
    if (!yearFilter || contributionsData.length === 0) return;
    
    // Extract unique years from data
    const years = new Set();
    contributionsData.forEach(contribution => {
        if (contribution.createdAt) {
            const year = new Date(contribution.createdAt).getFullYear();
            years.add(year);
        }
    });
    
    // Sort years descending
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    
    // Keep the "All Years" option and update the rest
    const currentValue = yearFilter.value;
    const options = yearFilter.querySelectorAll('option');
    
    // Remove all years except the first (All Years)
    for (let i = options.length - 1; i > 0; i--) {
        yearFilter.removeChild(options[i]);
    }
    
    // Add years
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
    
    // Restore selection if still valid
    if (sortedYears.includes(parseInt(currentValue))) {
        yearFilter.value = currentValue;
    }
}

function filterContributions() {
    const typeFilter = document.getElementById('typeFilter')?.value || 'all';
    const yearFilter = document.getElementById('yearFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    
    const tableRows = document.querySelectorAll('.contributions-table tbody tr');
    
    tableRows.forEach(row => {
        let showRow = true;
        
        // Skip message rows
        if (row.querySelector('td[colspan]')) {
            return;
        }
        
        // Filter by type
        if (typeFilter !== 'all') {
            const typeCell = row.cells[2]; // Type column
            if (typeCell) {
                const type = typeCell.textContent.toLowerCase();
                if (!type.includes(typeFilter)) {
                    showRow = false;
                }
            }
        }
        
        // Filter by year
        if (yearFilter !== 'all' && showRow) {
            const dateCell = row.cells[0]; // Date column
            if (dateCell) {
                const dateText = dateCell.textContent;
                const year = dateText.split(',')[1]?.trim() || '';
                if (year !== yearFilter) {
                    showRow = false;
                }
            }
        }
        
        // Filter by status
        if (statusFilter !== 'all' && showRow) {
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge) {
                const status = statusBadge.textContent.toLowerCase();
                if (statusFilter === 'verified' && !status.includes('verified')) {
                    showRow = false;
                } else if (statusFilter === 'pending' && !status.includes('pending')) {
                    showRow = false;
                }
            }
        }
        
        row.style.display = showRow ? '' : 'none';
    });
    
    // Update summary based on filtered results
    updateSummary();
    updateTrendChart();
}

function updateSummary() {
    // Get currently displayed (non-hidden) rows
    const visibleRows = Array.from(document.querySelectorAll('.contributions-table tbody tr'))
        .filter(row => row.style.display !== 'none' && !row.querySelector('td[colspan]'));
    
    let totalAmount = 0;
    let totalContributions = visibleRows.length;
    
    visibleRows.forEach(row => {
        const amountCell = row.cells[3];
        if (amountCell) {
            const amountText = amountCell.textContent.replace(/[^0-9]/g, '');
            totalAmount += parseInt(amountText) || 0;
        }
    });
    
    // Update the summary display with filtered results
    const totalAmountEl = document.getElementById('totalAmount');
    const totalCountEl = document.getElementById('totalContributions');
    const thisMonthEl = document.getElementById('thisMonthAmount');
    
    if (totalAmountEl) {
        totalAmountEl.textContent = totalAmount > 0 ? `Ksh ${totalAmount.toLocaleString()}` : 'Ksh 0';
    }
    if (totalCountEl) {
        totalCountEl.textContent = totalContributions.toString();
    }
    
    // Calculate this month from the original data
    const thisMonth = new Date();
    const monthAmount = contributionsData
        .filter(c => {
            const created = new Date(c.createdAt);
            return created.getMonth() === thisMonth.getMonth() && 
                   created.getFullYear() === thisMonth.getFullYear();
        })
        .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    
    if (thisMonthEl) {
        thisMonthEl.textContent = monthAmount > 0 ? `Ksh ${monthAmount.toLocaleString()}` : 'Ksh 0';
    }
}

function initTrendChart() {
    const trendBars = document.querySelectorAll('.trend-bar');
    
    trendBars.forEach(bar => {
        bar.addEventListener('mouseenter', () => {
            const month = bar.dataset.month;
            const amount = bar.dataset.amount;
            console.log(`${month}: Ksh ${amount}`);
        });
    });
}

function updateTrendChart() {
    const visibleRows = Array.from(document.querySelectorAll('.contributions-table tbody tr'))
        .filter(row => row.style.display !== 'none' && !row.querySelector('td[colspan]'));
    
    // Group by month
    const monthlyData = {};
    const monthMap = { 'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 
                       'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12 };
    
    visibleRows.forEach(row => {
        const dateCell = row.cells[0];
        if (dateCell) {
            const dateText = dateCell.textContent;
            const monthMatch = dateText.match(/(\w+)\s+(\d{4})/);
            if (monthMatch) {
                const month = monthMatch[1];
                const amountCell = row.cells[3];
                const amount = parseInt(amountCell.textContent.replace(/[^0-9]/g, '')) || 0;
                monthlyData[month] = (monthlyData[month] || 0) + amount;
            }
        }
    });
    
    // Update chart bars
    const trendBars = document.querySelectorAll('.trend-bar');
    const amounts = Object.values(monthlyData);
    const maxAmount = amounts.length > 0 ? Math.max(...amounts, 1) : 1;
    
    trendBars.forEach(bar => {
        const month = bar.dataset.month;
        const amount = monthlyData[month] || 0;
        const height = maxAmount > 0 ? (amount / maxAmount) * 100 : 5;
        bar.querySelector('.bar').style.height = `${Math.max(height, 5)}%`;
        bar.dataset.amount = amount;
    });
}

async function loadContributionHistory() {
    const tableBody = document.getElementById('contributions-history-table');
    
    try {
        // Fetch contributions from API
        const response = await contributionService.getAll();
        
        // Handle API response structure
        contributionsData = response.data || response || [];
        
        if (contributionsData.length > 0) {
            renderContributions(contributionsData);
            updateSummary();
            updateTrendChart();
            updateYearFilterOptions();
            updateBreakdownSection();
        } else {
            // No data found - show message and initialize with zeros
            showNoDataMessage();
            initializeEmptyState();
        }
        
    } catch (error) {
        console.error('Error loading contribution history:', error);
        // Show error message and initialize with zeros
        showNoDataMessage();
        initializeEmptyState();
    }
}

function showNoDataMessage() {
    const tableBody = document.getElementById('contributions-history-table');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 30px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 40px; margin-bottom: 10px;"></i>
                    <p>No contributions found in the database</p>
                    <p style="font-size: 12px; color: #999;">Add contributions to see them here</p>
                </td>
            </tr>
        `;
    }
}

function initializeEmptyState() {
    // Initialize summary with zeros
    const totalAmountEl = document.getElementById('totalAmount');
    const totalCountEl = document.getElementById('totalContributions');
    const thisMonthEl = document.getElementById('thisMonthAmount');
    const memberSinceEl = document.getElementById('memberSince');
    
    if (totalAmountEl) totalAmountEl.textContent = 'Ksh 0';
    if (totalCountEl) totalCountEl.textContent = '0';
    if (thisMonthEl) thisMonthEl.textContent = 'Ksh 0';
    if (memberSinceEl) memberSinceEl.textContent = 'N/A';
    
    // Initialize breakdown with zeros
    updateBreakdownEmpty();
    
    // Update year filter
    updateYearFilterOptions();
}

function updateBreakdownEmpty() {
    const monthlyAmount = document.getElementById('monthlyAmount');
    const monthlyCount = document.getElementById('monthlyCount');
    const monthlyBar = document.getElementById('monthlyBar');
    const welfareAmount = document.getElementById('welfareAmount');
    const welfareCount = document.getElementById('welfareCount');
    const welfareBar = document.getElementById('welfareBar');
    const emergencyAmount = document.getElementById('emergencyAmount');
    const emergencyCount = document.getElementById('emergencyCount');
    const emergencyBar = document.getElementById('emergencyBar');
    
    if (monthlyAmount) monthlyAmount.textContent = 'Ksh 0';
    if (monthlyCount) monthlyCount.textContent = '0 contributions';
    if (monthlyBar) monthlyBar.style.width = '0%';
    
    if (welfareAmount) welfareAmount.textContent = 'Ksh 0';
    if (welfareCount) welfareCount.textContent = '0 contributions';
    if (welfareBar) welfareBar.style.width = '0%';
    
    if (emergencyAmount) emergencyAmount.textContent = 'Ksh 0';
    if (emergencyCount) emergencyCount.textContent = '0 contributions';
    if (emergencyBar) emergencyBar.style.width = '0%';
}

function updateBreakdownSection() {
    // Group contributions by type
    const typeGroups = {
        monthly: { total: 0, count: 0 },
        welfare: { total: 0, count: 0 },
        emergency: { total: 0, count: 0 },
        special: { total: 0, count: 0 },
        voluntary: { total: 0, count: 0 },
        registration: { total: 0, count: 0 },
        event: { total: 0, count: 0 }
    };
    
    let grandTotal = 0;
    
    contributionsData.forEach(contribution => {
        const amount = parseFloat(contribution.amount) || 0;
        grandTotal += amount;
        
        const type = contribution.type || 'other';
        if (!typeGroups[type]) {
            typeGroups[type] = { total: 0, count: 0 };
        }
        typeGroups[type].total += amount;
        typeGroups[type].count += 1;
    });
    
    // Map types to display elements
    const monthlyData = typeGroups.monthly || { total: 0, count: 0 };
    const welfareData = (typeGroups.welfare || typeGroups.special || { total: 0, count: 0 });
    const emergencyData = typeGroups.emergency || { total: 0, count: 0 };
    
    // Update Monthly
    const monthlyAmountEl = document.getElementById('monthlyAmount');
    const monthlyCountEl = document.getElementById('monthlyCount');
    const monthlyBarEl = document.getElementById('monthlyBar');
    
    if (monthlyAmountEl) monthlyAmountEl.textContent = `Ksh ${monthlyData.total.toLocaleString()}`;
    if (monthlyCountEl) monthlyCountEl.textContent = `${monthlyData.count} contribution${monthlyData.count !== 1 ? 's' : ''}`;
    if (monthlyBarEl) monthlyBarEl.style.width = grandTotal > 0 ? `${(monthlyData.total / grandTotal) * 100}%` : '0%';
    
    // Update Welfare (combine special/welfare types)
    const welfareTotal = (typeGroups.welfare?.total || 0) + (typeGroups.special?.total || 0);
    const welfareCountTotal = (typeGroups.welfare?.count || 0) + (typeGroups.special?.count || 0);
    
    const welfareAmountEl = document.getElementById('welfareAmount');
    const welfareCountEl = document.getElementById('welfareCount');
    const welfareBarEl = document.getElementById('welfareBar');
    
    if (welfareAmountEl) welfareAmountEl.textContent = `Ksh ${welfareTotal.toLocaleString()}`;
    if (welfareCountEl) welfareCountEl.textContent = `${welfareCountTotal} contribution${welfareCountTotal !== 1 ? 's' : ''}`;
    if (welfareBarEl) welfareBarEl.style.width = grandTotal > 0 ? `${(welfareTotal / grandTotal) * 100}%` : '0%';
    
    // Update Emergency
    const emergencyAmountEl = document.getElementById('emergencyAmount');
    const emergencyCountEl = document.getElementById('emergencyCount');
    const emergencyBarEl = document.getElementById('emergencyBar');
    
    if (emergencyAmountEl) emergencyAmountEl.textContent = `Ksh ${emergencyData.total.toLocaleString()}`;
    if (emergencyCountEl) emergencyCountEl.textContent = `${emergencyData.count} contribution${emergencyData.count !== 1 ? 's' : ''}`;
    if (emergencyBarEl) emergencyBarEl.style.width = grandTotal > 0 ? `${(emergencyData.total / grandTotal) * 100}%` : '0%';
}

function renderContributions(contributions) {
    const tableBody = document.getElementById('contributions-history-table');
    
    if (!tableBody) {
        console.error('Table body not found!');
        return;
    }
    
    if (!contributions || contributions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 30px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 40px; margin-bottom: 10px;"></i>
                    <p>No contributions found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    console.log('Rendering contributions:', contributions.length);
    
    tableBody.innerHTML = contributions.map(contribution => {
        const date = formatDate(contribution.createdAt);
        // Map database type values to display value
        const typeDisplay = contribution.type === 'monthly' ? 'Monthly' : 
                           contribution.type === 'special' ? 'Special' :
                           contribution.type === 'registration' ? 'Registration' :
                           contribution.type === 'voluntary' ? 'Voluntary' :
                           contribution.type === 'fine' ? 'Fine' : 
                           contribution.type === 'welfare' ? 'Welfare' :
                           contribution.type === 'emergency' ? 'Emergency' :
                           contribution.type === 'event' ? 'Event' : 
                           contribution.type || 'Other';
        
        // Map database status values to display values
        const statusClass = contribution.status === 'completed' ? 'success' : 
                           contribution.status === 'pending' ? 'warning' : 
                           contribution.status === 'failed' ? 'danger' : 
                           contribution.status === 'refunded' ? 'info' : 'warning';
        const statusText = contribution.status === 'completed' ? 'Verified' : 
                         contribution.status === 'pending' ? 'Pending' : 
                         contribution.status === 'failed' ? 'Failed' : 
                         contribution.status === 'refunded' ? 'Refunded' : 
                         contribution.status || 'Unknown';
        
        // Format payment method for display
        const methodDisplay = contribution.paymentMethod === 'mpesa' ? 'M-Pesa' :
                             contribution.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                             contribution.paymentMethod === 'cash' ? 'Cash' :
                             contribution.paymentMethod === 'cheque' ? 'Cheque' :
                             contribution.paymentMethod === 'online' ? 'Online' : 
                             contribution.paymentMethod || 'N/A';
        
        return `
            <tr>
                <td>${date}</td>
                <td>${contribution.receiptNumber || contribution.contributionNumber || 'N/A'}</td>
                <td>${typeDisplay}</td>
                <td>Ksh ${parseFloat(contribution.amount || 0).toLocaleString()}</td>
                <td>${methodDisplay}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td><a href="#" class="action-link" onclick="viewContribution('${contribution.id}')">View</a></td>
            </tr>
        `;
    }).join('');
}

// Global function for viewing contribution details
window.viewContribution = function(contributionId) {
    console.log('Viewing contribution:', contributionId);
    // Could open a modal or navigate to details page
    alert(`Viewing contribution: ${contributionId}`);
};

// Export for potential module use
export { initContributionHistory, filterContributions, loadContributionHistory };
