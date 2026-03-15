/**
 * Pawsome Stay - Slider Component
 * Touch-enabled carousel for facility rooms
 */

(function() {
  'use strict';

  // ============================================
  // Slider Class
  // ============================================
  function Slider(element, options) {
    if (!element) return;

    this.slider = element;
    this.track = element.querySelector('.slider__track');
    this.slides = Array.from(element.querySelectorAll('.slider__slide'));
    this.prevBtn = element.querySelector('.slider__btn--prev');
    this.nextBtn = element.querySelector('.slider__btn--next');
    this.dotsContainer = element.querySelector('.slider__dots');

    this.options = Object.assign({
      autoplay: false,
      autoplaySpeed: 5000,
      slidesPerView: 1,
      breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      },
      loop: true,
      gap: 16
    }, options);

    this.currentIndex = 0;
    this.slidesPerView = this.options.slidesPerView;
    this.totalSlides = this.slides.length;
    this.isAnimating = false;
    this.autoplayInterval = null;

    // Touch handling
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.isDragging = false;

    this.init();
  }

  Slider.prototype.init = function() {
    this.updateSlidesPerView();
    this.createDots();
    this.bindEvents();
    this.updateSlider();

    if (this.options.autoplay) {
      this.startAutoplay();
    }
  };

  Slider.prototype.updateSlidesPerView = function() {
    var width = window.innerWidth;
    var breakpoints = this.options.breakpoints;

    this.slidesPerView = this.options.slidesPerView;

    Object.keys(breakpoints).forEach(function(bp) {
      if (width >= parseInt(bp)) {
        this.slidesPerView = breakpoints[bp].slidesPerView;
      }
    }, this);
  };

  Slider.prototype.createDots = function() {
    if (!this.dotsContainer) return;

    this.dotsContainer.innerHTML = '';
    var totalDots = Math.ceil(this.totalSlides - this.slidesPerView + 1);

    for (var i = 0; i < Math.max(totalDots, 1); i++) {
      var dot = document.createElement('button');
      dot.className = 'slider__dot';
      dot.setAttribute('aria-label', '\u30B9\u30E9\u30A4\u30C9 ' + (i + 1));
      dot.setAttribute('data-index', i);

      if (i === 0) {
        dot.classList.add('slider__dot--active');
      }

      this.dotsContainer.appendChild(dot);
    }

    this.dots = Array.from(this.dotsContainer.querySelectorAll('.slider__dot'));
  };

  Slider.prototype.bindEvents = function() {
    var self = this;

    // Navigation buttons
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', function() {
        self.prev();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', function() {
        self.next();
      });
    }

    // Dots
    if (this.dotsContainer) {
      this.dotsContainer.addEventListener('click', function(e) {
        var dot = e.target.closest('.slider__dot');
        if (dot) {
          var index = parseInt(dot.getAttribute('data-index'));
          self.goTo(index);
        }
      });
    }

    // Touch events
    this.track.addEventListener('touchstart', function(e) {
      self.onTouchStart(e);
    }, { passive: true });

    this.track.addEventListener('touchmove', function(e) {
      self.onTouchMove(e);
    }, { passive: true });

    this.track.addEventListener('touchend', function(e) {
      self.onTouchEnd(e);
    });

    // Mouse drag events
    this.track.addEventListener('mousedown', function(e) {
      self.onMouseDown(e);
    });

    document.addEventListener('mousemove', function(e) {
      self.onMouseMove(e);
    });

    document.addEventListener('mouseup', function(e) {
      self.onMouseUp(e);
    });

    // Keyboard navigation
    this.slider.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') {
        self.prev();
      } else if (e.key === 'ArrowRight') {
        self.next();
      }
    });

    // Window resize
    var resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        self.updateSlidesPerView();
        self.createDots();
        self.updateSlider();
      }, 250);
    });

    // Pause autoplay on hover
    if (this.options.autoplay) {
      this.slider.addEventListener('mouseenter', function() {
        self.stopAutoplay();
      });

      this.slider.addEventListener('mouseleave', function() {
        self.startAutoplay();
      });
    }
  };

  // Touch handling
  Slider.prototype.onTouchStart = function(e) {
    this.touchStartX = e.touches[0].clientX;
    this.isDragging = true;
    this.stopAutoplay();
  };

  Slider.prototype.onTouchMove = function(e) {
    if (!this.isDragging) return;
    this.touchEndX = e.touches[0].clientX;
  };

  Slider.prototype.onTouchEnd = function() {
    if (!this.isDragging) return;
    this.isDragging = false;

    var diff = this.touchStartX - this.touchEndX;
    var threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.next();
      } else {
        this.prev();
      }
    }

    if (this.options.autoplay) {
      this.startAutoplay();
    }
  };

  // Mouse drag handling
  Slider.prototype.onMouseDown = function(e) {
    e.preventDefault();
    this.touchStartX = e.clientX;
    this.isDragging = true;
    this.track.style.cursor = 'grabbing';
    this.stopAutoplay();
  };

  Slider.prototype.onMouseMove = function(e) {
    if (!this.isDragging) return;
    this.touchEndX = e.clientX;
  };

  Slider.prototype.onMouseUp = function() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.track.style.cursor = 'grab';

    var diff = this.touchStartX - this.touchEndX;
    var threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.next();
      } else {
        this.prev();
      }
    }

    if (this.options.autoplay) {
      this.startAutoplay();
    }
  };

  // Navigation methods
  Slider.prototype.prev = function() {
    if (this.isAnimating) return;

    var maxIndex = Math.max(0, this.totalSlides - this.slidesPerView);

    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else if (this.options.loop) {
      this.currentIndex = maxIndex;
    }

    this.updateSlider();
  };

  Slider.prototype.next = function() {
    if (this.isAnimating) return;

    var maxIndex = Math.max(0, this.totalSlides - this.slidesPerView);

    if (this.currentIndex < maxIndex) {
      this.currentIndex++;
    } else if (this.options.loop) {
      this.currentIndex = 0;
    }

    this.updateSlider();
  };

  Slider.prototype.goTo = function(index) {
    if (this.isAnimating) return;

    var maxIndex = Math.max(0, this.totalSlides - this.slidesPerView);
    this.currentIndex = Math.min(Math.max(0, index), maxIndex);
    this.updateSlider();
  };

  Slider.prototype.updateSlider = function() {
    var self = this;
    this.isAnimating = true;

    // Calculate slide width
    var slideWidth = 100 / this.slidesPerView;
    var translateX = -(this.currentIndex * slideWidth);

    // Update slide widths
    this.slides.forEach(function(slide) {
      slide.style.flex = '0 0 ' + slideWidth + '%';
    });

    // Apply transform
    this.track.style.transform = 'translateX(' + translateX + '%)';

    // Update dots
    if (this.dots) {
      this.dots.forEach(function(dot, index) {
        if (index === self.currentIndex) {
          dot.classList.add('slider__dot--active');
        } else {
          dot.classList.remove('slider__dot--active');
        }
      });
    }

    // Update button states (if not looping)
    if (!this.options.loop) {
      var maxIndex = Math.max(0, this.totalSlides - this.slidesPerView);

      if (this.prevBtn) {
        this.prevBtn.disabled = this.currentIndex === 0;
        this.prevBtn.style.opacity = this.currentIndex === 0 ? '0.5' : '1';
      }

      if (this.nextBtn) {
        this.nextBtn.disabled = this.currentIndex >= maxIndex;
        this.nextBtn.style.opacity = this.currentIndex >= maxIndex ? '0.5' : '1';
      }
    }

    // Reset animation flag
    setTimeout(function() {
      self.isAnimating = false;
    }, 500);
  };

  // Autoplay methods
  Slider.prototype.startAutoplay = function() {
    var self = this;

    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }

    this.autoplayInterval = setInterval(function() {
      self.next();
    }, this.options.autoplaySpeed);
  };

  Slider.prototype.stopAutoplay = function() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  };

  // ============================================
  // Initialize all sliders
  // ============================================
  document.addEventListener('DOMContentLoaded', function() {
    var sliders = document.querySelectorAll('[data-slider]');

    sliders.forEach(function(sliderElement) {
      var sliderName = sliderElement.getAttribute('data-slider');

      // Custom options per slider if needed
      var options = {
        autoplay: false,
        loop: true
      };

      if (sliderName === 'facility') {
        options.autoplay = true;
        options.autoplaySpeed = 4000;
      }

      new Slider(sliderElement, options);
    });

    // Make track draggable
    var tracks = document.querySelectorAll('.slider__track');
    tracks.forEach(function(track) {
      track.style.cursor = 'grab';
    });
  });

  // Export Slider class for external use
  window.Slider = Slider;

})();
