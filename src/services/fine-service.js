/**
 * Fine Service
 * Handles fines collection and management
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Fine Service - Fine operations
 */
class FineService {
    /**
     * Get all fines
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.fines, params, true);
    }

    /**
     * Get fine by ID
     * @param {string|number} id - Fine ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.fines}/${id}`, {}, true);
    }

    /**
     * Get fines by member
     * @param {string|number} memberId - Member ID
     */
    async getByMember(memberId) {
        return apiService.get(
            API_CONFIG.endpoints.fines,
            { memberId },
            true
        );
    }

    /**
     * Get pending fines
     */
    async getPending() {
        return apiService.get(
            `${API_CONFIG.endpoints.fines}/pending`,
            {},
            true
        );
    }

    /**
     * Get paid fines
     */
    async getPaid() {
        return apiService.get(
            `${API_CONFIG.endpoints.fines}/paid`,
            {},
            true
        );
    }

    /**
     * Issue fine (Admin only)
     * @param {Object} fineData - Fine data
     */
    async issue(fineData) {
        return apiService.post(API_CONFIG.endpoints.fines, fineData, true);
    }

    /**
     * Update fine (Admin only)
     * @param {string|number} id - Fine ID
     * @param {Object} fineData - Fine data to update
     */
    async update(id, fineData) {
        return apiService.put(`${API_CONFIG.endpoints.fines}/${id}`, fineData, true);
    }

    /**
     * Mark fine as paid
     * @param {string|number} id - Fine ID
     * @param {Object} paymentData - Payment data
     */
    async markAsPaid(id, paymentData = {}) {
        return apiService.patch(
            `${API_CONFIG.endpoints.fines}/${id}/pay`,
            paymentData,
            true
        );
    }

    /**
     * Waive fine (Admin only)
     * @param {string|number} id - Fine ID
     * @param {Object} waiverData - Waiver data
     */
    async waive(id, waiverData = {}) {
        return apiService.patch(
            `${API_CONFIG.endpoints.fines}/${id}/waive`,
            waiverData,
            true
        );
    }

    /**
     * Send fine reminder
     * @param {string|number} fineId - Fine ID
     */
    async sendReminder(fineId) {
        return apiService.post(
            `${API_CONFIG.endpoints.fines}/${fineId}/remind`,
            {},
            true
        );
    }

    /**
     * Delete fine (Admin only)
     * @param {string|number} id - Fine ID
     */
    async delete(id) {
        return apiService.delete(`${API_CONFIG.endpoints.fines}/${id}`, true);
    }

    /**
     * Get fine statistics
     */
    async getStatistics() {
        return apiService.get(
            `${API_CONFIG.endpoints.fines}/statistics`,
            {},
            true
        );
    }

    /**
     * Get total outstanding fines
     */
    async getTotalOutstanding() {
        return apiService.get(
            `${API_CONFIG.endpoints.fines}/total`,
            {},
            true
        );
    }
}

// Export singleton instance
export const fineService = new FineService();

// Export class for custom instances
export default FineService;