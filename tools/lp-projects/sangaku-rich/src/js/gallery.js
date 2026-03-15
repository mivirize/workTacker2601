/**
 * SANGAKU BEER - Gallery & Lightbox
 * Photo gallery with lightbox functionality
 */

(function() {
  'use strict';

  // ========================================
  // Gallery Lightbox
  // ========================================
  const GalleryLightbox = {
    lightbox: null,
    lightboxImage: null,
    closeBtn: null,
    prevBtn: null,
    nextBtn: null,
    galleryItems: [],
    currentIndex: 0,
    isOpen: false,

    init() {
      this.cacheElements();
      if (!this.lightbox) return;

      this.bindEvents();
      this.setupKeyboardNav();
      this.setupTouchNav();
    },

    cacheElements() {
      this.lightbox = document.getElementById('lightbox');
      this.lightboxImage = document.getElementById('lightbox-image');
      this.closeBtn = document.getElementById('lightbox-close');
      this.prevBtn = document.getElementById('lightbox-prev');
      this.nextBtn = document.getElementById('lightbox-next');
      this.galleryItems = Array.from(document.querySelectorAll('.gallery__item'));
    },

    bindEvents() {
      // Open lightbox on gallery item click
      this.galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => this.open(index));
      });

      // Close button
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.close());
      }

      // Navigation buttons
      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', () => this.prev());
      }

      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', () => this.next());
      }

      // Close on overlay click
      if (this.lightbox) {
        this.lightbox.addEventListener('click', (e) => {
          if (e.target === this.lightbox) {
            this.close();
          }
        });
      }
    },

    setupKeyboardNav() {
      document.addEventListener('keydown', (e) => {
        if (!this.isOpen) return;

        switch (e.key) {
          case 'Escape':
            this.close();
            break;
          case 'ArrowLeft':
            this.prev();
            break;
          case 'ArrowRight':
            this.next();
            break;
        }
      });
    },

    setupTouchNav() {
      let touchStartX = 0;
      let touchEndX = 0;

      if (this.lightbox) {
        this.lightbox.addEventListener('touchstart', (e) => {
          touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.lightbox.addEventListener('touchend', (e) => {
          touchEndX = e.changedTouches[0].screenX;
          this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
      }
    },

    handleSwipe(startX, endX) {
      const threshold = 50;
      const diff = startX - endX;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          this.next();
        } else {
          this.prev();
        }
      }
    },

    open(index) {
      this.currentIndex = index;
      this.isOpen = true;
      this.updateImage();

      if (this.lightbox) {
        this.lightbox.classList.add('active');
      }

      document.body.classList.add('no-scroll');
    },

    close() {
      this.isOpen = false;

      if (this.lightbox) {
        this.lightbox.classList.remove('active');
      }

      document.body.classList.remove('no-scroll');
    },

    prev() {
      this.currentIndex = (this.currentIndex - 1 + this.galleryItems.length) % this.galleryItems.length;
      this.updateImage();
    },

    next() {
      this.currentIndex = (this.currentIndex + 1) % this.galleryItems.length;
      this.updateImage();
    },

    updateImage() {
      if (!this.lightboxImage || !this.galleryItems[this.currentIndex]) return;

      const currentItem = this.galleryItems[this.currentIndex];
      const img = currentItem.querySelector('img');

      if (img) {
        // Add loading state
        this.lightboxImage.style.opacity = '0';

        // Update image
        this.lightboxImage.src = img.src;
        this.lightboxImage.alt = img.alt;

        // Fade in when loaded
        this.lightboxImage.onload = () => {
          this.lightboxImage.style.opacity = '1';
        };
      }

      // Update navigation button visibility
      this.updateNavVisibility();
    },

    updateNavVisibility() {
      // Always show nav for looping gallery
      if (this.prevBtn) {
        this.prevBtn.style.display = this.galleryItems.length > 1 ? 'flex' : 'none';
      }
      if (this.nextBtn) {
        this.nextBtn.style.display = this.galleryItems.length > 1 ? 'flex' : 'none';
      }
    }
  };

  // ========================================
  // Gallery Grid Animation
  // ========================================
  const GalleryAnimation = {
    init() {
      const galleryGrid = document.querySelector('.gallery__grid');
      if (!galleryGrid) return;

      this.setupStaggerAnimation(galleryGrid);
    },

    setupStaggerAnimation(grid) {
      const items = grid.querySelectorAll('.gallery__item');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            // Add delay based on index for stagger effect
            setTimeout(() => {
              entry.target.classList.add('animated');
            }, index * 100);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      items.forEach(item => observer.observe(item));
    }
  };

  // ========================================
  // Gallery Hover Effects
  // ========================================
  const GalleryHover = {
    init() {
      const items = document.querySelectorAll('.gallery__item');

      items.forEach(item => {
        item.addEventListener('mouseenter', () => this.onHover(item));
        item.addEventListener('mouseleave', () => this.onLeave(item));
      });
    },

    onHover(item) {
      // Add slight rotation on hover for organic feel
      const rotation = (Math.random() - 0.5) * 4;
      item.style.transform = `scale(1.05) rotate(${rotation}deg)`;
    },

    onLeave(item) {
      item.style.transform = '';
    }
  };

  // ========================================
  // Gallery Preload
  // ========================================
  const GalleryPreload = {
    init() {
      const items = document.querySelectorAll('.gallery__item img');

      items.forEach(img => {
        if (img.complete) {
          this.onLoad(img);
        } else {
          img.addEventListener('load', () => this.onLoad(img));
        }
      });
    },

    onLoad(img) {
      const parent = img.closest('.gallery__item');
      if (parent) {
        parent.classList.add('loaded');
      }
    }
  };

  // ========================================
  // Initialize
  // ========================================
  const init = () => {
    GalleryLightbox.init();
    GalleryAnimation.init();
    GalleryHover.init();
    GalleryPreload.init();
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
