/**
 * Make Payment Script
 * Handles payment form submission with STK Push, dynamic categories, and more
 * Ready for Fetch API integration
 */

// Import auth service for user data
import { authService } from '../../../services/index.js';


import { showAlert } from '../../../utils/utility-functions.js';
import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';

class PaymentManager {
    constructor() {
        // Configuration
        this.config = {
            apiBaseUrl: '/api', // Base URL for API calls
            stkPushEndpoint: '/payments/stk-push',
            paymentSubmitEndpoint: '/payments/submit',
            loanBalanceEndpoint: '/loans/balance',
            receiptEndpoint: '/payments/receipt',
            defaultAmounts: {
                contribution: 500,
                shares: 1000,
                welfare: 200,
                bereavement: 500,
                loan: 0, // Dynamic based on loan balance
                event: 0, // Dynamic based on event
                fine: 0, // Dynamic based on fine
                registration: 300,
                subscription: 500,
                other: 100
            },
            minAmounts: {
                contribution: 100,
                shares: 100,
                welfare: 50,
                bereavement: 100,
                loan: 100,
                event: 100,
                fine: 50,
                registration: 300,
                subscription: 100,
                other: 100
            },
            phoneRegex: /^254[0-9]{9}$/
        };

        // Initialize
        this.init();
        
        // Prefill user details if logged in
        this.prefillUserData();
        
        // Check for category parameter in URL
        this.handleUrlCategory();
        
        // Check for loan ID in URL (loan payment from loan details page)
        this.handleLoanFromUrl();
        
        // Hide cash option for non-admin users
        this.handleCashOptionForAdmin();
    }
    
    /**
     * Hide cash payment option for non-admin users
     */
    handleCashOptionForAdmin() {
        const user = authService.getCurrentUser();
        const isAdmin = user?.role === 'admin' || user?.role === 'treasurer' || user?.role === 'secretary';
        
        const cashOption = this.paymentMethod?.querySelector('option[value="cash"]');
        const hint = document.getElementById('paymentMethodHint');
        
        if (!isAdmin && cashOption) {
            cashOption.style.display = 'none';
            if (hint) {
                hint.style.display = 'block';
            }
        } else if (cashOption) {
            cashOption.style.display = '';
            if (hint) {
                hint.style.display = 'none';
            }
        }
    }
    
    /**
     * Fetch payment config from API
     */
    async fetchPaymentConfig() {
        try {
            // Get auth token for authenticated request
            const token = localStorage.getItem('swa_auth_token');
            
            const response = await fetch(`${this.config.apiBaseUrl}/payments/config`, {
                headers: token ? {
                    'Authorization': `Bearer ${token}`
                } : {}
            });
            
            // Handle unauthorized - user not logged in
            if (response.status === 401) {
                console.warn('User not authenticated for payment config');
                return; // Silently fail - config is optional
            }
            
            const data = await response.json();
            
            if (data.success && data.data) {
                const config = data.data;
                
                // Update bank details in instructions
                this.updateBankDetails(config.bank || {});
                
                // Update M-Pesa paybill details
                this.updateMpesaDetails(config.mpesa || {});
                
                // Disable unavailable payment methods
                this.updateAvailableMethods(config.availableMethods || []);
            }
        } catch (error) {
            console.error('Error fetching payment config:', error);
        }
    }
    
    /**
     * Update bank details in the payment form instructions
     */
    updateBankDetails(bankConfig, accountName) {
        if (!bankConfig.enabled) return;
        
        // Update bank transfer instructions
        const bankAccountElements = document.querySelectorAll('[data-bank-account]');
        bankAccountElements.forEach(el => {
            if (bankConfig.accountNumber) el.textContent = bankConfig.accountNumber;
        });
        
        const bankNameElements = document.querySelectorAll('[data-bank-name]');
        bankNameElements.forEach(el => {
            if (bankConfig.name) el.textContent = bankConfig.name;
        });
        
        const bankBranchElements = document.querySelectorAll('[data-bank-branch]');
        bankBranchElements.forEach(el => {
            if (bankConfig.branch) el.textContent = bankConfig.branch;
        });
        
        const bankAccountNameElements = document.querySelectorAll('[data-bank-account-name]');
        bankAccountNameElements.forEach(el => {
            if (accountName || bankConfig.accountName) el.textContent = accountName || bankConfig.accountName;
        });
    }
    
