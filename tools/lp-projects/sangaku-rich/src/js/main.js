/**
 * SANGAKU BEER - Main JavaScript
 * Rich Tier Landing Page
 */

(function() {
  'use strict';

  // ========================================
  // Configuration
  // ========================================
  const CONFIG = {
    scrollThreshold: 100,
    animationThreshold: 0.15,
    parallaxEnabled: true,
    counterDuration: 2000,
    ageVerificationKey: 'sangaku_age_verified'
  };

  // ========================================
  // DOM Elements
  // ========================================
  const elements = {
    ageGate: document.getElementById('age-gate'),
    ageYes: document.getElementById('age-yes'),
    ageNo: document.getElementById('age-no'),
    header: document.getElementById('header'),
    nav: document.getElementById('nav'),
    hamburger: document.getElementById('hamburger'),
    processProgress: document.getElementById('process-progress'),
    tourReserve: document.getElementById('tour-reserve'),
    shopCta: document.getElementById('shop-cta')
  };

  // ========================================
  // Age Verification
  // ========================================
  const AgeVerification = {
    init() {
      if (this.isVerified()) {
        this.hideGate();
        return;
      }
      this.showGate();
      this.bindEvents();
    },

    isVerified() {
      return sessionStorage.getItem(CONFIG.ageVerificationKey) === 'true';
    },

    showGate() {
      document.body.classList.add('no-scroll');
      if (elements.ageGate) {
        elements.ageGate.classList.remove('hidden');
      }
    },

    hideGate() {
      document.body.classList.remove('no-scroll');
      document.body.classList.add('age-verified');
      if (elements.ageGate) {
        elements.ageGate.classList.add('hidden');
      }
    },

    bindEvents() {
      if (elements.ageYes) {
        elements.ageYes.addEventListener('click', () => {
          sessionStorage.setItem(CONFIG.ageVerificationKey, 'true');
          this.hideGate();
        });
      }

      if (elements.ageNo) {
        elements.ageNo.addEventListener('click', () => {
          window.location.href = 'https://www.google.com';
        });
      }
    }
  };

  // ========================================
  // Header Scroll Effect
  // ========================================
  const HeaderScroll = {
    init() {
      this.handleScroll();
      window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    },

    handleScroll() {
      const scrollY = window.scrollY;
      if (elements.header) {
        if (scrollY > CONFIG.scrollThreshold) {
          elements.header.classList.add('scrolled');
        } else {
          elements.header.classList.remove('scrolled');
        }
      }
    }
  };

  // ========================================
  // Mobile Navigation
  // ========================================
  const MobileNav = {
    init() {
      this.bindEvents();
    },

    bindEvents() {
      if (elements.hamburger) {
        elements.hamburger.addEventListener('click', () => this.toggle());
      }

      // Close nav when clicking on links
      if (elements.nav) {
        const links = elements.nav.querySelectorAll('a');
        links.forEach(link => {
          link.addEventListener('click', () => this.close());
        });
      }

      // Close nav when clicking outside
      document.addEventListener('click', (e) => {
        if (elements.nav && elements.nav.classList.contains('active')) {
          if (!elements.nav.contains(e.target) && !elements.hamburger.contains(e.target)) {
            this.close();
          }
        }
      });
    },

    toggle() {
      if (elements.hamburger) {
        elements.hamburger.classList.toggle('active');
      }
      if (elements.nav) {
        elements.nav.classList.toggle('active');
      }
      document.body.classList.toggle('no-scroll');
    },

    close() {
      if (elements.hamburger) {
        elements.hamburger.classList.remove('active');
      }
      if (elements.nav) {
        elements.nav.classList.remove('active');
      }
      document.body.classList.remove('no-scroll');
    }
  };

  // ========================================
  // Smooth Scroll
  // ========================================
  const SmoothScroll = {
    init() {
      this.bindEvents();
    },

    bindEvents() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = anchor.getAttribute('href');
          if (targetId === '#') return;

          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            const headerHeight = elements.header ? elements.header.offsetHeight : 0;
            const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;

            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
          }
        });
      });
    }
  };

  // ========================================
  // Scroll Animations
  // ========================================
  const ScrollAnimations = {
    observer: null,

    init() {
      this.createObserver();
      this.observeElements();
    },

    createObserver() {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: CONFIG.animationThreshold
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            this.observer.unobserve(entry.target);
          }
        });
      }, options);
    },

    observeElements() {
      const animatedElements = document.querySelectorAll('.animate-on-scroll');
      animatedElements.forEach(el => {
        this.observer.observe(el);
      });
    }
  };

  // ========================================
  // Parallax Effect
  // ========================================
  const Parallax = {
    elements: [],

    init() {
      if (!CONFIG.parallaxEnabled || this.isReducedMotion()) return;

      this.elements = document.querySelectorAll('[data-parallax]');
      if (this.elements.length === 0) return;

      window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
      this.handleScroll();
    },

    isReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    handleScroll() {
      const scrollY = window.scrollY;

      this.elements.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.5;
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;

        if (inView) {
          const yPos = (scrollY - el.offsetTop) * speed;
          el.style.transform = `translateY(${yPos}px)`;
        }
      });
    }
  };

  // ========================================
  // Process Progress Bar
  // ========================================
  const ProcessProgress = {
    init() {
      if (!elements.processProgress) return;

      const processSection = document.getElementById('process');
      if (!processSection) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateProgress();
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });

      observer.observe(processSection);
    },

    animateProgress() {
      const steps = document.querySelectorAll('.process-step');
      const totalSteps = steps.length;
      let currentStep = 0;

      const animateStep = () => {
        if (currentStep >= totalSteps) return;

        const progress = ((currentStep + 1) / totalSteps) * 100;
        elements.processProgress.style.height = `${progress}%`;

        steps[currentStep].classList.add('active');
        currentStep++;

        if (currentStep < totalSteps) {
          setTimeout(animateStep, 400);
        }
      };

      setTimeout(animateStep, 500);
    }
  };

  // ========================================
  // Counter Animation
  // ========================================
  const CounterAnimation = {
    init() {
      const counters = document.querySelectorAll('[data-count]');
      if (counters.length === 0) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      counters.forEach(counter => observer.observe(counter));
    },

    animateCounter(element) {
      const target = parseInt(element.dataset.count, 10);
      const duration = CONFIG.counterDuration;
      let startTime = null;

      const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easedProgress = easeOutQuart(progress);
        const current = Math.floor(easedProgress * target);

        element.textContent = current.toLocaleString();
        element.classList.add('counting');

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          element.textContent = target.toLocaleString();
          element.classList.remove('counting');
        }
      };

      requestAnimationFrame(step);
    }
  };

  // ========================================
  // Button Ripple Effect
  // ========================================
  const ButtonRipple = {
    init() {
      const buttons = document.querySelectorAll('.btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => this.createRipple(e, btn));
      });
    },

    createRipple(event, button) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      button.appendChild(ripple);

      ripple.addEventListener('animationend', () => {
        ripple.remove();
      });
    }
  };

  // ========================================
  // External Link Handler
  // ========================================
  const ExternalLinks = {
    init() {
      // Tour Reserve Button
      if (elements.tourReserve) {
        elements.tourReserve.addEventListener('click', (e) => {
          e.preventDefault();
          // In production, this would open a booking modal or redirect
          alert('予約フォームへ遷移します（デモ）');
        });
      }

      // Shop CTA Button
      if (elements.shopCta) {
        elements.shopCta.addEventListener('click', (e) => {
          e.preventDefault();
          // In production, this would redirect to the shop
          alert('オンラインショップへ遷移します（デモ）');
        });
      }
    }
  };

  // ========================================
  // Lazy Loading Images
  // ========================================
  const LazyLoad = {
    init() {
      if ('loading' in HTMLImageElement.prototype) {
        // Native lazy loading supported
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
          img.src = img.dataset.src;
        });
      } else {
        // Fallback for older browsers
        this.lazyLoadFallback();
      }
    },

    lazyLoadFallback() {
      const images = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  };

  // ========================================
  // Active Navigation Link
  // ========================================
  const ActiveNavLink = {
    sections: [],
    navLinks: [],

    init() {
      this.sections = document.querySelectorAll('section[id]');
      this.navLinks = document.querySelectorAll('.header__nav-list a[href^="#"]');

      window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    },

    handleScroll() {
      const scrollY = window.scrollY;
      const headerHeight = elements.header ? elements.header.offsetHeight : 0;

      this.sections.forEach(section => {
        const sectionTop = section.offsetTop - headerHeight - 100;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }
  };

  // ========================================
  // Performance Optimization
  // ========================================
  const Performance = {
    init() {
      // Add will-change on hover for better GPU performance
      const hoverElements = document.querySelectorAll('.product-card, .philosophy-card, .award-card');
      hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
          el.style.willChange = 'transform';
        });
        el.addEventListener('mouseleave', () => {
          el.style.willChange = 'auto';
        });
      });
    }
  };

  // ========================================
  // Initialize
  // ========================================
  const init = () => {
    AgeVerification.init();
    HeaderScroll.init();
    MobileNav.init();
    SmoothScroll.init();
    ScrollAnimations.init();
    Parallax.init();
    ProcessProgress.init();
    CounterAnimation.init();
    ButtonRipple.init();
    ExternalLinks.init();
    LazyLoad.init();
    ActiveNavLink.init();
    Performance.init();
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
