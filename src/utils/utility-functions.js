/**
 * Utility Functions
 * Common helper functions for the application
 * 
 * @version 1.0.0
 */

import { APP_CONFIG } from '../config/app-config.js';
import { ModalHelper } from './modal-helper.js';

/**
 * Format date to specified format
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string
 */
export function formatDate(date, format = APP_CONFIG.dateFormat.short) {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
        return 'Invalid Date';
    }

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const shortMonths = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes();

    const pad = (n) => n.toString().padStart(2, '0');

    return format
        .replace('MMMM', months[month])
        .replace('MMM', shortMonths[month])
        .replace('MM', pad(month + 1))
        .replace('DD', pad(day))
        .replace('YYYY', year)
        .replace('HH', pad(hours))
        .replace('mm', pad(minutes));
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 */
export function formatCurrency(amount, currency = 'KES') {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}

/**
 * Validate email
 * @param {string} email - Email to validate
 */
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 */
export function validatePhone(phone) {
    const re = /^\+?[1-9]\d{1,14}$/;
    return re.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 */
export function validatePassword(password) {
    const minLength = APP_CONFIG.validation.minPasswordLength;
    const maxLength = APP_CONFIG.validation.maxPasswordLength;
    
    if (password.length < minLength || password.length > maxLength) {
        return {
            valid: false,
            message: `Password must be between ${minLength} and ${maxLength} characters`,
        };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
        return {
            valid: false,
            message: 'Password must contain uppercase, lowercase, number, and special character',
        };
    }

    return { valid: true, message: 'Password is strong' };
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML to sanitize
 */
export function sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Show notification/alert
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
export function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);

    // Remove after duration
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Get URL parameters
 * @param {string} param - Parameter name
 */
export function getURLParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Set URL parameter
 * @param {string} key - Parameter name
 * @param {string} value - Parameter value
 */
export function setURLParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

/**
 * Generate random ID
 * @param {number} length - Length of ID
 */
export function generateId(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 */
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Smooth scroll to element
 * @param {string|HTMLElement} target - Target element or selector
 */
export function smoothScrollTo(target) {
    const element = typeof target === 'string' 
        ? document.querySelector(target) 
        : target;
    
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Format file size
 * @param {number} bytes - Bytes to format
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Global modal helper instance for easy access
let globalModalHelper = null;

/**
 * Get global modal helper instance
 */
export function getModalHelper() {
    if (!globalModalHelper) {
        globalModalHelper = new ModalHelper();
    }
    return globalModalHelper;
}

/**
 * Show alert modal (replaces alert())
 * @param {string} message - Message to display
 * @param {string} title - Modal title (optional)
 * @param {string} type - Modal type: info, success, warning, error
 */
export async function showAlert(message, title = 'Information', type = 'info') {
    const modalHelper = getModalHelper();
    return await modalHelper.alert(message, title, type);
}

/**
 * Show confirm modal (replaces confirm())
 * @param {string} message - Message to display
 * @param {string} title - Modal title (optional)
 * @returns {Promise<boolean>} - True if confirmed, false if cancelled
 */
export async function showConfirm(message, title = 'Confirm Action') {
    const modalHelper = getModalHelper();
    return await modalHelper.confirm(message, title);
}

/**
 * Show prompt modal (replaces prompt())
 * @param {string} message - Message to display
 * @param {string} defaultValue - Default value for input
 * @param {string} title - Modal title (optional)
 * @returns {Promise<string|null>} - User input or null if cancelled
 */
export async function showPrompt(message, defaultValue = '', title = 'Input Required') {
    const modalHelper = getModalHelper();
    return await modalHelper.prompt(message, defaultValue, title);
}

export default {
    formatDate,
    formatCurrency,
    validateEmail,
    validatePhone,
    validatePassword,
    sanitizeHTML,
    debounce,
    throttle,
    showNotification,
    getURLParam,
    setURLParam,
    copyToClipboard,
    generateId,
    isInViewport,
    smoothScrollTo,
    ModalHelper,
    getModalHelper,
    showAlert,
    showConfirm,
    showPrompt
};
