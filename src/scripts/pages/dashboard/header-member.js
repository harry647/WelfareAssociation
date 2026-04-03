/**
 * Header Member Component Initialization
 * This file handles button click events for the member header component
 * Include this AFTER w3.includeHTML() in member dashboard pages
 * Enhanced version with all functionality from components folder
 */

(function() {
    'use strict';

    console.log('Header Member JS loaded');

    // Simple notification service implementation (self-contained)
    var notificationService = {
        notifications: [],
        unreadCount: 0,
        
        init: function() {
            this.loadStoredNotifications();
            console.log('Member notification service initialized');
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
            console.log('Member notification service destroyed');
        }
    };

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
                
                // Create simple notification dropdown as fallback
                createDropdownMenu(notificationBell, 'notifications-menu', [
                    { text: 'No new notifications', action: null },
                    { text: 'View all notifications', action: function() { 
                        console.log('View all notifications clicked');
                    }}
                ]);
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
