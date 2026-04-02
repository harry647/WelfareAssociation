/**
 * Loan Application Script
 * Handles the loan application form submission, validation, and M-Pesa integration
 */

import { loanService } from '../../../services/index.js';
import { API_CONFIG } from '../../../config/app-config.js';


import { showConfirm } from '../../../utils/utility-functions.js';
// Initialize the loan application functionality
document.addEventListener('DOMContentLoaded', async () => {
    await initLoanApplication();
});

async function initLoanApplication() {
    const form = document.getElementById('loanApplicationForm');
    
    if (!form) {
        console.error('Loan application form not found');
        return;
    }

    // Initialize all features
    initProgressBar();
    initPhoneFormatting();
    initLoanCalculation();
    initFileUpload();
    initSaveDraft();
    initConfirmationModal();
    initSTKPush();
    initReceiptDownload();
    await initAuthentication();
    await initGuarantorDropdown();
    initEligibilityCheck();
    
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

    // Track form field changes for progress bar
    const fieldsets = form.querySelectorAll('fieldset');
    fieldsets.forEach((fieldset, index) => {
        const inputs = fieldset.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => updateProgressStep(index + 1));
        });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show confirmation modal instead of direct submission
        showConfirmationModal();
    });

    // Handle confirmation modal
    document.getElementById('confirmSubmitBtn')?.addEventListener('click', async () => {
        hideConfirmationModal();
        await submitLoanApplication();
    });

    document.getElementById('cancelConfirmBtn')?.addEventListener('click', () => {
        hideConfirmationModal();
    });

    // Set minimum date for repayment period
    const repaymentPeriod = document.getElementById('repaymentPeriod');
    if (repaymentPeriod) {
        repaymentPeriod.addEventListener('change', (e) => {
            calculateLoanRepayment();
            console.log('Repayment period selected:', e.target.value, 'months');
        });
    }
}

// ============================================
// PROGRESS BAR FUNCTIONALITY
// ============================================
function initProgressBar() {
    updateProgressStep(1);
}

function updateProgressStep(step) {
    const progressFill = document.getElementById('progressFill');
    const steps = document.querySelectorAll('.progress-step');
    
    const percentage = (step / 4) * 100;
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    
    steps.forEach((s, index) => {
        if (index + 1 <= step) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
}

// ============================================
// PHONE NUMBER AUTO-FORMATTING & VALIDATION
// ============================================
function initPhoneFormatting() {
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phoneError');
    
    if (!phoneInput) return;

    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value;
        
        // Auto-format: Convert 07xx to 2547xx
        if (value.startsWith('07') || value.startsWith('71') || value.startsWith('72')) {
            // Remove leading 0 if present and add 254
            value = '254' + value.replace(/^0/, '');
            e.target.value = value;
        }
        
        // Validate phone format
        validatePhoneNumber(value, phoneError);
    });

    phoneInput.addEventListener('blur', (e) => {
        const value = e.target.value;
        if (value && !value.startsWith('254')) {
            // Convert to 254 format if not already
            const converted = convertTo254Format(value);
            if (converted) {
                e.target.value = converted;
            }
        }
        validatePhoneNumber(e.target.value, phoneError);
    });
}

