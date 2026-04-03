/**
 * Notification Service
 * Handles real-time notifications for notices and announcements
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Notification Service - Real-time notification management
 */
class NotificationService {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.lastCheckTime = new Date();
        this.pollingInterval = null;
        this.isPolling = false;
        this.subscribers = [];
    }

    /**
     * Initialize the notification service
     */
    init() {
        this.loadStoredNotifications();
        this.startPolling();
        this.setupEventListeners();
    }

    /**
     * Load stored notifications from localStorage
     */
    loadStoredNotifications() {
        try {
            const stored = localStorage.getItem('swa_notifications');
            if (stored) {
                const data = JSON.parse(stored);
                this.notifications = data.notifications || [];
                this.lastCheckTime = new Date(data.lastCheckTime);
                this.updateUnreadCount();
            }
        } catch (error) {
            console.error('Error loading stored notifications:', error);
            this.notifications = [];
            this.lastCheckTime = new Date();
        }
    }

    /**
     * Save notifications to localStorage
     */
    saveNotifications() {
        try {
            const data = {
                notifications: this.notifications,
                lastCheckTime: this.lastCheckTime.toISOString()
            };
            localStorage.setItem('swa_notifications', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    }

    /**
     * Setup event listeners for real-time updates
     */
    setupEventListeners() {
        // Listen for custom events from other components
        document.addEventListener('noticeCreated', (event) => {
            this.handleNoticeCreated(event.detail);
        });

        document.addEventListener('noticeUpdated', (event) => {
            this.handleNoticeUpdated(event.detail);
        });

        // Listen for page visibility changes to refresh when user returns
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForNewNotifications();
            }
        });
    }

    /**
     * Start polling for new notifications
     */
    startPolling() {
        if (this.isPolling) return;
        
        this.isPolling = true;
        this.pollingInterval = setInterval(() => {
            this.checkForNewNotifications();
        }, 30000); // Check every 30 seconds

        // Initial check
        this.checkForNewNotifications();
    }

    /**
     * Stop polling for new notifications
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
    }

    /**
     * Check for new notifications
     */
    async checkForNewNotifications() {
        try {
            const response = await apiService.get(API_CONFIG.endpoints.notices, {
                limit: 10,
                since: this.lastCheckTime.toISOString()
            });

            if (response.success && response.data) {
                const newNotices = response.data.filter(notice => 
                    new Date(notice.createdAt) > this.lastCheckTime
                );

                if (newNotices.length > 0) {
                    newNotices.forEach(notice => {
                        this.addNotification({
                            id: notice.id,
                            type: 'notice',
                            title: notice.title,
                            message: `New notice: ${notice.title}`,
                            priority: notice.priority,
                            createdAt: notice.createdAt,
                            read: false,
                            data: notice
                        });
                    });

                    this.lastCheckTime = new Date();
                    this.saveNotifications();
                    this.updateHeaderBadges();
                }
            }
        } catch (error) {
            console.error('Error checking for new notifications:', error);
        }
    }

    /**
     * Handle notice creation event
     */
    handleNoticeCreated(noticeData) {
        this.addNotification({
            id: noticeData.id || Date.now().toString(),
            type: 'notice_created',
            title: 'Notice Published',
            message: `New notice "${noticeData.title}" has been published`,
            priority: noticeData.priority || 'normal',
            createdAt: new Date().toISOString(),
            read: false,
            data: noticeData
        });

        this.updateHeaderBadges();
        this.saveNotifications();
    }

    /**
     * Handle notice update event
     */
    handleNoticeUpdated(noticeData) {
        this.addNotification({
            id: noticeData.id || Date.now().toString(),
            type: 'notice_updated',
            title: 'Notice Updated',
            message: `Notice "${noticeData.title}" has been updated`,
            priority: noticeData.priority || 'normal',
            createdAt: new Date().toISOString(),
            read: false,
            data: noticeData
        });

        this.updateHeaderBadges();
        this.saveNotifications();
    }

    /**
     * Add a new notification
     */
    addNotification(notification) {
        // Add to beginning of array (newest first)
        this.notifications.unshift(notification);
        
        // Keep only last 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }

        this.updateUnreadCount();
        this.notifySubscribers(notification);
    }

    /**
     * Update unread count
     */
    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
    }

    /**
     * Mark notification as read
     */
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
            notification.read = true;
            this.updateUnreadCount();
            this.updateHeaderBadges();
            this.saveNotifications();
        }
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.updateUnreadCount();
        this.updateHeaderBadges();
        this.saveNotifications();
    }

    /**
     * Update header notification badges
     */
    updateHeaderBadges() {
        const adminBadge = document.getElementById('notificationBadge');
        const memberBadge = document.getElementById('notificationBadge');

        // Update admin header badge
        if (adminBadge) {
            if (this.unreadCount > 0) {
                adminBadge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                adminBadge.style.display = 'flex';
                adminBadge.classList.add('pulse');
                
                // Remove pulse animation after 2 seconds
                setTimeout(() => {
                    adminBadge.classList.remove('pulse');
                }, 2000);
            } else {
                adminBadge.style.display = 'none';
            }
        }

        // Update member header badge (same ID, different context)
        if (memberBadge && memberBadge !== adminBadge) {
            if (this.unreadCount > 0) {
                memberBadge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                memberBadge.style.display = 'flex';
                memberBadge.classList.add('pulse');
                
                setTimeout(() => {
                    memberBadge.classList.remove('pulse');
                }, 2000);
            } else {
                memberBadge.style.display = 'none';
            }
        }
    }

    /**
     * Get all notifications
     */
    getAllNotifications() {
        return [...this.notifications];
    }

    /**
     * Get unread notifications
     */
    getUnreadNotifications() {
        return this.notifications.filter(n => !n.read);
    }

    /**
     * Subscribe to notification events
     */
    subscribe(callback) {
        this.subscribers.push(callback);
    }

    /**
     * Unsubscribe from notification events
     */
    unsubscribe(callback) {
        this.subscribers = this.subscribers.filter(sub => sub !== callback);
    }

    /**
     * Notify all subscribers
     */
    notifySubscribers(notification) {
        this.subscribers.forEach(callback => {
            try {
                callback(notification);
            } catch (error) {
                console.error('Error notifying subscriber:', error);
            }
        });
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        this.notifications = [];
        this.unreadCount = 0;
        this.updateHeaderBadges();
        this.saveNotifications();
    }

    /**
     * Destroy the notification service
     */
    destroy() {
        this.stopPolling();
        this.subscribers = [];
        this.saveNotifications();
    }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export class for custom instances
export default NotificationService;
