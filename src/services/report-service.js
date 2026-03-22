/**
 * Report Service
 * Handles reports generation and management
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Report Service - Report operations
 */
class ReportService {
    /**
     * Get all reports
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.reports, params, true);
    }

    /**
     * Get report by ID
     * @param {string|number} id - Report ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.reports}/${id}`, {}, true);
    }

    /**
     * Get report by type
     * @param {string} type - Report type
     * @param {Object} params - Query parameters
     */
    async getByType(type, params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.reports}/type/${type}`,
            params,
            true
        );
    }

    /**
     * Generate new report
     * @param {Object} reportConfig - Report configuration
     */
    async generate(reportConfig) {
        return apiService.post(
            `${API_CONFIG.endpoints.reports}/generate`,
            reportConfig,
            true
        );
    }

    /**
     * Export report
     * @param {string|number} id - Report ID
     * @param {string} format - Export format (pdf, csv, excel)
     */
    async export(id, format = 'pdf') {
        return apiService.get(
            `${API_CONFIG.endpoints.reports}/${id}/export`,
            { format },
            true
        );
    }

    /**
     * Download report
     * @param {string|number} id - Report ID
     * @param {string} format - Export format
     */
    async download(id, format = 'pdf') {
        return apiService.get(
            `${API_CONFIG.endpoints.reports}/${id}/download`,
            { format },
            true
        );
    }

    /**
     * Schedule report (Admin only)
     * @param {Object} scheduleData - Schedule configuration
     */
    async schedule(scheduleData) {
        return apiService.post(
            `${API_CONFIG.endpoints.reports}/schedule`,
            scheduleData,
            true
        );
    }

    /**
     * Get scheduled reports (Admin only)
     */
    async getScheduled() {
        return apiService.get(
            `${API_CONFIG.endpoints.reports}/scheduled`,
            {},
            true
        );
    }

    /**
     * Delete scheduled report (Admin only)
     * @param {string|number} id - Schedule ID
     */
    async deleteSchedule(id) {
        return apiService.delete(
            `${API_CONFIG.endpoints.reports}/schedule/${id}`,
            true
        );
    }

    /**
     * Get report templates
     */
    async getTemplates() {
        return apiService.get(
            `${API_CONFIG.endpoints.reports}/templates`,
            {},
            true
        );
    }

    /**
     * Get contribution report
     * @param {Object} params - Query parameters
     */
    async getContributionReport(params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.reports}/contributions`,
            params,
            true
        );
    }

    /**
     * Get loan report
     * @param {Object} params - Query parameters
     */
    async getLoanReport(params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.reports}/loans`,
            params,
            true
        );
    }

    /**
     * Get bereavement report
     * @param {Object} params - Query parameters
     */
    async getBereavementReport(params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.reports}/bereavement`,
            params,
            true
        );
    }

    /**
     * Get membership report
     * @param {Object} params - Query parameters
     */
    async getMembershipReport(params = {}) {
        return apiService.get(
            `${API_CONFIG.endpoints.reports}/membership`,
            params,
            true
        );
    }
}

// Export singleton instance
export const reportService = new ReportService();

// Export class for custom instances
export default ReportService;