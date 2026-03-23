/**
 * Forgot Password Page Script
 * Handles password reset with security question verification
 * 
 * @version 2.0.0
 */

class ForgotPasswordPage {
    constructor() {
        this.currentStep = 1;
        this.userEmail = '';
        this.securityQuestion = '';
        
        // DOM elements
        this.form = document.getElementById('forgot-password-form');
        this.emailInput = document.getElementById('email');
        this.securityQuestionDisplay = document.getElementById('security-question-display');
        this.securityAnswerInput = document.getElementById('security-answer');
        this.newPasswordInput = document.getElementById('new-password');
        this.confirmPasswordInput = document.getElementById('confirm-password');
        
        // Step elements
        this.step1 = document.getElementById('step-1');
        this.step2 = document.getElementById('step-2');
        this.step3 = document.getElementById('step-3');
        
        // Step indicators
        this.stepIndicator1 = document.getElementById('step-indicator-1');
        this.stepIndicator2 = document.getElementById('step-indicator-2');
        this.stepIndicator3 = document.getElementById('step-indicator-3');
        
        // Buttons
        this.verifyEmailBtn = document.getElementById('verify-email-btn');
        this.verifySecurityBtn = document.getElementById('verify-security-btn');
        this.resetPasswordBtn = document.getElementById('reset-password-btn');
        this.backToEmailBtn = document.getElementById('back-to-email');
        this.backToSecurityBtn = document.getElementById('back-to-security');
        
        // Messages
        this.successMessage = document.getElementById('success-message');
        this.errorMessage = document.getElementById('error-message');
        this.errorText = document.getElementById('error-text');
        
        // Password strength elements
        this.passwordStrengthFill = document.getElementById('password-strength-fill');
        this.passwordStrengthText = document.getElementById('password-strength-text');
        this.passwordMatchIndicator = document.getElementById('password-match-indicator');
        
        this.init();
    }

    init() {
        if (this.form) {
            this.bindEvents();
        }
    }

    bindEvents() {
        // Verify email button
        this.verifyEmailBtn?.addEventListener('click', () => this.handleEmailVerification());
        
        // Verify security answer button
        this.verifySecurityBtn?.addEventListener('click', () => this.handleSecurityVerification());
        
        // Reset password button
        this.resetPasswordBtn?.addEventListener('click', () => this.handlePasswordReset());
        
        // Back buttons
        this.backToEmailBtn?.addEventListener('click', () => this.goToStep(1));
        this.backToSecurityBtn?.addEventListener('click', () => this.goToStep(2));
        
        // Email input validation
        this.emailInput?.addEventListener('input', () => this.clearFieldError('email'));
        
        // Security answer input validation
        this.securityAnswerInput?.addEventListener('input', () => this.clearFieldError('security-answer'));
        
        // Password strength validation
        this.newPasswordInput?.addEventListener('input', () => {
            this.validatePasswordStrength();
            this.checkPasswordMatch();
        });
        
        // Password match validation
        this.confirmPasswordInput?.addEventListener('input', () => this.checkPasswordMatch());
        
        // Toggle password visibility
        this.setupPasswordToggles();
    }

    setupPasswordToggles() {
        const toggleNewPassword = document.getElementById('toggle-new-password');
        const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
        
        toggleNewPassword?.addEventListener('click', () => {
            this.togglePasswordVisibility(this.newPasswordInput, toggleNewPassword);
        });
        
        toggleConfirmPassword?.addEventListener('click', () => {
            this.togglePasswordVisibility(this.confirmPasswordInput, toggleConfirmPassword);
        });
    }

    togglePasswordVisibility(input, button) {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        
        const icon = button.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    }

    goToStep(step) {
        this.currentStep = step;
        
        // Update step visibility
        this.step1?.classList.toggle('forgot-password-form__step--active', step === 1);
        this.step2?.classList.toggle('forgot-password-form__step--active', step === 2);
        this.step3?.classList.toggle('forgot-password-form__step--active', step === 3);
        
        // Update step indicators
        this.updateStepIndicators();
        
        // Hide error/success messages
        this.hideAllMessages();
    }

    updateStepIndicators() {
        const steps = [
            { indicator: this.stepIndicator1, step: 1 },
            { indicator: this.stepIndicator2, step: 2 },
            { indicator: this.stepIndicator3, step: 3 }
        ];
        
        steps.forEach(({ indicator, step }) => {
            indicator?.classList.remove('forgot-password-card__step--active', 'forgot-password-card__step--completed');
            
            if (step < this.currentStep) {
                indicator?.classList.add('forgot-password-card__step--completed');
            } else if (step === this.currentStep) {
                indicator?.classList.add('forgot-password-card__step--active');
            }
        });
    }

