import { showAlert } from '../../../utils/utility-functions.js';
import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';
import { memberService } from '../../../services/member-service.js';
import { apiService } from '../../../services/api-service.js';

/**
 * Add Officer Script
 * Handles adding new executive officers
 * 
 * @version 1.0.0
 */

class AddOfficer {
    constructor() {
        this.members = [];
        this.selectedMember = null;
        this.generatedPassword = '';
        this.rolePermissions = {
            admin: [
                'Full system administration',
                'User management and permissions',
                'Financial oversight and approvals',
                'Report generation and analytics',
                'System configuration',
                'Member data management'
            ],
            executive: [
                'View member information',
                'Manage events and activities',
                'Access financial reports',
                'Communicate with members',
                'Manage committees',
                'Generate basic reports'
            ]
        };
        this.init();
    }

    init() {
        this.initSidebar();
        this.loadMembers();
        this.initEventListeners();
    }

    initSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.toggle('active');
                }
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
                this.handleSubmit(e);
            });
        }

        // Member selection change
        const memberSelect = document.getElementById('memberSelect');
        if (memberSelect) {
            memberSelect.addEventListener('change', (e) => {
                this.handleMemberSelection(e.target.value);
            });
        }

        // Position change for role access
        const positionSelect = document.getElementById('position');
        if (positionSelect) {
            positionSelect.addEventListener('change', (e) => {
                this.updateRoleAccess();
            });
        }

        // Password generation button
        const generatePasswordBtn = document.getElementById('generatePasswordBtn');
        if (generatePasswordBtn) {
            generatePasswordBtn.addEventListener('click', () => {
                this.generatePassword();
            });
        }

        // Copy password button
        const copyPasswordBtn = document.getElementById('copyPasswordBtn');
        if (copyPasswordBtn) {
            copyPasswordBtn.addEventListener('click', () => {
                this.copyPassword();
            });
        }

        // Toggle password visibility button
        const togglePasswordBtn = document.getElementById('togglePasswordBtn');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
        }

        // Logout button
        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadMembers() {
        const memberSelect = document.getElementById('memberSelect');
        
        try {
            console.log('Loading members...');
            const response = await memberService.getMemberList();
            console.log('API Response:', response);
            
            if (response.success && response.data) {
                this.members = response.data;
                console.log('Members loaded:', this.members);
                this.populateMemberDropdown();
            } else {
                console.log('No members found or invalid response:', response);
                memberSelect.innerHTML = '<option value="">No members found</option>';
                showAlert('No members found in the database', 'Information', 'warning');
            }
        } catch (error) {
            console.error('Error loading members:', error);
            memberSelect.innerHTML = '<option value="">Error loading members</option>';
            showAlert('Failed to load members. Please try again.', 'Information', 'error');
        }
    }

    populateMemberDropdown() {
        const memberSelect = document.getElementById('memberSelect');
        
        // Clear existing options
        memberSelect.innerHTML = '<option value="">Select a member...</option>';
        
        console.log('Populating dropdown with members:', this.members);
        
        // Add members to dropdown
        this.members.forEach((member, index) => {
            console.log(`Member ${index}:`, member);
            const option = document.createElement('option');
            option.value = member.id;
            
            // Handle undefined fields gracefully - use memberNumber instead of studentId
            const firstName = member.firstName || 'Unknown';
            const lastName = member.lastName || 'Unknown';
            const studentId = member.memberNumber || member.email || 'No ID';
            
            option.textContent = `${firstName} ${lastName} - ${studentId}`;
            memberSelect.appendChild(option);
        });
        
        console.log('Dropdown populated with', this.members.length, 'members');
    }

    handleMemberSelection(memberId) {
        const memberSummary = document.getElementById('memberSummary');
        
        if (!memberId) {
            this.selectedMember = null;
            memberSummary.style.display = 'none';
            return;
        }

        // Find selected member
        this.selectedMember = this.members.find(member => member.id == memberId);
        
        if (this.selectedMember) {
            this.showMemberSummary();
            memberSummary.style.display = 'block';
        } else {
            memberSummary.style.display = 'none';
        }
    }

    showMemberSummary() {
        if (!this.selectedMember) {
            console.log('No selected member to show summary');
            return;
        }
        
        console.log('Showing summary for member:', this.selectedMember);
        
        // Update summary with basic member info
        document.getElementById('summaryMemberName').textContent = 
            `${this.selectedMember.firstName} ${this.selectedMember.lastName}`;
        document.getElementById('summaryMemberEmail').textContent = this.selectedMember.email;
        document.getElementById('summaryMemberId').textContent = this.selectedMember.memberNumber;
        
        // Update status badge based on data completeness
        const statusBadge = document.getElementById('memberDataStatus');
        const hasAdditionalData = this.hasAdditionalMemberData();
        
        if (hasAdditionalData.complete) {
            statusBadge.innerHTML = `
                <i class="fas fa-check-circle"></i>
                Complete member profile
            `;
            statusBadge.style.background = 'rgba(16, 185, 129, 0.1)';
            statusBadge.style.borderColor = '#10b981';
            statusBadge.style.color = '#059669';
        } else if (hasAdditionalData.partial) {
            statusBadge.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                Partial member profile
            `;
            statusBadge.style.background = 'rgba(245, 158, 11, 0.1)';
            statusBadge.style.borderColor = '#f59e0b';
            statusBadge.style.color = '#d97706';
        } else {
            statusBadge.innerHTML = `
                <i class="fas fa-info-circle"></i>
                Basic member info available
            `;
            statusBadge.style.background = 'rgba(34, 197, 94, 0.1)';
            statusBadge.style.borderColor = '#22c55e';
            statusBadge.style.color = '#166534';
        }
        
        console.log('Member summary displayed successfully');
    }

    hasAdditionalMemberData() {
        if (!this.selectedMember) return { complete: false, partial: false };
        
        const hasPhone = this.selectedMember.phone && this.selectedMember.phone.trim() !== '';
        const hasGender = this.selectedMember.gender && this.selectedMember.gender !== 'other';
        const hasCourse = this.selectedMember.course || this.selectedMember.institution?.course;
        const hasYear = this.selectedMember.yearOfStudy || this.selectedMember.institution?.yearOfStudy;
        const hasEmergency = this.selectedMember.emergencyName || 
                           this.selectedMember.emergencyContact?.name;
        
        const additionalFields = [hasPhone, hasGender, hasCourse, hasYear, hasEmergency];
        const filledFields = additionalFields.filter(Boolean).length;
        
        return {
            complete: filledFields >= 4,
            partial: filledFields >= 1 && filledFields < 4,
            filledFields: filledFields,
            totalFields: additionalFields.length
        };
    }

    async handleSubmit(e) {
        const form = e.target;
        const formData = new FormData(form);
        
        // Validate member selection
        if (!this.selectedMember) {
            showAlert('Please select a member first', 'Information', 'warning');
            return;
        }
        
        // Validate password generation
        if (!this.generatedPassword) {
            showAlert('Please generate a password for the executive account', 'Information', 'warning');
            return;
        }
        
        const positionSelect = document.getElementById('position');
        const selectedOption = positionSelect.options[positionSelect.selectedIndex];
        const role = selectedOption.getAttribute('data-role');
        
        // Get member data directly from selected member (no form fields needed)
        const memberData = {
            firstName: this.selectedMember.firstName,
            lastName: this.selectedMember.lastName,
            email: this.selectedMember.email,
            phone: this.selectedMember.phone || 'Not provided',
            studentId: this.selectedMember.memberNumber,
            gender: this.selectedMember.gender || 'Not specified',
            course: this.selectedMember.course || 
                   this.selectedMember.institution?.course || 
                   'Not specified',
            yearOfStudy: this.selectedMember.yearOfStudy || 
                        this.selectedMember.institution?.yearOfStudy || 
                        'Not specified',
            emergencyName: this.selectedMember.emergencyName || 
                           this.selectedMember.emergencyContact?.name || 
                           'Not provided',
            emergencyPhone: this.selectedMember.emergencyPhone || 
                             this.selectedMember.emergencyContact?.phone || 
                             'Not provided',
            emergencyRelationship: this.selectedMember.emergencyRelationship || 
                                  this.selectedMember.emergencyContact?.relationship || 
                                  'Not provided'
        };
        
        const officerData = {
            memberId: this.selectedMember.id,
            memberData: memberData,
            position: formData.get('position'),
            role: role,
            department: formData.get('department'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate') || null,
            
            // Account creation data
            accountData: {
                email: memberData.email,
                password: this.generatedPassword,
                role: role,
                accountStatus: formData.get('accountStatus'),
                forcePasswordChange: formData.get('forcePasswordChange') === 'on'
            },
            
            // Notification settings
            notifications: {
                sendWelcomeEmail: formData.get('sendWelcomeEmail') === 'on',
                sendSMSNotification: formData.get('sendSMSNotification') === 'on',
                addToDirectory: formData.get('addToDirectory') === 'on',
                requireTraining: formData.get('requireTraining') === 'on'
            }
        };

        // Validate required fields
        if (!officerData.position || !officerData.startDate) {
            showAlert('Please fill in all required fields', 'Information', 'warning');
            return;
        }

        // Validate member data is present (only essential fields required)
        if (!memberData.firstName || !memberData.lastName || !memberData.email) {
            showAlert('Selected member has incomplete essential information (name or email missing). Please contact admin to update member records.', 'Information', 'warning');
            return;
        }

        // Log what data we have for debugging
        console.log('Member data for officer creation:', {
            essential: {
                firstName: memberData.firstName,
                lastName: memberData.lastName,
                email: memberData.email,
                studentId: memberData.studentId
            },
            optional: {
                phone: memberData.phone,
                gender: memberData.gender,
                course: memberData.course,
                yearOfStudy: memberData.yearOfStudy,
                emergencyName: memberData.emergencyName,
                emergencyPhone: memberData.emergencyPhone,
                emergencyRelationship: memberData.emergencyRelationship
            }
        });

        try {
            // Log the request data before sending
            console.log('🔍 DEBUG: About to send officer data:', officerData);
            console.log('🔍 DEBUG: Member data being sent:', memberData);
            
            // Call API to create officer account
            const response = await apiService.post('/officers/create-account', officerData, true);
            
            if (response.success) {
                const successMessage = `
                    ${memberData.firstName} ${memberData.lastName} has been successfully appointed as ${officerData.position}!
                    
Account Credentials:
                    Email: ${memberData.email}
                    Password: ${this.generatedPassword}
                    
Role: ${role.charAt(0).toUpperCase() + role.slice(1)}
                    Access Level: ${role === 'admin' ? 'Full Administrative Access' : 'Executive Access'}
                `;
                
                await showAlert(
                    successMessage, 
                    'Officer Account Created Successfully', 
                    'success'
                );
                
                // Reset form after successful submission
                this.resetForm();
            } else {
                showAlert(response.message || 'Failed to create officer account. Please try again.', 'Information', 'error');
            }
        } catch (error) {
            console.error('❌ Error creating officer account:', error);
            console.error('❌ Full error details:', {
                message: error.message,
                status: error.status,
                code: error.code,
                data: error.data // This should contain the server error response
            });
            
            // Try to get more error details if available
            if (error.data) {
                console.error('❌ Server error response:', error.data);
            }
            
            showAlert(
                error.message || 'Failed to create officer account. Please try again.', 
                'Information', 
                'error'
            );
        }
    }

    resetForm() {
        const form = document.getElementById('addOfficerForm');
        form.reset();
        this.selectedMember = null;
        this.generatedPassword = '';
        
        // Hide member summary and role access info
        document.getElementById('memberSummary').style.display = 'none';
        document.getElementById('roleAccessInfo').style.display = 'none';
        document.getElementById('passwordDisplay').style.display = 'none';
        
        // Reset member select
        document.getElementById('memberSelect').value = '';
    }

    updateRoleAccess() {
        const positionSelect = document.getElementById('position');
        const selectedOption = positionSelect.options[positionSelect.selectedIndex];
        const role = selectedOption.getAttribute('data-role');
        const roleAccessInfo = document.getElementById('roleAccessInfo');
        
        if (!role) {
            roleAccessInfo.style.display = 'none';
            return;
        }
        
        // Update role display
        document.getElementById('roleName').textContent = role.charAt(0).toUpperCase() + role.slice(1);
        
        // Update permissions list
        const permissionsList = document.getElementById('permissionsList');
        permissionsList.innerHTML = '';
        
        this.rolePermissions[role].forEach(permission => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check-circle"></i> ${permission}`;
            permissionsList.appendChild(li);
        });
        
        // Update role badge styling
        const roleBadge = document.getElementById('roleBadge');
        roleBadge.className = `role-badge ${role}`;
        
        // Show role access info
        roleAccessInfo.style.display = 'block';
    }

    generatePassword() {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        
        // Ensure at least one character from each category
        password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
        password += '0123456789'[Math.floor(Math.random() * 10)];
        password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
        
        // Fill the rest
        for (let i = 4; i < length; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }
        
        // Shuffle the password
        this.generatedPassword = password.split('').sort(() => Math.random() - 0.5).join('');
        
        // Display the password
        const passwordDisplay = document.getElementById('passwordDisplay');
        const passwordInput = document.getElementById('generatedPassword');
        
        passwordDisplay.style.display = 'block';
        passwordInput.value = this.generatedPassword;
        passwordInput.type = 'password'; // Initially hidden
        
        // Update toggle icon
        document.getElementById('passwordToggleIcon').className = 'fas fa-eye';
        
        showAlert('Password generated successfully! Save it securely.', 'Success', 'success');
    }

    copyPassword() {
        const passwordInput = document.getElementById('generatedPassword');
        
        if (!this.generatedPassword) {
            showAlert('No password to copy', 'Information', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(this.generatedPassword).then(() => {
            showAlert('Password copied to clipboard!', 'Success', 'success');
        }).catch(() => {
            // Fallback for older browsers
            passwordInput.select();
            document.execCommand('copy');
            showAlert('Password copied to clipboard!', 'Success', 'success');
        });
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('generatedPassword');
        const toggleIcon = document.getElementById('passwordToggleIcon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'fas fa-eye';
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AddOfficer');
    const addOfficerInstance = new AddOfficer();
    console.log('AddOfficer instance created:', addOfficerInstance);
});
