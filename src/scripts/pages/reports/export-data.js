/**
 * Export Data Script
 * Handles data export functionality with dynamic data from database
 */

import { reportService } from '../../../services/report-service.js';
import { memberService } from '../../../services/member-service.js';
import { eventService } from '../../../services/event-service.js';
import { formatDate } from '../../../utils/utility-functions.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Export data loaded');
    bindExportButtons();
    loadExportHistory();
});

function bindExportButtons() {
    const exportButtons = document.querySelectorAll('.export-btn');
    exportButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const type = e.target.dataset.type;
            const select = document.getElementById(`${type}Format`);
            const format = select ? select.value : 'json';
            await handleExport(type, format);
        });
    });
}

async function handleExport(type, format) {
    try {
        // Get token
        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert('Please log in to export data');
            return;
        }
        
        let data = null;
        
        switch (type) {
            case 'members':
                const membersRes = await reportService.getMembershipReport();
                data = membersRes?.success ? membersRes.data?.members : null;
                break;
            case 'contributions':
                const contribRes = await reportService.getContributionReport();
                data = contribRes?.success ? contribRes.data : null;
                break;
            case 'loans':
                const loansRes = await reportService.getLoanReport();
                data = loansRes?.success ? loansRes.data : null;
                break;
            case 'events':
                const eventsRes = await eventService.getAll();
                data = eventsRes?.success ? eventsRes.data : null;
                break;
        }
        
        if (!data) {
            alert('No data available to export');
            return;
        }
        
        // Export based on format
        exportData(data, type, format);
        
        // Add to history
        addToExportHistory(type, format);
        
    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export data: ' + error.message);
    }
}

function exportData(data, type, format) {
    let content, filename, mimeType;
    
    if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename = `${type}-export-${Date.now()}.json`;
        mimeType = 'application/json';
    } else if (format === 'csv') {
        content = convertToCSV(data);
        filename = `${type}-export-${Date.now()}.csv`;
        mimeType = 'text/csv';
    } else if (format === 'excel') {
        // For Excel, we'll use CSV with Excel-compatible formatting
        content = convertToCSV(data);
        filename = `${type}-export-${Date.now()}.csv`;
        mimeType = 'text/csv';
    }
    
    // Create download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function convertToCSV(data) {
    if (!data || !Array.isArray(data)) {
        return '';
    }
    
    // Handle both array and object data
    const items = Array.isArray(data) ? data : [data];
    if (items.length === 0) return '';
    
    // Get headers from first item
    const headers = Object.keys(items[0]);
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    items.forEach(item => {
        const values = headers.map(header => {
            const value = item[header];
            const escaped = String(value || '').replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

function addToExportHistory(type, format) {
    const tbody = document.getElementById('exportHistoryBody');
    if (!tbody) return;
    
    // Check if it's the first entry (placeholder)
    const firstRow = tbody.querySelector('tr');
    if (firstRow && firstRow.textContent.includes('No export history')) {
        tbody.innerHTML = '';
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${formatDate(new Date())}</td>
        <td>${type.charAt(0).toUpperCase() + type.slice(1)}</td>
        <td>${format.toUpperCase()}</td>
        <td><span class="status verified">Completed</span></td>
        <td><button class="btn btn-sm">Download Again</button></td>
    `;
    
    // Insert at top
    tbody.insertBefore(row, tbody.firstChild);
}

function loadExportHistory() {
    // Could load from localStorage or API in the future
    // Currently shows placeholder message
}