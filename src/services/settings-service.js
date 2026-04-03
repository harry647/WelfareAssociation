/**
 * Settings Service
 * Handles system configuration and settings management
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Settings Service - System configuration operations
 */
class SettingsService {
    /**
     * Get all settings
     * @param {Object} params - Query parameters (category, etc.)
     */
    async getAllSettings(params = {}) {
        return apiService.get(API_CONFIG.endpoints.settings, params, true);
    }

    /**
     * Get settings by category
     * @param {string} category - Settings category
     */
    async getSettingsByCategory(category) {
        return apiService.get(API_CONFIG.endpoints.settings, { category }, true);
    }

    /**
     * Get a specific setting
     * @param {string} key - Setting key
     */
    async getSetting(key) {
        return apiService.get(`${API_CONFIG.endpoints.settings}/${key}`, {}, true);
    }

    /**
     * Update a single setting
     * @param {Object} settingData - Setting data
     */
    async updateSetting(settingData) {
        return apiService.put(API_CONFIG.endpoints.settings, settingData, true);
    }

    /**
     * Update multiple settings at once
     * @param {Array} settings - Array of setting objects
     */
    async updateMultipleSettings(settings) {
        return apiService.post(`${API_CONFIG.endpoints.settings}/bulk`, { settings }, true);
    }

    /**
     * Get payment configuration
     */
    async getPaymentConfig() {
        return apiService.get(`${API_CONFIG.endpoints.settings}/payment/config`, {}, true);
    }

    /**
     * Update payment configuration
     * @param {Object} paymentConfig - Payment configuration
     */
    async updatePaymentConfig(paymentConfig) {
        return apiService.put(`${API_CONFIG.endpoints.settings}/payment/config`, paymentConfig, true);
    }

    /**
     * Save general settings
     * @param {Object} generalSettings - General settings object
     */
    async saveGeneralSettings(generalSettings) {
        const settings = [
            { key: 'organization_name', value: generalSettings.organizationName, type: 'string', category: 'general', description: 'Organization name' },
            { key: 'institution', value: generalSettings.institution, type: 'string', category: 'general', description: 'Institution name' },
            { key: 'academic_year', value: generalSettings.academicYear, type: 'string', category: 'general', description: 'Current academic year' }
        ];
        return this.updateMultipleSettings(settings);
    }

    /**
     * Save contribution settings
     * @param {Object} contributionSettings - Contribution settings object
     */
    async saveContributionSettings(contributionSettings) {
        const settings = [
            { key: 'monthly_contribution_amount', value: String(contributionSettings.monthlyAmount), type: 'number', category: 'payment', description: 'Monthly contribution amount' },
            { key: 'payment_deadline_day', value: String(contributionSettings.paymentDeadline), type: 'number', category: 'payment', description: 'Payment deadline day of month' },
            { key: 'allow_late_payments', value: String(contributionSettings.allowLatePayments), type: 'boolean', category: 'payment', description: 'Allow late payments' }
        ];
        return this.updateMultipleSettings(settings);
    }

    /**
     * Save fine settings
     * @param {Object} fineSettings - Fine settings object
     */
    async saveFineSettings(fineSettings) {
        const settings = [
            { key: 'fine_due_period_days', value: String(fineSettings.duePeriod), type: 'number', category: 'payment', description: 'Default fine due period in days' },
            { key: 'fine_collection_method', value: fineSettings.collectionMethod, type: 'string', category: 'payment', description: 'Fine collection method' },
            { key: 'enable_fine_reminders', value: String(fineSettings.enableReminders), type: 'boolean', category: 'payment', description: 'Enable fine reminders' },
            { key: 'allow_fine_history_view', value: String(fineSettings.allowHistoryView), type: 'boolean', category: 'general', description: 'Allow members to view fine history' },
            { key: 'block_loans_for_unpaid_fines', value: String(fineSettings.blockLoans), type: 'boolean', category: 'payment', description: 'Block loans for members with unpaid fines' }
        ];
        return this.updateMultipleSettings(settings);
    }

    /**
     * Save notification settings
     * @param {Object} notificationSettings - Notification settings object
     */
    async saveNotificationSettings(notificationSettings) {
        const settings = [
            { key: 'email_new_registrations', value: String(notificationSettings.newRegistrations), type: 'boolean', category: 'email', description: 'Email notifications for new registrations' },
            { key: 'email_payment_reminders', value: String(notificationSettings.paymentReminders), type: 'boolean', category: 'email', description: 'Email notifications for payment reminders' },
            { key: 'email_loan_requests', value: String(notificationSettings.loanRequests), type: 'boolean', category: 'email', description: 'Email notifications for loan requests' },
            { key: 'email_new_fines', value: String(notificationSettings.newFines), type: 'boolean', category: 'email', description: 'Email notifications for new fines' },
            { key: 'email_fine_due_reminders', value: String(notificationSettings.fineDueReminders), type: 'boolean', category: 'email', description: 'Email notifications for fine due date reminders' }
        ];
        return this.updateMultipleSettings(settings);
    }

