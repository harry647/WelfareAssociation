/**
 * User Service
 * Handles executive team API calls
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

class UserService {
    /**
     * Get all executive team members
     * @returns {Promise<Array>} Executive team members
     */
    async getExecutiveTeam() {
        try {
            const response = await apiService.get(`${API_CONFIG.endpoints.users}/executive-team`);
            return response.data || response || [];
        } catch (error) {
            console.error('Error fetching executive team:', error);
            throw error;
        }
    }

    /**
     * Get current user profile
     * @returns {Promise<Object>} User profile data
     */
    async getProfile() {
        try {
            const response = await apiService.get(API_CONFIG.endpoints.profile);
            return response.data || response;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    }

    /**
     * Update current user profile
     * @param {Object} profileData - Profile data to update
     * @returns {Promise<Object>} Updated profile
     */
    async updateProfile(profileData) {
        try {
            const response = await apiService.put(API_CONFIG.endpoints.profile, profileData);
            return response.data || response;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    /**
     * Change password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Result
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await apiService.put(`${API_CONFIG.endpoints.users}/password`, {
                currentPassword,
                newPassword
            });
            return response.data || response;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }

    /**
     * Get all users (admin only)
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Users list
     */
    async getAllUsers(options = {}) {
        try {
            const { role, search, page = 1, limit = 10 } = options;
            const params = { role, search, page, limit };
            
            const response = await apiService.get(API_CONFIG.endpoints.users, params);
            return response.data || response;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User data
     */
    async getUserById(userId) {
        try {
            const response = await apiService.get(`${API_CONFIG.endpoints.users}/${userId}`);
            return response.data || response;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    }

    /**
     * Update user (admin only)
     * @param {string} userId - User ID
     * @param {Object} userData - User data to update
     * @returns {Promise<Object>} Updated user
     */
    async updateUser(userId, userData) {
        try {
            const response = await apiService.put(`${API_CONFIG.endpoints.users}/${userId}`, userData);
            return response.data || response;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Delete user (admin only)
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Result
     */
    async deleteUser(userId) {
        try {
            const response = await apiService.delete(`${API_CONFIG.endpoints.users}/${userId}`);
            return response.data || response;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
