/**
 * Document Service
 * Handles document management and storage
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Document Service - Document operations
 */
class DocumentService {
    /**
     * Get all documents
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.documents, params, true);
    }

    /**
     * Get documentation dashboard data
     */
    async getDashboard() {
        return apiService.get(API_CONFIG.endpoints.documentsDashboard, {}, true);
    }

    /**
     * Update document request status
     * @param {string} requestId - Request ID
     * @param {string} status - New status (approved/rejected)
     * @param {string} responseNote - Optional note
     */
    async updateRequestStatus(requestId, status, responseNote = '') {
        return apiService.post(
            `${API_CONFIG.endpoints.documents}/requests/${requestId}`,
            { status, responseNote },
            true
        );
    }

    /**
     * Get document by ID
     * @param {string|number} id - Document ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.documents}/${id}`, {}, true);
    }

    /**
     * Get documents by category
     * @param {string} category - Document category
     * @param {Object} params - Additional parameters
     */
    async getByCategory(category, params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.documents}/category/${category}`,
            params,
            true
        );
    }

    /**
     * Upload document
     * @param {Object} documentData - Document data with file
     */
    async upload(documentData) {
        // For file uploads, use FormData
        const formData = new FormData();
        
        if (documentData.file) {
            formData.append('file', documentData.file);
        }
        
        if (documentData.name) {
            formData.append('name', documentData.name);
        }
        
        if (documentData.category) {
            formData.append('category', documentData.category);
        }
        
        if (documentData.description) {
            formData.append('description', documentData.description);
        }
        
        if (documentData.visibility) {
            formData.append('visibility', documentData.visibility);
        }

        const url = `${apiService.baseURL}${API_CONFIG.endpoints.documents}/upload`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiService.getAuthToken()}`,
            },
            body: formData,
        });

        return apiService.handleResponse(response);
    }

    /**
     * Update document
     * @param {string|number} id - Document ID
     * @param {Object} documentData - Document data to update
     */
    async update(id, documentData) {
        return apiService.put(
            `${API_CONFIG.endpoints.documents}/${id}`,
            documentData,
            true
        );
    }

    /**
     * Delete document
     * @param {string|number} id - Document ID
     */
    async delete(id) {
        return apiService.delete(`${API_CONFIG.endpoints.documents}/${id}`, true);
    }

    /**
     * Download document
     * @param {string|number} id - Document ID
     */
    async download(id) {
        return apiService.get(
            `${API_CONFIG.endpoints.documents}/${id}/download`,
            {},
            true
        );
    }

    /**
     * Share document
     * @param {string|number} id - Document ID
     * @param {Array} memberIds - Array of member IDs to share with
     */
    async share(id, memberIds) {
        return apiService.post(
            `${API_CONFIG.endpoints.documents}/${id}/share`,
            { memberIds },
            true
        );
    }

    /**
     * Revoke document share
     * @param {string|number} id - Document ID
     * @param {Array} memberIds - Array of member IDs
     */
    async revokeShare(id, memberIds) {
        return apiService.post(
            `${API_CONFIG.endpoints.documents}/${id}/revoke`,
            { memberIds },
            true
        );
    }

    /**
     * Search documents
     * @param {string} query - Search query
     * @param {Object} params - Additional parameters
     */
    async search(query, params = {}) {
        return apiService.get(
            API_CONFIG.endpoints.documents,
            { search: query, ...params },
            true
        );
    }

    /**
     * Get document versions
     * @param {string|number} id - Document ID
     */
    async getVersions(id) {
        return apiService.get(
            `${API_CONFIG.endpoints.documents}/${id}/versions`,
            {},
            true
        );
    }

    /**
     * Restore document version
     * @param {string|number} id - Document ID
     * @param {string|number} versionId - Version ID
     */
    async restoreVersion(id, versionId) {
        return apiService.post(
            `${API_CONFIG.endpoints.documents}/${id}/versions/${versionId}/restore`,
            {},
            true
        );
    }
}

// Export singleton instance
export const documentService = new DocumentService();

// Export class for custom instances
export default DocumentService;