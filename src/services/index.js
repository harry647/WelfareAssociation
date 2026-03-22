/**
 * Services Index
 * Central export for all service modules
 * 
 * @version 1.0.0
 */

// API & Core Services
export { apiService, ApiError } from './api-service.js';
export { authService } from './auth-service.js';

// Member & User Services
export { memberService } from './member-service.js';

// Financial Services
export { contributionService } from './contribution-service.js';
export { loanService } from './loan-service.js';
export { paymentService } from './payment-service.js';
export { debtService } from './debt-service.js';
export { fineService } from './fine-service.js';
export { savingsService } from './savings-service.js';

// Content Services
export { eventService } from './event-service.js';
export { newsService } from './news-service.js';
export { faqService } from './faq-service.js';
export { policyService } from './policy-service.js';
export { galleryService } from './gallery-service.js';
export { publicService } from './public-service.js';

// Support Services
export { bereavementService } from './bereavement-service.js';
export { volunteerService } from './volunteer-service.js';

// Communication Services
export { contactService } from './contact-service.js';
export { noticeService } from './notice-service.js';

// Management Services
export { reportService } from './report-service.js';
export { documentService } from './document-service.js';

// Default export for convenience
export default {
    // Core
    apiService,
    authService,
    memberService,
    
    // Financial
    contributionService,
    loanService,
    paymentService,
    debtService,
    fineService,
    savingsService,
    
    // Content
    eventService,
    newsService,
    faqService,
    policyService,
    galleryService,
    publicService,
    
    // Support
    bereavementService,
    volunteerService,
    
    // Communication
    contactService,
    noticeService,
    
    // Management
    reportService,
    documentService,
};
