/**
 * Loan Repayment Script
 * Handles loan repayment form submission, M-Pesa integration, and payment processing
 */

import { loanService } from '../../../services/loan-service.js';

// API Configuration - Ready for backend integration
const API_CONFIG = {
    baseUrl: '/api',
    endpoints: {
        makePayment: '/make-payment',
        stkPush: '/stk-push',
        paymentCallback: '/payment-callback',
        paymentStatus: '/payment-status',
        generateReceipt: '/generate-receipt',
        emailReceipt: '/email-receipt',
        paymentHistory: '/payment-history'
    }
};

// Loan data (would come from backend in production)
let loanData = {
    loanId: 'LN/2025/001',
    originalAmount: 5000,
    interest: 250,
    totalDue: 5250,
    amountPaid: 2000,
    remainingBalance: 3250,
    dueDate: '2025-03-25',
    status: 'active'
};

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

    // Initialize all features
    initLoanSummary();
    initPhoneFormatting();
    initSTKPush();
    initPaymentConfirmation();
    initReceiptActions();
    initPaymentMethodToggle();
    
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
                
                // Update remaining balance display
                updateRemainingBalance(parseFloat(amount));
                
                // Visual feedback
                quickAmountButtons.forEach(btn => btn.style.background = '');
                quickAmountButtons.forEach(btn => btn.style.color = '');
                button.style.background = '#11998e';
                button.style.color = 'white';
            });
        });
    }

    // Payment amount change
    if (paymentAmountInput) {
        paymentAmountInput.addEventListener('input', () => {
            updateRemainingBalance(parseFloat(paymentAmountInput.value) || 0);
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showPaymentConfirmationModal();
    });

    // Preview button
    const previewBtn = document.getElementById('previewPaymentBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', showPaymentDetailsPreview);
    }

    // Payment method selection
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const transactionIdInput = document.getElementById('transactionId');
    
    if (paymentMethods.length > 0) {
        paymentMethods.forEach(method => {
            method.addEventListener('change', (e) => {
                // Show/hide M-Pesa section
                const mpesaSection = document.getElementById('mpesaPaymentSection');
                if (mpesaSection) {
                    if (e.target.value === 'mpesa') {
                        mpesaSection.classList.add('show');
                    } else {
                        mpesaSection.classList.remove('show');
                    }
                }
                
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
}

// ============================================
// LOAN SUMMARY INITIALIZATION
// ============================================
function initLoanSummary() {
    // In production, this would fetch from the backend
    // For demo, we'll use the existing data
    
    // Update all summary elements
    document.getElementById('loanId').textContent = loanData.loanId;
    document.getElementById('originalAmount').textContent = `Ksh ${loanData.originalAmount.toLocaleString()}`;
    document.getElementById('interestAmount').textContent = `Ksh ${loanData.interest.toLocaleString()}`;
    document.getElementById('totalDue').textContent = `Ksh ${loanData.totalDue.toLocaleString()}`;
    document.getElementById('amountPaid').textContent = `Ksh ${loanData.amountPaid.toLocaleString()}`;
    document.getElementById('remainingBalance').textContent = `Ksh ${loanData.remainingBalance.toLocaleString()}`;
    document.getElementById('remainingBalanceDisplay').textContent = loanData.remainingBalance.toLocaleString();
    document.getElementById('dueDate').textContent = formatDate(loanData.dueDate);
    
    // Update progress bar
    const progressPercent = (loanData.amountPaid / loanData.totalDue) * 100;
    const progressFill = document.getElementById('paymentProgress');
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }
    
    // Update progress labels
    const progressLabels = document.querySelector('.progress-labels');
    if (progressLabels) {
        progressLabels.innerHTML = `
            <span>Paid: Ksh ${loanData.amountPaid.toLocaleString()}</span>
            <span>${Math.round(progressPercent)}%</span>
            <span>Total: Ksh ${loanData.totalDue.toLocaleString()}</span>
        `;
    }
    
    // Update status badge
    updateLoanStatusBadge(loanData.status);
}

function updateLoanStatusBadge(status) {
    const badge = document.getElementById('loanStatusBadge');
    if (!badge) return;
    
    const statusClasses = {
        'pending': 'pending',
        'active': 'active',
        'overdue': 'overdue',
        'paid': 'paid'
    };
    
    const statusTexts = {
        'pending': 'Pending',
        'active': 'In Progress',
        'overdue': 'Overdue',
        'paid': 'Fully Paid'
    };
    
    badge.className = `loan-status-badge ${statusClasses[status] || 'pending'}`;
    badge.textContent = statusTexts[status] || 'Unknown';
}

function updateRemainingBalance(paymentAmount) {
    const remaining = Math.max(0, loanData.remainingBalance - paymentAmount);
    const display = document.getElementById('remainingBalanceDisplay');
    if (display) {
        display.textContent = remaining.toLocaleString();
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ============================================
// PHONE NUMBER VALIDATION
// ============================================
function initPhoneFormatting() {
    const mpesaPhone = document.getElementById('mpesaPhone');
    const phoneError = document.getElementById('phoneError');
    
    if (!mpesaPhone) return;

    mpesaPhone.addEventListener('input', (e) => {
        let value = e.target.value;
        
        // Auto-format: Convert 07xx to 2547xx
        if (value.startsWith('07') || value.startsWith('71') || value.startsWith('72')) {
            value = '254' + value.replace(/^0/, '');
            e.target.value = value;
        }
        
        // Validate
        validatePhone(value, phoneError);
    });

    mpesaPhone.addEventListener('blur', (e) => {
        const value = e.target.value;
        if (value && !value.startsWith('254')) {
            const converted = convertTo254Format(value);
            if (converted) {
                e.target.value = converted;
            }
        }
        validatePhone(e.target.value, phoneError);
    });
}

function validatePhone(phone, errorElement) {
    const kenyanPhonePattern = /^254[0-9]{9}$/;
    const cleanPhone = phone.replace(/\s/g, '');
    
    if (!phone) {
        hidePhoneError(errorElement);
        return true;
    }
    
    if (!kenyanPhonePattern.test(cleanPhone)) {
        showPhoneError(errorElement, 'Use format: 2547XXXXXXXX');
        return false;
    }
    
    hidePhoneError(errorElement);
    return true;
}

function convertTo254Format(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('07')) {
        return '254' + cleaned.substring(1);
    }
    if (cleaned.startsWith('71') || cleaned.startsWith('72') || cleaned.startsWith('74') || 
        cleaned.startsWith('76') || cleaned.startsWith('77') || cleaned.startsWith('78')) {
        return '254' + cleaned;
    }
    return phone;
}

function showPhoneError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

function hidePhoneError(element) {
    if (element) {
        element.textContent = '';
        element.classList.remove('show');
    }
}

// ============================================
// M-PESA STK PUSH INTEGRATION
// ============================================
function initSTKPush() {
    const stkPushBtn = document.getElementById('initiateStkPush');
    
    if (stkPushBtn) {
        stkPushBtn.addEventListener('click', initiateSTKPush);
    }
}

async function initiateSTKPush() {
    const mpesaPhone = document.getElementById('mpesaPhone');
    const paymentAmountInput = document.getElementById('paymentAmount');
    
    if (!mpesaPhone || !mpesaPhone.value) {
        showErrorMessage('Please enter your M-Pesa number');
        return;
    }
    
    // Validate phone
    if (!validatePhone(mpesaPhone.value, document.getElementById('phoneError'))) {
        return;
    }
    
    let phone = mpesaPhone.value;
    const paymentAmount = parseFloat(paymentAmountInput?.value) || loanData.remainingBalance;
    
    // Show processing status
    showPaymentStatus('processing', 'Initiating M-Pesa payment...');
    
    const stkPushBtn = document.getElementById('initiateStkPush');
    if (stkPushBtn) {
        stkPushBtn.disabled = true;
        stkPushBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    try {
        // Call backend API for STK Push (ready for integration)
        const response = await callAPI(API_CONFIG.endpoints.stkPush, {
            method: 'POST',
            body: JSON.stringify({
                phone: phone,
                amount: paymentAmount,
                loanId: loanData.loanId,
                transactionType: 'CustomerPayBillOnline'
            })
        });
        
        if (response.success) {
            showPaymentStatus('processing', 'Check your phone for M-Pesa prompt...');
            // Start polling for payment confirmation
            startPaymentPolling(response.checkoutRequestId);
        } else {
            showPaymentStatus('failed', response.message || 'Payment initiation failed');
            resetSTKPushButton();
        }
    } catch (error) {
        console.error('STK Push error:', error);
        // Demo: Simulate success after delay
        setTimeout(() => {
            showPaymentStatus('success', 'Payment successful! (Demo mode)');
            enableReceiptActions();
            sendSMSConfirmation(paymentAmount);
            resetSTKPushButton();
        }, 3000);
    }
}

function showPaymentStatus(status, message) {
    const container = document.getElementById('paymentStatusContainer');
    const statusEl = document.getElementById('paymentStatus');
    
    if (!container || !statusEl) return;
    
    container.classList.add('show');
    statusEl.className = `payment-status ${status}`;
    
    const icons = {
        'pending': 'fa-clock',
        'processing': 'fa-spinner fa-spin',
        'success': 'fa-check-circle',
        'failed': 'fa-times-circle'
    };
    
    const titles = {
        'pending': 'Waiting for Payment',
        'processing': 'Processing Payment',
        'success': 'Payment Successful',
        'failed': 'Payment Failed'
    };
    
    statusEl.innerHTML = `
        <i class="fas ${icons[status]}"></i>
        <h3>${titles[status]}</h3>
        <p>${message}</p>
    `;
}

function startPaymentPolling(checkoutRequestId) {
    let attempts = 0;
    const maxAttempts = 30;
    
    const pollInterval = setInterval(async () => {
        attempts++;
        
        if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            showPaymentStatus('failed', 'Payment timeout. Please try again.');
            resetSTKPushButton();
            return;
        }
        
        try {
            const response = await callAPI(`${API_CONFIG.endpoints.paymentStatus}?checkoutRequestId=${checkoutRequestId}`);
            
            if (response.status === 'success') {
                clearInterval(pollInterval);
                showPaymentStatus('success', `Payment confirmed! Receipt: ${response.receiptNumber}`);
                enableReceiptActions();
                sendSMSConfirmation(response.amount);
                resetSTKPushButton();
            }
        } catch (error) {
            console.log('Polling for payment status...');
        }
    }, 1000);
}

function resetSTKPushButton() {
    const stkPushBtn = document.getElementById('initiateStkPush');
    if (stkPushBtn) {
        stkPushBtn.disabled = false;
        stkPushBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send STK Push';
    }
}

// ============================================
// PAYMENT CONFIRMATION MODAL
// ============================================
function initPaymentConfirmation() {
    const modal = document.getElementById('paymentConfirmModal');
    const cancelBtn = document.getElementById('cancelPaymentBtn');
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hidePaymentConfirmationModal);
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', processPayment);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hidePaymentConfirmationModal();
            }
        });
    }
}

