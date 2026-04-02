import { showAlert, showConfirm, showPrompt } from '../../../utils/utility-functions.js';
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
        showAlert(`Error saving content: ` + error.message);
    }
}

function editContentItem(id) {
    apiCall(`/page-content/${id}`).then(result => {
        openContentModal(result.data);
    }, 'Information', 'info').catch(error => {
        showAlert(`Error loading content: ` + error.message);
    });
}

async function deleteContentItem(id) {
    if (!await showConfirm('Are you sure you want to delete this content?')) return;
    
    try {
        await apiCall(`/page-content/${id}`, { method: 'DELETE' });
        const pagePath = document.querySelector('#selectedPageName').textContent;
        await loadPageContent(pagePath);
    } catch (error) {
        showAlert(`Error deleting content: ${error.message}`, 'Error', 'error');
    }
}

// ==================== MESSAGES ====================
async function loadMessages() {
    try {
        const result = await apiCall('/contact');
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
        const statusClass = msg.status === 'read' ? 'read' : (msg.status === 'replied' ? 'replied' : 'unread');
        const statusText = msg.status === 'read' ? 'Read' : (msg.status === 'replied' ? 'Replied' : 'Unread', 'Information', 'info');
        html += `
            <tr>
                <td>${msg.name || '-'}</td>
                <td>${msg.email || '-'}</td>
                <td>${msg.subject || '-'}</td>
                <td>${(msg.message || '').substring(0, 50)}${(msg.message || '').length > 50 ? '...' : ''}</td>
                <td>${msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-icon" onclick="viewMessage(${msg.id})"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" onclick="deleteMessage(${msg.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }
    table.innerHTML = html;
}

async function viewMessage(messageId) {
    try {
        const result = await apiCall(`/contact/${messageId}`);
        const msg = result.data;
        showAlert(`From: ${msg.name}\nEmail: ${msg.email}\nSubject: ${msg.subject}\n\n${msg.message}`, 'Information', 'info');
        // Mark as read if unread
        if (msg.status !== 'read') {
            await apiCall(`/contact/${messageId}/read`, { method: 'PATCH' });
            loadMessages(); // Reload to update status
        }
    } catch (error) {
        console.error('Error viewing message:', error);
        showAlert(`Failed to load message: ${error.message}`, 'Error', 'error');
    }
}

async function deleteMessage(messageId) {
    if (!await showConfirm('Are you sure you want to delete this message?')) return;
    
    try {
        await apiCall(`/contact/${messageId}`, { method: 'DELETE' });
        loadMessages(); // Reload the messages list
    } catch (error) {
        console.error('Error deleting message:', error);
        showAlert(`Failed to delete message: ${error.message}`, 'Error', 'error');
    }
}

// ==================== DASHBOARD STATS ====================
async function loadDashboardStats() {
    try {
        // Load various stats in parallel using dedicated statistics endpoints where available
        const [membersRes, contributionsRes, debtsStatsRes, loansStatsRes, eventsRes, announcementsRes, paymentsStatsRes] = await Promise.all([
            apiCall('/members?limit=100'),  // Get all members with high limit
            apiCall('/contributions?limit=100'),
            apiCall('/debts/statistics').catch(() => ({ data: { totalOutstanding: 0 } })),
            apiCall('/loans/statistics').catch(() => ({ data: { totalOutstanding: 0, totalLoans: 0 } })),
            apiCall('/events'),
            apiCall('/announcements'),
            apiCall('/payments/stats/summary').catch(() => ({ data: null }))
        ]);
        
        const members = membersRes.data || [];
        const contributions = contributionsRes.data || [];
        const debtsStats = debtsStatsRes.data;
        const loansStats = loansStatsRes.data;
        const events = eventsRes.data || [];
        const announcements = announcementsRes.data || [];
        const paymentsStats = paymentsStatsRes.data;
        
        // Update DOM elements - Total Members (Active only)
        const totalMembersEl = document.querySelector('[data-stat="total-members"]');
        if (totalMembersEl) {
            const activeMembers = members.filter(m => m.membershipStatus === 'active').length;
            totalMembersEl.textContent = activeMembers;
        }
        
        // Monthly Contributions
        const contributionsEl = document.querySelector('[data-stat="monthly-contributions"]');
        if (contributionsEl) {
            const now = new Date();
            const monthlyTotal = contributions
                .filter(c => {
                    const date = new Date(c.createdAt || c.paymentDate);
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                })
                .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
            contributionsEl.textContent = `Ksh ${monthlyTotal.toLocaleString()}`;
        }
        
        // Pending Debts - Use loans statistics for total outstanding (sum of all active loans)
        const pendingDebtsEl = document.querySelector('[data-stat="pending-debts"]');
        if (pendingDebtsEl) {
            // Use loans statistics - total outstanding from active/overdue loans
            const totalOutstanding = loansStats?.totalOutstanding || debtsStats?.totalOutstanding || 0;
            pendingDebtsEl.textContent = `Ksh ${parseFloat(totalOutstanding).toLocaleString()}`;
        }
        
        // Available Balance from payments stats or calculate from contributions
        const balanceEl = document.querySelector('[data-stat="available-balance"]');
        if (balanceEl) {
            let balance = 0;
            if (paymentsStats && paymentsStats.totalBalance !== undefined) {
                balance = paymentsStats.totalBalance;
            } else if (paymentsStats && paymentsStats.balance !== undefined) {
                balance = paymentsStats.balance;
            } else {
                // Calculate: sum of all contributions - sum of all withdrawals
                const totalContributions = contributions.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
                // Try to get withdrawals total if endpoint exists
                try {
                    const withdrawalsRes = await apiCall('/withdrawals/summary');
                    const withdrawalsTotal = withdrawalsRes.data?.total || 0;
                    balance = totalContributions - withdrawalsTotal;
                } catch {
                    balance = totalContributions;
                }
            }
            balanceEl.textContent = `Ksh ${balance.toLocaleString()}`;
        }
        
        // Update Overview Statistics - Total Registered (all members)
        const totalRegisteredEl = document.querySelector('[data-stat="total-registered"]');
        if (totalRegisteredEl) {
            totalRegisteredEl.textContent = members.length;
        }
        
        const welfarePackagesEl = document.querySelector('[data-stat="welfare-packages"]');
        if (welfarePackagesEl) {
            // Count welfare-related announcements
            const welfareCount = announcements.filter(a => 
                (a.category === 'welfare' || a.title?.toLowerCase().includes('welfare'))
            ).length;
            welfarePackagesEl.textContent = welfareCount || '0';
        }
        
        const eventsHeldEl = document.querySelector('[data-stat="events-held"]');
        if (eventsHeldEl) {
            // Count events that have already occurred
            const eventsHeld = events.filter(e => new Date(e.date) <= new Date()).length;
            eventsHeldEl.textContent = eventsHeld || '0';
        }
        
        const scholarshipsEl = document.querySelector('[data-stat="scholarships"]');
        if (scholarshipsEl) {
            // Count scholarship-related announcements
            const scholarshipCount = announcements.filter(a => 
                (a.category === 'scholarship' || a.title?.toLowerCase().includes('scholarship'))
            ).length;
            scholarshipsEl.textContent = scholarshipCount || '0';
        }
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// ==================== RECENT ACTIVITY ====================
async function loadActivityLog() {
    try {
        // Combine recent contributions, loans, debts, and other activities
        const [contributionsRes, loansRes, debtsRes, membersRes] = await Promise.all([
            apiCall('/contributions?limit=10&status=completed'),
            apiCall('/loans?status=pending'),
            apiCall('/debts?status=pending'),
            apiCall('/members?limit=100')
        ]);
        
        const activities = [];
        
        // Add contributions
        for (const c of (contributionsRes.data || []).slice(0, 5)) {
            activities.push({
                type: 'contribution',
                text: `${c.memberName || 'A member'} contributed Ksh ${(parseFloat(c.amount) || 0).toLocaleString()}`,
                time: c.createdAt,
                icon: 'fa-money-bill-wave'
            });
        }
        
        // Add loan requests
        for (const l of (loansRes.data || []).slice(0, 5)) {
            activities.push({
                type: 'loan',
                text: `${l.memberName || 'A member'} requested a loan of Ksh ${(parseFloat(l.principalAmount || l.amount) || 0).toLocaleString()}`,
                time: l.createdAt,
                icon: 'fa-hand-holding-usd'
            });
        }
        
        // Add recent member registrations
        const recentMembers = (membersRes.data || [])
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 3);
        for (const m of recentMembers) {
            if (m.createdAt) {
                activities.push({
                    type: 'member',
                    text: `${m.firstName || ''} ${m.lastName || ''} registered as a member`,
                    time: m.createdAt,
                    icon: 'fa-user-plus'
                });
            }
        }
        
        // Add pending debts
        const pendingDebts = (debtsRes.data || []).filter(d => d.status === 'pending').slice(0, 3);
        for (const d of pendingDebts) {
            activities.push({
                type: 'debt',
                text: `Debt of Ksh ${(parseFloat(d.amount) || 0).toLocaleString()} for ${d.memberName || 'member'}`,
                time: d.createdAt,
                icon: 'fa-exclamation-triangle'
            });
        }
        
        // Sort by time (most recent first)
        activities.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
        
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
        const icon = activity.icon || 'fa-info-circle';
        const time = activity.time ? new Date(activity.time).toLocaleDateString() : '—';
        html += `<li><span class="activity-time">${time}</span> <i class="fas ${icon}"></i> ${activity.text}</li>`;
    }
    list.innerHTML = html;
}

// ==================== RECENT CONTRIBUTIONS TABLE ====================
async function loadRecentContributions() {
    try {
        const result = await apiCall('/contributions?limit=10&status=completed');
        
        // Enrich contributions with member data if needed
        const contributions = result.data || [];
        try {
            const membersRes = await apiCall('/members?limit=100');
            const membersMap = {};
            (membersRes.data || []).forEach(m => {
                membersMap[m.id] = m;
            });
            // Add studentId if not present
            contributions.forEach(c => {
                if (!c.memberName && c.memberId) {
                    const member = membersMap[c.memberId];
                    if (member) {
                        c.memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
                        c.memberId_display = member.memberNumber || c.memberId;
                    }
                }
            });
        } catch (e) {
            console.log('Could not fetch member data for contributions:', e);
        }
        
        renderContributionsTable(contributions);
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
                <td>${c.memberId_display || c.memberId || '-'}</td>
                <td>${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                <td>Ksh ${(c.amount || 0).toLocaleString()}</td>
                <td>${c.paymentMethod || '-'}</td>
                <td><span class="status-badge ${c.status || 'completed'}">${c.status || 'Completed'}</span></td>
            </tr>
        `;
    }
    table.innerHTML = html;
}

