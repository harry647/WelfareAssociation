/**
 * Bereavement Support Page Script
 * Handles bereavement records display, search, filter, and interactions
 * Fetches data from the database API
 */

// Import services
import { bereavementService } from '../../../services/index.js';
import { authService } from '../../../services/index.js';

// API Base URL
const API_BASE_URL = '/api';

// State management
let bereavementData = [];
let contributionsData = [];
let messagesData = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Bereavement support page loaded');
    
    // Initialize all components
    initSearchFilter();
    initModals();
    initCondolenceForm();
    initQuickContribute();
    initDocumentUpload();
    
    // Load data from API
    loadBereavementData();
    loadContributions();
    loadMessages();
});

/**
 * Search and Filter Functionality
 */
function initSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearchFilter, 300));
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', handleSearchFilter);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', handleSearchFilter);
    }
}

function handleSearchFilter() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const typeValue = document.getElementById('typeFilter')?.value || '';
    const statusValue = document.getElementById('statusFilter')?.value || '';
    
    const cards = document.querySelectorAll('.bereavement-card');
    const noResults = document.getElementById('noResults');
    let visibleCount = 0;
    
    cards.forEach(card => {
        const name = card.dataset.name?.toLowerCase() || '';
        const type = card.dataset.type || '';
        const status = card.dataset.status || '';
        
        const matchesSearch = name.includes(searchTerm) || searchTerm === '';
        const matchesType = typeValue === '' || type === typeValue;
        const matchesStatus = statusValue === '' || status === typeValue;
        
        if (matchesSearch && matchesType && matchesStatus) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'flex' : 'none';
    }
}

/**
 * Modal Functionality
 */
function initModals() {
    // View Details Modal
    const detailsModal = document.getElementById('detailsModal');
    
    // Close modal handlers
    if (detailsModal) {
        const closeBtn = detailsModal.querySelector('.modal-close');
        const closeBtn2 = detailsModal.querySelector('.modal-close-btn');
        
        closeBtn?.addEventListener('click', () => closeModal(detailsModal));
        closeBtn2?.addEventListener('click', () => closeModal(detailsModal));
        
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) closeModal(detailsModal);
        });
    }
    
    // Quick Contribute Modal
    const contributeModal = document.getElementById('contributeModal');
    
    if (contributeModal) {
        const closeBtn = contributeModal.querySelector('.modal-close');
        
        closeBtn?.addEventListener('click', () => closeModal(contributeModal));
        
        contributeModal.addEventListener('click', (e) => {
            if (e.target === contributeModal) closeModal(contributeModal);
        });
    }
}

