/**
 * Admin Dashboard JavaScript
 * Handles all functionality for the admin dashboard including page management and HTML editing
 */

const API_BASE = '/api';

// ==================== AUTH HELPERS ====================
function getAuthHeaders() {
    const token = localStorage.getItem('swa_auth_token') || sessionStorage.getItem('swa_auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

async function apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: { ...getAuthHeaders(), ...options.headers }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }
    return data;
}

// ==================== PAGE MANAGEMENT ====================
let pagesCache = [];
let currentEditingPage = null;
let hasUnsavedChanges = false;

async function loadPagesList() {
    try {
        const result = await apiCall('/pages');
        pagesCache = result.data;
        renderPagesList(result.data);
        renderHtmlPagesList(result.data);
    } catch (error) {
        console.error('Error loading pages:', error);
        document.getElementById('pageSelectorGrid').innerHTML = 
            `<div class="error-message"><i class="fas fa-exclamation-circle"></i> Error loading pages: ${error.message}</div>`;
        document.getElementById('htmlPageGrid').innerHTML = 
            `<div class="error-message"><i class="fas fa-exclamation-circle"></i> Error loading pages: ${error.message}</div>`;
    }
}

function renderPagesList(pages) {
    const grid = document.getElementById('pageSelectorGrid');
    if (!grid) return;
    
    if (!pages || pages.length === 0) {
        grid.innerHTML = '<div class="no-data-message">No pages found</div>';
        return;
    }
    
    // Group pages by directory
    const grouped = pages.reduce((acc, page) => {
        const dir = page.directory || 'other';
        if (!acc[dir]) acc[dir] = [];
        acc[dir].push(page);
        return acc;
    }, {});
    
    let html = '';
    for (const [dir, dirPages] of Object.entries(grouped)) {
        html += `<div class="page-group"><h3 class="page-group-title">${formatDirectoryName(dir)}</h3>`;
        html += '<div class="page-cards">';
        for (const page of dirPages) {
            html += `
                <div class="page-card" onclick="loadPageContent('${page.path}')">
                    <div class="page-card-icon"><i class="fas fa-file-alt"></i></div>
                    <div class="page-card-name">${page.name}</div>
                    <div class="page-card-path">${page.path}</div>
                </div>
            `;
        }
        html += '</div></div>';
    }
    
    grid.innerHTML = html;
}

function renderHtmlPagesList(pages) {
    const grid = document.getElementById('htmlPageGrid');
    if (!grid) return;
    
    if (!pages || pages.length === 0) {
        grid.innerHTML = '<div class="no-data-message">No pages found</div>';
        return;
    }
    
    // Group pages by directory
    const grouped = pages.reduce((acc, page) => {
        const dir = page.directory || 'other';
        if (!acc[dir]) acc[dir] = [];
        acc[dir].push(page);
        return acc;
    }, {});
    
    let html = '';
    for (const [dir, dirPages] of Object.entries(grouped)) {
        html += `<div class="page-group"><h3 class="page-group-title">${formatDirectoryName(dir)}</h3>`;
        html += '<div class="page-cards">';
        for (const page of dirPages) {
            html += `
                <div class="page-card" onclick="loadHtmlPage('${page.path}')">
                    <div class="page-card-icon"><i class="fas fa-code"></i></div>
                    <div class="page-card-name">${page.name}</div>
                    <div class="page-card-path">${page.path}</div>
                </div>
            `;
        }
        html += '</div></div>';
    }
    
    grid.innerHTML = html;
}

function formatDirectoryName(dir) {
    const names = {
        'public': 'Public Pages',
        'auth': 'Authentication',
        'dashboard/admin': 'Admin Dashboard',
        'dashboard/member': 'Member Dashboard',
        'dashboard/shared': 'Shared Dashboard',
        'dashboard/components': 'Components',
        'contributions': 'Contributions',
        'loans': 'Loans',
        'payments': 'Payments',
        'breavement': 'Bereavement',
        'reports': 'Reports',
        'shared': 'Shared'
    };
    return names[dir] || dir;
}

