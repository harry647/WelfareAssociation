/**
 * Policies Page Script
 * Handles policies page functionality
 * 
 * @version 1.0.0
 */

class PoliciesPage {
    constructor() {
        this.init();
    }

    init() {
        this.addScrollAnimations();
        this.setupPrintButton();
    }

    addScrollAnimations() {
        // Intersection Observer for scroll animations
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

        // Observe policy sections
        document.querySelectorAll('.policy-section').forEach(el => {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
        });
    }

    setupPrintButton() {
        // Add print button functionality
        const printBtn = document.createElement('button');
        printBtn.className = 'print-btn';
        printBtn.innerHTML = '<i class="fas fa-print"></i> Print Policies';
        printBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 100;
        `;
        
        printBtn.addEventListener('click', () => {
            window.print();
        });

        document.body.appendChild(printBtn);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PoliciesPage();
});

// Export for module use
export default PoliciesPage;