    /**
     * Update M-Pesa paybill details in the payment form instructions
     */
    updateMpesaDetails(mpesaConfig) {
        if (!mpesaConfig || !mpesaConfig.enabled) return;
        
        // Update M-Pesa paybill in instructions
        const mpesaPaybillElements = document.querySelectorAll('[data-mpesa-paybill]');
        mpesaPaybillElements.forEach(el => {
            if (mpesaConfig.paybill) el.textContent = mpesaConfig.paybill;
        });
    }
    
    /**
     * Enable/disable payment methods based on config
     */
    updateAvailableMethods(availableMethods) {
        if (!this.paymentMethod) return;
        
        const options = this.paymentMethod.querySelectorAll('option');
        options.forEach(option => {
            const value = option.value;
            if (value && value !== '') {
                option.disabled = !availableMethods.includes(value);
            }
        });
    }

    /**
     * Prefill user details from auth service and member data
     */
    prefillUserData() {
        try {
            // Get user from auth service
            const user = authService.getCurrentUser();
            
            // Get member data from localStorage
            let memberRaw = null;
            const memberDataStr = localStorage.getItem('swa_member_data');
            if (memberDataStr) {
                try {
                    memberRaw = JSON.parse(memberDataStr);
                } catch (e) {
                    console.log('Could not parse member data');
                }
            }
            
            // Handle API response structure: { member: {...}, user: {...} }
            const member = memberRaw?.member || memberRaw?.data?.member || memberRaw;
            const userFromMember = memberRaw?.user || memberRaw?.data?.user || {};
            
            if (!user && !member) {
                console.log('No authenticated user or member data found');
                return;
            }
            
            console.log('Prefilling user data - User:', user, 'Member:', member);
            
            // Build full name
            let fullName = '';
            if (user?.firstName || user?.lastName) {
                fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            } else if (member?.firstName || member?.lastName) {
                fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
            } else if (userFromMember?.firstName || userFromMember?.lastName) {
                fullName = `${userFromMember.firstName || ''} ${userFromMember.lastName || ''}`.trim();
            }
            
            if (fullName && this.fullName) {
                this.fullName.value = fullName;
            }
            
            // Prefill student ID (memberNumber)
            const studentId = member?.memberNumber || userFromMember?.memberNumber || user?.memberId || user?.studentId;
            if (studentId && this.studentId) {
                this.studentId.value = studentId;
            }
            
            // Prefill phone
            const phone = member?.phone || userFromMember?.phone || user?.phone || user?.phoneNumber;
            if (phone && this.phone) {
                this.phone.value = phone;
            }
            
            console.log('User data prefilled successfully');
        } catch (error) {
            console.error('Error prefilling user data:', error);
        }
    }

    /**
     * Handle loan payment from URL parameter
     * Used when navigating from loan details page
     */
    async handleLoanFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const loanId = urlParams.get('loanId');
        
        if (!loanId) {
            return;
        }
        
        console.log('Loan ID found in URL:', loanId);
        
        // Switch to loan category if not already selected
        const loanRadio = document.querySelector('input[name="paymentCategory"][value="loan"]');
        if (loanRadio) {
            loanRadio.checked = true;
            this.updateFormForCategory();
        }
        
