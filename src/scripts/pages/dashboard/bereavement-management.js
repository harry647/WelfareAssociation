/**
 * Bereavement Management Admin Page Script
 * Handles creating and managing bereavement support cases
 */

import { bereavementService, memberService } from '../../../services/index.js';
import { formatCurrency, formatDate, showNotification, showConfirm, showAlert } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';

// Make functions available globally for inline onclick handlers
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.showNotification = showNotification;

// State
let bereavementCases = [];
let members = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for components to load
    setTimeout(async () => {
        initializeSidebar();
        initializeHeader();
        await loadMembers();
        await loadBereavementCases();
        initializeEventListeners();
    }, 100);
});

function initializeSidebar() {
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            const target = document.getElementById('section-' + section);
            if (target) target.classList.add('active');
        });
    });

    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            if (sidebar) sidebar.classList.toggle('active');
            if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            if (sidebar) sidebar.classList.remove('active');
            this.classList.remove('active');
        });
    }
}

function initializeHeader() {
    const logoutBtn = document.getElementById('headerLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('swa_auth_token');
            sessionStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_user');
            sessionStorage.removeItem('swa_user');
            window.location.replace('../../../pages/auth/login-page.html');
        });
    }
}

async function loadMembers() {
    try {
        const response = await memberService.getAllMembers({ limit: 500 });
        members = response.data || response || [];
        
        const memberSelect = document.getElementById('memberSelect');
        if (memberSelect && members.length > 0) {
            memberSelect.innerHTML = '<option value="">Select a member...</option>' + 
                members.map(m => `<option value="${m.id}">${m.firstName} ${m.lastName} (${m.studentId || m.memberNumber || 'N/A'})</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

async function loadBereavementCases() {
    const tbody = document.getElementById('casesTableBody');
    const emptyState = document.getElementById('emptyState');
    
    try {
        const response = await bereavementService.getAll();
        bereavementCases = response.data || response || [];
        
        updateStats();
        
        if (bereavementCases.length === 0) {
            if (tbody) tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            if (tbody) tbody.parentElement.style.display = 'none';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        if (tbody) tbody.parentElement.style.display = 'block';
        renderCases();
        
    } catch (error) {
        console.error('Error loading bereavement cases:', error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="no-data-message" style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 12px;"></i>
                <p>Failed to load bereavement cases</p>
            </td></tr>`;
        }
    }
}

function updateStats() {
    const totalCases = bereavementCases.length;
    const activeCases = bereavementCases.filter(c => c.status === 'active').length;
    const totalRaised = bereavementCases.reduce((sum, c) => sum + (parseFloat(c.totalContributions) || 0), 0);
    
    // Count unique contributors
    const contributors = new Set();
    bereavementCases.forEach(c => {
        if (c.contributions && Array.isArray(c.contributions)) {
            c.contributions.forEach(contrib => {
                if (contrib.contributorName) contributors.add(contrib.contributorName);
            });
        }
    });
    const totalSupporters = contributors.size;
    
    const totalCasesEl = document.getElementById('totalCases');
    const activeCasesEl = document.getElementById('activeCases');
    const totalRaisedEl = document.getElementById('totalRaised');
    const totalSupportersEl = document.getElementById('totalSupporters');
    
    if (totalCasesEl) totalCasesEl.textContent = totalCases;
    if (activeCasesEl) activeCasesEl.textContent = activeCases;
    if (totalRaisedEl) totalRaisedEl.textContent = formatCurrency(totalRaised);
    if (totalSupportersEl) totalSupportersEl.textContent = totalSupporters;
}

function renderCases() {
    const tbody = document.getElementById('casesTableBody');
    if (!tbody) return;
    
    // Get member data for each case
    tbody.innerHTML = bereavementCases.map(c => {
        const member = members.find(m => m.id === c.memberId);
        const memberName = member ? `${member.firstName} ${member.lastName}` : 'Unknown';
        const studentId = member?.studentId || member?.memberNumber || 'N/A';
        
        const deceased = c.deceased || {};
        const deceasedName = deceased.name || 'N/A';
        const relationship = deceased.relationship || 'N/A';
        const dateOfDeath = deceased.dateOfDeath ? formatDate(deceased.dateOfDeath) : 'N/A';
        
        const statusClass = c.status === 'active' ? 'received' : c.status === 'pending' ? 'pending' : 'closed';
        const statusLabel = c.status === 'active' ? 'Active' : c.status === 'pending' ? 'Pending' : 'Closed';
        
        const amountRaised = formatCurrency(parseFloat(c.totalContributions) || 0);
        
        return `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 14px 12px; color: var(--text-primary); font-weight: 500;">
                    <div>${memberName}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${studentId}</div>
                </td>
                <td style="padding: 14px 12px; color: var(--text-secondary);">${deceasedName}</td>
                <td style="padding: 14px 12px; color: var(--text-secondary); text-transform: capitalize;">${relationship}</td>
                <td style="padding: 14px 12px; color: var(--text-secondary);">${dateOfDeath}</td>
                <td style="padding: 14px 12px;">
                    <span class="status ${statusClass}" style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 500; background: ${statusClass === 'received' ? 'rgba(34, 197, 94, 0.12)' : statusClass === 'pending' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(107, 114, 128, 0.12)'}; color: ${statusClass === 'received' ? '#28a745' : statusClass === 'pending' ? '#f59e0b' : '#6b7280'};">${statusLabel}</span>
                </td>
                <td style="padding: 14px 12px; color: var(--success-color, #28a745); font-weight: 600;">${amountRaised}</td>
                <td style="padding: 14px 12px;">
                    <button class="btn btn-sm" onclick="viewCase('${c.id}')" style="padding: 6px 12px; font-size: 12px; background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm" onclick="deleteCase('${c.id}')" style="padding: 6px 12px; font-size: 12px; background: transparent; color: #ef4444; border: 1px solid #ef4444; border-radius: 4px; cursor: pointer; margin-left: 4px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function initializeEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = bereavementCases.filter(c => {
                const member = members.find(m => m.id === c.memberId);
                const memberName = member ? `${member.firstName} ${member.lastName}`.toLowerCase() : '';
                const deceased = c.deceased || {};
                return memberName.includes(query) || 
                       (deceased.name || '').toLowerCase().includes(query) ||
                       (deceased.relationship || '').toLowerCase().includes(query);
            });
            renderFilteredCases(filtered);
        });
    }
    
    // Add Case Modal
    const addCaseBtn = document.getElementById('addCaseBtn');
    const addFirstCaseBtn = document.getElementById('addFirstCaseBtn');
    const addCaseModal = document.getElementById('addCaseModal');
    const closeAddModal = document.getElementById('closeAddModal');
    const cancelAddBtn = document.getElementById('cancelAddBtn');
    const addCaseForm = document.getElementById('addCaseForm');
    
    const openModal = () => {
        const modal = document.getElementById('addCaseModal');
        if (modal) modal.style.display = 'flex';
    };
    
    const closeModal = () => {
        const modal = document.getElementById('addCaseModal');
        if (modal) modal.style.display = 'none';
    };
    
    if (addCaseBtn) addCaseBtn.addEventListener('click', openModal);
    if (addFirstCaseBtn) addFirstCaseBtn.addEventListener('click', openModal);
    if (closeAddModal) closeAddModal.addEventListener('click', closeModal);
    if (cancelAddBtn) cancelAddBtn.addEventListener('click', closeModal);
    
    if (addCaseModal) {
        addCaseModal.addEventListener('click', (e) => {
            if (e.target === addCaseModal) closeModal();
        });
    }
    
    if (addCaseForm) {
        addCaseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitNewCase();
        });
    }
}

async function submitNewCase() {
    const memberSelect = document.getElementById('memberSelect');
    const deceasedName = document.getElementById('deceasedName');
    const relationship = document.getElementById('relationship');
    const dateOfDeath = document.getElementById('dateOfDeath');
    const dateOfBurial = document.getElementById('dateOfBurial');
    const caseNotes = document.getElementById('caseNotes');
    
    const memberId = memberSelect.value;
    if (!memberId) {
        showNotification('Please select a member', 'error');
        return;
    }
    
    const caseData = {
        memberId: memberId,
        deceased: {
            name: deceasedName.value,
            relationship: relationship.value,
            dateOfDeath: dateOfDeath.value,
            dateOfBurial: dateOfBurial.value
        },
        notes: caseNotes.value,
        status: 'pending'
    };
    
    console.log('Submitting bereavement case:', caseData);
    
    try {
        const result = await bereavementService.createCase(caseData);
        console.log('Bereavement created:', result);
        showNotification('Bereavement case created successfully', 'success');
        
        // Close modal and reload
        const addCaseModal = document.getElementById('addCaseModal');
        if (addCaseModal) addCaseModal.style.display = 'none';
        
        // Reset form
        document.getElementById('addCaseForm').reset();
        
        // Reload cases
        await loadBereavementCases();
        
    } catch (error) {
        console.error('Error creating bereavement case:', error);
        showNotification('Failed to create bereavement case: ' + (error.message || 'Unknown error'), 'error');
    }
}

function renderFilteredCases(filteredCases) {
    const tbody = document.getElementById('casesTableBody');
    if (!tbody) return;
    
    if (filteredCases.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="no-data-message" style="text-align: center; padding: 40px; color: var(--text-muted);">
            <i class="fas fa-search" style="font-size: 24px; margin-bottom: 12px;"></i>
            <p>No cases match your search</p>
        </td></tr>`;
        return;
    }
    
    tbody.innerHTML = filteredCases.map(c => {
        const member = members.find(m => m.id === c.memberId);
        const memberName = member ? `${member.firstName} ${member.lastName}` : 'Unknown';
        const studentId = member?.studentId || member?.memberNumber || 'N/A';
        
        const deceased = c.deceased || {};
        const deceasedName = deceased.name || 'N/A';
        const relationship = deceased.relationship || 'N/A';
        const dateOfDeath = deceased.dateOfDeath ? formatDate(deceased.dateOfDeath) : 'N/A';
        
        const statusClass = c.status === 'active' ? 'received' : c.status === 'pending' ? 'pending' : 'closed';
        const statusLabel = c.status === 'active' ? 'Active' : c.status === 'pending' ? 'Pending' : 'Closed';
        
        const amountRaised = formatCurrency(parseFloat(c.totalContributions) || 0);
        
        return `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 14px 12px; color: var(--text-primary); font-weight: 500;">
                    <div>${memberName}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${studentId}</div>
                </td>
                <td style="padding: 14px 12px; color: var(--text-secondary);">${deceasedName}</td>
                <td style="padding: 14px 12px; color: var(--text-secondary); text-transform: capitalize;">${relationship}</td>
                <td style="padding: 14px 12px; color: var(--text-secondary);">${dateOfDeath}</td>
                <td style="padding: 14px 12px;">
                    <span class="status ${statusClass}" style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 500; background: ${statusClass === 'received' ? 'rgba(34, 197, 94, 0.12)' : statusClass === 'pending' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(107, 114, 128, 0.12)'}; color: ${statusClass === 'received' ? '#28a745' : statusClass === 'pending' ? '#f59e0b' : '#6b7280'};">${statusLabel}</span>
                </td>
                <td style="padding: 14px 12px; color: var(--success-color, #28a745); font-weight: 600;">${amountRaised}</td>
                <td style="padding: 14px 12px;">
                    <button class="btn btn-sm" onclick="viewCase('${c.id}')" style="padding: 6px 12px; font-size: 12px; background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm" onclick="deleteCase('${c.id}')" style="padding: 6px 12px; font-size: 12px; background: transparent; color: #ef4444; border: 1px solid #ef4444; border-radius: 4px; cursor: pointer; margin-left: 4px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Make functions available globally for onclick handlers
window.viewCase = function(caseId) {
    const caseData = bereavementCases.find(c => c.id === caseId);
    if (!caseData) return;
    
    const member = members.find(m => m.id === caseData.memberId);
    const deceased = caseData.deceased || {};
    
    const message = `Bereavement Case Details\n\n` +
        `Member: ${member ? `${member.firstName} ${member.lastName}` : 'Unknown'}\n` +
        `Student ID: ${member?.studentId || member?.memberNumber || 'N/A'}\n\n` +
        `Deceased: ${deceased.name || 'N/A'}\n` +
        `Relationship: ${deceased.relationship || 'N/A'}\n` +
        `Date of Death: ${deceased.dateOfDeath ? formatDate(deceased.dateOfDeath) : 'N/A'}\n` +
        `Date of Burial: ${deceased.dateOfBurial ? formatDate(deceased.dateOfBurial) : 'N/A'}\n\n` +
        `Status: ${caseData.status}\n` +
        `Amount Raised: ${formatCurrency(parseFloat(caseData.totalContributions) || 0)}\n\n` +
        `Notes: ${caseData.notes || 'None'}`;
    
    showAlert(message, 'Bereavement Case Details', 'info');
};

window.deleteCase = async function(caseId) {
    if (!await showConfirm('Are you sure you want to delete this bereavement case? This action cannot be undone.')) {
        return;
    }
    
    try {
        await bereavementService.deleteCase(caseId);
        showNotification('Bereavement case deleted successfully', 'success');
        await loadBereavementCases();
    } catch (error) {
        console.error('Error deleting bereavement case:', error);
        showNotification('Failed to delete bereavement case', 'error');
    }
};