function showPaymentConfirmationModal() {
    const paymentAmount = parseFloat(document.getElementById('paymentAmount')?.value);
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const paymentDate = document.getElementById('paymentDate')?.value;
    const transactionId = document.getElementById('transactionId')?.value;
    
    if (!paymentAmount || paymentAmount < 100) {
        showErrorMessage('Please enter a valid payment amount (minimum Ksh 100)');
        return;
    }
    
    if (paymentAmount > loanData.remainingBalance) {
        showErrorMessage(`Payment amount exceeds remaining balance of Ksh ${loanData.remainingBalance}`);
        return;
    }
    
    // Populate preview
    document.getElementById('previewAmount').textContent = paymentAmount.toLocaleString();
    document.getElementById('previewMethod').textContent = getPaymentMethodName(paymentMethod);
    document.getElementById('previewDate').textContent = formatDate(paymentDate);
    document.getElementById('previewTransactionId').textContent = transactionId || 'N/A';
    
    const modal = document.getElementById('paymentConfirmModal');
    if (modal) modal.classList.add('show');
}

function hidePaymentConfirmationModal() {
    const modal = document.getElementById('paymentConfirmModal');
    if (modal) modal.classList.remove('show');
}

function getPaymentMethodName(method) {
    const methods = {
        'mpesa': 'M-Pesa',
        'bank': 'Bank Transfer',
        'cash': 'Cash'
    };
    return methods[method] || method;
}

