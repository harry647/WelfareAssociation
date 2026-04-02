import { showAlert } from '../../../utils/utility-functions.js';
import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';

/**
 * Gallery Page Script
 * Handles gallery filtering and lightbox functionality
 * 
 * @version 1.0.0
 */

class GalleryPage {
    constructor() {
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.galleryItems = document.querySelectorAll('.gallery-item');
        this.videoCards = document.querySelectorAll('.video-card');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleFilter(btn);
            });
        });

        // Video card click handlers
        this.videoCards.forEach(card => {
            card.addEventListener('click', () => {
                this.openVideoPlaceholder(card);
            });
        });

        // Gallery item click for lightbox (optional)
        this.galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                this.openLightbox(item);
            });
        });
    }

    handleFilter(btn) {
        const filter = btn.dataset.filter;

        // Update active button
        this.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter gallery items
        this.galleryItems.forEach(item => {
            if (filter === 'all' || item.classList.contains(filter)) {
                item.style.display = '';
                setTimeout(() => {
                    item.classList.add('visible');
                }, 50);
            } else {
                item.classList.remove('visible');
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300);
            }
        });
    }

    openLightbox(item) {
        const img = item.querySelector('img');
        const title = item.querySelector('h3')?.textContent || '';
        const description = item.querySelector('p')?.textContent || '';

        // Create lightbox
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close">&times;</button>
                <img src="${img.src}" alt="${img.alt}">
                <div class="lightbox-caption">
                    <h3>${title}</h3>
                    <p>${description}</p>
                </div>
            </div>
        `;

        // Add styles
        lightbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
        `;

        document.body.appendChild(lightbox);

        // Animate in
        requestAnimationFrame(() => {
            lightbox.style.opacity = '1';
        });

        // Close handlers
        const closeBtn = lightbox.querySelector('.lightbox-close');
        closeBtn.addEventListener('click', () => this.closeLightbox(lightbox));
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox(lightbox);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeLightbox(lightbox);
            }
        });
    }

    closeLightbox(lightbox) {
        lightbox.style.opacity = '0';
        setTimeout(() => {
            lightbox.remove();
        }, 300);
    }

    openVideoPlaceholder(card) {
        const title = card.querySelector('h3')?.textContent || 'Video';
        showAlert(`Video: "${title}"\n\nVideo playback is currently not available. Check back soon!`, 'Information', 'info');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GalleryPage();
});

// Export for module use
export default GalleryPage;
