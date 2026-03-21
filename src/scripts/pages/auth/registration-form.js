/**
 * Registration Form Script
 * Handles registration form validation and submission
 * 
 * @version 1.0.0
 */

class RegistrationForm {
    constructor() {
        this.form = document.querySelector('.registration-form');
        this.init();
    }

    init() {
        if (this.form) {
            this.bindEvents();
            this.setupFieldValidation();
        }
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Reset button
        const resetBtn = this.form.querySelector('button[type="reset"]');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                if (!confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
                    e.preventDefault();
                }
            });
        }

        // Real-time validation on blur
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    setupFieldValidation() {
        // Phone number formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^\d+]/g, '');
                if (!value.startsWith('+')) {
                    value = '+254' + value.replace(/^\+?254/, '').replace(/^0/, '');
                }
                e.target.value = value;
            });
        }

        // Emergency phone formatting
        const emergencyPhoneInput = document.getElementById('emergency-phone');
        if (emergencyPhoneInput) {
            emergencyPhoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^\d+]/g, '');
                if (!value.startsWith('+')) {
                    value = '+254' + value.replace(/^\+?254/, '').replace(/^0/, '');
                }
                e.target.value = value;
            });
        }

        // Student ID formatting
        const studentIdInput = document.getElementById('student-id');
        if (studentIdInput) {
            studentIdInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }

        // Set max date for DOB (must be at least 16 years old)
        const dobInput = document.getElementById('dob');
        if (dobInput) {
            const today = new Date();
            const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
            dobInput.max = maxDate.toISOString().split('T')[0];
        }
    }

    validateField(input) {
        const name = input.name;
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (input.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Email validation
        if (name === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            // Check for student email
            if (!value.endsWith('@student.joust.ac.ke') && !value.endsWith('@joust.ac.ke')) {
                // Warn but don't block
                console.warn('Consider using your JOOUST student email for faster verification');
            }
        }

        // Phone validation
        if ((name === 'phone' || name === 'emergency-phone') && value) {
            const phoneRegex = /^\+254[7-9]\d{8}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid Kenyan phone number (e.g., +254712345678)';
            }
        }

        // Student ID validation
        if (name === 'student-id' && value) {
            const idRegex = /^(JOO|JOOUST|\d{2})\/?\d{4}\/\d{3}$/i;
            if (!idRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid student ID (e.g., JOO/2024/001)';
            }
        }

        // Terms validation
        if (name === 'terms' && !input.checked) {
            isValid = false;
            errorMessage = 'You must agree to the terms and conditions';
        }

        // Privacy validation
        if (name === 'privacy' && !input.checked) {
            isValid = false;
            errorMessage = 'You must consent to data processing';
        }

        // Show/hide error
        if (!isValid) {
            this.showFieldError(input, errorMessage);
        } else {
            this.clearFieldError(input);
        }

        return isValid;
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        input.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        input.parentElement.appendChild(errorDiv);
    }

    clearFieldError(input) {
        input.classList.remove('error');
        const errorDiv = input.parentElement.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    async handleSubmit() {
        // Validate all fields
        const inputs = this.form.querySelectorAll('input, select, textarea');
        let allValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                allValid = false;
            }
        });

        if (!allValid) {
            this.showError('Please fix the errors in the form before submitting.');
            return;
        }

        // Collect form data
        const formData = new FormData(this.form);
        const registrationData = {
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
            leadership: formData.get('leadership'),
            meetingDays: formData.getAll('meeting-day'),
            howHeard: formData.get('how-heard'),
            additionalInfo: formData.get('additional-info'),
            termsAccepted: formData.get('terms') === 'on',
            privacyConsent: formData.get('privacy') === 'on',
            newsletter: formData.get('updates') === 'on'
        };

        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Show success
            this.showSuccess('Registration submitted successfully! Welcome to SWA!');
            
            // Store registration data for demo
            localStorage.setItem('swa_registration', JSON.stringify(registrationData));
            
            // Reset form
            this.form.reset();

            // Redirect after delay
            setTimeout(() => {
                window.location.href = '../dashboard/member-portal.html';
            }, 2000);

        } catch (error) {
            this.showError('Registration failed. Please try again.');
            console.error('Registration error:', error);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    showError(message) {
        this.removeAlerts();
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-error';
        alertDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        const container = document.querySelector('.registration-container');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
        }

        setTimeout(() => this.removeAlerts(), 5000);
    }

    showSuccess(message) {
        this.removeAlerts();
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        const container = document.querySelector('.registration-container');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
        }
    }

    removeAlerts() {
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RegistrationForm();
});

// Export for module use
export default RegistrationForm;