function showPaymentDetailsPreview() {
    const paymentAmount = parseFloat(document.getElementById('paymentAmount')?.value);
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    
    if (!paymentAmount) {
        showErrorMessage('Please enter an amount');
        return;
    }
    
    const message = `
        Payment Preview:
        Amount: Ksh ${paymentAmount.toLocaleString()}
        Method: ${getPaymentMethodName(paymentMethod)}
        Remaining after payment: Ksh ${(loanData.remainingBalance - paymentAmount).toLocaleString()}
    `;
    
    alert(message);
}

async function processPayment() {
    hidePaymentConfirmationModal();
    
    const form = document.getElementById('repaymentForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const paymentData = {
        loanId: loanData.loanId,
        paymentAmount: parseFloat(formData.get('paymentAmount')),
        paymentDate: formData.get('paymentDate'),
        paymentMethod: formData.get('paymentMethod'),
        transactionId: formData.get('transactionId'),
        paymentNote: formData.get('paymentNote'),
        receiptNumber: generateReceiptNumber()
    };

    // Validate payment
    if (!validatePayment(paymentData)) {
        return;
    }

    // Show processing status
    showPaymentStatus('processing', 'Processing payment...');

    // Submit payment
    try {
        const submitButton = document.getElementById('submitPaymentBtn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        }

        const result = await loanService.makePayment(paymentData);
        
        if (result.success) {
            showPaymentStatus('success', 'Payment submitted successfully!');
            
            // Update loan data
            loanData.amountPaid += paymentData.paymentAmount;
            loanData.remainingBalance = Math.max(0, loanData.totalDue - loanData.amountPaid);
            
            // Check if fully paid
            if (loanData.remainingBalance === 0) {
                loanData.status = 'paid';
                updateLoanStatusBadge('paid');
            }
            
            // Reinitialize summary
            initLoanSummary();
            
            // Enable receipt
            enableReceiptActions();
            
            // Send SMS
            sendSMSConfirmation(paymentData.paymentAmount);
            
            // Add to payment history
            addPaymentToHistory(paymentData);
            
            // Reset form
            form.reset();
            
            // Reload page after short delay
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } else {
            showPaymentStatus('failed', result.message || 'Failed to process payment');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        
        // Demo: Show success
        showPaymentStatus('success', 'Payment submitted successfully! (Demo mode)');
        
        // Update loan data
        loanData.amountPaid += paymentData.paymentAmount;
        loanData.remainingBalance = Math.max(0, loanData.totalDue - loanData.amountPaid);
        
        initLoanSummary();
        enableReceiptActions();
        sendSMSConfirmation(paymentData.paymentAmount);
        addPaymentToHistory(paymentData);
        
        form.reset();
    } finally {
        const submitButton = document.getElementById('submitPaymentBtn');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-check"></i> Submit Payment';
        }
    }
}

// ============================================
// RECEIPT ACTIONS
// ============================================
function initReceiptActions() {
    const downloadBtn = document.getElementById('downloadReceiptBtn');
    const emailBtn = document.getElementById('emailReceiptBtn');
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadPaymentReceipt);
    }
    
    if (emailBtn) {
        emailBtn.addEventListener('click', emailPaymentReceipt);
    }
}

