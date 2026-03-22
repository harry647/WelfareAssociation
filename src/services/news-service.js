/**
 * News Service
 * Handles news articles and subscriptions
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * News Service - News and article operations
 */
class NewsService {
    /**
     * Get all news articles
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.news, params, false);
    }

    /**
     * Get news article by ID
     * @param {string|number} id - News ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.news}/${id}`, {}, false);
    }

    /**
     * Get latest news
     * @param {number} limit - Number of articles
     */
    async getLatest(limit = 5) {
        return apiService.get(
            `${API_CONFIG.endpoints.news}/latest`,
            { limit },
            false
        );
    }

    /**
     * Get news by category
     * @param {string} category - News category
     * @param {Object} params - Additional parameters
     */
    async getByCategory(category, params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.news}/category/${category}`,
            params,
            false
        );
    }

    /**
     * Search news articles
     * @param {string} query - Search query
     * @param {Object} params - Additional parameters
     */
    async search(query, params = {}) {
        return apiService.get(
            API_CONFIG.endpoints.news,
            { search: query, ...params },
            false
        );
    }

    /**
     * Subscribe to news
     * @param {string} email - Subscriber email
     */
    async subscribe(email) {
        return apiService.post(
            API_CONFIG.endpoints.newsSubscribe,
            { email },
            false
        );
    }

    /**
     * Unsubscribe from news
     * @param {string} email - Subscriber email
     */
    async unsubscribe(email) {
        return apiService.post(
            `${API_CONFIG.endpoints.newsSubscribe}/unsubscribe`,
            { email },
            false
        );
    }

    /**
     * Create news article (Admin only)
     * @param {Object} newsData - News article data
     */
    async create(newsData) {
        return apiService.post(API_CONFIG.endpoints.news, newsData, true);
    }

    /**
     * Update news article (Admin only)
     * @param {string|number} id - News ID
     * @param {Object} newsData - News data to update
     */
    async update(id, newsData) {
        return apiService.put(`${API_CONFIG.endpoints.news}/${id}`, newsData, true);
    }

    /**
     * Delete news article (Admin only)
     * @param {string|number} id - News ID
     */
    async delete(id) {
        return apiService.delete(`${API_CONFIG.endpoints.news}/${id}`, true);
    }
}

// Export singleton instance
export const newsService = new NewsService();

// Export class for custom instances
export default NewsService;