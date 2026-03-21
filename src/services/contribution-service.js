/**
 * Contribution Service
 * Handles contribution/dues operations
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Contribution Service - Contribution operations
 */
class ContributionService {
    /**
     * Get all contributions
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.contributions, params, true);
    }

    /**
     * Get contribution by ID
     * @param {string|number} id - Contribution ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.contributions}/${id}`, {}, true);
    }

    /**
     * Add new contribution
     * @param {Object} contributionData - Contribution data
     */
    async add(contributionData) {
        return apiService.post(
            API_CONFIG.endpoints.addContribution,
            contributionData,
            true
        );
    }

    /**
     * Update contribution
     * @param {string|number} id - Contribution ID
     * @param {Object} contributionData - Contribution data to update
     */
    async update(id, contributionData) {
        return apiService.put(
            `${API_CONFIG.endpoints.contributions}/${id}`,
            contributionData,
            true
        );
    }

    /**
     * Delete contribution
     * @param {string|number} id - Contribution ID
     */
    async delete(id) {
        return apiService.delete(
            `${API_CONFIG.endpoints.contributions}/${id}`,
            true
        );
    }

    /**
     * Get contributions by member
     * @param {string|number} memberId - Member ID
     */
    async getByMember(memberId) {
        return apiService.get(
            API_CONFIG.endpoints.contributions,
            { memberId },
            true
        );
    }

    /**
     * Get total contributions
     */
    async getTotal() {
        return apiService.get(
            `${API_CONFIG.endpoints.contributions}/total`,
            {},
            true
        );
    }

    /**
     * Get contribution summary
     */
    async getSummary() {
        return apiService.get(
            `${API_CONFIG.endpoints.contributions}/summary`,
            {},
            true
        );
    }
}

// Export singleton instance
export const contributionService = new ContributionService();

export default ContributionService;
