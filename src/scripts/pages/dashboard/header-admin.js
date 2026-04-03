/**
 * Header Admin Component Initialization
 * This file handles button click events for the admin header component
 * Include this AFTER w3.includeHTML() in admin dashboard pages
 * Enhanced version with all functionality from components folder
 */

(function() {
    'use strict';

    console.log('Header Admin JS loaded');

    // Enhanced notification service with real database integration
    var notificationService = {
        notifications: [],
        unreadCount: 0,
        pollingInterval: null,
        
        init: function() {
            this.loadStoredNotifications();
            this.startPolling();
            console.log('Admin notification service initialized');
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
        
        // Fetch real notifications from database
        fetchNotifications: function() {
            var self = this;
            return Promise.all([
                this.apiCall('/api/notices?limit=5'),
                this.apiCall('/api/announcements?status=active&limit=5')
            ]).then(function(results) {
                var notices = results[0].success ? (results[0].notices || []) : [];
                var announcements = results[1].success ? (results[1].announcements || []) : [];
                
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
                    self.notifications.push({
                        id: announcement.id,
                        type: 'announcement',
                        title: announcement.title,
                        content: announcement.content,
                        priority: announcement.priority,
                        category: announcement.type,
                        timestamp: announcement.sentAt || announcement.createdAt,
                        read: false,
                        actionUrl: '/pages/dashboard/admin/send-announcement.html'
                    });
                });
                
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
            console.log('Admin notification service destroyed');
        }
    };

    /**
     * Smart hash link handler - decides whether to use hash or full URL
     * Works on all admin pages
     */
    function initSmartHashLinks() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('.smart-hash');
            if (!link) return;
            
            const section = link.dataset.section;
            const fullUrl = link.dataset.url;
            
            // Check if we're already on admin-dashboard.html
            if (window.location.pathname.includes('admin-dashboard.html')) {
                // Use hash navigation (stay on same page)
                e.preventDefault();
                window.location.hash = section;
            } else if (fullUrl) {
                // Navigate to admin-dashboard with the hash
                e.preventDefault();
                window.location.href = fullUrl;
            }
            // Otherwise, let the normal link behavior happen
        });
    }
    
    // Initialize smart hash links
    initSmartHashLinks();

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
        menu.style.cssText = 'position: absolute; top: 100%; right: 0; margin-top: 8px; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 8px 0; min-width: 200px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 1000;';

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
     * Update header user information
     */
    function updateUserInfo(userInfo) {
        try {
            var userName = document.getElementById('headerUserName');
            var userRole = document.getElementById('headerUserRole');
            var userAvatar = document.getElementById('headerUserAvatar');

            if (userName && userInfo.firstName) {
                userName.textContent = (userInfo.firstName + ' ' + (userInfo.lastName || '')).trim();
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
    function updatePageInfo(title, subtitle) {
        try {
            var pageTitle = document.getElementById('pageTitle');
            var pageSubtitle = document.getElementById('pageSubtitle');

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
     * Load admin user info and update header
     */
    function loadAdminUserInfo() {
        // Get user from localStorage
        var userData = localStorage.getItem('swa_user');
        var user = userData ? JSON.parse(userData) : null;
        var userNameEl = document.getElementById('headerUserName');
        var userRoleEl = document.getElementById('headerUserRole');
        var pageSubtitle = document.getElementById('pageSubtitle');
        var userAvatar = document.getElementById('headerUserAvatar');
        
        if (user) {
            var name = user.name || user.firstName || user.email || 'Admin';
            var firstName = name.split(' ')[0];
            var role = user.role || 'Administrator';
            
            if (userNameEl) {
                userNameEl.textContent = name;
            }
            if (userRoleEl) {
                userRoleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
            }
            if (pageSubtitle) {
                pageSubtitle.textContent = 'Welcome back, ' + firstName;
            }
            if (userAvatar) {
                userAvatar.textContent = firstName.charAt(0).toUpperCase();
            }
            console.log('Admin user info loaded:', firstName);
        } else {
            console.log('No user data found in localStorage');
        }
    }
    
    /**
     * Initialize all header button event handlers
     */
    function initHeaderButtons() {
        console.log('Initializing header buttons...');
        
        // Initialize notification service
        notificationService.init();
        
        // Load admin user info
        loadAdminUserInfo();
        
        // Get all button elements
        var sidebarToggle = document.getElementById('sidebarToggle');
        var notificationBell = document.getElementById('notificationBell');
        var quickActionsBtn = document.getElementById('quickActionsBtn');
        var userProfile = document.getElementById('userProfile');
        var logoutBtn = document.getElementById('headerLogoutBtn');

        console.log('Elements found:', {
            sidebarToggle: !!sidebarToggle,
            notificationBell: !!notificationBell,
            quickActionsBtn: !!quickActionsBtn,
            userProfile: !!userProfile,
            logoutBtn: !!logoutBtn
        });

        // Sidebar toggle
        if (sidebarToggle) {
            sidebarToggle.onclick = function(e) {
                e.preventDefault();
                var sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('active');
                }
                console.log('Sidebar toggle clicked');
            };
            console.log('Sidebar toggle handler attached');
        }

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
    
    function createEnhancedDropdownMenu(button, menuId, items, type) {
        // Remove existing menu if any
        var existingMenu = document.getElementById(menuId);
        if (existingMenu) {
            existingMenu.remove();
        }

        // Create menu element
        var menu = document.createElement('div');
        menu.id = menuId;
        menu.className = 'header-dropdown-menu enhanced';
        menu.style.cssText = 'position: absolute; top: 100%; right: 0; margin-top: 8px; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 8px 0; min-width: 320px; max-width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 1000;';

        // Add header for notifications
        if (type === 'notifications') {
            var header = document.createElement('div');
            header.style.cssText = 'padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 14px; font-weight: 600; color: #f8fafc;';
            header.textContent = 'Notifications';
            menu.appendChild(header);
        }

        // Add items
        items.forEach(function(item) {
            if (item.text === '---') {
                var divider = document.createElement('div');
                divider.style.cssText = 'height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0;';
                menu.appendChild(divider);
                return;
            }
            
            var menuItem = document.createElement('div');
            menuItem.style.cssText = 'padding: 12px 20px; cursor: pointer; color: #e2e8f0; font-size: 14px; transition: background 0.2s; display: flex; flex-direction: column; gap: 4px;';
            
            if (item.subtitle) {
                var titleSpan = document.createElement('div');
                titleSpan.style.cssText = 'font-weight: 500; line-height: 1.3;';
                titleSpan.textContent = item.text;
                menuItem.appendChild(titleSpan);
                
                var subtitleSpan = document.createElement('div');
                subtitleSpan.style.cssText = 'font-size: 12px; color: #94a3b8; line-height: 1.3;';
                subtitleSpan.textContent = item.subtitle;
                menuItem.appendChild(subtitleSpan);
            } else {
                menuItem.textContent = item.text;
            }
            
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

        // Notification bell - show notifications dropdown
        if (notificationBell) {
            notificationBell.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Admin notification bell clicked');
                
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
                                // Mark as read and navigate to admin notices page
                                notificationService.markAsRead(notification.id);
                                window.location.href = '/pages/dashboard/shared/notices.html';
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
                
                createEnhancedDropdownMenu(notificationBell, 'notifications-menu', dropdownItems, 'notifications');
            };
            console.log('Admin notification bell handler attached');
        }

        // Quick actions button - show quick actions menu
        if (quickActionsBtn) {
            quickActionsBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Quick actions button clicked');
                
                // Emit custom event
                document.dispatchEvent(new CustomEvent('toggleQuickActions'));
                
                // Create quick actions dropdown as fallback
                createDropdownMenu(quickActionsBtn, 'quick-actions-menu', [
                    { text: 'Add New Member', action: function() { 
                        window.location.href = '/pages/dashboard/admin/edit-member.html';
                    }},
                    { text: 'Create Announcement', action: function() { 
                        window.location.href = '/pages/dashboard/admin/send-announcement.html';
                    }},
                    { text: 'Upload Document', action: function() { 
                        window.location.href = '/pages/dashboard/admin/upload-document.html';
                    }},
                    { text: 'Create Notice', action: function() { 
                        window.location.href = '/pages/dashboard/admin/create-notice.html';
                    }}
                ]);
            };
            console.log('Quick actions button handler attached');
        }

        // User profile - show user menu
        if (userProfile) {
            userProfile.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('User profile clicked');
                
                // Emit custom event
                document.dispatchEvent(new CustomEvent('toggleUserMenu'));
                
                // Get user info
                var userName = document.getElementById('headerUserName');
                var userRole = document.getElementById('headerUserRole');
                
                // Create user dropdown as fallback
                createDropdownMenu(userProfile, 'user-menu', [
                    { text: userName ? userName.textContent : 'Admin User', action: null },
                    { text: userRole ? userRole.textContent : 'Administrator', action: null },
                    { text: '---', action: null },
                    { text: 'Profile Settings', action: function() { 
                        window.location.href = '/pages/dashboard/admin/settings.html';
                    }},
                    { text: 'Security Settings', action: function() { 
                        window.location.href = '/pages/dashboard/admin/security-settings.html';
                    }}
                ]);
            };
            console.log('User profile handler attached');
        }

        // Logout button
        if (logoutBtn) {
            logoutBtn.onclick = async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Logout button clicked');
                
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
            console.log('Logout button handler attached');
        }

        console.log('All header button handlers initialized');
    }

    // Expose utility functions globally for external use
    window.adminHeaderUtils = {
        updateUserInfo: updateUserInfo,
        updatePageInfo: updatePageInfo,
        showConfirmDialog: showConfirmDialog,
        notificationService: notificationService
    };

    // Try to initialize immediately if elements exist
    function tryInit() {
        var logoutBtn = document.getElementById('headerLogoutBtn');
        
        if (logoutBtn) {
            console.log('Header elements found immediately');
            initHeaderButtons();
        } else {
            console.log('Header elements not found, waiting...');
            // Try again after a delay
            setTimeout(function() {
                var logoutBtn2 = document.getElementById('headerLogoutBtn');
                if (logoutBtn2) {
                    console.log('Header elements found after delay');
                    initHeaderButtons();
                } else {
                    console.log('Still waiting for header elements...');
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
