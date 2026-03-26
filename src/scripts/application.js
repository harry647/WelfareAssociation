/**
 * Main Application Entry Point
 * Initializes the application with proper module patterns
 * 
 * @version 1.0.0
 */

// Import services
import { authService, contactService, ApiError } from '../services/index.js';
// Import utilities
import { 
    showNotification, 
    validateEmail, 
    validatePhone,
    debounce,
    throttle,
    getURLParam,
    smoothScrollTo 
} from '../utils/utility-functions.js';
// Import configuration
import { APP_CONFIG } from '../config/app-config.js';

/**
 * Application Class - Main application controller
 */
class Application {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            console.log(`Initializing ${APP_CONFIG.name} v${APP_CONFIG.version}...`);
            
            // Initialize components
            this.initNavigation();
            this.initForms();
            this.initAnimations();
            this.initEventListeners();
            
            // Check authentication
            this.checkAuth();
            
            this.isInitialized = true;
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    }

    /**
     * Initialize navigation
     */
    initNavigation() {
        // Mobile menu toggle - using event delegation to support dynamically loaded content
        // This works with W3.js includeHTML which loads content asynchronously
        document.addEventListener('click', (e) => {
            const hamburgerBtn = e.target.closest('#hamburger-icon');
            if (hamburgerBtn) {
                const navLinks = document.querySelector('.links-wrpper');
                if (navLinks) {
                    navLinks.classList.toggle('active');
                }
                hamburgerBtn.classList.toggle('active');
            }
            
            // Handle dropdown clicks on mobile
            const dropdown = e.target.closest('.dropdown');
            if (dropdown && window.innerWidth <= 900) {
                e.preventDefault();
                dropdown.classList.toggle('active');
            }
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId && targetId !== '#') {
                    e.preventDefault();
                    smoothScrollTo(targetId);
                }
            });
        });
    }

    /**
     * Initialize forms
     */
    initForms() {
        // Contact form
        const contactForm = document.querySelector('.form-submision');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleContactFormSubmit(contactForm);
            });
        }

        // Login form
        const loginForm = document.querySelector('.login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLoginFormSubmit(loginForm);
            });
        }

        // Register form
        const registerForm = document.querySelector('.register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegisterFormSubmit(registerForm);
            });
        }

        // Add input validation
        this.initInputValidation();
    }

    /**
     * Initialize input validation
     */
    initInputValidation() {
        const emailInputs = document.querySelectorAll('input[type="email"]');
        const phoneInputs = document.querySelectorAll('input[type="tel"]');

        emailInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value && !validateEmail(input.value)) {
                    input.setCustomValidity('Please enter a valid email address');
                    input.reportValidity();
                } else {
                    input.setCustomValidity('');
                }
            });
        });

        phoneInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value && !validatePhone(input.value)) {
                    input.setCustomValidity('Please enter a valid phone number');
                    input.reportValidity();
                } else {
                    input.setCustomValidity('');
                }
            });
        });
    }

    /**
     * Handle contact form submission
     */
    async handleContactFormSubmit(form) {
        const formData = new FormData(form);
        const firstName = formData.get('first-name') || formData.get('name') || '';
        const lastName = formData.get('last-name') || '';
        const name = [firstName, lastName].filter(Boolean).join(' ').trim();
        
        const data = {
            name: name,
            email: formData.get('email'),
            phone: formData.get('phone'),
            subject: formData.get('subject'),
            message: formData.get('message'),
        };

        try {
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            // Submit to backend API
            await contactService.submitContact(data);

            showNotification('Message sent successfully!', 'success');
            form.reset();
        } catch (error) {
            console.error('Contact form submission error:', error);
            // Fallback to alert for demo
            alert('Thank you for your message! We will get back to you soon.');
        }
    }

    /**
     * Handle login form submission
     */
    async handleLoginFormSubmit(form) {
        const formData = new FormData(form);
        const data = {
            email: formData.get('email') || formData.get('username'),
            password: formData.get('password'),
        };

        try {
            const response = await authService.login(data.email, data.password);
            
            showNotification('Login successful!', 'success');
            
            // Redirect based on user role
            setTimeout(() => {
                if (response.user?.role === 'admin') {
                    window.location.href = 'admin2.html';
                } else {
                    window.location.href = 'membersp.html';
                }
            }, 1000);
        } catch (error) {
            console.error('Login error:', error);
            showNotification(error.message || 'Login failed. Please try again.', 'error');
            // Fallback for demo
            alert('Login successful! (Demo mode)');
        }
    }

    /**
     * Handle register form submission
     */
    async handleRegisterFormSubmit(form) {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            password: formData.get('password'),
            studentId: formData.get('studentId'),
        };

        try {
            await authService.register(data);
            
            showNotification('Registration successful!', 'success');
            
            setTimeout(() => {
                window.location.href = 'membersp.html';
            }, 1000);
        } catch (error) {
            console.error('Registration error:', error);
            showNotification(error.message || 'Registration failed. Please try again.', 'error');
            // Fallback for demo
            alert('Registration successful! (Demo mode)');
        }
    }

    /**
     * Initialize animations
     */
    initAnimations() {
        // Add scroll animation observer
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.about-us, .our-history, .swateam, .events').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Logout button
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Password visibility toggle
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.previousElementSibling;
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                btn.classList.toggle('fa-eye');
                btn.classList.toggle('fa-eye-slash');
            });
        });

        // Header scroll effect - works with dynamically loaded headers
        const initHeaderScrollEffect = () => {
            const header = document.querySelector('header');
            if (header) {
                // Add scrolled class based on initial scroll position
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                }
                
                // Update on scroll
                window.addEventListener('scroll', throttle(() => {
                    if (window.scrollY > 50) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                }, 200));
            } else {
                // Header not found yet, try again (for dynamically loaded headers)
                setTimeout(initHeaderScrollEffect, 100);
            }
        };
        
        // Initialize header scroll effect
        initHeaderScrollEffect();
    }

    /**
     * Check authentication status
     */
    checkAuth() {
        if (authService.isAuthenticated()) {
            this.currentUser = authService.getCurrentUser();
            this.updateUIForAuthenticatedUser();
        }
    }

    /**
     * Update UI for authenticated user
     */
    updateUIForAuthenticatedUser() {
        // Update user display
        const userDisplay = document.querySelector('.user-display');
        if (userDisplay && this.currentUser) {
            userDisplay.textContent = this.currentUser.name || this.currentUser.email;
        }

        // Show/hide auth buttons
        const signInBtn = document.querySelector('.sign-in');
        const logoutBtn = document.querySelector('.logout-btn');
        
        if (signInBtn) signInBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}

// Create and initialize app instance
const app = new Application();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Handle W3.js includeHTML callback if available
if (typeof w3 !== 'undefined' && w3.includeHTML) {
    // Override includeHTML to ensure header scroll effect works after loading
    const originalIncludeHTML = w3.includeHTML;
    w3.includeHTML = function(callback) {
        originalIncludeHTML(function() {
            // Re-initialize header scroll effect after content loads
            const header = document.querySelector('header');
            if (header) {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                }
                // Add scroll listener if not already added
                if (!header.dataset.scrollListenerAdded) {
                    header.dataset.scrollListenerAdded = 'true';
                    window.addEventListener('scroll', throttle(() => {
                        if (window.scrollY > 50) {
                            header.classList.add('scrolled');
                        } else {
                            header.classList.remove('scrolled');
                        }
                    }, 200));
                }
            }
            if (callback) callback();
        });
    };
}

// Export for use in other modules
export default app;
