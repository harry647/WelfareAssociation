/**
 * API Service Layer
 * Centralized HTTP client for backend communication
 * 
 * @version 1.0.0
 */

import { API_CONFIG, APP_CONFIG } from '../config/app-config.js';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
    constructor(message, status, code, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * API Service - Base HTTP client
 */
class ApiService {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
        this.timeout = API_CONFIG.timeout;
    }

    /**
     * Get authentication token from storage
     */
    getAuthToken() {
        return localStorage.getItem(APP_CONFIG.storageKeys.authToken);
    }

    /**
     * Get refresh token from storage
     */
    getRefreshToken() {
        return localStorage.getItem(APP_CONFIG.storageKeys.refreshToken);
    }

    /**
     * Set authentication tokens
     */
    setTokens(authToken, refreshToken) {
        localStorage.setItem(APP_CONFIG.storageKeys.authToken, authToken);
        if (refreshToken) {
            localStorage.setItem(APP_CONFIG.storageKeys.refreshToken, refreshToken);
        }
    }

    /**
     * Clear authentication tokens
     */
    clearTokens() {
        localStorage.removeItem(APP_CONFIG.storageKeys.authToken);
        localStorage.removeItem(APP_CONFIG.storageKeys.refreshToken);
        localStorage.removeItem(APP_CONFIG.storageKeys.user);
    }

    /**
     * Build headers for requests
     */
    buildHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (includeAuth) {
            const token = this.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    /**
     * Handle API response
     */
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Handle token expiration
            if (response.status === 401) {
                this.clearTokens();
                window.location.href = '../auth/login-page.html';
            }

            throw new ApiError(
                errorData.message || 'An error occurred',
                response.status,
                errorData.code || 'UNKNOWN_ERROR',
                errorData
            );
        }

        return response.json();
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.buildHeaders(options.auth !== false),
            signal: AbortSignal.timeout(this.timeout),
        };

        if (API_CONFIG.debug) {
            console.log(`[API] ${config.method || 'GET'} ${url}`, config);
        }

        try {
            const response = await fetch(url, config);
            return await this.handleResponse(response);
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new ApiError('Request timeout', 408, 'TIMEOUT');
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(error.message || 'Network error', 0, 'NETWORK_ERROR');
        }
    }

    /**
     * GET request
     */
    get(endpoint, params = {}, auth = true) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET', auth });
    }

    /**
     * POST request
     */
    post(endpoint, data = {}, auth = true) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            auth,
        });
    }

    /**
     * PUT request
     */
    put(endpoint, data = {}, auth = true) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            auth,
        });
    }

    /**
     * PATCH request
     */
    patch(endpoint, data = {}, auth = true) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
            auth,
        });
    }

    /**
     * DELETE request
     */
    delete(endpoint, auth = true) {
        return this.request(endpoint, { method: 'DELETE', auth });
    }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for custom instances
export default ApiService;
