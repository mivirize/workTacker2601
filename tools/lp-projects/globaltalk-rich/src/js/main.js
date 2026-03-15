/**
 * Global Talk - Main JavaScript
 * Rich LP Interactions and Animations
 */

(function() {
  'use strict';

  // ========================================
  // Configuration
  // ========================================
  const CONFIG = {
    scrollThreshold: 100,
    animationThreshold: 0.15,
    countUpDuration: 2000,
    debounceDelay: 100
  };

  // ========================================
  // Utility Functions
  // ========================================

  /**
   * Debounce function for performance optimization
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
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Check if element is in viewport
   */
  function isInViewport(element, threshold = 0) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    return (
      rect.top <= windowHeight * (1 - threshold) &&
      rect.bottom >= 0
    );
  }

  // ========================================
  // Header Scroll Effect
  // ========================================
  function initHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;

    const handleScroll = throttle(() => {
      if (window.scrollY > CONFIG.scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // ========================================
  // Mobile Navigation
  // ========================================
  function initMobileNav() {
    const menuToggle = document.querySelector('.header__menu-toggle');
    const mobileNav = document.getElementById('mobileNav');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav__link');

    if (!menuToggle || !mobileNav) return;

    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });

    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ========================================
  // Smooth Scroll
  // ========================================
  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#') {
          e.preventDefault();
          return;
        }

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ========================================
  // Scroll Animations
  // ========================================
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: CONFIG.animationThreshold,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    animatedElements.forEach(el => observer.observe(el));
  }

  // ========================================
  // Count Up Animation
  // ========================================
  function initCountUp() {
    const counters = document.querySelectorAll('.count-up');
    let hasAnimated = false;

    function animateCounter(element) {
      const target = parseInt(element.getAttribute('data-target'), 10);
      if (isNaN(target)) return;

      const duration = CONFIG.countUpDuration;
      const startTime = performance.now();

      function updateCount(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out-quart)
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(easeOutQuart * target);

        element.textContent = currentValue.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        }
      }

      requestAnimationFrame(updateCount);
    }

    function animateBars() {
      const bars = document.querySelectorAll('.stat-card__bar-fill');
      bars.forEach(bar => {
        const width = bar.getAttribute('data-width');
        if (width) {
          bar.style.width = width + '%';
        }
      });
    }

    const statsSection = document.getElementById('stats');
    if (!statsSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;
            counters.forEach(counter => animateCounter(counter));
            animateBars();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(statsSection);
  }

  // ========================================
  // Video Player
  // ========================================
  function initVideoPlayer() {
    const videoPlaceholder = document.getElementById('videoPlaceholder');
    const videoContainer = document.getElementById('videoContainer');
    const videoPlayBtn = document.getElementById('videoPlayBtn');
    const demoVideo = document.getElementById('demoVideo');

    if (!videoPlayBtn || !videoPlaceholder || !videoContainer || !demoVideo) return;

    videoPlayBtn.addEventListener('click', () => {
      const videoSrc = demoVideo.getAttribute('data-src');
      if (videoSrc) {
        demoVideo.setAttribute('src', videoSrc);
      }
      videoPlaceholder.style.display = 'none';
      videoContainer.style.display = 'block';
    });
  }

  // ========================================
  // FAQ Accordion
  // ========================================
  function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
      const question = item.querySelector('.faq-item__question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all items
        faqItems.forEach(otherItem => {
          otherItem.classList.remove('active');
          const otherQuestion = otherItem.querySelector('.faq-item__question');
          if (otherQuestion) {
            otherQuestion.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current item
        if (!isActive) {
          item.classList.add('active');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // ========================================
  // Form Handling
  // ========================================
  function initFormHandling() {
    const form = document.getElementById('trialForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Basic validation
      const errors = validateForm(data);
      if (errors.length > 0) {
        showFormErrors(errors);
        return;
      }

      // Simulate form submission
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>送信中...</span>';
      submitBtn.disabled = true;

      // Simulate API call
      setTimeout(() => {
        submitBtn.innerHTML = '<span>送信完了!</span>';
        submitBtn.classList.add('form-success');

        // Reset form after delay
        setTimeout(() => {
          form.reset();
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          submitBtn.classList.remove('form-success');
          showSuccessMessage();
        }, 1500);
      }, 1500);
    });
  }

  function validateForm(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('お名前を入力してください');
    }

    if (!data.email || !isValidEmail(data.email)) {
      errors.push('有効なメールアドレスを入力してください');
    }

    if (!data.phone || !isValidPhone(data.phone)) {
      errors.push('有効な電話番号を入力してください');
    }

    if (!data.privacy) {
      errors.push('プライバシーポリシーに同意してください');
    }

    return errors;
  }

  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function isValidPhone(phone) {
    const re = /^[\d\-+()]+$/;
    return phone.length >= 10 && re.test(phone.replace(/\s/g, ''));
  }

  function showFormErrors(errors) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.form-error-message');
    existingErrors.forEach(el => el.remove());

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error-message';
    errorDiv.style.cssText = `
      background: #fef2f2;
      border: 1px solid #ef4444;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
      color: #dc2626;
      font-size: 0.875rem;
    `;
    errorDiv.innerHTML = errors.map(err => `<p>${err}</p>`).join('');

    const form = document.getElementById('trialForm');
    const title = form.querySelector('.trial-form__title');
    title.insertAdjacentElement('afterend', errorDiv);

    // Shake animation
    form.classList.add('form-error');
    setTimeout(() => form.classList.remove('form-error'), 500);
  }

  function showSuccessMessage() {
    const form = document.getElementById('trialForm');

    // Remove existing messages
    const existingMessages = document.querySelectorAll('.form-error-message, .form-success-message');
    existingMessages.forEach(el => el.remove());

    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success-message';
    successDiv.style.cssText = `
      background: #f0fdf4;
      border: 1px solid #10b981;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
      color: #059669;
      font-size: 0.875rem;
      text-align: center;
    `;
    successDiv.innerHTML = `
      <p><strong>お申し込みありがとうございます!</strong></p>
      <p>24時間以内に担当者よりご連絡いたします。</p>
    `;

    const title = form.querySelector('.trial-form__title');
    title.insertAdjacentElement('afterend', successDiv);

    // Remove after delay
    setTimeout(() => successDiv.remove(), 5000);
  }

  // ========================================
  // Fixed CTA Visibility
  // ========================================
  function initFixedCta() {
    const fixedCta = document.getElementById('fixedCta');
    const heroSection = document.getElementById('hero');
    const ctaSection = document.getElementById('cta-form');

    if (!fixedCta || !heroSection) return;

    const handleScroll = throttle(() => {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      const ctaTop = ctaSection ? ctaSection.getBoundingClientRect().top : Infinity;
      const windowHeight = window.innerHeight;

      if (heroBottom < 0 && ctaTop > windowHeight) {
        fixedCta.classList.add('visible');
      } else {
        fixedCta.classList.remove('visible');
      }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // ========================================
  // Hero Particles
  // ========================================
  function initHeroParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    const particleCount = 30;
    const colors = [
      'rgba(255, 107, 53, 0.3)',
      'rgba(0, 180, 216, 0.3)',
      'rgba(255, 255, 255, 0.2)'
    ];

    for (let i = 0; i < particleCount; i++) {
      createParticle(container, colors);
    }
  }

  function createParticle(container, colors) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = 2 + Math.random() * 4;
    const left = Math.random() * 100;
    const duration = 15 + Math.random() * 20;
    const delay = Math.random() * 15;
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      background: ${color};
      animation: particleFloat ${duration}s linear ${delay}s infinite;
    `;

    container.appendChild(particle);
  }

  // ========================================
  // Button Ripple Effect
  // ========================================
  function initRippleEffect() {
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
      button.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  // ========================================
  // Prevent default on # links
  // ========================================
  function initPreventDefault() {
    const hashLinks = document.querySelectorAll('a[href="#"]');
    hashLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
      });
    });
  }

  // ========================================
  // Initialize All
  // ========================================
  function init() {
    initHeaderScroll();
    initMobileNav();
    initSmoothScroll();
    initScrollAnimations();
    initCountUp();
    initVideoPlayer();
    initFaqAccordion();
    initFormHandling();
    initFixedCta();
    initHeroParticles();
    initRippleEffect();
    initPreventDefault();
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
