/**
 * Documentation Script
 * Handles documentation page functionality
 * Fetches data dynamically from database
 * 
 * @version 2.0.0
 * Updated to render dynamic data from database
 */

// Import services from src for consistency
import { authService, documentService, policyService } from '../../../services/index.js';

/**
 * Documentation Class
 * Manages the documentation dashboard page
 */
class Documentation {
    constructor() {
        this.documents = [];
        this.policies = [];
        this.dashboardData = {
            totalDocuments: 0,
            activePolicies: 0,
            documentsThisMonth: 0,
            categories: {},
            recentDocuments: [],
            documentRequests: [],
            recentUpdates: []
        };
        this.init();
    }

    init() {
        this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        this.loadDashboardData();
    }

    /**
     * Check if user is authenticated
     */
    checkAuth() {
        if (!authService.isAuthenticated()) {
            window.location.href = '../auth/login-page.html?redirect=../dashboard/documentation.html';
            return false;
        }
        return true;
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
        // Logout button
        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Action buttons - Add event listeners for action buttons
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const href = btn.getAttribute('href');
                if (href) {
                    window.location.href = href;
                }
            });
        });
    }

    /**
     * Load dashboard data from API
     */
    async loadDashboardData() {
        try {
            // Load admin info
            await this.loadAdminInfo();
            
            // Load documentation dashboard data
            await this.loadDocumentationData();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showEmptyState();
        }
    }

    /**
     * Load and display admin user information dynamically
     */
    async loadAdminInfo() {
        try {
            const user = authService.getCurrentUser();
            if (!user) {
                this.setDefaultAdminInfo();
                return;
            }

            // Update admin avatar
            const avatarEl = document.querySelector('.admin-avatar');
            if (avatarEl) {
                const initials = user.firstName ? user.firstName.charAt(0) + (user.lastName ? user.lastName.charAt(0) : '') : (user.username ? user.username.charAt(0) : 'A');
                avatarEl.textContent = initials.toUpperCase();
            }

            // Update admin details
            const nameEl = document.querySelector('.admin-details h3');
            if (nameEl) {
                nameEl.textContent = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.username || 'Administrator');
            }

            const roleEl = document.querySelector('.admin-role');
            if (roleEl) {
                roleEl.textContent = user.role ? `${this.formatRole(user.role)}, SWA` : 'SWA Member';
            }

        } catch (error) {
            console.error('Error loading admin info:', error);
            this.setDefaultAdminInfo();
        }
    }

    /**
     * Set default admin info when data is unavailable
     */
    setDefaultAdminInfo() {
        const avatarEl = document.querySelector('.admin-avatar');
        if (avatarEl) {
            avatarEl.textContent = 'AD';
        }

        const nameEl = document.querySelector('.admin-details h3');
        if (nameEl) {
            nameEl.textContent = 'Administrator';
        }

        const roleEl = document.querySelector('.admin-role');
        if (roleEl) {
            roleEl.textContent = 'SWA Admin';
        }
    }

    /**
     * Format user role for display
     */
    formatRole(role) {
        const roleMap = {
            'admin': 'Administrator',
            'chairman': 'Chairman',
            'vice_chairman': 'Vice Chairman',
            'secretary': 'Secretary',
            'treasurer': 'Treasurer',
            'pro': 'PRO',
            'member': 'Member'
        };
        return roleMap[role] || role;
    }

    /**
     * Load documentation data from database
     */
    async loadDocumentationData() {
        try {
            // Fetch dashboard data from API
            const response = await documentService.getDashboard();
            
            if (response.success && response.data) {
                this.dashboardData = response.data;
                this.renderDashboard();
            } else {
                console.warn('Failed to load documentation data:', response.message);
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading documentation data:', error);
            this.showEmptyState();
        }
    }

    /**
     * Render dashboard with fetched data
     */
    renderDashboard() {
        this.renderStats();
        this.renderCategories();
        this.renderDocumentsList();
        this.renderDocumentRequests();
        this.renderRecentUpdates();
    }

    /**
     * Render recent document updates
     */
    renderRecentUpdates() {
        const tbody = document.querySelector('#section-docs .data-section:nth-of-type(2) tbody');
        if (!tbody) return;

        const updates = this.dashboardData.recentUpdates || [];
        const recentDocs = this.dashboardData.recentDocuments || [];

        // If no recent updates from tracking, generate from recent documents
        if (updates.length === 0 && recentDocs.length > 0) {
            const simulatedUpdates = recentDocs.slice(0, 4).map(doc => ({
                date: doc.updatedAt,
                document: doc.name,
                changeType: 'Update',
                updatedBy: 'System',
                notes: 'Document updated'
            }));

            tbody.innerHTML = simulatedUpdates.map(update => `
                <tr>
                    <td>${this.formatDate(update.date)}</td>
                    <td>${this.escapeHtml(update.document)}</td>
                    <td><span style="color: orange;">${update.changeType}</span></td>
                    <td>${this.escapeHtml(update.updatedBy)}</td>
                    <td>${this.escapeHtml(update.notes)}</td>
                </tr>
            `).join('');
        } else if (updates.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #999;">
                        No recent updates
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = updates.map(update => `
                <tr>
                    <td>${this.formatDate(update.date)}</td>
                    <td>${this.escapeHtml(update.document)}</td>
                    <td><span style="color: ${update.changeType === 'Addition' ? 'blue' : (update.changeType === 'Amendment' ? 'green' : 'orange')}">${update.changeType}</span></td>
                    <td>${this.escapeHtml(update.updatedBy)}</td>
                    <td>${this.escapeHtml(update.notes)}</td>
                </tr>
            `).join('');
        }
    }

    /**
     * Render document access requests
     */
    renderDocumentRequests() {
        const tbody = document.querySelector('#section-docs .data-section:nth-of-type(3) tbody');
        if (!tbody) return;

        const requests = this.dashboardData.documentRequests || [];

        if (requests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #999;">
                        No pending requests
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = requests.map(req => {
            const statusClass = req.status === 'pending' ? 'pending' : (req.status === 'approved' ? 'received' : 'rejected');
            const statusText = req.status === 'pending' ? 'Pending' : (req.status === 'approved' ? 'Approved' : 'Rejected');
            const requesterName = req.requester ? `${req.requester.firstName || ''} ${req.requester.lastName || ''}`.trim() : 'Unknown';
            const docName = req.document ? req.document.name : 'Unknown Document';
            const requestDate = this.formatDate(req.createdAt);

            return `
                <tr>
                    <td>${this.escapeHtml(requesterName)}</td>
                    <td>${this.escapeHtml(docName)}</td>
                    <td>${requestDate}</td>
                    <td>${this.escapeHtml(req.purpose || '-')}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td>
                        ${req.status === 'pending' ? `
                            <button class="btn approve" onclick="handleRequest('${req.id}', 'approved')">✓ Approve</button>
                            <button class="btn btn-reject" onclick="handleRequest('${req.id}', 'rejected')">✗ Deny</button>
                        ` : `
                            <button class="btn"><i class="fas fa-envelope"></i> Send</button>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Render statistics cards
     */
    renderStats() {
        // Total Documents
        const totalDocsEl = document.querySelector('.cards .card:nth-child(1) .stat-number');
        if (totalDocsEl) {
            totalDocsEl.textContent = this.dashboardData.totalDocuments || '0';
        }

        // Active Policies (from total documents count as guides)
        const policiesEl = document.querySelector('.cards .card:nth-child(2) .stat-number');
        if (policiesEl) {
            policiesEl.textContent = this.dashboardData.activePolicies || '0';
        }

        // Guides (using policies count)
        const guidesEl = document.querySelector('.cards .card:nth-child(3) .stat-number');
        if (guidesEl) {
            guidesEl.textContent = this.dashboardData.activePolicies || '0';
        }

        // Downloads This Month
        const downloadsEl = document.querySelector('.cards .card:nth-child(4) .stat-number');
        if (downloadsEl) {
            downloadsEl.textContent = this.dashboardData.documentsThisMonth || '0';
        }
    }

    /**
     * Render document categories
     */
    renderCategories() {
        const categories = this.dashboardData.categories || {};
        
        // Map database categories to display categories
        const categoryMapping = {
            'policy': { index: 1, desc: 'Constitution & By-laws' },
            'financial': { index: 2, desc: 'Financial Guidelines' },
            'membership': { index: 3, desc: 'Member Guidelines' },
            'meeting': { index: 4, desc: 'Procedures' },
            'report': { index: 1, desc: 'Reports' },
            'other': { index: 4, desc: 'Other Documents' }
        };

        // Constitution & By-laws
        const constitutionCount = categories['policy'] || 0;
        const constitutionEl = document.querySelector('.summary-stats .stats-grid .stat-item:nth-child(1) .stat-value');
        if (constitutionEl) {
            constitutionEl.textContent = constitutionCount || '0';
        }

        // Financial Guidelines
        const financialCount = categories['financial'] || 0;
        const financialEl = document.querySelector('.summary-stats .stats-grid .stat-item:nth-child(2) .stat-value');
        if (financialEl) {
            financialEl.textContent = financialCount || '0';
        }

        // Member Guidelines
        const memberCount = categories['membership'] || 0;
        const memberEl = document.querySelector('.summary-stats .stats-grid .stat-item:nth-child(3) .stat-value');
        if (memberEl) {
            memberEl.textContent = memberCount || '0';
        }

        // Procedures
        const proceduresCount = (categories['meeting'] || 0) + (categories['report'] || 0) + (categories['other'] || 0);
        const proceduresEl = document.querySelector('.summary-stats .stats-grid .stat-item:nth-child(4) .stat-value');
        if (proceduresEl) {
            proceduresEl.textContent = proceduresCount || '0';
        }
    }

    /**
     * Render documents list table
     */
    renderDocumentsList() {
        const tbody = document.querySelector('#section-docs .data-section:nth-of-type(1) tbody');
        if (!tbody) return;

        const documents = this.dashboardData.recentDocuments || [];

        if (documents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 30px;">
                        <i class="fas fa-folder-open" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                        <p style="color: #666;">No documents found</p>
                        <p style="color: #999; font-size: 14px;">Upload documents to see them listed here</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = documents.map(doc => {
            const iconClass = this.getFileIcon(doc.mimeType);
            const iconColor = this.getFileIconColor(doc.mimeType);
            const size = this.formatFileSize(doc.size);
            const date = this.formatDate(doc.updatedAt);
            const status = 'Active';

            return `
                <tr>
                    <td><i class="${iconClass}" style="color: ${iconColor};"></i> ${this.escapeHtml(doc.name || 'Untitled Document')}</td>
                    <td>${this.formatCategory(doc.category)}</td>
                    <td>${this.getFileExtension(doc.mimeType)}</td>
                    <td>${size}</td>
                    <td>${date}</td>
                    <td>v${doc.version || '1.0'}</td>
                    <td><span class="status active">${status}</span></td>
                    <td>
                        <button class="btn"><i class="fas fa-eye"></i></button>
                        <button class="btn"><i class="fas fa-download"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Get file icon based on MIME type
     */
    getFileIcon(mimeType) {
        if (!mimeType) return 'fas fa-file';
        
        if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'fas fa-file-word';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'fas fa-file-excel';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'fas fa-file-powerpoint';
        if (mimeType.includes('image')) return 'fas fa-file-image';
        if (mimeType.includes('text')) return 'fas fa-file-alt';
        
        return 'fas fa-file';
    }

    /**
     * Get file icon color based on MIME type
     */
    getFileIconColor(mimeType) {
        if (!mimeType) return '#666';
        
        if (mimeType.includes('pdf')) return 'red';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'blue';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'green';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'orange';
        
        return '#666';
    }

    /**
     * Get file extension from MIME type
     */
    getFileExtension(mimeType) {
        if (!mimeType) return 'FILE';
        
        const extensionMap = {
            'pdf': 'PDF',
            'word': 'DOCX',
            'document': 'DOCX',
            'excel': 'XLSX',
            'sheet': 'XLSX',
            'powerpoint': 'PPTX',
            'presentation': 'PPTX',
            'image': 'IMG',
            'text': 'TXT'
        };

        for (const [key, value] of Object.entries(extensionMap)) {
            if (mimeType.includes(key)) return value;
        }

        return 'FILE';
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch (e) {
            return 'N/A';
        }
    }

    /**
     * Format category for display
     */
    formatCategory(category) {
        if (!category) return 'Other';
        
        const categoryMap = {
            'policy': 'Constitution',
            'financial': 'Finance',
            'membership': 'Guidelines',
            'meeting': 'Procedures',
            'report': 'Reports',
            'other': 'Other'
        };
        
        return categoryMap[category.toLowerCase()] || category;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show empty state when no data available
     */
    showEmptyState() {
        // Set all stats to 0 or message
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(el => {
            el.textContent = '0';
        });

        // Show empty message in documents table
        const tbody = document.querySelector('#section-docs .data-section:nth-of-type(1) tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 30px;">
                        <i class="fas fa-folder-open" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                        <p style="color: #666;">No documents found</p>
                        <p style="color: #999; font-size: 14px;">Upload documents to see them listed here</p>
                    </td>
                </tr>
            `;
        }

        // Show empty message in recent updates
        const recentUpdatesTbody = document.querySelector('#section-docs .data-section:nth-of-type(2) tbody');
        if (recentUpdatesTbody) {
            recentUpdatesTbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #999;">
                        No recent updates
                    </td>
                </tr>
            `;
        }

        // Show empty message in document requests
        const requestsTbody = document.querySelector('#section-docs .data-section:nth-of-type(3) tbody');
        if (requestsTbody) {
            requestsTbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #999;">
                        No pending requests
                    </td>
                </tr>
            `;
        }
    }

    /**
     * Handle logout
     */
    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_refresh_token');
            localStorage.removeItem('swa_user');
            window.location.href = '../../index.html';
        }
    }

    /**
     * Handle document request approval/rejection
     * @param {string} requestId - Request ID
     * @param {string} status - New status (approved/rejected)
     */
    async handleRequest(requestId, status) {
        try {
            const confirmed = confirm(`Are you sure you want to ${status} this request?`);
            if (!confirmed) return;

            const response = await documentService.updateRequestStatus(requestId, status);
            
            if (response.success) {
                // Reload dashboard data to refresh the table
                await this.loadDocumentationData();
            } else {
                alert('Failed to process request: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error processing request:', error);
            alert('Error processing request. Please try again.');
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const docs = new Documentation();
    // Make handleRequest available globally for onclick handlers
    window.handleRequest = (requestId, status) => docs.handleRequest(requestId, status);
});
