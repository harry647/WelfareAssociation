/**
 * Bereavement Report Script
 * Handles bereavement report functionality with dynamic data from database
 */

import { reportService } from '../../../services/report-service.js';
import { bereavementService } from '../../../services/bereavement-service.js';
import { formatCurrency, formatDate } from '../../../utils/utility-functions.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Bereavement report loaded');
    loadBereavementData();
    initializeFilters();
    initializeForms();
});

async function loadBereavementData() {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.warn('No authentication token found');
            displayEmptyState();
            return;
        }

        // Fetch bereavement report data from API
        const response = await reportService.getBereavementReport();
        
        if (response && response.success) {
            updateReportUI(response.data);
        } else {
            console.warn('Failed to fetch bereavement data:', response?.message || 'Unknown error');
            displayEmptyState();
        }
    } catch (error) {
        console.error('Error loading bereavement report:', error);
        displayEmptyState();
    }
}

function updateReportUI(data) {
    // Update summary stats
    const summary = data?.summary || {};
    
    // Total Cases
    const totalCasesEl = document.getElementById('totalCases');
    if (totalCasesEl) {
        totalCasesEl.textContent = summary.total || 0;
    }
    
    // Total Raised
    const totalRaisedEl = document.getElementById('totalRaised');
    if (totalCasesEl) {
        totalRaisedEl.textContent = summary.total > 0 ? formatCurrency(summary.totalContributions || 0) : 'No funds raised yet';
    }
    
    // Total Contributors
    const totalContributorsEl = document.getElementById('totalContributors');
    if (totalContributorsEl) {
        totalContributorsEl.textContent = summary.totalContributors || 0;
    }
    
    // Support Rate
    const supportRateEl = document.getElementById('supportRate');
    if (supportRateEl) {
        const rate = summary.total > 0 ? Math.round(((summary.active || 0) / summary.total) * 100) : 0;
        supportRateEl.textContent = rate > 0 ? `${rate}%` : 'N/A';
    }
    
    // Update cards
    const cases = data?.cases || [];
    updateBereavementCards(cases);
    
    // Update table
    updateCasesTable(cases);
    
    // Update breakdown
    updateBreakdown(cases);
    
    // Update beneficiary dropdown
    updateBeneficiaryDropdown(cases);
    
    // Update case select dropdown
    updateCaseSelectDropdown(cases);
}

