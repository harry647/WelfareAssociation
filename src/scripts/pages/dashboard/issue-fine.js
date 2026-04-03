import { showAlert } from '../../../utils/utility-functions.js';
import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';
import { fineService } from '../../../services/fine-service.js';
import { memberService } from '../../../services/member-service.js';
import { APP_CONFIG } from '../../../config/app-config.js';

/**
 * Issue Fine Script
 * Handles issuing fines to members
 * 
 * @version 1.0.0
 */

class IssueFine {
    constructor() {
        this.init();
    }

    init() {
        this.initSidebar();
        this.initEventListeners();
        this.loadMembers();
        this.loadFineTypes();
        this.setMinDate();
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
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitFine(e);
            });
        }

        const cancelBtn = document.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                window.location.href = 'fines-collection.html';
            });
        }

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Fine type change listener to auto-fill amount
        const fineTypeSelect = document.getElementById('fineType');
        const amountInput = document.getElementById('amount');
        if (fineTypeSelect && amountInput) {
            fineTypeSelect.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const defaultAmount = selectedOption.dataset.amount;
                if (defaultAmount && !amountInput.value) {
                    amountInput.value = defaultAmount;
                }
            });
        }

        // Member search functionality
        const memberSearch = document.getElementById('memberSearch');
        const memberSelect = document.getElementById('memberId');
        if (memberSearch && memberSelect) {
            memberSearch.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const options = memberSelect.options;
                
                for (let i = 0; i < options.length; i++) {
                    const option = options[i];
                    const text = option.textContent.toLowerCase();
                    const isDefaultOption = option.value === '';
                    option.style.display = isDefaultOption || text.includes(searchTerm) ? '' : 'none';
                }
            });
            
            // Add retry button if member loading fails
            memberSearch.addEventListener('dblclick', () => {
                if (memberSelect.disabled) {
                    this.loadMembers();
                }
            });
        }
    }

    async loadMembers() {
        const memberSelect = document.getElementById('memberId');
        const memberSearch = document.getElementById('memberSearch');
        
        // Show loading state
        memberSelect.innerHTML = '<option value="">Loading members...</option>';
        memberSelect.disabled = true;
        if (memberSearch) memberSearch.disabled = true;
        
        try {
            const response = await memberService.getMemberList();
            
            if (response && response.success && response.data) {
                memberSelect.innerHTML = '<option value="">Choose a member...</option>';
                
                if (response.data.length === 0) {
                    memberSelect.innerHTML = '<option value="">No active members found</option>';
                } else {
                    response.data.forEach(member => {
                        const option = document.createElement('option');
                        option.value = member.id;
                        option.textContent = `${member.firstName} ${member.lastName} (${member.memberNumber || 'N/A'})`;
                        memberSelect.appendChild(option);
                    });
                }
                
                // Enable the member select dropdown
                memberSelect.disabled = false;
                if (memberSearch) {
                    memberSearch.disabled = false;
                    memberSearch.placeholder = 'Search by name or ID...';
                    memberSearch.style.borderColor = '';
                }
            } else {
                memberSelect.innerHTML = '<option value="">Failed to load members</option>';
                showAlert('Failed to load members', 'Error', 'error');
                console.error('Member loading response:', response);
            }
        } catch (error) {
            memberSelect.innerHTML = '<option value="">Error loading members</option>';
            if (memberSearch) {
                memberSearch.placeholder = 'Double-click to retry loading members...';
                memberSearch.style.borderColor = 'var(--error-color)';
            }
            console.error('Error loading members:', error);
            showAlert('Error loading members: ' + error.message, 'Error', 'error');
        }
    }

    async loadFineTypes() {
        try {
            const fineTypes = fineService.getFineTypes();
            const fineTypeSelect = document.getElementById('fineType');
            
            fineTypeSelect.innerHTML = '<option value="">Select fine type...</option>';
            fineTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.textContent = `${type.name} - Ksh ${type.amount}`;
                option.dataset.amount = type.amount;
                fineTypeSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading fine types:', error);
        }
    }

    setMinDate() {
        const dueDateInput = document.getElementById('dueDate');
        const today = new Date().toISOString().split('T')[0];
        dueDateInput.min = today;
    }

    async submitFine(e) {
        const form = e.target;
        const formData = new FormData(form);
        
        // Get fine type details
        const fineTypeId = formData.get('fineType');
        const fineType = fineService.getFineTypeById(fineTypeId);
        
        const fineData = {
            memberId: formData.get('memberId'),
            fineType: fineType ? {
                id: fineType.id,
                name: fineType.name,
                category: fineType.category,
                code: fineType.code || fineType.name.toUpperCase().replace(/\s+/g, '_')
            } : { name: 'Other', category: 'other' },
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description'),
            dueDate: formData.get('dueDate'),
            urgency: formData.get('urgency'),
            sendEmail: formData.get('sendEmail') === 'on',
            sendSMS: formData.get('sendSMS') === 'on',
            sendReminder: formData.get('sendReminder') === 'on'
        };

        if (!fineData.memberId || !fineData.amount || !fineData.description || !fineData.dueDate) {
            showAlert('Please fill in all required fields', 'Error', 'error');
            return;
        }

        try {
            const response = await fineService.issue(fineData);
            
            if (response && response.success) {
                showAlert('Fine issued successfully!', 'Success', 'success');
                form.reset();
                // Reload members and fine types for next entry
                this.loadMembers();
                this.loadFineTypes();
                this.setMinDate();
                
                // Optionally redirect to fines collection page
                setTimeout(async () => {
                    if (await showConfirm('Would you like to view all fines?', 'Success')) {
                        window.location.href = 'fines-collection.html';
                    }
                }, 2000);
            } else {
                showAlert(response?.message || 'Failed to issue fine', 'Error', 'error');
            }
        } catch (error) {
            console.error('Error issuing fine:', error);
            showAlert('Error issuing fine: ' + error.message, 'Error', 'error');
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
}

document.addEventListener('DOMContentLoaded', () => {
    new IssueFine();
});
