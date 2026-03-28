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
     * Get member's loan eligibility
     * @returns {Object} Loan eligibility data
     */
    async getEligibility() {
        return apiService.get(API_CONFIG.endpoints.loanEligibility, {}, true);
    }

    /**
     * Apply for a loan
     * @param {Object} loanData - Loan application data
     */
    async apply(loanData) {
        return apiService.post(API_CONFIG.endpoints.applyLoan, loanData, true);
    }

    /**
     * Apply for a loan (alias for apply)
     * @param {Object} loanData - Loan application data
     */
    async applyForLoan(loanData) {
        try {
            // In production, this would call the actual API
            // For demo, return success
            console.log('Applying for loan:', loanData);
            return {
                success: true,
                message: 'Loan application submitted successfully',
                data: {
                    loanId: loanData.loanId || this.generateLoanId(),
                    status: 'pending',
                    ...loanData
                }
            };
        } catch (error) {
            console.error('Error applying for loan:', error);
            return {
                success: false,
                message: error.message || 'Failed to submit loan application'
            };
        }
    }

    /**
     * Make a loan payment
     * @param {Object} paymentData - Payment data
     */
    async makePayment(paymentData) {
        try {
            // In production, this would call the actual API
            // For demo, return success
            console.log('Processing payment:', paymentData);
            return {
                success: true,
                message: 'Payment processed successfully',
                data: {
                    paymentId: this.generatePaymentId(),
                    ...paymentData
                }
            };
        } catch (error) {
            console.error('Error processing payment:', error);
            return {
                success: false,
                message: error.message || 'Failed to process payment'
            };
        }
    }

    /**
     * Get loan payment history
     * @param {string} loanId - Loan ID
     */
    async getPaymentHistory(loanId) {
        try {
            return {
                success: true,
                data: []
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Initiate STK Push payment
     * @param {Object} stkData - STK Push data
     */
    async initiateSTKPush(stkData) {
        try {
            // In production, this would call the M-Pesa API
            console.log('Initiating STK Push:', stkData);
            return {
                success: true,
                checkoutRequestId: this.generateCheckoutId(),
                message: 'STK push initiated'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to initiate STK push'
            };
        }
    }

    /**
     * Check loan eligibility
     * @param {string} studentId - Student ID
     */
    async checkEligibility(studentId) {
        try {
            // In production, check actual eligibility
            return {
                success: true,
                eligible: true,
                message: 'Eligible for loan'
            };
        } catch (error) {
            return {
                success: false,
                eligible: false,
                message: error.message
            };
        }
    }

    /**
     * Check guarantor status
     * @param {string} guarantorId - Guarantor ID
     */
    async checkGuarantor(guarantorId) {
        try {
            // In production, check actual guarantor status
            return {
                success: true,
                activeGuarantees: 0,
                message: 'Guarantor is valid'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Generate loan receipt
     * @param {Object} receiptData - Receipt data
     */
    async generateReceipt(receiptData) {
        try {
            return {
                success: true,
                pdfUrl: null,
                message: 'Receipt generated'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
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

    // ============================================
    // PENALTY CALCULATION (New - Phase 2: Overdue)
    // ============================================
    
    /**
     * Calculate penalty for overdue loan
     * Formula: Penalty = Balance × 1% per day × Days Overdue
     * @param {number} balance - Remaining balance
     * @param {number} daysOverdue - Number of days overdue
     * @returns {number} Penalty amount
     */
    calculatePenalty(balance, daysOverdue) {
        const dailyRate = 0.01; // 1% per day
        const penalty = balance * dailyRate * daysOverdue;
        return penalty;
    }
    
    /**
     * Check if loan is overdue and calculate days
     * @param {string|Date} dueDate - The due date of the loan
     * @returns {number} Number of days overdue (0 if not overdue)
     */
    checkOverdue(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        
        if (today > due) {
            const diffTime = today - due;
            const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return days;
        }
        return 0;
    }
    
    /**
     * Calculate complete loan with interest and potential penalty
     * @param {number} principal - Loan principal amount
     * @param {number} months - Repayment period in months
     * @param {string|Date} dueDate - Due date for repayment
     * @returns {Object} Complete loan calculation
     */
    calculateLoan(principal, months, dueDate = null) {
        // Phase 1: Normal Loan Period - 10% flat interest
        const interestRate = 0.10;
        const interest = principal * interestRate;
        const total = principal + interest;
        const monthly = months > 0 ? total / months : 0;
        
        // Calculate due date if not provided
        if (!dueDate) {
            const today = new Date();
            today.setMonth(today.getMonth() + months);
            dueDate = today.toISOString().split('T')[0];
        }
        
        // Phase 2: Check for overdue and calculate penalty
        const daysOverdue = this.checkOverdue(dueDate);
        const penalty = daysOverdue > 0 ? this.calculatePenalty(principal, daysOverdue) : 0;
        const newTotal = penalty > 0 ? principal + interest + penalty : total;
        
        return {
            principal,
            interest,
            total,
            monthly,
            dueDate,
            daysOverdue,
            penalty,
            newTotal: newTotal
        };
    }
    
    /**
     * Get loan status with penalty info
     * @param {Object} loan - Loan object from database
     * @returns {Object} Loan with updated status and penalty
     */
    getLoanWithPenalty(loan) {
        const daysOverdue = this.checkOverdue(loan.due_date);
        const penalty = daysOverdue > 0 ? this.calculatePenalty(loan.principal, daysOverdue) : 0;
        
        let status = loan.status;
        if (daysOverdue > 0 && status === 'active') {
            status = 'overdue';
        }
        
        return {
            ...loan,
            daysOverdue,
            penalty,
            updatedBalance: loan.principal + (loan.interest || 0) + penalty - (loan.paid_amount || 0)
        };
    }

    // Helper methods
    generateLoanId() {
        const date = new Date();
        const year = date.getFullYear();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `LN/${year}/${random}`;
    }

    generatePaymentId() {
        const date = new Date();
        const timestamp = date.getTime().toString().slice(-8);
        return `PAY${timestamp}`;
    }

    generateCheckoutId() {
        const date = new Date();
        const timestamp = date.getTime().toString();
        return `ws_${timestamp}`;
    }

    generateReceiptNumber() {
        const date = new Date();
        const timestamp = date.getTime().toString().slice(-8);
        return `RCP${timestamp}`;
    }
}

// Export singleton instance
export const loanService = new LoanService();

// Also export the class for extension
export default LoanService;
