/**
 * Bereavement Service
 * Handles bereavement support cases, contributions, and messages
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Bereavement Service - Bereavement support operations
 */
class BereavementService {
    /**
     * Get all bereavement cases
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        // Use auth=false to allow public access (optional auth for GET)
        return apiService.get(API_CONFIG.endpoints.bereavement, params, false);
    }

    /**
     * Get bereavement case by ID
     * @param {string|number} id - Case ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.bereavement}/${id}`, {}, true);
    }

    /**
     * Get urgent cases
     * @param {Object} params - Query parameters
     */
    async getUrgent(params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.bereavement}/urgent`,
            params,
            true
        );
    }

    /**
     * Get active cases
     * @param {Object} params - Query parameters
     */
    async getActive(params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.bereavement}/active`,
            params,
            true
        );
    }

    /**
     * Create bereavement case (Admin only)
     * @param {Object} caseData - Case data
     */
    async createCase(caseData) {
        return apiService.post(API_CONFIG.endpoints.bereavement, caseData, true);
    }

    /**
     * Update bereavement case (Admin only)
     * @param {string|number} id - Case ID
     * @param {Object} caseData - Case data to update
     */
    async updateCase(id, caseData) {
        return apiService.put(
            `${API_CONFIG.endpoints.bereavement}/${id}`,
            caseData,
            true
        );
    }

    /**
     * Delete bereavement case (Admin only)
     * @param {string|number} id - Case ID
     */
    async deleteCase(id) {
        return apiService.delete(`${API_CONFIG.endpoints.bereavement}/${id}`, true);
    }

    /**
     * Contribute to a bereavement case
     * @param {string|number} caseId - Case ID
     * @param {Object} contributionData - Contribution data
     */
    async contribute(caseId, contributionData) {
        return apiService.post(
            `${API_CONFIG.endpoints.bereavement}/${caseId}/contribute`,
            contributionData,
            false
        );
    }

    /**
     * Get contributions for a case
     * @param {string|number} caseId - Case ID
     */
    async getContributions(caseId) {
        return apiService.get(
            `${API_CONFIG.endpoints.bereavement}/${caseId}/contributions`,
            {},
            true
        );
    }

    /**
     * Get all contributions (Admin only)
     * @param {Object} params - Query parameters
     */
    async getAllContributions(params = {}) {
        return apiService.get(
            API_CONFIG.endpoints.bereavementContribute,
            params,
            true
        );
    }

    /**
     * Verify contribution (Admin only)
     * @param {string|number} contributionId - Contribution ID
     * @param {Object} verificationData - Verification data
     */
    async verifyContribution(contributionId, verificationData) {
        return apiService.patch(
            `${API_CONFIG.endpoints.bereavementContribute}/${contributionId}/verify`,
            verificationData,
            true
        );
    }

    /**
     * Send condolence message
     * @param {string|number} caseId - Case ID
     * @param {Object} messageData - Message data
     */
    async sendCondolence(caseId, messageData) {
        return apiService.post(
            `${API_CONFIG.endpoints.bereavement}/${caseId}/messages`,
            messageData,
            true
        );
    }

    /**
     * Get messages for a case
     * @param {string|number} caseId - Case ID
     */
    async getMessages(caseId) {
        return apiService.get(
            `${API_CONFIG.endpoints.bereavement}/${caseId}/messages`,
            {},
            true
        );
    }

    /**
     * Get all messages (Admin only)
     */
    async getAllMessages() {
        return apiService.get(
            API_CONFIG.endpoints.bereavementMessages,
            {},
            true
        );
    }

    /**
     * Get bereavement statistics
     */
    async getStatistics() {
        return apiService.get(
            `${API_CONFIG.endpoints.bereavement}/statistics`,
            {},
            true
        );
    }
}

// Export singleton instance
export const bereavementService = new BereavementService();

// Export class for custom instances
export default BereavementService;