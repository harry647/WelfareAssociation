/**
 * Reports Dashboard Script
 * Handles reports dashboard functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Reports dashboard loaded');
    
    // Initialize any interactive features
    initReportCards();
});

function initReportCards() {
    const reportCards = document.querySelectorAll('.report-card');
    
    reportCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // In a real app, this would load the specific report
            console.log('Loading report:', card.href);
        });
    });
}
