import { showAlert } from '../../../utils/utility-functions.js';
import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';
import settingsService from '../../../services/settings-service.js';
import { APP_CONFIG } from '../../../config/app-config.js';

/**
 * Settings Script
 * Handles system settings functionality
 * 
 * @version 1.0.0
 */

class Settings {
    constructor() {
        this.settings = {};
        this.init();
    }

    async init() {
        this.initSidebar();
        this.initEventListeners();
        await this.loadSettings();
    }

    initSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        }
    }

    initEventListeners() {
        // General settings form
        const generalForm = document.getElementById('generalSettingsForm');
        if (generalForm) {
            generalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveGeneralSettings(e);
            });
        }

        // Contribution settings form
        const contributionForm = document.getElementById('contributionSettingsForm');
        if (contributionForm) {
            contributionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveContributionSettings(e);
            });
        }

        // Fine settings form
        const fineForm = document.getElementById('fineSettingsForm');
        if (fineForm) {
            fineForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveFineSettings(e);
            });
        }

        // Notification settings form
        const notificationForm = document.getElementById('notificationSettingsForm');
        if (notificationForm) {
            notificationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNotificationSettings(e);
            });
        }

        // Academic settings form
        const academicForm = document.getElementById('academicSettingsForm');
        if (academicForm) {
            academicForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAcademicSettings(e);
            });
        }

        // Financial settings form
        const financialForm = document.getElementById('financialSettingsForm');
        if (financialForm) {
            financialForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveFinancialSettings(e);
            });
        }

        // Membership settings form
        const membershipForm = document.getElementById('membershipSettingsForm');
        if (membershipForm) {
            membershipForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveMembershipSettings(e);
            });
        }

        // Reporting settings form
        const reportingForm = document.getElementById('reportingSettingsForm');
        if (reportingForm) {
            reportingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveReportingSettings(e);
            });
        }

        // Security settings form
        const securityForm = document.getElementById('securitySettingsForm');
        if (securityForm) {
            securityForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSecuritySettings(e);
            });
        }

        // System settings form
        const systemForm = document.getElementById('systemSettingsForm');
        if (systemForm) {
            systemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSystemSettings(e);
            });
        }

        // Individual save buttons (fallback for forms without proper structure)
        document.querySelectorAll('button[onclick*="saveSettings"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.closest('.data-section');
                if (section) {
                    this.handleSectionSave(section);
                }
            });
        });

        // Generic save buttons
        document.querySelectorAll('.btn').forEach(btn => {
            if (btn.textContent.includes('Save Changes')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = btn.closest('.data-section');
                    if (section) {
                        this.handleSectionSave(section);
                    }
                });
            }
        });

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadSettings() {
        try {
            const response = await settingsService.getAllSettings();
            
            if (response && response.success) {
                this.settings = response.data;
                this.populateFormFields();
            } else {
                showAlert('Failed to load settings', 'Error', 'error');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            showAlert('Error loading settings', 'Error', 'error');
        }
    }

    populateFormFields() {
        // General settings
        this.setFieldValue('organizationName', this.settings.organization_name);
        this.setFieldValue('institution', this.settings.institution);
        this.setFieldValue('academicYear', this.settings.academic_year);

        // Contribution settings
        this.setFieldValue('monthlyContribution', this.settings.monthly_contribution_amount);
        this.setFieldValue('paymentDeadline', this.settings.payment_deadline_day);
        this.setCheckboxValue('allowLatePayments', this.settings.allow_late_payments);

        // Fine settings
        this.setFieldValue('fineDuePeriod', this.settings.fine_due_period_days);
        this.setFieldValue('fineCollectionMethod', this.settings.fine_collection_method);
        this.setCheckboxValue('enableFineReminders', this.settings.enable_fine_reminders);
        this.setCheckboxValue('allowFineHistoryView', this.settings.allow_fine_history_view);
        this.setCheckboxValue('blockLoansForUnpaidFines', this.settings.block_loans_for_unpaid_fines);

        // Notification settings
        this.setCheckboxValue('emailNewRegistrations', this.settings.email_new_registrations);
        this.setCheckboxValue('emailPaymentReminders', this.settings.email_payment_reminders);
        this.setCheckboxValue('emailLoanRequests', this.settings.email_loan_requests);
        this.setCheckboxValue('emailNewFines', this.settings.email_new_fines);
        this.setCheckboxValue('emailFineDueReminders', this.settings.email_fine_due_reminders);

        // Academic settings
        this.setFieldValue('semesterStart', this.settings.semester_start);
        this.setFieldValue('semesterEnd', this.settings.semester_end);
        this.setFieldValue('examPeriod', this.settings.exam_period_weeks);
        this.setFieldValue('minAttendance', this.settings.min_attendance_percentage);

        // Financial settings
        this.setFieldValue('loanInterestRate', this.settings.loan_interest_rate);
        this.setFieldValue('maxLoanAmount', this.settings.max_loan_amount);
        this.setFieldValue('loanProcessingFee', this.settings.loan_processing_fee);
        this.setFieldValue('gracePeriod', this.settings.loan_grace_period);

        // Membership settings
        this.setFieldValue('membershipExpiry', this.settings.membership_expiry_months);
        this.setFieldValue('registrationFee', this.settings.registration_fee);
        this.setCheckboxValue('autoRenewMembership', this.settings.auto_renew_membership);
        this.setCheckboxValue('requireApproval', this.settings.require_admin_approval);

        // Reporting settings
        this.setFieldValue('reportFrequency', this.settings.report_frequency);
        this.setFieldValue('reportRecipients', this.settings.report_recipients);
        this.setCheckboxValue('includeCharts', this.settings.include_charts);
        this.setCheckboxValue('archiveReports', this.settings.archive_reports);

        // Security settings
        this.setFieldValue('sessionTimeout', this.settings.session_timeout);
        this.setFieldValue('maxLoginAttempts', this.settings.max_login_attempts);
        this.setFieldValue('lockoutDuration', this.settings.lockout_duration);
        this.setCheckboxValue('requireTwoFactor', this.settings.require_two_factor);
        this.setCheckboxValue('logFailedAttempts', this.settings.log_failed_attempts);

        // System settings
        this.setCheckboxValue('maintenanceMode', this.settings.maintenance_mode);
        this.setFieldValue('maintenanceMessage', this.settings.maintenance_message);
        this.setFieldValue('backupFrequency', this.settings.backup_frequency);
        this.setFieldValue('dataRetention', this.settings.data_retention_period);
    }

    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field && value !== undefined) {
            field.value = value;
        }
    }

    setCheckboxValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field && value !== undefined) {
            field.checked = value === 'true' || value === true;
        }
    }

    // Button state management methods
    setButtonLoading(button, text) {
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        button.classList.add('loading');
    }

    setButtonSuccess(button, text) {
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-check"></i> ${text}`;
        button.classList.remove('loading');
        button.classList.add('success');
    }

    setButtonError(button, text) {
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-times"></i> ${text}`;
        button.classList.remove('loading');
        button.classList.add('error');
    }

    resetButton(button, originalText) {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('loading', 'success', 'error');
    }

    async saveGeneralSettings(e) {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            // Show loading state
            this.setButtonLoading(submitBtn, 'Saving...');
            
            const formData = new FormData(e.target);
            const generalSettings = {
                organizationName: formData.get('organizationName'),
                institution: formData.get('institution'),
                academicYear: formData.get('academicYear')
            };

            const response = await settingsService.saveGeneralSettings(generalSettings);
            
            if (response && response.success) {
                this.setButtonSuccess(submitBtn, 'Saved!');
                showAlert('General settings saved successfully!', 'Success', 'success');
                
                // Reset button after success
                setTimeout(() => {
                    this.resetButton(submitBtn, originalText);
                }, 2000);
            } else {
                this.setButtonError(submitBtn, 'Failed');
                showAlert('Failed to save general settings', 'Error', 'error');
                
                // Reset button after error
                setTimeout(() => {
                    this.resetButton(submitBtn, originalText);
                }, 2000);
            }
        } catch (error) {
            console.error('Error saving general settings:', error);
            this.setButtonError(submitBtn, 'Error');
            showAlert('Error saving general settings', 'Error', 'error');
            
            // Reset button after error
            setTimeout(() => {
                this.resetButton(submitBtn, originalText);
            }, 2000);
        }
    }

    async saveContributionSettings(e) {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            this.setButtonLoading(submitBtn, 'Saving...');
            
            const formData = new FormData(e.target);
            const contributionSettings = {
                monthlyAmount: formData.get('monthlyContribution'),
                paymentDeadline: formData.get('paymentDeadline'),
                allowLatePayments: formData.has('allowLatePayments')
            };

            const response = await settingsService.saveContributionSettings(contributionSettings);
            if (response && response.success) {
                this.setButtonSuccess(submitBtn, 'Saved!');
                showAlert('Contribution settings saved successfully!', 'Success', 'success');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            } else {
                this.setButtonError(submitBtn, 'Failed');
                showAlert('Failed to save contribution settings', 'Error', 'error');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            }
        } catch (error) {
            console.error('Error saving contribution settings:', error);
            this.setButtonError(submitBtn, 'Error');
            showAlert('Error saving contribution settings', 'Error', 'error');
            setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
        }
    }

    async saveFineSettings(e) {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            this.setButtonLoading(submitBtn, 'Saving...');
            
            const formData = new FormData(e.target);
            const fineSettings = {
                duePeriod: formData.get('fineDuePeriod'),
                collectionMethod: formData.get('fineCollectionMethod'),
                enableReminders: formData.has('enableFineReminders'),
                allowHistoryView: formData.has('allowFineHistoryView'),
                blockLoans: formData.has('blockLoansForUnpaidFines')
            };

            const response = await settingsService.saveFineSettings(fineSettings);
            if (response && response.success) {
                this.setButtonSuccess(submitBtn, 'Saved!');
                showAlert('Fine settings saved successfully!', 'Success', 'success');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            } else {
                this.setButtonError(submitBtn, 'Failed');
                showAlert('Failed to save fine settings', 'Error', 'error');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            }
        } catch (error) {
            console.error('Error saving fine settings:', error);
            this.setButtonError(submitBtn, 'Error');
            showAlert('Error saving fine settings', 'Error', 'error');
            setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
        }
    }

    async saveNotificationSettings(e) {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            this.setButtonLoading(submitBtn, 'Saving...');
            
            const formData = new FormData(e.target);
            const notificationSettings = {
                newRegistrations: formData.has('emailNewRegistrations'),
                paymentReminders: formData.has('emailPaymentReminders'),
                loanRequests: formData.has('emailLoanRequests'),
                newFines: formData.has('emailNewFines'),
                fineDueReminders: formData.has('emailFineDueReminders')
            };

            const response = await settingsService.saveNotificationSettings(notificationSettings);
            if (response && response.success) {
                this.setButtonSuccess(submitBtn, 'Saved!');
                showAlert('Notification settings saved successfully!', 'Success', 'success');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            } else {
                this.setButtonError(submitBtn, 'Failed');
                showAlert('Failed to save notification settings', 'Error', 'error');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            }
        } catch (error) {
            console.error('Error saving notification settings:', error);
            this.setButtonError(submitBtn, 'Error');
            showAlert('Error saving notification settings', 'Error', 'error');
            setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
        }
    }

    async saveAcademicSettings(e) {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            this.setButtonLoading(submitBtn, 'Saving...');
            
            const formData = new FormData(e.target);
            const academicSettings = {
                semesterStart: formData.get('semesterStart'),
                semesterEnd: formData.get('semesterEnd'),
                examPeriod: formData.get('examPeriod'),
                minAttendance: formData.get('minAttendance')
            };

            const response = await settingsService.saveAcademicSettings(academicSettings);
            if (response && response.success) {
                this.setButtonSuccess(submitBtn, 'Saved!');
                showAlert('Academic settings saved successfully!', 'Success', 'success');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            } else {
                this.setButtonError(submitBtn, 'Failed');
                showAlert('Failed to save academic settings', 'Error', 'error');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            }
        } catch (error) {
            console.error('Error saving academic settings:', error);
            this.setButtonError(submitBtn, 'Error');
            showAlert('Error saving academic settings', 'Error', 'error');
            setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
        }
    }

    async saveFinancialSettings(e) {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            this.setButtonLoading(submitBtn, 'Saving...');
            
            const formData = new FormData(e.target);
            const financialSettings = {
                loanInterestRate: formData.get('loanInterestRate'),
                maxLoanAmount: formData.get('maxLoanAmount'),
                loanProcessingFee: formData.get('loanProcessingFee'),
                gracePeriod: formData.get('gracePeriod')
            };

            const response = await settingsService.saveFinancialSettings(financialSettings);
            if (response && response.success) {
                this.setButtonSuccess(submitBtn, 'Saved!');
                showAlert('Financial settings saved successfully!', 'Success', 'success');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            } else {
                this.setButtonError(submitBtn, 'Failed');
                showAlert('Failed to save financial settings', 'Error', 'error');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            }
        } catch (error) {
            console.error('Error saving financial settings:', error);
            this.setButtonError(submitBtn, 'Error');
            showAlert('Error saving financial settings', 'Error', 'error');
            setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
        }
    }

    async saveMembershipSettings(e) {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            this.setButtonLoading(submitBtn, 'Saving...');
            
            const formData = new FormData(e.target);
            const membershipSettings = {
                membershipExpiry: formData.get('membershipExpiry'),
                registrationFee: formData.get('registrationFee'),
                autoRenewMembership: formData.has('autoRenewMembership'),
                requireApproval: formData.has('requireApproval')
            };

            const response = await settingsService.saveMembershipSettings(membershipSettings);
            if (response && response.success) {
                this.setButtonSuccess(submitBtn, 'Saved!');
                showAlert('Membership settings saved successfully!', 'Success', 'success');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            } else {
                this.setButtonError(submitBtn, 'Failed');
                showAlert('Failed to save membership settings', 'Error', 'error');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            }
        } catch (error) {
            console.error('Error saving membership settings:', error);
            this.setButtonError(submitBtn, 'Error');
            showAlert('Error saving membership settings', 'Error', 'error');
            setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
        }
    }

    async saveReportingSettings(e) {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            this.setButtonLoading(submitBtn, 'Saving...');
            
            const formData = new FormData(e.target);
            const reportingSettings = {
                reportFrequency: formData.get('reportFrequency'),
                reportRecipients: formData.get('reportRecipients'),
                includeCharts: formData.has('includeCharts'),
                archiveReports: formData.has('archiveReports')
            };

            const response = await settingsService.saveReportingSettings(reportingSettings);
            if (response && response.success) {
                this.setButtonSuccess(submitBtn, 'Saved!');
                showAlert('Reporting settings saved successfully!', 'Success', 'success');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            } else {
                this.setButtonError(submitBtn, 'Failed');
                showAlert('Failed to save reporting settings', 'Error', 'error');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            }
        } catch (error) {
            console.error('Error saving reporting settings:', error);
            this.setButtonError(submitBtn, 'Error');
            showAlert('Error saving reporting settings', 'Error', 'error');
            setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
        }
    }

    async saveSecuritySettings(e) {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            this.setButtonLoading(submitBtn, 'Saving...');
            
            const formData = new FormData(e.target);
            const securitySettings = {
                sessionTimeout: formData.get('sessionTimeout'),
                maxLoginAttempts: formData.get('maxLoginAttempts'),
                lockoutDuration: formData.get('lockoutDuration'),
                requireTwoFactor: formData.has('requireTwoFactor'),
                logFailedAttempts: formData.has('logFailedAttempts')
            };

            const response = await settingsService.saveSecuritySettings(securitySettings);
            if (response && response.success) {
                this.setButtonSuccess(submitBtn, 'Saved!');
                showAlert('Security settings saved successfully!', 'Success', 'success');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            } else {
                this.setButtonError(submitBtn, 'Failed');
                showAlert('Failed to save security settings', 'Error', 'error');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            }
        } catch (error) {
            console.error('Error saving security settings:', error);
            this.setButtonError(submitBtn, 'Error');
            showAlert('Error saving security settings', 'Error', 'error');
            setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
        }
    }

    async saveSystemSettings(e) {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            this.setButtonLoading(submitBtn, 'Saving...');
            
            const formData = new FormData(e.target);
            const systemSettings = {
                maintenanceMode: formData.has('maintenanceMode'),
                maintenanceMessage: formData.get('maintenanceMessage'),
                backupFrequency: formData.get('backupFrequency'),
                dataRetention: formData.get('dataRetention')
            };

            const response = await settingsService.saveSystemSettings(systemSettings);
            if (response && response.success) {
                this.setButtonSuccess(submitBtn, 'Saved!');
                showAlert('System settings saved successfully!', 'Success', 'success');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            } else {
                this.setButtonError(submitBtn, 'Failed');
                showAlert('Failed to save system settings', 'Error', 'error');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            }
        } catch (error) {
            console.error('Error saving system settings:', error);
            this.setButtonError(submitBtn, 'Error');
            showAlert('Error saving system settings', 'Error', 'error');
            setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
        }
    }

    async handleSectionSave(section) {
        const sectionTitle = section.querySelector('h2')?.textContent || 'Settings';
        const submitBtn = section.querySelector('button[type="submit"], .btn');
        const originalText = submitBtn?.innerHTML || 'Save Changes';
        
        try {
            // Show loading state if button exists
            if (submitBtn) {
                this.setButtonLoading(submitBtn, 'Saving...');
            }
            
            // Extract data from the section based on its content
            let settingsData = {};
            let saveFunction = null;

            if (sectionTitle.includes('General')) {
                settingsData = this.extractGeneralSettings(section);
                saveFunction = (data) => settingsService.saveGeneralSettings(data);
            } else if (sectionTitle.includes('Contribution')) {
                settingsData = this.extractContributionSettings(section);
                saveFunction = (data) => settingsService.saveContributionSettings(data);
            } else if (sectionTitle.includes('Fine')) {
                settingsData = this.extractFineSettings(section);
                saveFunction = (data) => settingsService.saveFineSettings(data);
            } else if (sectionTitle.includes('Notification')) {
                settingsData = this.extractNotificationSettings(section);
                saveFunction = (data) => settingsService.saveNotificationSettings(data);
            } else if (sectionTitle.includes('Academic')) {
                settingsData = this.extractAcademicSettings(section);
                saveFunction = (data) => settingsService.saveAcademicSettings(data);
            } else if (sectionTitle.includes('Financial')) {
                settingsData = this.extractFinancialSettings(section);
                saveFunction = (data) => settingsService.saveFinancialSettings(data);
            } else if (sectionTitle.includes('Membership')) {
                settingsData = this.extractMembershipSettings(section);
                saveFunction = (data) => settingsService.saveMembershipSettings(data);
            } else if (sectionTitle.includes('Reporting')) {
                settingsData = this.extractReportingSettings(section);
                saveFunction = (data) => settingsService.saveReportingSettings(data);
            } else if (sectionTitle.includes('Security')) {
                settingsData = this.extractSecuritySettings(section);
                saveFunction = (data) => settingsService.saveSecuritySettings(data);
            } else if (sectionTitle.includes('System')) {
                settingsData = this.extractSystemSettings(section);
                saveFunction = (data) => settingsService.saveSystemSettings(data);
            }

            if (saveFunction && Object.keys(settingsData).length > 0) {
                const response = await saveFunction(settingsData);
                if (response && response.success) {
                    if (submitBtn) {
                        this.setButtonSuccess(submitBtn, 'Saved!');
                        setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
                    }
                    showAlert(`${sectionTitle} saved successfully!`, 'Success', 'success');
                } else {
                    if (submitBtn) {
                        this.setButtonError(submitBtn, 'Failed');
                        setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
                    }
                    showAlert(`Failed to save ${sectionTitle}`, 'Error', 'error');
                }
            } else {
                if (submitBtn) {
                    this.resetButton(submitBtn, originalText);
                }
            }
        } catch (error) {
            console.error(`Error saving ${sectionTitle}:`, error);
            if (submitBtn) {
                this.setButtonError(submitBtn, 'Error');
                setTimeout(() => this.resetButton(submitBtn, originalText), 2000);
            }
            showAlert(`Error saving ${sectionTitle}`, 'Error', 'error');
        }
    }

    extractGeneralSettings(section) {
        const inputs = section.querySelectorAll('input[type="text"]');
        return {
            organizationName: inputs[0]?.value || '',
            institution: inputs[1]?.value || '',
            academicYear: inputs[2]?.value || ''
        };
    }

    extractContributionSettings(section) {
        const inputs = section.querySelectorAll('input[type="number"]');
        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
        return {
            monthlyAmount: inputs[0]?.value || '500',
            paymentDeadline: inputs[1]?.value || '25',
            allowLatePayments: checkboxes[0]?.checked || false
        };
    }

    extractFineSettings(section) {
        const select = section.querySelector('select');
        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
        return {
            duePeriod: select?.value || '14',
            collectionMethod: select?.nextElementSibling?.querySelector('select')?.value || 'automatic',
            enableReminders: checkboxes[0]?.checked || false,
            allowHistoryView: checkboxes[1]?.checked || false,
            blockLoans: checkboxes[2]?.checked || false
        };
    }

    extractNotificationSettings(section) {
        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
        return {
            newRegistrations: checkboxes[0]?.checked || false,
            paymentReminders: checkboxes[1]?.checked || false,
            loanRequests: checkboxes[2]?.checked || false,
            newFines: checkboxes[3]?.checked || false,
            fineDueReminders: checkboxes[4]?.checked || false
        };
    }

    extractAcademicSettings(section) {
        const inputs = section.querySelectorAll('input[type="date"], input[type="number"]');
        return {
            semesterStart: inputs[0]?.value || '',
            semesterEnd: inputs[1]?.value || '',
            examPeriod: inputs[2]?.value || '2',
            minAttendance: inputs[3]?.value || '75'
        };
    }

    extractFinancialSettings(section) {
        const inputs = section.querySelectorAll('input[type="number"]');
        return {
            loanInterestRate: inputs[0]?.value || '5',
            maxLoanAmount: inputs[1]?.value || '50000',
            loanProcessingFee: inputs[2]?.value || '2',
            gracePeriod: inputs[3]?.value || '30'
        };
    }

    extractMembershipSettings(section) {
        const inputs = section.querySelectorAll('input[type="number"]');
        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
        return {
            membershipExpiry: inputs[0]?.value || '12',
            registrationFee: inputs[1]?.value || '1000',
            autoRenewMembership: checkboxes[0]?.checked || false,
            requireApproval: checkboxes[1]?.checked || false
        };
    }

    extractReportingSettings(section) {
        const select = section.querySelector('select');
        const textInput = section.querySelector('input[type="text"]');
        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
        return {
            reportFrequency: select?.value || 'weekly',
            reportRecipients: textInput?.value || '',
            includeCharts: checkboxes[0]?.checked || false,
            archiveReports: checkboxes[1]?.checked || false
        };
    }

    extractSecuritySettings(section) {
        const inputs = section.querySelectorAll('input[type="number"]');
        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
        return {
            sessionTimeout: inputs[0]?.value || '30',
            maxLoginAttempts: inputs[1]?.value || '5',
            lockoutDuration: inputs[2]?.value || '15',
            requireTwoFactor: checkboxes[0]?.checked || false,
            logFailedAttempts: checkboxes[1]?.checked || false
        };
    }

    extractSystemSettings(section) {
        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
        const textarea = section.querySelector('textarea');
        const select = section.querySelector('select');
        const numberInput = section.querySelector('input[type="number"]');
        return {
            maintenanceMode: checkboxes[0]?.checked || false,
            maintenanceMessage: textarea?.value || 'System is currently under maintenance. Please check back later.',
            backupFrequency: select?.value || 'weekly',
            dataRetention: numberInput?.value || '24'
        };
    }

    async handleLogout() {
        if (await showConfirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_refresh_token');
            localStorage.removeItem('swa_user');
            window.location.href = '../../index.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Settings();
});
