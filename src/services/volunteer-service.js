/**
 * Volunteer Service
 * Handles volunteer registrations and applications
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Volunteer Service - Volunteer operations
 */
class VolunteerService {
    /**
     * Submit volunteer registration
     * @param {Object} volunteerData - Volunteer registration data
     */
    async registerVolunteer(volunteerData) {
        return apiService.post(
            API_CONFIG.endpoints.volunteerApply,
            volunteerData,
            false // No auth required for public volunteer registration
        );
    }

    /**
     * Get all volunteers (Admin only)
     * @param {Object} params - Query parameters
     */
    async getVolunteers(params = {}) {
        return apiService.get(API_CONFIG.endpoints.volunteers, params, true);
    }

    /**
     * Get volunteer by ID (Admin only)
     * @param {string|number} id - Volunteer ID
     */
    async getVolunteerById(id) {
        return apiService.get(`${API_CONFIG.endpoints.volunteers}/${id}`, {}, true);
    }

    /**
     * Update volunteer status (Admin only)
     * @param {string|number} id - Volunteer ID
     * @param {Object} statusData - Status update data
     */
    async updateVolunteerStatus(id, statusData) {
        return apiService.patch(
            `${API_CONFIG.endpoints.volunteers}/${id}/status`,
            statusData,
            true
        );
    }

    /**
     * Delete volunteer (Admin only)
     * @param {string|number} id - Volunteer ID
     */
    async deleteVolunteer(id) {
        return apiService.delete(
            `${API_CONFIG.endpoints.volunteers}/${id}`,
            true
        );
    }

    /**
     * Get volunteer opportunities
     * @param {Object} params - Query parameters
     */
    async getOpportunities(params = {}) {
        return apiService.get(`${API_CONFIG.endpoints.volunteers}/opportunities`, params, false);
    }

    /**
     * Apply for specific volunteer opportunity
     * @param {string|number} opportunityId - Opportunity ID
     * @param {Object} applicationData - Application data
     */
    async applyForOpportunity(opportunityId, applicationData) {
        return apiService.post(
            `${API_CONFIG.endpoints.volunteers}/opportunities/${opportunityId}/apply`,
            applicationData,
            false
        );
    }

    /**
     * Get volunteer statistics (Admin only)
     */
    async getStatistics() {
        return apiService.get(`${API_CONFIG.endpoints.volunteers}/statistics`, {}, true);
    }
}

// Export singleton instance
export const volunteerService = new VolunteerService();

export default VolunteerService;
