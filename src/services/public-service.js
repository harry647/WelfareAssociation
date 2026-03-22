/**
 * Public Service
 * Manages all public pages and provides common utilities
 * 
 * @version 1.0.0
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Public Service - Manages public pages functionality
 */
class PublicService {
    constructor() {
        // Registry of all public pages with metadata
        this.pages = {
            'about-us': {
                id: 'about-us',
                title: 'About Us',
                description: 'Learn about our organization',
                path: 'pages/public/about-us.html',
                icon: 'info-circle'
            },
            'contact-information': {
                id: 'contact-information',
                title: 'Contact Information',
                description: 'Get in touch with us',
                path: 'pages/public/contact-information.html',
                icon: 'envelope'
            },
            'donations': {
                id: 'donations',
                title: 'Donations',
                description: 'Support our cause',
                path: 'pages/public/donations.html',
                icon: 'heart'
            },
            'events': {
                id: 'events',
                title: 'Events',
                description: 'Upcoming events and activities',
                path: 'pages/public/events.html',
                icon: 'calendar'
            },
            'faqs': {
                id: 'faqs',
                title: 'FAQs',
                description: 'Frequently asked questions',
                path: 'pages/public/faqs.html',
                icon: 'question-circle'
            },
            'gallery': {
                id: 'gallery',
                title: 'Gallery',
                description: 'Photo gallery',
                path: 'pages/public/gallery.html',
                icon: 'images'
            },
            'news': {
                id: 'news',
                title: 'News',
                description: 'Latest news and updates',
                path: 'pages/public/news.html',
                icon: 'newspaper'
            },
            'our-team': {
                id: 'our-team',
                title: 'Our Team',
                description: 'Meet our team members',
                path: 'pages/public/our-team.html',
                icon: 'users'
            },
            'policies': {
                id: 'policies',
                title: 'Policies',
                description: 'Organization policies',
                path: 'pages/public/policies.html',
                icon: 'file-alt'
            },
            'portals': {
                id: 'portals',
                title: 'Portals',
                description: 'Access member portals',
                path: 'pages/public/portals.html',
                icon: 'door-open'
            },
            'resources': {
                id: 'resources',
                title: 'Resources',
                description: 'Useful resources',
                path: 'pages/public/resources.html',
                icon: 'folder'
            },
            'terms': {
                id: 'terms',
                title: 'Terms & Conditions',
                description: 'Terms and conditions',
                path: 'pages/public/terms&conditions.html',
                icon: 'gavel'
            },
            'volunteer': {
                id: 'volunteer',
                title: 'Volunteer',
                description: 'Join as a volunteer',
                path: 'pages/public/volunteer.html',
                icon: 'hand-holding-heart'
            },
            'welcome-page': {
                id: 'welcome-page',
                title: 'Welcome',
                description: 'Welcome to our website',
                path: 'pages/public/welcome-page.html',
                icon: 'home'
            }
        };
    }

    /**
     * Get all public pages
     * @returns {Array} Array of public page metadata
     */
    getAllPages() {
        return Object.values(this.pages);
    }

    /**
     * Get public page by ID
     * @param {string} pageId - Page identifier
     * @returns {Object|null} Page metadata or null
     */
    getPage(pageId) {
        return this.pages[pageId] || null;
    }

    /**
     * Get page by path
     * @param {string} path - Page path
     * @returns {Object|null} Page metadata or null
     */
    getPageByPath(path) {
        const normalizedPath = path.replace(/^\//, '').replace(/^pages\/public\//, '');
        return Object.values(this.pages).find(page => 
            page.path.includes(normalizedPath) || normalizedPath.includes(page.id)
        ) || null;
    }

    /**
     * Navigate to a public page
     * @param {string} pageId - Page identifier
     */
    navigateTo(pageId) {
        const page = this.getPage(pageId);
        if (page) {
            window.location.href = page.path;
        }
    }

    /**
     * Load page content dynamically
     * @param {string} pageId - Page identifier
     * @returns {Promise} Promise resolving to page content
     */
    async loadPageContent(pageId) {
        const page = this.getPage(pageId);
        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        try {
            const response = await fetch(page.path);
            if (!response.ok) {
                throw new Error(`Failed to load page: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Error loading page ${pageId}:`, error);
            throw error;
        }
    }

    /**
     * Initialize scroll animations for public pages
     * @param {HTMLElement} container - Container element (defaults to document)
     */
    initScrollAnimations(container = document) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements with animation classes
        container.querySelectorAll('.animate-on-scroll, .value-card, .timeline-item, .program-item, .achievement-card, .option-card, .team-member-card, .faq-item, .gallery-item, .news-card, .event-card').forEach(el => {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
        });

        return observer;
    }

    /**
     * Initialize smooth scroll for anchor links
     * @param {HTMLElement} container - Container element (defaults to document)
     */
    initSmoothScroll(container = document) {
        container.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId !== '#') {
                    e.preventDefault();
                    const target = container.querySelector(targetId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    }

    /**
     * Initialize all public page utilities
     * @param {HTMLElement} container - Container element (defaults to document)
     */
    initPublicPage(container = document) {
        this.initScrollAnimations(container);
        this.initSmoothScroll(container);
    }

    /**
     * Show notification/toast message
     * @param {string} message - Message to display
     * @param {string} type - Message type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Remove existing notifications
        const existing = document.querySelector('.public-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `public-notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${this.getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    /**
     * Get notification icon based on type
     * @param {string} type - Notification type
     * @returns {string} Icon character
     */
    getNotificationIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * Get notification color based on type
     * @param {string} type - Notification type
     * @returns {string} Color hex code
     */
    getNotificationColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    }

    /**
     * Get current page ID from URL
     * @returns {string|null} Current page ID
     */
    getCurrentPageId() {
        const path = window.location.pathname;
        return this.getPageByPath(path)?.id || null;
    }

    /**
     * Check if current page is a public page
     * @returns {boolean} True if on public page
     */
    isPublicPage() {
        return this.getCurrentPageId() !== null;
    }

    /**
     * Get breadcrumbs for current page
     * @returns {Array} Breadcrumb items
     */
    getBreadcrumbs() {
        const pageId = this.getCurrentPageId();
        if (!pageId) return [];

        const page = this.getPage(pageId);
        return [
            { title: 'Home', path: 'index.html' },
            { title: 'Public Pages', path: 'pages/public/welcome-page.html' },
            { title: page?.title || 'Page', path: page?.path || '' }
        ];
    }

    /**
     * Submit general public inquiry
     * @param {Object} data - Inquiry data
     */
    async submitInquiry(data) {
        return apiService.post(
            API_CONFIG.endpoints.contact,
            data,
            false
        );
    }

    /**
     * Get organization info
     * @returns {Promise} Promise resolving to organization info
     */
    async getOrganizationInfo() {
        return apiService.get('/organization', {}, false);
    }
}

// Export singleton instance
export const publicService = new PublicService();

// Export class for custom instances
export default PublicService;
