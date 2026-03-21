/**
 * Member Service
 * Handles member-related operations and data management
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Member Service - Member data operations
 */
class MemberService {
    /**
     * Get all members
     * @param {Object} params - Query parameters (page, limit, search, etc.)
     */
    async getAllMembers(params = {}) {
        return apiService.get(API_CONFIG.endpoints.members, params, true);
    }

    /**
     * Get member by ID
     * @param {string|number} id - Member ID
     */
    async getMemberById(id) {
        return apiService.get(`${API_CONFIG.endpoints.members}/${id}`, {}, true);
    }

    /**
     * Get current user profile
     */
    async getProfile() {
        return apiService.get(API_CONFIG.endpoints.profile, {}, true);
    }

    /**
     * Update member profile
     * @param {Object} profileData - Profile data to update
     */
    async updateProfile(profileData) {
        return apiService.put(API_CONFIG.endpoints.profile, profileData, true);
    }

    /**
     * Get member contributions
     * @param {string|number} memberId - Member ID
     */
    async getContributions(memberId) {
        return apiService.get(
            `${API_CONFIG.endpoints.members}/${memberId}/contributions`,
            {},
            true
        );
    }

    /**
     * Get member loans
     * @param {string|number} memberId - Member ID
     */
    async getLoans(memberId) {
        return apiService.get(
            `${API_CONFIG.endpoints.members}/${memberId}/loans`,
            {},
            true
        );
    }

    /**
     * Get member debts
     * @param {string|number} memberId - Member ID
     */
    async getDebts(memberId) {
        return apiService.get(
            `${API_CONFIG.endpoints.members}/${memberId}/debts`,
            {},
            true
        );
    }

    /**
     * Add new member (Admin only)
     * @param {Object} memberData - Member data
     */
    async addMember(memberData) {
        return apiService.post(API_CONFIG.endpoints.members, memberData, true);
    }

    /**
     * Update member
     * @param {string|number} id - Member ID
     * @param {Object} memberData - Member data to update
     */
    async updateMember(id, memberData) {
        return apiService.put(
            `${API_CONFIG.endpoints.members}/${id}`,
            memberData,
            true
        );
    }

    /**
     * Delete member (Admin only)
     * @param {string|number} id - Member ID
     */
    async deleteMember(id) {
        return apiService.delete(`${API_CONFIG.endpoints.members}/${id}`, true);
    }

    /**
     * Search members
     * @param {string} query - Search query
     */
    async searchMembers(query) {
        return apiService.get(API_CONFIG.endpoints.members, { search: query }, true);
    }

    /**
     * Get member statistics (Admin only)
     */
    async getStatistics() {
        return apiService.get(`${API_CONFIG.endpoints.members}/statistics`, {}, true);
    }
}

// Export singleton instance
export const memberService = new MemberService();

// Export class for custom instances
export default MemberService;
