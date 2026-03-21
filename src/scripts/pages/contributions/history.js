/**
 * Contribution History Script
 * Handles contribution history display and filtering
 */

import { ContributionService } from '../../../services/contribution-service.js';

// Initialize contribution history functionality
document.addEventListener('DOMContentLoaded', () => {
    initContributionHistory();
});

function initContributionHistory() {
    // Initialize filters
    initFilters();
    
    // Initialize trend chart interactions
    initTrendChart();
    
    // Load contribution data
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
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            filterContributions();
        });
    }
}

function filterContributions() {
    const typeFilter = document.getElementById('typeFilter')?.value || 'all';
    const yearFilter = document.getElementById('yearFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    
    const tableRows = document.querySelectorAll('.contributions-table tbody tr');
    
    tableRows.forEach(row => {
        let showRow = true;
        
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
}

function updateSummary() {
    const visibleRows = Array.from(document.querySelectorAll('.contributions-table tbody tr'))
        .filter(row => row.style.display !== 'none');
    
    let totalAmount = 0;
    let totalContributions = visibleRows.length;
    
    visibleRows.forEach(row => {
        const amountCell = row.cells[3];
        if (amountCell) {
            const amountText = amountCell.textContent.replace(/[^0-9]/g, '');
            totalAmount += parseInt(amountText) || 0;
        }
    });
    
    // Update the summary display if elements exist
    const totalAmountEl = document.querySelector('.summary-card:nth-child(2) .stat-number');
    const totalCountEl = document.querySelector('.summary-card:first-child .stat-number');
    
    if (totalAmountEl) {
        totalAmountEl.textContent = `Ksh ${totalAmount.toLocaleString()}`;
    }
    if (totalCountEl) {
        totalCountEl.textContent = totalContributions.toString();
    }
}

function initTrendChart() {
    const trendBars = document.querySelectorAll('.trend-bar');
    
    trendBars.forEach(bar => {
        bar.addEventListener('mouseenter', () => {
            const month = bar.dataset.month;
            const amount = bar.dataset.amount;
            
            // Show tooltip (you could implement a custom tooltip here)
            console.log(`${month}: Ksh ${amount}`);
        });
    });
}

async function loadContributionHistory() {
    try {
        // In a real app, this would fetch from the contribution service
        // For now, we'll use the static data in the HTML
        
        // Example of how to load dynamic data:
        // const contributions = await ContributionService.getContributionHistory();
        // renderContributions(contributions);
        
        console.log('Contribution history loaded');
    } catch (error) {
        console.error('Error loading contribution history:', error);
    }
}

// Export for potential module use
export { initContributionHistory, filterContributions };
