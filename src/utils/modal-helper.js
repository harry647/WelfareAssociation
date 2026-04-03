/**
 * Modal Helper Utility
 * Provides reusable modal functions to replace alert() calls
 * 
 * @version 1.0.0
 */

export class ModalHelper {
    constructor() {
        this.modalCount = 0;
        this.callbacks = {};
        this.initStyles();
    }

    initStyles() {
        // Check if styles are already added
        if (document.getElementById('modal-helper-styles')) {
            return;
        }

        const styleElement = document.createElement('style');
        styleElement.id = 'modal-helper-styles';
        styleElement.textContent = `
            .modal-helper-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: modalFadeIn 0.3s ease;
            }

            .modal-helper-modal {
                background: white;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: modalSlideUp 0.3s ease;
            }

            .modal-helper-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid #e0e0e0;
                background: linear-gradient(135deg, #2d7c5b, #1a5c4a);
                color: white;
                border-radius: 12px 12px 0 0;
            }

            .modal-helper-header h3 {
                margin: 0;
                font-size: 1.3em;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .modal-helper-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.2em;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: background 0.3s ease;
            }

            .modal-helper-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .modal-helper-body {
                padding: 24px;
            }

            .modal-helper-content {
                line-height: 1.6;
                color: #333;
                white-space: pre-line;
            }

            .modal-helper-footer {
                padding: 16px 24px;
                border-top: 1px solid #e0e0e0;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                background: #f8f9fa;
                border-radius: 0 0 12px 12px;
            }

            .modal-helper-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 80px;
            }

            .modal-helper-btn-primary {
                background: #2d7c5b;
                color: white;
            }

            .modal-helper-btn-primary:hover {
                background: #1a5c4a;
                transform: translateY(-1px);
            }

            .modal-helper-btn-secondary {
                background: #6c757d;
                color: white;
            }

            .modal-helper-btn-secondary:hover {
                background: #545b62;
                transform: translateY(-1px);
            }

            .modal-helper-icon {
                font-size: 1.2em;
                margin-right: 8px;
            }

            @keyframes modalFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes modalSlideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            @media (max-width: 768px) {
                .modal-helper-modal {
                    width: 95%;
                    margin: 20px;
                }
                
                .modal-helper-body {
                    padding: 16px;
                }
                
                .modal-helper-footer {
                    padding: 12px 16px;
                    flex-direction: column;
                }
                
                .modal-helper-btn {
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    }

    /**
     * Show a simple alert modal (replaces alert())
     * @param {string} message - Message to display
     * @param {string} title - Modal title (optional)
     * @param {string} type - Modal type: info, success, warning, error
     */
    alert(message, title = 'Information', type = 'info') {
        return new Promise((resolve) => {
            const modalId = `modal-${++this.modalCount}`;
            
            const icons = {
                info: 'fa-info-circle',
                success: 'fa-check-circle',
                warning: 'fa-exclamation-triangle',
                error: 'fa-times-circle'
            };

            const modalContent = `
                <div class="modal-helper-modal" id="${modalId}">
                    <div class="modal-helper-header">
                        <h3>
                            <i class="fas ${icons[type]} modal-helper-icon"></i>
                            ${title}
                        </h3>
                        <button class="modal-helper-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-helper-body">
                        <div class="modal-helper-content">${message}</div>
                    </div>
                    <div class="modal-helper-footer">
                        <button class="modal-helper-btn modal-helper-btn-primary">
                            OK
                        </button>
                    </div>
                </div>
            `;

            this.showModal(modalContent, resolve);
        });
    }

    /**
     * Show a confirm modal (replaces confirm())
     * @param {string} message - Message to display
     * @param {string} title - Modal title (optional)
     * @returns {Promise<boolean>} - True if confirmed, false if cancelled
     */
    confirm(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            const modalId = `modal-${++this.modalCount}`;
            
            const modalContent = `
                <div class="modal-helper-modal" id="${modalId}">
                    <div class="modal-helper-header">
                        <h3>
                            <i class="fas fa-question-circle modal-helper-icon"></i>
                            ${title}
                        </h3>
                        <button class="modal-helper-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-helper-body">
                        <div class="modal-helper-content">${message}</div>
                    </div>
                    <div class="modal-helper-footer">
                        <button class="modal-helper-btn modal-helper-btn-secondary">
                            Cancel
                        </button>
                        <button class="modal-helper-btn modal-helper-btn-primary">
                            Confirm
                        </button>
                    </div>
                </div>
            `;

            this.showModal(modalContent, resolve);
        });
    }

    /**
     * Show a prompt modal (replaces prompt())
     * @param {string} message - Message to display
     * @param {string} defaultValue - Default value for input
     * @param {string} title - Modal title (optional)
     * @returns {Promise<string|null>} - User input or null if cancelled
     */
    prompt(message, defaultValue = '', title = 'Input Required') {
        return new Promise((resolve) => {
            const modalId = `modal-${++this.modalCount}`;
            
            const modalContent = `
                <div class="modal-helper-modal" id="${modalId}">
                    <div class="modal-helper-header">
                        <h3>
                            <i class="fas fa-edit modal-helper-icon"></i>
                            ${title}
                        </h3>
                        <button class="modal-helper-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-helper-body">
                        <div class="modal-helper-content">${message}</div>
                        <input type="text" id="${modalId}-input" class="modal-helper-input" value="${defaultValue}" 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-top: 16px; font-size: 14px;">
                    </div>
                    <div class="modal-helper-footer">
                        <button class="modal-helper-btn modal-helper-btn-secondary">
                            Cancel
                        </button>
                        <button class="modal-helper-btn modal-helper-btn-primary" data-action="prompt">
                            OK
                        </button>
                    </div>
                </div>
            `;

            this.showModal(modalContent, resolve);

            // Focus input after modal is shown
            setTimeout(() => {
                const input = document.getElementById(`${modalId}-input`);
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 100);
        });
    }

    /**
     * Show a custom modal
     * @param {string} content - HTML content for modal
     * @param {Function} callback - Callback function when modal closes
     */
    custom(content, callback) {
        const modalId = `modal-${++this.modalCount}`;
        
        const modalContent = `
            <div class="modal-helper-modal" id="${modalId}">
                ${content}
            </div>
        `;

        this.showModal(modalContent, callback);
    }

    showModal(content, callback) {
        try {
            const overlay = document.createElement('div');
            overlay.className = 'modal-helper-overlay';
            overlay.innerHTML = content;
            document.body.appendChild(overlay);

            // Generate unique ID for this callback
            const callbackId = `callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.callbacks[callbackId] = callback;
            
            // Store just the callback ID in dataset
            overlay.dataset.callbackId = callbackId;
            
            // Find the modal and add event listeners programmatically
            const modal = overlay.querySelector('.modal-helper-modal');
            if (modal) {
                const modalId = modal.id;
                
                // Add close button listener
                const closeBtn = modal.querySelector('.modal-helper-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.closeModal(modalId, false);
                    });
                }
                
