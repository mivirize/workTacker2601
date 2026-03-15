/**
 * Global Talk - Testimonial Slider
 * Responsive slider with touch support
 */

(function() {
  'use strict';

  class TestimonialSlider {
    constructor(options = {}) {
      this.container = document.getElementById('testimonialSlider');
      if (!this.container) return;

      this.track = this.container.querySelector('.testimonials__track');
      this.cards = this.container.querySelectorAll('.testimonial-card');
      this.prevBtn = document.getElementById('sliderPrev');
      this.nextBtn = document.getElementById('sliderNext');
      this.dotsContainer = document.getElementById('sliderDots');

      this.options = {
        autoplay: options.autoplay !== undefined ? options.autoplay : true,
        autoplaySpeed: options.autoplaySpeed || 5000,
        slidesToShow: options.slidesToShow || this.getSlidesToShow(),
        gap: options.gap || 24,
        ...options
      };

      this.currentIndex = 0;
      this.totalSlides = this.cards.length;
      this.isAnimating = false;
      this.autoplayTimer = null;
      this.touchStartX = 0;
      this.touchEndX = 0;

      this.init();
    }

    init() {
      if (this.totalSlides === 0) return;

      this.createDots();
      this.bindEvents();
      this.updateSlider();
      this.startAutoplay();

      // Update on resize
      window.addEventListener('resize', this.debounce(() => {
        this.options.slidesToShow = this.getSlidesToShow();
        this.updateSlider();
        this.updateDots();
      }, 250));
    }

    getSlidesToShow() {
      const width = window.innerWidth;
      if (width < 768) return 1;
      if (width < 1024) return 2;
      return 3;
    }

    createDots() {
      if (!this.dotsContainer) return;

      const dotsCount = Math.ceil(this.totalSlides / this.options.slidesToShow);
      this.dotsContainer.innerHTML = '';

      for (let i = 0; i < dotsCount; i++) {
        const dot = document.createElement('button');
        dot.className = 'slider-dot';
        dot.setAttribute('aria-label', `スライド ${i + 1}`);
        if (i === 0) dot.classList.add('active');

        dot.addEventListener('click', () => {
          this.goToSlide(i * this.options.slidesToShow);
        });

        this.dotsContainer.appendChild(dot);
      }
    }

    updateDots() {
      if (!this.dotsContainer) return;

      const dots = this.dotsContainer.querySelectorAll('.slider-dot');
      const activeDotIndex = Math.floor(this.currentIndex / this.options.slidesToShow);

      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeDotIndex);
      });
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
      this.track.addEventListener('touchend', () => this.handleTouchEnd());

      // Mouse drag events
      this.track.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      this.track.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.track.addEventListener('mouseup', () => this.handleMouseUp());
      this.track.addEventListener('mouseleave', () => this.handleMouseUp());

      // Pause autoplay on hover
      this.container.addEventListener('mouseenter', () => this.stopAutoplay());
      this.container.addEventListener('mouseleave', () => this.startAutoplay());

      // Keyboard navigation
      this.container.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') this.prev();
        if (e.key === 'ArrowRight') this.next();
      });
    }

    handleTouchStart(e) {
      this.touchStartX = e.touches[0].clientX;
      this.stopAutoplay();
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

    handleMouseUp() {
      if (!this.isDragging) return;

      const diff = this.touchStartX - this.touchEndX;
      const threshold = 50;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          this.next();
        } else {
          this.prev();
        }
      }

      this.isDragging = false;
      this.track.style.cursor = 'grab';
      this.startAutoplay();
    }

    prev() {
      if (this.isAnimating) return;

      const newIndex = this.currentIndex - this.options.slidesToShow;
      if (newIndex < 0) {
        // Loop to end
        this.goToSlide(Math.max(0, this.totalSlides - this.options.slidesToShow));
      } else {
        this.goToSlide(newIndex);
      }
    }

    next() {
      if (this.isAnimating) return;

      const newIndex = this.currentIndex + this.options.slidesToShow;
      const maxIndex = this.totalSlides - this.options.slidesToShow;

      if (newIndex > maxIndex) {
        // Loop to start
        this.goToSlide(0);
      } else {
        this.goToSlide(newIndex);
      }
    }

    goToSlide(index) {
      if (this.isAnimating) return;

      this.isAnimating = true;
      this.currentIndex = Math.max(0, Math.min(index, this.totalSlides - this.options.slidesToShow));

      this.updateSlider();
      this.updateDots();
      this.updateActiveCards();

      setTimeout(() => {
        this.isAnimating = false;
      }, 500);
    }

    updateSlider() {
      const cardWidth = this.cards[0].offsetWidth;
      const offset = this.currentIndex * (cardWidth + this.options.gap);
      this.track.style.transform = `translateX(-${offset}px)`;
    }

    updateActiveCards() {
      this.cards.forEach((card, index) => {
        const isVisible = index >= this.currentIndex &&
                         index < this.currentIndex + this.options.slidesToShow;
        card.classList.toggle('active', isVisible);
      });
    }

    startAutoplay() {
      if (!this.options.autoplay) return;

      this.stopAutoplay();
      this.autoplayTimer = setInterval(() => {
        this.next();
      }, this.options.autoplaySpeed);
    }

    stopAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
      }
    }

    debounce(func, wait) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }
  }

  // ========================================
  // Initialize Slider
  // ========================================
  function init() {
    new TestimonialSlider({
      autoplay: true,
      autoplaySpeed: 5000
    });
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
