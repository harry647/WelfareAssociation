/**
 * Executive Team Script
 * Handles executive team management functionality with dynamic data from database
 * 
 * @version 1.1.0
 * Updated to fetch data from database
 */

// Import services
import { authService, userService } from '../../../services/index.js';

// Import utility functions
import { showNotification, formatDate } from '../../../utils/utility-functions.js';

class ExecutiveTeam {
    constructor() {
        this.executives = [];
        this.stats = {
            totalOfficers: 0,
            totalExecutives: 0,
            committeeHeads: 0,
            termEnd: 'N/A'
        };
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        await this.loadExecutiveTeam();
    }

    /**
     * Check authentication
     */
    async checkAuth() {
        if (!authService.isAuthenticated()) {
            window.location.href = '../../../auth/login-page.html?redirect=../admin/executive-team.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        const allowedRoles = ['admin', 'secretary', 'treasurer', 'chairman'];
        if (!user || !allowedRoles.includes(user.role)) {
            showNotification('Access denied. You do not have permission to view this page.', 'error');
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 2000);
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

        // Quick action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const href = btn.getAttribute('href');
                if (href) {
                    window.location.href = href;
                }
            });
        });

        // Delegate click events for table action buttons
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn');
            if (!btn) return;

            const action = btn.dataset.action;
            const row = btn.closest('tr');

            // Executive table actions
            if (row?.dataset?.userId) {
                if (action === 'edit' || btn.innerHTML.includes('fa-edit')) {
                    this.editExecutive(row.dataset.userId);
                    return;
                }
                if (action === 'message' || btn.innerHTML.includes('fa-envelope')) {
                    this.sendMessage(row.dataset.userId);
                    return;
                }
            }

            // Committee table actions
            if (row?.dataset?.committeeId !== undefined) {
                if (action === 'view-committee' || btn.innerHTML.includes('fa-eye')) {
                    this.viewCommittee(row.dataset.committeeId);
                    return;
                }
                if (action === 'edit-committee' || (btn.innerHTML.includes('fa-edit') && !row?.dataset?.userId)) {
                    this.editCommittee(row.dataset.committeeId);
                    return;
                }
            }

            // Roles table actions
            if (row?.dataset?.role) {
                if (action === 'edit-role' || btn.innerHTML.includes('fa-cog')) {
                    this.manageRolePermissions(row.dataset.role);
                    return;
                }
            }

            // Meetings table actions
            if (row?.dataset?.meetingIndex !== undefined) {
                if (action === 'schedule-meeting' || btn.innerHTML.includes('fa-calendar-plus')) {
                    this.scheduleMeeting(row.dataset.meetingIndex);
                    return;
                }
            }
        });
    }

    /**
     * Edit executive member
     */
    editExecutive(userId) {
        const exec = this.executives.find(e => e.userId === userId);
        if (!exec) {
            showNotification('Executive member not found', 'error');
            return;
        }
        
        // Navigate to edit member page with user ID
        window.location.href = `edit-member.html?memberId=${exec.memberId || userId}&type=user`;
    }

    /**
     * Edit committee
     */
    editCommittee(committeeId) {
        const committees = [
            { name: 'Finance Committee' },
            { name: 'Events Committee' },
            { name: 'Welfare Committee' }
        ];
        const committee = committees[committeeId];
        if (committee) {
            // Navigate to security settings page for managing committee members
            window.location.href = `security-settings.html?committee=${encodeURIComponent(committee.name)}&edit=true`;
        }
    }

    /**
     * View committee details
     */
    viewCommittee(committeeId) {
        const committees = [
            { name: 'Finance Committee', day: 'Monday', time: '4:00 PM', location: 'Finance Office', description: 'Oversees all financial matters, budgets, and accounts' },
            { name: 'Events Committee', day: 'Wednesday', time: '3:00 PM', location: 'Student Center', description: 'Organizes events and social activities for members' },
            { name: 'Welfare Committee', day: 'Friday', time: '2:00 PM', location: 'Welfare Office', description: 'Handles member welfare and support services' }
        ];
        const committee = committees[committeeId];
        if (committee) {
            showNotification(`Viewing ${committee.name} - ${committee.description}`, 'info');
            // Could also navigate to a dedicated page:
            // window.location.href = `committee-details.html?committee=${committee.name.toLowerCase().replace(' ', '-')}`;
        }
    }

    /**
     * Send message to executive
     */
    sendMessage(userId) {
        const exec = this.executives.find(e => e.userId === userId);
        if (!exec) {
            showNotification('Executive member not found', 'error');
            return;
        }
        
        // Open email client or navigate to message page
        const email = exec.email;
        if (email) {
            window.location.href = `../public/contact-information.html?recipient=${encodeURIComponent(email)}&recipientName=${encodeURIComponent(exec.firstName + ' ' + exec.lastName)}`;
        } else {
            showNotification('Email address not available', 'error');
        }
    }

    /**
     * Manage role permissions - navigate to security settings
     */
    manageRolePermissions(role) {
        // Navigate to security settings page with role parameter
        window.location.href = `security-settings.html?role=${encodeURIComponent(role)}`;
    }

    /**
     * Schedule a meeting - navigate to events page
     */
    scheduleMeeting(meetingIndex) {
        const meetingTypes = ['Executive Meeting', 'General Assembly', 'Finance Review'];
        const meetingType = meetingTypes[meetingIndex] || 'Meeting';
        
        // Navigate to events page to create new meeting/event
        window.location.href = `../public/events.html?create=${encodeURIComponent(meetingType)}`;
    }

    /**
     * Load executive team from database
     */
    async loadExecutiveTeam() {
        const loadingEl = document.getElementById('loading-indicator');
        const errorEl = document.getElementById('error-message');

        try {
            // Show loading state
            if (loadingEl) loadingEl.style.display = 'block';
            if (errorEl) errorEl.style.display = 'none';

            // Fetch executive team from API
            const response = await userService.getExecutiveTeam();
            this.executives = response.data || response || [];

            // Calculate statistics
            this.calculateStats();

            // Update stats display
            this.updateStatsDisplay();

            // Render executives table
            this.renderExecutivesTable();

            // Render committee table (for now using executives data)
            this.renderCommitteeTable();

            // Render roles & permissions table
            this.renderRolesTable();

            // Render meetings table
            this.renderMeetingsTable();

            // Hide loading
            if (loadingEl) loadingEl.style.display = 'none';

        } catch (error) {
            console.error('Error loading executive team:', error);
            
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) {
                errorEl.querySelector('span').textContent = 'Failed to load executive team. Please try again later.';
                errorEl.style.display = 'block';
            }
            
            // Show empty state
            this.renderEmptyState();
        }
    }

    /**
     * Calculate statistics from executive data
     */
    calculateStats() {
        const currentYear = new Date().getFullYear();
        
        // Total officers (all users with executive roles)
        this.stats.totalOfficers = this.executives.length;
        
        // Core executives (chairman, treasurer, secretary)
        const executiveRoles = ['chairman', 'treasurer', 'secretary'];
        this.stats.totalExecutives = this.executives.filter(e => 
            executiveRoles.includes(e.role?.toLowerCase())
        ).length;
        
        // Committee heads (other admin roles)
        this.stats.committeeHeads = this.executives.filter(e => 
            !executiveRoles.includes(e.role?.toLowerCase()) && e.role !== 'admin'
        ).length;
        
        // Term end (current year + 1)
        this.stats.termEnd = currentYear + 1;
    }

    /**
     * Update statistics display in the UI
     */
    updateStatsDisplay() {
        // Total Officers
        const totalOfficersEl = document.getElementById('total-officers');
        if (totalOfficersEl) {
            totalOfficersEl.textContent = this.stats.totalOfficers > 0 ? this.stats.totalOfficers : '0';
        }

        // Total Executives
        const totalExecutivesEl = document.getElementById('total-executives');
        if (totalExecutivesEl) {
            totalExecutivesEl.textContent = this.stats.totalExecutives > 0 ? this.stats.totalExecutives : '0';
        }

        // Committee Heads
        const committeeHeadsEl = document.getElementById('committee-heads');
        if (committeeHeadsEl) {
            committeeHeadsEl.textContent = this.stats.committeeHeads > 0 ? this.stats.committeeHeads : '0';
        }

        // Term End
        const termEndEl = document.getElementById('term-end');
        if (termEndEl) {
            termEndEl.textContent = this.stats.termEnd;
        }
    }

    /**
     * Render executives table with dynamic data
     */
    renderExecutivesTable() {
        const tableBody = document.getElementById('executives-table-body');
        if (!tableBody) return;

        if (!this.executives || this.executives.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data-message">
                        <i class="fas fa-users-cog"></i>
                        No executive team members found. Add officers to see them here.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.executives.map(exec => {
            const fullName = `${exec.firstName || ''} ${exec.lastName || ''}`.trim();
            const role = exec.role || 'N/A';
            const studentId = exec.studentId || exec.memberNumber || 'N/A';
            const phone = exec.phone || 'N/A';
            const email = exec.email || 'N/A';
            
            // Format dates
            const createdAt = exec.createdAt || new Date();
            const termStart = formatDate(createdAt);
            const termEnd = this.stats.termEnd ? `${this.stats.termEnd}-12-31` : 'N/A';
            
            // Status
            const isActive = exec.isActive !== false;
            const statusHtml = isActive 
                ? '<span class="status active">Active</span>' 
                : '<span class="status inactive">Inactive</span>';

            // Position display
            let positionDisplay = role.charAt(0).toUpperCase() + role.slice(1);
            if (role.toLowerCase() === 'admin') positionDisplay = 'Administrator';

            return `
                <tr data-user-id="${exec.userId}">
                    <td><strong>${positionDisplay}</strong></td>
                    <td>${fullName || 'N/A'}</td>
                    <td>${studentId}</td>
                    <td>${phone}</td>
                    <td>${email}</td>
                    <td>${termStart}</td>
                    <td>${termEnd}</td>
                    <td>${statusHtml}</td>
                    <td>
                        <button class="btn"><i class="fas fa-edit"></i></button>
                        <button class="btn"><i class="fas fa-envelope"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Render committee table (placeholder for now)
     */
    renderCommitteeTable() {
        const tableBody = document.getElementById('committee-table-body');
        if (!tableBody) return;

        // For now, show executives as committee heads if no specific committee data
        if (!this.executives || this.executives.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data-message">
                        <i class="fas fa-user-friends"></i>
                        No committee heads found. Committee data will appear here.
                    </td>
                </tr>
            `;
            return;
        }

        // Map executives to committee structure
        const committees = [
            { name: 'Finance Committee', day: 'Monday' },
            { name: 'Events Committee', day: 'Wednesday' },
            { name: 'Welfare Committee', day: 'Friday' }
        ];

        tableBody.innerHTML = this.executives.slice(0, 3).map((exec, index) => {
            const fullName = `${exec.firstName || ''} ${exec.lastName || ''}`.trim();
            const studentId = exec.studentId || exec.memberNumber || 'N/A';
            const phone = exec.phone || 'N/A';
            const isActive = exec.isActive !== false;
            const statusHtml = isActive 
                ? '<span class="status active">Active</span>' 
                : '<span class="status inactive">Inactive</span>';
            const committee = committees[index] || { name: 'General Committee', day: 'TBD' };

            return `
                <tr data-committee-id="${index}">
                    <td>${committee.name}</td>
                    <td>${fullName || 'N/A'}</td>
                    <td>${studentId}</td>
                    <td>${index + 1}</td>
                    <td>${phone}</td>
                    <td>${committee.day}</td>
                    <td>${statusHtml}</td>
                    <td>
                        <button class="btn" data-action="view-committee"><i class="fas fa-eye"></i></button>
                        <button class="btn" data-action="edit-committee"><i class="fas fa-edit"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Render roles & permissions table
     */
    renderRolesTable() {
        const tableBody = document.getElementById('roles-table-body');
        if (!tableBody) return;

        // Static roles data - these are system-defined roles
        const roles = [
            {
                role: 'Super Admin',
                dashboard: 'Full',
                manageMembers: 'Full',
                financial: 'Full',
                reports: 'Full',
                settings: 'Full',
                canEdit: true
            },
            {
                role: 'Treasurer',
                dashboard: 'Full',
                manageMembers: 'View',
                financial: 'Full',
                reports: 'Full',
                settings: 'None',
                canEdit: true
            },
            {
                role: 'Secretary',
                dashboard: 'Full',
                manageMembers: 'Full',
                financial: 'View Only',
                reports: 'Full',
                settings: 'Limited',
                canEdit: true
            },
            {
                role: 'Committee Head',
                dashboard: 'Partial',
                manageMembers: 'View',
                financial: 'None',
                reports: 'Partial',
                settings: 'None',
                canEdit: false
            }
        ];

        tableBody.innerHTML = roles.map(r => {
            const getIcon = (perm) => {
                if (perm === 'Full') return '<i class="fas fa-check-circle" style="color: green;"></i>';
                if (perm === 'Partial') return '<i class="fas fa-check-circle" style="color: green;"></i>';
                if (perm === 'View' || perm === 'View Only') return '<i class="fas fa-minus-circle" style="color: orange;"></i>';
                if (perm === 'None') return '<i class="fas fa-times-circle" style="color: red;"></i>';
                if (perm === 'Limited') return '<i class="fas fa-minus-circle" style="color: orange;"></i>';
                return '';
            };

            return `
                <tr data-role="${r.role}">
                    <td><strong>${r.role}</strong></td>
                    <td>${getIcon(r.dashboard)} ${r.dashboard}</td>
                    <td>${getIcon(r.manageMembers)} ${r.manageMembers}</td>
                    <td>${getIcon(r.financial)} ${r.financial}</td>
                    <td>${getIcon(r.reports)} ${r.reports}</td>
                    <td>${getIcon(r.settings)} ${r.settings}</td>
                    <td>
                        ${r.canEdit ? '<button class="btn" data-action="edit-role"><i class="fas fa-cog"></i></button>' : '-'}
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Render meetings table
     */
    renderMeetingsTable() {
        const tableBody = document.getElementById('meetings-table-body');
        if (!tableBody) return;

        // Static meetings data
        const meetings = [
            {
                type: 'Executive Meeting',
                frequency: 'Weekly',
                day: 'Monday',
                time: '4:00 PM',
                location: 'Student Center',
                nextMeeting: this.getNextMeetingDay('Monday', '16:00')
            },
            {
                type: 'General Assembly',
                frequency: 'Monthly',
                day: 'Last Friday',
                time: '2:00 PM',
                location: 'Main Hall',
                nextMeeting: this.getNextMeetingDay('Friday', '14:00', true)
            },
            {
                type: 'Finance Review',
                frequency: 'Bi-weekly',
                day: 'Wednesday',
                time: '3:00 PM',
                location: 'Finance Office',
                nextMeeting: this.getNextMeetingDay('Wednesday', '15:00')
            }
        ];

        tableBody.innerHTML = meetings.map((meeting, index) => `
            <tr data-meeting-index="${index}">
                <td>${meeting.type}</td>
                <td>${meeting.frequency}</td>
                <td>${meeting.day}</td>
                <td>${meeting.time}</td>
                <td>${meeting.location}</td>
                <td>${meeting.nextMeeting}</td>
                <td>
                    <button class="btn" data-action="schedule-meeting"><i class="fas fa-calendar-plus"></i></button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Get next meeting date for a given day
     */
    getNextMeetingDay(dayName, time, isLastWeekday = false) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetDay = days.indexOf(dayName);
        const today = new Date();
        const currentDay = today.getDay();
        
        let daysUntil = targetDay - currentDay;
        if (daysUntil < 0) daysUntil += 7;
        
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysUntil);
        
        return formatDate(nextDate);
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        const executivesBody = document.getElementById('executives-table-body');
        if (executivesBody) {
            executivesBody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data-message">
                        <i class="fas fa-exclamation-circle"></i>
                        Unable to load executive team data. Please ensure the server is running.
                    </td>
                </tr>
            `;
        }

        const committeeBody = document.getElementById('committee-table-body');
        if (committeeBody) {
            committeeBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data-message">
                        <i class="fas fa-exclamation-circle"></i>
                        Unable to load committee data. Please ensure the server is running.
                    </td>
                </tr>
            `;
        }

        const rolesBody = document.getElementById('roles-table-body');
        if (rolesBody) {
            rolesBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data-message">
                        <i class="fas fa-exclamation-circle"></i>
                        Unable to load roles data. Please ensure the server is running.
                    </td>
                </tr>
            `;
        }

        const meetingsBody = document.getElementById('meetings-table-body');
        if (meetingsBody) {
            meetingsBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data-message">
                        <i class="fas fa-exclamation-circle"></i>
                        Unable to load meetings data. Please ensure the server is running.
                    </td>
                </tr>
            `;
        }

        // Reset stats to 0
        this.stats = {
            totalOfficers: 0,
            totalExecutives: 0,
            committeeHeads: 0,
            termEnd: 'N/A'
        };
        this.updateStatsDisplay();
    }

    /**
     * Handle logout
     */
    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            authService.logout();
            window.location.href = '../../index.html';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.executiveTeam = new ExecutiveTeam();
});
