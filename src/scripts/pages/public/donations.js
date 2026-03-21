/**
 * Donations Page Script
 * Handles donation button interactions
 * 
 * @version 1.0.0
 */

class DonationsPage {
    constructor() {
        this.donateButtons = document.querySelectorAll('.donate-btn');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Donation button handlers
        this.donateButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleDonationClick(btn);
            });
        });
    }

    handleDonationClick(btn) {
        const buttonText = btn.textContent.trim().toLowerCase();
        
        if (buttonText.includes('donate now')) {
            this.openDonationForm('one-time');
        } else if (buttonText.includes('monthly')) {
            this.openDonationForm('monthly');
        } else if (buttonText.includes('sponsor')) {
            this.openDonationForm('scholarship');
        }
    }

    openDonationForm(type) {
        const message = `Thank you for your interest in supporting SWA!\n\nDonation type: ${type}\n\nOur donation system is currently under development. Please contact us at:\n\nEmail: donations@swajoust.org\nPhone: +254 123 439 040\n\nAlternatively, you can make a direct bank transfer using the details provided on this page.`;
        
        alert(message);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DonationsPage();
});

// Export for module use
export default DonationsPage;
