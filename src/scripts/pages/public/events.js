import { eventService } from '../../../services/index.js';
import { showNotification } from '../../../utils/utility-functions.js';

/**
 * Events Page Script
 * Handles events page functionality including registration and newsletter signup
 * 
 * @version 1.0.0
 */

class EventsPage {
    constructor() {
        this.eventButtons = document.querySelectorAll('.event-btn');
        this.newsletterForm = document.querySelector('.signup-form');
        this.modal = null;
        this.currentEventName = '';
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        // Create modal HTML
        const modalHTML = `
            <div id="event-registration-modal" class="modal-overlay">
                <div class="modal-content">
                    <button class="modal-close">&times;</button>
                    <h2>Event Registration</h2>
                    <p class="modal-event-name"></p>
                    <form id="event-registration-form">
                        <div class="form-group">
                            <label for="reg-name">Full Name</label>
                            <input type="text" id="reg-name" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="reg-email">Email Address</label>
                            <input type="email" id="reg-email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="reg-phone">Phone Number</label>
                            <input type="tel" id="reg-phone" name="phone" required>
                        </div>
                        <div class="form-group">
                            <label for="reg-student-id">Student ID</label>
                            <input type="text" id="reg-student-id" name="studentId">
                        </div>
                        <div class="form-group">
                            <label for="reg-notes">Additional Notes</label>
                            <textarea id="reg-notes" name="notes" rows="3"></textarea>
                        </div>
                        <button type="submit" class="btn-submit">Submit Registration</button>
                    </form>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('event-registration-modal');

        // Bind modal events
        const closeBtn = this.modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.closeModal());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Bind form submission
        const form = document.getElementById('event-registration-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(form);
        });
    }

    openModal(eventName) {
        this.currentEventName = eventName;
        const eventNameEl = this.modal.querySelector('.modal-event-name');
        eventNameEl.textContent = `Registering for: ${eventName}`;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('event-registration-form').reset();
    }

    bindEvents() {
        // Event registration buttons
        this.eventButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleEventRegistration(btn);
            });
        });

        // Newsletter signup
        if (this.newsletterForm) {
            this.newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSignup();
            });
        }
    }

    handleEventRegistration(btn) {
        const eventName = btn.closest('.event-card')?.querySelector('h3')?.textContent || 'this event';
        this.openModal(eventName);
    }

    async handleFormSubmit(form) {
        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Registering...';
        submitBtn.disabled = true;

        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.eventName = this.currentEventName;

        try {
            // Call the actual API
            const response = await eventService.registerPublic(data);

            if (response.success) {
                showNotification(response.message || `Successfully registered for "${this.currentEventName}"!`, 'success');
                this.closeModal();
            } else {
                showNotification(response.message || 'Failed to register. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification(error.message || 'Failed to register. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleNewsletterSignup() {
        const emailInput = this.newsletterForm.querySelector('input[type="email"]');
        const email = emailInput?.value?.trim().toLowerCase();

        if (!email) {
            showNotification('Please enter your email address', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Show loading
        const submitBtn = this.newsletterForm.querySelector('button');
        this.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Subscribing...';
        submitBtn.disabled = true;

        try {
            // Call the actual API
            const response = await eventService.subscribeNewsletter(email);

            if (response.success) {
                showNotification('Thank you for subscribing! You will receive updates about our events.', 'success');
                this.newsletterForm.reset();
            } else {
                // Check for already subscribed
                if (response.message && response.message.includes('already')) {
                    showNotification('This email is already subscribed! We will keep you updated.', 'error');
                } else {
                    showNotification(response.message || 'Failed to subscribe. Please try again.', 'error');
                }
            }

        } catch (error) {
            console.error('Newsletter signup error:', error);
            showNotification('Failed to subscribe. Please try again.', 'error');
        } finally {
            const submitBtn = this.newsletterForm.querySelector('button');
            if (submitBtn) {
                submitBtn.textContent = this.originalText;
                submitBtn.disabled = false;
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new EventsPage();
});

// Export for module use
export default EventsPage;
