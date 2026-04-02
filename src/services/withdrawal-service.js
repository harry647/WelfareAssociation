/**
 * Withdrawal Service
 * Handles withdrawal operations
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Withdrawal Service - Withdrawal operations
 */
class WithdrawalService {
    /**
     * Get all withdrawals
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.withdrawals, params, true);
    }

    /**
     * Get withdrawal by ID
     * @param {string|number} id - Withdrawal ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.withdrawals}/${id}`, {}, true);
    }

    /**
     * Add new withdrawal request
     * @param {Object} withdrawalData - Withdrawal data
     */
    async add(withdrawalData) {
        return apiService.post(
            API_CONFIG.endpoints.withdrawals,
            withdrawalData,
            true
        );
    }

    /**
     * Update withdrawal
     * @param {string|number} id - Withdrawal ID
     * @param {Object} withdrawalData - Withdrawal data to update
     */
    async update(id, withdrawalData) {
        return apiService.put(
            `${API_CONFIG.endpoints.withdrawals}/${id}`,
            withdrawalData,
            true
        );
    }

    /**
     * Delete withdrawal
     * @param {string|number} id - Withdrawal ID
     */
    async delete(id) {
        return apiService.delete(
            `${API_CONFIG.endpoints.withdrawals}/${id}`,
            true
        );
    }

    /**
     * Get withdrawals by member
     * @param {string|number} memberId - Member ID
     */
    async getByMember(memberId) {
        return apiService.get(
            API_CONFIG.endpoints.withdrawals,
            { memberId },
            true
        );
    }

    /**
     * Get pending withdrawals
     */
    async getPending() {
        return apiService.get(
            `${API_CONFIG.endpoints.withdrawals}/pending`,
            {},
            true
        );
    }

    /**
     * Approve withdrawal
     * @param {string|number} id - Withdrawal ID
     * @param {Object} approvalData - Approval data
     */
    async approve(id, approvalData) {
        return apiService.post(
            `${API_CONFIG.endpoints.withdrawals}/${id}/approve`,
            approvalData,
            true
        );
    }

    /**
     * Reject withdrawal
     * @param {string|number} id - Withdrawal ID
     * @param {Object} rejectionData - Rejection data
     */
    async reject(id, rejectionData) {
        return apiService.post(
            `${API_CONFIG.endpoints.withdrawals}/${id}/reject`,
            rejectionData,
            true
        );
    }

    /**
     * Get withdrawal summary
     */
    async getSummary() {
        return apiService.get(
            `${API_CONFIG.endpoints.withdrawals}/summary`,
            {},
            true
        );
    }

    /**
     * Get system balance (Contributions - Withdrawals)
     */
    async getBalance() {
        return apiService.get(
            `${API_CONFIG.endpoints.withdrawals}/balance`,
            {},
            true
        );
    }

    /**
     * Get withdrawals by type (for reports)
     */
    async getByType(params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.withdrawals}/by-type`,
            params,
            true
        );
    }
}

// Export singleton instance
export const withdrawalService = new WithdrawalService();

export default WithdrawalService;
