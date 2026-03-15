/**
 * POWER FIT - Premium LP
 * Success Stories Slider
 */

class Slider {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.getElementById(container)
      : container;

    if (!this.container) return;

    this.options = {
      autoplay: options.autoplay !== undefined ? options.autoplay : true,
      autoplaySpeed: options.autoplaySpeed || 5000,
      speed: options.speed || 500,
      easing: options.easing || 'cubic-bezier(0.4, 0, 0.2, 1)',
      loop: options.loop !== undefined ? options.loop : true,
      pauseOnHover: options.pauseOnHover !== undefined ? options.pauseOnHover : true,
      touch: options.touch !== undefined ? options.touch : true,
      keyboard: options.keyboard !== undefined ? options.keyboard : true,
      indicators: options.indicators !== undefined ? options.indicators : true,
      onChange: options.onChange || null
    };

    this.track = this.container.querySelector('.slider__track');
    this.slides = this.container.querySelectorAll('.slider__slide');
    this.prevBtn = this.container.querySelector('.slider__btn--prev');
    this.nextBtn = this.container.querySelector('.slider__btn--next');
    this.dotsContainer = this.container.querySelector('.slider__dots');

    this.currentIndex = 0;
    this.slideCount = this.slides.length;
    this.isAnimating = false;
    this.autoplayTimer = null;
    this.touchStartX = 0;
    this.touchEndX = 0;

