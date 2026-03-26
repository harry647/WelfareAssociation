/**
 * Services Index
 * Central export for all service modules
 * 
 * @version 1.0.0
 */

// Import all services for use in default export
import { apiService, ApiError } from './api-service.js';
import { authService } from './auth-service.js';
import { memberService } from './member-service.js';
import { contributionService } from './contribution-service.js';
import { loanService } from './loan-service.js';
import { paymentService } from './payment-service.js';
import { debtService } from './debt-service.js';
import { fineService } from './fine-service.js';
import { savingsService } from './savings-service.js';
import { eventService } from './event-service.js';
import { newsService } from './news-service.js';
import { faqService } from './faq-service.js';
import { policyService } from './policy-service.js';
import { galleryService } from './gallery-service.js';
import { publicService } from './public-service.js';
import { bereavementService } from './bereavement-service.js';
import { volunteerService } from './volunteer-service.js';
import { contactService } from './contact-service.js';
import { noticeService } from './notice-service.js';
import { reportService } from './report-service.js';
import { documentService } from './document-service.js';
import { withdrawalService } from './withdrawal-service.js';
import { pageContentService } from './page-content-service.js';

// Re-export all services for named imports
export {
    apiService,
    ApiError,
    authService,
    memberService,
    contributionService,
    loanService,
    paymentService,
    debtService,
    fineService,
    savingsService,
    eventService,
    newsService,
    faqService,
    policyService,
    galleryService,
    publicService,
    bereavementService,
    volunteerService,
    contactService,
    noticeService,
    reportService,
    documentService,
    withdrawalService,
    pageContentService
};

// Default export for convenience
export default {
    // Core
    apiService,
    ApiError,
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
    pageContentService,
    
    // Support
    bereavementService,
    volunteerService,
    
    // Communication
    contactService,
    noticeService,
    
    // Management
    reportService,
    documentService,
    withdrawalService,
};