        // Fetch loan details and prefill amount
        await this.fetchLoanDetails(loanId);
    }

    /**
     * Fetch loan details from API
     */
    async fetchLoanDetails(loanId) {
        try {
            const token = localStorage.getItem('swa_auth_token');
            if (!token) {
                console.error('No auth token found');
                return;
            }
            
            // Show loading state
            this.updateLoanBalance(0, true);
            
            const response = await fetch(`${this.config.apiBaseUrl}/loans/${loanId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch loan details');
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                const loan = result.data;
                const outstandingBalance = loan.remainingBalance || loan.balance || loan.outstandingBalance || 0;
                
                // Store loan ID for linking payment to loan
                this.currentLoanId = loan.id;
                
                // Update loan balance display
                this.updateLoanBalance(outstandingBalance);
                
                // Prefill amount with outstanding balance (user can edit)
                this.setAmount(outstandingBalance);
                this.updateHint(`Loan repayment - Enter amount to pay (outstanding: Ksh ${parseFloat(outstandingBalance).toLocaleString()})`);
                
                console.log('Loan details loaded, balance:', outstandingBalance);
            } else {
                throw new Error(result.message || 'Failed to load loan details');
            }
        } catch (error) {
            console.error('Error fetching loan details:', error);
            this.updateLoanBalance(0);
            this.showError('Failed to load loan details. Please enter amount manually.');
        }
    }

    handleUrlCategory() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        
        if (category) {
            // Find and select the matching radio button
            const categoryRadio = document.querySelector(`input[name="paymentCategory"][value="${category}"]`);
            if (categoryRadio) {
                categoryRadio.checked = true;
                this.updateFormForCategory();
            }
        }
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.generateReferenceNumber();
        this.updateFormForCategory();
        
        // Fetch payment config from server
        this.fetchPaymentConfig();
    }

    cacheElements() {
        // Form elements
        this.form = document.getElementById('paymentForm');
        this.referenceNumber = document.getElementById('referenceNumber');
        this.fullName = document.getElementById('fullName');
        this.studentId = document.getElementById('studentId');
        this.phone = document.getElementById('phone');
        this.amount = document.getElementById('amount');
        this.amountHint = document.getElementById('amountHint');
        this.paymentMethod = document.getElementById('paymentMethod');
        this.transactionId = document.getElementById('transactionId');
        this.notes = document.getElementById('notes');
        this.paymentStatus = document.getElementById('paymentStatus');
        
        // Category elements
        this.categoryCards = document.querySelectorAll('input[name="paymentCategory"]');
        
        // Dynamic form groups
        this.eventGroup = document.getElementById('eventGroup');
        this.eventSelect = document.getElementById('eventSelect');
        this.loanBalanceGroup = document.getElementById('loanBalanceGroup');
        this.loanBalance = document.getElementById('loanBalance');
        this.recurringGroup = document.getElementById('recurringGroup');
        this.paymentSchedule = document.getElementById('paymentSchedule');
        this.uploadProofGroup = document.getElementById('uploadProofGroup');
        this.paymentProof = document.getElementById('paymentProof');
        
        // Buttons
        this.stkPushBtn = document.getElementById('stkPushBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
        this.lastPaymentReference = null; // Store reference for receipt download
        this.currentLoanId = null; // Store loaded loan ID for loan repayments
        this.currentEventId = null; // Store selected event ID for event payments
        this.currentFineId = null; // Store selected fine ID for fine payments
        
        // Feedback elements
        this.paymentFeedback = document.getElementById('paymentFeedback');
        this.feedbackMessage = document.getElementById('feedbackMessage');
        this.paymentSuccess = document.getElementById('paymentSuccess');
        this.successMessage = document.getElementById('successMessage');
        this.receiptDetails = document.getElementById('receiptDetails');
    }

    bindEvents() {
        // Category change
        this.categoryCards.forEach(card => {
            card.addEventListener('change', () => this.updateFormForCategory());
        });

        // Payment method change
        this.paymentMethod?.addEventListener('change', (e) => this.handlePaymentMethodChange(e));

        // Event selection change
        this.eventSelect?.addEventListener('change', (e) => this.handleEventChange(e));

        // Student ID change (for loan balance lookup)
        this.studentId?.addEventListener('change', () => this.fetchLoanBalance());

        // STK Push button
        this.stkPushBtn?.addEventListener('click', () => this.initiateSTKPush());

        // Cancel button
        this.cancelBtn?.addEventListener('click', () => this.resetForm());

        // Download receipt button
        this.downloadReceiptBtn?.addEventListener('click', () => this.downloadReceipt());

        // Form submission
        this.form?.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Phone input validation
        this.phone?.addEventListener('input', (e) => this.formatPhoneNumber(e));

        // Amount validation
        this.amount?.addEventListener('input', () => this.validateAmount());
    }

    /**
     * Generate unique reference number
     * Format: SWA-YYYY-XXXXXX
     */
    generateReferenceNumber() {
        const year = new Date().getFullYear();
        const randomNum = Math.floor(Math.random() * 900000) + 100000;
        const reference = `SWA-${year}-${randomNum}`;
        
        if (this.referenceNumber) {
            this.referenceNumber.value = reference;
        }
        
        return reference;
    }

    /**
     * Update form based on selected category
     */
    updateFormForCategory() {
        const selectedCategory = document.querySelector('input[name="paymentCategory"]:checked')?.value;
        
        // Reset stored entity IDs when changing category
        if (selectedCategory !== 'loan') {
            this.currentLoanId = null;
        }
        if (selectedCategory !== 'event') {
            this.currentEventId = null;
        }
        if (selectedCategory !== 'fine') {
            this.currentFineId = null;
        }
        
        // Reset all groups
        this.hideAllDynamicGroups();
        
        // Set default amount and show relevant groups
        switch (selectedCategory) {
            case 'contribution':
                this.setAmount(this.config.defaultAmounts.contribution);
                this.setMinAmount(this.config.minAmounts.contribution);
                this.updateHint('Minimum: Ksh ' + this.config.minAmounts.contribution);
                break;
                
            case 'shares':
                this.setAmount(this.config.defaultAmounts.shares);
                this.setMinAmount(this.config.minAmounts.shares);
                this.updateHint('Minimum: Ksh ' + this.config.minAmounts.shares);
                break;
                
            case 'welfare':
                this.setAmount(this.config.defaultAmounts.welfare);
                this.setMinAmount(this.config.minAmounts.welfare);
                this.updateHint('Minimum: Ksh ' + this.config.minAmounts.welfare);
                break;
                
            case 'bereavement':
                this.setAmount(this.config.defaultAmounts.bereavement);
                this.setMinAmount(this.config.minAmounts.bereavement);
                this.updateHint('Minimum: Ksh ' + this.config.minAmounts.bereavement);
                break;
                
            case 'loan':
                this.showElement(this.loanBalanceGroup);
                this.setMinAmount(this.config.minAmounts.loan);
                this.updateHint('Enter amount to pay (minimum: Ksh ' + this.config.minAmounts.loan + ')');
                this.fetchLoanBalance();
                break;
                
            case 'event':
                this.showElement(this.eventGroup);
                this.setMinAmount(this.config.minAmounts.event);
                this.updateHint('Select an event to auto-fill amount');
                break;
                
            case 'fine':
                this.setMinAmount(this.config.minAmounts.fine);
                this.updateHint('Enter fine amount');
                break;
                
            case 'registration':
                this.setAmount(this.config.defaultAmounts.registration);
                this.setMinAmount(this.config.minAmounts.registration);
                this.updateHint('Registration fee: Ksh ' + this.config.defaultAmounts.registration);
                break;
                
            case 'subscription':
                this.showElement(this.recurringGroup);
                this.setAmount(this.config.defaultAmounts.subscription);
                this.setMinAmount(this.config.minAmounts.subscription);
                this.updateHint('Monthly subscription: Ksh ' + this.config.defaultAmounts.subscription);
                break;
                
            case 'other':
            default:
                this.setMinAmount(this.config.minAmounts.other);
                this.updateHint('Minimum: Ksh ' + this.config.minAmounts.other);
                break;
        }
    }

    /**
     * Handle payment method change
     */
    handlePaymentMethodChange(e) {
        const method = e.target.value;
        
        // Check if M-Pesa selected to show reference option
        if (method === 'mpesa') {
            this.showReferenceOption();
        }
        
        // Show/hide transaction ID field
        if (method === 'cash') {
            this.transactionId.disabled = true;
            this.transactionId.placeholder = 'N/A';
            this.hideElement(this.uploadProofGroup);
        } else if (method === 'mpesa' || method === 'bank' || method === 'card') {
            this.transactionId.disabled = false;
            this.transactionId.placeholder = 'Enter transaction ID';
            
            // Show upload proof for manual payments
            if (method === 'bank') {
                this.showElement(this.uploadProofGroup);
            } else {
                this.hideElement(this.uploadProofGroup);
            }
        } else {
            this.transactionId.disabled = true;
            this.hideElement(this.uploadProofGroup);
        }
    }
    
    /**
     * Show payment reference section for manual M-Pesa
     */
    showReferenceOption() {
        // Show generate reference button for manual M-Pesa
        const existingSection = document.getElementById('paymentReferenceSection');
        if (existingSection) {
            existingSection.style.display = 'block';
        }
    }

    /**
     * Handle event selection change
     */
    handleEventChange(e) {
        const selectedOption = e.target?.selectedOptions[0];
        const eventAmount = selectedOption?.getAttribute('data-amount');
        const eventId = e.target?.value;
        
        if (eventAmount) {
            this.setAmount(parseInt(eventAmount));
            this.updateHint('Event fee: Ksh ' + eventAmount);
        }
        
        // Store current event ID
        this.currentEventId = eventId || null;
    }

    /**
     * Fetch loan balance from API
     */
    async fetchLoanBalance() {
        // Since loan balance is already fetched from loan details, we don't need a separate API call
        // The loan balance should be set by fetchLoanDetails method
        console.log('Loan balance already available from loan details, skipping separate API call');
        return;
    }

    /**
     * Update loan balance display
     */
    updateLoanBalance(balance, loading = false) {
        if (this.loanBalance) {
            this.loanBalance.textContent = loading ? 'Loading...' : `Ksh ${balance.toLocaleString()}.00`;
        }
        
        // Set default payment amount to balance if loan
        if (!loading && balance > 0) {
            this.setAmount(balance);
        }
    }

    /**
     * Initiate STK Push (M-Pesa)
     */
    async initiateSTKPush() {
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        const phone = this.phone?.value;
        const amount = this.amount?.value;
        
        // Validate phone number format
        if (!this.validatePhone(phone)) {
            this.showError('Please enter a valid phone number (format: 2547XXXXXXXX)');
            return;
        }
        
        // Show loading state
        this.showLoading('Initiating M-Pesa STK Push... Please check your phone.');
        
        try {
            // Prepare payment data
            const paymentData = this.collectPaymentData();
            paymentData.paymentType = 'stk_push';
            
            // Connect to real API
            const response = await fetch(`${this.config.apiBaseUrl}${this.config.stkPushEndpoint}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('swa_auth_token')}`
                },
                body: JSON.stringify({
                    phone,
                    amount,
                    category: paymentData.category,
                    referenceNumber: this.referenceNumber?.value
                })
            });
            
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || data.errors?.[0]?.msg || 'STK Push failed');
            }
            
            this.showSuccess(data.message || 'Payment initiated! Check your phone for the M-Pesa prompt.');
            
        } catch (error) {
            console.error('STK Push error:', error);
            this.hideLoading();
            this.showError(error.message || 'Failed to initiate payment. Please try again.');
        }
    }

    /**
     * Upload payment proof file
     */
    async uploadPaymentProof(file) {
        if (!file) return null;
        
        const formData = new FormData();
        formData.append('paymentProof', file);
        
        const response = await fetch(`${this.config.apiBaseUrl}/payments/upload-proof`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('swa_auth_token')}`
            },
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            return data.data.fileUrl;
        }
        return null;
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }
        
        // Show loading state
        this.showLoading('Submitting payment...');
        
        try {
            const paymentData = this.collectPaymentData();
            paymentData.paymentType = 'manual';
            
            // Upload payment proof if file selected
            let receiptUrl = null;
            if (this.paymentProof?.files?.length > 0) {
                const file = this.paymentProof.files[0];
                if (file) {
                    this.showLoading('Uploading payment proof...');
                    receiptUrl = await this.uploadPaymentProof(file);
                }
            }
            
            // Add receipt URL to payment data
            if (receiptUrl) {
                paymentData.receipt = receiptUrl;
            }
            
            // Connect to real API
            const response = await fetch(`${this.config.apiBaseUrl}${this.config.paymentSubmitEndpoint}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('swa_auth_token')}`
                },
                body: JSON.stringify(paymentData)
            });
            
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || data.errors?.[0]?.msg || 'Payment submission failed');
            }
            
            // Store the reference from the API response for receipt download
            if (data.data?.reference) {
                this.lastPaymentReference = data.data.reference;
            }
            
            this.showSuccess(data.message || 'Payment submitted successfully!', data.data);
            
        } catch (error) {
            console.error('Payment submission error:', error);
            this.hideLoading();
            this.showError(error.message || 'Failed to submit payment. Please try again.');
        }
    }

    /**
     * Map frontend category to API type
     */
    getTypeFromCategory(category) {
        const categoryToType = {
            'contribution': 'contribution',
            'shares': 'shares',
            'welfare': 'welfare',
            'bereavement': 'bereavement',
            'loan': 'loan_repayment',
            'event': 'event',
            'fine': 'fine',
            'registration': 'registration',
            'subscription': 'subscription',
            'other': 'other'
        };
        return categoryToType[category] || category;
    }

    /**
     * Collect all payment data from form
     */
    collectPaymentData() {
        const formData = new FormData(this.form);
        const category = document.querySelector('input[name="paymentCategory"]:checked')?.value;
        
        const data = {
            referenceNumber: this.referenceNumber?.value,
            fullName: formData.get('fullName'),
            studentId: formData.get('studentId'),
            phone: formData.get('phone'),
            category: category,
            type: this.getTypeFromCategory(category), // Send mapped type as well
            amount: parseFloat(formData.get('amount')),
            paymentMethod: formData.get('paymentMethod'),
            transactionId: formData.get('transactionId'),
            event: formData.get('eventSelect'),
            paymentSchedule: formData.get('paymentSchedule'),
            notes: formData.get('notes'),
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        // Add related ID based on payment category (ensure string IDs)
        switch (category) {
            case 'loan':
            case 'loan_repayment':
                if (this.currentLoanId && typeof this.currentLoanId === 'string') {
                    data.relatedTo = this.currentLoanId;
                }
                break;
            case 'event':
                if (this.currentEventId && typeof this.currentEventId === 'string') {
                    data.relatedTo = this.currentEventId;
                }
                break;
            case 'fine':
                if (this.currentFineId && typeof this.currentFineId === 'string') {
                    data.relatedTo = this.currentFineId;
                }
                break;
            case 'bereavement':
                // Could load bereavement ID from selection if needed
                break;
            case 'contribution':
            case 'shares':
            case 'welfare':
            default:
                // No specific ID needed for these
                break;
        }
        
        return data;
    }

    /**
     * Validate form before submission
     */
    validateForm() {
        const errors = [];
        
        // Validate required fields
        if (!this.fullName?.value?.trim()) {
            errors.push('Full name is required');
        }
        
        if (!this.studentId?.value?.trim()) {
            errors.push('Student ID is required');
        }
        
        if (!this.phone?.value?.trim()) {
            errors.push('Phone number is required');
        } else if (!this.validatePhone(this.phone.value)) {
            errors.push('Invalid phone number format (use 2547XXXXXXXX)');
        }
        
        if (!this.amount?.value || parseFloat(this.amount.value) < 100) {
            errors.push('Amount must be at least Ksh 100');
        }
        
        if (!this.paymentMethod?.value) {
            errors.push('Payment method is required');
        }
        
        // Validate event selection for event category
        const category = document.querySelector('input[name="paymentCategory"]:checked')?.value;
        if (category === 'event' && !this.eventSelect?.value) {
            errors.push('Please select an event');
        }
        
        if (errors.length > 0) {
            this.showError(errors.join('\n'));
            return false;
        }
        
        return true;
    }

    /**
     * Validate phone number format
     */
    validatePhone(phone) {
        return this.config.phoneRegex.test(phone);
    }

    /**
     * Format phone number as user types
     * Converts any format to 254XXXXXXXXX
     */
    formatPhoneNumber(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        // Handle various input formats and convert to 254XXXXXXXXX
        if (value.length > 0) {
            // If starts with +, remove it first (already done by replace but double check)
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
                // Look for 7 or 1 after potential country code
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
        
        e.target.value = value;
    }

    /**
     * Validate amount
     */
    validateAmount() {
        const category = document.querySelector('input[name="paymentCategory"]:checked')?.value;
        const minAmount = this.config.minAmounts[category] || 100;
        const currentAmount = parseFloat(this.amount?.value) || 0;
        
        if (currentAmount < minAmount) {
            this.amount?.setCustomValidity(`Minimum amount is Ksh ${minAmount}`);
        } else {
            this.amount?.setCustomValidity('');
        }
    }

    /**
     * Show success message
     */
    showSuccess(message, paymentData = null) {
        this.hideLoading();
        
        if (this.successMessage) {
            this.successMessage.textContent = message;
        }
        
        // Generate receipt details
        if (paymentData && this.receiptDetails) {
            // Get current form values if paymentData is incomplete
            const reference = paymentData.referenceNumber || this.referenceNumber?.value || 'N/A';
            const fullName = paymentData.fullName || this.fullName?.value || 'N/A';
            const studentId = paymentData.studentId || this.studentId?.value || 'N/A';
            const amount = paymentData.amount || this.amount?.value || 0;
            const category = paymentData.category || document.querySelector('input[name="paymentCategory"]:checked')?.value || 'N/A';
            const paymentMethod = paymentData.paymentMethod || this.paymentMethod?.value || 'N/A';
            
            this.receiptDetails.innerHTML = `
                <p><strong>Reference:</strong> ${reference}</p>
                <p><strong>Name:</strong> ${fullName}</p>
                <p><strong>Student ID:</strong> ${studentId}</p>
                <p><strong>Amount:</strong> Ksh ${parseFloat(amount).toLocaleString()}</p>
                <p><strong>Category:</strong> ${category}</p>
                <p><strong>Method:</strong> ${paymentMethod}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            `;
        }
        
        this.showElement(this.paymentSuccess);
        this.updatePaymentStatus('completed');
        
        // Store the reference used for this payment before generating a new one
        this.lastPaymentReference = this.referenceNumber?.value;
        
        // Generate new reference for next payment
        this.generateReferenceNumber();
    }

    /**
     * Show error message
     */
    showError(message) {
        showAlert(`Error: ` + message);
    }

    /**
     * Show loading state
     */
    showLoading(message) {
        if (this.feedbackMessage) {
            this.feedbackMessage.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
        }
        this.showElement(this.paymentFeedback);
        this.hideElement(this.paymentSuccess);
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.hideElement(this.paymentFeedback);
    }

    /**
     * Update payment status display
     */
    updatePaymentStatus(status) {
        if (this.paymentStatus) {
            this.paymentStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            
            // Update status badge class
            const statusBadge = this.paymentStatus.parentElement;
            statusBadge.className = 'status-badge';
            statusBadge.classList.add(`status-${status}`);
        }
    }

    /**
     * Download PDF receipt
     * Note: This now uses the backend PDF generation service
     */
    async downloadReceipt() {
        // Use the stored reference from the last successful payment
        const reference = this.lastPaymentReference || this.referenceNumber?.value;
        const studentId = this.studentId?.value;
        
        if (!reference || !studentId) {
            this.showError('Reference number and Student ID are required');
            return;
        }
        
        try {
            // Call the PDF receipt generation API (no query parameters)
            const response = await fetch(`${this.config.apiBaseUrl}${this.config.receiptEndpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('swa_auth_token')}`
                },
                body: JSON.stringify({
                    reference: reference,  // Backend expects 'reference', not 'referenceNumber'
                    studentId: studentId   // Backend expects 'studentId'
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to generate receipt');
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Show success message
                this.showSuccess('Receipt generated successfully!');
                
                // Display the HTML receipt in a new window/tab
                if (result.data.htmlContent) {
                    // Open receipt in a new window
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                        printWindow.document.write(result.data.htmlContent);
                        printWindow.document.close();
                        // Add print button
                        setTimeout(() => {
                            const printBtn = printWindow.document.createElement('button');
                            printBtn.textContent = 'Print Receipt';
                            printBtn.className = 'btn btn-primary';
                            printBtn.style.marginTop = '20px';
                            printBtn.onclick = () => printWindow.print();
                            printWindow.document.body.appendChild(printBtn);
                        }, 500);
                    }
                }
                
                // Show receipt details
                const category = document.querySelector('input[name="paymentCategory"]:checked')?.value || 'N/A';
                const paymentMethod = this.paymentMethod?.value || 'N/A';
                
                if (this.receiptDetails) {
                    this.receiptDetails.innerHTML = `
                        <p><strong>Receipt Status:</strong> Ready</p>
                        <p><strong>Reference:</strong> ${reference}</p>
                        <p><strong>Name:</strong> ${this.fullName?.value || 'N/A'}</p>
                        <p><strong>Student ID:</strong> ${studentId}</p>
                        <p><strong>Amount:</strong> Ksh ${parseFloat(this.amount?.value || 0).toLocaleString()}</p>
                        <p><strong>Category:</strong> ${category}</p>
                        <p><strong>Method:</strong> ${paymentMethod}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    `;
                }
                
            } else {
                this.showError('Failed to generate receipt: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Receipt download error:', error);
            this.showError('Failed to generate receipt: ' + error.message);
        }
    }

    /**
     * Reset form
     */
    resetForm() {
        this.form?.reset();
        this.generateReferenceNumber();
        this.updateFormForCategory();
        this.hideElement(this.paymentSuccess);
        this.hideElement(this.paymentFeedback);
        this.updatePaymentStatus('pending');
    }

    // Helper methods
    setAmount(value) {
        if (this.amount) {
            this.amount.value = value;
        }
    }

    setMinAmount(value) {
        if (this.amount) {
            this.amount.min = value;
        }
    }

    updateHint(text) {
        if (this.amountHint) {
            this.amountHint.textContent = text;
        }
    }

    showElement(element) {
        if (element) {
            element.style.display = 'block';
        }
    }

    hideElement(element) {
        if (element) {
            element.style.display = 'none';
        }
    }

    hideAllDynamicGroups() {
        this.hideElement(this.eventGroup);
        this.hideElement(this.loanBalanceGroup);
        this.hideElement(this.recurringGroup);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.paymentManager = new PaymentManager();
});

// Handle Generate Payment Reference Form
document.addEventListener('DOMContentLoaded', () => {
    const referenceForm = document.getElementById('referenceForm');
    if (referenceForm) {
        referenceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const type = document.getElementById('refPaymentType')?.value;
            const amount = document.getElementById('refAmount')?.value;
            const token = localStorage.getItem('swa_auth_token');
            
            if (!token) {
                showAlert('Please login first', 'Information', 'info');
                return;
            }
            
            try {
                const response = await fetch('/api/mpesa/create-reference', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ type, amount: parseFloat(amount) })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Show reference result
                    document.getElementById('referenceForm').style.display = 'none';
                    document.getElementById('referenceResult').style.display = 'block';
                    
                    document.getElementById('generatedReference').textContent = data.data.reference;
                    document.getElementById('refPaybill').textContent = data.data.mpesaPaybill || '123456';
                    document.getElementById('refAccountNo').textContent = data.data.reference;
                } else {
                    showAlert(data.message || 'Error generating reference', 'Error', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Error generating reference', 'Error', 'error');
            }
        });
    }
});
