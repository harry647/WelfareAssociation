/**
 * Donations Page Script
 * Handles all donation form interactions with Fetch API integration
 * 
 * @version 1.1.0
 */

class DonationsPage {
    constructor() {
        // API Configuration
        this.config = {
            apiBaseUrl: '/api',
            endpoints: {
                oneTimeDonation: '/donations/one-time',
                monthlyDonation: '/donations/monthly',
                scholarship: '/donations/scholarship',
                corporate: '/donations/corporate',
                inkind: '/donations/inkind'
            },
            phoneRegex: /^254[0-9]{9}$/,
            minAmounts: {
                oneTime: 100,
                monthly: 100,
                scholarship: 1000,
                inkind: 1
            }
        };

        // State
        this.currentDonationType = null;
        
        // Initialize
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.setDefaultDates();
    }

    cacheElements() {
        // Modal elements
        this.modal = document.getElementById('donationModal');
        this.modalClose = document.querySelector('.donation-modal-close');
        this.modalTitle = document.getElementById('donationModalTitle');
        this.modalDescription = document.getElementById('donationModalDescription');
        
        // Forms
        this.oneTimeForm = document.getElementById('oneTimeDonationForm');
        this.monthlyForm = document.getElementById('monthlyDonationForm');
        this.scholarshipForm = document.getElementById('scholarshipForm');
        this.corporateForm = document.getElementById('corporateForm');
        this.inkindForm = document.getElementById('inkindForm');
        
        // Feedback elements
        this.formFeedback = document.getElementById('donationFormFeedback');
        this.feedbackText = document.getElementById('feedbackText');
        this.successMessage = document.getElementById('donationSuccessMessage');
        this.successText = document.getElementById('successText');
        this.closeSuccessBtn = document.getElementById('closeSuccessBtn');
        
        // Buttons
        this.donateButtons = document.querySelectorAll('.donate-btn');
        
        // Payment method change for one-time donation
        this.donationPaymentMethod = document.getElementById('donationPaymentMethod');
        this.transactionIdGroup = document.getElementById('transactionIdGroup');
        
        // Scholarship amount toggle
        this.sponsorshipType = document.getElementById('sponsorshipType');
        this.customAmountGroup = document.getElementById('customAmountGroup');
    }