// ==================== PAGE CONTENT (Existing functionality) ====================
async function loadPageContent(pagePath) {
    try {
        document.getElementById('selectedPageName').textContent = pagePath;
        document.getElementById('pageContentEditor').style.display = 'block';
        
        const result = await apiCall(`/page-content?page=${encodeURIComponent(pagePath)}`);
        renderContentItems(result.data);
    } catch (error) {
        console.error('Error loading page content:', error);
    }
}

function renderContentItems(items) {
    const list = document.getElementById('contentItemsList');
    if (!list) return;
    
    if (!items || items.length === 0) {
        list.innerHTML = '<div class="no-data-message">No content sections yet. Add your first content section.</div>';
        return;
    }
    
    let html = '';
    for (const item of items) {
        html += `
            <div class="content-item">
                <div class="content-item-header">
                    <h4>${item.sectionIdentifier}</h4>
                    <span class="content-status ${item.isActive ? 'active' : 'inactive'}">${item.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                ${item.title ? `<div class="content-item-title">${item.title}</div>` : ''}
                ${item.subtitle ? `<div class="content-item-subtitle">${item.subtitle}</div>` : ''}
                <div class="content-item-actions">
                    <button class="btn-icon" onclick="editContentItem(${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" onclick="deleteContentItem(${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }
    list.innerHTML = html;
}

// ==================== HTML PAGE EDITOR ====================
async function loadHtmlPage(pagePath) {
    // Option 1: Open in new window/tab
    window.open(
        `/pages/dashboard/admin/page-editor.html?page=${encodeURIComponent(pagePath)}`,
        'pageEditor',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
    );
    
    /*
    // Option 2: Open in current page editor (commented out)
    try {
        currentEditingPage = pagePath;
        hasUnsavedChanges = false;
        
        document.getElementById('editingPageName').textContent = pagePath;
        document.getElementById('htmlPageEditor').style.display = 'block';
        document.getElementById('editorStatus').innerHTML = 
            '<span class="status-indicator"></span><span class="status-text">Loading...</span>';
        
        const result = await apiCall(`/pages/content/${pagePath}`);
        
        const editor = document.getElementById('htmlEditor');
        editor.value = result.data.content;
        
        document.getElementById('editorStatus').innerHTML = 
            `<span class="status-indicator"></span><span class="status-text">Loaded - ${new Date(result.data.lastModified).toLocaleString()}</span>`;
        
        // Scroll to editor
        document.getElementById('htmlPageEditor').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading HTML page:', error);
        document.getElementById('editorStatus').innerHTML = 
            `<span class="status-indicator error"></span><span class="status-text">Error: ${error.message}</span>`;
    }
    */
}

async function saveHtmlPage() {
    if (!currentEditingPage) return;
    
    const editor = document.getElementById('htmlEditor');
    const newContent = editor.value;
    
    try {
        document.getElementById('editorStatus').innerHTML = 
            '<span class="status-indicator"></span><span class="status-text">Saving...</span>';
        
        await apiCall(`/pages/content/${currentEditingPage}`, {
            method: 'PUT',
            body: JSON.stringify({ content: newContent, createBackup: true })
        });
        
        hasUnsavedChanges = false;
        
        document.getElementById('editorStatus').innerHTML = 
            `<span class="status-indicator success"></span><span class="status-text">Saved successfully - ${new Date().toLocaleString()}</span>`;
        
    } catch (error) {
        console.error('Error saving page:', error);
        document.getElementById('editorStatus').innerHTML = 
            `<span class="status-indicator error"></span><span class="status-text">Error saving: ${error.message}</span>`;
    }
}

async function refreshHtmlPage() {
    if (!currentEditingPage) return;
    await loadHtmlPage(currentEditingPage);
}

// Track unsaved changes
document.addEventListener('DOMContentLoaded', function() {
    // Initialize HTML page editor
    const editor = document.getElementById('htmlEditor');
    if (editor) {
        editor.addEventListener('input', function() {
            hasUnsavedChanges = true;
            document.getElementById('editorStatus').innerHTML = 
                '<span class="status-indicator warning"></span><span class="status-text">Unsaved changes</span>';
        });
    }
    
    // Save button
    const saveBtn = document.getElementById('savePageBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveHtmlPage);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshPageBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshHtmlPage);
    }
    
    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});

// ==================== CONTENT ITEM CRUD ====================
function openContentModal(item = null) {
    const modal = document.getElementById('contentModal');
    const form = document.getElementById('contentForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    document.getElementById('contentId').value = '';
    
    if (item) {
        title.textContent = 'Edit Content';
        document.getElementById('contentId').value = item.id;
        document.getElementById('sectionIdentifier').value = item.sectionIdentifier || '';
        document.getElementById('contentTitle').value = item.title || '';
        document.getElementById('contentSubtitle').value = item.subtitle || '';
        document.getElementById('contentText').value = item.content || '';
        document.getElementById('displayOrder').value = item.displayOrder || 0;
        document.getElementById('isActive').checked = item.isActive !== false;
    } else {
        title.textContent = 'Add Content';
    }
    
    modal.classList.add('active');
}

async function saveContentItem(e) {
    e.preventDefault();
    
    const contentId = document.getElementById('contentId').value;
    const pagePath = document.querySelector('#selectedPageName').textContent;
    
    const data = {
        pageIdentifier: pagePath,
        sectionIdentifier: document.getElementById('sectionIdentifier').value,
        title: document.getElementById('contentTitle').value,
        subtitle: document.getElementById('contentSubtitle').value,
        content: document.getElementById('contentText').value,
        displayOrder: parseInt(document.getElementById('displayOrder').value) || 0,
        isActive: document.getElementById('isActive').checked
    };
    
    try {
        if (contentId) {
            await apiCall(`/page-content/${contentId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            await apiCall('/page-content', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
        
        document.getElementById('contentModal').classList.remove('active');
        await loadPageContent(pagePath);
    } catch (error) {
        alert('Error saving content: ' + error.message);
    }
}

function editContentItem(id) {
    apiCall(`/page-content/${id}`).then(result => {
        openContentModal(result.data);
    }).catch(error => {
        alert('Error loading content: ' + error.message);
    });
}

async function deleteContentItem(id) {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    try {
        await apiCall(`/page-content/${id}`, { method: 'DELETE' });
        const pagePath = document.querySelector('#selectedPageName').textContent;
        await loadPageContent(pagePath);
    } catch (error) {
        alert('Error deleting content: ' + error.message);
    }
}

// ==================== MESSAGES ====================
async function loadMessages() {
    try {
        const result = await apiCall('/messages');
        renderMessages(result.data);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function renderMessages(messages) {
    const table = document.getElementById('messages-table');
    if (!table) return;
    
    if (!messages || messages.length === 0) {
        table.innerHTML = '<tr><td colspan="7" class="no-data-message">No messages yet</td></tr>';
        return;
    }
    
    let html = '';
    for (const msg of messages) {
        html += `
            <tr>
                <td>${msg.name || '-'}</td>
                <td>${msg.email || '-'}</td>
                <td>${msg.subject || '-'}</td>
                <td>${(msg.message || '').substring(0, 50)}${(msg.message || '').length > 50 ? '...' : ''}</td>
                <td>${msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : '-'}</td>
                <td><span class="status-badge ${msg.status || 'unread'}">${msg.status || 'Unread'}</span></td>
                <td>
                    <button class="btn-icon" onclick="viewMessage(${msg.id})"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" onclick="deleteMessage(${msg.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }
    table.innerHTML = html;
}

// ==================== DASHBOARD STATS ====================
async function loadDashboardStats() {
    try {
        // Load various stats in parallel
        const [membersRes, contributionsRes, debtsRes] = await Promise.all([
            apiCall('/members'),
            apiCall('/contributions'),
            apiCall('/debts')
        ]);
        
        const members = membersRes.data || [];
        const contributions = contributionsRes.data || [];
        const debts = debtsRes.data || [];
        
        // Update DOM elements
        const totalMembersEl = document.querySelector('[data-stat="total-members"]');
        if (totalMembersEl) totalMembersEl.textContent = members.filter(m => m.status === 'active').length;
        
        const contributionsEl = document.querySelector('[data-stat="monthly-contributions"]');
        if (contributionsEl) {
            const monthlyTotal = contributions
                .filter(c => {
                    const date = new Date(c.createdAt);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                })
                .reduce((sum, c) => sum + (c.amount || 0), 0);
            contributionsEl.textContent = `Ksh ${monthlyTotal.toLocaleString()}`;
        }
        
        const pendingDebtsEl = document.querySelector('[data-stat="pending-debts"]');
        if (pendingDebtsEl) {
            const pendingTotal = debts
                .filter(d => d.status === 'pending')
                .reduce((sum, d) => sum + (d.amount || 0), 0);
            pendingDebtsEl.textContent = `Ksh ${pendingTotal.toLocaleString()}`;
        }
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// ==================== RECENT ACTIVITY ====================
async function loadActivityLog() {
    try {
        // Combine recent contributions and other activities
        const [contributionsRes, loansRes] = await Promise.all([
            apiCall('/contributions?limit=10'),
            apiCall('/loans?status=pending')
        ]);
        
        const activities = [];
        
        // Add contributions
        for (const c of (contributionsRes.data || []).slice(0, 5)) {
            activities.push({
                type: 'contribution',
                text: `${c.memberName || 'A member'} contributed Ksh ${(c.amount || 0).toLocaleString()}`,
                time: c.createdAt
            });
        }
        
        // Add loan requests
        for (const l of (loansRes.data || []).slice(0, 5)) {
            activities.push({
                type: 'loan',
                text: `${l.memberName || 'A member'} requested a loan of Ksh ${(l.amount || 0).toLocaleString()}`,
                time: l.createdAt
            });
        }
        
        // Sort by time
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        renderActivityLog(activities.slice(0, 10));
    } catch (error) {
        console.error('Error loading activity log:', error);
    }
}

function renderActivityLog(activities) {
    const list = document.getElementById('activityLogList');
    if (!list) return;
    
    if (!activities || activities.length === 0) {
        list.innerHTML = '<li><span class="activity-time">—</span> No recent activity</li>';
        return;
    }
    
    let html = '';
    for (const activity of activities) {
        const icon = activity.type === 'contribution' ? 'fa-money-bill-wave' : 'fa-hand-holding-usd';
        const time = activity.time ? new Date(activity.time).toLocaleDateString() : '—';
        html += `<li><span class="activity-time">${time}</span> <i class="fas ${icon}"></i> ${activity.text}</li>`;
    }
    list.innerHTML = html;
}

// ==================== RECENT CONTRIBUTIONS TABLE ====================
async function loadRecentContributions() {
    try {
        const result = await apiCall('/contributions?limit=10');
        renderContributionsTable(result.data);
    } catch (error) {
        console.error('Error loading contributions:', error);
    }
}

function renderContributionsTable(contributions) {
    const table = document.getElementById('recent-contributions-table');
    if (!table) return;
    
    if (!contributions || contributions.length === 0) {
        table.innerHTML = '<tr><td colspan="6" class="no-data-message">No contributions yet</td></tr>';
        return;
    }
    
    let html = '';
    for (const c of contributions) {
        html += `
            <tr>
                <td>${c.memberName || '-'}</td>
                <td>${c.memberId || '-'}</td>
                <td>${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                <td>Ksh ${(c.amount || 0).toLocaleString()}</td>
                <td>${c.paymentMethod || '-'}</td>
                <td><span class="status-badge ${c.status || 'completed'}">${c.status || 'Completed'}</span></td>
            </tr>
        `;
    }
    table.innerHTML = html;
}

// ==================== PENDING DEBTS TABLE ====================
async function loadPendingDebts() {
    try {
        const result = await apiCall('/debts?status=pending');
        renderDebtsTable(result.data);
    } catch (error) {
        console.error('Error loading debts:', error);
    }
}

function renderDebtsTable(debts) {
    const table = document.getElementById('pending-debts-table');
    if (!table) return;
    
    if (!debts || debts.length === 0) {
        table.innerHTML = '<tr><td colspan="6" class="no-data-message">No pending debts</td></tr>';
        return;
    }
    
    let html = '';
    for (const d of debts) {
        html += `
            <tr>
                <td>${d.memberName || '-'}</td>
                <td>${d.memberId || '-'}</td>
                <td>Ksh ${(d.amount || 0).toLocaleString()}</td>
                <td>${d.dueDate ? new Date(d.dueDate).toLocaleDateString() : '-'}</td>
                <td><span class="status-badge ${d.status || 'pending'}">${d.status || 'Pending'}</span></td>
                <td><button class="btn-small" onclick="viewDebt(${d.id})">View</button></td>
            </tr>
        `;
    }
    table.innerHTML = html;
}

// ==================== LOAN REQUESTS TABLE ====================
async function loadLoanRequests() {
    try {
        const result = await apiCall('/loans?status=pending');
        renderLoanRequestsTable(result.data);
    } catch (error) {
        console.error('Error loading loan requests:', error);
    }
}

function renderLoanRequestsTable(loans) {
    const table = document.getElementById('loan-requests-table');
    if (!table) return;
    
    if (!loans || loans.length === 0) {
        table.innerHTML = '<tr><td colspan="6" class="no-data-message">No pending loan requests</td></tr>';
        return;
    }
    
    let html = '';
    for (const l of loans) {
        html += `
            <tr>
                <td>${l.memberName || '-'}</td>
                <td>${l.memberId || '-'}</td>
                <td>Ksh ${(l.amount || 0).toLocaleString()}</td>
                <td>${l.purpose || '-'}</td>
                <td>${l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '-'}</td>
                <td>
                    <button class="btn-small" onclick="approveLoan(${l.id})">Approve</button>
                    <button class="btn-small btn-danger" onclick="rejectLoan(${l.id})">Reject</button>
                </td>
            </tr>
        `;
    }
    table.innerHTML = html;
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize page content form
    const contentForm = document.getElementById('contentForm');
    if (contentForm) {
        contentForm.addEventListener('submit', saveContentItem);
    }
    
    // Load data
    loadPagesList();
    loadDashboardStats();
    loadActivityLog();
    loadRecentContributions();
    loadPendingDebts();
    loadLoanRequests();
    loadMessages();
    
    // Handle URL hash for navigation
    handleUrlHash();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleUrlHash);
});

// Handle URL hash for direct section linking
function handleUrlHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        // Find the nav link with matching data-section
        const navLink = document.querySelector(`.nav-link[data-section="${hash}"]`);
        if (navLink) {
            navLink.click();
        } else {
            // Directly show the section if no nav link found
            showSection(hash);
        }
    }
}

function showSection(sectionName) {
    // Update active states on nav links
    document.querySelectorAll('.nav-link, .dropdown-item').forEach(l => {
        if (l.dataset.section === sectionName) {
            l.classList.add('active');
        } else {
            l.classList.remove('active');
        }
    });
    
    // Show corresponding content section
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('section-' + sectionName);
    if (target) {
        target.classList.add('active');
    }
}

// Make functions globally available
window.loadPageContent = loadPageContent;
window.editContentItem = editContentItem;
window.deleteContentItem = deleteContentItem;
window.loadHtmlPage = loadHtmlPage;
window.saveHtmlPage = saveHtmlPage;
window.refreshHtmlPage = refreshHtmlPage;
window.openContentModal = openContentModal;
window.showSection = showSection;
window.handleUrlHash = handleUrlHash;

// Smart hash link handler - decides whether to use hash or full URL
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        const link = e.target.closest('.smart-hash');
        if (!link) return;
        
        const section = link.dataset.section;
        const fullUrl = link.dataset.url;
        
        // Check if we're already on admin-dashboard.html
        if (window.location.pathname.includes('admin-dashboard.html')) {
            // Use hash navigation (stay on same page)
            e.preventDefault();
            window.location.hash = section;
        } else if (fullUrl) {
            // Navigate to admin-dashboard with the hash
            e.preventDefault();
            window.location.href = fullUrl;
        }
        // Otherwise, let the normal link behavior happen
    });
});
