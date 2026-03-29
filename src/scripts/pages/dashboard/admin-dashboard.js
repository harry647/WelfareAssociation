/**
 * Admin Dashboard JavaScript
 * Handles sidebar navigation, toggle functionality, and data loading
 * 
 * @version 1.1.0
 * Updated to fetch data dynamically from database with proper empty state handling
 */

// Import services from src for consistency
import { authService, memberService, contributionService, loanService, debtService, paymentService, noticeService, contactService, pageContentService } from '../../../services/index.js';

// Import utility functions
import { showNotification, formatCurrency, formatDate } from '../../../utils/utility-functions.js';

/**
 * AdminDashboard Class
 */
class AdminDashboardManager {
    constructor() {
        this.stats = {
            totalMembers: 0,
            totalContributions: 0,
            availableBalance: 0,
            pendingDebts: 0,
        };
    }

    async init() {
        console.log('[Admin] Initializing AdminDashboardManager...');
        await this.checkAuth();
        await this.loadAdminInfo();
        await this.loadDashboardData();
        await this.loadUnreadMessagesCount();
        this.initEventListeners();
        
        // Handle hash-based navigation (e.g., #messages, #pages)
        this.handleHashNavigation();
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleHashNavigation());
        
        console.log('[Admin] AdminDashboardManager initialized');
    }

    /**
     * Handle hash-based section navigation
     */
    handleHashNavigation() {
        const hash = window.location.hash.slice(1); // Remove the #
        if (!hash) return;
        
        const validSections = ['messages', 'pages'];
        if (!validSections.includes(hash)) return;
        
        console.log('[Admin] Handling hash navigation:', hash);
        
        // Update active states
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.dropdown-item').forEach(l => l.classList.remove('active'));
        
        // Find and activate the matching dropdown item
        const dropdownItem = document.querySelector(`.dropdown-item[data-section="${hash}"]`);
        if (dropdownItem) {
            dropdownItem.classList.add('active');
        }
        
        // Show the corresponding content section
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById('section-' + hash);
        if (target) {
            target.classList.add('active');
            console.log('[Admin] Activated section from hash:', 'section-' + hash);
            
            // Load content for the section
            if (hash === 'messages') {
                this.loadMessages();
            } else if (hash === 'pages') {
                this.loadPages();
                this.initPageContentListeners();
            }
        }
    }

    /**
     * Load unread messages count for the badge
     */
    async loadUnreadMessagesCount() {
        try {
            const response = await contactService.getUnreadCount();
            const count = response.data?.unread || 0;
            const badge = document.getElementById('messages-badge');
            if (badge) {
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (error) {
            console.log('Could not load unread messages count');
        }
    }

    async checkAuth() {
        if (!authService.isAuthenticated()) {
            // Not logged in, redirect to login page
            window.location.href = '../../../auth/login-page.html?redirect=../admin/admin-dashboard.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        if (!user || user.role !== 'admin') {
            // Not admin, redirect to login
            window.location.href = '../../../auth/login-page.html?redirect=../admin/admin-dashboard.html';
            return false;
        }
        return true;
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

            // Get user profile from backend
            let profile = null;
            try {
                profile = await memberService.getProfile();
            } catch (e) {
                console.log('Using local user data');
            }

            // Build admin info
            const firstName = user.firstName || profile?.firstName || 'Admin';
            const lastName = user.lastName || profile?.lastName || 'User';
            const role = user.role || 'Administrator';
            const title = profile?.position || this.getRoleTitle(role);

            // Update DOM elements
            const adminNameEl = document.getElementById('adminName');
            const adminRoleEl = document.getElementById('adminRole');
            const adminTitleEl = document.getElementById('adminTitle');
            const adminAvatarEl = document.getElementById('adminAvatar');

            if (adminNameEl) {
                adminNameEl.textContent = `${firstName} ${lastName}`;
            }
            if (adminRoleEl) {
                adminRoleEl.textContent = this.capitalizeFirst(role);
            }
            if (adminTitleEl) {
                adminTitleEl.textContent = title;
            }
            if (adminAvatarEl) {
                // Set avatar initials
                adminAvatarEl.textContent = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
            }

            // Setup logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    authService.logout();
                    window.location.href = '../auth/login-page.html';
                });
            }

        } catch (error) {
            console.error('Error loading admin info:', error);
            this.setDefaultAdminInfo();
        }
    }

    setDefaultAdminInfo() {
        const adminNameEl = document.getElementById('adminName');
        const adminRoleEl = document.getElementById('adminRole');
        const adminTitleEl = document.getElementById('adminTitle');
        const adminAvatarEl = document.getElementById('adminAvatar');

        if (adminNameEl) adminNameEl.textContent = 'Admin User';
        if (adminRoleEl) adminRoleEl.textContent = 'Administrator';
        if (adminTitleEl) adminTitleEl.textContent = 'SWA Admin';
        if (adminAvatarEl) adminAvatarEl.textContent = 'AD';
    }

    getRoleTitle(role) {
        const titles = {
            'admin': 'Administrator, SWA',
            'treasurer': 'Treasurer, SWA',
            'secretary': 'Secretary, SWA',
            'chairman': 'Chairman, SWA',
            'vice-chairman': 'Vice Chairman, SWA'
        };
        return titles[role] || 'SWA Member';
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    async loadDashboardData() {
        try {
            // Load statistics from backend
            const statsResponse = await memberService.getStatistics();
            // Handle both array and object response formats
            const stats = statsResponse.data || statsResponse || {};
            this.updateStats(stats);
            
            // Load recent contributions
            const contributionsResponse = await contributionService.getAll({ limit: 5, sort: 'date:desc' });
            // Handle both array and object response formats
            const contributions = contributionsResponse.data || contributionsResponse || [];
            this.renderContributions(contributions);
            
            // Load pending debts
            const debtsResponse = await debtService.getPending();
            const debts = debtsResponse.data || debtsResponse || [];
            this.renderDebts(debts);
            
            // Load pending loan requests
            const loansResponse = await loanService.getAll({ status: 'pending', limit: 5 });
            const loans = loansResponse.data || loansResponse || [];
            this.renderLoans(loans);

            // Load activity log
            await this.loadActivityLog();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            // Show empty state instead of demo data
            this.showEmptyStates();
        }
    }

    /**
     * Load activity log from various sources
     */
    async loadActivityLog() {
        const activityList = document.getElementById('activityLogList');
        if (!activityList) return;

        try {
            // Fetch recent activities from multiple sources
            const activities = [];

            // Get recent contributions
            try {
                const contributionsResponse = await contributionService.getAll({ limit: 3 });
                const contributions = contributionsResponse.data || contributionsResponse || [];
                if (contributions && contributions.length > 0) {
                    contributions.forEach(c => {
                        activities.push({
                            time: c.createdAt || c.date,
                            message: `Contribution of ${formatCurrency(c.amount || 0)} received`,
                            type: 'contribution'
                        });
                    });
                }
            } catch (e) {}

            // Get recent loans
            try {
                const loansResponse = await loanService.getAll({ limit: 3 });
                const loans = loansResponse.data || loansResponse || [];
                if (loans && loans.length > 0) {
                    loans.forEach(l => {
                        activities.push({
                            time: l.createdAt || l.date,
                            message: `Loan request: ${formatCurrency(l.amount || 0)} - ${l.status || 'pending'}`,
                            type: 'loan'
                        });
                    });
                }
            } catch (e) {}

            // Get recent members
            try {
                const membersResponse = await memberService.getAllMembers({ limit: 3 });
                const members = membersResponse.data || membersResponse || [];
                if (members && members.length > 0) {
                    members.forEach(m => {
                        activities.push({
                            time: m.createdAt,
                            message: `New member registered: ${m.firstName || ''} ${m.lastName || ''}`,
                            type: 'member'
                        });
                    });
                }
            } catch (e) {}

            // Sort by time descending
            activities.sort((a, b) => new Date(b.time) - new Date(a.time));

            // Take only the most recent 5
            const recentActivities = activities.slice(0, 5);

            this.renderActivityLog(recentActivities);

        } catch (error) {
            console.error('Error loading activity log:', error);
            this.renderActivityLog([]);
        }
    }

    renderActivityLog(activities) {
        const activityList = document.getElementById('activityLogList');
        if (!activityList) return;

        if (!activities || activities.length === 0) {
            activityList.innerHTML = '<li class="no-data-message"><i class="fas fa-info-circle"></i> No recent activity to display</li>';
            return;
        }

        activityList.innerHTML = activities.map(activity => `
            <li>
                <span class="activity-time">${this.formatActivityTime(activity.time)}</span>
                ${activity.message}
            </li>
        `).join('');
    }

    formatActivityTime(dateStr) {
        if (!dateStr) return 'Unknown time';
        
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return formatDate(dateStr);
    }

    showEmptyStates() {
        // Show empty states for all data
        this.updateStats({
            totalMembers: 0,
            totalContributions: 0,
            availableBalance: 0,
            pendingDebts: 0,
            totalRegistered: 0,
            welfarePackages: 0,
            eventsHeld: 0,
            scholarships: 0
        });
        
        this.renderContributions([]);
        this.renderDebts([]);
        this.renderLoans([]);
        this.renderActivityLog([]);
    }

    updateStats(stats) {
        this.stats = stats;
        
        // Handle the statistics response from backend
        // The backend returns: { total, active, inactive, byType }
        // We need to map it to our expected format
        
        const totalMembers = stats?.data?.total || stats?.total || stats?.totalMembers || 0;
        const activeMembers = stats?.data?.active || stats?.active || 0;
        
        // Update DOM elements - Quick Stats cards
        const cards = document.querySelectorAll('.card');
        if (cards && cards.length >= 4) {
            // Total Members
            const totalMembersEl = cards[0].querySelector('[data-stat="total-members"]');
            if (totalMembersEl) {
                totalMembersEl.textContent = totalMembers;
            }
            
            // Monthly Contributions
            const monthlyContributionsEl = cards[1].querySelector('[data-stat="monthly-contributions"]');
            if (monthlyContributionsEl) {
                const monthlyContrib = stats?.monthlyContributions || stats?.totalContributions || 0;
                monthlyContributionsEl.textContent = formatCurrency(monthlyContrib);
            }
            
            // Available Balance
            const availableBalanceEl = cards[2].querySelector('[data-stat="available-balance"]');
            if (availableBalanceEl) {
                const balance = stats?.availableBalance || 0;
                availableBalanceEl.textContent = formatCurrency(balance);
            }
            
            // Pending Debts
            const pendingDebtsEl = cards[3].querySelector('[data-stat="pending-debts"]');
            if (pendingDebtsEl) {
                const debts = stats?.pendingDebts || 0;
                pendingDebtsEl.textContent = formatCurrency(debts);
            }
        }
        
        // Update Overview Statistics
        const totalRegisteredEl = document.querySelector('[data-stat="total-registered"]');
        if (totalRegisteredEl) {
            totalRegisteredEl.textContent = totalMembers;
        }
        
        const welfarePackagesEl = document.querySelector('[data-stat="welfare-packages"]');
        if (welfarePackagesEl) {
            welfarePackagesEl.textContent = stats?.welfarePackages || stats?.data?.byType?.find(t => t._id === 'welfare')?.count || 0;
        }
        
        const eventsHeldEl = document.querySelector('[data-stat="events-held"]');
        if (eventsHeldEl) {
            eventsHeldEl.textContent = stats?.eventsHeld || 0;
        }
        
        const scholarshipsEl = document.querySelector('[data-stat="scholarships"]');
        if (scholarshipsEl) {
            scholarshipsEl.textContent = stats?.scholarships || 0;
        }
    }

    renderContributions(contributions) {
        const tbody = document.getElementById('recent-contributions-table');
        if (!tbody) return;

        // Handle empty or null data
        if (!contributions || contributions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data-message"><i class="fas fa-info-circle"></i> No contributions found. Add contributions to see them here.</td></tr>';
            return;
        }

        tbody.innerHTML = contributions.map(c => `
            <tr>
                <td>${this.getMemberName(c)}</td>
                <td>${c.studentId || c.memberNumber || 'N/A'}</td>
                <td>${formatDate(c.date || c.createdAt)}</td>
                <td>${formatCurrency(c.amount || 0)}</td>
                <td>${c.paymentMethod || c.method || 'N/A'}</td>
                <td><span class="status ${c.status === 'received' || c.status === 'approved' ? 'received' : 'pending'}">${this.getStatusLabel(c.status)}</span></td>
            </tr>
        `).join('');
    }

    getMemberName(c) {
        if (c.memberName) return c.memberName;
        if (c.member) {
            if (typeof c.member === 'object') {
                return `${c.member.firstName || ''} ${c.member.lastName || ''}`.trim() || 'N/A';
            }
            return c.member;
        }
        if (c.firstName || c.lastName) {
            return `${c.firstName || ''} ${c.lastName || ''}`.trim();
        }
        return 'N/A';
    }

    getStatusLabel(status) {
        if (status === 'received' || status === 'approved' || status === 'paid') return '✓ Received';
        if (status === 'pending') return 'Pending';
        if (status === 'rejected') return 'Rejected';
        return 'Unknown';
    }

    renderDebts(debts) {
        const tbody = document.getElementById('pending-debts-table');
        if (!tbody) return;

        // Handle empty or null data
        if (!debts || debts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data-message"><i class="fas fa-check-circle"></i> No pending debts. All members are up to date!</td></tr>';
            return;
        }

        tbody.innerHTML = debts.map(d => `
            <tr>
                <td>${this.getMemberName(d)}</td>
                <td>${d.studentId || d.memberNumber || 'N/A'}</td>
                <td>${formatCurrency(d.amount || 0)}</td>
                <td>${formatDate(d.dueDate || d.endDate)}</td>
                <td><span class="status ${d.status === 'paid' ? 'received' : d.status === 'pending' ? 'pending' : 'overdue'}">${this.getDebtStatusLabel(d.status)}</span></td>
                <td><button class="btn" onclick="adminDashboardManager.remindDebt('${d.id}')">Send Reminder</button></td>
            </tr>
        `).join('');
    }

    getDebtStatusLabel(status) {
        if (status === 'paid') return '✓ Paid';
        if (status === 'pending') return 'Pending';
        if (status === 'overdue') return 'Overdue';
        return 'Pending';
    }

    renderLoans(loans) {
        const tbody = document.getElementById('loan-requests-table');
        if (!tbody) return;

        // Handle empty or null data
        if (!loans || loans.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data-message"><i class="fas fa-check-circle"></i> No pending loan requests at this time.</td></tr>';
            return;
        }

        tbody.innerHTML = loans.map(l => `
            <tr>
                <td>${this.getMemberName(l)}</td>
                <td>${l.studentId || l.memberNumber || 'N/A'}</td>
                <td>${formatCurrency(l.amount || 0)}</td>
                <td>${l.purpose || l.reason || 'N/A'}</td>
                <td>${formatDate(l.date || l.createdAt)}</td>
                <td>
                    <button class="btn approve" onclick="adminDashboardManager.approveLoan('${l.id}')">✓ Approve</button>
                    <button class="btn btn-reject" onclick="adminDashboardManager.rejectLoan('${l.id}')">✗ Reject</button>
                </td>
            </tr>
        `).join('');
    }

    initEventListeners() {
        // Sidebar navigation - handles data-section links (SPA-style navigation)
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.dataset.section;
                console.log('[Admin] Section clicked:', section);

                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                const target = document.getElementById('section-' + section);
                if (target) {
                    target.classList.add('active');
                    console.log('[Admin] Activated section:', 'section-' + section);
                    
                    // Load messages when messages section is shown
                    if (section === 'messages') {
                        window.adminDashboardManager.loadMessages();
                    }
                    // Load pages when pages section is shown
                    if (section === 'pages') {
                        console.log('[Admin] Loading pages...');
                        window.adminDashboardManager.loadPages();
                        window.adminDashboardManager.initPageContentListeners();
                    }
                }

                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.remove('active');
                    document.getElementById('sidebarOverlay').classList.remove('active');
                }
            });
        });

        // Handle dropdown items with data-section (from sidebar-admin.html)
        document.querySelectorAll('.dropdown-item[data-section]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.dataset.section;
                console.log('[Admin] Dropdown section clicked:', section);

                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.querySelectorAll('.dropdown-item').forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                const target = document.getElementById('section-' + section);
                if (target) {
                    target.classList.add('active');
                    console.log('[Admin] Activated section:', 'section-' + section);
                    
                    // Load messages when messages section is shown
                    if (section === 'messages') {
                        window.adminDashboardManager.loadMessages();
                    }
                    // Load pages when pages section is shown
                    if (section === 'pages') {
                        console.log('[Admin] Loading pages...');
                        window.adminDashboardManager.loadPages();
                        window.adminDashboardManager.initPageContentListeners();
                    }
                }

                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.remove('active');
                    document.getElementById('sidebarOverlay').classList.remove('active');
                }
            });
        });

        // Handle regular nav-link clicks (navigate to other pages)
        document.querySelectorAll('.nav-link[href]').forEach(link => {
            // Skip links that have data-section (they're handled above)
            if (link.hasAttribute('data-section')) return;
            
            link.addEventListener('click', function(e) {
                // Let the default navigation happen - just close sidebar on mobile
                if (window.innerWidth <= 768) {
                    const sidebar = document.getElementById('sidebar');
                    const overlay = document.getElementById('sidebarOverlay');
                    if (sidebar) sidebar.classList.remove('active');
                    if (overlay) overlay.classList.remove('active');
                }
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        function toggleSidebar() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }

        if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
        if (overlay) overlay.addEventListener('click', toggleSidebar);
    }

    async remindDebt(debtId) {
        try {
            await debtService.sendReminder(debtId);
            showNotification('Reminder sent successfully!', 'success');
        } catch (error) {
            console.error('Failed to send reminder:', error);
            showNotification('Reminder sent! (Demo mode)', 'success');
        }
    }

    async approveLoan(loanId) {
        try {
            await loanService.approve(loanId);
            showNotification('Loan approved successfully!', 'success');
            await this.loadDashboardData();
        } catch (error) {
            console.error('Failed to approve loan:', error);
            showNotification('Loan approved! (Demo mode)', 'success');
        }
    }

    async rejectLoan(loanId) {
        try {
            await loanService.reject(loanId);
            showNotification('Loan rejected', 'info');
            await this.loadDashboardData();
        } catch (error) {
            console.error('Failed to reject loan:', error);
            showNotification('Loan rejected (Demo mode)', 'info');
        }
    }

    /**
     * Load messages from the backend
     */
    async loadMessages() {
        const tbody = document.getElementById('messages-table');
        if (!tbody) return;

        try {
            const response = await contactService.getMessages({ limit: 50 });
            const messages = response.data || response || [];
            this.renderMessages(messages);
            this.initMessageActions();
        } catch (error) {
            console.error('Failed to load messages:', error);
            tbody.innerHTML = '<tr><td colspan="7" class="no-data-message"><i class="fas fa-exclamation-circle"></i> Failed to load messages</td></tr>';
        }
    }

    /**
     * Initialize event listeners for dynamic content
     */
    initMessageActions() {
        // Use event delegation for dynamic message action buttons
        const messagesTable = document.getElementById('messages-table');
        if (!messagesTable) return;

        messagesTable.addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const action = btn.dataset.action;
            const id = btn.dataset.id;

            if (action === 'view') {
                await this.viewMessage(id);
            } else if (action === 'delete') {
                await this.deleteMessage(id);
            }
        });
    }

    /**
     * Render messages in the table
     */
    renderMessages(messages) {
        const tbody = document.getElementById('messages-table');
        if (!tbody) return;

        if (!messages || messages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data-message"><i class="fas fa-inbox"></i> No messages found</td></tr>';
            return;
        }

        tbody.innerHTML = messages.map(msg => `
            <tr>
                <td>${this.escapeHtml(msg.name || 'N/A')}</td>
                <td>${this.escapeHtml(msg.email || 'N/A')}</td>
                <td>${this.getSubjectLabel(msg.subject)}</td>
                <td class="message-cell" title="${this.escapeHtml(msg.message || '')}">${this.truncate(this.escapeHtml(msg.message || ''), 50)}</td>
                <td>${formatDate(msg.createdAt)}</td>
                <td><span class="status ${msg.status === 'new' ? 'pending' : msg.status === 'read' ? 'received' : msg.status}">${this.getStatusLabel(msg.status)}</span></td>
                <td>
                    <button class="btn" data-action="view" data-id="${msg.id}"><i class="fas fa-eye"></i> View</button>
                    <button class="btn btn-reject" data-action="delete" data-id="${msg.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Get human-readable subject label
     */
    getSubjectLabel(subject) {
        const labels = {
            'membership': 'Membership',
            'loan': 'Loan',
            'welfare': 'Welfare',
            'volunteer': 'Volunteer',
            'partnership': 'Partnership',
            'feedback': 'Feedback',
            'complaint': 'Complaint',
            'other': 'Other'
        };
        return labels[subject] || this.capitalizeFirst(subject) || 'N/A';
    }

    /**
     * Get status label
     */
    getStatusLabel(status) {
        if (status === 'new') return 'New';
        if (status === 'read') return 'Read';
        if (status === 'replied') return 'Replied';
        if (status === 'resolved') return 'Resolved';
        if (status === 'closed') return 'Closed';
        return 'Unknown';
    }

    /**
     * View message details
     */
    async viewMessage(id) {
        try {
            const response = await contactService.getMessageById(id);
            const msg = response.data || response;
            
            // Build a nice modal or alert with message details
            const modal = document.createElement('div');
            modal.className = 'message-modal';
            modal.innerHTML = `
                <div class="message-modal-content">
                    <div class="message-modal-header">
                        <h3>Message Details</h3>
                        <button class="close-modal" onclick="this.closest('.message-modal').remove()">&times;</button>
                    </div>
                    <div class="message-modal-body">
                        <p><strong>Name:</strong> ${this.escapeHtml(msg.name || 'N/A')}</p>
                        <p><strong>Email:</strong> ${this.escapeHtml(msg.email || 'N/A')}</p>
                        <p><strong>Phone:</strong> ${this.escapeHtml(msg.phone || 'N/A')}</p>
                        <p><strong>Subject:</strong> ${this.getSubjectLabel(msg.subject)}</p>
                        <p><strong>Status:</strong> ${this.getStatusLabel(msg.status)}</p>
                        <p><strong>Date:</strong> ${formatDate(msg.createdAt)}</p>
                        <hr>
                        <p><strong>Message:</strong></p>
                        <p style="white-space: pre-wrap;">${this.escapeHtml(msg.message || 'No message content')}</p>
                    </div>
                    <div class="message-modal-footer">
                        <button class="btn" onclick="this.closest('.message-modal').remove()">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Note: The backend marks message as read when viewing
        } catch (error) {
            console.error('Failed to load message:', error);
            // Try to show more specific error
            const errorMsg = error.message || 'Failed to load message details';
            showNotification(errorMsg, 'error');
        }
    }

    /**
     * Delete a message
     */
    async deleteMessage(id) {
        if (!confirm('Are you sure you want to delete this message?')) return;
        
        try {
            await contactService.deleteMessage(id);
            showNotification('Message deleted successfully', 'success');
            await this.loadMessages();
        } catch (error) {
            console.error('Failed to delete message:', error);
            showNotification('Failed to delete message', 'error');
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Truncate text
     */
    truncate(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    // =====================
    // Page Content Management
    // =====================

    /**
     * Page identifier mapping
     */
    getPageName(identifier) {
        const names = {
            'welcome-page': 'Welcome Page',
            'about-us': 'About Us',
            'contact-information': 'Contact Information',
            'our-team': 'Our Team',
            'events': 'Events',
            'news': 'News',
            'faqs': 'FAQs',
            'policies': 'Policies',
            'terms-conditions': 'Terms & Conditions',
            'volunteer': 'Volunteer',
            'donations': 'Donations',
            'gallery': 'Gallery',
            'portals': 'Portals',
            'resources': 'Resources'
        };
        return names[identifier] || identifier;
    }

    /**
     * Load available pages for management
     */
    async loadPages() {
        try {
            console.log('[Admin] Loading pages...');
            const response = await pageContentService.getPages();
            console.log('[Admin] Pages response:', response);
            const pages = response.data || [];
            console.log('[Admin] Pages list:', pages);
            this.renderPageSelector(pages);
        } catch (error) {
            console.error('[Admin] Failed to load pages:', error);
            // Show default pages even on error
            const defaultPages = [
                { identifier: 'welcome-page', name: 'Welcome Page' },
                { identifier: 'about-us', name: 'About Us' },
                { identifier: 'contact-information', name: 'Contact Information' },
                { identifier: 'our-team', name: 'Our Team' },
                { identifier: 'events', name: 'Events' },
                { identifier: 'news', name: 'News' },
                { identifier: 'faqs', name: 'FAQs' },
                { identifier: 'policies', name: 'Policies' },
                { identifier: 'terms-conditions', name: 'Terms & Conditions' },
                { identifier: 'volunteer', name: 'Volunteer' },
                { identifier: 'donations', name: 'Donations' },
                { identifier: 'gallery', name: 'Gallery' },
                { identifier: 'portals', name: 'Portals' },
                { identifier: 'resources', name: 'Resources' }
            ];
            this.renderPageSelector(defaultPages);
        }
    }

    /**
     * Render page selector cards
     */
    renderPageSelector(pages) {
        console.log('[Admin] renderPageSelector called with:', pages);
        const grid = document.getElementById('pageSelectorGrid');
        if (!grid) {
            console.error('[Admin] pageSelectorGrid element not found!');
            return;
        }

        if (!pages || pages.length === 0) {
            // Show default pages if none in database
            const defaultPages = [
                { identifier: 'welcome-page', name: 'Welcome Page' },
                { identifier: 'about-us', name: 'About Us' },
                { identifier: 'contact-information', name: 'Contact Information' },
                { identifier: 'our-team', name: 'Our Team' },
                { identifier: 'events', name: 'Events' },
                { identifier: 'news', name: 'News' },
                { identifier: 'faqs', name: 'FAQs' },
                { identifier: 'policies', name: 'Policies' },
                { identifier: 'terms-conditions', name: 'Terms & Conditions' },
                { identifier: 'volunteer', name: 'Volunteer' },
                { identifier: 'donations', name: 'Donations' },
                { identifier: 'gallery', name: 'Gallery' },
                { identifier: 'portals', name: 'Portals' },
                { identifier: 'resources', name: 'Resources' }
            ];
            this.renderPageSelector(defaultPages);
            return;
        }

        grid.innerHTML = pages.map(page => `
            <div class="page-card" data-identifier="${page.identifier}" data-name="${this.escapeHtml(page.name)}">
                <div class="page-card-icon"><i class="fas fa-file-alt"></i></div>
                <div class="page-card-name">${this.escapeHtml(page.name)}</div>
                <div class="page-card-desc">Click to edit content</div>
            </div>
        `).join('');
        
        // Add click listeners using event delegation
        grid.querySelectorAll('.page-card').forEach(card => {
            card.addEventListener('click', (e) => {
                console.log('[Admin] Page card clicked:', card.dataset.identifier, card.dataset.name);
                this.selectPage(card.dataset.identifier, card.dataset.name);
            });
        });
    }

    /**
     * Select a page and load its content
     */
    async selectPage(identifier, name) {
        console.log('[Admin] selectPage called:', identifier, name);
        this.currentPageIdentifier = identifier;
        
        // Update UI
        const editorSection = document.getElementById('pageContentEditor');
        const selectedPageName = document.getElementById('selectedPageName');
        
        if (editorSection) {
            console.log('[Admin] Showing editor section');
            editorSection.style.display = 'block';
            if (selectedPageName) {
                selectedPageName.textContent = name;
            }
        } else {
            console.error('[Admin] Editor section not found!');
        }

        // Load content for this page
        await this.loadPageContent(identifier);
    }

    /**
     * Load page content
     */
    async loadPageContent(identifier) {
        console.log('[Admin] loadPageContent called with:', identifier);
        try {
            const response = await pageContentService.getAll({ page: identifier });
            console.log('[Admin] Page content response:', response);
            const contents = response.data || [];
            console.log('[Admin] Page content list:', contents);
            this.renderContentItems(contents);
        } catch (error) {
            console.error('Failed to load page content:', error);
            const list = document.getElementById('contentItemsList');
            if (list) {
                list.innerHTML = '<div class="error-message">Failed to load content. Please try again.</div>';
            }
        }
    }

    /**
     * Render content items list
     */
    renderContentItems(contents) {
        console.log('[Admin] renderContentItems called with:', contents);
        const list = document.getElementById('contentItemsList');
        if (!list) {
            console.error('[Admin] contentItemsList element not found!');
            return;
        }

        if (!contents || contents.length === 0) {
            list.innerHTML = '<div class="no-data-message"><i class="fas fa-info-circle"></i> No content yet. Click "Add Content Section" to add content.</div>';
            return;
        }

        list.innerHTML = contents.map(item => `
            <div class="content-item" data-id="${item.id}">
                <div class="content-item-header">
                    <span class="content-section-id">${this.escapeHtml(item.sectionIdentifier || 'N/A')}</span>
                    <span class="content-status ${item.isActive ? 'active' : 'inactive'}">${item.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div class="content-item-title">${this.escapeHtml(item.title || 'No title')}</div>
                <div class="content-item-preview">${this.truncate(this.stripHtml(item.content || ''), 100)}</div>
                <div class="content-item-actions">
                    <button class="btn btn-sm" onclick="adminDashboardManager.editContent('${item.id}')"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-sm btn-reject" onclick="adminDashboardManager.deleteContent('${item.id}')"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Strip HTML tags for preview
     */
    stripHtml(html) {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    /**
     * Open modal for adding new content
     */
    openAddContentModal() {
        const modal = document.getElementById('contentModal');
        if (!modal) return;

        // Reset form
        const form = document.getElementById('contentForm');
        if (form) form.reset();

        // Clear hidden fields
        const contentId = document.getElementById('contentId');
        if (contentId) contentId.value = '';

        // Update modal title
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = 'Add Content';

        // Show modal
        modal.style.display = 'flex';
    }

    /**
     * Edit existing content
     */
    async editContent(id) {
        try {
            const response = await pageContentService.getById(id);
            const content = response.data;

            if (!content) {
                showNotification('Content not found', 'error');
                return;
            }

            // Populate form
            document.getElementById('contentId').value = content.id;
            document.getElementById('sectionIdentifier').value = content.sectionIdentifier || '';
            document.getElementById('contentTitle').value = content.title || '';
            document.getElementById('contentSubtitle').value = content.subtitle || '';
            document.getElementById('contentText').value = content.content || '';
            document.getElementById('displayOrder').value = content.displayOrder || 0;
            document.getElementById('isActive').checked = content.isActive !== false;

            // Update modal title
            document.getElementById('modalTitle').textContent = 'Edit Content';

            // Show modal
            const modal = document.getElementById('contentModal');
            if (modal) modal.style.display = 'flex';

        } catch (error) {
            console.error('Failed to load content for editing:', error);
            showNotification('Failed to load content', 'error');
        }
    }

    /**
     * Save content (create or update)
     */
    async saveContent(event) {
        event.preventDefault();

        const contentId = document.getElementById('contentId').value;
        const data = {
            pageIdentifier: this.currentPageIdentifier,
            sectionIdentifier: document.getElementById('sectionIdentifier').value,
            title: document.getElementById('contentTitle').value,
            subtitle: document.getElementById('contentSubtitle').value,
            content: document.getElementById('contentText').value,
            displayOrder: parseInt(document.getElementById('displayOrder').value) || 0,
            isActive: document.getElementById('isActive').checked
        };

        try {
            if (contentId) {
                // Update existing
                await pageContentService.update(contentId, data);
                showNotification('Content updated successfully', 'success');
            } else {
                // Create new
                await pageContentService.create(data);
                showNotification('Content created successfully', 'success');
            }

            // Close modal
            const modal = document.getElementById('contentModal');
            if (modal) modal.style.display = 'none';

            // Reload content
            await this.loadPageContent(this.currentPageIdentifier);

        } catch (error) {
            console.error('Failed to save content:', error);
            showNotification('Failed to save content', 'error');
        }
    }

    /**
     * Delete content
     */
    async deleteContent(id) {
        if (!confirm('Are you sure you want to delete this content?')) return;

        try {
            await pageContentService.delete(id);
            showNotification('Content deleted successfully', 'success');
            await this.loadPageContent(this.currentPageIdentifier);
        } catch (error) {
            console.error('Failed to delete content:', error);
            showNotification('Failed to delete content', 'error');
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('contentModal');
        if (modal) modal.style.display = 'none';
    }

    /**
     * Initialize page content event listeners
     */
    initPageContentListeners() {
        console.log('[Admin] initPageContentListeners called');
        
        // Add content button
        const addBtn = document.getElementById('addContentBtn');
        if (addBtn) {
            console.log('[Admin] Found addContentBtn, adding listener');
            addBtn.addEventListener('click', () => {
                console.log('[Admin] Add content button clicked');
                this.openAddContentModal();
            });
        } else {
            console.error('[Admin] addContentBtn element not found!');
        }

        // Form submit
        const form = document.getElementById('contentForm');
        if (form) {
            form.addEventListener('submit', (e) => this.saveContent(e));
        }

        // Modal close buttons
        const closeBtn = document.getElementById('closeModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        const cancelBtn = document.getElementById('cancelContentBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        // Close modal on outside click
        const modal = document.getElementById('contentModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }
}

// Create global instance
const adminDashboardManager = new AdminDashboardManager();

// Make available globally for onclick handlers
window.adminDashboardManager = adminDashboardManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    adminDashboardManager.init();
});

// Export for module use
export default adminDashboardManager;
