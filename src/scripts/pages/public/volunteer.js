/**
 * Volunteer Page Script
 * Handles volunteer page functionality including form and FAQ accordion
 * 
 * @version 2.0.0
 */

import { volunteerService } from '../../services/index.js';
import { showNotification } from '../../utils/utility-functions.js';

class VolunteerPage {
    constructor() {
        this.form = document.getElementById('volunteer-registration-form');
        this.applyButtons = document.querySelectorAll('.apply-btn');
        this.faqDetails = document.querySelectorAll('.faq-section details');
        this.submitBtn = document.getElementById('submit-application-btn');
        this.selectedOpportunity = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadOpportunities();
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
                    this.formatPhoneNumber(e);
                });
            }

            // Interest checkboxes enhancement (convert multi-select to checkboxes for better UX)
            this.enhanceInterestsSelect();
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

    /**
     * Format phone number to Kenyan format
     */
    formatPhoneNumber(e) {
        let value = e.target.value.replace(/[^\d+]/g, '');
        if (!value.startsWith('+')) {
            value = '+254' + value.replace(/^\+?254/, '').replace(/^0/, '');
        }
        e.target.value = value;
    }

    /**
     * Enhance multi-select to checkbox group for better UX
     */
    enhanceInterestsSelect() {
        const interestsSelect = this.form?.querySelector('#interests');
        if (!interestsSelect) return;

        // Create checkbox container
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'interests-checkbox-group';
        checkboxContainer.id = 'interests-checkboxes';

        // Get all options
        const options = Array.from(interestsSelect.querySelectorAll('option'));
        
        options.forEach(option => {
            if (option.value) {
                const checkboxWrapper = document.createElement('label');
                checkboxWrapper.className = 'checkbox-label';
                checkboxWrapper.innerHTML = `
                    <input type="checkbox" name="interests" value="${option.value}">
                    <span class="checkbox-text">${option.textContent}</span>
                `;
                checkboxContainer.appendChild(checkboxWrapper);
            }
        });

        // Hide original select and add checkbox group
        interestsSelect.style.display = 'none';
        interestsSelect.parentNode.insertBefore(checkboxContainer, interestsSelect);
    }

    /**
     * Get selected interests from checkboxes
     */
    getSelectedInterests() {
        const checkboxes = document.querySelectorAll('#interests-checkboxes input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    /**
     * Load volunteer opportunities from API
     */
    async loadOpportunities() {
        try {
            // Try to fetch from API
            const opportunities = await volunteerService.getOpportunities();
            this.renderOpportunities(opportunities);
        } catch (error) {
            console.log('Using static opportunities (API not available)');
            // Keep static opportunities from HTML
        }
    }

    /**
     * Render opportunities (can be used for dynamic loading)
     */
    renderOpportunities(opportunities) {
        const container = document.querySelector('.opportunities');
        if (!container || !opportunities || opportunities.length === 0) return;

        // Replace static content with dynamic if API returns data
        const opportunitiesSection = container.querySelector('.opportunities');
        // Implementation depends on API response structure
    }

    /**
     * Handle form submission with Fetch API
     */
    async handleFormSubmit() {
        const form = this.form;
        
        // Get form data
        const volunteerData = this.collectFormData();

        // Validation
        const validationError = this.validateForm(volunteerData);
        if (validationError) {
            showNotification(validationError, 'error');
            return;
        }

        try {
            // Show loading state
            this.setLoadingState(true);

            // Submit to API
            const response = await volunteerService.registerVolunteer(volunteerData);
            
            // Show success message
            showNotification(
                'Thank you for your interest in volunteering with SWA! We will contact you soon.',
                'success'
            );
            
            // Reset form
            form.reset();
            
            // Reset checkbox group
            const checkboxes = document.querySelectorAll('#interests-checkboxes input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);

        } catch (error) {
            console.error('Volunteer form error:', error);
            
            // Show error message
            showNotification(
                error.message || 'Failed to submit application. Please try again.',
                'error'
            );
            
            // Demo mode fallback - simulate success for testing
            this.handleDemoSubmission(volunteerData);
            
        } finally {
            // Reset loading state
            this.setLoadingState(false);
        }
    }

    /**
     * Collect form data
     */
    collectFormData() {
        const form = this.form;
        const interests = this.getSelectedInterests();
        
        return {
            name: form.querySelector('#name')?.value?.trim() || '',
            email: form.querySelector('#email')?.value?.trim() || '',
            phone: form.querySelector('#phone')?.value?.trim() || '',
            studentId: form.querySelector('#student-id')?.value?.trim() || '',
            year: form.querySelector('#year')?.value || '',
            interests: interests,
            availability: form.querySelector('#availability')?.value || '',
            experience: form.querySelector('#experience')?.value?.trim() || '',
            message: form.querySelector('#message')?.value?.trim() || '',
            opportunity: this.selectedOpportunity || '',
            submittedAt: new Date().toISOString()
        };
    }

    /**
     * Validate form data
     */
    validateForm(data) {
        // Required fields
        if (!data.name) {
            return 'Please enter your full name';
        }

        if (!data.email) {
            return 'Please enter your email address';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return 'Please enter a valid email address';
        }

        if (!data.phone) {
            return 'Please enter your phone number';
        }

        // Phone validation (Kenyan format)
        const phoneRegex = /^\+254[7-9]\d{8}$/;
        if (!phoneRegex.test(data.phone)) {
            return 'Please enter a valid phone number (e.g., +254712345678)';
        }

        // Validate interests selection
        if (data.interests.length === 0) {
            return 'Please select at least one area of interest';
        }

        return null; // No validation errors
    }

    /**
     * Set loading state on submit button
     */
    setLoadingState(isLoading) {
        if (!this.submitBtn) return;

        if (isLoading) {
            this.submitBtn.disabled = true;
            this.submitBtn.dataset.originalText = this.submitBtn.textContent;
            this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        } else {
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = this.submitBtn.dataset.originalText || 'Submit Application';
        }
    }

    /**
     * Handle demo submission when API is not available
     */
    handleDemoSubmission(data) {
        console.log('Demo mode - Volunteer data submitted:', data);
        
        // Show demo success notification
        showNotification(
            'Application submitted successfully! (Demo Mode)',
            'success'
        );
        
        // Reset form
        if (this.form) {
            this.form.reset();
        }
        
        // Reset checkboxes
        const checkboxes = document.querySelectorAll('#interests-checkboxes input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
    }

    /**
     * Handle apply button click
     */
    handleApplyClick(btn) {
        const opportunityCard = btn.closest('.opportunity-card');
        const title = opportunityCard?.querySelector('h3')?.textContent?.trim() || 'this position';
        
        // Extract opportunity ID from the card
        const opportunityId = this.extractOpportunityId(opportunityCard);
        this.selectedOpportunity = opportunityId;
        
        // Scroll directly to form section immediately
        const formSection = document.querySelector('.volunteer-form');
        if (formSection) {
            // Scroll immediately without animation
            const formTop = formSection.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo(0, formTop - 20);
            
            // Focus on the first input field
            setTimeout(() => {
                const firstInput = formSection.querySelector('input:not([type="hidden"])');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        }
    }

    /**
     * Extract opportunity ID from card
     */
    extractOpportunityId(card) {
        if (!card) return null;
        
        // Check for data attribute
        const dataId = card.dataset.opportunityId;
        if (dataId) return dataId;
        
        // Extract from title
        const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
        
        const opportunityMap = {
            'event planning': 'events',
            'mentorship': 'mentorship',
            'outreach': 'outreach',
            'media': 'media',
            'technical': 'technical'
        };
        
        for (const [key, id] of Object.entries(opportunityMap)) {
            if (title.includes(key)) {
                return id;
            }
        }
        
        return null;
    }

    /**
     * Reset selected opportunity
     */
    resetOpportunity() {
        this.selectedOpportunity = null;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new VolunteerPage();
});

// Export for module use
export default VolunteerPage;
