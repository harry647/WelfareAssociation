/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG, APP_CONFIG } from '../config/app-config.js';

/**
 * Auth Service - Authentication logic
 */
class AuthService {
    constructor() {
        this.currentUser = null;
        this.loadUserFromStorage();
    }

    /**
     * Load user from localStorage
     */
    loadUserFromStorage() {
        const userData = localStorage.getItem(APP_CONFIG.storageKeys.user);
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (e) {
                this.currentUser = null;
            }
        }
    }

    /**
     * Save user to localStorage
     */
    saveUser(user) {
        this.currentUser = user;
        localStorage.setItem(APP_CONFIG.storageKeys.user, JSON.stringify(user));
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = apiService.getAuthToken();
        console.log('authService.isAuthenticated() - token exists:', !!token);
        console.log('authService.isAuthenticated() - token value:', token ? token.substring(0, 20) + '...' : 'null');
        return !!token;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User data
     */
    async login(email, password) {
        try {
            console.log('authService.login() called with email:', email);
            const response = await apiService.post(
                API_CONFIG.endpoints.login,
                { email, password },
                false // Don't include auth header
            );

            console.log('Login response received:', response);

            if (response.token) {
                console.log('Setting tokens...');
                apiService.setTokens(response.token, response.refreshToken);
                console.log('Tokens set successfully');
                this.saveUser(response.user);
                console.log('User saved to localStorage');
            }

            console.log('Login completed successfully');
            return response;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration response
     */
    async register(userData) {
        try {
            const response = await apiService.post(
                API_CONFIG.endpoints.register,
                userData,
                false
            );

            if (response.token) {
                apiService.setTokens(response.token, response.refreshToken);
                this.saveUser(response.user);
            }

            return response;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout() {
        console.log('authService.logout() called');
        try {
            await apiService.post(API_CONFIG.endpoints.logout, {}, true);
            console.log('Logout API call successful');
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            console.log('Clearing tokens and redirecting...');
            apiService.clearTokens();
            this.currentUser = null;
            window.location.href = '/index.html';
        }
    }

    /**
     * Refresh authentication token
     */
    async refreshToken() {
        const refreshToken = apiService.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await apiService.post(
                API_CONFIG.endpoints.refreshToken,
                { refreshToken },
                false
            );

            if (response.token) {
                apiService.setTokens(response.token, response.refreshToken);
            }

            return response;
        } catch (error) {
            this.logout();
            throw error;
        }
    }

    /**
     * Update user profile
     * @param {Object} profileData - Profile data to update
     */
    async updateProfile(profileData) {
        const response = await apiService.put(
            API_CONFIG.endpoints.profile,
            profileData,
            true
        );

        if (response.user) {
            this.saveUser(response.user);
        }

        return response;
    }

    /**
     * Change password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     */
    async changePassword(currentPassword, newPassword) {
        return apiService.post(
            '/auth/change-password',
            { currentPassword, newPassword },
            true
        );
    }

    /**
     * Request password reset
     * @param {string} email - User email
     */
    async requestPasswordReset(email) {
        return apiService.post(
            '/auth/forgot-password',
            { email },
            false
        );
    }

    /**
     * Reset password with token
     * @param {string} token - Reset token
     * @param {string} newPassword - New password
     */
    async resetPassword(token, newPassword) {
        return apiService.post(
            '/auth/reset-password',
            { token, newPassword },
            false
        );
    }
}

// Export singleton instance
export const authService = new AuthService();

// Export class for custom instances
export default AuthService;
