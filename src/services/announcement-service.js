/**
 * Announcement Service
 * Handles announcements and notifications
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Announcement Service - Announcement operations
 */
class AnnouncementService {
    /**
     * Get all announcements
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.announcements, params, true);
    }

    /**
     * Get announcement by ID
     * @param {string|number} id - Announcement ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.announcements}/${id}`, {}, true);
    }

    /**
     * Get active announcements
     */
    async getActive() {
        return apiService.get(
            `${API_CONFIG.endpoints.announcements}?status=active`,
            {},
            true
        );
    }

    /**
     * Create new announcement
     * @param {Object} data - Announcement data
     */
    async create(data) {
        return apiService.post(API_CONFIG.endpoints.announcements, data, true);
    }

    /**
     * Update announcement
     * @param {string|number} id - Announcement ID
     * @param {Object} data - Updated announcement data
     */
    async update(id, data) {
        return apiService.put(`${API_CONFIG.endpoints.announcements}/${id}`, data, true);
    }

    /**
     * Delete announcement
     * @param {string|number} id - Announcement ID
     */
    async delete(id) {
        return apiService.delete(`${API_CONFIG.endpoints.announcements}/${id}`, true);
    }

    /**
     * Send announcement
     * @param {string|number} id - Announcement ID
     */
    async send(id) {
        return apiService.post(`${API_CONFIG.endpoints.announcements}/${id}/send`, {}, true);
    }

    /**
     * Get announcement statistics
     */
    async getStats() {
        return apiService.get(`${API_CONFIG.endpoints.announcements}/stats`, {}, true);
    }
}

export const announcementService = new AnnouncementService();
export default announcementService;
