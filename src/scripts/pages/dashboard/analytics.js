/**
 * Analytics Script
 * Handles analytics and insights page functionality
 * 
 * @version 1.0.0
 */

class Analytics {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        this.initSidebar();
        this.initEventListeners();
        this.loadAnalytics();
    }

    initSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.toggle('active');
                }
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        }
    }

    initEventListeners() {
        // Date range filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.loadAnalytics();
            });
        });

        // Export buttons
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportData();
            });
        });

        // Logout button
        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadAnalytics() {
        try {
            // Simulated analytics data loading
            this.renderCharts();
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    renderCharts() {
        // Chart rendering logic would go here
        // For now, just log that charts should be rendered
        console.log('Rendering analytics charts...');
    }

    exportData() {
        console.log('Exporting analytics data...');
        alert('Analytics data exported successfully!');
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_refresh_token');
            localStorage.removeItem('swa_user');
            window.location.href = '../../index.html';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Analytics();
});
