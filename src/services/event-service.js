/**
 * Event Service
 * Handles events, event registration, and newsletter subscriptions
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Event Service - Events and registration operations
 */
class EventService {
    /**
     * Get all events
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.events, params, false);
    }

    /**
     * Get event by ID
     * @param {string|number} id - Event ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.events}/${id}`, {}, false);
    }

    /**
     * Register for an event
     * @param {Object} registrationData - Registration data
     */
    async register(registrationData) {
        return apiService.post(
            API_CONFIG.endpoints.eventRegister,
            registrationData,
            false
        );
    }

    /**
     * Get event registrations (Admin only)
     * @param {string|number} eventId - Event ID
     */
    async getRegistrations(eventId) {
        return apiService.get(
            `${API_CONFIG.endpoints.events}/${eventId}/registrations`,
            {},
            true
        );
    }

    /**
     * Cancel event registration
     * @param {string|number} registrationId - Registration ID
     */
    async cancelRegistration(registrationId) {
        return apiService.delete(
            `${API_CONFIG.endpoints.events}/registrations/${registrationId}`,
            true
        );
    }

    /**
     * Subscribe to newsletter
     * @param {string} email - Subscriber email
     */
    async subscribeNewsletter(email) {
        return apiService.post(
            API_CONFIG.endpoints.newsletter,
            { email },
            false
        );
    }

    /**
     * Unsubscribe from newsletter
     * @param {string} email - Subscriber email
     */
    async unsubscribeNewsletter(email) {
        return apiService.post(
            `${API_CONFIG.endpoints.newsletter}/unsubscribe`,
            { email },
            false
        );
    }

    /**
     * Get newsletter subscribers (Admin only)
     * @param {Object} params - Query parameters
     */
    async getNewsletterSubscribers(params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.newsletter}/subscribers`,
            params,
            true
        );
    }

    /**
     * Get upcoming events
     */
    async getUpcoming() {
        return apiService.get(
            `${API_CONFIG.endpoints.events}/upcoming`,
            {},
            false
        );
    }

    /**
     * Get past events
     * @param {Object} params - Query parameters
     */
    async getPast(params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.events}/past`,
            params,
            false
        );
    }

    /**
     * Public event registration (no auth required)
     * @param {Object} registrationData - Registration data (eventName, name, email, phone, etc.)
     */
    async registerPublic(registrationData) {
        return apiService.post(
            API_CONFIG.endpoints.eventPublicRegister,
            registrationData,
            false
        );
    }
}

// Export singleton instance
export const eventService = new EventService();

// Export class for custom instances
export default EventService;