/**
 * POWER FIT - Main JavaScript
 * Scroll animations, parallax effects, count-up animations, and interactions
 */

(function() {
  'use strict';

  // ==========================================================================
  // Configuration
  // ==========================================================================

  const CONFIG = {
    scrollThreshold: 0.15,
    parallaxSpeed: 0.3,
    counterDuration: 2000,
    headerScrollOffset: 100,
    fixedCtaShowOffset: 600
  };

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Debounce function to limit execution frequency
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

  /**
   * Throttle function for scroll events
   */
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Check if reduced motion is preferred
   */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ==========================================================================
  // Scroll-Triggered Animations
  // ==========================================================================

  class ScrollAnimations {
    constructor() {
      this.elements = [];
      this.observer = null;
      this.init();
    }

    init() {
      if (prefersReducedMotion()) {
        this.showAllElements();
        return;
      }

      this.elements = document.querySelectorAll('.animate-on-scroll');
      this.createObserver();
      this.observeElements();
    }

    createObserver() {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: CONFIG.scrollThreshold
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const delay = parseInt(entry.target.dataset.delay) || 0;
            setTimeout(() => {
              entry.target.classList.add('animated');
            }, delay);
            this.observer.unobserve(entry.target);
          }
        });
      }, options);
    }

    observeElements() {
      this.elements.forEach(el => {
        this.observer.observe(el);
      });
    }

    showAllElements() {
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.classList.add('animated');
      });
    }
  }

  // ==========================================================================
  // Parallax Effect
  // ==========================================================================

  class ParallaxEffect {
    constructor() {
      this.elements = [];
      this.ticking = false;
      this.init();
    }

    init() {
      if (prefersReducedMotion()) return;

      this.elements = document.querySelectorAll('.parallax-bg');
      if (this.elements.length === 0) return;

      this.bindEvents();
      this.update();
    }

    bindEvents() {
      window.addEventListener('scroll', () => {
        if (!this.ticking) {
          requestAnimationFrame(() => {
            this.update();
            this.ticking = false;
          });
          this.ticking = true;
        }
      }, { passive: true });
    }

    update() {
      const scrollTop = window.pageYOffset;

      this.elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top + scrollTop;
        const elementHeight = el.offsetHeight;
        const windowHeight = window.innerHeight;

        // Only animate when element is in view
        if (scrollTop + windowHeight > elementTop && scrollTop < elementTop + elementHeight) {
          const yPos = (scrollTop - elementTop) * CONFIG.parallaxSpeed;
          el.style.transform = `translate3d(0, ${yPos}px, 0)`;
        }
      });
    }
  }

  // ==========================================================================
  // Count-Up Animation
  // ==========================================================================

  class CountUpAnimation {
    constructor() {
      this.counters = [];
      this.observer = null;
      this.init();
    }

    init() {
      this.counters = document.querySelectorAll('.stat-card__count');
      if (this.counters.length === 0) return;

      this.createObserver();
      this.observeCounters();
    }

    createObserver() {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(entry.target);
            this.animateBar(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      }, options);
    }

    observeCounters() {
      this.counters.forEach(counter => {
        this.observer.observe(counter);
      });
    }

    animateCounter(element) {
      const target = parseFloat(element.dataset.count);
      const decimal = element.dataset.decimal ? parseInt(element.dataset.decimal) : 0;
      const duration = CONFIG.counterDuration;
      const startTime = performance.now();

      const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out quart
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = easeOutQuart * target;

        if (decimal > 0) {
          element.textContent = currentValue.toFixed(decimal);
        } else {
          element.textContent = Math.floor(currentValue).toLocaleString();
        }

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };

      requestAnimationFrame(updateCounter);
    }

    animateBar(counterElement) {
      const statCard = counterElement.closest('.stat-card');
      if (!statCard) return;

      const barFill = statCard.querySelector('.stat-card__bar-fill');
      if (!barFill) return;

      const width = barFill.dataset.width || 100;

      setTimeout(() => {
        barFill.style.width = `${width}%`;
      }, 100);
    }
  }

  // ==========================================================================
  // Header Scroll Effect
  // ==========================================================================

  class HeaderScroll {
    constructor() {
      this.header = null;
      this.lastScrollTop = 0;
      this.init();
    }

    init() {
      this.header = document.getElementById('header');
      if (!this.header) return;

      this.bindEvents();
      this.checkScroll();
    }

    bindEvents() {
      window.addEventListener('scroll', throttle(() => {
        this.checkScroll();
      }, 100), { passive: true });
    }

    checkScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > CONFIG.headerScrollOffset) {
        this.header.classList.add('header--scrolled');
      } else {
        this.header.classList.remove('header--scrolled');
      }

      this.lastScrollTop = scrollTop;
    }
  }

  // ==========================================================================
  // Fixed CTA Button (Mobile)
  // ==========================================================================

  class FixedCTA {
    constructor() {
      this.element = null;
      this.init();
    }

    init() {
      this.element = document.querySelector('.fixed-cta');
      if (!this.element) return;

      this.bindEvents();
      this.checkVisibility();
    }

    bindEvents() {
      window.addEventListener('scroll', throttle(() => {
        this.checkVisibility();
      }, 100), { passive: true });
    }

    checkVisibility() {
      const scrollTop = window.pageYOffset;
      const footerElement = document.querySelector('.footer');

      if (scrollTop > CONFIG.fixedCtaShowOffset) {
        // Hide when near footer
        if (footerElement) {
          const footerTop = footerElement.getBoundingClientRect().top;
          if (footerTop < window.innerHeight) {
            this.element.classList.remove('visible');
            return;
          }
        }
        this.element.classList.add('visible');
      } else {
        this.element.classList.remove('visible');
      }
    }
  }

  // ==========================================================================
  // FAQ Accordion
  // ==========================================================================

  class FAQAccordion {
    constructor() {
      this.items = [];
      this.init();
    }

    init() {
      this.items = document.querySelectorAll('.faq__item');
      if (this.items.length === 0) return;

      this.bindEvents();
    }

    bindEvents() {
      this.items.forEach(item => {
        const question = item.querySelector('.faq__question');
        if (question) {
          question.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleItem(item);
          });
        }
      });
    }

    toggleItem(item) {
      const isActive = item.classList.contains('active');

      // Close all items
      this.items.forEach(i => {
        i.classList.remove('active');
        const answer = i.querySelector('.faq__answer');
        if (answer) {
          answer.style.maxHeight = '0';
        }
      });

      // Open clicked item if it wasn't active
      if (!isActive) {
        item.classList.add('active');
        const answer = item.querySelector('.faq__answer');
        if (answer) {
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      }
    }
  }

  // ==========================================================================
  // Hero Particles
  // ==========================================================================

  class HeroParticles {
    constructor() {
      this.container = null;
      this.particleCount = 20;
      this.init();
    }

    init() {
      if (prefersReducedMotion()) return;

      this.container = document.getElementById('hero-particles');
      if (!this.container) return;

      this.createParticles();
    }

    createParticles() {
      for (let i = 0; i < this.particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'hero__particle';

        const size = Math.random() * 4 + 2;
        const left = Math.random() * 100;
        const duration = Math.random() * 10 + 8;
        const delay = Math.random() * 10;
        const opacity = Math.random() * 0.5 + 0.2;

        particle.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          left: ${left}%;
          opacity: ${opacity};
          animation: particleFloat ${duration}s linear ${delay}s infinite;
        `;

        this.container.appendChild(particle);
      }
    }
  }

  // ==========================================================================
  // Smooth Scroll for Anchor Links
  // ==========================================================================

  class SmoothScroll {
    constructor() {
      this.init();
    }

    init() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const href = anchor.getAttribute('href');
          if (href === '#') {
            e.preventDefault();
            return;
          }

          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            const headerHeight = document.getElementById('header')?.offsetHeight || 0;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
              top: targetPosition,
              behavior: prefersReducedMotion() ? 'auto' : 'smooth'
            });
          }
        });
      });
    }
  }

  // ==========================================================================
  // Contact Form Handling
  // ==========================================================================

  class ContactForm {
    constructor() {
      this.form = null;
      this.init();
    }

    init() {
      this.form = document.getElementById('contact-form');
      if (!this.form) return;

      this.bindEvents();
    }

    bindEvents() {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });

      // Input focus effects
      const inputs = this.form.querySelectorAll('.contact-form__input, .contact-form__textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', () => {
          input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
          if (!input.value) {
            input.parentElement.classList.remove('focused');
          }
        });
      });
    }

    handleSubmit() {
      const formData = new FormData(this.form);
      const data = Object.fromEntries(formData.entries());

      // Validate required fields
      const requiredFields = ['name', 'email', 'phone'];
      let isValid = true;

      requiredFields.forEach(field => {
        const input = this.form.querySelector(`[name="${field}"]`);
        if (!input.value.trim()) {
          isValid = false;
          input.classList.add('error');
        } else {
          input.classList.remove('error');
        }
      });

      if (!isValid) {
        alert('必須項目を入力してください。');
        return;
      }

      // Check consent
      const consent = this.form.querySelector('[name="consent"]');
      if (!consent.checked) {
        alert('プライバシーポリシーに同意してください。');
        return;
      }

      // Simulate form submission
      const submitBtn = this.form.querySelector('.contact-form__submit');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>送信中...</span>';
      submitBtn.disabled = true;

      setTimeout(() => {
        alert('お問い合わせを受け付けました。\n24時間以内にご連絡いたします。');
        this.form.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }, 1500);
    }
  }

  // ==========================================================================
  // Mobile Menu Toggle
  // ==========================================================================

  class MobileMenu {
    constructor() {
      this.toggle = null;
      this.nav = null;
      this.isOpen = false;
      this.init();
    }

    init() {
      this.toggle = document.querySelector('.header__menu-toggle');
      this.nav = document.querySelector('.header__nav');
      if (!this.toggle || !this.nav) return;

      this.bindEvents();
    }

    bindEvents() {
      this.toggle.addEventListener('click', () => {
        this.toggleMenu();
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.toggle.contains(e.target) && !this.nav.contains(e.target)) {
          this.closeMenu();
        }
      });

      // Close menu when clicking nav links
      this.nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          this.closeMenu();
        });
      });
    }

    toggleMenu() {
      this.isOpen = !this.isOpen;
      this.toggle.classList.toggle('active', this.isOpen);
      this.nav.classList.toggle('active', this.isOpen);
      document.body.classList.toggle('menu-open', this.isOpen);
    }

    closeMenu() {
      this.isOpen = false;
      this.toggle.classList.remove('active');
      this.nav.classList.remove('active');
      document.body.classList.remove('menu-open');
    }
  }

  // ==========================================================================
  // Process Timeline Animation
  // ==========================================================================

  class ProcessTimeline {
    constructor() {
      this.timeline = null;
      this.observer = null;
      this.init();
    }

    init() {
      this.timeline = document.querySelector('.process__timeline');
      if (!this.timeline) return;

      this.createObserver();
    }

    createObserver() {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateTimeline();
            this.observer.unobserve(entry.target);
          }
        });
      }, options);

      this.observer.observe(this.timeline);
    }

    animateTimeline() {
      const line = this.timeline.querySelector('.process__line');
      if (line) {
        line.classList.add('animated');
      }

      const steps = this.timeline.querySelectorAll('.process__step');
      steps.forEach((step, index) => {
        setTimeout(() => {
          step.classList.add('animated');
        }, 300 * (index + 1));
      });
    }
  }

  // ==========================================================================
  // Initialize All Components
  // ==========================================================================

  function init() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initComponents);
    } else {
      initComponents();
    }
  }

  function initComponents() {
    new ScrollAnimations();
    new ParallaxEffect();
    new CountUpAnimation();
    new HeaderScroll();
    new FixedCTA();
    new FAQAccordion();
    new HeroParticles();
    new SmoothScroll();
    new ContactForm();
    new MobileMenu();
    new ProcessTimeline();
  }

  // Start initialization
  init();

})();
