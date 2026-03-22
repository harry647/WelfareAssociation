/**
 * Policy Service
 * Handles policies and terms
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Policy Service - Policy operations
 */
class PolicyService {
    /**
     * Get all policies
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.policies, params, false);
    }

    /**
     * Get policy by ID
     * @param {string|number} id - Policy ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.policies}/${id}`, {}, false);
    }

    /**
     * Get policy by slug
     * @param {string} slug - Policy slug
     */
    async getBySlug(slug) {
        return apiService.get(
            `${API_CONFIG.endpoints.policies}/slug/${slug}`,
            {},
            false
        );
    }

    /**
     * Get active policies
     */
    async getActive() {
        return apiService.get(
            `${API_CONFIG.endpoints.policies}/active`,
            {},
            false
        );
    }

    /**
     * Get policies by category
     * @param {string} category - Policy category
     */
    async getByCategory(category) {
        return apiService.get(
            `${API_CONFIG.endpoints.policies}/category/${category}`,
            {},
            false
        );
    }

    /**
     * Create policy (Admin only)
     * @param {Object} policyData - Policy data
     */
    async create(policyData) {
        return apiService.post(API_CONFIG.endpoints.policies, policyData, true);
    }

    /**
     * Update policy (Admin only)
     * @param {string|number} id - Policy ID
     * @param {Object} policyData - Policy data to update
     */
    async update(id, policyData) {
        return apiService.put(
            `${API_CONFIG.endpoints.policies}/${id}`,
            policyData,
            true
        );
    }

    /**
     * Delete policy (Admin only)
     * @param {string|number} id - Policy ID
     */
    async delete(id) {
        return apiService.delete(`${API_CONFIG.endpoints.policies}/${id}`, true);
    }

    /**
     * Publish policy (Admin only)
     * @param {string|number} id - Policy ID
     */
    async publish(id) {
        return apiService.patch(
            `${API_CONFIG.endpoints.policies}/${id}/publish`,
            {},
            true
        );
    }

    /**
     * Archive policy (Admin only)
     * @param {string|number} id - Policy ID
     */
    async archive(id) {
        return apiService.patch(
            `${API_CONFIG.endpoints.policies}/${id}/archive`,
            {},
            true
        );
    }

    /**
     * Get policy categories
     */
    async getCategories() {
        return apiService.get(
            `${API_CONFIG.endpoints.policies}/categories`,
            {},
            false
        );
    }

    /**
     * Accept policy (User)
     * @param {string|number} policyId - Policy ID
     */
    async accept(policyId) {
        return apiService.post(
            `${API_CONFIG.endpoints.policies}/${policyId}/accept`,
            {},
            true
        );
    }

    /**
     * Get user's accepted policies
     */
    async getAccepted() {
        return apiService.get(
            `${API_CONFIG.endpoints.policies}/accepted`,
            {},
            true
        );
    }
}

// Export singleton instance
export const policyService = new PolicyService();

// Export class for custom instances
export default PolicyService;