    /**
     * Save academic settings
     * @param {Object} academicSettings - Academic settings object
     */
    async saveAcademicSettings(academicSettings) {
        const settings = [
            { key: 'semester_start', value: academicSettings.semesterStart, type: 'date', category: 'academic', description: 'Semester start date' },
            { key: 'semester_end', value: academicSettings.semesterEnd, type: 'date', category: 'academic', description: 'Semester end date' },
            { key: 'exam_period_weeks', value: String(academicSettings.examPeriod), type: 'number', category: 'academic', description: 'Exam period in weeks' },
            { key: 'min_attendance_percentage', value: String(academicSettings.minAttendance), type: 'number', category: 'academic', description: 'Minimum attendance requirement' }
        ];
        return this.updateMultipleSettings(settings);
    }

    /**
     * Save financial settings
     * @param {Object} financialSettings - Financial settings object
     */
    async saveFinancialSettings(financialSettings) {
        const settings = [
            { key: 'loan_interest_rate', value: String(financialSettings.loanInterestRate), type: 'number', category: 'financial', description: 'Loan interest rate' },
            { key: 'max_loan_amount', value: String(financialSettings.maxLoanAmount), type: 'number', category: 'financial', description: 'Maximum loan amount' },
            { key: 'loan_processing_fee', value: String(financialSettings.loanProcessingFee), type: 'number', category: 'financial', description: 'Loan processing fee' },
            { key: 'loan_grace_period', value: String(financialSettings.gracePeriod), type: 'number', category: 'financial', description: 'Loan grace period in days' }
        ];
        return this.updateMultipleSettings(settings);
    }

    /**
     * Save membership settings
     * @param {Object} membershipSettings - Membership settings object
     */
    async saveMembershipSettings(membershipSettings) {
        const settings = [
            { key: 'membership_expiry_months', value: String(membershipSettings.membershipExpiry), type: 'number', category: 'membership', description: 'Membership expiry in months' },
            { key: 'registration_fee', value: String(membershipSettings.registrationFee), type: 'number', category: 'membership', description: 'Registration fee' },
            { key: 'auto_renew_membership', value: String(membershipSettings.autoRenewMembership), type: 'boolean', category: 'membership', description: 'Enable auto-renewal' },
            { key: 'require_admin_approval', value: String(membershipSettings.requireApproval), type: 'boolean', category: 'membership', description: 'Require admin approval for new members' }
        ];
        return this.updateMultipleSettings(settings);
    }

    /**
     * Save reporting settings
     * @param {Object} reportingSettings - Reporting settings object
     */
    async saveReportingSettings(reportingSettings) {
        const settings = [
            { key: 'report_frequency', value: reportingSettings.reportFrequency, type: 'string', category: 'reporting', description: 'Automated report frequency' },
            { key: 'report_recipients', value: reportingSettings.reportRecipients, type: 'string', category: 'reporting', description: 'Report recipients' },
            { key: 'include_charts', value: String(reportingSettings.includeCharts), type: 'boolean', category: 'reporting', description: 'Include charts in reports' },
            { key: 'archive_reports', value: String(reportingSettings.archiveReports), type: 'boolean', category: 'reporting', description: 'Archive old reports' }
        ];
        return this.updateMultipleSettings(settings);
    }

    /**
     * Save security settings
     * @param {Object} securitySettings - Security settings object
     */
    async saveSecuritySettings(securitySettings) {
        const settings = [
            { key: 'session_timeout', value: String(securitySettings.sessionTimeout), type: 'number', category: 'security', description: 'Session timeout in minutes' },
            { key: 'max_login_attempts', value: String(securitySettings.maxLoginAttempts), type: 'number', category: 'security', description: 'Maximum login attempts' },
            { key: 'lockout_duration', value: String(securitySettings.lockoutDuration), type: 'number', category: 'security', description: 'Account lockout duration' },
            { key: 'require_two_factor', value: String(securitySettings.requireTwoFactor), type: 'boolean', category: 'security', description: 'Require two-factor authentication' },
            { key: 'log_failed_attempts', value: String(securitySettings.logFailedAttempts), type: 'boolean', category: 'security', description: 'Log failed login attempts' }
        ];
        return this.updateMultipleSettings(settings);
    }

    /**
     * Save system settings
     * @param {Object} systemSettings - System settings object
     */
    async saveSystemSettings(systemSettings) {
        const settings = [
            { key: 'maintenance_mode', value: String(systemSettings.maintenanceMode), type: 'boolean', category: 'system', description: 'Enable maintenance mode' },
            { key: 'maintenance_message', value: systemSettings.maintenanceMessage, type: 'string', category: 'system', description: 'Maintenance message' },
            { key: 'backup_frequency', value: systemSettings.backupFrequency, type: 'string', category: 'system', description: 'Automatic backup frequency' },
            { key: 'data_retention_period', value: String(systemSettings.dataRetention), type: 'number', category: 'system', description: 'Data retention period in months' }
        ];
        return this.updateMultipleSettings(settings);
    }
}

// Create singleton instance
const settingsService = new SettingsService();

export default settingsService;