function validatePhoneNumber(phone, errorElement) {
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
    // Convert 07xx, 71xx, 72xx to 254xx
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
// DYNAMIC LOAN CALCULATION
// ============================================
function initLoanCalculation() {
    const amountInput = document.getElementById('loanAmount');
    const periodSelect = document.getElementById('repaymentPeriod');
    
    if (amountInput) {
        amountInput.addEventListener('input', calculateLoanRepayment);
    }
    
    if (periodSelect) {
        periodSelect.addEventListener('change', calculateLoanRepayment);
    }
}

function calculateLoanRepayment() {
    const amount = parseFloat(document.getElementById('loanAmount')?.value) || 0;
    const period = parseInt(document.getElementById('repaymentPeriod')?.value) || 0;
    
    // Phase 1: Normal Loan Period - 10% flat interest (not compounding)
    const interestRate = 0.10; // 10% flat
    const interest = amount * interestRate;
    const totalRepayment = amount + interest;
    
    // Monthly Payment = Total / Months
    const monthlyPayment = period > 0 ? totalRepayment / period : 0;
    
    // Phase 2: Overdue Penalty Calculation
    // Penalty = Remaining Balance × 1% per day × Days Overdue
    // For calculator, show potential penalty for 1-30 days overdue as example
    const dailyPenaltyRate = 0.01; // 1% per day
    const exampleDaysOverdue = 5; // Show example for 5 days overdue
    const examplePenalty = amount * dailyPenaltyRate * exampleDaysOverdue;
    
    const summaryCard = document.getElementById('loanSummaryCard');
    const principalEl = document.getElementById('summaryPrincipal');
    const interestEl = document.getElementById('summaryInterest');
    const periodEl = document.getElementById('summaryPeriod');
    const totalEl = document.getElementById('summaryTotal');
    const monthlyEl = document.getElementById('summaryMonthly');
    const penaltyEl = document.getElementById('summaryPenalty');
    
    if (amount > 0 && period > 0) {
        if (summaryCard) summaryCard.classList.add('show');
        if (principalEl) principalEl.textContent = `Ksh ${amount.toLocaleString()}`;
        if (interestEl) interestEl.textContent = `Ksh ${interest.toLocaleString()}`;
        if (periodEl) periodEl.textContent = `${period} month${period > 1 ? 's' : ''}`;
        if (totalEl) totalEl.textContent = `Ksh ${totalRepayment.toLocaleString()}`;
        if (monthlyEl) monthlyEl.textContent = `Ksh ${monthlyPayment.toLocaleString()}`;
        if (penaltyEl) penaltyEl.textContent = `Ksh ${examplePenalty.toLocaleString()} (${exampleDaysOverdue} days)`;
    } else {
        if (summaryCard) summaryCard.classList.remove('show');
    }
    
    return { amount, interest, totalRepayment, period, monthlyPayment, penalty: examplePenalty };
}

// ============================================
// PENALTY CALCULATION (Used in history/dashboard)
// ============================================
/**
 * Calculate penalty for overdue loan
 * @param {number} balance - Remaining balance
 * @param {number} daysOverdue - Number of days overdue
 * @returns {number} Penalty amount
 */
function calculatePenalty(balance, daysOverdue) {
    const dailyRate = 0.01; // 1% per day
    const penalty = balance * dailyRate * daysOverdue;
    return penalty;
}

/**
 * Check if loan is overdue and calculate days
 * @param {string|Date} dueDate - The due date of the loan
 * @returns {number} Number of days overdue (0 if not overdue)
 */
function checkOverdue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (today > due) {
        const diffTime = today - due;
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return days;
    }
    return 0;
}

// ============================================
// FILE UPLOAD FUNCTIONALITY
// ============================================
function initFileUpload() {
    const fileUploadGroup = document.getElementById('fileUploadGroup');
    const fileInput = document.getElementById('documentUpload');
    const fileList = document.getElementById('fileList');
    
    if (!fileUploadGroup || !fileInput) return;
    
    const uploadedFiles = [];
    
    fileUploadGroup.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        handleFileUpload(e.target.files, fileList, uploadedFiles);
    });
    
    // Drag and drop support
    fileUploadGroup.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadGroup.style.borderColor = '#11998e';
        fileUploadGroup.style.background = '#f0fdf4';
    });
    
    fileUploadGroup.addEventListener('dragleave', (e) => {
        e.preventDefault();
        fileUploadGroup.style.borderColor = '#ccc';
        fileUploadGroup.style.background = '';
    });
    
    fileUploadGroup.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadGroup.style.borderColor = '#ccc';
        fileUploadGroup.style.background = '';
        handleFileUpload(e.dataTransfer.files, fileList, uploadedFiles);
    });
}

function handleFileUpload(files, fileListEl, uploadedFiles) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    Array.from(files).forEach(file => {
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
            showErrorMessage(`Invalid file type: ${file.name}. Only PDF, JPG, and PNG are allowed.`);
            return;
        }
        
        // Validate file size
        if (file.size > maxSize) {
            showErrorMessage(`File too large: ${file.name}. Maximum size is 5MB.`);
            return;
        }
        
        uploadedFiles.push(file);
        addFileToList(file, fileListEl, uploadedFiles);
    });
}

function addFileToList(file, fileListEl, uploadedFiles) {
    if (!fileListEl) return;
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <span><i class="fas fa-file"></i> ${file.name}</span>
        <button type="button" class="remove-file" data-filename="${file.name}">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    fileItem.querySelector('.remove-file').addEventListener('click', () => {
        const index = uploadedFiles.findIndex(f => f.name === file.name);
        if (index > -1) {
            uploadedFiles.splice(index, 1);
        }
        fileItem.remove();
    });
    
    fileListEl.appendChild(fileItem);
}

