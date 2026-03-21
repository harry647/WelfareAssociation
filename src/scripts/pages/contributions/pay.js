/**
 * Contribution Payment Script
 * Handles contribution form submission and payment processing
 */

import { ContributionService } from '../../../services/contribution-service.js';

// Initialize contribution payment functionality
document.addEventListener('DOMContentLoaded', () => {
    initContributionPayment();
});

function initContributionPayment() {
    const form = document.getElementById('contributionForm');
    
    if (!form) {
        console.error('Contribution form not found');
        return;
    }

    // Quick amount buttons
    const amountButtons = document.querySelectorAll('.amount-btn');
    const amountInput = document.getElementById('amount');
    
    if (amountButtons.length > 0 && amountInput) {
        amountButtons.forEach(button => {
            button.addEventListener('click', () => {
                const amount = button.dataset.amount;
                amountInput.value = amount;
                
                // Update visual state
                amountButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    // Payment method handling
    const paymentMethod = document.getElementById('paymentMethod');
    const transactionId = document.getElementById('transactionId');
    
    if (paymentMethod && transactionId) {
        paymentMethod.addEventListener('change', (e) => {
            if (e.target.value === 'cash') {
                transactionId.placeholder = 'N/A - Pay at office';
                transactionId.disabled = true;
                transactionId.required = false;
            } else if (e.target.value === '') {
                transactionId.placeholder = 'Enter M-Pesa or Bank transaction ID';
                transactionId.disabled = true;
                transactionId.required = false;
            } else {
                transactionId.placeholder = 'Enter M-Pesa or Bank transaction ID';
                transactionId.disabled = false;
                transactionId.required = true;
            }
        });
    }

    // Set default month to current month
    const paymentMonth = document.getElementById('paymentMonth');
    if (paymentMonth) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        paymentMonth.value = `${year}-${month.toString().padStart(2, '0')}`;
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const contributionData = {
            fullName: formData.get('fullName'),
            studentId: formData.get('studentId'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            amount: parseFloat(formData.get('amount')),
            contributionType: formData.get('contributionType'),
            paymentMonth: formData.get('paymentMonth'),
            paymentMethod: formData.get('paymentMethod'),
            transactionId: formData.get('transactionId'),
            note: formData.get('note'),
            anonymous: formData.get('anonymous') === 'on'
        };

        // Validate contribution
        if (!validateContribution(contributionData)) {
            return;
        }

        // Submit contribution
        try {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            const result = await ContributionService.makeContribution(contributionData);
            
            if (result.success) {
                showSuccessMessage('Thank you for your contribution! A receipt has been sent to your email.');
                form.reset();
                
                // Reset quick amount buttons
                amountButtons.forEach(btn => btn.classList.remove('active'));
            } else {
                showErrorMessage(result.message || 'Failed to process contribution. Please try again.');
            }
        } catch (error) {
            console.error('Error processing contribution:', error);
            showErrorMessage('An error occurred. Please try again later.');
        } finally {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-check"></i> Submit Contribution';
        }
    });
}

function validateContribution(data) {
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
        showErrorMessage('Invalid phone number format');
        return false;
    }

    // Validate amount
    if (data.amount < 100) {
        showErrorMessage('Minimum contribution amount is Ksh 100');
        return false;
    }

    // Validate payment method
    if (!data.paymentMethod) {
        showErrorMessage('Please select a payment method');
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
export { initContributionPayment, validateContribution };
