/**
 * Gallery Service
 * Handles gallery images and media
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Gallery Service - Gallery operations
 */
class GalleryService {
    /**
     * Get all gallery items
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.gallery, params, false);
    }

    /**
     * Get gallery item by ID
     * @param {string|number} id - Gallery ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.gallery}/${id}`, {}, false);
    }

    /**
     * Get gallery by album
     * @param {string} album - Album name
     * @param {Object} params - Additional parameters
     */
    async getByAlbum(album, params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.gallery}/album/${album}`,
            params,
            false
        );
    }

    /**
     * Get featured gallery items
     */
    async getFeatured() {
        return apiService.get(
            `${API_CONFIG.endpoints.gallery}/featured`,
            {},
            false
        );
    }

    /**
     * Upload gallery item
     * @param {Object} galleryData - Gallery data with file
     */
    async upload(galleryData) {
        // For file uploads, use FormData
        const formData = new FormData();
        
        if (galleryData.file) {
            formData.append('file', galleryData.file);
        }
        
        if (galleryData.title) {
            formData.append('title', galleryData.title);
        }
        
        if (galleryData.description) {
            formData.append('description', galleryData.description);
        }
        
        if (galleryData.album) {
            formData.append('album', galleryData.album);
        }

        const url = `${apiService.baseURL}${API_CONFIG.endpoints.gallery}/upload`;
        
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
     * Update gallery item
     * @param {string|number} id - Gallery ID
     * @param {Object} galleryData - Gallery data to update
     */
    async update(id, galleryData) {
        return apiService.put(
            `${API_CONFIG.endpoints.gallery}/${id}`,
            galleryData,
            true
        );
    }

    /**
     * Delete gallery item
     * @param {string|number} id - Gallery ID
     */
    async delete(id) {
        return apiService.delete(`${API_CONFIG.endpoints.gallery}/${id}`, true);
    }

    /**
     * Set as featured
     * @param {string|number} id - Gallery ID
     */
    async setFeatured(id) {
        return apiService.patch(
            `${API_CONFIG.endpoints.gallery}/${id}/featured`,
            {},
            true
        );
    }

    /**
     * Remove from featured
     * @param {string|number} id - Gallery ID
     */
    async removeFeatured(id) {
        return apiService.patch(
            `${API_CONFIG.endpoints.gallery}/${id}/unfeatured`,
            {},
            true
        );
    }

    /**
     * Get albums
     */
    async getAlbums() {
        return apiService.get(
            `${API_CONFIG.endpoints.gallery}/albums`,
            {},
            false
        );
    }

    /**
     * Create album
     * @param {Object} albumData - Album data
     */
    async createAlbum(albumData) {
        return apiService.post(
            `${API_CONFIG.endpoints.gallery}/albums`,
            albumData,
            true
        );
    }

    /**
     * Delete album
     * @param {string} album - Album name
     */
    async deleteAlbum(album) {
        return apiService.delete(
            `${API_CONFIG.endpoints.gallery}/albums/${album}`,
            true
        );
    }

    /**
     * Search gallery
     * @param {string} query - Search query
     */
    async search(query) {
        return apiService.get(
            API_CONFIG.endpoints.gallery,
            { search: query },
            false
        );
    }
}

// Export singleton instance
export const galleryService = new GalleryService();

// Export class for custom instances
export default GalleryService;