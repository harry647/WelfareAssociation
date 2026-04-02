// Import services
import { authService, memberService } from '../../../services/index.js';
import { showNotification, formatDate } from '../../../utils/utility-functions.js';


import { showAlert } from '../../../utils/utility-functions.js';
import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';
class EditMember {
    constructor() {
        this.memberId = null;
        this.member = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        this.loadMemberData();
    }

    async checkAuth() {
        if (!authService.isAuthenticated()) {
            window.location.href = '/pages/auth/login-page.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        if (!user || user.role !== 'admin') {
            window.location.href = '/pages/auth/login-page.html';
            return false;
        }
        return true;
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
        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        const form = document.getElementById('editMemberForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    getMemberIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    async loadMemberData() {
        const memberId = this.getMemberIdFromURL();
        
        if (!memberId) {
            showAlert('No member ID provided', 'Information', 'info');
            window.location.href = '/pages/dashboard/shared/members.html';
            return;
        }

        this.memberId = memberId;

        try {
            const response = await memberService.getMemberById(memberId);
            this.member = response.data || response;
            this.populateForm();
        } catch (error) {
            console.error('Failed to load member data:', error);
            // Load demo data
            this.loadDemoData();
        }
    }

    loadDemoData() {
        this.member = {
            id: this.memberId,
            memberNumber: 'SWA001',
            firstName: 'Vincent',
            lastName: 'Otieno',
            email: 'vincent@joust.ac.ke',
            phone: '+254712345678',
            dateOfBirth: '1995-06-15',
            gender: 'male',
            membershipType: 'regular',
            membershipStatus: 'active',
            joinDate: '2024-01-15',
            address: '123 Campus Road, JOOUST',
            emergencyContact: {
                name: 'Mary Otieno',
                phone: '+254798765432',
                relationship: 'Mother'
            },
            nextOfKin: {
                name: 'John Otieno',
                phone: '+254712345679',
                relationship: 'Father'
            }
        };
        this.populateForm();
    }

    populateForm() {
        if (!this.member) return;

        document.getElementById('firstName').value = this.member.firstName || '';
        document.getElementById('lastName').value = this.member.lastName || '';
        document.getElementById('email').value = this.member.email || '';
        document.getElementById('phone').value = this.member.phone || '';
        document.getElementById('dateOfBirth').value = this.member.dateOfBirth ? 
            new Date(this.member.dateOfBirth).toISOString().split('T')[0] : '';
        document.getElementById('gender').value = this.member.gender || '';
        document.getElementById('address').value = 
            (typeof this.member.address === 'string' ? this.member.address : 
             this.member.address?.fullAddress || this.member.address || '');
        document.getElementById('memberNumber').value = this.member.memberNumber || '';
        document.getElementById('membershipType').value = this.member.membershipType || 'regular';
        document.getElementById('membershipStatus').value = this.member.membershipStatus || 'active';
        document.getElementById('joinDate').value = this.member.joinDate ? 
            new Date(this.member.joinDate).toISOString().split('T')[0] : '';

        // Emergency Contact
        if (this.member.emergencyContact) {
            document.getElementById('emergencyName').value = this.member.emergencyContact.name || '';
            document.getElementById('emergencyPhone').value = this.member.emergencyContact.phone || '';
            document.getElementById('emergencyRelationship').value = this.member.emergencyContact.relationship || '';
        }

        // Next of Kin
        if (this.member.nextOfKin) {
            document.getElementById('kinName').value = this.member.nextOfKin.name || '';
            document.getElementById('kinPhone').value = this.member.nextOfKin.phone || '';
            document.getElementById('kinRelationship').value = this.member.nextOfKin.relationship || '';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const addressValue = document.getElementById('address').value;
        
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            dateOfBirth: document.getElementById('dateOfBirth').value,
            gender: document.getElementById('gender').value,
            address: addressValue ? { fullAddress: addressValue } : null,
            membershipType: document.getElementById('membershipType').value,
            membershipStatus: document.getElementById('membershipStatus').value,
            emergencyContact: {
                name: document.getElementById('emergencyName').value,
                phone: document.getElementById('emergencyPhone').value,
                relationship: document.getElementById('emergencyRelationship').value
            },
            nextOfKin: {
                name: document.getElementById('kinName').value,
                phone: document.getElementById('kinPhone').value,
                relationship: document.getElementById('kinRelationship').value
            }
        };

        try {
            // Call API to update member
            await memberService.updateMember(this.memberId, formData);
            
            // Show success notification
            showNotification('Member updated successfully!', 'success');
            
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = '/pages/dashboard/admin/member-details.html?id=' + this.memberId;
            }, 1500);
        } catch (error) {
            console.error('Failed to update member:', error);
            showNotification('Failed to update member. Please try again.', 'error');
        }
    }

    async handleLogout() {
        if (await showConfirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_refresh_token');
            localStorage.removeItem('swa_user');
            window.location.href = '/index.html';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new EditMember();
});