function enableReceiptActions() {
    const receiptActions = document.getElementById('receiptActions');
    if (receiptActions) {
        receiptActions.classList.add('show');
    }
}

async function downloadPaymentReceipt(transactionId = null) {
    const receiptBtn = document.getElementById('downloadReceiptBtn');
    
    if (receiptBtn) {
        receiptBtn.disabled = true;
        receiptBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    }
    
    try {
        const response = await callAPI(API_CONFIG.endpoints.generateReceipt, {
            method: 'POST',
            body: JSON.stringify({
                loanId: loanData.loanId,
                transactionId: transactionId || document.getElementById('transactionId')?.value,
                amount: document.getElementById('paymentAmount')?.value,
                date: new Date().toISOString()
            })
        });
        
        if (response.pdfUrl) {
            window.open(response.pdfUrl, '_blank');
        } else {
            createDemoReceipt(transactionId);
        }
    } catch (error) {
        console.error('Receipt error:', error);
        createDemoReceipt(transactionId);
    } finally {
        if (receiptBtn) {
            receiptBtn.disabled = false;
            receiptBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Download Receipt';
        }
    }
}

async function emailPaymentReceipt() {
    try {
        const response = await callAPI(API_CONFIG.endpoints.emailReceipt, {
            method: 'POST',
            body: JSON.stringify({
                loanId: loanData.loanId,
                email: getUserEmail(),
                transactionId: document.getElementById('transactionId')?.value
            })
        });
        
        if (response.success) {
            showSuccessMessage('Receipt sent to your email!');
        } else {
            showErrorMessage('Failed to send receipt. Please try again.');
        }
    } catch (error) {
        showSuccessMessage('Receipt sent to your email! (Demo)');
    }
}

