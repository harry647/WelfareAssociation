/**
 * Savings Service
 * Handles savings goals and operations
 * 
 * @version 1.1.0
 * Updated for dynamic data loading
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Savings Service - Savings operations
 */
class SavingsService {
    /**
     * Get all savings (for admin dashboard)
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.savings, params, true);
    }

    /**
     * Get all savings goals
     * @param {Object} params - Query parameters
     */
    async getAllGoals(params = {}) {
        return apiService.get(API_CONFIG.endpoints.savingsGoals, params, true);
    }

    /**
     * Get savings goal by ID
     * @param {string|number} id - Goal ID
     */
    async getGoalById(id) {
        return apiService.get(`${API_CONFIG.endpoints.savingsGoals}/${id}`, {}, true);
    }

    /**
     * Get member's savings goals
     * @param {string|number} memberId - Member ID
     */
    async getByMember(memberId) {
        return apiService.get(
            API_CONFIG.endpoints.savingsGoals,
            { memberId },
            true
        );
    }

    /**
     * Create savings goal
     * @param {Object} goalData - Goal data
     */
    async createGoal(goalData) {
        return apiService.post(API_CONFIG.endpoints.savingsGoals, goalData, true);
    }

    /**
     * Update savings goal
     * @param {string|number} id - Goal ID
     * @param {Object} goalData - Goal data to update
     */
    async updateGoal(id, goalData) {
        return apiService.put(
            `${API_CONFIG.endpoints.savingsGoals}/${id}`,
            goalData,
            true
        );
    }

    /**
     * Delete savings goal
     * @param {string|number} id - Goal ID
     */
    async deleteGoal(id) {
        return apiService.delete(`${API_CONFIG.endpoints.savingsGoals}/${id}`, true);
    }

    /**
     * Add savings to goal
     * @param {string|number} goalId - Goal ID
     * @param {Object} savingsData - Savings data
     */
    async addSavings(goalId, savingsData) {
        return apiService.post(
            `${API_CONFIG.endpoints.savingsGoals}/${goalId}/savings`,
            savingsData,
            true
        );
    }

    /**
     * Get savings history for goal
     * @param {string|number} goalId - Goal ID
     */
    async getSavingsHistory(goalId) {
        return apiService.get(
            `${API_CONFIG.endpoints.savingsGoals}/${goalId}/history`,
            {},
            true
        );
    }

    /**
     * Withdraw from savings goal
     * @param {string|number} goalId - Goal ID
     * @param {Object} withdrawalData - Withdrawal data
     */
    async withdraw(goalId, withdrawalData) {
        return apiService.post(
            `${API_CONFIG.endpoints.savingsGoals}/${goalId}/withdraw`,
            withdrawalData,
            true
        );
    }

    /**
     * Complete savings goal
     * @param {string|number} id - Goal ID
     */
    async completeGoal(id) {
        return apiService.patch(
            `${API_CONFIG.endpoints.savingsGoals}/${id}/complete`,
            {},
            true
        );
    }

    /**
     * Get total savings
     * @param {string|number} memberId - Member ID (optional)
     */
    async getTotalSavings(memberId = null) {
        const params = memberId ? { memberId } : {};
        return apiService.get(
            `${API_CONFIG.endpoints.savings}/total`,
            params,
            true
        );
    }

    /**
     * Get savings statistics (Admin only)
     */
    async getStatistics() {
        return apiService.get(
            `${API_CONFIG.endpoints.savings}/statistics`,
            {},
            true
        );
    }

    /**
     * Get recent transactions (Admin only)
     * @param {number} limit - Number of transactions to fetch
     */
    async getTransactions(limit = 20) {
        return apiService.get(
            `${API_CONFIG.endpoints.savings}/transactions`,
            { limit },
            true
        );
    }
}

// Export singleton instance
export const savingsService = new SavingsService();

// Export class for custom instances
export default SavingsService;