    async handleEmailVerification() {
        const email = this.emailInput?.value?.trim();
        
        // Validate email
        if (!email) {
            this.showFieldError('email', 'Please enter your email address');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            return;
        }
        
        // Show loading state
        this.setLoadingState(this.verifyEmailBtn, true, '<i class="fas fa-spinner fa-spin"></i> Verifying...');
        
        try {
            // Call backend API to verify email and get security question
            const response = await this.apiVerifyEmail(email);
            
            if (response.success) {
                this.userEmail = email;
                this.securityQuestion = this.getSecurityQuestionText(response.securityQuestion);
                this.securityQuestionDisplay.value = this.securityQuestion;
                this.goToStep(2);
            } else {
                this.showFieldError('email', response.message || 'Email not found. Please check and try again.');
            }
        } catch (error) {
            console.error('Email verification error:', error);
            this.showFieldError('email', 'Failed to verify email. Please try again.');
        } finally {
            this.setLoadingState(this.verifyEmailBtn, false, '<i class="fas fa-search"></i> Verify Email');
        }
    }

    async handleSecurityVerification() {
        const answer = this.securityAnswerInput?.value?.trim();
        
        // Validate answer
        if (!answer) {
            this.showFieldError('security-answer', 'Please enter your security answer');
            return;
        }
        
        // Show loading state
        this.setLoadingState(this.verifySecurityBtn, true, '<i class="fas fa-spinner fa-spin"></i> Verifying...');
        
        try {
            // Call backend API to verify security answer
            const response = await this.apiVerifySecurityAnswer(this.userEmail, answer);
            
            if (response.success) {
                this.goToStep(3);
            } else {
                this.showFieldError('security-answer', response.message || 'Incorrect answer. Please try again.');
            }
        } catch (error) {
            console.error('Security verification error:', error);
            this.showFieldError('security-answer', 'Failed to verify answer. Please try again.');
        } finally {
            this.setLoadingState(this.verifySecurityBtn, false, '<i class="fas fa-check"></i> Verify Answer');
        }
    }

    async handlePasswordReset() {
        const newPassword = this.newPasswordInput?.value;
        const confirmPassword = this.confirmPasswordInput?.value;
        
        // Validate new password
        if (!newPassword) {
            this.showFieldError('new-password', 'Please enter a new password');
            return;
        }
        
        // Validate password strength
        const strengthResult = this.checkPasswordStrength(newPassword);
        if (!strengthResult.isValid) {
            this.showFieldError('new-password', strengthResult.message);
            return;
        }
        
        // Validate password confirmation
        if (!confirmPassword) {
            this.showFieldError('confirm-password', 'Please confirm your password');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showFieldError('confirm-password', 'Passwords do not match');
            return;
        }
        
        // Show loading state
        this.setLoadingState(this.resetPasswordBtn, true, '<i class="fas fa-spinner fa-spin"></i> Resetting...');
        
        try {
            // Call backend API to reset password
            const response = await this.apiResetPassword(this.userEmail, newPassword);
            
            if (response.success) {
                this.showSuccessMessage();
            } else {
                this.showErrorMessage(response.message || 'Failed to reset password. Please try again.');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            this.showErrorMessage('Failed to reset password. Please try again.');
        } finally {
            this.setLoadingState(this.resetPasswordBtn, false, '<i class="fas fa-save"></i> Reset Password');
        }
    }

    // Password strength validation
    checkPasswordStrength(password) {
        // Minimum requirements
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        if (password.length < minLength) {
            return { isValid: false, message: `Password must be at least ${minLength} characters` };
        }
        
        if (!hasUpperCase) {
            return { isValid: false, message: 'Password must contain at least one uppercase letter' };
        }
        
        if (!hasLowerCase) {
            return { isValid: false, message: 'Password must contain at least one lowercase letter' };
        }
        
        if (!hasNumbers) {
            return { isValid: false, message: 'Password must contain at least one number' };
        }
        
        if (!hasSpecialChar) {
            return { isValid: false, message: 'Password must contain at least one special character' };
        }
        
        return { isValid: true, message: 'Password is strong' };
    }

    validatePasswordStrength() {
        const password = this.newPasswordInput?.value || '';
        
        if (!password) {
            this.passwordStrengthFill.className = 'password-strength-meter__fill';
            this.passwordStrengthText.textContent = 'Password strength: N/A';
            return;
        }
        
        // Calculate strength score
        let score = 0;
        
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
        
        // Update UI
        this.passwordStrengthFill.className = 'password-strength-meter__fill';
        
        if (score <= 2) {
            this.passwordStrengthFill.classList.add('password-strength-meter__fill--weak');
            this.passwordStrengthText.textContent = 'Password strength: Weak';
        } else if (score <= 4) {
            this.passwordStrengthFill.classList.add('password-strength-meter__fill--fair');
            this.passwordStrengthText.textContent = 'Password strength: Fair';
        } else if (score <= 5) {
            this.passwordStrengthFill.classList.add('password-strength-meter__fill--good');
            this.passwordStrengthText.textContent = 'Password strength: Good';
        } else {
            this.passwordStrengthFill.classList.add('password-strength-meter__fill--strong');
            this.passwordStrengthText.textContent = 'Password strength: Strong';
        }
    }

    checkPasswordMatch() {
        const newPassword = this.newPasswordInput?.value || '';
        const confirmPassword = this.confirmPasswordInput?.value || '';
        const indicator = this.passwordMatchIndicator;
        
        if (!newPassword || !confirmPassword) {
            indicator.className = 'password-match-indicator';
            indicator.innerHTML = '<i class="fas fa-circle-notch password-match-indicator__icon"></i><span>Enter both passwords</span>';
            return;
        }
        
        if (newPassword === confirmPassword) {
            indicator.className = 'password-match-indicator password-match-indicator--match';
            indicator.innerHTML = '<i class="fas fa-check-circle password-match-indicator__icon"></i><span>Passwords match</span>';
        } else {
            indicator.className = 'password-match-indicator password-match-indicator--mismatch';
            indicator.innerHTML = '<i class="fas fa-times-circle password-match-indicator__icon"></i><span>Passwords do not match</span>';
        }
    }

    // API calls (simulated for demo - would be real API calls in production)
    async apiVerifyEmail(email) {
        // In production, this would be:
        // const response = await fetch('/api/auth/forgot-password', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email })
        // });
        // return await response.json();
        
        // Simulated response for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check localStorage for demo users
        const storedUser = localStorage.getItem(`swa_user_${email}`);
        
        if (storedUser) {
            const user = JSON.parse(storedUser);
            return {
                success: true,
                securityQuestion: user.securityQuestion || 'pet-name'
            };
        }
        
        // For demo purposes, accept any email ending with @joust.ac.ke or @student.joust.ac.ke
        if (email.endsWith('@joust.ac.ke') || email.endsWith('@student.joust.ac.ke')) {
            return {
                success: true,
                securityQuestion: 'pet-name'
            };
        }
        
        return {
            success: false,
            message: 'Email not found in our system'
        };
    }

    async apiVerifySecurityAnswer(email, answer) {
        // In production, this would be:
        // const response = await fetch('/api/auth/verify-security-answer', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email, answer })
        // });
        // return await response.json();
        
        // Simulated response for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check localStorage for demo
        const storedUser = localStorage.getItem(`swa_user_${email}`);
        
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user.securityAnswer && user.securityAnswer.toLowerCase() === answer.toLowerCase()) {
                return { success: true };
            }
        }
        
