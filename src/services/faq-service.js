/**
 * FAQ Service
 * Handles frequently asked questions
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * FAQ Service - FAQ operations
 */
class FaqService {
    /**
     * Get all FAQs
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.faqs, params, false);
    }

    /**
     * Get FAQ by ID
     * @param {string|number} id - FAQ ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.faqs}/${id}`, {}, false);
    }

    /**
     * Get FAQs by category
     * @param {string} category - FAQ category
     */
    async getByCategory(category) {
        return apiService.get(
            `${API_CONFIG.endpoints.faqs}/category/${category}`,
            {},
            false
        );
    }

    /**
     * Search FAQs
     * @param {string} query - Search query
     */
    async search(query) {
        return apiService.get(
            API_CONFIG.endpoints.faqs,
            { search: query },
            false
        );
    }

    /**
     * Create FAQ (Admin only)
     * @param {Object} faqData - FAQ data
     */
    async create(faqData) {
        return apiService.post(API_CONFIG.endpoints.faqs, faqData, true);
    }

    /**
     * Update FAQ (Admin only)
     * @param {string|number} id - FAQ ID
     * @param {Object} faqData - FAQ data to update
     */
    async update(id, faqData) {
        return apiService.put(`${API_CONFIG.endpoints.faqs}/${id}`, faqData, true);
    }

    /**
     * Delete FAQ (Admin only)
     * @param {string|number} id - FAQ ID
     */
    async delete(id) {
        return apiService.delete(`${API_CONFIG.endpoints.faqs}/${id}`, true);
    }

    /**
     * Get FAQ categories
     */
    async getCategories() {
        return apiService.get(
            `${API_CONFIG.endpoints.faqs}/categories`,
            {},
            false
        );
    }

    /**
     * Reorder FAQs (Admin only)
     * @param {Array} faqIds - Array of FAQ IDs in new order
     */
    async reorder(faqIds) {
        return apiService.post(
            `${API_CONFIG.endpoints.faqs}/reorder`,
            { faqIds },
            true
        );
    }
}

// Export singleton instance
export const faqService = new FaqService();

// Export class for custom instances
export default FaqService;