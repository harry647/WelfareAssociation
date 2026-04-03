import { showAlert } from '../../../utils/utility-functions.js';
import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';
import { announcementService } from '../../../services/announcement-service.js';

/**
 * Send Announcement Script
 * Handles sending announcements to members
 * 
 * @version 1.0.0
 */

class SendAnnouncement {
    constructor() {
        this.announcementId = null;
        this.init();
    }

    init() {
        this.checkEditMode();
        this.initSidebar();
        this.initEventListeners();
    }

    checkEditMode() {
        // Check if we're editing an existing announcement
        const urlParams = new URLSearchParams(window.location.search);
        this.announcementId = urlParams.get('id');
        
        if (this.announcementId) {
            this.loadAnnouncementForEdit();
            // Update page title and button text
            document.title = 'Edit Announcement - Student Welfare Association | JOOUST';
            const pageTitle = document.querySelector('.page-header h1');
            if (pageTitle) {
                pageTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Announcement';
            }
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Announcement';
            }
        }
    }

    async loadAnnouncementForEdit() {
        try {
            const response = await announcementService.getById(this.announcementId);
            if (response.success && response.data) {
                const announcement = response.data;
                this.populateForm(announcement);
            } else {
                showAlert('Announcement not found', 'error');
                window.location.href = '../shared/notices.html';
            }
        } catch (error) {
            console.error('Error loading announcement:', error);
            showAlert('Error loading announcement', 'error');
            window.location.href = '../shared/notices.html';
        }
    }

    populateForm(announcement) {
        const form = document.querySelector('form');
        if (!form) return;

        // Populate form fields
        const titleField = form.querySelector('#title');
        const messageField = form.querySelector('#message');
        const categoryField = form.querySelector('#category');
        const priorityField = form.querySelector('#priority');
        const recipientsField = form.querySelector('#recipients');
        const scheduledDateField = form.querySelector('#scheduledDate');

        if (titleField) titleField.value = announcement.title || '';
        if (messageField) messageField.value = announcement.content || '';
        if (categoryField) categoryField.value = announcement.type || 'general';
        if (priorityField) priorityField.value = announcement.priority || 'medium';
        if (recipientsField) recipientsField.value = announcement.targetAudience || 'all';
        if (scheduledDateField && announcement.expiresAt) {
            scheduledDateField.value = new Date(announcement.expiresAt).toISOString().slice(0, 16);
        }

        // Update character counter
        this.updateCharCounter();
        
        // Update preview
        this.updatePreview();
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

    updateCharCounter() {
        const messageField = document.getElementById('message');
        const charCount = document.getElementById('charCount');
        if (messageField && charCount) {
            const length = messageField.value.length;
            charCount.textContent = length;
            
            // Change color if approaching limit
            if (length > 900) {
                charCount.style.color = '#ef4444';
            } else if (length > 800) {
                charCount.style.color = '#f59e0b';
            } else {
                charCount.style.color = '#6b7280';
            }
        }
    }

    updatePreview() {
        const titleField = document.getElementById('title');
        const messageField = document.getElementById('message');
        const priorityField = document.getElementById('priority');
        const previewTitle = document.getElementById('previewTitle');
        const previewMessage = document.getElementById('previewMessage');
        const previewPriority = document.getElementById('previewPriority');
        const previewDate = document.getElementById('previewDate');

        if (previewTitle && titleField) {
            previewTitle.textContent = titleField.value || 'Announcement Title';
        }

        if (previewMessage && messageField) {
            previewMessage.textContent = messageField.value || 'Your announcement message will appear here...';
        }

        if (previewPriority && priorityField) {
            const priority = priorityField.value || 'medium';
            previewPriority.textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
            
            // Update priority badge color
            previewPriority.className = 'priority-badge';
            switch (priority) {
                case 'critical':
                    previewPriority.style.backgroundColor = '#dc2626';
                    break;
                case 'high':
                    previewPriority.style.backgroundColor = '#ea580c';
                    break;
                case 'medium':
                    previewPriority.style.backgroundColor = '#ca8a04';
                    break;
                case 'low':
                    previewPriority.style.backgroundColor = '#16a34a';
                    break;
                default:
                    previewPriority.style.backgroundColor = '#6b7280';
            }
        }

        if (previewDate) {
            previewDate.textContent = new Date().toLocaleDateString();
        }
    }

    initEventListeners() {
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendAnnouncement(e);
            });
        }

        // Character counter
        const messageField = document.getElementById('message');
        const charCount = document.getElementById('charCount');
        if (messageField && charCount) {
            messageField.addEventListener('input', () => this.updateCharCounter());
        }

        // Preview functionality
        const titleField = document.getElementById('title');
        const priorityField = document.getElementById('priority');
        
        if (titleField) {
            titleField.addEventListener('input', () => this.updatePreview());
        }
        if (messageField) {
            messageField.addEventListener('input', () => this.updatePreview());
        }
        if (priorityField) {
            priorityField.addEventListener('change', () => this.updatePreview());
        }

        // Save Draft button
        const saveDraftBtn = document.getElementById('saveDraft');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveDraft());
        }

        // Test Send button
        const testSendBtn = document.getElementById('testSend');
        if (testSendBtn) {
            testSendBtn.addEventListener('click', () => this.testSend());
        }

        // Cancel button
        const cancelBtn = document.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                    window.location.href = '../shared/notices.html';
                }
            });
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async sendAnnouncement(e) {
        const form = e.target;
        const formData = new FormData(form);
        
        const announcement = {
            title: formData.get('title'),
            content: formData.get('message'),
            type: formData.get('category') || 'general',
            priority: formData.get('priority') || 'medium',
            targetAudience: formData.get('recipients') || 'all',
            expiresAt: formData.get('scheduledDate') || null
        };

        try {
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (this.announcementId ? 'Updating...' : 'Sending...');
            submitBtn.disabled = true;

            let response;
            if (this.announcementId) {
                // Update existing announcement
                response = await announcementService.update(this.announcementId, announcement);
                if (response.success) {
                    showAlert('Announcement updated successfully!', 'success');
                }
            } else {
                // Create new announcement
                response = await announcementService.create(announcement);
                if (response.success) {
                    showAlert('Announcement sent successfully!', 'success');
                }
            }
            
            if (response.success) {
                form.reset();
                // Redirect to notices page after successful operation
                setTimeout(() => {
                    window.location.href = '../shared/notices.html';
                }, 1500);
            } else {
                showAlert('Failed to ' + (this.announcementId ? 'update' : 'send') + ' announcement: ' + (response.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error ' + (this.announcementId ? 'updating' : 'sending') + ' announcement:', error);
            showAlert('Error ' + (this.announcementId ? 'updating' : 'sending') + ' announcement. Please try again.', 'error');
        } finally {
            // Restore button state
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = this.announcementId ? '<i class="fas fa-save"></i> Update Announcement' : '<i class="fas fa-paper-plane"></i> Send Announcement';
                submitBtn.disabled = false;
            }
        }
    }

    async handleLogout() {
        if (await showConfirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_refresh_token');
            localStorage.removeItem('swa_user');
            window.location.href = '../../index.html';
        }
    }

    async saveDraft() {
        const form = document.querySelector('form');
        const formData = new FormData(form);
        
        const draft = {
            title: `[DRAFT] ${formData.get('title')}`,
            content: formData.get('message'),
            type: formData.get('category') || 'general',
            priority: formData.get('priority') || 'medium',
            targetAudience: formData.get('recipients') || 'all',
            expiresAt: formData.get('scheduledDate') || null
        };

        try {
            const saveDraftBtn = document.getElementById('saveDraft');
            const originalText = saveDraftBtn.innerHTML;
            saveDraftBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveDraftBtn.disabled = true;

            const response = await announcementService.create(draft);
            
            if (response.success) {
                showAlert('Draft saved successfully!', 'success');
                // Update URL with the new draft ID
                if (response.announcement && response.announcement.id) {
                    const newUrl = window.location.pathname + '?id=' + response.announcement.id;
                    window.history.replaceState({}, '', newUrl);
                    this.announcementId = response.announcement.id;
                }
            } else {
                showAlert('Failed to save draft: ' + (response.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            showAlert('Error saving draft. Please try again.', 'error');
        } finally {
            const saveDraftBtn = document.getElementById('saveDraft');
            if (saveDraftBtn) {
                saveDraftBtn.innerHTML = '<i class="fas fa-save"></i> Save Draft';
                saveDraftBtn.disabled = false;
            }
        }
    }

    async testSend() {
        const form = document.querySelector('form');
        const formData = new FormData(form);
        
        const announcement = {
            title: `[TEST] ${formData.get('title')}`,
            content: formData.get('message'),
            type: formData.get('category') || 'general',
            priority: formData.get('priority') || 'medium',
            targetAudience: formData.get('recipients') || 'all', // Use actual audience value, not 'test'
            expiresAt: formData.get('scheduledDate') || null
        };

        // Validate required fields
        if (!announcement.title || !announcement.content) {
            showAlert('Please fill in both title and message fields before testing.', 'warning');
            return;
        }

        try {
            const testSendBtn = document.getElementById('testSend');
            const originalText = testSendBtn.innerHTML;
            testSendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            testSendBtn.disabled = true;

            // Create a test announcement with a special title prefix
            const response = await announcementService.create(announcement);
            
            if (response.success) {
                showAlert('Test announcement sent successfully! Check your email/dashboard for the test message.', 'success');
                
                // Optionally, you could add a special flag or status to mark it as a test
                // This would require backend support for a 'status' field
            } else {
                showAlert('Failed to send test: ' + (response.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error sending test:', error);
            showAlert('Error sending test announcement. Please try again.', 'error');
        } finally {
            const testSendBtn = document.getElementById('testSend');
            if (testSendBtn) {
                testSendBtn.innerHTML = '<i class="fas fa-vial"></i> Test Send';
                testSendBtn.disabled = false;
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SendAnnouncement();
});