        // For demo, accept "dog" as the answer
        if (answer.toLowerCase() === 'dog') {
            return { success: true };
        }
        
        return {
            success: false,
            message: 'Incorrect security answer'
        };
    }

    async apiResetPassword(email, newPassword) {
        // In production, this would be:
        // const response = await fetch('/api/auth/reset-password', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email, password: newPassword })
        // });
        // return await response.json();
        
        // Simulated response for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In production, the password would be hashed before storage
        // For demo, we store the password in localStorage
        const storedUser = localStorage.getItem(`swa_user_${email}`);
        
        if (storedUser) {
            const user = JSON.parse(storedUser);
            user.password = newPassword; // In production, this would be hashed
            localStorage.setItem(`swa_user_${email}`, JSON.stringify(user));
        }
        
        return { success: true };
    }

    getSecurityQuestionText(questionValue) {
        const questions = {
            'pet-name': 'What is your pet\'s name?',
            'mother-maiden-name': 'What is your mother\'s maiden name?',
            'first-school': 'What is the name of your first school?',
            'favorite-food': 'What is your favorite food?',
            'city-born': 'In which city were you born?',
            'best-friend': 'What is your best friend\'s name?',
            'first-car': 'What was the make of your first car?',
            'favorite-movie': 'What is your favorite movie?'
        };
        
        return questions[questionValue] || 'What is your pet\'s name?';
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFieldError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('forgot-password-form__error--visible');
        }
    }

    clearFieldError(fieldId) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('forgot-password-form__error--visible');
        }
    }

    showSuccessMessage() {
        this.form.style.display = 'none';
        this.successMessage.style.display = 'block';
        this.errorMessage.style.display = 'none';
    }

    showErrorMessage(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'block';
        this.successMessage.style.display = 'none';
    }

    hideAllMessages() {
        this.successMessage.style.display = 'none';
        this.errorMessage.style.display = 'none';
    }

    setLoadingState(button, isLoading, loadingText) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = loadingText;
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ForgotPasswordPage();
});

// Export for module use
export default ForgotPasswordPage;
