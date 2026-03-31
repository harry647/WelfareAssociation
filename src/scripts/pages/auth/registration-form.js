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
        console.log('RegistrationForm init called');
        console.log('Form element:', this.form);
        if (this.form) {
            console.log('Form found, binding events');
            this.bindEvents();
            this.setupFieldValidation();
            this.generatePassword(); // Generate password on page load
        } else {
            console.error('Form element not found! Looking for .registration-form');
            console.log('All forms on page:', document.querySelectorAll('form'));
        }
    }

    // Generate a secure random password
    generatePassword() {
        const passwordDisplay = document.getElementById('password-display');
        if (!passwordDisplay) return;

        // Character sets for password generation
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let password = '';
        // Ensure at least one character from each set
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];

        // Fill remaining characters (total 12 characters)
        const allChars = lowercase + uppercase + numbers + special;
        for (let i = 4; i < 12; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle the password characters
        password = password.split('').sort(() => Math.random() - 0.5).join('');

        passwordDisplay.value = password;
    }

    bindEvents() {
        // Copy password button
        const copyBtn = document.getElementById('copy-password-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const passwordDisplay = document.getElementById('password-display');
                if (passwordDisplay && passwordDisplay.value) {
                    navigator.clipboard.writeText(passwordDisplay.value).then(() => {
                        this.showNotification('Password copied to clipboard!', 'success');
                        copyBtn.classList.add('copied');
                        setTimeout(() => copyBtn.classList.remove('copied'), 2000);
                    }).catch(err => {
                        console.error('Failed to copy:', err);
                    });
                }
            });
        }

        // Regenerate password button
        const regenerateBtn = document.getElementById('regenerate-password-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                this.generatePassword();
                this.showNotification('New password generated!', 'info');
            });
        }

        // Form submission - use submit event on form
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Form submit event triggered');
                this.handleSubmit();
            });
        } else {
            console.error('Form not found!');
        }

        // Also add click handler directly to submit button as backup
        const submitBtn = this.form?.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                console.log('Submit button clicked');
            });
        }

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
        // Phone number formatting - converts any format to +254XXXXXXXXX
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                // Handle various input formats and convert to 254XXXXXXXXX
                if (value.length > 0) {
                    if (value.startsWith('+')) {
                        value = value.substring(1);
                    }
                    
                    if (value.startsWith('254')) {
                        // Already has country code
                    } else if (value.startsWith('0')) {
                        value = '254' + value.substring(1);
                    } else if (value.startsWith('7') || value.startsWith('1')) {
                        value = '254' + value;
                    } else if (value.length >= 3) {
                        const mobileMatch = value.match(/[7-9]\d{8,9}/);
                        if (mobileMatch) {
                            value = '254' + mobileMatch[0];
                        }
                    }
                }
                
                if (value.length > 12) {
                    value = value.substring(0, 12);
                }
                
                e.target.value = value;
            });
        }

        // Emergency phone formatting - converts any format to +254XXXXXXXXX
        const emergencyPhoneInput = document.getElementById('emergency-phone');
        if (emergencyPhoneInput) {
            emergencyPhoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                // Handle various input formats and convert to 254XXXXXXXXX
                if (value.length > 0) {
                    if (value.startsWith('+')) {
                        value = value.substring(1);
                    }
                    
                    if (value.startsWith('254')) {
                        // Already has country code
                    } else if (value.startsWith('0')) {
                        value = '254' + value.substring(1);
                    } else if (value.startsWith('7') || value.startsWith('1')) {
                        value = '254' + value;
                    } else if (value.length >= 3) {
                        const mobileMatch = value.match(/[7-9]\d{8,9}/);
                        if (mobileMatch) {
                            value = '254' + mobileMatch[0];
                        }
                    }
                }
                
                if (value.length > 12) {
                    value = value.substring(0, 12);
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

        // Security answer validation
        if (name === 'security-answer' && value) {
            if (value.length < 3) {
                isValid = false;
                errorMessage = 'Answer must be at least 3 characters';
            }
        }

        // Security answer confirmation validation
        if (name === 'security-answer-confirm' && value) {
            const originalAnswer = document.getElementById('security-answer');
            if (originalAnswer && originalAnswer.value !== value) {
                isValid = false;
                errorMessage = 'Answers do not match';
            }
        }

        // Security question validation
        if (name === 'security-question' && !value) {
            isValid = false;
            errorMessage = 'Please select a security question';
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
        console.log('handleSubmit called');
        
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
        const passwordDisplay = document.getElementById('password-display');
        const registrationData = {
            firstName: formData.get('first-name'),
            lastName: formData.get('last-name'),
            email: formData.get('email'),
            password: passwordDisplay ? passwordDisplay.value : '',
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
            newsletter: formData.get('updates') === 'on',
            // Security question for password recovery
            securityQuestion: formData.get('security-question'),
            securityAnswer: formData.get('security-answer')
        };

        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;

        console.log('Starting registration process for:', registrationData.email);

        try {
            // Get the generated password before form reset
            const generatedPassword = document.getElementById('password-display').value;
            
            // Get the form action URL
            const formAction = this.form.getAttribute('action') || 'https://httpbin.org/post';
            
            // First, submit to external endpoint
            const response = await fetch(formAction, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Now try to register in database
            let dbRegistrationSuccess = false;
            let dbErrorMessage = '';
            let dbResult = null;
            try {
                const dbResponse = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: registrationData.email,
                        password: generatedPassword,
                        firstName: registrationData.firstName,
                        lastName: registrationData.lastName,
                        phone: registrationData.phone,
                        securityQuestion: registrationData.securityQuestion,
                        securityAnswer: registrationData.securityAnswer
                    })
                });
                
                if (dbResponse.ok) {
                    dbResult = await dbResponse.json();
                    console.log('Database registration:', dbResult);
                    dbRegistrationSuccess = true;
                } else {
                    const dbError = await dbResponse.json();
                    console.warn('Database registration failed:', dbError);
                    dbErrorMessage = dbError.message || 'Unknown error';
                }
            } catch (e) {
                console.warn('Could not register in database:', e);
                dbErrorMessage = e.message;
            }
            
            const result = await response.json();
            
            // Check database registration status and show appropriate feedback
            if (dbRegistrationSuccess) {
                // Show success message
                this.showSuccess(`Registration successful! Your generated password is: <strong>${generatedPassword}</strong>. Please save this password - you will need it to log in. Redirecting to member portal...`);
                
                // Use the JWT token from the backend response instead of creating a fake token
                if (dbResult.token) {
                    localStorage.setItem('swa_auth_token', dbResult.token);
                }
                if (dbResult.refreshToken) {
                    localStorage.setItem('swa_refresh_token', dbResult.refreshToken);
                }
                localStorage.setItem('swa_user', JSON.stringify({
                    email: registrationData.email,
                    firstName: registrationData.firstName,
                    lastName: registrationData.lastName,
                    memberNumber: registrationData.studentId
                }));
                
                // Store registration data for demo
                localStorage.setItem('swa_registration', JSON.stringify(registrationData));
                
                // Store the password for display during redirect delay
                localStorage.setItem('swa_temp_password', generatedPassword);
                
                // Reset form
                this.form.reset();

                // Redirect after delay
                setTimeout(() => {
                    localStorage.removeItem('swa_temp_password');
                    window.location.href = '/pages/dashboard/member/member-portal.html';
                }, 3000);
            } else {
                // Database registration failed - show error with details
                const errorMsg = dbErrorMessage ? `: ${dbErrorMessage}` : '';
                this.showError(`Registration was submitted but there was an issue creating your account in our system${errorMsg}. Please contact support at swateam@gmail.com or try again later.`);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Registration failed. Please check your internet connection and try again.');
            console.error('Registration error:', error);
        } finally {
            console.log('Finally block - re-enabling button');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    getAlertContainer() {
        let container = document.querySelector('.registration-page__container');
        if (!container) {
            container = document.querySelector('.registration-page');
        }
        if (!container) {
            container = document.querySelector('.registration-form-section');
        }
        return container;
    }

    showError(message) {
        this.removeAlerts();
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-error';
        alertDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        alertDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; padding: 15px 30px; border-radius: 8px; font-weight: 500; text-align: center; background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        
        document.body.appendChild(alertDiv);

        setTimeout(() => this.removeAlerts(), 5000);
    }

    showSuccess(message) {
        this.removeAlerts();
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        alertDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; padding: 15px 30px; border-radius: 8px; font-weight: 500; text-align: center; background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        
        document.body.appendChild(alertDiv);
    }

    showNotification(message, type = 'info') {
        this.removeAlerts();
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'success' ? 'fa-check-circle' : type === 'info' ? 'fa-info-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        alertDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; padding: 15px 30px; border-radius: 8px; font-weight: 500; text-align: center; background: #DBEAFE; color: #1E40AF; border: 1px solid #BFDBFE; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        
        document.body.appendChild(alertDiv);

        setTimeout(() => this.removeAlerts(), 3000);
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
