/**
 * Payment Service
 * Handles payment operations, processing, and history
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Payment Service - Payment operations
 */
class PaymentService {
    /**
     * Get all payments
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.payments, params, true);
    }

    /**
     * Get payment by ID
     * @param {string|number} id - Payment ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.payments}/${id}`, {}, true);
    }

    /**
     * Get payments by member
     * @param {string|number} memberId - Member ID
     */
    async getByMember(memberId) {
        return apiService.get(
            API_CONFIG.endpoints.payments,
            { memberId },
            true
        );
    }

    /**
     * Get payments by type
     * @param {string} type - Payment type
     * @param {Object} params - Additional parameters
     */
    async getByType(type, params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.payments}/type/${type}`,
            params,
            true
        );
    }

    /**
     * Get payments by status
     * @param {string} status - Payment status
     * @param {Object} params - Additional parameters
     */
    async getByStatus(status, params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.payments}/status/${status}`,
            params,
            true
        );
    }

    /**
     * Initiate payment
     * @param {Object} paymentData - Payment data
     */
    async initiate(paymentData) {
        return apiService.post(
            API_CONFIG.endpoints.payments,
            paymentData,
            true
        );
    }

    /**
     * Process payment
     * @param {string|number} id - Payment ID
     * @param {Object} paymentData - Payment processing data
     */
    async process(id, paymentData) {
        return apiService.post(
            `${API_CONFIG.endpoints.payments}/${id}/process`,
            paymentData,
            true
        );
    }

    /**
     * Verify payment
     * @param {string|number} id - Payment ID
     */
    async verify(id) {
        return apiService.get(
            `${API_CONFIG.endpoints.payments}/${id}/verify`,
            {},
            true
        );
    }

    /**
     * Cancel payment
     * @param {string|number} id - Payment ID
     * @param {Object} cancelData - Cancellation data
     */
    async cancel(id, cancelData = {}) {
        return apiService.post(
            `${API_CONFIG.endpoints.payments}/${id}/cancel`,
            cancelData,
            true
        );
    }

    /**
     * Refund payment (Admin only)
     * @param {string|number} id - Payment ID
     * @param {Object} refundData - Refund data
     */
    async refund(id, refundData) {
        return apiService.post(
            `${API_CONFIG.endpoints.payments}/${id}/refund`,
            refundData,
            true
        );
    }

    /**
     * Initiate STK Push (M-Pesa)
     * @param {Object} stkData - STK Push data
     */
    async initiateSTKPush(stkData) {
        return apiService.post(
            `${API_CONFIG.endpoints.payments}/stk-push`,
            stkData,
            true
        );
    }

    /**
     * Check STK Push status
     * @param {string} checkoutRequestId - Checkout request ID
     */
    async checkSTKPushStatus(checkoutRequestId) {
        return apiService.get(
            `${API_CONFIG.endpoints.payments}/stk-push/status`,
            { checkoutRequestId },
            true
        );
    }

    /**
     * Process manual payment (Admin only)
     * @param {Object} paymentData - Manual payment data
     */
    async processManual(paymentData) {
        return apiService.post(
            `${API_CONFIG.endpoints.payments}/manual`,
            paymentData,
            true
        );
    }

    /**
     * Get payment methods
     */
    async getPaymentMethods() {
        return apiService.get(
            `${API_CONFIG.endpoints.payments}/methods`,
            {},
            false
        );
    }

    /**
     * Get payment statistics
     */
    async getStatistics() {
        return apiService.get(
            `${API_CONFIG.endpoints.payments}/statistics`,
            {},
            true
        );
    }

    /**
     * Get total payments
     * @param {Object} params - Query parameters
     */
    async getTotal(params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.payments}/total`,
            params,
            true
        );
    }

    /**
     * Export payments
     * @param {string} format - Export format (csv, pdf, excel)
     * @param {Object} params - Query parameters
     */
    async export(format = 'csv', params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.payments}/export`,
            { format, ...params },
            true
        );
    }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export class for custom instances
export default PaymentService;