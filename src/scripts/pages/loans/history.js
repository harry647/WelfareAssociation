/**
 * Loan History Script
 * Handles loan history display, filtering, and interactions
 */

import { LoanService } from '../../../services/loan-service.js';

// Initialize the loan history functionality
document.addEventListener('DOMContentLoaded', () => {
    initLoanHistory();
});

function initLoanHistory() {
    // Initialize filters
    initFilters();
    
    // Load loan data
    loadLoanHistory();
    
    // Initialize table sorting
    initTableSorting();
}

function initFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const yearFilter = document.getElementById('yearFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            filterLoanHistory();
        });
    }
    
    if (yearFilter) {
        yearFilter.addEventListener('change', () => {
            filterLoanHistory();
        });
    }
}

function filterLoanHistory() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const yearFilter = document.getElementById('yearFilter')?.value || 'all';
    
    const tableRows = document.querySelectorAll('.loan-history-table tbody tr');
    
    tableRows.forEach(row => {
        let showRow = true;
        
        // Filter by status
        if (statusFilter !== 'all') {
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge) {
                const status = statusBadge.textContent.toLowerCase();
                if (statusFilter === 'active' && !status.includes('progress')) {
                    showRow = false;
                } else if (statusFilter === 'repaid' && !status.includes('repaid')) {
                    showRow = false;
                } else if (statusFilter === 'rejected' && !status.includes('rejected')) {
                    showRow = false;
                }
            }
        }
        
        // Filter by year
        if (yearFilter !== 'all' && showRow) {
            const dateCell = row.cells[1]; // Date column
            if (dateCell) {
                const dateText = dateCell.textContent;
                const year = dateText.split(',')[1]?.trim() || '';
                if (year !== yearFilter) {
                    showRow = false;
                }
            }
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

async function loadLoanHistory() {
    try {
        // In a real app, this would fetch from the loan service
        // For now, we'll use the static data in the HTML
        
        // Example of how to load dynamic data:
        // const loans = await LoanService.getLoanHistory();
        // renderLoanHistory(loans);
        
        console.log('Loan history loaded');
    } catch (error) {
        console.error('Error loading loan history:', error);
    }
}

function initTableSorting() {
    const table = document.querySelector('.loan-history-table table');
    if (!table) return;
    
    const headers = table.querySelectorAll('th');
    
    headers.forEach((header, index) => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            sortTable(index);
        });
        
        // Add sort indicator
        header.innerHTML += ' <i class="fas fa-sort" style="font-size: 0.8rem; color: #999;"></i>';
    });
}

function sortTable(columnIndex) {
    const table = document.querySelector('.loan-history-table table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Determine sort direction
    const isAscending = !table.dataset.sortDir || table.dataset.sortDir === 'desc';
    table.dataset.sortDir = isAscending ? 'asc' : 'desc';
    
    // Sort rows
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();
        
        if (isAscending) {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
        }
    });
    
    // Re-append rows
    rows.forEach(row => tbody.appendChild(row));
    
    // Update sort indicators
    updateSortIndicators(table, columnIndex);
}

function updateSortIndicators(table, activeColumn) {
    const headers = table.querySelectorAll('th');
    headers.forEach((header, index) => {
        const icon = header.querySelector('i.fa-sort, i.fa-sort-asc, i.fa-sort-desc');
        if (icon) {
            if (index === activeColumn) {
                icon.className = table.dataset.sortDir === 'asc' ? 'fas fa-sort-asc' : 'fas fa-sort-desc';
                icon.style.color = '#667eea';
            } else {
                icon.className = 'fas fa-sort';
                icon.style.color = '#999';
            }
        }
    });
}

// Export for potential module use
export { initLoanHistory, filterLoanHistory };
