/**
 * Profile Page Script
 * Handles profile form validation, data loading, and saving
 * 
 * @version 1.0.0
 */

class ProfileManager {
    constructor() {
        this.form = document.getElementById('profile-form');
        this.storageKey = 'swa_member_profile';
        this.init();
    }

    init() {
        this.loadProfileData();
        this.bindEvents();
    }

    /**
     * Load profile data from localStorage or set defaults
     */
    loadProfileData() {
        // Try to get current logged-in user data first
        let userData = localStorage.getItem('swa_user');
        let memberData = localStorage.getItem('swa_member_data');
        
        let profileData = null;
        
        // If we have logged-in user data, use that
        if (userData) {
            const user = JSON.parse(userData);
            if (memberData) {
                const member = JSON.parse(memberData);
                // Combine user and member data
                profileData = {
                    firstName: member.member?.firstName || user.firstName,
                    lastName: member.member?.lastName || user.lastName,
                    email: member.member?.email || user.email,
                    phone: member.member?.phone || user.phone,
                    memberNumber: member.member?.memberNumber || '',
                    memberSince: member.member?.memberSince || this.getCurrentMonthYear()
                };
            } else {
                // Only user data available
                profileData = {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone || '',
                    memberNumber: '',
                    memberSince: this.getCurrentMonthYear()
                };
            }
        }
        
        // Fallback to old storage methods
        if (!profileData) {
            profileData = localStorage.getItem(this.storageKey);
            
            if (!profileData) {
                const registrationData = localStorage.getItem('swa_registration');
                if (registrationData) {
                    profileData = registrationData;
                }
            }
        }

        if (profileData) {
            const data = typeof profileData === 'string' ? JSON.parse(profileData) : profileData;
            this.populateForm(data);
            this.updateProfileSummary(data);
        } else {
            // Set default demo data for display
            const demoData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@student.joust.ac.ke',
                phone: '+254712345678',
                studentId: 'JOO/2024/001',
                dob: '2002-05-15',
                gender: 'male',
                department: 'computer-science',
                yearOfStudy: '2',
                admissionYear: '2023',
                emergencyName: 'Jane Doe',
                emergencyPhone: '+254798765432',
                emergencyRelation: 'sibling',
                memberSince: 'January 2024'
            };
            this.populateForm(demoData);
            this.updateProfileSummary(demoData);
        }