// ============================================
// SAVE DRAFT FUNCTIONALITY (LocalStorage)
// ============================================
function initSaveDraft() {
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', saveDraft);
    }
    
    // Load draft on page load
    loadDraft();
}

function saveDraft() {
    const form = document.getElementById('loanApplicationForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const draftData = {};
    
    formData.forEach((value, key) => {
        draftData[key] = value;
    });
    
    // Add timestamp
    draftData.savedAt = new Date().toISOString();
    
    localStorage.setItem('loanFormDraft', JSON.stringify(draftData));
    showSuccessMessage('Draft saved successfully!');
}

function loadDraft() {
    const draft = localStorage.getItem('loanFormDraft');
    if (!draft) return;
    
    try {
        const draftData = JSON.parse(draft);
        const form = document.getElementById('loanApplicationForm');
        if (!form) return;
        
        // Check if draft is less than 24 hours old
        const savedAt = new Date(draftData.savedAt);
        const now = new Date();
        const hoursDiff = (now - savedAt) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            localStorage.removeItem('loanFormDraft');
            return;
        }
        
        // Populate form
        Object.keys(draftData).forEach(key => {
            if (key !== 'savedAt') {
                const input = form.elements[key];
                if (input) {
                    input.value = draftData[key];
                }
            }
        });
        
        // Show notification
        showSuccessMessage('Draft loaded successfully!');
        
        // Trigger loan calculation
        calculateLoanRepayment();
    } catch (error) {
        console.error('Error loading draft:', error);
    }
}

function clearDraft() {
    localStorage.removeItem('loanFormDraft');
}

// ============================================
// CONFIRMATION MODAL
// ============================================
function initConfirmationModal() {
    const modal = document.getElementById('confirmModal');
    const cancelBtn = document.getElementById('cancelConfirmBtn');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideConfirmationModal);
    }
    
    // Close modal on overlay click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideConfirmationModal();
            }
        });
    }
}

function showConfirmationModal() {
    const { amount, interest, totalRepayment, period } = calculateLoanRepayment();
    
    if (amount === 0 || period === 0) {
        showErrorMessage('Please enter loan amount and repayment period');
        return;
    }
    
    // Populate modal details
    const confirmAmount = document.getElementById('confirmAmount');
    const confirmTotal = document.getElementById('confirmTotal');
    const confirmPeriod = document.getElementById('confirmPeriod');
    
    if (confirmAmount) confirmAmount.textContent = `Ksh ${amount.toLocaleString()}`;
    if (confirmTotal) confirmTotal.textContent = `Ksh ${totalRepayment.toLocaleString()}`;
    if (confirmPeriod) confirmPeriod.textContent = `${period} month${period > 1 ? 's' : ''}`;
    
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.add('show');
}

function hideConfirmationModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('show');
}

// ============================================
// M-PESA STK PUSH INTEGRATION
// ============================================
function initSTKPush() {
    const stkPushBtn = document.getElementById('stkPushBtn');
    
    if (stkPushBtn) {
        stkPushBtn.addEventListener('click', initiateSTKPush);
    }
}

async function initiateSTKPush() {
    const mpesaConfirm = document.getElementById('mpesaConfirm');
    const paymentAmount = parseFloat(document.getElementById('loanAmount')?.value) || 0;
    
    if (!mpesaConfirm || !mpesaConfirm.value) {
        showErrorMessage('Please enter your M-Pesa number');
        return;
    }
    
    // Validate phone number
    let phone = mpesaConfirm.value;
    if (!phone.startsWith('254')) {
        phone = convertTo254Format(phone);
        mpesaConfirm.value = phone;
    }
    
    // Show processing status
    updatePaymentStatus('processing', 'Initiating M-Pesa payment...');
    
    const stkPushBtn = document.getElementById('stkPushBtn');
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
                loanId: generateLoanId()
            })
        });
        
        if (response.success) {
            updatePaymentStatus('processing', 'Check your phone for M-Pesa prompt...');
            // Start polling for payment confirmation
            startPaymentPolling(response.checkoutRequestId);
        } else {
            updatePaymentStatus('failed', response.message || 'Payment initiation failed');
            resetSTKPushButton();
        }
    } catch (error) {
        console.error('STK Push error:', error);
        // For demo purposes, simulate success
        updatePaymentStatus('success', 'Payment successful! (Demo mode)');
        enableReceiptDownload();
        resetSTKPushButton();
    }
}