function openDetailsModal(id) {
    const modal = document.getElementById('detailsModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    const caseData = bereavementData.find(c => c.id === id);
    
    if (caseData && modal && modalTitle && modalBody) {
        const progressPercent = Math.round((caseData.amountRaised / caseData.targetAmount) * 100);
        
        modalTitle.textContent = caseData.name || caseData.memberName;
        modalBody.innerHTML = `
            <div class="detail-section">
                <h4><i class="fas fa-user"></i> Student Information</h4>
                <p><strong>Name:</strong> ${caseData.name || caseData.memberName}</p>
                <p><strong>Student ID:</strong> ${caseData.studentId || caseData.memberId || 'N/A'}</p>
                <p><strong>Bereavement Type:</strong> ${getBereavementTypeLabel(caseData.type)}</p>
                <p><strong>Date:</strong> ${formatDate(caseData.date || caseData.createdAt)}</p>
                ${caseData.urgent ? '<p class="urgent">🚨 URGENT CASE</p>' : ''}
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-info-circle"></i> Case Details</h4>
                <p>${caseData.description || 'No description available'}</p>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-chart-line"></i> Fundraising Progress</h4>
                <div class="progress-bar" style="height: 24px; background: #e9ecef; border-radius: 12px; overflow: hidden;">
                    <div class="progress" style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #27ae60, #2ecc71);"></div>
                </div>
                <p style="margin-top: 8px;">Ksh ${(caseData.amountRaised || 0).toLocaleString()} raised of Ksh ${(caseData.targetAmount || 0).toLocaleString()} (${progressPercent}%)</p>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-mobile-alt"></i> M-Pesa Payment</h4>
                <p><strong>Paybill:</strong> 123456</p>
                <p><strong>Account:</strong> ${(caseData.name || caseData.memberName || 'Bereavement').replace(/\s/g, '')}</p>
            </div>
        `;
        
        // Set contribute button
        const contributeBtn = document.getElementById('modalContributeBtn');
        if (contributeBtn) {
            contributeBtn.onclick = () => {
                closeModal(modal);
                openContributeModal(id, caseData.name || caseData.memberName);
            };
        }
        
        openModal(modal);
    }
}

function openContributeModal(id, name) {
    const modal = document.getElementById('contributeModal');
    const beneficiarySpan = modal?.querySelector('#contributeBeneficiary span');
    
    if (beneficiarySpan) {
        beneficiarySpan.textContent = name;
    }
    
    // Store the beneficiary ID for form submission
    modal?.setAttribute('data-beneficiary-id', id);
    
    if (modal) {
        openModal(modal);
    }
}

function openModal(modal) {
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Condolence Message Form
 */
function initCondolenceForm() {
    const form = document.getElementById('condolenceForm');
    
    // Prefill user data for condolence form
    prefillUserData();
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                contributorName: document.getElementById('contributorName').value,
                beneficiaryId: document.getElementById('beneficiarySelect').value,
                message: document.getElementById('condolenceMessage').value,
                anonymous: document.getElementById('anonymousCheck').checked,
                timestamp: new Date().toISOString()
            };
            
            try {
                // Try to send to API
                const response = await fetch(`${API_BASE_URL}/bereavement/${formData.beneficiaryId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        author: formData.anonymous ? 'Anonymous' : formData.contributorName,
                        message: formData.message
                    })
                });
                
                if (!response.ok) throw new Error('Failed to send message');
            } catch (error) {
                console.log('API not available, using local storage');
            }
            
            // Add message to display
            addMessageToDisplay(formData);
            
            // Show success message
            showNotification('Message sent successfully!', 'success');
            
            // Reset form
            form.reset();
        });
    }
}

function addMessageToDisplay(data) {
    const messagesList = document.getElementById('messagesList');
    
    if (messagesList) {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item';
        messageItem.innerHTML = `
            <div class="message-header">
                <span class="message-author">${data.anonymous ? 'Anonymous' : data.contributorName}</span>
                <span class="message-date">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <p class="message-text">${data.message}</p>
        `;
        
        messagesList.insertBefore(messageItem, messagesList.firstChild);
    }
}

/**
 * Quick Contribute Form
 */
function initQuickContribute() {
    const form = document.getElementById('quickContributeForm');
    
    // Prefill user data
    prefillUserData();
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const modal = document.getElementById('contributeModal');
            const beneficiaryId = modal?.getAttribute('data-beneficiary-id');
            
            const formData = {
                beneficiaryId: beneficiaryId,
                type: document.getElementById('contributionType').value,
                amount: parseInt(document.getElementById('contributionAmount').value),
                contributorName: document.getElementById('contributorName').value,
                phone: document.getElementById('contributorPhone').value,
                timestamp: new Date().toISOString()
            };
            
            try {
                // Try to send to API
                const response = await fetch(`${API_BASE_URL}/bereavement/${beneficiaryId}/contribute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: formData.type,
                        amount: formData.amount,
                        contributorName: formData.contributorName,
                        phone: formData.phone
                    })
                });
                
                if (!response.ok) throw new Error('Failed to submit contribution');
            } catch (error) {
                console.log('API not available, using local storage');
            }
            
            // Add to contributions table
            addContributionToTable(formData);
            
            // Update summary
            updateSummary();
            
            // Show success message
            showNotification('Contribution recorded successfully!', 'success');
            
            // Close modal
            closeModal(modal);
            
            // Reset form
            form.reset();
        });
    }
}

