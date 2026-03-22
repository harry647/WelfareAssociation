/**
 * Notice Service
 * Handles notices and announcements
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Notice Service - Notice and announcement operations
 */
class NoticeService {
    /**
     * Get all notices
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.notices, params, true);
    }

    /**
     * Get notice by ID
     * @param {string|number} id - Notice ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.notices}/${id}`, {}, true);
    }

    /**
     * Get active notices
     */
    async getActive() {
        return apiService.get(
            `${API_CONFIG.endpoints.notices}/active`,
            {},
            true
        );
    }

    /**
     * Get notices by category
     * @param {string} category - Notice category
     */
    async getByCategory(category) {
        return apiService.get(
            `${API_CONFIG.endpoints.notices}/category/${category}`,
            {},
            true
        );
    }

    /**
     * Create notice (Admin only)
     * @param {Object} noticeData - Notice data
     */
    async create(noticeData) {
        return apiService.post(API_CONFIG.endpoints.notices, noticeData, true);
    }

    /**
     * Update notice (Admin only)
     * @param {string|number} id - Notice ID
     * @param {Object} noticeData - Notice data to update
     */
    async update(id, noticeData) {
        return apiService.put(`${API_CONFIG.endpoints.notices}/${id}`, noticeData, true);
    }

    /**
     * Delete notice (Admin only)
     * @param {string|number} id - Notice ID
     */
    async delete(id) {
        return apiService.delete(`${API_CONFIG.endpoints.notices}/${id}`, true);
    }

    /**
     * Archive notice (Admin only)
     * @param {string|number} id - Notice ID
     */
    async archive(id) {
        return apiService.patch(
            `${API_CONFIG.endpoints.notices}/${id}/archive`,
            {},
            true
        );
    }

    /**
     * Get announcements
     * @param {Object} params - Query parameters
     */
    async getAnnouncements(params = {}) {
        return apiService.get(API_CONFIG.endpoints.announcements, params, false);
    }

    /**
     * Create announcement (Admin only)
     * @param {Object} announcementData - Announcement data
     */
    async createAnnouncement(announcementData) {
        return apiService.post(
            API_CONFIG.endpoints.announcements,
            announcementData,
            true
        );
    }

    /**
     * Send announcement to specific members (Admin only)
     * @param {string|number} announcementId - Announcement ID
     * @param {Array} memberIds - Array of member IDs
     */
    async sendToMembers(announcementId, memberIds) {
        return apiService.post(
            `${API_CONFIG.endpoints.announcements}/${announcementId}/send`,
            { memberIds },
            true
        );
    }
}

// Export singleton instance
export const noticeService = new NoticeService();

// Export class for custom instances
export default NoticeService;