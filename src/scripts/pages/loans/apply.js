/**
 * Loan Application Script
 * Handles the loan application form submission and validation
 */

import { LoanService } from '../../../services/loan-service.js';

// Initialize the loan application functionality
document.addEventListener('DOMContentLoaded', () => {
    initLoanApplication();
});

function initLoanApplication() {
    const form = document.getElementById('loanApplicationForm');
    
    if (!form) {
        console.error('Loan application form not found');
        return;
    }

    // Handle "Other" purpose field visibility
    const purposeSelect = document.getElementById('loanPurpose');
    const purposeOtherInput = document.getElementById('loanPurposeOther');
    
    if (purposeSelect && purposeOtherInput) {
        purposeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'other') {
                purposeOtherInput.disabled = false;
                purposeOtherInput.required = true;
                purposeOtherInput.focus();
            } else {
                purposeOtherInput.disabled = true;
                purposeOtherInput.required = false;
                purposeOtherInput.value = '';
            }
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect form data
        const formData = new FormData(form);
        const loanData = {
            fullName: formData.get('fullName'),
            studentId: formData.get('studentId'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            loanAmount: parseFloat(formData.get('loanAmount')),
            loanPurpose: formData.get('loanPurpose'),
            loanPurposeOther: formData.get('loanPurposeOther'),
            repaymentPeriod: parseInt(formData.get('repaymentPeriod')),
            guarantorName: formData.get('guarantorName'),
            guarantorId: formData.get('guarantorId'),
            guarantorPhone: formData.get('guarantorPhone')
        };

        // Validate form data
        if (!validateLoanApplication(loanData)) {
            return;
        }

        // Submit the application
        try {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            const result = await LoanService.applyForLoan(loanData);
            
            if (result.success) {
                showSuccessMessage('Loan application submitted successfully! You will receive a confirmation email shortly.');
                form.reset();
            } else {
                showErrorMessage(result.message || 'Failed to submit loan application. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting loan application:', error);
            showErrorMessage('An error occurred. Please try again later.');
        } finally {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application';
        }
    });

    // Set minimum date for repayment period
    const repaymentPeriod = document.getElementById('repaymentPeriod');
    if (repaymentPeriod) {
        repaymentPeriod.addEventListener('change', (e) => {
            // This could be used to calculate and show expected due date
            console.log('Repayment period selected:', e.target.value, 'months');
        });
    }
}

function validateLoanApplication(data) {
    // Validate student ID format
    const studentIdPattern = /^JOO\/\d{4}\/\d{3,4}$/;
    if (!studentIdPattern.test(data.studentId)) {
        showErrorMessage('Invalid student ID format. Expected format: JOO/YYYY/XXX');
        return false;
    }

    // Validate phone number
    const phonePattern = /^(\+254|0)[0-9]{9}$/;
    const cleanPhone = data.phone.replace(/\s/g, '');
    if (!phonePattern.test(cleanPhone)) {
        showErrorMessage('Invalid phone number format. Use format: 0712 345 678');
        return false;
    }

    // Validate loan amount
    if (data.loanAmount < 100 || data.loanAmount > 10000) {
        showErrorMessage('Loan amount must be between Ksh 100 and Ksh 10,000');
        return false;
    }

    // Validate guarantor student ID
    if (!studentIdPattern.test(data.guarantorId)) {
        showErrorMessage('Invalid guarantor student ID format');
        return false;
    }

    return true;
}

function showSuccessMessage(message) {
    // Create success message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert alert-success';
    messageDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d4edda;
        color: #155724;
        padding: 15px 25px;
        border-radius: 6px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(messageDiv);

    // Remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function showErrorMessage(message) {
    // Create error message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert alert-error';
    messageDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f8d7da;
        color: #721c24;
        padding: 15px 25px;
        border-radius: 6px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(messageDiv);

    // Remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Export for potential module use
export { initLoanApplication, validateLoanApplication };