        // Set last updated date
        document.getElementById('last-updated').textContent = this.getCurrentDate();
    }

    /**
     * Populate form fields with data
     */
    populateForm(data) {
        const fieldMappings = {
            'first-name': data.firstName || data.first_name || '',
            'last-name': data.lastName || data.last_name || '',
            'email': data.email || '',
            'phone': data.phone || '',
            'student-id': data.memberNumber || data.id || data.studentId || data.student_id || '',
            'dob': data.dob || '',
            'gender': data.gender || '',
            'department': data.department || '',
            'year-of-study': data.yearOfStudy || data.year_of_study || '',
            'admission-year': data.admissionYear || data.admission_year || '',
            'emergency-name': data.emergencyName || data.emergency_name || '',
            'emergency-phone': data.emergencyPhone || data.emergency_phone || '',
            'emergency-relation': data.emergencyRelation || data.emergency_relation || ''
        };

        Object.keys(fieldMappings).forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element && fieldMappings[fieldId]) {
                element.value = fieldMappings[fieldId];
            }
        });

        // Set notification preferences
        const notifyMappings = ['notify-email', 'notify-sms', 'notify-events', 'notify-contributions', 'notify-loans'];
        notifyMappings.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) {
                element.checked = data[id];
            }
        });
    }

    /**
     * Update profile summary section
     */
    updateProfileSummary(data) {
        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Member';
        document.getElementById('display-name').textContent = fullName;
        document.getElementById('display-student-id').textContent = data.memberNumber || data.id || data.studentId || data.student_id || '-';
        
        // Set member since
        const memberSince = data.memberSince || data.member_since || this.getCurrentMonthYear();
        document.getElementById('member-since').textContent = memberSince;
    }

    /**
     * Bind form events
     */
    bindEvents() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSave();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                    window.location.href = '/pages/dashboard/member/member-portal.html';
                }
            });
        }

        // Phone number formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target, 'phone');
            });
        }

        // Emergency phone formatting
        const emergencyPhoneInput = document.getElementById('emergency-phone');
        if (emergencyPhoneInput) {
            emergencyPhoneInput.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target, 'emergency-phone');
            });
        }
    }

    /**
     * Format phone number input - converts any format to +254XXXXXXXXX
     */
    formatPhoneNumber(input, fieldName) {
        let value = input.value.replace(/\D/g, '');
        
        // Handle various input formats and convert to +254XXXXXXXXX
        if (value.length > 0) {
            // If starts with +, remove it first
            if (value.startsWith('+')) {
                value = value.substring(1);
            }
            
            // If starts with 254, keep it
            if (value.startsWith('254')) {
                // Already has country code, just keep it
            } else if (value.startsWith('0')) {
                // Remove leading 0 and add 254 (e.g., 0706256790 -> 254706256790)
                value = '254' + value.substring(1);
            } else if (value.startsWith('7') || value.startsWith('1')) {
                // Starts with 7 or 1 (Kenyan mobile), add 254
                value = '254' + value;
            } else if (value.length >= 3) {
                // For any other case, try to extract the mobile number
                const mobileMatch = value.match(/[7-9]\d{8,9}/);
                if (mobileMatch) {
                    value = '254' + mobileMatch[0];
                }
            }
        }
        
        // Limit to 12 digits (254 + 9 digits)
        if (value.length > 12) {
            value = value.substring(0, 12);
        }
        
        input.value = value;
    }

    /**
     * Handle form save
     */
    async handleSave() {
        // Collect form data
        const formData = new FormData(this.form);
        const profileData = {
            firstName: formData.get('first-name'),
            lastName: formData.get('last-name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            studentId: formData.get('student-id'),
            dob: formData.get('dob'),
            gender: formData.get('gender'),
            department: formData.get('department'),
            yearOfStudy: formData.get('year-of-study'),
            admissionYear: formData.get('admission-year'),
            emergencyName: formData.get('emergency-name'),
            emergencyPhone: formData.get('emergency-phone'),
            emergencyRelation: formData.get('emergency-relation'),
            notifyEmail: formData.get('notify-email') === 'on',
            notifySms: formData.get('notify-sms') === 'on',
            notifyEvents: formData.get('notify-events') === 'on',
            notifyContributions: formData.get('notify-contributions') === 'on',
            notifyLoans: formData.get('notify-loans') === 'on',
            lastUpdated: new Date().toISOString()
        };

        // Validate
        if (!this.validateForm(profileData)) {
            return;
        }

        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Save to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(profileData));

            // Show success
            this.showAlert('success', '<i class="fas fa-check-circle"></i> Profile updated successfully!');
            
            // Update summary
            this.updateProfileSummary(profileData);
            document.getElementById('last-updated').textContent = this.getCurrentDate();

            // Redirect after delay
            setTimeout(() => {
                window.location.href = '/pages/dashboard/member/member-portal.html';
            }, 1500);

        } catch (error) {
            this.showAlert('error', '<i class="fas fa-exclamation-circle"></i> Failed to save profile. Please try again.');
            console.error('Profile save error:', error);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * Validate form data
     */
    validateForm(data) {
        // Required fields
        const required = ['firstName', 'lastName', 'phone', 'department'];
        const missing = required.filter(field => !data[field]);

        if (missing.length > 0) {
            this.showAlert('error', '<i class="fas fa-exclamation-circle"></i> Please fill in all required fields.');
            return false;
        }

        // Phone validation
        const phoneRegex = /^\+254[7-9]\d{8}$/;
        if (!phoneRegex.test(data.phone)) {
            this.showAlert('error', '<i class="fas fa-exclamation-circle"></i> Please enter a valid phone number.');
            return false;
        }

        // Emergency phone validation (if provided)
        if (data.emergencyPhone && !phoneRegex.test(data.emergencyPhone)) {
            this.showAlert('error', '<i class="fas fa-exclamation-circle"></i> Please enter a valid emergency contact phone number.');
            return false;
        }

        return true;
    }

    /**
     * Show alert message
     */
    showAlert(type, message) {
        this.removeAlerts();
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = message;
        
        // Insert at the top of the form
        const formSection = document.querySelector('.profile-form-section');
        if (formSection) {
            formSection.insertBefore(alertDiv, formSection.firstChild);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    /**
     * Remove all alerts
     */
    removeAlerts() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => alert.remove());
    }

    /**
     * Get current date formatted
     */
    getCurrentDate() {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date().toLocaleDateString('en-US', options);
    }

    /**
     * Get current month and year
     */
    getCurrentMonthYear() {
        const options = { year: 'numeric', month: 'long' };
        return new Date().toLocaleDateString('en-US', options);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});

// Note: This script is loaded as a regular JS file, not a module
