/**
 * Debt Service
 * Handles member debts and reminders
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Debt Service - Debt management operations
 */
class DebtService {
    /**
     * Get all debts
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.debts, params, true);
    }

    /**
     * Get debt by ID
     * @param {string|number} id - Debt ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.debts}/${id}`, {}, true);
    }

    /**
     * Get debts by member
     * @param {string|number} memberId - Member ID
     */
    async getByMember(memberId) {
        return apiService.get(
            API_CONFIG.endpoints.debts,
            { memberId },
            true
        );
    }

    /**
     * Get pending debts
     */
    async getPending() {
        return apiService.get(
            `${API_CONFIG.endpoints.debts}/pending`,
            {},
            true
        );
    }

    /**
     * Get overdue debts
     */
    async getOverdue() {
        return apiService.get(
            `${API_CONFIG.endpoints.debts}/overdue`,
            {},
            true
        );
    }

    /**
     * Create debt (Admin only)
     * @param {Object} debtData - Debt data
     */
    async create(debtData) {
        return apiService.post(API_CONFIG.endpoints.debts, debtData, true);
    }

    /**
     * Update debt (Admin only)
     * @param {string|number} id - Debt ID
     * @param {Object} debtData - Debt data to update
     */
    async update(id, debtData) {
        return apiService.put(`${API_CONFIG.endpoints.debts}/${id}`, debtData, true);
    }

    /**
     * Mark debt as paid
     * @param {string|number} id - Debt ID
     * @param {Object} paymentData - Payment data
     */
    async markAsPaid(id, paymentData = {}) {
        return apiService.patch(
            `${API_CONFIG.endpoints.debts}/${id}/pay`,
            paymentData,
            true
        );
    }

    /**
     * Send debt reminder
     * @param {string|number} debtId - Debt ID
     */
    async sendReminder(debtId) {
        return apiService.post(
            `${API_CONFIG.endpoints.debts}/${debtId}/remind`,
            {},
            true
        );
    }

    /**
     * Send bulk reminders (Admin only)
     * @param {Array} debtIds - Array of debt IDs
     */
    async sendBulkReminders(debtIds) {
        return apiService.post(
            `${API_CONFIG.endpoints.debts}/remind/bulk`,
            { debtIds },
            true
        );
    }

    /**
     * Waive debt (Admin only)
     * @param {string|number} id - Debt ID
     * @param {Object} waiverData - Waiver data
     */
    async waive(id, waiverData = {}) {
        return apiService.patch(
            `${API_CONFIG.endpoints.debts}/${id}/waive`,
            waiverData,
            true
        );
    }

    /**
     * Delete debt (Admin only)
     * @param {string|number} id - Debt ID
     */
    async delete(id) {
        return apiService.delete(`${API_CONFIG.endpoints.debts}/${id}`, true);
    }

    /**
     * Get debt statistics
     */
    async getStatistics() {
        return apiService.get(
            `${API_CONFIG.endpoints.debts}/statistics`,
            {},
            true
        );
    }

    /**
     * Get total outstanding debt
     */
    async getTotalOutstanding() {
        return apiService.get(
            `${API_CONFIG.endpoints.debts}/total`,
            {},
            true
        );
    }
}

// Export singleton instance
export const debtService = new DebtService();

// Export class for custom instances
export default DebtService;