/**
 * Loans Report Script
 * Handles loans report functionality with dynamic data from database
 */

import { reportService } from '../../../services/report-service.js';
import { formatCurrency, formatDate } from '../../../utils/utility-functions.js';
import { APP_CONFIG } from '../../../config/app-config.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Loans report loaded');
    loadLoansData();
});

async function loadLoansData() {
    try {
        // Get token from localStorage
        const token = localStorage.getItem(APP_CONFIG.storageKeys.authToken);
        if (!token) {
            console.warn('No authentication token found');
            displayEmptyState();
            return;
        }

        // Fetch loans report data from API
        const response = await reportService.getLoanReport();
        
        if (response && response.success) {
            updateReportUI(response.data);
        } else {
            console.warn('Failed to fetch loans data:', response?.message || 'Unknown error');
            displayEmptyState();
        }
    } catch (error) {
        console.error('Error loading loans report:', error);
        displayEmptyState();
    }
}

function updateReportUI(data) {
    // Update summary stats
    const summary = data?.summary || {};
    
    // Total Applications
    updateStatCard('stat-number', summary.total || 0, 0);
    
    // Find approved count
    const approvedEl = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (approvedEl) {
        approvedEl.textContent = summary.approved || 0;
    }
    
    // Find pending count
    const pendingEl = document.querySelector('.stat-card:nth-child(3) .stat-number');
    if (pendingEl) {
        pendingEl.textContent = summary.pending || 0;
    }
    
    // Find total disbursed
    const disbursedEl = document.querySelector('.stat-card:nth-child(4) .stat-number');
    if (disbursedEl) {
        disbursedEl.textContent = formatCurrency(summary.totalDisbursed || 0);
    }
    
    // Update table
    const loans = data?.loans || [];
    updateLoansTable(loans);
}

function updateStatCard(className, value, index) {
    const cards = document.querySelectorAll(`.${className}`);
    if (cards[index]) {
        cards[index].textContent = value;
    }
}

function updateLoansTable(loans) {
    const tbody = document.querySelector('.report-table tbody');
    if (!tbody) return;
    
    if (!loans || loans.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">
                    No loan records found. Apply for a loan to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = loans.map(loan => {
        const member = loan.member || {};
        const memberName = member.firstName && member.lastName 
            ? `${member.firstName} ${member.lastName}` 
            : 'Unknown Member';
            
        const statusClass = getStatusClass(loan.status);
        
        return `
            <tr>
                <td>${formatDate(loan.createdAt)}</td>
                <td>${memberName}</td>
                <td>${formatCurrency(loan.principalAmount || 0)}</td>
                <td>${loan.purpose || 'N/A'}</td>
                <td><span class="status ${statusClass}">${loan.status || 'Unknown'}</span></td>
            </tr>
        `;
    }).join('');
}

function getStatusClass(status) {
    const statusMap = {
        'approved': 'approved',
        'active': 'approved',
        'pending': 'pending',
        'rejected': 'rejected',
        'repaid': 'repaid'
    };
    return statusMap[status?.toLowerCase()] || 'pending';
}

function displayEmptyState() {
    // Update summary stats to show 0
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(el => {
        el.textContent = '0';
    });
    
    // Update table to show empty message
    const tbody = document.querySelector('.report-table tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">
                    No loan records found. Apply for a loan to get started.
                </td>
            </tr>
        `;
    }
}
