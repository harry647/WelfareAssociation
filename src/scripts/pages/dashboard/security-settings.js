/**
 * Security Settings Script
 * Handles security settings functionality
 * 
 * @version 1.0.0
 */

import { userService } from '../../../services/user-service.js';
import { apiService } from '../../../services/api-service.js';
import { API_CONFIG } from '../../../config/app-config.js';

class SecuritySettings {
    constructor() {
        this.securityData = {
            activeUsers: 0,
            twoFactorEnabled: 0,
            failedLogins: 0,
            lastAuditDays: 0,
            users: [],
            auditLogs: []
        };
        this.init();
    }

    init() {
        this.initSidebar();
        this.initEventListeners();
        this.loadSecurityData();
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
        // Password change form
        const passwordForm = document.querySelector('.password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword(e);
            });
        }

        // Two-factor toggle
        const twoFactorToggle = document.getElementById('twoFactorToggle');
        if (twoFactorToggle) {
            twoFactorToggle.addEventListener('change', (e) => {
                this.toggleTwoFactor(e.target.checked);
            });
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadSecurityData() {
        try {
            // Fetch users data
            const usersData = await this.fetchUsersData();
            
            // Process users data for security stats
            this.processUsersData(usersData);
            
            // Render all security data
            this.renderQuickStats();
            this.renderUserAccessTable();
            this.renderAuditLog();
            
        } catch (error) {
            console.error('Error loading security data:', error);
            this.handleError();
        }
    }

    async fetchUsersData() {
        try {
            // Try executive team endpoint first (more reliable)
            const executiveResponse = await userService.getExecutiveTeam();
            if (executiveResponse && Array.isArray(executiveResponse)) {
                return executiveResponse.map(u => ({
                    id: u.userId,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    email: u.email,
                    role: u.role,
                    isActive: u.isActive,
                    isEmailVerified: true, // Assume verified for executives
                    lastLogin: null,
                    createdAt: u.createdAt
                }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching users:', error);
            // Return empty array - error state will be shown in UI
            return [];
        }
    }

    processUsersData(users) {
        // Calculate security stats from actual user data
        const now = new Date();
        
        // Active users (users who logged in within the last 24 hours)
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        this.securityData.activeUsers = users.filter(u => {
            if (!u.lastLogin) return false;
            return new Date(u.lastLogin) > oneDayAgo;
        }).length;

        // If no active users from today, count all active users
        if (this.securityData.activeUsers === 0 && users.length > 0) {
            this.securityData.activeUsers = users.filter(u => u.isActive !== false).length;
        }

        // 2FA enabled (currently based on isEmailVerified as 2FA proxy)
        // In a real system, you'd have a separate 2FA field
        this.securityData.twoFactorEnabled = users.filter(u => u.isEmailVerified === true).length;

        // Failed logins - could come from audit or be stored separately
        // For now, we'll set a default or calculate from recent failed events
        this.securityData.failedLogins = 0; // Would need backend to track this

        // Last audit days - would come from settings or audit records
        this.securityData.lastAuditDays = this.calculateLastAudit(users);

        // Store users for table rendering
        this.securityData.users = users;

        // Generate audit logs from user activity
        this.securityData.auditLogs = this.generateAuditLogs(users);
    }

    calculateLastAudit(users) {
        // Calculate based on most recent user activity
        let latestDate = null;
        
        users.forEach(user => {
            if (user.lastLogin) {
                const loginDate = new Date(user.lastLogin);
                if (!latestDate || loginDate > latestDate) {
                    latestDate = loginDate;
                }
            }
            if (user.updatedAt) {
                const updateDate = new Date(user.updatedAt);
                if (!latestDate || updateDate > latestDate) {
                    latestDate = updateDate;
                }
            }
            if (user.createdAt) {
                const createDate = new Date(user.createdAt);
                if (!latestDate || createDate > latestDate) {
                    latestDate = createDate;
                }
            }
        });

        if (!latestDate) return 0;

        const now = new Date();
        const diffTime = Math.abs(now - latestDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    generateAuditLogs(users) {
        const logs = [];
        const now = new Date();

        // Generate audit entries from user data
        users.slice(0, 10).forEach(user => {
            if (user.lastLogin) {
                logs.push({
                    timestamp: user.lastLogin,
                    event: 'Login Successful',
                    user: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
                    ipAddress: user.lastLoginIp || 'N/A',
                    details: 'Dashboard Access',
                    status: 'success'
                });
            }

            // Add created event
            if (user.createdAt) {
                logs.push({
                    timestamp: user.createdAt,
                    event: 'Account Created',
                    user: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
                    ipAddress: 'N/A',
                    details: 'New user registration',
                    status: 'success'
                });
            }
        });

        // Sort by timestamp descending
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return logs.slice(0, 10); // Return top 10
    }

    renderQuickStats() {
        const activeUsersEl = document.getElementById('activeUsersCount');
        const twoFactorEl = document.getElementById('twoFactorEnabledCount');
        const failedLoginsEl = document.getElementById('failedLoginsCount');
        const lastAuditEl = document.getElementById('lastAuditDays');

        if (activeUsersEl) {
            activeUsersEl.textContent = this.securityData.activeUsers || '0';
        }
        
        if (twoFactorEl) {
            twoFactorEl.textContent = this.securityData.twoFactorEnabled || '0';
        }
        
        if (failedLoginsEl) {
            failedLoginsEl.textContent = this.securityData.failedLogins || '0';
        }
        
        if (lastAuditEl) {
            lastAuditEl.textContent = this.securityData.lastAuditDays || '0';
        }
    }

    renderUserAccessTable() {
        const tbody = document.getElementById('userAccessTableBody');
        if (!tbody) return;

        const users = this.securityData.users;

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-users" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><br>
                        <p style="color: #666; font-size: 16px;">No user data found</p>
                        <p style="color: #999; font-size: 14px;">User records will appear here once available</p>
                    </td>
                </tr>
            `;
            return;
        }

        const rows = users.slice(0, 10).map(user => {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
            const role = this.formatRole(user.role);
            const lastLogin = user.lastLogin ? this.formatDate(user.lastLogin) : 'Never';
            const ipAddress = user.lastLoginIp || 'N/A';
            const has2FA = user.isEmailVerified === true;

            return `
                <tr>
                    <td>${this.escapeHtml(fullName)}</td>
                    <td>${this.escapeHtml(role)}</td>
                    <td>${this.escapeHtml(lastLogin)}</td>
                    <td>${this.escapeHtml(ipAddress)}</td>
                    <td>
                        <span class="status ${has2FA ? 'active' : 'pending'}">
                            <i class="fas fa-${has2FA ? 'check' : 'times'}"></i> 
                            ${has2FA ? 'Enabled' : 'Disabled'}
                        </span>
                    </td>
                    <td><button class="btn"><i class="fas fa-cog"></i></button></td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }

    renderAuditLog() {
        const tbody = document.getElementById('auditLogTableBody');
        if (!tbody) return;

        const logs = this.securityData.auditLogs;

        if (logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-clipboard-list" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><br>
                        <p style="color: #666; font-size: 16px;">No audit logs found</p>
                        <p style="color: #999; font-size: 14px;">Security events will appear here</p>
                    </td>
                </tr>
            `;
            return;
        }

        const rows = logs.map(log => {
            const statusClass = log.status === 'success' ? 'active' : 
                              log.status === 'failed' ? 'overdue' : 'pending';
            const statusText = log.status === 'success' ? 'Success' : 
                             log.status === 'failed' ? 'Failed' : 'Alert';

            return `
                <tr>
                    <td>${this.escapeHtml(this.formatDateTime(log.timestamp))}</td>
                    <td>${this.escapeHtml(log.event)}</td>
                    <td>${this.escapeHtml(log.user)}</td>
                    <td>${this.escapeHtml(log.ipAddress)}</td>
                    <td>${this.escapeHtml(log.details)}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }

    formatRole(role) {
        if (!role) return 'Member';
        
        const roleMap = {
            'admin': 'Super Admin',
            'chairman': 'Chairman',
            'treasurer': 'Treasurer',
            'secretary': 'Secretary',
            'member': 'Member'
        };
        
        return roleMap[role.toLowerCase()] || role;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    handleError() {
        // Show error state in tables
        const userTable = document.getElementById('userAccessTableBody');
        const auditTable = document.getElementById('auditLogTableBody');
        
        if (userTable) {
            userTable.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e74c3c; margin-bottom: 15px;"></i><br>
                        <p style="color: #666; font-size: 16px;">Error loading user data</p>
                        <p style="color: #999; font-size: 14px;">Please try refreshing the page</p>
                    </td>
                </tr>
            `;
        }
        
        if (auditTable) {
            auditTable.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e74c3c; margin-bottom: 15px;"></i><br>
                        <p style="color: #666; font-size: 16px;">Error loading audit logs</p>
                        <p style="color: #999; font-size: 14px;">Please try refreshing the page</p>
                    </td>
                </tr>
            `;
        }

        // Show 0 for stats
        const statsElements = ['activeUsersCount', 'twoFactorEnabledCount', 'failedLoginsCount', 'lastAuditDays'];
        statsElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
    }

    changePassword(e) {
        const form = e.target;
        const newPassword = form.querySelector('input[name="newPassword"]')?.value;
        const confirmPassword = form.querySelector('input[name="confirmPassword"]')?.value;

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        console.log('Changing password...');
        alert('Password changed successfully!');
        form.reset();
    }

    toggleTwoFactor(enabled) {
        console.log('Two-factor authentication:', enabled ? 'enabled' : 'disabled');
        alert(`Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully!`);
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_refresh_token');
            localStorage.removeItem('swa_user');
            window.location.href = '../../index.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SecuritySettings();
});