function updatePaymentStatus(status, message) {
    const statusEl = document.getElementById('paymentStatus');
    if (!statusEl) return;
    
    statusEl.className = `payment-status ${status}`;
    statusEl.textContent = message;
}

function startPaymentPolling(checkoutRequestId) {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    
    const pollInterval = setInterval(async () => {
        attempts++;
        
        if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            updatePaymentStatus('failed', 'Payment timeout. Please try again.');
            resetSTKPushButton();
            return;
        }
        
        try {
            // Poll backend for payment status
            const response = await callAPI(`${API_CONFIG.endpoints.loanStatus}?checkoutRequestId=${checkoutRequestId}`);
            
            if (response.status === 'success') {
                clearInterval(pollInterval);
                updatePaymentStatus('success', 'Payment confirmed! Transaction: ' + response.receiptNumber);
                enableReceiptDownload();
                resetSTKPushButton();
            }
        } catch (error) {
            console.log('Polling...');
        }
    }, 1000);
}

function resetSTKPushButton() {
    const stkPushBtn = document.getElementById('stkPushBtn');
    if (stkPushBtn) {
        stkPushBtn.disabled = false;
        stkPushBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Pay via M-Pesa';
    }
}

// ============================================
// RECEIPT DOWNLOAD FUNCTIONALITY
// ============================================
function initReceiptDownload() {
    const downloadBtn = document.getElementById('downloadReceipt');
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadReceipt);
    }
}

function enableReceiptDownload() {
    const downloadBtn = document.getElementById('downloadReceipt');
    if (downloadBtn) {
        downloadBtn.disabled = false;
    }
}

async function downloadReceipt() {
    const receiptBtn = document.getElementById('downloadReceipt');
    if (receiptBtn) {
        receiptBtn.disabled = true;
        receiptBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    }
    
    try {
        // Call backend to generate receipt PDF
        const response = await callAPI(API_CONFIG.endpoints.generateReceipt, {
            method: 'POST',
            body: JSON.stringify({
                loanId: document.getElementById('loanId')?.textContent || generateLoanId(),
                studentName: document.getElementById('fullName')?.value,
                studentId: document.getElementById('studentId')?.value,
                amount: document.getElementById('loanAmount')?.value,
                receiptNumber: generateReceiptNumber(),
                date: new Date().toISOString()
            })
        });
        
        if (response.success && response.pdfUrl) {
            // Download the PDF
            window.open(response.pdfUrl, '_blank');
        } else {
            // Demo: Create a simple receipt
            createDemoReceipt();
        }
    } catch (error) {
        console.error('Receipt generation error:', error);
        // Demo: Create a simple receipt
        createDemoReceipt();
    } finally {
        if (receiptBtn) {
            receiptBtn.disabled = false;
            receiptBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Download Receipt';
        }
    }
}

