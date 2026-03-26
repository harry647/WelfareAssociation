/**
 * Application Configuration
 * Central configuration for backend API services and application settings
 * 
 * @version 1.0.0
 */

// API Configuration
export const API_CONFIG = {
    // Base URL for backend API - Update this when backend is deployed
    // Use window.APP_CONFIG or default to localhost
    baseURL: (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.API_URL) || 'http://localhost:3000/api',
    
    // API Endpoints
    endpoints: {
        // Authentication
        login: '/auth/login',
        logout: '/auth/logout',
        register: '/auth/register',
        refreshToken: '/auth/refresh',
        
        // User & Members
        users: '/users',
        members: '/members',
        profile: '/users/profile',
        
        // Contributions
        contributions: '/contributions',
        addContribution: '/contributions/add',
        
        // Loans
        loans: '/loans',
        applyLoan: '/loans/apply',
        
        // Payments
        payments: '/payments',
        
        // Debts
        debts: '/debts',
        
        // Events
        events: '/events',
        eventRegister: '/events/register',
        newsletter: '/newsletter',
        newsSubscribe: '/newsletter',
        
        // Bereavement
        bereavement: '/bereavement',
        bereavementContribute: '/bereavement/contribute',
        bereavementMessages: '/bereavement/messages',
        
        // Notices & Announcements
        notices: '/notices',
        announcements: '/announcements',
        
        // Reports
        reports: '/reports',
        
        // Savings
        savings: '/savings',
        savingsGoals: '/savings/goals',
        
        // Fines
        fines: '/fines',
        
        // Documents
        documents: '/documents',
        documentsDashboard: '/documents/dashboard',
        documentsStatistics: '/documents/statistics',
        
        // FAQs & Policies
        faqs: '/faqs',
        policies: '/policies',
        
        // Gallery
        gallery: '/gallery',
        
        // Messages/Contact
        contact: '/contact',
        messages: '/messages',
        
        // Volunteers
        volunteers: '/volunteers',
        volunteerApply: '/volunteers/apply',
        
        // Withdrawals
        withdrawals: '/withdrawals',
        
        // Public Pages
        publicPages: '/public',
        organization: '/organization',
        inquiry: '/inquiry',
    },
    
    // Request timeout in milliseconds
    timeout: 30000,
    
    // Enable debug mode
    debug: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
};

// Application Settings
export const APP_CONFIG = {
    // Application name
    name: 'Student Welfare Association',
    shortName: 'SWA',
    
    // Version
    version: '1.0.0',
    
    // Feature flags
    features: {
        enableDarkMode: false,
        enableNotifications: true,
        enableOnlinePayments: false,
        enableEmailVerification: true,
    },
    
    // Pagination defaults
    pagination: {
        defaultPageSize: 10,
        maxPageSize: 100,
    },
    
    // Storage keys
    storageKeys: {
        authToken: 'swa_auth_token',
        refreshToken: 'swa_refresh_token',
        user: 'swa_user',
        theme: 'swa_theme',
        preferences: 'swa_preferences',
    },
    
    // Date format options
    dateFormat: {
        short: 'MM/DD/YYYY',
        long: 'MMMM DD, YYYY',
        time: 'HH:mm',
        datetime: 'MM/DD/YYYY HH:mm',
    },
    
    // Validation rules
    validation: {
        minPasswordLength: 8,
        maxPasswordLength: 128,
        minUsernameLength: 3,
        maxUsernameLength: 50,
    }
};

// Export default configuration
export default {
    API_CONFIG,
    APP_CONFIG,
};
