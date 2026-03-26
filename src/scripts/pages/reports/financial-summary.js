/**
 * Financial Summary Script
 * Handles financial summary functionality with dynamic data from database
 */

import { reportService } from '../../../services/report-service.js';
import { contributionService } from '../../../services/contribution-service.js';
import { loanService } from '../../../services/loan-service.js';
import { formatCurrency } from '../../../utils/utility-functions.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Financial summary loaded');
    loadFinancialData();
});

async function loadFinancialData() {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.warn('No authentication token found');
            displayEmptyState();
            return;
        }

        // Fetch data from multiple sources
        const [contributionsRes, loansRes] = await Promise.all([
            reportService.getContributionReport(),
            reportService.getLoanReport()
        ]);
        
        const contributions = contributionsRes?.success ? contributionsRes.data : null;
        const loans = loansRes?.success ? loansRes.data : null;
        
        updateReportUI(contributions, loans);
    } catch (error) {
        console.error('Error loading financial data:', error);
        displayEmptyState();
    }
}

function updateReportUI(contributions, loans) {
    // Calculate totals
    const totalIncome = contributions?.summary?.totalAmount || 0;
    const totalLoansDisbursed = loans?.summary?.totalDisbursed || 0;
    
    // For expenses, we'll use a placeholder (could add expense tracking later)
    const totalExpenses = 0;
    const netBalance = totalIncome - totalExpenses;
    
    // Update summary stats
    updateStatCard('stat-number', formatCurrency(totalIncome), 0);
    updateStatCard('stat-number', formatCurrency(totalExpenses), 1);
    updateStatCard('stat-number', formatCurrency(netBalance), 2);
    updateStatCard('stat-number', formatCurrency(totalLoansDisbursed), 3);
    
    // Update breakdown table
    updateFinancialTable(totalIncome, totalExpenses, totalLoansDisbursed, loans);
}

function updateStatCard(className, value, index) {
    const cards = document.querySelectorAll(`.${className}`);
    if (cards[index]) {
        cards[index].textContent = value;
    }
}

function updateFinancialTable(totalIncome, totalExpenses, totalLoansDisbursed, loans) {
    const tbody = document.getElementById('financialTableBody');
    if (!tbody) return;
    
    const items = [
        { category: 'Total Contributions', amount: totalIncome },
        { category: 'Loans Disbursed', amount: totalLoansDisbursed },
        { category: 'Active Loans', amount: loans?.summary?.active || 0, isCount: true },
        { category: 'Pending Loans', amount: loans?.summary?.pending || 0, isCount: true }
    ];
    
    const total = totalIncome || 1; // Avoid division by zero
    
    tbody.innerHTML = items.map(item => {
        const percentage = item.isCount 
            ? '-' 
            : ((item.amount / total) * 100).toFixed(1) + '%';
        const displayAmount = item.isCount ? item.amount : formatCurrency(item.amount);
        
        return `
            <tr>
                <td>${item.category}</td>
                <td>${displayAmount}</td>
                <td>${percentage}</td>
            </tr>
        `;
    }).join('');
}

function displayEmptyState() {
    // Update summary stats to show 0
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(el => {
        el.textContent = formatCurrency(0);
    });
    
    // Update table to show empty message
    const tbody = document.getElementById('financialTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 20px;">
                    No financial data found.
                </td>
            </tr>
        `;
    }
}