                // Add button listeners for confirm dialogs
                const primaryBtn = modal.querySelector('.modal-helper-btn-primary');
                if (primaryBtn) {
                    primaryBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        // Check if this is a prompt dialog
                        if (primaryBtn.dataset.action === 'prompt') {
                            this.handlePrompt(modalId);
                        } else {
                            // For confirm dialogs, return true; for alerts, return null
                            const isConfirm = modal.querySelector('.modal-helper-btn-secondary') !== null;
                            this.closeModal(modalId, isConfirm ? true : null);
                        }
                    });
                }
                
                // Add secondary button listener for confirm dialogs
                const secondaryBtn = modal.querySelector('.modal-helper-btn-secondary');
                if (secondaryBtn) {
                    secondaryBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.closeModal(modalId, false);
                    });
                }
                
                // Add overlay click listener
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        this.closeModal(modalId, null);
                    }
                });
            }
            
            // Ensure modalHelper is globally available for any remaining inline handlers
            if (!window.modalHelper) {
                window.modalHelper = this;
            }
        } catch (error) {
            console.error('Error showing modal:', error);
            // Fallback: execute callback with null to prevent hanging
            if (callback) {
                callback(null);
            }
        }
    }

    closeModal(modalId, result = null) {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                const overlay = modal.closest('.modal-helper-overlay');
                
                // Add fade out animation
                overlay.style.animation = 'modalFadeIn 0.3s ease reverse';
                
                setTimeout(() => {
                    // Get callback ID and execute callback from memory
                    const callbackId = overlay.dataset.callbackId;
                    const callback = this.callbacks[callbackId];
                    
                    if (callback) {
                        try {
                            callback(result);
                        } catch (error) {
                            console.error('Modal callback error:', error);
                        }
                        // Clean up callback
                        delete this.callbacks[callbackId];
                    }
                    
                    overlay.remove();
                }, 300);
            } else {
                console.warn('Modal not found:', modalId);
                // Try to find and clean up any hanging callbacks
                this.cleanupOldCallbacks();
            }
        } catch (error) {
            console.error('Error closing modal:', error);
            // Try to clean up anyway
            this.cleanupOldCallbacks();
        }
    }
    
    cleanupOldCallbacks() {
        // Clean up callbacks for modals that no longer exist
        Object.keys(this.callbacks).forEach(callbackId => {
            const modalId = callbackId.replace(/^callback_.*?_(.+)$/, '$1');
            if (!document.getElementById(modalId)) {
                delete this.callbacks[callbackId];
            }
        });
    }

    handlePrompt(modalId) {
        const input = document.getElementById(`${modalId}-input`);
        const value = input ? input.value : '';
        this.closeModal(modalId, value);
    }
}

// Create singleton instance and make it globally available immediately
const modalHelper = new ModalHelper();

// Ensure global availability immediately (before any DOM operations)
if (typeof window !== 'undefined') {
    window.modalHelper = modalHelper;
}

// Export for module usage
export default modalHelper;