    bindEvents() {
        // Donation button clicks
        this.donateButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const donationType = btn.getAttribute('data-donation-type');
                this.openDonationForm(donationType);
            });
        });

        // Modal close
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => this.closeModal());
        }

        // Click outside modal
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }

        // Form submissions
        this.oneTimeForm?.addEventListener('submit', (e) => this.handleOneTimeSubmit(e));
        this.monthlyForm?.addEventListener('submit', (e) => this.handleMonthlySubmit(e));
        this.scholarshipForm?.addEventListener('submit', (e) => this.handleScholarshipSubmit(e));
        this.corporateForm?.addEventListener('submit', (e) => this.handleCorporateSubmit(e));
        this.inkindForm?.addEventListener('submit', (e) => this.handleInkindSubmit(e));

        // Payment method change
        this.donationPaymentMethod?.addEventListener('change', (e) => this.handlePaymentMethodChange(e));

        // Sponsorship type change
        this.sponsorshipType?.addEventListener('change', (e) => this.handleSponsorshipTypeChange(e));

        // Close success message
        this.closeSuccessBtn?.addEventListener('click', () => this.closeModal());
        
        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    setDefaultDates() {
        // Set minimum date for monthly start date
        const startDateInput = document.getElementById('monthlyStartDate');
        if (startDateInput) {
            const today = new Date().toISOString().split('T')[0];
            startDateInput.min = today;
        }
    }

    /**
     * Open donation form modal
     */
    openDonationForm(type) {
        this.currentDonationType = type;
        
        // Hide all forms first
        this.hideAllForms();
        
        // Show modal
        if (this.modal) {
            this.modal.style.display = 'block';
        }
        
        // Show appropriate form and set title
        switch (type) {
            case 'one-time':
                this.modalTitle.textContent = 'Make a One-Time Donation';
                this.modalDescription.textContent = 'Your generous donation will help support students in need.';
                this.oneTimeForm.style.display = 'block';
                break;
            case 'monthly':
                this.modalTitle.textContent = 'Set Up Monthly Giving';
                this.modalDescription.textContent = 'Become a monthly donor and provide consistent support.';
                this.monthlyForm.style.display = 'block';
                break;
            case 'scholarship':
                this.modalTitle.textContent = 'Scholarship Sponsorship';
                this.modalDescription.textContent = 'Sponsor a student\'s education and change their future.';
                this.scholarshipForm.style.display = 'block';
                break;
            case 'corporate':
                this.modalTitle.textContent = 'Corporate Partnership';
                this.modalDescription.textContent = 'Partner with us to make a larger impact.';
                this.corporateForm.style.display = 'block';
                break;
            case 'inkind':
                this.modalTitle.textContent = 'In-Kind Donation';
                this.modalDescription.textContent = 'Donate materials that can benefit students.';
                this.inkindForm.style.display = 'block';
                break;
            default:
                this.closeModal();
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        this.resetForms();
    }

    /**
     * Hide all forms
     */
    hideAllForms() {
        const forms = document.querySelectorAll('.donation-form');
        forms.forEach(form => form.style.display = 'none');
        
        if (this.formFeedback) {
            this.formFeedback.style.display = 'none';
        }
        if (this.successMessage) {
            this.successMessage.style.display = 'none';
        }
    }

    /**
     * Reset all forms
     */
    resetForms() {
        const forms = document.querySelectorAll('.donation-form');
        forms.forEach(form => form.reset());
        
        if (this.formFeedback) {
            this.formFeedback.style.display = 'none';
        }
        if (this.successMessage) {
            this.successMessage.style.display = 'none';
        }
        
        this.currentDonationType = null;
    }

    /**
     * Handle payment method change
     */
    handlePaymentMethodChange(e) {
        const method = e.target.value;
        if (this.transactionIdGroup) {
            if (method === 'mpesa' || method === 'bank') {
                this.transactionIdGroup.style.display = 'block';
            } else {
                this.transactionIdGroup.style.display = 'none';
            }
        }
    }

    /**
     * Handle sponsorship type change
     */
    handleSponsorshipTypeChange(e) {
        if (this.customAmountGroup) {
            if (e.target.value === 'custom') {
                this.customAmountGroup.style.display = 'block';
            } else {
                this.customAmountGroup.style.display = 'none';
            }
        }
    }

    /**
     * Show loading state
     */
    showLoading(message = 'Processing...') {
        this.hideAllForms();
        if (this.formFeedback) {
            this.formFeedback.style.display = 'block';
            this.feedbackText.textContent = message;
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        if (this.formFeedback) {
            this.formFeedback.style.display = 'none';
        }
        if (this.successMessage) {
            this.successMessage.style.display = 'block';
            this.successText.textContent = message;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (this.formFeedback) {
            this.formFeedback.style.display = 'none';
        }
        if (this.successMessage) {
            this.successMessage.style.display = 'block';
            this.successMessage.style.backgroundColor = '#fee';
            this.successMessage.style.border = '1px solid #fcc';
            this.successMessage.style.color = '#c33';
            const icon = this.successMessage.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-exclamation-triangle';
            }
            const title = this.successMessage.querySelector('h3');
            if (title) {
                title.textContent = 'Error';
            }
            this.successText.textContent = message;
        }
    }

    /**
     * Validate phone number
     */
    validatePhone(phone) {
        if (!phone) return true; // Phone is optional
        return this.config.phoneRegex.test(phone);
    }

    /**
     * Handle One-Time Donation Submit
     */
    async handleOneTimeSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Validate
        const amount = parseFloat(formData.get('donationAmount'));
        if (amount < this.config.minAmounts.oneTime) {
            alert(`Minimum donation amount is Ksh ${this.config.minAmounts.oneTime}`);
            return;
        }
        
        const phone = formData.get('donorPhone');
        if (phone && !this.validatePhone(phone)) {
            alert('Please enter a valid phone number (format: 254XXXXXXXXX)');
            return;
        }
        
        // Show loading
        this.showLoading('Submitting your donation...');
        
        // Prepare data
        const donationData = {
            donorName: formData.get('donorName'),
            donorEmail: formData.get('donorEmail'),
            donorPhone: formData.get('donorPhone'),
            amount: amount,
            paymentMethod: formData.get('donationPaymentMethod'),
            transactionId: formData.get('donorTransactionId'),
            message: formData.get('donorMessage'),
            anonymous: formData.get('donorAnonymous') === 'on'
        };
        
        try {
            // Real API call
            const response = await this.submitDonation(donationData, this.config.endpoints.oneTimeDonation);
            
            this.showSuccess('Thank you for your generous donation! We have received your submission and will contact you shortly.');
            
        } catch (error) {
            console.error('Donation error:', error);
            this.hideAllForms();
            this.oneTimeForm.style.display = 'block';
            
            // Show more specific error message
            const errorMessage = error.response?.data?.message || 'Failed to submit donation. Please try again or contact us directly.';
            this.showError(errorMessage);
        }
    }

    /**
     * Handle Monthly Donation Submit
     */
    async handleMonthlySubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Validate
        const amount = parseFloat(formData.get('monthlyAmount'));
        if (amount < this.config.minAmounts.monthly) {
            alert(`Minimum monthly donation amount is Ksh ${this.config.minAmounts.monthly}`);
            return;
        }
        
        const phone = formData.get('monthlyDonorPhone');
        if (!this.validatePhone(phone)) {
            alert('Please enter a valid phone number (format: 254XXXXXXXXX)');
            return;
        }
        
        // Show loading
        this.showLoading('Setting up your monthly donation...');
        
        // Prepare data
        const donationData = {
            donorName: formData.get('monthlyDonorName'),
            donorEmail: formData.get('monthlyDonorEmail'),
            donorPhone: phone,
            amount: amount,
            startDate: formData.get('monthlyStartDate'),
            duration: formData.get('monthlyDuration'),
            message: formData.get('monthlyDonorMessage')
        };
        
        try {
            // Real API call
            const response = await this.submitDonation(donationData, this.config.endpoints.monthlyDonation);
            
            this.showSuccess('Thank you for committing to monthly giving! We will contact you to set up the recurring payment.');
            
        } catch (error) {
            console.error('Monthly donation error:', error);
            this.hideAllForms();
            this.monthlyForm.style.display = 'block';
            
            // Show more specific error message
            const errorMessage = error.response?.data?.message || 'Failed to set up monthly donation. Please try again or contact us directly.';
            this.showError(errorMessage);
        }
    }

    /**
     * Handle Scholarship Submit
     */
    async handleScholarshipSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Validate
        const sponsorshipType = formData.get('sponsorshipType');
        let amount = 0;
        
        if (sponsorshipType === 'full') {
            amount = 50000; // Full scholarship
        } else if (sponsorshipType === 'semester') {
            amount = 25000;
        } else if (sponsorshipType === 'partial') {
            amount = 10000;
        } else if (sponsorshipType === 'custom') {
            amount = parseFloat(formData.get('scholarshipAmount'));
            if (amount < this.config.minAmounts.scholarship) {
                alert(`Minimum scholarship amount is Ksh ${this.config.minAmounts.scholarship}`);
                return;
            }
        }
        
        // Show loading
        this.showLoading('Submitting your sponsorship inquiry...');
        
        // Prepare data
        const donationData = {
            donorName: formData.get('scholarName'),
            donorEmail: formData.get('scholarEmail'),
            donorPhone: formData.get('scholarPhone'),
            sponsorshipType: sponsorshipType,
            amount: amount,
            duration: formData.get('scholarshipDuration'),
            focusArea: formData.get('scholarshipFocus'),
            message: formData.get('scholarshipMessage'),
            anonymous: formData.get('scholarshipAnonymous') === 'on'
        };
        
        try {
            // Real API call
            const response = await this.submitDonation(donationData, this.config.endpoints.scholarship);
            
            this.showSuccess('Thank you for your interest in sponsoring a student! We will contact you shortly to discuss the details.');
            
        } catch (error) {
            console.error('Scholarship error:', error);
            this.hideAllForms();
            this.scholarshipForm.style.display = 'block';
            
            // Show more specific error message
            const errorMessage = error.response?.data?.message || 'Failed to submit inquiry. Please try again or contact us directly.';
            this.showError(errorMessage);
        }
    }

    /**
     * Handle Corporate Partnership Submit
     */
    async handleCorporateSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Show loading
        this.showLoading('Submitting your partnership inquiry...');
        
        // Prepare data
        const donationData = {
            companyName: formData.get('companyName'),
            contactPerson: formData.get('contactPerson'),
            companyEmail: formData.get('companyEmail'),
            companyPhone: formData.get('companyPhone'),
            partnershipType: formData.get('partnershipType'),
            proposedContribution: formData.get('proposedContribution'),
            message: formData.get('companyMessage')
        };
        
        try {
            // Real API call
            const response = await this.submitDonation(donationData, this.config.endpoints.corporate);
            
            this.showSuccess('Thank you for your interest in partnering with us! Our team will contact you shortly to discuss opportunities.');
            
        } catch (error) {
            console.error('Corporate partnership error:', error);
            this.hideAllForms();
            this.corporateForm.style.display = 'block';
            
            // Show more specific error message
            const errorMessage = error.response?.data?.message || 'Failed to submit inquiry. Please try again or contact us directly.';
            this.showError(errorMessage);
        }
    }

    /**
     * Handle In-Kind Donation Submit
     */
    async handleInkindSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Show loading
        this.showLoading('Submitting your in-kind donation...');
        
        // Prepare data
        const donationData = {
            donorName: formData.get('inkindName'),
            donorEmail: formData.get('inkindEmail'),
            donorPhone: formData.get('inkindPhone'),
            category: formData.get('donationCategory'),
            itemDescription: formData.get('itemDescription'),
            quantity: formData.get('itemQuantity'),
            condition: formData.get('itemCondition'),
            pickupOption: formData.get('pickupOption'),
            message: formData.get('inkindMessage')
        };
        
        try {
            // Real API call
            const response = await this.submitDonation(donationData, this.config.endpoints.inkind);
            
            this.showSuccess('Thank you for your in-kind donation! We will contact you shortly to arrange the details.');
            
        } catch (error) {
            console.error('In-kind donation error:', error);
            this.hideAllForms();
            this.inkindForm.style.display = 'block';
            
            // Show more specific error message
            const errorMessage = error.response?.data?.message || 'Failed to submit donation. Please try again or contact us directly.';
            this.showError(errorMessage);
        }
    }

    /**
     * Submit donation to API
     */
    async submitDonation(data, endpoint) {
        const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
            error.response = { data: errorData };
            throw error;
        }
        
        return response.json();
    }

    /**
     * Mock API call for demo purposes
     */
    mockApiCall(delay = 1500) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, delay);
        });
    }

    /**
     * Legacy handler for onclick events
     */
    handleDonationClick(btn) {
        const donationType = btn.getAttribute('data-donation-type');
        if (donationType) {
            this.openDonationForm(donationType);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DonationsPage();
});

// Export for module use
export default DonationsPage;
