/**
 * Header Admin Component Initialization
 * This file handles button click events for the admin header component
 * Include this AFTER w3.includeHTML() in admin dashboard pages
 * Enhanced version with all functionality from components folder
 */

(function() {
    'use strict';

    console.log('Header Admin JS loaded');

    // Simple notification service implementation (self-contained)
    var notificationService = {
        notifications: [],
        unreadCount: 0,
        
        init: function() {
            this.loadStoredNotifications();
            console.log('Notification service initialized');
        },
        
        loadStoredNotifications: function() {
            var stored = localStorage.getItem('swa_notifications');
            if (stored) {
                this.notifications = JSON.parse(stored);
                this.updateUnreadCount();
            }
        },
        
        markAllAsRead: function() {
            this.notifications.forEach(function(n) { n.read = true; });
            this.unreadCount = 0;
            this.saveNotifications();
        },
        
        getAllNotifications: function() {
            return this.notifications;
        },
        
        updateUnreadCount: function() {
            this.unreadCount = this.notifications.filter(function(n) { return !n.read; }).length;
        },
        
        saveNotifications: function() {
            localStorage.setItem('swa_notifications', JSON.stringify(this.notifications));
        },
        
        destroy: function() {
            this.notifications = [];
            this.unreadCount = 0;
            console.log('Notification service destroyed');
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

        // Notification bell - show notifications dropdown
        if (notificationBell) {
            notificationBell.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Notification bell clicked');
                
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
                
                // Create notifications dropdown as fallback
                createDropdownMenu(notificationBell, 'notifications-menu', [
                    { text: 'No new notifications', action: null },
                    { text: 'View all notifications', action: function() { 
                        console.log('View all notifications clicked');
                    }}
                ]);
            };
            console.log('Notification bell handler attached');
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
