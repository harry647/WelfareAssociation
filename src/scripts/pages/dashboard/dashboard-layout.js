/**
 * Dashboard Layout Script
 * Handles dashboard layout functionality including sidebar toggle and navigation
 * 
 * @version 1.0.0
 */

class DashboardLayout {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.toggleBtn = document.getElementById('toggleBtn');
        this.content = document.querySelector('.content');
        this.init();
    }

    init() {
        this.bindEvents();
        this.handleResponsive();
    }

    bindEvents() {
        // Sidebar toggle
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggleSidebar());
        }

        // Close sidebar on outside click (mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!this.sidebar?.contains(e.target) && 
                    !this.toggleBtn?.contains(e.target) && 
                    this.sidebar?.classList.contains('active')) {
                    this.closeSidebar();
                }
            }
        });

        // Keyboard accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.sidebar?.classList.contains('active')) {
                this.closeSidebar();
            }
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId !== '#') {
                    e.preventDefault();
                    const target = document.querySelector(targetId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    }

    toggleSidebar() {
        this.sidebar?.classList.toggle('active');
        this.toggleBtn?.classList.toggle('active');
        document.body.classList.toggle('sidebar-open');
        
        // Update aria-expanded
        const isExpanded = this.sidebar?.classList.contains('active');
        this.toggleBtn?.setAttribute('aria-expanded', isExpanded);
    }

    closeSidebar() {
        this.sidebar?.classList.remove('active');
        this.toggleBtn?.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        this.toggleBtn?.setAttribute('aria-expanded', 'false');
    }

    openSidebar() {
        this.sidebar?.classList.add('active');
        this.toggleBtn?.classList.add('active');
        document.body.classList.add('sidebar-open');
        this.toggleBtn?.setAttribute('aria-expanded', 'true');
    }

    handleResponsive() {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                // Always show sidebar on desktop
                this.sidebar?.classList.remove('active');
                this.toggleBtn?.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            } else {
                // Start with sidebar closed on mobile
                this.closeSidebar();
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check
    }

    // Method to highlight active nav item
    setActiveNavItem(selector) {
        document.querySelectorAll('.sidebar nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === selector) {
                link.classList.add('active');
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DashboardLayout();
});

// Export for module use
export default DashboardLayout;
