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
import { showNotification, formatDate, showConfirm, showPrompt } from '../../../utils/utility-functions.js';
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
        // Test if modal container exists
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            // Create modal container if it doesn't exist
            const container = document.createElement('div');
            container.id = 'modal-container';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        
        // Test if notification container exists
        const notificationContainer = document.querySelector('.notification-container');
        if (!notificationContainer) {
            // Create notification container if it doesn't exist
            const container = document.createElement('div');
            container.className = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        
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
            if (row?.dataset?.officerId || row?.dataset?.userId) {
                const officerId = row?.dataset?.officerId;
                const userId = row?.dataset?.userId;
                
                if (action === 'edit' || btn.innerHTML.includes('fa-edit')) {
                    if (officerId) {
                        this.editOfficer(officerId);
                    } else if (userId) {
                        this.editExecutive(userId);
                    }
                    return;
                }
                if (action === 'message' || btn.innerHTML.includes('fa-envelope')) {
                    const targetUserId = officerId ? this.executives.find(o => o.id === officerId)?.userId : userId;
                    if (targetUserId) {
                        this.sendMessage(targetUserId);
                    }
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
        try {
            const committees = [
                { 
                    name: 'Finance Committee', 
                    day: 'Monday', 
                    time: '4:00 PM', 
                    location: 'Finance Office', 
                    description: 'Oversees all financial matters, budgets, and accounts',
                    responsibilities: ['Budget planning', 'Financial reporting', 'Expense approval', 'Account management']
                },
                { 
                    name: 'Events Committee', 
                    day: 'Wednesday', 
                    time: '3:00 PM', 
                    location: 'Student Center', 
                    description: 'Organizes events and social activities for members',
                    responsibilities: ['Event planning', 'Logistics coordination', 'Promotion', 'Venue management']
                },
                { 
                    name: 'Welfare Committee', 
                    day: 'Friday', 
                    time: '2:00 PM', 
                    location: 'Welfare Office', 
                    description: 'Handles member welfare and support services',
                    responsibilities: ['Member support', 'Welfare programs', 'Counseling services', 'Emergency assistance']
                }
            ];
            const committee = committees[committeeId];
            if (!committee) {
                showNotification('Committee not found', 'error');
                return;
            }
            
            // Create detailed committee information
            const responsibilitiesList = committee.responsibilities.map(resp => `• ${resp}`).join('\n');
            
            const committeeInfo = `📋 ${committee.name.toUpperCase()}

📝 Description:
${committee.description}

📅 Meeting Schedule:
• Day: ${committee.day}
• Time: ${committee.time}
• Location: ${committee.location}

🎯 Key Responsibilities:
${responsibilitiesList}`;
            
            // Use manual notification
            const manualNotification = document.createElement('div');
            manualNotification.className = 'notification notification-info';
            manualNotification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #17a2b8;
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                z-index: 9999;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                max-width: 400px;
                white-space: pre-wrap;
                font-family: monospace;
                font-size: 12px;
                line-height: 1.4;
            `;
            manualNotification.textContent = committeeInfo;
            document.body.appendChild(manualNotification);
            
            // Remove after 8 seconds
            setTimeout(() => {
                if (manualNotification.parentNode) {
                    manualNotification.parentNode.removeChild(manualNotification);
                }
            }, 8000);
            
        } catch (error) {
            showNotification('Error loading committee details. Please try again.', 'error');
        }
    }

    /**
     * Edit officer - navigate to edit page or show edit modal
     */
    editOfficer(officerId) {
        // For now, navigate to add-officer page with edit parameter
        // In the future, this could open an edit modal or dedicated edit page
        window.location.href = `add-officer.html?edit=${officerId}`;
    }

    /**
     * Send message to executive member
     */
    sendMessage(userId) {
        try {
            const exec = this.executives.find(e => e.userId === userId || e.user?.id === userId);
            if (!exec) {
                showNotification('Executive member not found', 'error');
                return;
            }
            
            // Extract member data
            const member = exec.member || exec.memberDataSnapshot || {};
            const user = exec.user || {};
            const fullName = member.getFullName ? member.getFullName() : 
                           `${member.firstName || ''} ${member.lastName || ''}`.trim();
            const email = member.email || user.email;
            
            if (!email) {
                showNotification('Email address not available for this executive member', 'error');
                return;
            }
            
            // Use native confirm directly
            const confirmMessage = `Send message to ${fullName} (${exec.position})?\n\nEmail: ${email}\n\nClick OK to open email client, Cancel to copy email to clipboard.`;
            
            const confirmed = confirm(confirmMessage);
            
            if (confirmed) {
                // Open email client
                const subject = encodeURIComponent(`Message from SWA Administration`);
                const body = encodeURIComponent(`Dear ${fullName},\n\nI hope this message finds you well.\n\nBest regards,\nSWA Administration`);
                window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
                showNotification(`Email client opened for ${fullName}`, 'success');
            } else {
                // Copy email to clipboard
                navigator.clipboard.writeText(email).then(() => {
                    showNotification(`Email address copied to clipboard: ${email}`, 'info');
                }).catch(() => {
                    showNotification(`Email address: ${email}`, 'info');
                });
            }
        } catch (error) {
            showNotification('Error sending message. Please try again.', 'error');
        }
    }

    /**
     * Manage role permissions - navigate to add officer page
     */
    manageRolePermissions(role) {
        // Navigate to add officer page with role parameter
        window.location.href = `add-officer.html?role=${encodeURIComponent(role)}`;
    }

    /**
     * Schedule a meeting - navigate to events page
     */
    scheduleMeeting(meetingIndex) {
        const meetingTypes = ['Executive Meeting', 'General Assembly', 'Finance Review'];
        const meetingType = meetingTypes[meetingIndex] || 'Meeting';
        
        // Navigate to events page to create new meeting/event
        window.location.href = `create-event.html?create=${encodeURIComponent(meetingType)}`;
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
     * Calculate statistics from officer data
     */
    calculateStats() {
        const currentYear = new Date().getFullYear();
        
        // Total officers (all active officers)
        this.stats.totalOfficers = this.executives.filter(o => o.status === 'active').length;
        
        // Core executives (chairman, treasurer, secretary)
        const executivePositions = ['chairman', 'treasurer', 'secretary'];
        this.stats.totalExecutives = this.executives.filter(o => 
            o.status === 'active' && executivePositions.includes(o.position?.toLowerCase())
        ).length;
        
        // Committee heads (other positions like pro, committee-head)
        const committeePositions = ['pro', 'committee-head'];
        this.stats.committeeHeads = this.executives.filter(o => 
            o.status === 'active' && committeePositions.includes(o.position?.toLowerCase())
        ).length;
        
        // Term end (find the latest end date or default to current year + 1)
        const endDates = this.executives
            .filter(o => o.endDate)
            .map(o => new Date(o.endDate).getFullYear());
        
        this.stats.termEnd = endDates.length > 0 ? Math.max(...endDates) : currentYear + 1;
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

        tableBody.innerHTML = this.executives.map(officer => {
            // Extract member data from nested structure
            const member = officer.member || officer.memberDataSnapshot || {};
            const user = officer.user || {};
            
            const fullName = member.getFullName ? member.getFullName() : 
                           `${member.firstName || ''} ${member.lastName || ''}`.trim();
            const role = officer.role || 'N/A';
            const position = officer.position || 'N/A';
            const studentId = member.memberNumber || member.studentId || 'N/A';
            const phone = member.phone || user.phone || 'N/A';
            const email = member.email || user.email || 'N/A';
            
            // Format dates
            const termStart = officer.startDate ? formatDate(new Date(officer.startDate)) : 'N/A';
            const termEnd = officer.endDate ? formatDate(new Date(officer.endDate)) : 'N/A';
            
            // Status
            const isActive = officer.status === 'active' && (!user || user.isActive !== false);
            const statusHtml = isActive 
                ? '<span class="status active">Active</span>' 
                : '<span class="status inactive">Inactive</span>';

            // Position display
            let positionDisplay = position.charAt(0).toUpperCase() + position.slice(1);
            const positionMap = {
                'chairman': 'Chairman',
                'vice-chairman': 'Vice Chairman',
                'secretary': 'Secretary',
                'treasurer': 'Treasurer',
                'pro': 'PRO',
                'committee-head': 'Committee Head',
                'member': 'Executive Member'
            };
            positionDisplay = positionMap[position.toLowerCase()] || positionDisplay;

            return `
                <tr data-officer-id="${officer.id}">
                    <td><strong>${positionDisplay}</strong></td>
                    <td>${fullName || 'N/A'}</td>
                    <td>${studentId}</td>
                    <td>${phone}</td>
                    <td>${email}</td>
                    <td>${termStart}</td>
                    <td>${termEnd}</td>
                    <td>${statusHtml}</td>
                    <td>
                        <button class="btn" onclick="executiveTeam.editOfficer('${officer.id}')" title="Edit Officer">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn" onclick="executiveTeam.sendMessage('${officer.userId || officer.user?.id}')" title="Send Message">
                            <i class="fas fa-envelope"></i>
                        </button>
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
                        <button class="btn" onclick="executiveTeam.viewCommittee(${index})" title="View Committee Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn" onclick="executiveTeam.editCommittee(${index})" title="Edit Committee">
                            <i class="fas fa-edit"></i>
                        </button>
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
                        ${r.canEdit ? `<button class="btn" onclick="executiveTeam.manageRolePermissions('${r.role}')" title="Manage Role Permissions">
                            <i class="fas fa-cog"></i>
                        </button>` : '-'}
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
                    <button class="btn" onclick="executiveTeam.scheduleMeeting(${index})" title="Schedule Meeting">
                        <i class="fas fa-calendar-plus"></i>
                    </button>
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
    async handleLogout() {
        if (await showConfirm('Are you sure you want to logout?')) {
            authService.logout();
            window.location.href = '../../index.html';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.executiveTeam = new ExecutiveTeam();
});