function createDemoReceipt() {
    const receiptContent = `
        STUDENT WELFARE ASSOCIATION (SWA)
        ================================
        Jaramogi Oginga Odinga University
        
        RECEIPT
        ------
        Receipt #: ${generateReceiptNumber()}
        Date: ${new Date().toLocaleDateString()}
        
        Student Name: ${document.getElementById('fullName')?.value || 'N/A'}
        Student ID: ${document.getElementById('studentId')?.value || 'N/A'}
        
        Loan Amount: Ksh ${parseFloat(document.getElementById('loanAmount')?.value || 0).toLocaleString()}
        Interest (5%): Ksh ${(parseFloat(document.getElementById('loanAmount')?.value || 0) * 0.05).toLocaleString()}
        Total: Ksh ${(parseFloat(document.getElementById('loanAmount')?.value || 0) * 1.05).toLocaleString()}
        
        Payment Method: M-Pesa
        Status: PAID
        
        ================================
        Thank you for choosing SWA!
    `;
    
    // Create a blob and download
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SWA_Receipt_${generateReceiptNumber()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccessMessage('Receipt downloaded successfully!');
}

// ============================================
// AUTHENTICATION LAYER (Auto-fill from profile)
// ============================================
async function initAuthentication() {
    // Check for logged in user first from localStorage
    const localUserData = getLoggedInUser();
    let mergedData = localUserData;
    
    // Try to fetch latest user data from database API
    try {
        const apiUserData = await fetchUserFromAPI();
        if (apiUserData) {
            // Merge with local data - API data takes priority for latest values
            mergedData = { ...localUserData, ...apiUserData };
            autoFillUserData(mergedData);
            
            // Load eligibility and pre-fill loan amount
            await loadMemberEligibility();
            return;
        }
    } catch (e) {
        console.log('Could not fetch user from API, using local data');
    }
    
    // Fall back to localStorage data
    if (localUserData) {
        autoFillUserData(localUserData);
    }
}

async function loadMemberEligibility() {
    const amountInput = document.getElementById('loanAmount');
    if (!amountInput) return;
    
    try {
        // Use loanService.getEligibility() - same criteria used by member portal
        const result = await loanService.getEligibility();
        
        if (result.success && result.data) {
            const eligibility = result.data;
            const eligibleAmount = eligibility.maxLoan || 1000;
            
            // Set the amount field
            amountInput.value = eligibleAmount;
            // Also set max attribute to prevent exceeding
            amountInput.max = eligibleAmount;
            
            // Update placeholder to show eligibility
            amountInput.placeholder = `Max: Ksh ${eligibleAmount.toLocaleString()}`;
            
            // Show eligibility message
            const formGroup = amountInput.closest('.form-group');
            if (formGroup) {
                let note = formGroup.querySelector('.field-note');
                if (!note) {
                    note = document.createElement('small');
                    note.className = 'field-note';
                    amountInput.parentElement.appendChild(document.createElement('br'));
                    amountInput.parentElement.appendChild(note);
                }
                note.textContent = `You are eligible for up to Ksh ${eligibleAmount.toLocaleString()}`;
            }
            
            // Also show detailed eligibility status
            const eligibilityEl = document.getElementById('eligibilityCheck');
            if (eligibilityEl && !eligibility.eligible) {
                eligibilityEl.className = 'eligibility-check error show';
                eligibilityEl.innerHTML = '<i class="fas fa-times-circle"></i> ' + (eligibility.message || 'You do not qualify for a loan');
            }
        }
    } catch (e) {
        console.log('Could not load member eligibility:', e);
    }
}

function getLoggedInUser() {
    // Check for swa_user (used by the main app)
    const swaUser = localStorage.getItem('swa_user');
    if (swaUser) {
        try {
            return JSON.parse(swaUser);
        } catch (e) {
            // Continue to other checks
        }
    }
    
    // Also check userSession for backwards compatibility
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
        try {
            return JSON.parse(userSession);
        } catch (e) {
            return null;
        }
    }
    return null;
}

async function fetchUserFromAPI() {
    const token = localStorage.getItem('swa_auth_token');
    if (!token) return null;
    
    try {
        const response = await fetch('/api/users/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                // Transform API response to our expected format
                const user = result.data.user;
                const member = result.data.member;
                return {
                    name: user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.name || user.email,
                    email: user.email,
                    phone: member?.phone || user.phone,
                    studentId: member?.memberNumber || user.studentId
                };
            }
        }
    } catch (e) {
        console.log('API fetch error:', e);
    }
    return null;
}

function autoFillUserData(userData) {
    const userInfoBar = document.getElementById('userInfoBar');
    const fullNameInput = document.getElementById('fullName');
    const studentIdInput = document.getElementById('studentId');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    const userNameEl = document.getElementById('userName');
    const userStudentIdEl = document.getElementById('userStudentId');
    const userEmailEl = document.getElementById('userEmail');
    
    // Normalize user data - handle different field names from different sources
    const normalizedData = {
        name: userData.name || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : null),
        email: userData.email,
        phone: userData.phone,
        studentId: userData.studentId || userData.memberNumber
    };
    
    // Show user info bar
    if (userInfoBar) userInfoBar.classList.add('show');
    
    // Auto-fill form fields (only if data is available)
    if (fullNameInput && normalizedData.name) {
        fullNameInput.value = normalizedData.name;
        fullNameInput.readOnly = true;
        fullNameInput.parentElement?.querySelector('.required')?.classList.remove('required');
    }
    if (studentIdInput && normalizedData.studentId) {
        studentIdInput.value = normalizedData.studentId;
        studentIdInput.readOnly = true;
        studentIdInput.parentElement?.querySelector('.required')?.classList.remove('required');
    }
    if (emailInput && normalizedData.email) {
        emailInput.value = normalizedData.email;
        emailInput.readOnly = true;
        emailInput.parentElement?.querySelector('.required')?.classList.remove('required');
    }
    if (phoneInput && normalizedData.phone) {
        phoneInput.value = normalizedData.phone;
    }
    
    // Update user info display
    if (userNameEl) userNameEl.textContent = normalizedData.name || 'N/A';
    if (userStudentIdEl) userStudentIdEl.textContent = normalizedData.studentId || 'N/A';
    if (userEmailEl) userEmailEl.textContent = normalizedData.email || 'N/A';
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (await showConfirm('Are you sure you want to logout?')) {
                localStorage.removeItem('userSession');
                window.location.href = '../../index.html';
            }
        });
    }
}

