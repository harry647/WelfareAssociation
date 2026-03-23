/**
 * Routes Index
 * Export all API routes
 */

const authRoutes = require('./auth');
const memberRoutes = require('./members');
const loanRoutes = require('./loans');
const contributionRoutes = require('./contributions');
const debtRoutes = require('./debts');
const fineRoutes = require('./fines');
const savingsRoutes = require('./savings');
const noticeRoutes = require('./notices');
const eventRoutes = require('./events');
const announcementRoutes = require('./announcements');
const documentRoutes = require('./documents');
const reportRoutes = require('./reports');
const volunteerRoutes = require('./volunteers');
const newsletterRoutes = require('./newsletter');
const faqRoutes = require('./faqs');
const policyRoutes = require('./policies');
const galleryRoutes = require('./gallery');
const contactRoutes = require('./contact');
const newsRoutes = require('./news');
const userRoutes = require('./users');
const bereavementRoutes = require('./bereavement');

module.exports = (app) => {
    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/members', memberRoutes);
    app.use('/api/loans', loanRoutes);
    app.use('/api/contributions', contributionRoutes);
    app.use('/api/debts', debtRoutes);
    app.use('/api/fines', fineRoutes);
    app.use('/api/savings', savingsRoutes);
    app.use('/api/notices', noticeRoutes);
    app.use('/api/events', eventRoutes);
    app.use('/api/news', newsRoutes);
    app.use('/api/announcements', announcementRoutes);
    app.use('/api/documents', documentRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/volunteers', volunteerRoutes);
    app.use('/api/newsletter', newsletterRoutes);
    app.use('/api/faqs', faqRoutes);
    app.use('/api/policies', policyRoutes);
    app.use('/api/gallery', galleryRoutes);
    app.use('/api/contact', contactRoutes);
    app.use('/api/messages', contactRoutes); // Messages alias for contact
    app.use('/api/bereavement', bereavementRoutes);
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({ 
            success: true, 
            message: 'SWA API is running',
            timestamp: new Date().toISOString()
        });
    });
    
    // Admin config endpoint - returns admin credentials from environment
    app.get('/api/config/admin', (req, res) => {
        res.json({
            adminEmail: process.env.ADMIN_EMAIL || 'admin@swa.org',
            adminPassword: process.env.ADMIN_PASSWORD || 'SWAAdmin2024!'
        });
    });
};