function createDemoReceipt(transactionId) {
    const receiptContent = `
        STUDENT WELFARE ASSOCIATION (SWA)
        ================================
        Jaramogi Oginga Odinga University
        
        PAYMENT RECEIPT
        ---------------
        Receipt #: ${generateReceiptNumber()}
        Date: ${new Date().toLocaleDateString()}
        
        Loan ID: ${loanData.loanId}
        
        Payment Amount: Ksh ${(parseFloat(document.getElementById('paymentAmount')?.value) || 0).toLocaleString()}
        Payment Method: ${getPaymentMethodName(document.querySelector('input[name="paymentMethod"]:checked')?.value)}
        Transaction ID: ${transactionId || document.getElementById('transactionId')?.value || 'N/A'}
        
        Previous Balance: Ksh ${(loanData.remainingBalance + (parseFloat(document.getElementById('paymentAmount')?.value) || 0)).toLocaleString()}
        New Balance: Ksh ${loanData.remainingBalance.toLocaleString()}
        
        ================================
        Thank you for your payment!
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SWA_Payment_Receipt_${generateReceiptNumber()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccessMessage('Receipt downloaded successfully!');
}

// ============================================
// PAYMENT METHOD TOGGLE
// ============================================
function initPaymentMethodToggle() {
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const mpesaSection = document.getElementById('mpesaPaymentSection');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            if (mpesaSection) {
                if (e.target.value === 'mpesa') {
                    mpesaSection.classList.add('show');
                } else {
                    mpesaSection.classList.remove('show');
                }
            }
        });
    });
}

// ============================================
// SMS NOTIFICATIONS
// ============================================
function sendSMSConfirmation(amount) {
    const smsNotification = document.getElementById('smsNotification');
    const smsMessage = document.getElementById('smsMessage');
    
    if (smsNotification && smsMessage) {
        smsMessage.textContent = `Payment of Ksh ${amount.toLocaleString()} received. Thank you!`;
        smsNotification.classList.add('show');
        
        // Hide after 10 seconds
        setTimeout(() => {
            smsNotification.classList.remove('show');
        }, 10000);
    }
}

// ============================================
// PAYMENT HISTORY
// ============================================
function addPaymentToHistory(paymentData) {
    const tbody = document.getElementById('paymentHistoryBody');
    if (!tbody) return;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${formatDate(paymentData.paymentDate)}</td>
        <td>Ksh ${paymentData.paymentAmount.toLocaleString()}</td>
        <td>${getPaymentMethodName(paymentData.paymentMethod)}</td>
        <td>${paymentData.transactionId || 'N/A'}</td>
        <td><span class="status-badge success">Verified</span></td>
        <td><button class="btn-sm" onclick="downloadPaymentReceipt('${paymentData.transactionId}')"><i class="fas fa-download"></i></button></td>
    `;
    
    // Insert at the beginning
    tbody.insertBefore(row, tbody.firstChild);
}

// ============================================
// VALIDATION
// ============================================
function validatePayment(data) {
    // Validate payment amount
    if (data.paymentAmount < 100) {
        showErrorMessage('Minimum payment amount is Ksh 100');
        return false;
    }

    if (data.paymentAmount > loanData.remainingBalance) {
        showErrorMessage(`Maximum payment amount is Ksh ${loanData.remainingBalance} (remaining balance)`);
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

// ============================================
// HELPER FUNCTIONS
// ============================================
function generateReceiptNumber() {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-8);
    return `RCP${timestamp}`;
}

function getUserEmail() {
    // Get from user session or form
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
        try {
            const user = JSON.parse(userSession);
            return user.email;
        } catch (e) {
            // Ignore
        }
    }
    return document.getElementById('email')?.value || '';
}

async function callAPI(endpoint, options = {}) {
    console.log(`API Call to ${endpoint}:`, options);
    return { success: true, message: 'Operation completed (Demo)' };
}

// ============================================
// MESSAGE DISPLAY
// ============================================
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
export { 
    initLoanRepayment, 
    validatePayment,
    downloadPaymentReceipt
};