function updateBereavementCards(cases) {
    const container = document.getElementById('bereavementCards');
    if (!container) return;
    
    // Clear existing cards
    container.innerHTML = '';
    
    if (!cases || cases.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; width: 100%; color: #666;">
                <i class="fas fa-heart" style="font-size: 48px; margin-bottom: 16px; color: #ccc;"></i>
                <p>No bereavement cases found.</p>
            </div>
        `;
        return;
    }
    
    // Generate cards for each case
    cases.forEach(caseItem => {
        const card = createBereavementCard(caseItem);
        container.appendChild(card);
    });
}

function createBereavementCard(caseItem) {
    const card = document.createElement('div');
    card.className = 'bereavement-card';
    card.dataset.id = caseItem.id;
    card.dataset.name = `${caseItem.member?.firstName || ''} ${caseItem.member?.lastName || ''}`.trim();
    card.dataset.type = caseItem.deathType || 'other';
    card.dataset.status = caseItem.status || 'active';
    
    const member = caseItem.member || {};
    const memberName = member.firstName && member.lastName 
        ? `${member.firstName} ${member.lastName}` 
        : 'Unknown Member';
    
    const memberNumber = member.memberNumber || 'N/A';
    const statusClass = caseItem.status === 'urgent' ? 'urgent-type' : '';
    const urgentBadge = caseItem.status === 'urgent' ? '<span class="urgent">Urgent</span>' : '';
    
    const targetAmount = caseItem.targetAmount || 0;
    const totalContributions = caseItem.totalContributions || 0;
    const progress = targetAmount > 0 ? (totalContributions / targetAmount * 100) : 0;
    const progressPercent = Math.min(progress, 100).toFixed(0);
    
    const contributorsCount = caseItem.contributorCount || 0;
    
    card.innerHTML = `
        <div class="card-header">
            <span class="date"><i class="fas fa-calendar"></i> ${formatDate(caseItem.createdAt)}</span>
            <span class="type death ${statusClass}">${caseItem.deathType || 'Loss of Family Member'}</span>
        </div>
        <div class="card-body">
            <h3>${memberName} ${urgentBadge}</h3>
            <p class="student-id">${memberNumber}</p>
            <p class="description">${caseItem.description || 'No description available.'}</p>
            
            <!-- Progress Bar -->
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress" style="width: ${progressPercent}%;"></div>
                </div>
                <p class="progress-text">${progressPercent}% of ${targetAmount > 0 ? formatCurrency(targetAmount) : 'No target set'} target</p>
            </div>
            
            <!-- M-Pesa Box -->
            <div class="mpesa-box">
                <h4><i class="fas fa-mobile-alt"></i> Lipa na M-Pesa</h4>
                <p>Paybill: <strong>123456</strong></p>
                <p>Account: <strong>${memberName.replace(/\s/g, '')}</strong></p>
            </div>
        </div>
        <div class="card-footer">
            <span class="supporters"><i class="fas fa-users"></i> ${contributorsCount} supporter${contributorsCount !== 1 ? 's' : ''}</span>
            <span class="amount-raised"><i class="fas fa-money-bill-wave"></i> ${totalContributions > 0 ? formatCurrency(totalContributions) : 'No funds raised'} raised</span>
        </div>
        <div class="card-actions">
            <button class="btn btn-secondary view-details-btn" data-id="${caseItem.id}">
                <i class="fas fa-info-circle"></i> View Details
            </button>
            <button class="btn btn-primary quick-contribute-btn" data-id="${caseItem.id}" data-name="${memberName}">
                <i class="fas fa-hand-holding-heart"></i> Support ${memberName.split(' ')[0]}
            </button>
        </div>
    `;
    
    return card;
}

function updateCasesTable(cases) {
    const tableBody = document.getElementById('casesTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!cases || cases.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px;">No bereavement cases found</td>
            </tr>
        `;
        return;
    }
    
    cases.forEach(caseItem => {
        const member = caseItem.member || {};
        const memberName = member.firstName && member.lastName 
            ? `${member.firstName} ${member.lastName}` 
            : 'Unknown Member';
        const memberNumber = member.memberNumber || 'N/A';
        
        const statusLabel = caseItem.status === 'urgent' ? 'Urgent' : 
                           caseItem.status === 'active' ? 'Active Support' : 
                           caseItem.status === 'closed' ? 'Completed' : 'Unknown';
        const statusClass = caseItem.status === 'urgent' ? 'urgent' : 
                           caseItem.status === 'active' ? 'active' : 
                           caseItem.status === 'closed' ? 'closed' : '';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(caseItem.createdAt)}</td>
            <td>${memberName}</td>
            <td>${memberNumber}</td>
            <td>${caseItem.deathType || 'Loss of Family Member'}</td>
            <td>${caseItem.contributorCount || 0}</td>
            <td>${caseItem.totalContributions > 0 ? formatCurrency(caseItem.totalContributions) : 'Ksh 0'}</td>
            <td><span class="status ${statusClass}">${statusLabel}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function updateBreakdown(cases) {
    const breakdownContainer = document.querySelector('.breakdown-cards');
    if (!breakdownContainer) return;
    
    // Calculate breakdown by type
    const typeStats = {};
    
    if (cases && cases.length > 0) {
        cases.forEach(caseItem => {
            const type = caseItem.deathType || 'Other';
            if (!typeStats[type]) {
                typeStats[type] = { count: 0, amount: 0 };
            }
            typeStats[type].count++;
            typeStats[type].amount += caseItem.totalContributions || 0;
        });
    }
    
    // Build type labels
    const typeLabels = {
        'parent': 'Loss of Parent',
        'sibling': 'Loss of Sibling',
        'guardian': 'Loss of Guardian',
        'other': 'Other'
    };
    
    if (Object.keys(typeStats).length === 0) {
        breakdownContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <p>No bereavement types recorded.</p>
            </div>
        `;
        return;
    }
    
    breakdownContainer.innerHTML = '';
    
    Object.entries(typeStats).forEach(([type, stats]) => {
        const displayType = typeLabels[type] || type;
        const card = document.createElement('div');
        card.className = 'breakdown-card';
        card.innerHTML = `
            <i class="fas fa-user-friends"></i>
            <h3>${displayType}</h3>
            <p class="count">${stats.count} case${stats.count !== 1 ? 's' : ''}</p>
            <p class="amount">${stats.amount > 0 ? formatCurrency(stats.amount) : 'No funds raised'}</p>
        `;
        breakdownContainer.appendChild(card);
    });
}

function updateBeneficiaryDropdown(cases) {
    const select = document.getElementById('beneficiarySelect');
    if (!select) return;
    
    // Keep first option (placeholder)
    select.innerHTML = '<option value="">Select Member</option>';
    
    if (!cases || cases.length === 0) {
        select.innerHTML += '<option value="" disabled>No members available</option>';
        return;
    }
    
    cases.forEach(caseItem => {
        const member = caseItem.member || {};
        const memberName = member.firstName && member.lastName 
            ? `${member.firstName} ${member.lastName}` 
            : 'Unknown Member';
        
        const option = document.createElement('option');
        option.value = caseItem.id;
        option.textContent = memberName;
        select.appendChild(option);
    });
}

function updateCaseSelectDropdown(cases) {
    const select = document.getElementById('caseSelect');
    if (!select) return;
    
    // Keep first option (placeholder)
    select.innerHTML = '<option value="">Select Case</option>';
    
    if (!cases || cases.length === 0) {
        select.innerHTML += '<option value="" disabled>No cases available</option>';
        return;
    }
    
    cases.forEach(caseItem => {
        const member = caseItem.member || {};
        const memberName = member.firstName && member.lastName 
            ? `${member.firstName} ${member.lastName}` 
            : 'Unknown Member';
        
        const type = caseItem.deathType || 'Loss of Family Member';
        
        const option = document.createElement('option');
        option.value = caseItem.id;
        option.textContent = `${memberName} - ${type}`;
        select.appendChild(option);
    });
}

function initializeFilters() {
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterCards);
    }
    if (typeFilter) {
        typeFilter.addEventListener('change', filterCards);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterCards);
    }
}

function filterCards() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    const cards = document.querySelectorAll('.bereavement-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
        const name = card.dataset.name?.toLowerCase() || '';
        const type = card.dataset.type || '';
        const status = card.dataset.status || '';
        
        const matchesSearch = name.includes(searchTerm);
        const matchesType = !typeFilter || type === typeFilter;
        const matchesStatus = !statusFilter || status === statusFilter;
        
        if (matchesSearch && matchesType && matchesStatus) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    const noResults = document.getElementById('noResults');
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'flex' : 'none';
    }
}

function initializeForms() {
    // Condolence form
    const condolenceForm = document.getElementById('condolenceForm');
    if (condolenceForm) {
        condolenceForm.addEventListener('submit', handleCondolenceSubmit);
    }
    
    // Document upload form
    const documentUploadForm = document.getElementById('documentUploadForm');
    if (documentUploadForm) {
        documentUploadForm.addEventListener('submit', handleDocumentUpload);
    }
}

async function handleCondolenceSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const contributorName = form.querySelector('#contributorName')?.value;
    const beneficiaryId = form.querySelector('#beneficiarySelect')?.value;
    const message = form.querySelector('#condolenceMessage')?.value;
    const anonymous = form.querySelector('#anonymousCheck')?.checked;
    
    if (!beneficiaryId) {
        alert('Please select a member');
        return;
    }
    
    alert('This feature requires backend API support for messages. Please contact administrator.');
    // Note: The backend currently doesn't have an endpoint for adding messages to bereavement cases.
    // Messages are stored in the bereavement.messages JSON field but there's no POST endpoint.
    // Form data: contributorName, beneficiaryId, message, anonymous
}

async function handleDocumentUpload(e) {
    e.preventDefault();
    
    const form = e.target;
    const caseId = form.querySelector('#caseSelect')?.value;
    const documentType = form.querySelector('#documentType')?.value;
    const documentFile = form.querySelector('#documentFile')?.files[0];
    
    if (!caseId || !documentType || !documentFile) {
        alert('Please fill all fields');
        return;
    }
    
    alert('This feature requires backend API support for document uploads. Please contact administrator.');
    // Note: The backend currently doesn't have an endpoint for uploading documents to bereavement cases.
    // Form data: caseId, documentType, documentFile
}

function displayEmptyState() {
    // Update summary to show 0
    const totalCasesEl = document.getElementById('totalCases');
    if (totalCasesEl) totalCasesEl.textContent = '0';
    
    const totalRaisedEl = document.getElementById('totalRaised');
    if (totalRaisedEl) totalRaisedEl.textContent = 'No funds raised yet';
    
    const totalContributorsEl = document.getElementById('totalContributors');
    if (totalContributorsEl) totalContributorsEl.textContent = '0';
    
    const supportRateEl = document.getElementById('supportRate');
    if (supportRateEl) supportRateEl.textContent = 'N/A';
    
    // Clear cards
    const cardsContainer = document.getElementById('bereavementCards');
    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; width: 100%; color: #666;">
                <i class="fas fa-heart" style="font-size: 48px; margin-bottom: 16px; color: #ccc;"></i>
                <p>No bereavement cases found.</p>
            </div>
        `;
    }
    
    // Clear table
    const tableBody = document.getElementById('casesTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px;">No bereavement cases found</td>
            </tr>
        `;
    }
    
    // Clear breakdown
    const breakdownContainer = document.querySelector('.breakdown-cards');
    if (breakdownContainer) {
        breakdownContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <p>No bereavement types recorded.</p>
            </div>
        `;
    }
    
    // Clear dropdowns
    const beneficiarySelect = document.getElementById('beneficiarySelect');
    if (beneficiarySelect) {
        beneficiarySelect.innerHTML = '<option value="">Select Member</option><option value="" disabled>No members available</option>';
    }
    
    const caseSelect = document.getElementById('caseSelect');
    if (caseSelect) {
        caseSelect.innerHTML = '<option value="">Select Case</option><option value="" disabled>No cases available</option>';
    }
}
