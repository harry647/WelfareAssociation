/**
 * Bereavement Support Page Script
 * Handles bereavement records display, search, filter, and interactions
 * Ready for fetch API integration
 */

// API Base URL - Change this to your actual API endpoint
const API_BASE_URL = '/api';

// Mock data for demonstration (will be replaced with API calls)
const mockBereavementData = [
    {
        id: 1,
        name: 'Sarah Kemunto',
        studentId: 'JOO/2024/045',
        type: 'parent',
        status: 'active',
        date: 'March 15, 2025',
        description: 'Lost her father to a sudden illness. The SWA family extends its deepest condolences.',
        targetAmount: 50000,
        amountRaised: 25000,
        supporters: 15,
        urgent: false,
        funeralDetails: 'Funeral held on March 20, 2025 at their home in Kisii',
        burialDate: 'March 21, 2025',
        location: 'Kisii County',
        contactPerson: 'John Kemunto (Father)',
        contactPhone: '+254712345678'
    },
    {
        id: 2,
        name: 'James Ochieng',
        studentId: 'JOO/2023/112',
        type: 'sibling',
        status: 'urgent',
        date: 'February 28, 2025',
        description: 'Lost his younger brother in a road accident. Our thoughts are with him and his family.',
        targetAmount: 50000,
        amountRaised: 35000,
        supporters: 22,
        urgent: true,
        funeralDetails: 'Funeral held on March 5, 2025 at St. Peters Cathedral',
        burialDate: 'March 6, 2025',
        location: 'Nairobi County',
        contactPerson: 'Mary Ochieng (Mother)',
        contactPhone: '+254723456789'
    },
    {
        id: 3,
        name: 'Grace Atieno',
        studentId: 'JOO/2024/078',
        type: 'parent',
        status: 'active',
        date: 'January 10, 2025',
        description: 'Lost her mother after a brief illness. Sending strength and support.',
        targetAmount: 50000,
        amountRaised: 30000,
        supporters: 18,
        urgent: false,
        funeralDetails: 'Funeral held on January 15, 2025 at Ahero Parish',
        burialDate: 'January 16, 2025',
        location: 'Kisumu County',
        contactPerson: 'Peter Atieno (Father)',
        contactPhone: '+254734567890'
    }
];

const mockContributions = [
    { date: 'Mar 18, 2025', contributor: 'Lavenda Achieng', beneficiary: 'Sarah Kemunto', type: 'Cash Support', amount: 2000, status: 'verified' },
    { date: 'Mar 17, 2025', contributor: 'Mary Odundo', beneficiary: 'Sarah Kemunto', type: 'Food Hamper', amount: 3000, status: 'verified' },
    { date: 'Mar 16, 2025', contributor: 'Vincent Otieno', beneficiary: 'Sarah Kemunto', type: 'Cash Support', amount: 5000, status: 'verified' },
    { date: 'Mar 01, 2025', contributor: 'Francis Opiyo', beneficiary: 'James Ochieng', type: 'Cash Support', amount: 1000, status: 'verified' }
];

