/**
 * Reports Index Page Script
 * Handles reports dashboard functionality
 * 
 * @version 1.0.0
 */

class ReportsDashboard {
    constructor() {
        this.statCards = document.querySelectorAll('.stat-card');
        this.reportCards = document.querySelectorAll('.report-card');
        this.activityItems = document.querySelectorAll('.activity-item');
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadReportData();
    }

    bindEvents() {
        // Report card click handlers
        this.reportCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleReportClick(card);
            });
        });

        // Add hover effects
        this.statCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('hovered');
            });
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hovered');
            });
        });
    }

    handleReportClick(card) {
        const title = card.querySelector('h3')?.textContent || 'this report';
        const href = card.getAttribute('href');

        if (href && href !== '#') {
            // Navigate to the report page
            window.location.href = href;
        } else {
            alert(`Report: "${title}"\n\nThis report is currently under development.`);
        }
    }

    loadReportData() {
        // Load demo data or fetch from API
        // For now, we'll enhance the existing static data with some interactivity
        
        // Add animation to stat numbers
        this.animateStats();
    }

    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const text = stat.textContent;
            const isCurrency = text.includes('Ksh');
            
            if (isCurrency) {
                // Extract number
                const num = parseInt(text.replace(/[^\d]/g, ''));
                if (!isNaN(num)) {
                    this.animateNumber(stat, num);
                }
            }
        });
    }

    animateNumber(element, target) {
        let current = 0;
        const increment = target / 30;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = `Ksh ${Math.floor(current).toLocaleString()}`;
        }, 30);
    }

    // Export data functionality
    exportData(format) {
        alert(`Exporting data as ${format.toUpperCase()}...\n\nThis feature is currently under development.`);
    }

    // Refresh data functionality
    refreshData() {
        // Show loading state
        const container = document.querySelector('.reports-container');
        if (container) {
            container.style.opacity = '0.5';
        }

        setTimeout(() => {
            // Reload data
            this.loadReportData();
            
            if (container) {
                container.style.opacity = '1';
            }
            
            alert('Data refreshed successfully!');
        }, 1000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ReportsDashboard();
});

// Export for module use
export default ReportsDashboard;
