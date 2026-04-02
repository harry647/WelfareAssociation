// Import services
import { authService, memberService } from '../../../services/index.js';
import { showNotification, formatDate } from '../../../utils/utility-functions.js';


import { showConfirm } from '../../../utils/utility-functions.js';
class MemberDetails {
    constructor() {
        this.memberId = null;
        this.member = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        this.loadMemberDetails();
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

        const editBtn = document.getElementById('editBtn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.editMember();
            });
        }

        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.deleteMember();
            });
        }

        const contributionsBtn = document.getElementById('contributionsBtn');
        if (contributionsBtn) {
            contributionsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.viewContributions();
            });
        }
    }

    getMemberIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    async loadMemberDetails() {
        const memberId = this.getMemberIdFromURL();
        
        if (!memberId) {
            this.showError('No member ID provided');
            return;
        }

        this.memberId = memberId;

        try {
            const response = await memberService.getMemberById(memberId);
            this.member = response.data || response;
            this.renderMemberDetails();
        } catch (error) {
            console.error('Failed to load member details:', error);
            // Show demo data
            this.loadDemoData();
        }
    }

    loadDemoData() {
        // Demo data for demonstration
        this.member = {
            id: this.memberId,
            memberNumber: 'SWA001',
            firstName: 'Vincent',
            lastName: 'Otieno',
            email: 'vincent@joust.ac.ke',
            phone: '+254712345678',
            dateOfBirth: '1995-06-15',
            gender: 'Male',
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
        this.renderMemberDetails();
    }

    renderMemberDetails() {
        const container = document.getElementById('memberDetails');
        if (!container) return;

        if (!this.member) {
            container.innerHTML = '<div class="error">Member not found</div>';
            return;
        }

        const statusClass = this.member.membershipStatus === 'active' ? 'received' : 
                          this.member.membershipStatus === 'pending' ? 'pending' : 'overdue';
        const statusText = this.member.membershipStatus === 'active' ? 'Active' : 
                          this.member.membershipStatus === 'pending' ? 'Pending' : 'Inactive';

        container.innerHTML = `
            <div class="member-profile">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="profile-info">
                        <h2>${this.member.firstName || ''} ${this.member.lastName || ''}</h2>
                        <p class="member-number">${this.member.memberNumber || 'N/A'}</p>
                        <span class="status ${statusClass}">${statusText}</span>
                    </div>
                </div>

                <div class="profile-sections">
                    <div class="profile-section">
                        <h3><i class="fas fa-id-card"></i> Personal Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Full Name</label>
                                <span>${this.member.firstName || ''} ${this.member.lastName || ''}</span>
                            </div>
                            <div class="info-item">
                                <label>Email</label>
                                <span>${this.member.email || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Phone</label>
                                <span>${this.member.phone || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Date of Birth</label>
                                <span>${formatDate(this.member.dateOfBirth)}</span>
                            </div>
                            <div class="info-item">
                                <label>Gender</label>
                                <span>${this.member.gender || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Address</label>
                                <span>${typeof this.member.address === 'object' ? this.member.address?.fullAddress || this.member.address?.street || JSON.stringify(this.member.address) : this.member.address || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3><i class="fas fa-users"></i> Membership Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Member Number</label>
                                <span>${this.member.memberNumber || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Membership Type</label>
                                <span>${this.member.membershipType || 'regular'}</span>
                            </div>
                            <div class="info-item">
                                <label>Join Date</label>
                                <span>${formatDate(this.member.joinDate || this.member.createdAt)}</span>
                            </div>
                            <div class="info-item">
                                <label>Status</label>
                                <span class="status ${statusClass}">${statusText}</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3><i class="fas fa-phone-alt"></i> Emergency Contact</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Name</label>
                                <span>${this.member.emergencyContact?.name || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Phone</label>
                                <span>${this.member.emergencyContact?.phone || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Relationship</label>
                                <span>${this.member.emergencyContact?.relationship || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3><i class="fas fa-user-friends"></i> Next of Kin</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Name</label>
                                <span>${this.member.nextOfKin?.name || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Phone</label>
                                <span>${this.member.nextOfKin?.phone || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Relationship</label>
                                <span>${this.member.nextOfKin?.relationship || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showError(message) {
        const container = document.getElementById('memberDetails');
        if (container) {
            container.innerHTML = `<div class="error">${message}</div>`;
        }
    }

    editMember() {
        window.location.href = '/pages/dashboard/admin/edit-member.html?id=' + this.memberId;
    }

    async deleteMember() {
        if (!await showConfirm('Are you sure you want to delete this member? This action cannot be undone.')) {
            return;
        }

        try {
            // Call API to delete the member
            await memberService.deleteMember(this.memberId);
            showNotification('Member deleted successfully!', 'success');
            setTimeout(() => {
                window.location.href = '/pages/dashboard/shared/members.html';
            }, 1500);
        } catch (error) {
            console.error('Failed to delete member:', error);
            showNotification('Failed to delete member. Please try again.', 'error');
        }
    }

    viewContributions() {
        // Navigate to contributions page with member filter
        window.location.href = '/pages/dashboard/member/member-contribution-history.html?memberId=' + this.memberId;
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
    new MemberDetails();
});