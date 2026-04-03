import { showAlert } from '../../../utils/utility-functions.js';
import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';
import { noticeService } from '../../../services/notice-service.js';
import { notificationService } from '../../../services/notification-service.js';

/**
 * Create Notice Script
 * Handles creating new notices/announcements
 * 
 * @version 1.0.0
 */

class CreateNotice {
    constructor() {
        this.isEditMode = false;
        this.noticeId = null;
        this.init();
    }

    init() {
        this.checkEditMode();
        this.initSidebar();
        this.initEventListeners();
        this.initCharacterCounter();
        this.initPreview();
    }

    checkEditMode() {
        const urlParams = new URLSearchParams(window.location.search);
        this.noticeId = urlParams.get('id');
        
        if (this.noticeId) {
            this.isEditMode = true;
            this.loadNoticeForEdit();
        }
    }

    async loadNoticeForEdit() {
        try {
            const response = await noticeService.getById(this.noticeId);
            if (response.success && response.data) {
                this.populateForm(response.data);
                document.querySelector('.page-header h1').innerHTML = '<i class="fas fa-edit"></i> Edit Notice';
                document.querySelector('.page-header p').textContent = 'Update notice details';
            } else {
                showAlert('Notice not found', 'error');
                window.location.href = '../shared/notices.html';
            }
        } catch (error) {
            console.error('Error loading notice:', error);
            showAlert('Error loading notice', 'error');
            window.location.href = '../shared/notices.html';
        }
    }

    populateForm(notice) {
        document.getElementById('title').value = notice.title || '';
        document.getElementById('content').value = notice.content || '';
        document.getElementById('type').value = notice.type || 'general';
        document.getElementById('priority').value = notice.priority || 'normal';
        document.getElementById('targetAudience').value = notice.audience || 'all';
        
        if (notice.expiryDate) {
            const expiryDate = new Date(notice.expiryDate).toISOString().split('T')[0];
            document.getElementById('expiryDate').value = expiryDate;
        }
        
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

    initEventListeners() {
        const form = document.querySelector('#createNoticeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitNotice(e);
            });
        }

