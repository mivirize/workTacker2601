/**
 * SANGAKU BEER - Scroll and Reveal Animations
 * Premium Landing Page
 */

(function() {
  'use strict';

  // ========================================
  // Configuration
  // ========================================
  const ANIMATION_CONFIG = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px',
    staggerDelay: 100,
    parallaxSensitivity: 0.5
  };

  // ========================================
  // Scroll-Driven Animations
  // ========================================
  class ScrollAnimator {
    constructor() {
      this.animatedElements = [];
      this.scrollY = 0;
      this.ticking = false;
      this.init();
    }

    init() {
      this.cacheElements();
      this.setupObservers();
      this.bindScrollEvents();
      this.initTextAnimations();
      this.initTimelineAnimation();
    }

    cacheElements() {
      this.animatedElements = document.querySelectorAll('.animate-on-scroll');
      this.parallaxElements = document.querySelectorAll('[data-parallax]');
      this.revealElements = document.querySelectorAll('[data-reveal]');
      this.heroTitle = document.querySelector('.hero__title');
      this.timelineItems = document.querySelectorAll('.timeline__item');
      this.productCards = document.querySelectorAll('.product-card');
    }

    setupObservers() {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
          threshold: ANIMATION_CONFIG.threshold,
          rootMargin: ANIMATION_CONFIG.rootMargin
        }
      );

      this.animatedElements.forEach(el => {
        this.intersectionObserver.observe(el);
      });

      this.revealElements.forEach(el => {
        this.intersectionObserver.observe(el);
      });
    }

    handleIntersection(entries) {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          const delay = index * ANIMATION_CONFIG.staggerDelay;
          setTimeout(() => {
            entry.target.classList.add('animated');
            this.triggerElementAnimation(entry.target);
          }, delay);

          this.intersectionObserver.unobserve(entry.target);
        }
      });
    }

    triggerElementAnimation(element) {
      const animationType = element.dataset.reveal;

      switch (animationType) {
        case 'fade-up':
          this.animateFadeUp(element);
          break;
        case 'fade-left':
          this.animateFadeLeft(element);
          break;
        case 'fade-right':
          this.animateFadeRight(element);
          break;
        case 'scale':
          this.animateScale(element);
          break;
        case 'counter':
          this.animateCounter(element);
          break;
        default:
          break;
      }
    }

    bindScrollEvents() {
      window.addEventListener('scroll', () => {
        this.scrollY = window.scrollY;
        if (!this.ticking) {
          window.requestAnimationFrame(() => {
            this.updateAnimations();
            this.ticking = false;
          });
          this.ticking = true;
        }
      }, { passive: true });
    }

    updateAnimations() {
      this.updateParallaxElements();
      this.updateProgressIndicators();
    }

    updateParallaxElements() {
      this.parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.parallax) || 0.5;
        const rect = element.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;

        if (inView) {
          const yOffset = (rect.top - window.innerHeight / 2) * speed;
          element.style.transform = `translateY(${yOffset}px)`;
        }
      });
    }

    updateProgressIndicators() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = (this.scrollY / docHeight) * 100;

      const progressBar = document.querySelector('.scroll-progress-bar');
      if (progressBar) {
        progressBar.style.width = `${scrollProgress}%`;
      }
    }

    // ========================================
    // Animation Methods
    // ========================================

    animateFadeUp(element) {
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';

      requestAnimationFrame(() => {
        element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      });
    }

    animateFadeLeft(element) {
      element.style.opacity = '0';
      element.style.transform = 'translateX(-30px)';

      requestAnimationFrame(() => {
        element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateX(0)';
      });
    }

    animateFadeRight(element) {
      element.style.opacity = '0';
      element.style.transform = 'translateX(30px)';

      requestAnimationFrame(() => {
        element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateX(0)';
      });
    }

    animateScale(element) {
      element.style.opacity = '0';
      element.style.transform = 'scale(0.9)';

      requestAnimationFrame(() => {
        element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        element.style.opacity = '1';
        element.style.transform = 'scale(1)';
      });
    }

    animateCounter(element) {
      const target = parseInt(element.dataset.count, 10);
      const duration = 2000;
      let startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        element.textContent = Math.floor(easeOutQuart * target);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    }

    // ========================================
    // Text Animations
    // ========================================

    initTextAnimations() {
      this.animateHeroTitle();
    }

    animateHeroTitle() {
      if (!this.heroTitle) return;

      const lines = this.heroTitle.querySelectorAll('.hero__title-line');

      lines.forEach((line, lineIndex) => {
        const text = line.textContent;
        line.textContent = '';
        line.style.display = 'block';

        text.split('').forEach((char, charIndex) => {
          const span = document.createElement('span');
          span.className = 'char-animate';
          span.textContent = char === ' ' ? '\u00A0' : char;
          span.style.transitionDelay = `${(lineIndex * text.length + charIndex) * 30}ms`;
          line.appendChild(span);
        });
      });

      setTimeout(() => {
        document.querySelectorAll('.char-animate').forEach(char => {
          char.classList.add('visible');
        });
      }, 500);
    }

    // ========================================
    // Timeline Animation
    // ========================================

    initTimelineAnimation() {
      if (!this.timelineItems.length) return;

      const timelineObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animated');
              this.animateTimelineMarker(entry.target);
              timelineObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );

      this.timelineItems.forEach(item => {
        timelineObserver.observe(item);
      });
    }

    animateTimelineMarker(item) {
      const marker = item.querySelector('.timeline__marker');
      if (marker) {
        marker.style.transform = 'translateX(-50%) scale(0)';
        requestAnimationFrame(() => {
          marker.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
          marker.style.transform = 'translateX(-50%) scale(1)';
        });
      }
    }
  }

  // ========================================
  // Product Card 3D Tilt Effect
  // ========================================
  class Card3DTilt {
    constructor(element) {
      this.element = element;
      this.inner = element.querySelector('.product-card__inner');
      this.bindEvents();
    }

    bindEvents() {
      this.element.addEventListener('mouseenter', () => this.onEnter());
      this.element.addEventListener('mousemove', (e) => this.onMove(e));
      this.element.addEventListener('mouseleave', () => this.onLeave());
    }

    onEnter() {
      this.inner.style.transition = 'transform 0.1s ease';
    }

    onMove(e) {
      const rect = this.element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / centerY * -10;
      const rotateY = (x - centerX) / centerX * 10;

      this.inner.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateZ(20px)
      `;
    }

    onLeave() {
      this.inner.style.transition = 'transform 0.5s ease';
      this.inner.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    }
  }

  // ========================================
  // Smooth Reveal Animation
  // ========================================
  class SmoothReveal {
    constructor() {
      this.sections = document.querySelectorAll('section');
      this.init();
    }

    init() {
      this.sections.forEach(section => {
        this.observeSection(section);
      });
    }

    observeSection(section) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              section.classList.add('section-visible');
              observer.unobserve(section);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(section);
    }
  }

  // ========================================
  // Magnetic Button Effect
  // ========================================
  class MagneticButton {
    constructor(element) {
      this.element = element;
      this.strength = 0.3;
      this.bindEvents();
    }

    bindEvents() {
      this.element.addEventListener('mousemove', (e) => this.onMove(e));
      this.element.addEventListener('mouseleave', () => this.onLeave());
    }

    onMove(e) {
      const rect = this.element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      this.element.style.transform = `translate(${x * this.strength}px, ${y * this.strength}px)`;
    }

    onLeave() {
      this.element.style.transform = 'translate(0, 0)';
    }
  }

  // ========================================
  // Initialize All Animations
  // ========================================
  function initAnimations() {
    const scrollAnimator = new ScrollAnimator();

    document.querySelectorAll('.product-card').forEach(card => {
      new Card3DTilt(card);
    });

    new SmoothReveal();

    document.querySelectorAll('.btn--primary, .btn--large').forEach(btn => {
      new MagneticButton(btn);
    });

    initLogoAnimation();
    initNavHoverEffects();
  }

  // ========================================
  // Logo Animation
  // ========================================
  function initLogoAnimation() {
    const logo = document.querySelector('.nav__logo-text');
    if (!logo) return;

    logo.addEventListener('mouseenter', () => {
      logo.style.transition = 'letter-spacing 0.3s ease, color 0.3s ease';
      logo.style.letterSpacing = '0.15em';
    });

    logo.addEventListener('mouseleave', () => {
      logo.style.letterSpacing = '0.1em';
    });
  }

  // ========================================
  // Nav Hover Effects
  // ========================================
  function initNavHoverEffects() {
    const navLinks = document.querySelectorAll('.nav__menu a:not(.btn)');

    navLinks.forEach(link => {
      link.style.position = 'relative';

      const underline = document.createElement('span');
      underline.className = 'nav-underline';
      underline.style.cssText = `
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 1px;
        background: currentColor;
        transition: width 0.3s ease;
      `;
      link.appendChild(underline);

      link.addEventListener('mouseenter', () => {
        underline.style.width = '100%';
      });

      link.addEventListener('mouseleave', () => {
        underline.style.width = '0';
      });
    });
  }

  // ========================================
  // Export and Initialize
  // ========================================
  window.initScrollAnimations = initAnimations;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    initAnimations();
  }

})();
