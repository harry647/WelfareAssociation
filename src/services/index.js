/**
 * Services Index
 * Central export for all service modules
 * 
 * @version 1.0.0
 */

// API & Core Services
export { apiService, ApiError } from './api-service.js';
export { authService } from './auth-service.js';
export { memberService } from './member-service.js';
export { contributionService } from './contribution-service.js';
export { loanService } from './loan-service.js';
export { contactService } from './contact-service.js';

// Default export for convenience
export default {
    apiService,
    authService,
    memberService,
    contributionService,
    loanService,
    contactService,
};
