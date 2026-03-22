/**
 * Member Portal Script
 * Handles member portal functionality including contributions and loan applications
 * 
 * @version 1.0.0
 */

// Import services
import { authService, memberService, contributionService, loanService } from '../../../services/index.js';

class MemberPortal {
    constructor() {
        this.contributionForm = document.querySelector('.make-contribution form');
        this.loanForm = document.querySelector('.loan-section form');
        this.profileEditBtn = document.querySelector('.profile-section .btn');
        
        // Initialize on construction
        this.init();
    }

    init() {
        // Check authentication first
        if (!this.checkAuth()) {
            return; // Will redirect to login
        }
        this.bindEvents();
        this.loadMemberData();
    }

    checkAuth() {
        if (!authService.isAuthenticated()) {
            // Not logged in, redirect to login page
            window.location.href = '../auth/login-page.html?redirect=../dashboard/member-portal.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        if (!user) {
            window.location.href = '../auth/login-page.html?redirect=../dashboard/member-portal.html';
            return false;
        }
        return true;
    }

    bindEvents() {
        // Contribution form
        if (this.contributionForm) {
            this.contributionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContribution();
            });

            // Payment method change handler
            const paymentMethod = this.contributionForm.querySelector('select');
            if (paymentMethod) {
                paymentMethod.addEventListener('change', (e) => {
                    this.handlePaymentMethodChange(e.target);
                });
            }
        }

        // Loan form
        if (this.loanForm) {
            this.loanForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLoanApplication();
            });

            // Amount input validation
            const amountInput = this.loanForm.querySelector('input[type="number"]');
            if (amountInput) {
                amountInput.addEventListener('input', (e) => {
                    this.validateLoanAmount(e.target);
                });
            }
        }

        // Profile edit button
        if (this.profileEditBtn) {
            this.profileEditBtn.addEventListener('click', () => {
                this.handleProfileEdit();
            });
        }

        // Notification click handlers
        document.querySelectorAll('.notification').forEach(notification => {
            notification.addEventListener('click', () => {
                notification.classList.toggle('read');
            });
        });
    }

    handlePaymentMethodChange(select) {
        const transactionInput = select.closest('form').querySelector('input[placeholder*="ABC"]');
        if (transactionInput) {
            if (select.value === 'cash') {
                transactionInput.disabled = true;
                transactionInput.placeholder = 'N/A - Hand delivery';
                transactionInput.required = false;
            } else {
                transactionInput.disabled = false;
                transactionInput.placeholder = 'e.g. ABC123XYZ';
                transactionInput.required = true;
            }
        }
    }

    async handleContribution() {
        const form = this.contributionForm;
        const amount = form.querySelector('input[type="number"]')?.value;
        const method = form.querySelector('select')?.value;
        const transactionId = form.querySelector('input[type="text"]')?.value;

        // Validation
        if (!amount || amount < 100) {
            alert('Minimum contribution amount is Ksh 100');
            return;
        }

        if (!method) {
            alert('Please select a payment method');
            return;
        }

        if (method !== 'cash' && !transactionId) {
            alert('Please enter the transaction ID');
            return;
        }

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Show success
            alert('Contribution submitted successfully! Pending verification.');
            
            // Reset form
            form.reset();
            
            // Update contribution display (demo)
            this.updateContributionDisplay(amount);

        } catch (error) {
            console.error('Contribution error:', error);
            alert('Failed to submit contribution. Please try again.');
        }
    }

    updateContributionDisplay(amount) {
        const totalContributions = document.querySelector('.card:first-child .stat');
        const balance = document.querySelector('.card:nth-child(4) .stat');
        
        if (totalContributions && balance) {
            const currentTotal = parseInt(totalContributions.textContent.replace(/[^\d]/g, '')) || 0;
            const newTotal = currentTotal + parseInt(amount);
            totalContributions.textContent = `Ksh ${newTotal.toLocaleString()}`;
            
            const currentBalance = parseInt(balance.textContent.replace(/[^\d]/g, '')) || 0;
            balance.textContent = `Ksh ${(currentBalance + parseInt(amount)).toLocaleString()}`;
        }
    }

    validateLoanAmount(input) {
        const maxAmount = parseInt(input.max) || 9000;
        const minAmount = parseInt(input.min) || 500;
        const value = parseInt(input.value) || 0;

        if (value > maxAmount) {
            input.value = maxAmount;
            alert(`Maximum loan amount is Ksh ${maxAmount.toLocaleString()}`);
        } else if (value < minAmount) {
            input.value = '';
        }
    }

    async handleLoanApplication() {
        const form = this.loanForm;
        const amount = form.querySelector('input[type="number"]')?.value;
        const purpose = form.querySelector('select')?.value;
        const period = form.querySelectorAll('select')[1]?.value;
        const guarantor = form.querySelector('input[type="text"]')?.value;

        // Validation
        if (!amount || amount < 500) {
            alert('Minimum loan amount is Ksh 500');
            return;
        }

        if (!purpose) {
            alert('Please select a loan purpose');
            return;
        }

        if (!period) {
            alert('Please select a repayment period');
            return;
        }

        if (!guarantor) {
            alert('Please enter guarantor name');
            return;
        }

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Show success
            alert('Loan application submitted successfully! You will be notified once processed.');
            
            // Reset form
            form.reset();

        } catch (error) {
            console.error('Loan application error:', error);
            alert('Failed to submit loan application. Please try again.');
        }
    }

    handleProfileEdit() {
        alert('Profile editing feature coming soon! Please contact support for profile updates.');
    }

    loadMemberData() {
        // Load saved member data if available
        const savedData = localStorage.getItem('swa_member_data');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.populateProfile(data);
        }
    }

    populateProfile(data) {
        const profileInfo = document.querySelector('.profile-info');
        if (profileInfo) {
            // Update profile fields if they exist
            const nameField = profileInfo.querySelector('p:first-child');
            if (nameField && data.name) {
                nameField.innerHTML = `<strong>Name:</strong> ${data.name}`;
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MemberPortal();
});

// Export for module use
export default MemberPortal;
