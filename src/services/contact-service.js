/**
 * Contact Service
 * Handles contact form submissions and messages
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Contact Service - Contact form operations
 */
class ContactService {
    /**
     * Submit contact form
     * @param {Object} contactData - Contact form data
     */
    async submitContact(contactData) {
        return apiService.post(
            API_CONFIG.endpoints.contact,
            contactData,
            false // No auth required for public contact form
        );
    }

    /**
     * Get all messages (Admin only)
     * @param {Object} params - Query parameters
     */
    async getMessages(params = {}) {
        return apiService.get(API_CONFIG.endpoints.contact, params, true);
    }

    /**
     * Get message by ID (Admin only)
     * @param {string|number} id - Message ID
     */
    async getMessageById(id) {
        return apiService.get(`${API_CONFIG.endpoints.contact}/${id}`, {}, true);
    }

    /**
     * Mark message as read (Admin only)
     * @param {string|number} id - Message ID
     */
    async markAsRead(id) {
        return apiService.patch(
            `${API_CONFIG.endpoints.contact}/${id}`,
            { isRead: true },
            true
        );
    }

    /**
     * Delete message (Admin only)
     * @param {string|number} id - Message ID
     */
    async deleteMessage(id) {
        return apiService.delete(
            `${API_CONFIG.endpoints.contact}/${id}`,
            true
        );
    }

    /**
     * Get unread message count (Admin only)
     */
    async getUnreadCount() {
        return apiService.get(
            `${API_CONFIG.endpoints.contact}/unread`,
            {},
            true
        );
    }
}

// Export singleton instance
export const contactService = new ContactService();

export default ContactService;
