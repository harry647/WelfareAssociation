/**
 * Header Member Component Initialization
 * This file handles button click events for the member header component
 * Include this AFTER w3.includeHTML() in member dashboard pages
 * Enhanced version with all functionality from components folder
 */

(function() {
    'use strict';

    console.log('Header Member JS loaded');

    // Enhanced notification service with real database integration
    var notificationService = {
        notifications: [],
        unreadCount: 0,
        pollingInterval: null,
        
        init: function() {
            this.loadStoredNotifications();
            this.startPolling();
            console.log('Member notification service initialized');
        },
        
        // API helper function
        apiCall: function(endpoint, method, data) {
            var token = localStorage.getItem('swa_auth_token') || sessionStorage.getItem('swa_auth_token');
            return fetch(endpoint, {
                method: method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: data ? JSON.stringify(data) : null
            }).then(function(response) {
                if (!response.ok) throw new Error('API call failed');
                return response.json();
            });
        },
        
        // Fetch real notifications from database (member-focused)
        fetchNotifications: function() {
            var self = this;
            console.log('Fetching notifications...');
            return Promise.all([
                this.apiCall('/api/notices?limit=5&audience=all'),
                this.apiCall('/api/announcements?limit=5')
            ]).then(function(results) {
                console.log('API Results:', results);
                var notices = results[0].success ? (results[0].notices || []) : [];
                var announcements = results[1].success ? (results[1].announcements || []) : [];
                
                console.log('Notices:', notices);
                console.log('Announcements:', announcements);
                console.log('Announcements count:', announcements.length);
                
                // Combine and format notifications
                self.notifications = [];
                
                // Add notices
                notices.forEach(function(notice) {
                    self.notifications.push({
                        id: notice.id,
                        type: 'notice',
                        title: notice.title,
                        content: notice.content,
                        priority: notice.priority,
                        category: notice.type,
                        timestamp: notice.createdAt || notice.publishDate,
                        read: false,
                        actionUrl: '/pages/dashboard/shared/notices.html'
                    });
                });
                
                // Add announcements
                announcements.forEach(function(announcement) {
                    console.log('Processing announcement:', announcement);
                    self.notifications.push({
                        id: announcement.id,
                        type: 'announcement',
                        title: announcement.title,
                        content: announcement.content,
                        priority: announcement.priority,
                        category: announcement.type,
                        timestamp: announcement.sentAt || announcement.createdAt,
                        read: false,
                        actionUrl: '/pages/dashboard/shared/notices.html'
                    });
                });
                
                console.log('Total notifications after combining:', self.notifications.length);
                
                // Sort by priority and timestamp
                self.notifications.sort(function(a, b) {
                    var priorityOrder = { 'critical': 4, 'high': 3, 'urgent': 3, 'medium': 2, 'normal': 2, 'low': 1 };
                    var aPriority = priorityOrder[a.priority] || 0;
                    var bPriority = priorityOrder[b.priority] || 0;
                    
                    if (aPriority !== bPriority) {
                        return bPriority - aPriority;
                    }
                    
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });
                
                self.updateUnreadCount();
                self.saveNotifications();
                
            }).catch(function(error) {
                console.error('Error fetching notifications:', error);
                console.error('Error details:', error.message);
            });
        },
        
        startPolling: function() {
            var self = this;
            // Initial fetch
            this.fetchNotifications();
            
            // Poll every 30 seconds
            this.pollingInterval = setInterval(function() {
                self.fetchNotifications();
            }, 30000);
        },
        
        loadStoredNotifications: function() {
            var stored = localStorage.getItem('swa_notifications');
            if (stored) {
                try {
                    this.notifications = JSON.parse(stored);
                    // Ensure it's an array
                    if (!Array.isArray(this.notifications)) {
                        this.notifications = [];
                    }
                } catch (error) {
                    console.error('Error parsing notifications:', error);
                    this.notifications = [];
                }
                this.updateUnreadCount();
            } else {
                this.notifications = [];
            }
        },
        
        markAllAsRead: function() {
            this.notifications.forEach(function(n) { n.read = true; });
            this.unreadCount = 0;
            this.saveNotifications();
            
            // Update badge
            var badge = document.getElementById('notificationBadge');
            if (badge) badge.style.display = 'none';
        },
        
        markAsRead: function(id) {
            var notification = this.notifications.find(function(n) { return n.id === id; });
            if (notification) {
                notification.read = true;
                this.updateUnreadCount();
                this.saveNotifications();
            }
        },
        
        getAllNotifications: function() {
            return this.notifications;
        },
        
        getUnreadCount: function() {
            return this.unreadCount;
        },
        
        updateUnreadCount: function() {
            this.unreadCount = this.notifications.filter(function(n) { return !n.read; }).length;
            
            // Update badge
            var badge = document.getElementById('notificationBadge');
            if (badge) {
                if (this.unreadCount > 0) {
                    badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                    badge.style.display = 'flex';
                    
                    // Add pulse animation for new notifications
                    if (this.unreadCount > 0) {
                        badge.classList.add('pulse');
                        setTimeout(function() {
                            badge.classList.remove('pulse');
                        }, 2000);
                    }
                } else {
                    badge.style.display = 'none';
                }
            }
        },
        
        saveNotifications: function() {
            localStorage.setItem('swa_notifications', JSON.stringify(this.notifications));
        },
        
        destroy: function() {
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
            }
            this.notifications = [];
            this.unreadCount = 0;
            console.log('Member notification service destroyed');
        }
    };

    /**
     * Helper functions for enhanced notifications
     */
    function getPriorityIcon(priority) {
        var icons = {
            'critical': '🔴',
            'high': '🟠', 
            'urgent': '🟠',
            'medium': '🟡',
            'normal': '🔵',
            'low': '⚪'
        };
        return icons[priority] || '🔵';
    }
    
    function getTimeAgo(timestamp) {
        var now = new Date();
        var time = new Date(timestamp);
        var diff = Math.floor((now - time) / 1000); // seconds
        
        if (diff < 60) return 'just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
        return Math.floor(diff / 604800) + 'w ago';
    }
    
    // Update badge
    var badge = document.getElementById('notificationBadge');
    if (badge) badge.style.display = 'none';

    function showNotificationDialog(notification) {
        // Mark as read
        notificationService.markAsRead(notification.id);
        
        // Create dialog overlay
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease;';
        
        // Create dialog content
        var dialog = document.createElement('div');
        dialog.style.cssText = 'background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3); animation: slideUp 0.3s ease;';
        
        var priorityIcon = getPriorityIcon(notification.priority);
        var timeAgo = getTimeAgo(notification.timestamp);
        
        dialog.innerHTML = '\
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">\
                <h3 style="color: #f8fafc; margin: 0; font-size: 18px; font-weight: 600;">' + priorityIcon + ' ' + notification.title + '</h3>\
                <button onclick="this.closest(\'div[style*=fixed]\').remove()" style="background: none; border: none; color: #94a3b8; font-size: 24px; cursor: pointer; padding: 0; line-height: 1;">&times;</button>\
            </div>\
            <div style="color: #94a3b8; font-size: 12px; margin-bottom: 16px;">' + timeAgo + ' • ' + notification.category + '</div>\
            <div style="color: #e2e8f0; line-height: 1.6; margin-bottom: 20px;">' + notification.content + '</div>\
            <div style="display: flex; gap: 12px; justify-content: flex-end;">\
                <button onclick="this.closest(\'div[style*=fixed]\').remove()" style="background: #374151; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px;">Close</button>\
            </div>';
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
        
        // Add CSS animations
        if (!document.getElementById('notification-dialog-styles')) {
            var style = document.createElement('style');
            style.id = 'notification-dialog-styles';
            style.textContent = '\
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }\
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }';
            document.head.appendChild(style);
        }
    }

    /**
     * Create and show a dropdown menu
     */
    function createDropdownMenu(button, menuId, items) {
        // Remove existing menu if any
        var existingMenu = document.getElementById(menuId);
        if (existingMenu) {
            existingMenu.remove();
        }

        // Create menu element
        var menu = document.createElement('div');
        menu.id = menuId;
        menu.className = 'header-dropdown-menu';
        menu.style.cssText = 'position: absolute; top: 100%; right: 0; margin-top: 8px; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0; min-width: 320px; max-width: 400px; max-height: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 1000; overflow: hidden; display: flex; flex-direction: column;';

        // Add items
        items.forEach(function(item) {
            if (item.text === '---') {
                var divider = document.createElement('div');
                divider.style.cssText = 'height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0;';
                menu.appendChild(divider);
                return;
            }
            var menuItem = document.createElement('div');
            menuItem.style.cssText = 'padding: 12px 20px; cursor: pointer; color: #e2e8f0; font-size: 14px; transition: background 0.2s;';
            menuItem.textContent = item.text;
            menuItem.addEventListener('mouseenter', function() {
                menuItem.style.background = 'rgba(74, 222, 128, 0.1)';
            });
            menuItem.addEventListener('mouseleave', function() {
                menuItem.style.background = 'transparent';
            });
            menuItem.addEventListener('click', function() {
                if (item.action) item.action();
                menu.remove();
            });
            menu.appendChild(menuItem);
        });

        // Position the menu
        var rect = button.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = (rect.bottom + 8) + 'px';
        menu.style.right = (window.innerWidth - rect.right) + 'px';

        document.body.appendChild(menu);

        // Close menu when clicking outside
        var closeMenu = function(e) {
            if (!menu.contains(e.target) && e.target !== button && !button.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(function() {
            document.addEventListener('click', closeMenu);
        }, 100);

        return menu;
    }

    /**
     * Show confirmation dialog
     */
    function showConfirmDialog(message) {
        return new Promise(function(resolve) {
            var result = confirm(message);
            resolve(result);
        });
    }

    /**
     * Update member avatar and user info
     */
    function updateMemberAvatar(userInfo) {
        try {
            var memberAvatar = document.getElementById('memberAvatar');
            var welcomeMessage = document.getElementById('welcomeMessage');

            if (memberAvatar && userInfo.firstName) {
                memberAvatar.textContent = userInfo.firstName.charAt(0).toUpperCase();
            }

            if (welcomeMessage && userInfo.firstName) {
                welcomeMessage.innerHTML = '<i class="fas fa-user-circle"></i> Welcome, ' + userInfo.firstName;
            }
        } catch (error) {
            console.error('Error updating member avatar:', error);
        }
    }

    /**
     * Show fine alert
     */
    function showFineAlert(amount) {
        try {
            var fineAlert = document.getElementById('fineAlert');
            var fineAlertText = document.getElementById('fineAlertText');

            if (fineAlert && fineAlertText) {
                fineAlertText.textContent = 'You have unpaid fines of Ksh ' + amount;
                fineAlert.style.display = 'flex';
            }
        } catch (error) {
            console.error('Error showing fine alert:', error);
        }
    }

    /**
     * Hide fine alert
     */
    function hideFineAlert() {
        try {
            var fineAlert = document.getElementById('fineAlert');
            if (fineAlert) {
                fineAlert.style.display = 'none';
            }
        } catch (error) {
            console.error('Error hiding fine alert:', error);
        }
    }

    /**
     * Load member user info and update header
     */
    function loadMemberUserInfo() {
        // Get user from localStorage
        var userData = localStorage.getItem('swa_user');
        var user = userData ? JSON.parse(userData) : null;
        var memberAvatar = document.getElementById('memberAvatar');
        var welcomeMessage = document.getElementById('welcomeMessage');
        
        if (user) {
            var name = user.name || user.firstName || user.email || 'Member';
            var firstName = name.split(' ')[0];
            
            if (memberAvatar) {
                memberAvatar.textContent = firstName.charAt(0).toUpperCase();
            }
            if (welcomeMessage) {
                welcomeMessage.innerHTML = '<i class="fas fa-user-circle"></i> Welcome, ' + firstName;
            }
            console.log('Member user info loaded:', firstName);
        } else {
            console.log('No user data found in localStorage');
        }
    }

    /**
     * Initialize all header button event handlers
     */
    function initHeaderButtons() {
        console.log('Initializing member header buttons...');
        
        // Initialize notification service
        notificationService.init();
        
        // Load member user info
        loadMemberUserInfo();
        
        // Get all button elements
        var notificationBell = document.getElementById('notificationBell');
        var logoutBtn = document.getElementById('memberLogoutBtn');
        var profileLink = document.querySelector('.profile-link');

        console.log('Elements found:', {
            notificationBell: !!notificationBell,
            logoutBtn: !!logoutBtn,
            profileLink: !!profileLink
        });

        // Notification bell - show notifications dropdown
        if (notificationBell) {
            notificationBell.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Member notification bell clicked');
                
                // Mark all notifications as read
                notificationService.markAllAsRead();
                
                // Hide badge
                var badge = document.getElementById('notificationBadge');
                if (badge) badge.style.display = 'none';
                
                // Emit custom event for notification panel
                document.dispatchEvent(new CustomEvent('toggleNotifications', {
                    detail: {
                        notifications: notificationService.getAllNotifications()
                    }
                }));
                
                // Create enhanced notifications dropdown
                var notifications = notificationService.getAllNotifications();
                var dropdownItems = [];
                
                if (notifications.length === 0) {
                    dropdownItems.push({ text: 'No new notifications', action: null });
                } else {
                    notifications.forEach(function(notification) {
                        var priorityIcon = getPriorityIcon(notification.priority);
                        var timeAgo = getTimeAgo(notification.timestamp);
                        var preview = (notification.content || '').substring(0, 60) + '...';
                        
                        dropdownItems.push({
                            text: priorityIcon + ' ' + notification.title + ' - ' + timeAgo,
                            subtitle: preview,
                            action: function() {
                                // Show dialog for regular users
                                showNotificationDialog(notification);
                            }
                        });
                    });
                    
                    dropdownItems.push({ text: '---', action: null });
                    dropdownItems.push({ 
                        text: 'View All Notifications', 
                        action: function() { 
                            window.location.href = '/pages/dashboard/shared/notices.html';
                        }
                    });
                }
                
                createDropdownMenu(notificationBell, 'notifications-menu', dropdownItems);
            };
            console.log('Member notification bell handler attached');
        }

        // Profile link - allow default navigation
        if (profileLink) {
            profileLink.onclick = function(e) {
                console.log('Member profile link clicked');
                // Allow default navigation to profile page
            };
            console.log('Member profile link handler attached');
        }

        // Logout button
        if (logoutBtn) {
            logoutBtn.onclick = async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Member logout button clicked');
                
                // Show confirmation dialog
                var confirmed = await showConfirmDialog('Are you sure you want to logout?');
                if (!confirmed) return;

                // Clear auth tokens
                localStorage.removeItem('swa_auth_token');
                localStorage.removeItem('swa_user');
                sessionStorage.removeItem('swa_auth_token');
                sessionStorage.removeItem('swa_user');
                
                // Destroy notification service
                notificationService.destroy();
                
                // Redirect to homepage
                window.location.href = '/index.html';
            };
            console.log('Member logout button handler attached');
        }

        console.log('All member header button handlers initialized');
    }

    // Expose utility functions globally for external use
    window.memberHeaderUtils = {
        updateMemberAvatar: updateMemberAvatar,
        showFineAlert: showFineAlert,
        hideFineAlert: hideFineAlert,
        showConfirmDialog: showConfirmDialog,
        notificationService: notificationService
    };

    // Try to initialize immediately if elements exist
    function tryInit() {
        var logoutBtn = document.getElementById('memberLogoutBtn');
        
        if (logoutBtn) {
            console.log('Member header elements found immediately');
            initHeaderButtons();
        } else {
            console.log('Member header elements not found, waiting...');
            // Try again after a delay
            setTimeout(function() {
                var logoutBtn2 = document.getElementById('memberLogoutBtn');
                if (logoutBtn2) {
                    console.log('Member header elements found after delay');
                    initHeaderButtons();
                } else {
                    console.log('Still waiting for member header elements...');
                    // One more try
                    setTimeout(function() {
                        initHeaderButtons();
                    }, 500);
                }
            }, 300);
        }
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }

})();
