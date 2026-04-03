/**
 * Shared Header Component Script
 * Handles functionality for shared dashboard header
 * 
 * @version 1.0.0
 */

import { notificationService } from '../../services/notification-service.js';

/**
 * Shared Header Component
 */
class SharedHeader {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * Initialize the shared header
     */
    init() {
        if (this.isInitialized) return;
        
        this.initNotificationService();
        this.initEventListeners();
        this.isInitialized = true;
        
        console.log('Shared header initialized');
    }

    /**
     * Initialize notification service
     */
    initNotificationService() {
        try {
            notificationService.init();
            
            notificationService.subscribe((notification) => {
                console.log('New notification received in shared header:', notification);
            });
        } catch (error) {
            console.error('Error initializing notification service:', error);
        }
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            notificationBell.addEventListener('click', this.handleNotificationBellClick.bind(this));
        }

        const userProfile = document.getElementById('userProfile');
        if (userProfile) {
            userProfile.addEventListener('click', this.handleUserProfileClick.bind(this));
        }

        const logoutBtn = document.getElementById('headerLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
    }

    /**
     * Handle notification bell click
     */
    handleNotificationBellClick() {
        try {
            notificationService.markAllAsRead();
            
            const badge = document.getElementById('notificationBadge');
            if (badge) badge.style.display = 'none';
            
            document.dispatchEvent(new CustomEvent('toggleNotifications', {
                detail: {
                    notifications: notificationService.getAllNotifications()
                }
            }));
            
            console.log('Shared header notification bell clicked');
        } catch (error) {
            console.error('Error handling notification bell click:', error);
        }
    }

    /**
     * Handle user profile click
     */
    handleUserProfileClick() {
        try {
            document.dispatchEvent(new CustomEvent('toggleUserMenu'));
            console.log('Shared header user profile clicked');
        } catch (error) {
            console.error('Error handling user profile click:', error);
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            const confirmed = await this.showConfirmDialog('Are you sure you want to logout?');
            if (!confirmed) return;

            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_user');
            sessionStorage.removeItem('swa_auth_token');
            sessionStorage.removeItem('swa_user');
            
            notificationService.destroy();
            
            window.location.href = '/pages/auth/login-page.html';
            
            console.log('Shared header logout completed');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    /**
     * Show confirmation dialog
     */
    showConfirmDialog(message) {
        return new Promise((resolve) => {
            const result = confirm(message);
            resolve(result);
        });
    }

    /**
     * Update header user information
     */
    updateUserInfo(userInfo) {
        try {
            const userName = document.getElementById('headerUserName');
            const userRole = document.getElementById('headerUserRole');
            const userAvatar = document.getElementById('headerUserAvatar');

            if (userName && userInfo.firstName) {
                userName.textContent = `${userInfo.firstName} ${userInfo.lastName || ''}`.trim();
            }

            if (userRole && userInfo.role) {
                userRole.textContent = userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1);
            }

            if (userAvatar && userInfo.firstName) {
                userAvatar.textContent = userInfo.firstName.charAt(0).toUpperCase();
            }
        } catch (error) {
            console.error('Error updating user info:', error);
        }
    }

    /**
     * Update page title and subtitle
     */
    updatePageInfo(title, subtitle) {
        try {
            const pageTitle = document.getElementById('pageTitle');
            const pageSubtitle = document.getElementById('pageSubtitle');

            if (pageTitle && title) {
                pageTitle.innerHTML = title;
            }

            if (pageSubtitle && subtitle) {
                pageSubtitle.textContent = subtitle;
            }
        } catch (error) {
            console.error('Error updating page info:', error);
        }
    }

    /**
     * Destroy the header component
     */
    destroy() {
        try {
            notificationService.destroy();
            this.isInitialized = false;
            console.log('Shared header destroyed');
        } catch (error) {
            console.error('Error destroying shared header:', error);
        }
    }
}

export const sharedHeader = new SharedHeader();

export default SharedHeader;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        sharedHeader.init();
    }, 100);
});