// ============================================
// GUARANTOR DROPDOWN
// ============================================
async function initGuarantorDropdown() {
    const guarantorSelect = document.getElementById('guarantorSelect');
    if (!guarantorSelect) return;
    
    const token = localStorage.getItem('swa_auth_token');
    
    // Fetch members list from API
    try {
        const response = await fetch('/api/members/list', {
            headers: token ? {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            } : { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                const members = result.data;
                
                // Populate dropdown
                members.forEach(member => {
                    const option = document.createElement('option');
                    option.value = member.id;
                    option.textContent = `${member.name} (${member.memberNumber})`;
                    option.dataset.name = member.name;
                    option.dataset.studentId = member.memberNumber;
                    option.dataset.phone = member.phone || '';
                    guarantorSelect.appendChild(option);
                });
            }
        } else {
            console.log('Could not load members list:', response.status);
        }
    } catch (e) {
        console.log('Could not load members list:', e);
    }
    
    // Handle selection
    guarantorSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if (selectedOption && selectedOption.value) {
            const guarantorName = document.getElementById('guarantorName');
            const guarantorId = document.getElementById('guarantorId');
            const guarantorPhone = document.getElementById('guarantorPhone');
            
            if (guarantorName) {
                guarantorName.value = selectedOption.dataset.name;
                guarantorName.readOnly = true;
            }
            if (guarantorId) {
                guarantorId.value = selectedOption.dataset.studentId;
                guarantorId.readOnly = true;
            }
            if (guarantorPhone) {
                guarantorPhone.value = selectedOption.dataset.phone || '';
            }
        }
    });
    
    // Allow manual entry - remove readOnly if user types in fields
    const guarantorName = document.getElementById('guarantorName');
    const guarantorId = document.getElementById('guarantorId');
    
    if (guarantorName) {
        guarantorName.addEventListener('input', () => {
            guarantorName.readOnly = false;
            guarantorSelect.value = '';
        });
    }
    if (guarantorId) {
        guarantorId.addEventListener('input', () => {
            guarantorId.readOnly = false;
            guarantorSelect.value = '';
        });
    }
}

// ============================================
// ELIGIBILITY CHECK
// ============================================
function initEligibilityCheck() {
    const studentIdInput = document.getElementById('studentId');
    const guarantorIdInput = document.getElementById('guarantorId');
    
    if (studentIdInput) {
        studentIdInput.addEventListener('change', checkEligibility);
    }
    
    if (guarantorIdInput) {
        guarantorIdInput.addEventListener('change', checkGuarantorStatus);
    }
}

async function checkEligibility() {
    const studentId = document.getElementById('studentId')?.value;
    if (!studentId) return;
    
    const eligibilityEl = document.getElementById('eligibilityCheck');
    if (!eligibilityEl) return;
    
    eligibilityEl.className = 'eligibility-check show';
    eligibilityEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking eligibility...';
    
    try {
        // Call backend API (ready for integration)
        const response = await callAPI(API_CONFIG.endpoints.checkEligibility, {
            method: 'POST',
            body: JSON.stringify({ studentId })
        });
        
        if (response.eligible) {
            eligibilityEl.className = 'eligibility-check success show';
            eligibilityEl.innerHTML = '<i class="fas fa-check-circle"></i> You qualify for this loan';
        } else {
            eligibilityEl.className = 'eligibility-check error show';
            eligibilityEl.innerHTML = '<i class="fas fa-times-circle"></i> ' + (response.reason || 'You do not qualify for this loan');
        }
    } catch (error) {
        // Demo: Always show success
        eligibilityEl.className = 'eligibility-check success show';
        eligibilityEl.innerHTML = '<i class="fas fa-check-circle"></i> You qualify for this loan (Demo)';
    }
}

