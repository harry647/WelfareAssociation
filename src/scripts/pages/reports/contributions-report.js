/**
 * Contributions Report Script
 * Handles contributions report functionality with dynamic data from database
 */

import { reportService } from '../../../services/report-service.js';
import { formatCurrency, formatDate } from '../../../utils/utility-functions.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Contributions report loaded');
    loadContributionsData();
});

async function loadContributionsData() {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('swa_auth_token') || localStorage.getItem('accessToken');
        if (!token) {
            console.warn('No authentication token found');
            displayEmptyState();
            return;
        }

        // Fetch contributions report data from API
        const response = await reportService.getContributionReport();
        
        if (response && response.success) {
            updateReportUI(response.data);
        } else {
            console.warn('Failed to fetch contributions data:', response?.message || 'Unknown error');
            displayEmptyState();
        }
    } catch (error) {
        console.error('Error loading contributions report:', error);
        displayEmptyState();
    }
}

function updateReportUI(data) {
    // Update summary stats
    const summary = data?.summary || {};
    
    // Total Contributors
    updateStatCard('stat-number', summary.total || 0, 0);
    
    // Find total collected
    const totalCollectedEl = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (totalCollectedEl) {
        totalCollectedEl.textContent = formatCurrency(summary.totalAmount || 0);
    }
    
    // Find this month (we'll use totalAmount as approximation for now)
    const thisMonthEl = document.querySelector('.stat-card:nth-child(3) .stat-number');
    if (thisMonthEl) {
        thisMonthEl.textContent = formatCurrency(summary.totalAmount || 0);
    }
    
    // Find average
    const averageEl = document.querySelector('.stat-card:nth-child(4) .stat-number');
    if (averageEl) {
        averageEl.textContent = formatCurrency(summary.averageAmount || 0);
    }
    
    // Update table
    const contributions = data?.contributions || [];
    updateContributionsTable(contributions);
}

function updateStatCard(className, value, index) {
    const cards = document.querySelectorAll(`.${className}`);
    if (cards[index]) {
        cards[index].textContent = value;
    }
}

function updateContributionsTable(contributions) {
    const tbody = document.querySelector('.report-table tbody');
    if (!tbody) return;
    
    if (!contributions || contributions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">
                    No contribution records found. Make a contribution to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = contributions.map(contribution => {
        const member = contribution.member || {};
        const memberName = member.firstName && member.lastName 
            ? `${member.firstName} ${member.lastName}` 
            : 'Unknown Member';
            
        const statusClass = getStatusClass(contribution.status);
        
        return `
            <tr>
                <td>${formatDate(contribution.paymentDate || contribution.createdAt)}</td>
                <td>${memberName}</td>
                <td>${contribution.type || 'Monthly'}</td>
                <td>${formatCurrency(contribution.amount || 0)}</td>
                <td><span class="status ${statusClass}">${contribution.status || 'Unknown'}</span></td>
            </tr>
        `;
    }).join('');
}

function getStatusClass(status) {
    const statusMap = {
        'completed': 'verified',
        'pending': 'pending',
        'failed': 'rejected',
        'refunded': 'rejected'
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
                    No contribution records found. Make a contribution to get started.
                </td>
            </tr>
        `;
    }
}
