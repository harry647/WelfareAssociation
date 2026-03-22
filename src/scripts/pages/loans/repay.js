/**
 * Loan Repayment Script
 * Redirects to unified payment page
 * 
 * Note: This functionality has been moved to pages/payments/make-payment.html
 * This file is kept for backwards compatibility but redirects users
 */

document.addEventListener('DOMContentLoaded', () => {
    // Redirect to unified payment page with loan category
    const redirectUrl = '../payments/make-payment.html?category=loan';
    
    // Check if we're not already on the payment page
    if (!window.location.href.includes('make-payment.html')) {
        window.location.href = redirectUrl;
    }
});
