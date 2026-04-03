/**
 * Member Header Component Script
 * Handles functionality for the member dashboard header
 * 
 * @version 1.0.0
 */

import { notificationService } from '../../services/notification-service.js';

/**
 * Member Header Component
 */
class MemberHeader {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * Initialize the member header
     */
    init() {
        if (this.isInitialized) return;
        
        this.initNotificationService();
        this.initEventListeners();
        this.isInitialized = true;
        
        console.log('Member header initialized');
    }

    /**
     * Initialize notification service
     */
    initNotificationService() {
        try {
            notificationService.init();
            
            // Subscribe to notification events
            notificationService.subscribe((notification) => {
                console.log('New notification received in member header:', notification);
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

        // Logout button handler
        const logoutBtn = document.getElementById('memberLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Profile link handler
        const profileLink = document.querySelector('.profile-link');
        if (profileLink) {
            profileLink.addEventListener('click', this.handleProfileClick.bind(this));
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
            
            console.log('Member notification bell clicked');
        } catch (error) {
            console.error('Error handling notification bell click:', error);
        }
    }

    /**
     * Handle profile link click
     */
    handleProfileClick(event) {
        try {
            // Allow default navigation to profile page
            console.log('Member profile link clicked');
        } catch (error) {
            console.error('Error handling profile click:', error);
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
            
            console.log('Member logout completed');
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
     * Update member avatar
     */
    updateMemberAvatar(userInfo) {
        try {
            const memberAvatar = document.getElementById('memberAvatar');
            const welcomeMessage = document.getElementById('welcomeMessage');

            if (memberAvatar && userInfo.firstName) {
                memberAvatar.textContent = userInfo.firstName.charAt(0).toUpperCase();
            }

            if (welcomeMessage && userInfo.firstName) {
                welcomeMessage.innerHTML = `<i class="fas fa-user-circle"></i> Welcome, ${userInfo.firstName}`;
            }
        } catch (error) {
            console.error('Error updating member avatar:', error);
        }
    }

    /**
     * Show fine alert
     */
    showFineAlert(amount) {
        try {
            const fineAlert = document.getElementById('fineAlert');
            const fineAlertText = document.getElementById('fineAlertText');

            if (fineAlert && fineAlertText) {
                fineAlertText.textContent = `You have unpaid fines of Ksh ${amount}`;
                fineAlert.style.display = 'flex';
            }
        } catch (error) {
            console.error('Error showing fine alert:', error);
        }
    }

    /**
     * Hide fine alert
     */
    hideFineAlert() {
        try {
            const fineAlert = document.getElementById('fineAlert');
            if (fineAlert) {
                fineAlert.style.display = 'none';
            }
        } catch (error) {
            console.error('Error hiding fine alert:', error);
        }
    }

    /**
     * Destroy the header component
     */
    destroy() {
        try {
            notificationService.destroy();
            this.isInitialized = false;
            console.log('Member header destroyed');
        } catch (error) {
            console.error('Error destroying member header:', error);
        }
    }
}

// Create and export singleton instance
export const memberHeader = new MemberHeader();

// Export class for custom instances
export default MemberHeader;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for w3-include-html to complete
    setTimeout(() => {
        memberHeader.init();
    }, 100);
});
