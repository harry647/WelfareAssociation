/**
 * Loan Service
 * Handles loan operations and management
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Loan Service - Loan operations
 */
class LoanService {
    /**
     * Get all loans
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.loans, params, true);
    }

    /**
     * Get loan by ID
     * @param {string|number} id - Loan ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.loans}/${id}`, {}, true);
    }

    /**
     * Apply for a loan
     * @param {Object} loanData - Loan application data
     */
    async apply(loanData) {
        return apiService.post(API_CONFIG.endpoints.applyLoan, loanData, true);
    }

    /**
     * Update loan
     * @param {string|number} id - Loan ID
     * @param {Object} loanData - Loan data to update
     */
    async update(id, loanData) {
        return apiService.put(
            `${API_CONFIG.endpoints.loans}/${id}`,
            loanData,
            true
        );
    }

    /**
     * Approve loan (Admin only)
     * @param {string|number} id - Loan ID
     * @param {Object} approvalData - Approval data
     */
    async approve(id, approvalData = {}) {
        return apiService.patch(
            `${API_CONFIG.endpoints.loans}/${id}/approve`,
            approvalData,
            true
        );
    }

    /**
     * Reject loan (Admin only)
     * @param {string|number} id - Loan ID
     * @param {Object} rejectionData - Rejection data
     */
    async reject(id, rejectionData = {}) {
        return apiService.patch(
            `${API_CONFIG.endpoints.loans}/${id}/reject`,
            rejectionData,
            true
        );
    }

    /**
     * Delete loan
     * @param {string|number} id - Loan ID
     */
    async delete(id) {
        return apiService.delete(
            `${API_CONFIG.endpoints.loans}/${id}`,
            true
        );
    }

    /**
     * Get loans by member
     * @param {string|number} memberId - Member ID
     */
    async getByMember(memberId) {
        return apiService.get(
            API_CONFIG.endpoints.loans,
            { memberId },
            true
        );
    }

    /**
     * Get pending loan requests (Admin only)
     */
    async getPending() {
        return apiService.get(
            `${API_CONFIG.endpoints.loans}/pending`,
            {},
            true
        );
    }

    /**
     * Get loan statistics (Admin only)
     */
    async getStatistics() {
        return apiService.get(
            `${API_CONFIG.endpoints.loans}/statistics`,
            {},
            true
        );
    }
}

// Export singleton instance
export const loanService = new LoanService();

export default LoanService;
