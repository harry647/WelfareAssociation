/**
 * Notices Script
 * Handles notices management functionality
 * 
 * @version 1.0.0
 */

import { noticeService } from '../../../services/notice-service.js';

import { showAlert, showConfirm, showPrompt } from '../../../utils/utility-functions.js';

// Global variable to store notices data for access by global functions
let noticesData = [];

// Global utility functions for access by global functions
function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
class Notices {
    constructor() {
        this.notices = [];
        this.drafts = [];
        this.scheduled = [];
        this.stats = {
            totalNotices: 0,
            sentThisMonth: 0,
            totalDrafts: 0,
            readRate: 0,
            categories: {
                events: 0,
                financial: 0,
                urgent: 0,
                general: 0
            }
        };
        this.init();
    }

    init() {
        this.initSidebar();
        this.initEventListeners();
        this.loadNotices();
    }

    initSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        }
    }

    initEventListeners() {
        // Create notice button
        const createNoticeBtn = document.querySelector('.create-notice-btn');
        if (createNoticeBtn) {
            createNoticeBtn.addEventListener('click', () => {
                window.location.href = 'create-notice.html';
            });
        }

        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchNotices(e.target.value));
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadNotices() {
        try {
            // Load all notices with higher limit to get all data for stats
            const response = await noticeService.getAll({ limit: 100 });
            
            if (response.success && response.data) {
                this.notices = response.data;
                noticesData = response.data; // Also update global variable
                this.processNotices();
                this.renderStats();
                this.renderPublishedNotices();
                this.renderScheduledNotices();
                this.renderDraftNotices();
                this.renderDeliveryStats();
            } else {
                this.handleNoData();
            }
        } catch (error) {
            console.error('Error loading notices:', error);
            this.handleError();
        }
    }

    processNotices() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Separate notices by status
        this.publishedNotices = this.notices.filter(n => n.isPublished && (!n.expiryDate || new Date(n.expiryDate) > now));
        this.drafts = this.notices.filter(n => !n.isPublished);
        this.scheduled = this.notices.filter(n => n.isPublished && n.publishDate && new Date(n.publishDate) > now);

        // Calculate stats
        this.stats.totalNotices = this.publishedNotices.length;
        this.stats.totalDrafts = this.drafts.length;

        // Count notices sent this month
        this.stats.sentThisMonth = this.publishedNotices.filter(n => {
            const createdAt = new Date(n.createdAt);
            return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
        }).length;

        // Calculate read rate (based on views)
        const totalViews = this.publishedNotices.reduce((sum, n) => sum + (n.views || 0), 0);
        const totalNoticesWithViews = this.publishedNotices.filter(n => n.views > 0).length;
        this.stats.readRate = totalNoticesWithViews > 0 ? Math.round((totalViews / (totalNoticesWithViews * 100)) * 100) : 0;

        // Count by category/type
        this.stats.categories = {
            events: this.publishedNotices.filter(n => n.type === 'event' || n.type === 'meeting').length,
            financial: this.publishedNotices.filter(n => n.type === 'reminder').length,
            urgent: this.publishedNotices.filter(n => n.type === 'urgent' || n.priority === 'high').length,
            general: this.publishedNotices.filter(n => n.type === 'general' || n.type === 'important').length
        };
    }

    renderStats() {
        // Update quick stats
        const totalNoticesEl = document.getElementById('totalNotices');
        const sentThisMonthEl = document.getElementById('sentThisMonth');
        const readRateEl = document.getElementById('readRate');
        const totalDraftsEl = document.getElementById('totalDrafts');

        if (totalNoticesEl) totalNoticesEl.textContent = this.stats.totalNotices;
        if (sentThisMonthEl) sentThisMonthEl.textContent = this.stats.sentThisMonth;
        if (readRateEl) readRateEl.textContent = `${this.stats.readRate}%`;
        if (totalDraftsEl) totalDraftsEl.textContent = this.stats.totalDrafts;

        // Update category stats
        const categoryEventsEl = document.getElementById('categoryEvents');
        const categoryFinancialEl = document.getElementById('categoryFinancial');
        const categoryUrgentEl = document.getElementById('categoryUrgent');
        const categoryGeneralEl = document.getElementById('categoryGeneral');

        if (categoryEventsEl) categoryEventsEl.textContent = this.stats.categories.events;
        if (categoryFinancialEl) categoryFinancialEl.textContent = this.stats.categories.financial;
        if (categoryUrgentEl) categoryUrgentEl.textContent = this.stats.categories.urgent;
        if (categoryGeneralEl) categoryGeneralEl.textContent = this.stats.categories.general;
    }

    renderPublishedNotices() {
        const tbody = document.getElementById('publishedNoticesTable');
        if (!tbody) return;

        if (this.publishedNotices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <i class="fas fa-bullhorn" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><br>
                        <p style="color: #666; font-size: 16px;">No published notices found</p>
                        <p style="color: #999; font-size: 14px;">Create your first notice to get started</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.publishedNotices.map(notice => `
            <tr>
                <td>${this.escapeHtml(notice.title)}</td>
                <td>${this.formatCategory(notice.type)}</td>
                <td>${this.formatDate(notice.publishDate || notice.createdAt)}</td>
                <td>${notice.expiryDate ? this.formatDate(notice.expiryDate) : 'No expiry'}</td>
                <td>${notice.views || 0}</td>
                <td><span style="color: ${this.getPriorityColor(notice.priority)};">${this.formatPriority(notice.priority)}</span></td>
                <td><span class="status active">Active</span></td>
                <td>
                    <button class="btn" onclick="viewNotice('${notice.id}')" title="View"><i class="fas fa-eye"></i></button>
                    <button class="btn" onclick="editNotice('${notice.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                </td>
            </tr>
        `).join('');
    }

    renderScheduledNotices() {
        const tbody = document.getElementById('scheduledNoticesTable');
        if (!tbody) return;

        if (this.scheduled.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        <i class="fas fa-clock" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><br>
                        <p style="color: #666; font-size: 16px;">No scheduled notices</p>
                        <p style="color: #999; font-size: 14px;">Schedule notices to be sent later</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.scheduled.map(notice => `
            <tr>
                <td>${this.escapeHtml(notice.title)}</td>
                <td>${this.formatCategory(notice.type)}</td>
                <td>${this.formatDate(notice.publishDate)}</td>
                <td>${this.formatAudience(notice.audience)}</td>
                <td><span style="color: ${this.getPriorityColor(notice.priority)};">${this.formatPriority(notice.priority)}</span></td>
                <td><span class="status pending">Scheduled</span></td>
                <td>
                    <button class="btn" onclick="editNotice('${notice.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-reject" onclick="cancelNotice('${notice.id}')" title="Cancel">Cancel</button>
                </td>
            </tr>
        `).join('');
    }

    renderDraftNotices() {
        const tbody = document.getElementById('draftNoticesTable');
        if (!tbody) return;

        if (this.drafts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        <i class="fas fa-file-alt" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><br>
                        <p style="color: #666; font-size: 16px;">No draft notices</p>
                        <p style="color: #999; font-size: 14px;">Draft notices will appear here</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.drafts.map(notice => `
            <tr>
                <td>${this.escapeHtml(notice.title)}</td>
                <td>${this.formatCategory(notice.type)}</td>
                <td>${this.formatDate(notice.updatedAt)}</td>
                <td>${notice.authorName || 'Unknown'}</td>
                <td><span style="color: ${this.getPriorityColor(notice.priority)};">${this.formatPriority(notice.priority)}</span></td>
                <td><span class="status pending">Draft</span></td>
                <td>
                    <button class="btn" onclick="editNotice('${notice.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn approve" onclick="publishNotice('${notice.id}')" title="Publish">Publish</button>
                </td>
            </tr>
        `).join('');
    }

    renderDeliveryStats() {
        const tbody = document.getElementById('deliveryStatsTable');
        if (!tbody) return;

        // Show delivery stats based on published notices
        if (this.publishedNotices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-chart-line" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><br>
                        <p style="color: #666; font-size: 16px;">No delivery statistics available</p>
                        <p style="color: #999; font-size: 14px;">Publish notices to see delivery statistics</p>
                    </td>
                </tr>
            `;
            return;
        }

        // For demo, show statistics based on available data
        const stats = this.publishedNotices.slice(0, 5).map(notice => {
            const views = notice.views || 0;
            const estimatedDelivery = Math.max(views, 10); // Mock data for demo
            const estimatedOpened = Math.round(views * 0.8);
            const clickRate = Math.round((estimatedOpened / estimatedDelivery) * 100);
            
            return `
                <tr>
                    <td>${this.escapeHtml(notice.title)}</td>
                    <td>Email + SMS</td>
                    <td>${estimatedDelivery}</td>
                    <td>${estimatedDelivery} (100%)</td>
                    <td>${estimatedOpened} (${Math.round((estimatedOpened/estimatedDelivery)*100)}%)</td>
                    <td>${clickRate}%</td>
                </tr>
            `;
        });

        tbody.innerHTML = stats.join('');
    }

    handleNoData() {
        // Show empty state for all tables
        const tables = [
            { id: 'publishedNoticesTable', colspan: 8 },
            { id: 'scheduledNoticesTable', colspan: 7 },
            { id: 'draftNoticesTable', colspan: 7 },
            { id: 'deliveryStatsTable', colspan: 6 }
        ];
        tables.forEach(({ id, colspan }) => {
            const tbody = document.getElementById(id);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="${colspan}" style="text-align: center; padding: 40px;">
                            <i class="fas fa-inbox" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><br>
                            <p style="color: #666; font-size: 16px;">No data available</p>
                            <p style="color: #999; font-size: 14px;">Connect to the database to load notices</p>
                        </td>
                    </tr>
                `;
            }
        });

        // Set stats to 0
        this.renderStats();
    }

    handleError() {
        // Show error state for all tables
        const tables = ['publishedNoticesTable', 'scheduledNoticesTable', 'draftNoticesTable', 'deliveryStatsTable'];
        tables.forEach(id => {
            const tbody = document.getElementById(id);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 40px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545; margin-bottom: 15px;"></i><br>
                            <p style="color: #dc3545; font-size: 16px;">Error loading data</p>
                            <p style="color: #999; font-size: 14px;">Please check your connection and try again</p>
                        </td>
                    </tr>
                `;
            }
        });
    }

    searchNotices(query) {
        if (!query) {
            this.renderPublishedNotices();
            return;
        }

        const filtered = this.publishedNotices.filter(notice => 
            notice.title.toLowerCase().includes(query.toLowerCase()) ||
            notice.content.toLowerCase().includes(query.toLowerCase())
        );

        const tbody = document.getElementById('publishedNoticesTable');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <i class="fas fa-search" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><br>
                        <p style="color: #666; font-size: 16px;">No notices found matching "${this.escapeHtml(query)}"</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(notice => `
            <tr>
                <td>${this.escapeHtml(notice.title)}</td>
                <td>${this.formatCategory(notice.type)}</td>
                <td>${this.formatDate(notice.publishDate || notice.createdAt)}</td>
                <td>${notice.expiryDate ? this.formatDate(notice.expiryDate) : 'No expiry'}</td>
                <td>${notice.views || 0}</td>
                <td><span style="color: ${this.getPriorityColor(notice.priority)};">${this.formatPriority(notice.priority)}</span></td>
                <td><span class="status active">Active</span></td>
                <td>
                    <button class="btn" onclick="viewNotice('${notice.id}')" title="View"><i class="fas fa-eye"></i></button>
                    <button class="btn" onclick="editNotice('${notice.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                </td>
            </tr>
        `).join('');
    }

    async handleLogout() {
        if (await showConfirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_refresh_token');
            localStorage.removeItem('swa_user');
            window.location.href = '../../index.html';
        }
    }

    // Utility functions
    formatDate(date) {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    formatCategory(type) {
        const categories = {
            'event': 'Events',
            'meeting': 'Events',
            'reminder': 'Financial',
            'urgent': 'Urgent',
            'important': 'General',
            'general': 'General'
        };
        return categories[type] || 'General';
    }

    formatPriority(priority) {
        const priorities = {
            'high': 'High',
            'normal': 'Normal',
            'low': 'Low'
        };
        return priorities[priority] || 'Normal';
    }

    formatAudience(audience) {
        const audiences = {
            'all': 'All Members',
            'members': 'Members Only',
            'executives': 'Executives',
            'students': 'Students',
            'staff': 'Staff'
        };
        return audiences[audience] || 'All Members';
    }

    getPriorityColor(priority) {
        const colors = {
            'high': 'red',
            'normal': 'green',
            'low': 'green'
        };
        return colors[priority] || 'green';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for button actions
function viewNotice(id) {
    console.log('View notice:', id);
    
    // Find the notice from the loaded data
    const notice = noticesData.find(n => n.id === id);
    if (!notice) {
        showAlert('Notice not found', 'error');
        return;
    }
    
    // Populate modal with notice details
    document.getElementById('modalNoticeTitle').textContent = notice.title;
    document.getElementById('modalNoticeCategory').textContent = notice.type || 'general';
    document.getElementById('modalNoticePriority').textContent = notice.priority || 'normal';
    document.getElementById('modalNoticeAudience').textContent = notice.audience || 'all';
    document.getElementById('modalNoticeDate').textContent = formatDate(notice.createdAt);
    document.getElementById('modalNoticeExpiry').textContent = formatDate(notice.expiryDate);
    document.getElementById('modalNoticeViews').textContent = notice.views || 0;
    document.getElementById('modalNoticeContent').innerHTML = notice.content || '';
    
    // Set edit button to link to edit page
    const editBtn = document.getElementById('editNoticeBtn');
    editBtn.onclick = () => {
        closeNoticeModal();
        editNotice(id);
    };
    
    // Show modal
    const modal = document.getElementById('noticeModal');
    modal.classList.add('show');
    modal.style.display = 'flex';
}

function closeNoticeModal() {
    const modal = document.getElementById('noticeModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
}

function editNotice(id) {
    console.log('Edit notice:', id);
    window.location.href = `../admin/create-notice.html?id=${id}`;
}

async function cancelNotice(id) {
    if (await showConfirm('Are you sure you want to cancel this scheduled notice?')) {
        console.log('Cancel notice:', id);
        // Implement cancel notice functionality
    }
}

async function publishNotice(id) {
    if (await showConfirm('Are you sure you want to publish this draft notice?')) {
        console.log('Publish notice:', id);
        // Implement publish notice functionality
    }
}

// Make global functions available to window for inline onclick handlers
window.viewNotice = viewNotice;
window.closeNoticeModal = closeNoticeModal;
window.editNotice = editNotice;
window.cancelNotice = cancelNotice;
window.publishNotice = publishNotice;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new Notices();
}, 'Information', 'info');