    this.init();
  }

  init() {
    if (this.slideCount === 0) return;

    // Set up track styles
    this.track.style.transition = `transform ${this.options.speed}ms ${this.options.easing}`;

    // Create indicators
    if (this.options.indicators && this.dotsContainer) {
      this.createIndicators();
    }

    // Add event listeners
    this.bindEvents();

    // Start autoplay
    if (this.options.autoplay) {
      this.startAutoplay();
    }

    // Initial state
    this.goToSlide(0, false);
  }

  createIndicators() {
    this.dotsContainer.innerHTML = '';

    for (let i = 0; i < this.slideCount; i++) {
      const dot = document.createElement('button');
      dot.className = `slider__dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => this.goToSlide(i));
      this.dotsContainer.appendChild(dot);
    }
  }

  bindEvents() {
    // Navigation buttons
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }

    // Pause on hover
    if (this.options.pauseOnHover) {
      this.container.addEventListener('mouseenter', () => this.pauseAutoplay());
      this.container.addEventListener('mouseleave', () => this.startAutoplay());
    }

    // Touch events
    if (this.options.touch) {
      this.track.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      this.track.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
      this.track.addEventListener('touchend', () => this.handleTouchEnd());
    }

    // Keyboard navigation
    if (this.options.keyboard) {
      this.container.setAttribute('tabindex', '0');
      this.container.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    // Resize handler
    window.addEventListener('resize', debounce(() => this.handleResize(), 200));
  }

  goToSlide(index, animate = true) {
    if (this.isAnimating && animate) return;

    // Handle loop
    if (this.options.loop) {
      if (index < 0) {
        index = this.slideCount - 1;
      } else if (index >= this.slideCount) {
        index = 0;
      }
    } else {
      if (index < 0 || index >= this.slideCount) return;
    }

    this.isAnimating = true;
    this.currentIndex = index;

    // Update track position
    const offset = -index * 100;

    if (!animate) {
      this.track.style.transition = 'none';
    }

    this.track.style.transform = `translateX(${offset}%)`;

    if (!animate) {
      // Force reflow
      this.track.offsetHeight;
      this.track.style.transition = `transform ${this.options.speed}ms ${this.options.easing}`;
    }

    // Update indicators
    this.updateIndicators();

    // Update button states (if not looping)
    this.updateButtons();

    // Animation complete
    setTimeout(() => {
      this.isAnimating = false;

      if (this.options.onChange) {
        this.options.onChange(this.currentIndex, this.slides[this.currentIndex]);
      }
    }, animate ? this.options.speed : 0);
  }

  next() {
    this.goToSlide(this.currentIndex + 1);
  }

  prev() {
    this.goToSlide(this.currentIndex - 1);
  }

  updateIndicators() {
    if (!this.dotsContainer) return;

    const dots = this.dotsContainer.querySelectorAll('.slider__dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex);
    });
  }

  updateButtons() {
    if (this.options.loop) return;

    if (this.prevBtn) {
      this.prevBtn.disabled = this.currentIndex === 0;
    }

    if (this.nextBtn) {
      this.nextBtn.disabled = this.currentIndex === this.slideCount - 1;
    }
  }

  startAutoplay() {
    if (!this.options.autoplay) return;

    this.pauseAutoplay();
    this.autoplayTimer = setInterval(() => {
      this.next();
    }, this.options.autoplaySpeed);
  }

  pauseAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.pauseAutoplay();
  }

  handleTouchMove(e) {
    this.touchEndX = e.touches[0].clientX;
  }

  handleTouchEnd() {
    const diff = this.touchStartX - this.touchEndX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.next();
      } else {
        this.prev();
      }
    }

    this.startAutoplay();
  }

  handleKeydown(e) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.prev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.next();
        break;
    }
  }

  handleResize() {
    this.goToSlide(this.currentIndex, false);
  }

  destroy() {
    this.pauseAutoplay();
    // Remove event listeners would go here
  }
}

/**
 * Image Gallery Lightbox
 */
class Lightbox {
  constructor(options = {}) {
    this.options = {
      selector: options.selector || '[data-lightbox]',
      animation: options.animation || 'fade',
      closeOnOverlay: options.closeOnOverlay !== undefined ? options.closeOnOverlay : true,
      keyboard: options.keyboard !== undefined ? options.keyboard : true
    };

    this.currentIndex = 0;
    this.images = [];
    this.overlay = null;
    this.content = null;

    this.init();
  }

  init() {
    this.images = document.querySelectorAll(this.options.selector);

    if (this.images.length === 0) return;

    // Create overlay
    this.createOverlay();

    // Bind events
    this.images.forEach((img, index) => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => this.open(index));
    });
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'lightbox-overlay';
    this.overlay.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close">&times;</button>
        <button class="lightbox-prev" aria-label="Previous">&larr;</button>
        <button class="lightbox-next" aria-label="Next">&rarr;</button>
        <div class="lightbox-image-container">
          <img class="lightbox-image" src="" alt="">
        </div>
        <div class="lightbox-counter"></div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .lightbox-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s, visibility 0.3s;
      }
      .lightbox-overlay.open {
        opacity: 1;
        visibility: visible;
      }
      .lightbox-content {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
      }
      .lightbox-image-container {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .lightbox-image {
        max-width: 90vw;
        max-height: 80vh;
        object-fit: contain;
        transition: transform 0.3s;
      }
      .lightbox-close,
      .lightbox-prev,
      .lightbox-next {
        position: absolute;
        background: transparent;
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
        z-index: 10001;
        transition: color 0.3s;
      }
      .lightbox-close:hover,
      .lightbox-prev:hover,
      .lightbox-next:hover {
        color: #D4AF37;
      }
      .lightbox-close {
        top: -40px;
        right: 0;
      }
      .lightbox-prev {
        left: -60px;
        top: 50%;
        transform: translateY(-50%);
      }
      .lightbox-next {
        right: -60px;
        top: 50%;
        transform: translateY(-50%);
      }
      .lightbox-counter {
        text-align: center;
        color: white;
        margin-top: 1rem;
        font-size: 0.875rem;
      }
      @media (max-width: 768px) {
        .lightbox-prev { left: 10px; }
        .lightbox-next { right: 10px; }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.overlay);

    // Get elements
    this.content = this.overlay.querySelector('.lightbox-content');
    this.imageEl = this.overlay.querySelector('.lightbox-image');
    this.counter = this.overlay.querySelector('.lightbox-counter');

    // Bind events
    this.overlay.querySelector('.lightbox-close').addEventListener('click', () => this.close());
    this.overlay.querySelector('.lightbox-prev').addEventListener('click', () => this.prev());
    this.overlay.querySelector('.lightbox-next').addEventListener('click', () => this.next());

    if (this.options.closeOnOverlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }

    if (this.options.keyboard) {
      document.addEventListener('keydown', (e) => {
        if (!this.overlay.classList.contains('open')) return;

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
    }
  }

  open(index) {
    this.currentIndex = index;
    this.updateImage();
    this.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.updateImage();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.updateImage();
  }

  updateImage() {
    const img = this.images[this.currentIndex];
    this.imageEl.src = img.src;
    this.imageEl.alt = img.alt || '';
    this.counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
  }
}

/**
 * Utility: Debounce function
 */
function debounce(func, wait) {
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

// Initialize sliders when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Success Stories Slider
  const successSlider = document.getElementById('successSlider');
  if (successSlider) {
    window.successStoriesSlider = new Slider(successSlider, {
      autoplay: true,
      autoplaySpeed: 6000,
      speed: 600,
      pauseOnHover: true,
      touch: true,
      keyboard: true
    });
  }

  // Facility Gallery Lightbox
  const facilityImages = document.querySelectorAll('.facility__item');
  if (facilityImages.length > 0) {
    facilityImages.forEach(item => {
      const img = item.querySelector('img');
      if (img) {
        img.setAttribute('data-lightbox', 'facility');
      }
    });

    new Lightbox({
      selector: '[data-lightbox="facility"]'
    });
  }
});

// Export for external use
window.Slider = Slider;
window.Lightbox = Lightbox;