async function checkGuarantorStatus() {
    const guarantorId = document.getElementById('guarantorId')?.value;
    if (!guarantorId) return;
    
    const riskAlert = document.getElementById('riskAlert');
    if (!riskAlert) return;
    
    try {
        // Call backend API (ready for integration)
        const response = await callAPI(API_CONFIG.endpoints.checkGuarantor, {
            method: 'POST',
            body: JSON.stringify({ guarantorId })
        });
        
        if (response.activeGuarantees >= 2) {
            riskAlert.className = 'risk-alert show';
            document.getElementById('riskMessage').textContent = 
                'Guarantor already has ' + response.activeGuarantees + ' active guarantees';
        } else {
            riskAlert.classList.remove('show');
        }
    } catch (error) {
        // Demo: Check if guarantor already has guarantees
        const hasUnpaidLoan = Math.random() > 0.7; // Simulate 30% chance
        if (hasUnpaidLoan) {
            riskAlert.className = 'risk-alert show';
            document.getElementById('riskMessage').textContent = 
                'Warning: Guarantor already has active loan guarantees';
        }
    }
}

// ============================================
// FORM SUBMISSION
// ============================================
async function submitLoanApplication() {
    const form = document.getElementById('loanApplicationForm');
    
    if (!form) {
        console.error('Form not found');
        return;
    }
    
    // Collect form data
    const formData = new FormData(form);
    
    // Build guarantors array if guarantor info is provided
    const guarantors = [];
    const guarantorName = formData.get('guarantorName');
    const guarantorId = formData.get('guarantorId');
    const guarantorPhone = formData.get('guarantorPhone');
    
    if (guarantorName && guarantorId) {
        guarantors.push({
            name: guarantorName,
            studentId: guarantorId,
            phone: guarantorPhone
        });
    }
    
    const loanData = {
        fullName: formData.get('fullName'),
        studentId: formData.get('studentId'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        principalAmount: parseFloat(formData.get('loanAmount')), // Fixed: backend expects principalAmount
        purpose: formData.get('loanPurpose'), // Fixed: backend expects 'purpose'
        purposeDescription: formData.get('loanPurposeOther'),
        repaymentPeriod: parseInt(formData.get('repaymentPeriod')),
        guarantors: guarantors, // Fixed: backend expects guarantors array
        loanId: generateLoanId(),
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    console.log('Submitting loan data:', loanData); // Debug log

    // Add calculated totals
    const calculation = calculateLoanRepayment();
    loanData.totalRepayment = calculation.totalRepayment;
    loanData.interest = calculation.interest;

    // Validate form data
    if (!validateLoanApplication(loanData)) {
        return;
    }

    // Check for unpaid loans
    const hasUnpaidLoan = await checkForUnpaidLoans(loanData.studentId);
    if (hasUnpaidLoan) {
        showErrorMessage('You have an unpaid loan. Please repay it before applying for a new one.');
        return;
    }

    // Submit the application
    try {
        console.log('=== Submitting Loan Application ===');
        console.log('Loan data being sent:', loanData);
        
        const submitButton = document.getElementById('submitBtn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        }

        const result = await loanService.applyForLoan(loanData);
        
        console.log('API Response:', result);
        
        if (result.success) {
            console.log('✅ Loan application successful:', result);
            showSuccessMessage(result.message || 'Loan application submitted successfully!');
            
            // Show M-Pesa payment section
            const mpesaSection = document.getElementById('mpesaSection');
            if (mpesaSection) mpesaSection.classList.add('show');
            
            // Show application status
            showApplicationStatus('pending');
            
            // Clear draft after successful submission
            clearDraft();
            
            // Update progress to completion
            updateProgressStep(4);
        } else {
            console.error('❌ Loan application failed:', result);
            showErrorMessage(result.message || 'Failed to submit loan application. Please try again.');
        }
    } catch (error) {
        console.error('❌ Error submitting loan application:', error);
        console.error('Error stack:', error.stack);
        showErrorMessage(error.message || 'Failed to submit loan application. Please check your connection and try again.');
    } finally {
        const submitButton = document.getElementById('submitBtn');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application';
        }
    }
}

function showApplicationStatus(status) {
    const statusEl = document.getElementById('applicationStatus');
    const badgeEl = document.getElementById('statusBadge');
    
    if (!statusEl || !badgeEl) return;
    
    statusEl.classList.add('show');
    
    const statusText = {
        'pending': 'Pending Approval',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'disbursed': 'Disbursed',
        'repaid': 'Repaid'
    };
    
    badgeEl.className = `badge ${status}`;
    badgeEl.textContent = statusText[status] || 'Unknown';
}

async function checkForUnpaidLoans(studentId) {
    // Call backend API (ready for integration)
    try {
        const response = await callAPI(`${API_CONFIG.endpoints.loanStatus}?studentId=${studentId}&status=active`);
        return response.hasActiveLoan;
    } catch (error) {
        // Demo: Randomly return false
        return false;
    }
}

function generateLoanId() {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `LN/${year}/${random}`;
}

function generateReceiptNumber() {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-8);
    return `RCP${timestamp}`;
}

// ============================================
// API CALL HELPER
// ============================================
async function callAPI(endpoint, options = {}) {
    // This is a placeholder for actual API calls
    // In production, this would make real fetch calls to the backend
    
    console.log(`API Call to ${endpoint}:`, options);
    
    // For demo purposes, return mock responses
    return {
        success: true,
        message: 'Operation completed (Demo)',
        // Add more mock data as needed
    };
}

// ============================================
// VALIDATION
// ============================================
function validateLoanApplication(data) {
    // Validate student ID format - now accepts any format
    if (!data.studentId || data.studentId.trim() === '') {
        showErrorMessage('Student ID is required');
        return false;
    }
    
    // Validate phone number
    const phonePattern = /^(\+254|0)[0-9]{9}$/;
    const cleanPhone = data.phone.replace(/\s/g, '');
    if (!phonePattern.test(cleanPhone)) {
        showErrorMessage('Invalid phone number format. Use format: 0712 345 678 or 254712345678');
        return false;
    }

    // Validate loan amount
    if (data.loanAmount < 100 || data.loanAmount > 10000) {
        showErrorMessage('Loan amount must be between Ksh 100 and Ksh 10,000');
        return false;
    }

    // Validate guarantor - accepts any format, check guarantors array
    if (!data.guarantors || data.guarantors.length === 0) {
        showErrorMessage('At least one guarantor is required');
        return false;
    }
    
    const guarantor = data.guarantors[0];
    if (!guarantor.studentId || guarantor.studentId.trim() === '') {
        showErrorMessage('Guarantor student ID is required');
        return false;
    }

    return true;
}

// ============================================
// MESSAGE DISPLAY FUNCTIONS
// ============================================
function showSuccessMessage(message) {
    // Remove any existing messages first
    removeExistingMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-notification';
    messageDiv.innerHTML = `
        <div class="success-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <div class="success-content">
            <h4>Application Submitted Successfully!</h4>
            <p>${message}</p>
            <div class="success-details">
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>Status: Under Review</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-envelope"></i>
                    <span>You will receive email updates</span>
                </div>
            </div>
            <button class="btn-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i> Dismiss
            </button>
        </div>
    `;
    
    // Add styles
    messageDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 0;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: slideDown 0.4s ease;
        display: flex;
        align-items: stretch;
    `;
    
    document.body.appendChild(messageDiv);
    
    // Auto-remove after 10 seconds (longer than before)
    setTimeout(() => {
        if (messageDiv && messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 10000);
}

function showErrorMessage(message) {
    // Remove any existing messages first
    removeExistingMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-notification';
    messageDiv.innerHTML = `
        <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="error-content">
            <h4>Application Failed</h4>
            <p>${message}</p>
            <button class="btn-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i> Dismiss
            </button>
        </div>
    `;
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        padding: 0;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: slideDown 0.4s ease;
        display: flex;
        align-items: stretch;
    `;
    
    document.body.appendChild(messageDiv);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (messageDiv && messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 8000);
}

function removeExistingMessages() {
    // Remove any existing success or error notifications
    const existingNotifications = document.querySelectorAll('.success-notification, .error-notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.remove();
        }
    });
}

// Export for potential module use
export { 
    initLoanApplication, 
    validateLoanApplication, 
    calculateLoanRepayment,
    initiateSTKPush,
    downloadReceipt
};