const mockMessages = [
    { id: 1, author: 'Lavenda Achieng', date: 'Mar 18, 2025', text: 'Thinking of you during this difficult time. May God give you strength.', beneficiaryId: 1 },
    { id: 2, author: 'Anonymous', date: 'Mar 17, 2025', text: "You're not alone. We're here for you.", beneficiaryId: 1 }
];

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
    
    // Load data (will use fetch API in production)
    loadBereavementData();
    loadContributions();
    loadMessages();
    
    // Update summary
    updateSummary();
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
        const matchesStatus = statusValue === '' || status === statusValue;
        
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
    const viewButtons = document.querySelectorAll('.view-details-btn');
    
    viewButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            openDetailsModal(id);
        });
    });
    
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
    const quickContributeButtons = document.querySelectorAll('.quick-contribute-btn');
    
    quickContributeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            openContributeModal(id, name);
        });
    });
    
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
        
        modalTitle.textContent = caseData.name;
        modalBody.innerHTML = `
            <div class="detail-section">
                <h4><i class="fas fa-user"></i> Student Information</h4>
                <p><strong>Name:</strong> ${caseData.name}</p>
                <p><strong>Student ID:</strong> ${caseData.studentId}</p>
                <p><strong>Bereavement Type:</strong> ${getBereavementTypeLabel(caseData.type)}</p>
                <p><strong>Date:</strong> ${caseData.date}</p>
                ${caseData.urgent ? '<p class="urgent">🚨 URGENT CASE</p>' : ''}
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-info-circle"></i> Case Details</h4>
                <p>${caseData.description}</p>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-calendar-alt"></i> Funeral Details</h4>
                <p><strong>Funeral:</strong> ${caseData.funeralDetails}</p>
                <p><strong>Burial Date:</strong> ${caseData.burialDate}</p>
                <p><strong>Location:</strong> ${caseData.location}</p>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-contact-book"></i> Contact Person</h4>
                <p><strong>Name:</strong> ${caseData.contactPerson}</p>
                <p><strong>Phone:</strong> ${caseData.contactPhone}</p>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-chart-line"></i> Fundraising Progress</h4>
                <div class="progress-bar" style="height: 24px; background: #e9ecef; border-radius: 12px; overflow: hidden;">
                    <div class="progress" style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #27ae60, #2ecc71);"></div>
                </div>
                <p style="margin-top: 8px;">Ksh ${caseData.amountRaised.toLocaleString()} raised of Ksh ${caseData.targetAmount.toLocaleString()} (${progressPercent}%)</p>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-mobile-alt"></i> M-Pesa Payment</h4>
                <p><strong>Paybill:</strong> 123456</p>
                <p><strong>Account:</strong> ${caseData.name.replace(/\s/g, '')}</p>
            </div>
        `;
        
        // Set contribute button
        const contributeBtn = document.getElementById('modalContributeBtn');
        if (contributeBtn) {
            contributeBtn.onclick = () => {
                closeModal(modal);
                openContributeModal(id, caseData.name);
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
            
            // TODO: Replace with actual API call
            // await fetch(`${API_BASE_URL}/condolences`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });
            
            console.log('Condolence message submitted:', formData);
            
            // Add message to display (demo purposes)
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
            
            // TODO: Replace with actual API call
            // await fetch(`${API_BASE_URL}/contributions`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });
            
            console.log('Contribution submitted:', formData);
            
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
    
    if (tableBody && beneficiary) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td>${data.contributorName}</td>
            <td>${beneficiary.name}</td>
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
            
            // TODO: Replace with actual API call
            // await fetch(`${API_BASE_URL}/documents/upload`, {
            //     method: 'POST',
            //     body: formData
            // });
            
            console.log('Document upload submitted:', Object.fromEntries(formData));
            
            showNotification('Document uploaded successfully!', 'success');
            form.reset();
        });
    }
}

/**
 * Data Loading Functions (Fetch API Ready)
 */
async function loadBereavementData() {
    // TODO: Replace with actual API call
    // try {
    //     const response = await fetch(`${API_BASE_URL}/bereavement`);
    //     bereavementData = await response.json();
    // } catch (error) {
    //     console.error('Error loading bereavement data:', error);
    // }
    
    // Using mock data for demonstration
    bereavementData = mockBereavementData;
    console.log('Bereavement data loaded:', bereavementData.length, 'cases');
}

async function loadContributions() {
    // TODO: Replace with actual API call
    // try {
    //     const response = await fetch(`${API_BASE_URL}/contributions`);
    //     contributionsData = await response.json();
    // } catch (error) {
    //     console.error('Error loading contributions:', error);
    // }
    
    contributionsData = mockContributions;
    console.log('Contributions loaded:', contributionsData.length, 'records');
}

async function loadMessages() {
    // TODO: Replace with actual API call
    // try {
    //     const response = await fetch(`${API_BASE_URL}/condolences`);
    //     messagesData = await response.json();
    // } catch (error) {
    //     console.error('Error loading messages:', error);
    // }
    
    messagesData = mockMessages;
    console.log('Messages loaded:', messagesData.length, 'messages');
}

/**
 * Update Summary Section
 */
function updateSummary() {
    const totalCases = bereavementData.length;
    const totalRaised = bereavementData.reduce((sum, c) => sum + c.amountRaised, 0);
    const totalSupporters = bereavementData.reduce((sum, c) => sum + c.supporters, 0);
    const targetAmount = bereavementData.reduce((sum, c) => sum + c.targetAmount, 0);
    
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
    return types[type] || type;
}

function getContributionTypeLabel(type) {
    const types = {
        'cash': 'Cash Support',
        'food': 'Food Hamper',
        'other': 'Other'
    };
    return types[type] || type;
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