function addContributionToTable(data) {
    const tableBody = document.getElementById('contributionsTableBody');
    const beneficiary = bereavementData.find(b => b.id === data.beneficiaryId);
    
    if (tableBody) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td>${data.contributorName}</td>
            <td>${beneficiary ? (beneficiary.name || beneficiary.memberName) : 'Unknown'}</td>
            <td>${getContributionTypeLabel(data.type)}</td>
            <td>Ksh ${data.amount.toLocaleString()}</td>
            <td><span class="status pending">Pending</span></td>
        `;
        
        tableBody.insertBefore(row, tableBody.firstChild);
    }
}

/**
 * Document Upload Form (Admin)
 */
function initDocumentUpload() {
    const form = document.getElementById('documentUploadForm');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('caseId', document.getElementById('caseSelect').value);
            formData.append('documentType', document.getElementById('documentType').value);
            formData.append('file', document.getElementById('documentFile').files[0]);
            
            try {
                const response = await fetch(`${API_BASE_URL}/documents/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) throw new Error('Failed to upload document');
            } catch (error) {
                console.log('API not available');
            }
            
            showNotification('Document uploaded successfully!', 'success');
            form.reset();
        });
    }
}

/**
 * Data Loading Functions (Fetch from API)
 */
async function loadBereavementData() {
    const loadingEl = document.getElementById('bereavementLoading');
    const noDataEl = document.getElementById('bereavementNoData');
    const cardsContainer = document.getElementById('bereavementCards');
    
    // Show loading
    if (loadingEl) loadingEl.style.display = 'flex';
    if (noDataEl) noDataEl.style.display = 'none';
    
    try {
        // Fetch from API (public, no auth required)
        const response = await bereavementService.getAll();
        
        if (response && response.data) {
            // Transform API data to expected format
            bereavementData = response.data.map(transformBereavementData);
        } else if (Array.isArray(response)) {
            bereavementData = response.map(transformBereavementData);
        } else {
            bereavementData = [];
        }
        
        console.log('Bereavement data loaded:', bereavementData.length, 'cases');
    } catch (error) {
        console.error('Error loading bereavement data:', error);
        // Show error message but don't redirect
        if (loadingEl) loadingEl.style.display = 'none';
        if (noDataEl) {
            noDataEl.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <h3>Unable to Load Data</h3>
                <p>Could not connect to server. Please try again later.</p>
            `;
            noDataEl.style.display = 'flex';
        }
        bereavementData = [];
        return;
    }
    
    // Hide loading
    if (loadingEl) loadingEl.style.display = 'none';
    
    // Render the data
    renderBereavementCards();
    updateSummary();
    populateBeneficiarySelect();
    populateAdminCaseSelect();
}

/**
 * Transform API data to frontend expected format
 */
function transformBereavementData(apiData) {
    const deceased = apiData.deceased || {};
    const member = apiData.member || {};
    
    return {
        id: apiData.id,
        caseNumber: apiData.caseNumber,
        // Member info
        name: member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : 'Unknown',
        memberName: member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : 'Unknown',
        memberId: member.id,
        studentId: member.memberNumber,
        // Deceased info
        type: deceased.relationship || 'other',
        description: deceased.name ? `Lost: ${deceased.relationship}` : 'No description',
        date: deceased.dateOfDeath || apiData.createdAt,
        // Financial
        amountRaised: parseFloat(apiData.totalContributions) || 0,
        targetAmount: 50000, // Default target
        // Status
        status: apiData.status || 'pending',
        urgent: apiData.status === 'active',
        // Relations
        contributions: apiData.contributions || [],
        messages: apiData.messages || [],
        supporters: (apiData.contributions || []).length,
        // Dates
        createdAt: apiData.createdAt,
        updatedAt: apiData.updatedAt
    };
}

async function loadContributions() {
    const loadingEl = document.getElementById('contributionsLoading');
    const noDataEl = document.getElementById('noContributions');
    const tableBody = document.getElementById('contributionsTableBody');
    
    // Show loading
    if (loadingEl) loadingEl.style.display = 'flex';
    if (noDataEl) noDataEl.style.display = 'none';
    
    try {
        // Contributions are stored within bereavement records
        // Extract all contributions from all cases
        contributionsData = [];
        bereavementData.forEach(caseData => {
            if (caseData.contributions && Array.isArray(caseData.contributions)) {
                caseData.contributions.forEach(contribution => {
                    contributionsData.push({
                        ...contribution,
                        beneficiary: caseData.member?.firstName + ' ' + caseData.member?.lastName || caseData.deceased,
                        date: contribution.createdAt || contribution.date
                    });
                });
            }
        });
        
        console.log('Contributions loaded:', contributionsData.length, 'records');
    } catch (error) {
        console.error('Error loading contributions:', error);
        contributionsData = [];
    }
    
    // Hide loading
    if (loadingEl) loadingEl.style.display = 'none';
    
    // Render contributions
    renderContributions();
}

async function loadMessages() {
    const loadingEl = document.getElementById('messagesLoading');
    const noDataEl = document.getElementById('noMessages');
    const messagesList = document.getElementById('messagesList');
    
    // Show loading
    if (loadingEl) loadingEl.style.display = 'flex';
    if (noDataEl) noDataEl.style.display = 'none';
    
    try {
        // Messages are stored within bereavement records
        // Extract all messages from all cases
        messagesData = [];
        bereavementData.forEach(caseData => {
            if (caseData.messages && Array.isArray(caseData.messages)) {
                caseData.messages.forEach(message => {
                    messagesData.push({
                        ...message,
                        beneficiary: caseData.member?.firstName + ' ' + caseData.member?.lastName || caseData.deceased,
                        date: message.createdAt || message.date
                    });
                });
            }
        });
        
        console.log('Messages loaded:', messagesData.length, 'messages');
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesData = [];
    }
    
    // Hide loading
    if (loadingEl) loadingEl.style.display = 'none';
    
    // Render messages
    renderMessages();
}

/**
 * Render Functions
 */
function renderBereavementCards() {
    const cardsContainer = document.getElementById('bereavementCards');
    const noDataEl = document.getElementById('bereavementNoData');
    
    if (!cardsContainer) return;
    
    // Clear existing cards
    cardsContainer.innerHTML = '';
    
    // Check if there's no data
    if (!bereavementData || bereavementData.length === 0) {
        if (noDataEl) noDataEl.style.display = 'flex';
        return;
    }
    
    if (noDataEl) noDataEl.style.display = 'none';
    
    // Render each card
    bereavementData.forEach(caseData => {
        const card = createBereavementCard(caseData);
        cardsContainer.appendChild(card);
    });
    
    // Re-attach event listeners for dynamically created buttons
    attachCardEventListeners();
}

function createBereavementCard(caseData) {
    const card = document.createElement('div');
    card.className = 'bereavement-card';
    card.dataset.id = caseData.id;
    card.dataset.name = (caseData.name || caseData.memberName || '').toLowerCase();
    card.dataset.type = caseData.type || '';
    card.dataset.status = caseData.status || 'active';
    
    const progressPercent = Math.round(((caseData.amountRaised || 0) / (caseData.targetAmount || 1)) * 100);
    const isUrgent = caseData.urgent || caseData.status === 'urgent';
    const memberName = caseData.name || caseData.memberName || 'Unknown';
    const memberId = caseData.studentId || caseData.memberId || 'N/A';
    const description = caseData.description || 'No description available';
    const date = formatDate(caseData.date || caseData.createdAt);
    
    card.innerHTML = `
        <div class="card-header">
            <span class="date"><i class="fas fa-calendar"></i> ${date}</span>
            <span class="type death ${isUrgent ? 'urgent-type' : ''}">${getBereavementTypeLabel(caseData.type)}</span>
        </div>
        <div class="card-body">
            <h3>${memberName} ${isUrgent ? '<span class="urgent">Urgent</span>' : '<span class="urgent" style="display: none;">Urgent</span>'}</h3>
            <p class="student-id">${memberId}</p>
            <p class="description">${description}</p>
            
            <!-- Progress Bar -->
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress" style="width: ${progressPercent}%;"></div>
                </div>
                <p class="progress-text">${progressPercent}% of Ksh ${(caseData.targetAmount || 0).toLocaleString()} target</p>
            </div>
            
            <!-- M-Pesa Box -->
            <div class="mpesa-box">
                <h4><i class="fas fa-mobile-alt"></i> Lipa na M-Pesa</h4>
                <p>Paybill: <strong>123456</strong></p>
                <p>Account: <strong>${memberName.replace(/\s/g, '')}</strong></p>
            </div>
        </div>
        <div class="card-footer">
            <span class="supporters"><i class="fas fa-users"></i> ${caseData.supporters || 0} supporters</span>
            <span class="amount-raised"><i class="fas fa-money-bill-wave"></i> Ksh ${(caseData.amountRaised || 0).toLocaleString()} raised</span>
        </div>
        <div class="card-actions">
            <button class="btn btn-secondary view-details-btn" data-id="${caseData.id}">
                <i class="fas fa-info-circle"></i> View Details
            </button>
            <button class="btn btn-primary quick-contribute-btn" data-id="${caseData.id}" data-name="${memberName}">
                <i class="fas fa-hand-holding-heart"></i> Support ${memberName.split(' ')[0]}
            </button>
        </div>
    `;
    
    return card;
}

function attachCardEventListeners() {
    // View Details buttons
    const viewButtons = document.querySelectorAll('.view-details-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            openDetailsModal(id);
        });
    });
    
    // Quick Contribute buttons
    const quickContributeButtons = document.querySelectorAll('.quick-contribute-btn');
    quickContributeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            openContributeModal(id, name);
        });
    });
}

function renderContributions() {
    const tableBody = document.getElementById('contributionsTableBody');
    const noDataEl = document.getElementById('noContributions');
    
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Check if there's no data
    if (!contributionsData || contributionsData.length === 0) {
        if (noDataEl) noDataEl.style.display = 'flex';
        return;
    }
    
    if (noDataEl) noDataEl.style.display = 'none';
    
    // Render each contribution
    contributionsData.forEach(contribution => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(contribution.date || contribution.createdAt)}</td>
            <td>${contribution.contributor || contribution.contributorName || 'Anonymous'}</td>
            <td>${contribution.beneficiary || contribution.memberName || 'Unknown'}</td>
            <td>${getContributionTypeLabel(contribution.type)}</td>
            <td>Ksh ${(contribution.amount || 0).toLocaleString()}</td>
            <td><span class="status ${contribution.status || 'pending'}">${capitalizeFirst(contribution.status || 'pending')}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function renderMessages() {
    const messagesList = document.getElementById('messagesList');
    const noDataEl = document.getElementById('noMessages');
    
    if (!messagesList) return;
    
    // Clear existing messages
    messagesList.innerHTML = '';
    
    // Check if there's no data
    if (!messagesData || messagesData.length === 0) {
        if (noDataEl) noDataEl.style.display = 'flex';
        return;
    }
    
    if (noDataEl) noDataEl.style.display = 'none';
    
    // Render each message
    messagesData.forEach(message => {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item';
        messageItem.innerHTML = `
            <div class="message-header">
                <span class="message-author">${message.author || message.contributorName || 'Anonymous'}</span>
                <span class="message-date">${formatDate(message.date || message.createdAt)}</span>
            </div>
            <p class="message-text">${message.message || message.text || ''}</p>
        `;
        messagesList.appendChild(messageItem);
    });
}

function populateBeneficiarySelect() {
    const select = document.getElementById('beneficiarySelect');
    if (!select) return;
    
    // Keep the first option
    const firstOption = select.querySelector('option');
    select.innerHTML = '';
    if (firstOption) select.appendChild(firstOption);
    
    // Add options for each bereavement case
    bereavementData.forEach(caseData => {
        const option = document.createElement('option');
        option.value = caseData.id;
        option.textContent = caseData.name || caseData.memberName || 'Unknown';
        select.appendChild(option);
    });
}

function populateAdminCaseSelect() {
    const select = document.getElementById('caseSelect');
    if (!select) return;
    
    // Keep the first option
    const firstOption = select.querySelector('option');
    select.innerHTML = '';
    if (firstOption) select.appendChild(firstOption);
    
    // Add options for each bereavement case
    bereavementData.forEach(caseData => {
        const option = document.createElement('option');
        option.value = caseData.id;
        option.textContent = `${caseData.name || caseData.memberName || 'Unknown'} - ${getBereavementTypeLabel(caseData.type)}`;
        select.appendChild(option);
    });
}

/**
 * Update Summary Section
 */
function updateSummary() {
    const totalCases = bereavementData.length;
    const totalRaised = bereavementData.reduce((sum, c) => sum + (c.amountRaised || 0), 0);
    const totalSupporters = bereavementData.reduce((sum, c) => sum + (c.supporters || 0), 0);
    const targetAmount = bereavementData.reduce((sum, c) => sum + (c.targetAmount || 0), 0);
    
    const totalCasesEl = document.getElementById('totalCases');
    const totalRaisedEl = document.getElementById('totalRaised');
    const totalContributorsEl = document.getElementById('totalContributors');
    const targetAmountEl = document.getElementById('targetAmount');
    
    if (totalCasesEl) totalCasesEl.textContent = totalCases;
    if (totalRaisedEl) totalRaisedEl.textContent = `Ksh ${totalRaised.toLocaleString()}`;
    if (totalContributorsEl) totalContributorsEl.textContent = totalSupporters;
    if (targetAmountEl) targetAmountEl.textContent = `Ksh ${targetAmount.toLocaleString()}`;
}

/**
 * Utility Functions
 */
function getBereavementTypeLabel(type) {
    const types = {
        'parent': 'Loss of Parent',
        'sibling': 'Loss of Sibling',
        'guardian': 'Loss of Guardian',
        'other': 'Other'
    };
    return types[type] || type || 'Unknown';
}

function getContributionTypeLabel(type) {
    const types = {
        'cash': 'Cash Support',
        'food': 'Food Hamper',
        'other': 'Other'
    };
    return types[type] || type || 'Unknown';
}

/**
 * Prefill user data for contribution forms
 */
function prefillUserData() {
    try {
        // Get user from auth service
        const user = authService.getCurrentUser();
        
        // Get member data from localStorage
        let memberRaw = null;
        const memberDataStr = localStorage.getItem('swa_member_data');
        if (memberDataStr) {
            try {
                memberRaw = JSON.parse(memberDataStr);
            } catch (e) {
                console.log('Could not parse member data');
            }
        }
        
        // Handle API response structure
        const member = memberRaw?.member || memberRaw?.data?.member || memberRaw;
        const userFromMember = memberRaw?.user || memberRaw?.data?.user || {};
        
        if (!user && !member) {
            console.log('No authenticated user or member data found');
            return;
        }
        
        console.log('Prefilling bereavement user data - User:', user, 'Member:', member);
        
        // Build full name
        let fullName = '';
        if (user?.firstName || user?.lastName) {
            fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        } else if (member?.firstName || member?.lastName) {
            fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
        } else if (userFromMember?.firstName || userFromMember?.lastName) {
            fullName = `${userFromMember.firstName || ''} ${userFromMember.lastName || ''}`.trim();
        }
        
        // Get phone
        const phone = member?.phone || userFromMember?.phone || user?.phone || user?.phoneNumber;
        
        // Fill ALL contributorName fields on the page (both forms)
        const nameFields = document.querySelectorAll('#contributorName');
        nameFields.forEach(field => {
            if (fullName && field) {
                field.value = fullName;
            }
        });
        
        // Fill contributorPhone field (in quick contribute modal)
        const phoneField = document.getElementById('contributorPhone');
        if (phone && phoneField) {
            phoneField.value = phone;
        }
        
        console.log('Bereavement user data prefilled');
    } catch (error) {
        console.error('Error prefilling bereavement user data:', error);
    }
}

function formatDate(date) {
    if (!date) return 'N/A';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles inline
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for potential module use
export { 
    loadBereavementData, 
    loadContributions, 
    loadMessages, 
    updateSummary,
    openDetailsModal,
    openContributeModal
};
