/**
 * Volunteer Page Script
 * Handles volunteer page functionality including form and FAQ accordion
 * 
 * @version 1.0.0
 */

class VolunteerPage {
    constructor() {
        this.form = document.querySelector('.volunteer-form form');
        this.applyButtons = document.querySelectorAll('.apply-btn');
        this.faqDetails = document.querySelectorAll('.faq-section details');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Volunteer form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });

            // Phone formatting
            const phoneInput = this.form.querySelector('#phone');
            if (phoneInput) {
                phoneInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/[^\d+]/g, '');
                    if (!value.startsWith('+')) {
                        value = '+254' + value.replace(/^\+?254/, '').replace(/^0/, '');
                    }
                    e.target.value = value;
                });
            }
        }

        // Apply now buttons
        this.applyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleApplyClick(btn);
            });
        });

        // FAQ accordion (native details/summary)
        this.faqDetails.forEach(detail => {
            detail.addEventListener('toggle', () => {
                if (detail.open) {
                    // Close others
                    this.faqDetails.forEach(d => {
                        if (d !== detail) d.open = false;
                    });
                }
            });
        });
    }

    async handleFormSubmit() {
        const form = this.form;
        
        // Get form data
        const formData = new FormData(form);
        const volunteerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            studentId: formData.get('student-id'),
            year: formData.get('year'),
            interests: formData.get('interests'),
            availability: formData.get('availability'),
            experience: formData.get('experience'),
            message: formData.get('message')
        };

        // Validation
        if (!volunteerData.name || !volunteerData.email || !volunteerData.phone) {
            alert('Please fill in all required fields');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(volunteerData.email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Phone validation
        const phoneRegex = /^\+254[7-9]\d{8}$/;
        if (!phoneRegex.test(volunteerData.phone)) {
            alert('Please enter a valid phone number');
            return;
        }

        try {
            // Show loading
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Show success
            alert('Thank you for your interest in volunteering with SWA! We will contact you soon.');
            form.reset();

        } catch (error) {
            console.error('Volunteer form error:', error);
            alert('Failed to submit application. Please try again.');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    handleApplyClick(btn) {
        const opportunityCard = btn.closest('.opportunity-card');
        const title = opportunityCard?.querySelector('h3')?.textContent || 'this position';
        
        alert(`Application for "${title}"\n\nPlease fill out the volunteer registration form below to apply.`);
        
        // Scroll to form
        const formSection = document.querySelector('.volunteer-form');
        if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new VolunteerPage();
});

// Export for module use
export default VolunteerPage;
