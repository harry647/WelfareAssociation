/**
 * Admin Header Component Script
 * Handles functionality for the admin dashboard header
 * 
 * @version 1.0.0
 */

import { notificationService } from '../../services/notification-service.js';

/**
 * Admin Header Component
 */
class AdminHeader {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * Initialize the admin header
     */
    init() {
        if (this.isInitialized) return;
        
        this.initNotificationService();
        this.initEventListeners();
        this.isInitialized = true;
        
        console.log('Admin header initialized');
    }

    /**
     * Initialize notification service
     */
    initNotificationService() {
        try {
            notificationService.init();
            
            // Subscribe to notification events
            notificationService.subscribe((notification) => {
                console.log('New notification received in admin header:', notification);
                // Additional handling can be added here if needed
            });
        } catch (error) {
            console.error('Error initializing notification service:', error);
        }
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Notification bell click handler
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            notificationBell.addEventListener('click', this.handleNotificationBellClick.bind(this));
        }

        // Quick actions button handler
        const quickActionsBtn = document.getElementById('quickActionsBtn');
        if (quickActionsBtn) {
            quickActionsBtn.addEventListener('click', this.handleQuickActionsClick.bind(this));
        }

        // User profile click handler
        const userProfile = document.getElementById('userProfile');
        if (userProfile) {
            userProfile.addEventListener('click', this.handleUserProfileClick.bind(this));
        }

        // Logout button handler
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
            // Mark all notifications as read
            notificationService.markAllAsRead();
            
            // Hide badge
            const badge = document.getElementById('notificationBadge');
            if (badge) badge.style.display = 'none';
            
            // Emit custom event for notification panel
            document.dispatchEvent(new CustomEvent('toggleNotifications', {
                detail: {
                    notifications: notificationService.getAllNotifications()
                }
            }));
            
            console.log('Admin notification bell clicked');
        } catch (error) {
            console.error('Error handling notification bell click:', error);
        }
    }

    /**
     * Handle quick actions button click
     */
    handleQuickActionsClick() {
        try {
            // Show quick actions menu or emit event
            document.dispatchEvent(new CustomEvent('toggleQuickActions'));
            
            console.log('Admin quick actions button clicked');
        } catch (error) {
            console.error('Error handling quick actions click:', error);
        }
    }

    /**
     * Handle user profile click
     */
    handleUserProfileClick() {
        try {
            // Toggle user profile dropdown/menu
            document.dispatchEvent(new CustomEvent('toggleUserMenu'));
            
            console.log('Admin user profile clicked');
        } catch (error) {
            console.error('Error handling user profile click:', error);
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            // Show confirmation dialog
            const confirmed = await this.showConfirmDialog('Are you sure you want to logout?');
            if (!confirmed) return;

            // Clear auth tokens
            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_user');
            sessionStorage.removeItem('swa_auth_token');
            sessionStorage.removeItem('swa_user');
            
            // Destroy notification service
            notificationService.destroy();
            
            // Redirect to login
            window.location.href = '/pages/auth/login-page.html';
            
            console.log('Admin logout completed');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    /**
     * Show confirmation dialog
     */
    showConfirmDialog(message) {
        return new Promise((resolve) => {
            // Use browser's native confirm for now
            // Can be replaced with a custom modal later
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
            console.log('Admin header destroyed');
        } catch (error) {
            console.error('Error destroying admin header:', error);
        }
    }
}

// Create and export singleton instance
export const adminHeader = new AdminHeader();

// Export class for custom instances
export default AdminHeader;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for w3-include-html to complete
    setTimeout(() => {
        adminHeader.init();
    }, 100);
});
