/**
 * Members Report Script
 * Handles members report functionality with dynamic data from database
 */

import { reportService } from '../../../services/report-service.js';
import { formatCurrency, formatDate } from '../../../utils/utility-functions.js';
import { APP_CONFIG } from '../../../config/app-config.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Members report loaded');
    loadMembersData();
});

async function loadMembersData() {
    try {
        // Get token from localStorage
        const token = localStorage.getItem(APP_CONFIG.storageKeys.authToken);
        if (!token) {
            console.warn('No authentication token found');
            displayEmptyState();
            return;
        }

        // Fetch membership report data from API
        const response = await reportService.getMembershipReport();
        
        if (response && response.success) {
            updateReportUI(response.data);
        } else {
            console.warn('Failed to fetch members data:', response?.message || 'Unknown error');
            displayEmptyState();
        }
    } catch (error) {
        console.error('Error loading members report:', error);
        displayEmptyState();
    }
}

function updateReportUI(data) {
    // Update summary stats
    const summary = data?.summary || {};
    
    // Total Members
    updateStatCard('stat-number', summary.total || 0, 0);
    
    // Find active members
    const activeEl = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (activeEl) {
        activeEl.textContent = summary.active || 0;
    }
    
    // Find inactive members
    const inactiveEl = document.querySelector('.stat-card:nth-child(3) .stat-number');
    if (inactiveEl) {
        inactiveEl.textContent = summary.inactive || 0;
    }
    
    // For new this month, we'll calculate from the members list
    const newThisMonthEl = document.querySelector('.stat-card:nth-child(4) .stat-number');
    if (newThisMonthEl) {
        const members = data?.members || [];
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const newCount = members.filter(m => {
            const created = new Date(m.createdAt);
            return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
        }).length;
        newThisMonthEl.textContent = newCount;
    }
    
    // Update table
    const members = data?.members || [];
    updateMembersTable(members);
}

function updateStatCard(className, value, index) {
    const cards = document.querySelectorAll(`.${className}`);
    if (cards[index]) {
        cards[index].textContent = value;
    }
}

function updateMembersTable(members) {
    const tbody = document.querySelector('.report-table tbody');
    if (!tbody) return;
    
    if (!members || members.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">
                    No member records found.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = members.map(member => {
        const statusClass = getStatusClass(member.membershipStatus);
        
        return `
            <tr>
                <td>${formatDate(member.createdAt)}</td>
                <td>${member.firstName || ''} ${member.lastName || ''}</td>
                <td>${member.memberNumber || 'N/A'}</td>
                <td>${member.email || 'N/A'}</td>
                <td><span class="status ${statusClass}">${member.membershipStatus || 'Unknown'}</span></td>
            </tr>
        `;
    }).join('');
}

function getStatusClass(status) {
    const statusMap = {
        'active': 'verified',
        'inactive': 'rejected',
        'pending': 'pending',
        'suspended': 'rejected'
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
                    No member records found.
                </td>
            </tr>
        `;
    }
}