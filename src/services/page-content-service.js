/**
 * Page Content Service
 * Handles API calls for page content management
 */

import { apiService } from './api-service.js';

const pageContentService = {
    /**
     * Get all page content entries (admin)
     * @param {Object} options - Query options
     * @returns {Promise} Response data
     */
    getAll: async (options = {}) => {
        const params = new URLSearchParams(options).toString();
        return apiService.get(`/page-content${params ? `?${params}` : ''}`);
    },

    /**
     * Get page content by ID (admin)
     * @param {string} id - Page content ID
     * @returns {Promise} Response data
     */
    getById: async (id) => {
        return apiService.get(`/page-content/${id}`);
    },

    /**
     * Get public page content (no auth required)
     * @param {string} pageIdentifier - Page identifier
     * @returns {Promise} Response data
     */
    getPublicContent: async (pageIdentifier) => {
        return apiService.get(`/page-content/public/${pageIdentifier}`);
    },

    /**
     * Create new page content (admin)
     * @param {Object} data - Page content data
     * @returns {Promise} Response data
     */
    create: async (data) => {
        return apiService.post('/page-content', data);
    },

    /**
     * Update page content (admin)
     * @param {string} id - Page content ID
     * @param {Object} data - Updated data
     * @returns {Promise} Response data
     */
    update: async (id, data) => {
        return apiService.put(`/page-content/${id}`, data);
    },

    /**
     * Delete page content (admin)
     * @param {string} id - Page content ID
     * @returns {Promise} Response data
     */
    delete: async (id) => {
        return apiService.delete(`/page-content/${id}`);
    },

    /**
     * Bulk update page content for a specific page (admin)
     * @param {string} pageIdentifier - Page identifier
     * @param {Array} contents - Array of content objects
     * @returns {Promise} Response data
     */
    bulkUpdate: async (pageIdentifier, contents) => {
        return apiService.put(`/page-content/bulk/${pageIdentifier}`, { contents });
    },

    /**
     * Get list of all available pages (admin)
     * @returns {Promise} Response data
     */
    getPages: async () => {
        return apiService.get('/page-content/meta/pages');
    }
};

export { pageContentService };
export default pageContentService;