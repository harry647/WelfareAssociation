/**
 * Loan Repayment Script
 * Handles loan repayment form submission and payment processing
 */

import { LoanService } from '../../../services/loan-service.js';

// Initialize the loan repayment functionality
document.addEventListener('DOMContentLoaded', () => {
    initLoanRepayment();
});

function initLoanRepayment() {
    const form = document.getElementById('repaymentForm');
    
    if (!form) {
        console.error('Repayment form not found');
        return;
    }

    // Set default date to today
    const dateInput = document.getElementById('paymentDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.min = today;
    }

    // Quick amount buttons
    const quickAmountButtons = document.querySelectorAll('.quick-amount-btn');
    const paymentAmountInput = document.getElementById('paymentAmount');
    
    if (quickAmountButtons.length > 0 && paymentAmountInput) {
        quickAmountButtons.forEach(button => {
            button.addEventListener('click', () => {
                const amount = button.dataset.amount;
                paymentAmountInput.value = amount;
                
                // Visual feedback
                quickAmountButtons.forEach(btn => btn.style.background = '');
                quickAmountButtons.forEach(btn => btn.style.color = '');
                button.style.background = '#11998e';
                button.style.color = 'white';
            });
        });
    }

    // Payment method selection
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const transactionIdInput = document.getElementById('transactionId');
    
    if (paymentMethods.length > 0) {
        paymentMethods.forEach(method => {
            method.addEventListener('change', (e) => {
                // Show/hide transaction ID field based on payment method
                if (transactionIdInput) {
                    if (e.target.value === 'cash') {
                        transactionIdInput.placeholder = 'N/A - Pay at office';
                        transactionIdInput.disabled = true;
                        transactionIdInput.required = false;
                    } else {
                        transactionIdInput.placeholder = 'e.g., MPO123456789';
                        transactionIdInput.disabled = false;
                        transactionIdInput.required = true;
                    }
                }
            });
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const paymentData = {
            loanId: document.getElementById('loanId')?.textContent || 'LN/2025/001',
            paymentAmount: parseFloat(formData.get('paymentAmount')),
            paymentDate: formData.get('paymentDate'),
            paymentMethod: formData.get('paymentMethod'),
            transactionId: formData.get('transactionId'),
            paymentNote: formData.get('paymentNote')
        };

        // Validate payment
        if (!validatePayment(paymentData)) {
            return;
        }

        // Submit payment
        try {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            const result = await LoanService.makePayment(paymentData);
            
            if (result.success) {
                showSuccessMessage('Payment submitted successfully! It will be verified shortly.');
                form.reset();
                
                // Reload page after short delay to show updated balance
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                showErrorMessage(result.message || 'Failed to process payment. Please try again.');
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            showErrorMessage('An error occurred. Please try again later.');
        } finally {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-check"></i> Submit Payment';
        }
    });
}

function validatePayment(data) {
    // Validate payment amount
    const maxAmount = 3250; // This should come from the loan service
    if (data.paymentAmount < 100) {
        showErrorMessage('Minimum payment amount is Ksh 100');
        return false;
    }

    if (data.paymentAmount > maxAmount) {
        showErrorMessage(`Maximum payment amount is Ksh ${maxAmount} (remaining balance)`);
        return false;
    }

    // Validate payment date
    const paymentDate = new Date(data.paymentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (paymentDate < today) {
        showErrorMessage('Payment date cannot be in the past');
        return false;
    }

    // Validate transaction ID for non-cash payments
    if (data.paymentMethod !== 'cash' && !data.transactionId) {
        showErrorMessage('Transaction ID is required for M-Pesa and Bank transfers');
        return false;
    }

    return true;
}

function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert alert-success';
    messageDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
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

    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert alert-error';
    messageDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
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

    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Export for potential module use
export { initLoanRepayment, validatePayment };