// ==================== PENDING DEBTS TABLE (Now Active Loans) ====================
async function loadPendingDebts() {
    try {
        // Load all loans and filter for active/overdue on client side
        const result = await apiCall('/loans?limit=100');
        
        // Filter for active and overdue loans
        const allLoans = result.data || [];
        const activeLoans = allLoans.filter(loan => loan.status === 'active' || loan.status === 'overdue');
        
        // Enrich loans with member data if needed
        const loans = activeLoans;
        try {
            const membersRes = await apiCall('/members?limit=100');
            const membersMap = {};
            (membersRes.data || []).forEach(m => {
                membersMap[m.id] = m;
            });
            // Add memberName and memberNumber if not present
            loans.forEach(loan => {
                if (!loan.memberName && loan.memberId) {
                    const member = membersMap[loan.memberId];
                    if (member) {
                        loan.memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.name;
                        loan.memberId_display = member.memberNumber || loan.memberId;
                    }
                }
            });
        } catch (e) {
            console.log('Could not fetch member data for loans:', e);
        }
        
        renderActiveLoansTable(loans);
    } catch (error) {
        console.error('Error loading active loans:', error);
    }
}

function renderActiveLoansTable(loans) {
    const table = document.getElementById('pending-debts-table');
    if (!table) return;
    
    if (!loans || loans.length === 0) {
        table.innerHTML = '<tr><td colspan="6" class="no-data-message">No active loans</td></tr>';
        return;
    }
    
    let html = '';
    for (const l of loans) {
        const amount = parseFloat(l.principalAmount || l.totalAmount || l.amount || 0);
        const statusClass = l.status === 'overdue' ? 'overdue' : 'active';
        html += `
            <tr>
                <td>${l.memberName || '-'}</td>
                <td>${l.memberId_display || l.memberId || '-'}</td>
                <td>Ksh ${amount.toLocaleString()}</td>
                <td>${l.purpose || '-'}</td>
                <td><span class="status-badge ${statusClass}">${l.status || 'Active'}</span></td>
                <td><button class="btn-small" onclick="viewLoan('${l.id}')">View</button></td>
            </tr>
        `;
    }
    table.innerHTML = html;
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

async function viewDebt(debtId) {
    try {
        const result = await apiCall(`/debts/${debtId}`);
        const debt = result.data;
        showAlert(`Debt Details:\n\nMember: ${debt.memberName || 'N/A'}\nStudent ID: ${debt.memberId_display || debt.memberId || 'N/A'}\nAmount: Ksh ${(debt.amount || 0).toLocaleString()}\nDue Date: ${debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : 'N/A'}\nStatus: ${debt.status || 'Pending'}\nDescription: ${debt.description || 'N/A'}`, 'Information', 'info');
    } catch (error) {
        console.error('Error viewing debt:', error);
        showAlert(`Failed to load debt details: ` + error.message);
    }
}

// ==================== LOAN REQUESTS TABLE ====================
async function loadLoanRequests() {
    try {
        // Load pending loan requests
        const result = await apiCall('/loans?status=pending');
        
        // Enrich loans with member data if needed
        const loans = result.data || [];
        try {
            const membersRes = await apiCall('/members?limit=100');
            const membersMap = {};
            (membersRes.data || []).forEach(m => {
                membersMap[m.id] = m;
            });
            // Add memberName if not present
            loans.forEach(loan => {
                if (!loan.memberName && loan.memberId) {
                    const member = membersMap[loan.memberId];
                    if (member) {
                        loan.memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
                        loan.memberId_display = member.memberNumber || loan.memberId;
                    }
                }
            });
        } catch (e) {
            console.log('Could not fetch member names:', e);
        }
        
        renderLoanRequestsTable(loans);
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
                <td>${l.memberId_display || l.memberId || '-'}</td>
                <td>Ksh ${parseFloat(l.principalAmount || l.totalAmount || l.amount || 0).toLocaleString()}</td>
                <td>${l.purpose || '-'}</td>
                <td>${l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '-'}</td>
                <td>
                    <button class="btn-small" onclick="viewLoan(${l.id})">View</button>
                    <button class="btn-small" style="background:var(--success);" onclick="approveLoan('${l.id}')">Approve</button>
                    <button class="btn-small" style="background:var(--danger);" onclick="rejectLoan('${l.id}')">Reject</button>
                </td>
            </tr>
        `;
    }
    table.innerHTML = html;
}

async function viewLoan(loanId) {
    try {
        const result = await apiCall(`/loans/${loanId}`);
        const loan = result.data;
        const amount = parseFloat(loan.principalAmount || loan.totalAmount || loan.amount || 0);
        const details = [
            `Loan Details:`,
            ``,
            `Loan Number: ${loan.loanNumber || loan.id}`,
            `Member: ${loan.memberName || 'N/A'}`,
            `Amount: Ksh ${amount.toLocaleString()}`,
            `Purpose: ${loan.purpose || 'N/A'}`,
            `Status: ${loan.status || 'Pending'}`,
            `Application Date: ${loan.applicationDate ? new Date(loan.applicationDate).toLocaleDateString() : 'N/A'}`,
            `Guarantor: ${loan.guarantorName || 'N/A'}`,
            `Guarantor Status: ${loan.guarantorStatus || 'N/A'}`,
            ``,
            `Description: ${loan.description || 'N/A'}`
        ].join('\n');
        showAlert(details, 'Information', 'info');
    } catch (error) {
        console.error('Error viewing loan:', error);
        showAlert(`Failed to load loan details: ` + error.message);
    }
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
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'), 'Information', 'info');
    const target = document.getElementById('section-' + sectionName);
    if (target) {
        target.classList.add('active');
    }
}

// ==================== LOANS MANAGEMENT ====================
let loansCache = [];

async function loadLoans() {
    try {
        const statusFilter = document.getElementById('loanStatusFilter')?.value || '';
        const guarantorFilter = document.getElementById('guarantorStatusFilter')?.value || '';
        
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        if (guarantorFilter) params.append('guarantorStatus', guarantorFilter);
        
        const result = await apiCall('/loans?' + params.toString());
        loansCache = result.data;
        
        // Enrich loans with member data if needed
        const loans = result.data || [];
        try {
            const membersRes = await apiCall('/members?limit=100');
            const membersMap = {};
            (membersRes.data || []).forEach(m => {
                membersMap[m.id] = m;
            });
            // Add memberName if not present
            loans.forEach(loan => {
                if (!loan.memberName && loan.memberId) {
                    const member = membersMap[loan.memberId];
                    if (member) {
                        loan.memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
                        loan.memberId_display = member.memberNumber || loan.memberId;
                    }
                }
            });
        } catch (e) {
            console.log('Could not fetch member data for loans:', e);
        }
        
        renderLoansTable(loans);
    } catch (error) {
        console.error('Error loading loans:', error);
        document.getElementById('loans-table').innerHTML = 
            `<tr><td colspan="9" class="no-data-message"><i class="fas fa-exclamation-circle"></i> Error loading loans: ${error.message}</td></tr>`;
    }
}

function renderLoansTable(loans) {
    const tbody = document.getElementById('loans-table');
    if (!tbody) return;
    
    if (!loans || loans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data-message"><i class="fas fa-info-circle"></i> No loans found</td></tr>';
        return;
    }
    
    tbody.innerHTML = loans.map(loan => `
        <tr>
            <td><strong>${loan.loanNumber || loan.id}</strong></td>
            <td>${loan.memberName || 'N/A'}</td>
            <td>Ksh ${parseFloat(loan.principalAmount || loan.totalAmount || loan.amount || 0).toLocaleString()}</td>
            <td>${loan.purpose || 'N/A'}</td>
            <td>${new Date(loan.applicationDate || loan.createdAt).toLocaleDateString()}</td>
            <td><span class="status ${getLoanStatusClass(loan.status)}">${formatLoanStatus(loan.status)}</span></td>
            <td>${loan.guarantorName || 'N/A'}</td>
            <td><span class="guarantor-status ${loan.guarantorStatus || 'not_required'}">${formatGuarantorStatus(loan.guarantorStatus)}</span></td>
            <td>
                <div class="loan-actions">
                    <button class="btn btn-view" onclick="viewLoanDetails('${loan.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${loan.status === 'pending' ? `
                        <button class="btn btn-approve" onclick="approveLoan('${loan.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-reject" onclick="rejectLoan('${loan.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function getLoanStatusClass(status) {
    const statusMap = {
        'pending': 'pending',
        'active': 'active',
        'completed': 'completed',
        'rejected': 'rejected',
        'overdue': 'overdue'
    };
    return statusMap[status] || 'pending';
}

function formatLoanStatus(status) {
    const statusMap = {
        'pending': '⏳ Pending',
        'active': '🔄 Active',
        'completed': '✓ Completed',
        'rejected': '✗ Rejected',
        'overdue': '⚠ Overdue'
    };
    return statusMap[status] || status;
}

function formatGuarantorStatus(status) {
    const statusMap = {
        'pending': '⏳ Pending',
        'accepted': '✓ Accepted',
        'rejected': '✗ Rejected',
        'not_required': '— Not Required'
    };
    return statusMap[status] || '— Not Required';
}

async function viewLoanDetails(loanId) {
    // For now, just show an alert. In a real implementation, this would open a modal or navigate to details page
    showAlert(`View details for loan ${loanId}. This would open a detailed view modal.`, 'Information', 'info');
}

async function approveLoan(loanId) {
    if (!await showConfirm('Are you sure you want to approve this loan?')) return;
    
    try {
        await apiCall(`/loans/${loanId}/approve`, { method: 'POST' });
        showAlert('Loan approved successfully!', 'Information', 'info');
        loadLoans(); // Reload the loans list
    } catch (error) {
        console.error('Error approving loan:', error);
        showAlert(`Failed to approve loan: ${error.message}`, 'Error', 'error');
    }
}

async function rejectLoan(loanId) {
    const reason = await showPrompt('Please provide a reason for rejecting this loan:');
    if (reason === null) return; // User cancelled
    
    try {
        await apiCall(`/loans/${loanId}/reject`, { 
            method: 'POST',
            body: JSON.stringify({ reason })
        });
        showAlert('Loan rejected successfully!', 'Information', 'info');
        loadLoans(); // Reload the loans list
    } catch (error) {
        console.error('Error rejecting loan:', error, 'Information', 'info');
        showAlert(`Failed to reject loan: ` + error.message);
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
window.loadLoans = loadLoans;
window.viewLoanDetails = viewLoanDetails;
window.viewLoan = viewLoan;
window.approveLoan = approveLoan;
window.rejectLoan = rejectLoan;
window.viewMessage = viewMessage;
window.deleteMessage = deleteMessage;
window.viewDebt = viewDebt;

// Initialize loans section when shown
const originalShowSection = showSection;
window.showSection = function(sectionName) {
    originalShowSection(sectionName);
    
    // Load loans when loans section is shown
    if (sectionName === 'loans') {
        setTimeout(() => loadLoans(), 100);
    }
};

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
}, 'Information', 'info');
