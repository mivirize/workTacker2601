/**
 * POWER FIT - Testimonial Slider
 * Touch-enabled, responsive slider for testimonials
 */

(function() {
  'use strict';

  // ==========================================================================
  // Slider Configuration
  // ==========================================================================

  const SLIDER_CONFIG = {
    autoplay: true,
    autoplayInterval: 5000,
    slidesToShow: {
      mobile: 1,
      tablet: 2,
      desktop: 2
    },
    breakpoints: {
      tablet: 768,
      desktop: 1024
    },
    transitionDuration: 500,
    touchThreshold: 50
  };

  // ==========================================================================
  // Testimonial Slider Class
  // ==========================================================================

  class TestimonialSlider {
    constructor(container) {
      this.container = container;
      this.track = container.querySelector('.testimonials__track');
      this.cards = container.querySelectorAll('.testimonial-card');
      this.prevBtn = container.querySelector('.testimonials__btn--prev');
      this.nextBtn = container.querySelector('.testimonials__btn--next');
      this.dotsContainer = container.querySelector('.testimonials__dots');

      this.currentIndex = 0;
      this.totalSlides = this.cards.length;
      this.slidesToShow = this.getSlidesToShow();
      this.maxIndex = Math.max(0, this.totalSlides - this.slidesToShow);

      this.autoplayTimer = null;
      this.isAnimating = false;

      // Touch handling
      this.touchStartX = 0;
      this.touchEndX = 0;
      this.isDragging = false;

      this.init();
    }

    init() {
      if (!this.track || this.cards.length === 0) return;

      this.createDots();
      this.bindEvents();
      this.updateSlider();
      this.startAutoplay();
    }

    getSlidesToShow() {
      const width = window.innerWidth;
      if (width >= SLIDER_CONFIG.breakpoints.desktop) {
        return SLIDER_CONFIG.slidesToShow.desktop;
      } else if (width >= SLIDER_CONFIG.breakpoints.tablet) {
        return SLIDER_CONFIG.slidesToShow.tablet;
      }
      return SLIDER_CONFIG.slidesToShow.mobile;
    }

    createDots() {
      if (!this.dotsContainer) return;

      this.dotsContainer.innerHTML = '';
      const dotCount = this.maxIndex + 1;

      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('button');
        dot.className = 'testimonials__dot';
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.dataset.index = i;

        if (i === 0) {
          dot.classList.add('active');
        }

        dot.addEventListener('click', () => {
          this.goToSlide(i);
        });

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

      // Touch events
      this.track.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      this.track.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
      this.track.addEventListener('touchend', (e) => this.handleTouchEnd(e));

      // Mouse drag events
      this.track.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      document.addEventListener('mouseup', (e) => this.handleMouseUp(e));

      // Pause autoplay on hover
      this.container.addEventListener('mouseenter', () => this.stopAutoplay());
      this.container.addEventListener('mouseleave', () => this.startAutoplay());

      // Resize handler
      window.addEventListener('resize', this.debounce(() => {
        const newSlidesToShow = this.getSlidesToShow();
        if (newSlidesToShow !== this.slidesToShow) {
          this.slidesToShow = newSlidesToShow;
          this.maxIndex = Math.max(0, this.totalSlides - this.slidesToShow);
          this.currentIndex = Math.min(this.currentIndex, this.maxIndex);
          this.createDots();
          this.updateSlider();
        }
      }, 250));

      // Keyboard navigation
      this.container.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          this.prev();
        } else if (e.key === 'ArrowRight') {
          this.next();
        }
      });
    }

    handleTouchStart(e) {
      this.touchStartX = e.touches[0].clientX;
      this.stopAutoplay();
    }

    handleTouchMove(e) {
      this.touchEndX = e.touches[0].clientX;
    }

    handleTouchEnd(e) {
      const diff = this.touchStartX - this.touchEndX;

      if (Math.abs(diff) > SLIDER_CONFIG.touchThreshold) {
        if (diff > 0) {
          this.next();
        } else {
          this.prev();
        }
      }

      this.touchStartX = 0;
      this.touchEndX = 0;
      this.startAutoplay();
    }

    handleMouseDown(e) {
      this.isDragging = true;
      this.touchStartX = e.clientX;
      this.track.style.cursor = 'grabbing';
      this.stopAutoplay();
    }

    handleMouseMove(e) {
      if (!this.isDragging) return;
      this.touchEndX = e.clientX;
    }

    handleMouseUp(e) {
      if (!this.isDragging) return;

      this.isDragging = false;
      this.track.style.cursor = 'grab';

      const diff = this.touchStartX - this.touchEndX;

      if (Math.abs(diff) > SLIDER_CONFIG.touchThreshold) {
        if (diff > 0) {
          this.next();
        } else {
          this.prev();
        }
      }

      this.touchStartX = 0;
      this.touchEndX = 0;
      this.startAutoplay();
    }

    prev() {
      if (this.isAnimating) return;

      if (this.currentIndex > 0) {
        this.currentIndex--;
      } else {
        this.currentIndex = this.maxIndex;
      }

      this.updateSlider();
    }

    next() {
      if (this.isAnimating) return;

      if (this.currentIndex < this.maxIndex) {
        this.currentIndex++;
      } else {
        this.currentIndex = 0;
      }

      this.updateSlider();
    }

    goToSlide(index) {
      if (this.isAnimating || index === this.currentIndex) return;

      this.currentIndex = Math.max(0, Math.min(index, this.maxIndex));
      this.updateSlider();
    }

    updateSlider() {
      this.isAnimating = true;

      // Calculate translation
      const slideWidth = 100 / this.slidesToShow;
      const translateX = -(this.currentIndex * slideWidth);

      this.track.style.transform = `translateX(${translateX}%)`;

      // Update active card states
      this.cards.forEach((card, index) => {
        const isVisible = index >= this.currentIndex && index < this.currentIndex + this.slidesToShow;
        card.classList.toggle('active', isVisible);
      });

      // Update dots
      this.updateDots();

      // Reset animation flag
      setTimeout(() => {
        this.isAnimating = false;
      }, SLIDER_CONFIG.transitionDuration);
    }

    updateDots() {
      if (!this.dotsContainer) return;

      const dots = this.dotsContainer.querySelectorAll('.testimonials__dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === this.currentIndex);
      });
    }

    startAutoplay() {
      if (!SLIDER_CONFIG.autoplay) return;

      this.stopAutoplay();
      this.autoplayTimer = setInterval(() => {
        this.next();
      }, SLIDER_CONFIG.autoplayInterval);
    }

    stopAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
      }
    }

    debounce(func, wait) {
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
  }

  // ==========================================================================
  // Initialize Slider
  // ==========================================================================

  function init() {
    const sliderContainer = document.querySelector('.testimonials__slider');
    if (sliderContainer) {
      new TestimonialSlider(sliderContainer);
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