        // Save draft button
        const saveDraftBtn = document.getElementById('saveDraft');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => {
                this.saveDraft();
            });
        }

        const cancelBtn = document.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.handleCancel();
            });
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Real-time preview updates
        const titleInput = document.getElementById('title');
        const contentInput = document.getElementById('content');
        const typeSelect = document.getElementById('type');
        const prioritySelect = document.getElementById('priority');
        const expiryDateInput = document.getElementById('expiryDate');

        if (titleInput) titleInput.addEventListener('input', () => this.updatePreview());
        if (contentInput) contentInput.addEventListener('input', () => this.updatePreview());
        if (typeSelect) typeSelect.addEventListener('change', () => this.updatePreview());
        if (prioritySelect) prioritySelect.addEventListener('change', () => this.updatePreview());
        if (expiryDateInput) expiryDateInput.addEventListener('change', () => this.updatePreview());
    }

    initCharacterCounter() {
        const contentTextarea = document.getElementById('content');
        const charCounter = document.getElementById('charCount');
        
        if (contentTextarea && charCounter) {
            contentTextarea.addEventListener('input', () => {
                const charCount = contentTextarea.value.length;
                charCounter.textContent = charCount;
                
                if (charCount > 1000) {
                    charCounter.style.color = 'var(--error-color)';
                } else if (charCount > 800) {
                    charCounter.style.color = 'var(--warning-color)';
                } else {
                    charCounter.style.color = 'var(--text-secondary)';
                }
            });
        }
    }

    initPreview() {
        this.updatePreview();
    }

    updatePreview() {
        const title = document.getElementById('title').value || 'Notice Title';
        const content = document.getElementById('content').value || 'Notice content will appear here...';
        const priority = document.getElementById('priority').value || 'medium';
        const expiryDate = document.getElementById('expiryDate').value;

        document.getElementById('previewTitle').textContent = title;
        document.getElementById('previewContent').textContent = content;
        document.getElementById('previewPriority').textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
        document.getElementById('previewPriority').className = `priority-badge ${priority}`;
        document.getElementById('previewDate').textContent = 'Today';
        
        if (expiryDate) {
            const expiry = new Date(expiryDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            document.getElementById('previewExpiry').textContent = expiry;
        } else {
            document.getElementById('previewExpiry').textContent = 'Never';
        }
    }

    async submitNotice(e) {
        const form = e.target;
        const formData = new FormData(form);
        
        // Validate form
        if (!this.validateForm(formData)) {
            return;
        }

        const noticeData = {
            title: formData.get('title'),
            content: formData.get('content'),
            type: formData.get('type') || 'general',
            priority: formData.get('priority') || 'normal',
            audience: formData.get('targetAudience') || 'all',
            isPublished: true,
            expiryDate: formData.get('expiryDate') || null
        };

        try {
            let response;
            if (this.isEditMode) {
                response = await noticeService.update(this.noticeId, noticeData);
                if (response.success) {
                    showAlert('Notice updated successfully!', 'success');
                }
            } else {
                response = await noticeService.create(noticeData);
                if (response.success) {
                    showAlert('Notice published successfully!', 'success');
                }
            }

            if (response.success) {
                // Emit notification event
                if (this.isEditMode) {
                    document.dispatchEvent(new CustomEvent('noticeUpdated', {
                        detail: { ...noticeData, id: this.noticeId }
                    }));
                } else {
                    document.dispatchEvent(new CustomEvent('noticeCreated', {
                        detail: { ...noticeData, id: response.data.id }
                    }));
                }

                // Redirect to notices page after a short delay
                setTimeout(() => {
                    window.location.href = '../shared/notices.html';
                }, 1500);
            } else {
                showAlert(response.message || 'Failed to save notice', 'error');
            }
        } catch (error) {
            console.error('Error saving notice:', error);
            showAlert('Error saving notice. Please try again.', 'error');
        }
    }

    async saveDraft() {
        const form = document.querySelector('#createNoticeForm');
        const formData = new FormData(form);
        
        if (!formData.get('title') || !formData.get('content')) {
            showAlert('Title and content are required to save draft', 'warning');
            return;
        }

        const noticeData = {
            title: formData.get('title'),
            content: formData.get('content'),
            type: formData.get('type') || 'general',
            priority: formData.get('priority') || 'normal',
            audience: formData.get('targetAudience') || 'all',
            isPublished: false, // Draft notices are not published
            expiryDate: formData.get('expiryDate') || null
        };

        try {
            const response = await noticeService.create(noticeData);
            if (response.success) {
                // Emit notification event for draft creation
                document.dispatchEvent(new CustomEvent('noticeCreated', {
                    detail: { ...noticeData, id: response.data.id, isDraft: true }
                }));
                
                showAlert('Draft saved successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '../shared/notices.html';
                }, 1500);
            } else {
                showAlert('Failed to save draft', 'error');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            showAlert('Error saving draft. Please try again.', 'error');
        }
    }

    validateForm(formData) {
        const title = formData.get('title');
        const content = formData.get('content');
        const type = formData.get('type');

        if (!title || title.trim().length < 3) {
            showAlert('Title must be at least 3 characters long', 'warning');
            return false;
        }

        if (!content || content.trim().length < 10) {
            showAlert('Content must be at least 10 characters long', 'warning');
            return false;
        }

        if (!type) {
            showAlert('Please select a notice type', 'warning');
            return false;
        }

        if (content.length > 1000) {
            showAlert('Content must not exceed 1000 characters', 'warning');
            return false;
        }

        return true;
    }

    async handleCancel() {
        const hasContent = document.getElementById('title').value || document.getElementById('content').value;
        
        if (hasContent) {
            const confirmed = await showConfirm('Are you sure you want to cancel? Any unsaved changes will be lost.');
            if (!confirmed) return;
        }
        
        window.location.href = '../shared/notices.html';
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
}

document.addEventListener('DOMContentLoaded', () => {
    new CreateNotice();
});
