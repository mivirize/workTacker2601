/**
 * POWER FIT - Landing Page JavaScript
 * Standard Tier - Vanilla JS Only
 */

(function() {
  'use strict';

  /**
   * Initialize scroll animations using Intersection Observer
   */
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (!animatedElements.length) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(function(element) {
      observer.observe(element);
    });
  }

  /**
   * Animate counter numbers
   */
  function animateCounter(element, target, duration) {
    if (duration === undefined) duration = 2000;

    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easeOutQuart = 1 - Math.pow(1 - progress, 4);
      var currentValue = Math.floor(easeOutQuart * target);
      element.textContent = currentValue.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  /**
   * Initialize counter animations
   */
  function initCounterAnimations() {
    var counters = document.querySelectorAll('[data-count]');

    if (!counters.length) return;

    var observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var target = parseInt(entry.target.getAttribute('data-count'), 10);
          animateCounter(entry.target, target, 2000);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    counters.forEach(function(counter) {
      observer.observe(counter);
    });
  }

  /**
   * Initialize FAQ accordion
   */
  function initFAQ() {
    var faqItems = document.querySelectorAll('.faq-item__question');

    faqItems.forEach(function(button) {
      button.addEventListener('click', function() {
        var isExpanded = this.getAttribute('aria-expanded') === 'true';
        var answer = this.nextElementSibling;

        // Close all other FAQ items
        faqItems.forEach(function(otherButton) {
          if (otherButton !== button) {
            otherButton.setAttribute('aria-expanded', 'false');
            otherButton.nextElementSibling.classList.remove('is-open');
          }
        });

        // Toggle current item
        this.setAttribute('aria-expanded', !isExpanded);

        if (!isExpanded) {
          answer.classList.add('is-open');
        } else {
          answer.classList.remove('is-open');
        }
      });
    });
  }

  /**
   * Initialize smooth scroll for anchor links
   */
  function initSmoothScroll() {
    var anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        var href = this.getAttribute('href');

        if (href === '#') {
          e.preventDefault();
          return;
        }

        var target = document.querySelector(href);

        if (target) {
          e.preventDefault();
          var headerHeight = document.querySelector('.header').offsetHeight;
          var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /**
   * Initialize mobile menu
   */
  function initMobileMenu() {
    var menuBtn = document.querySelector('.header__menu-btn');
    var nav = document.querySelector('.header__nav');

    if (!menuBtn || !nav) return;

    menuBtn.addEventListener('click', function() {
      var isOpen = nav.classList.contains('is-open');

      if (isOpen) {
        nav.classList.remove('is-open');
        menuBtn.classList.remove('is-active');
      } else {
        nav.classList.add('is-open');
        menuBtn.classList.add('is-active');
      }
    });

    // Close menu on nav link click
    var navLinks = nav.querySelectorAll('a');
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        nav.classList.remove('is-open');
        menuBtn.classList.remove('is-active');
      });
    });
  }

  /**
   * Initialize header scroll behavior
   */
  function initHeaderScroll() {
    var header = document.querySelector('.header');
    var lastScrollY = 0;

    window.addEventListener('scroll', function() {
      var currentScrollY = window.pageYOffset;

      if (currentScrollY > 100) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }

      lastScrollY = currentScrollY;
    }, { passive: true });
  }

  /**
   * Initialize form validation
   */
  function initFormValidation() {
    var form = document.getElementById('contact-form');

    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var isValid = validateForm(form);

      if (isValid) {
        submitForm(form);
      }
    });

    // Add input event listeners for real-time validation
    var inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(function(input) {
      input.addEventListener('blur', function() {
        validateField(this);
      });

      input.addEventListener('input', function() {
        if (this.classList.contains('is-invalid')) {
          validateField(this);
        }
      });
    });
  }

  /**
   * Validate a single form field
   */
  function validateField(field) {
    var isValid = true;
    var errorMessage = '';

    // Remove existing error state
    field.classList.remove('is-invalid');
    var existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    // Required field validation
    if (field.hasAttribute('required') && !field.value.trim()) {
      isValid = false;
      errorMessage = 'この項目は必須です';
    }

    // Email validation
    if (field.type === 'email' && field.value.trim()) {
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        isValid = false;
        errorMessage = '有効なメールアドレスを入力してください';
      }
    }

    // Phone validation
    if (field.type === 'tel' && field.value.trim()) {
      var phoneRegex = /^[0-9\-+\s()]+$/;
      if (!phoneRegex.test(field.value)) {
        isValid = false;
        errorMessage = '有効な電話番号を入力してください';
      }
    }

    // Show error if invalid
    if (!isValid) {
      field.classList.add('is-invalid');
      var errorEl = document.createElement('span');
      errorEl.className = 'error-message';
      errorEl.textContent = errorMessage;
      field.parentNode.appendChild(errorEl);
    }

    return isValid;
  }

  /**
   * Validate entire form
   */
  function validateForm(form) {
    var isValid = true;
    var requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(function(field) {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Submit form (mock submission)
   */
  function submitForm(form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    var originalText = submitBtn.textContent;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';

    // Simulate API call
    setTimeout(function() {
      // Show success message
      submitBtn.textContent = '送信完了';
      submitBtn.classList.add('btn--success');

      // Reset form
      setTimeout(function() {
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        submitBtn.classList.remove('btn--success');

        // Show thank you message
        showNotification('お問い合わせありがとうございます。24時間以内にご連絡いたします。');
      }, 2000);
    }, 1500);
  }

  /**
   * Show notification
   */
  function showNotification(message) {
    var notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(function() {
      notification.classList.add('is-visible');
    }, 10);

    // Remove after delay
    setTimeout(function() {
      notification.classList.remove('is-visible');
      setTimeout(function() {
        notification.remove();
      }, 300);
    }, 4000);
  }

  /**
   * Add notification styles
   */
  function addNotificationStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.notification {',
      '  position: fixed;',
      '  top: 100px;',
      '  left: 50%;',
      '  transform: translateX(-50%) translateY(-20px);',
      '  background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%);',
      '  color: #1A1A1A;',
      '  padding: 1rem 2rem;',
      '  border-radius: 8px;',
      '  font-weight: 600;',
      '  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);',
      '  opacity: 0;',
      '  transition: opacity 0.3s, transform 0.3s;',
      '  z-index: 9999;',
      '}',
      '.notification.is-visible {',
      '  opacity: 1;',
      '  transform: translateX(-50%) translateY(0);',
      '}',
      '.form-group input.is-invalid,',
      '.form-group textarea.is-invalid {',
      '  border-color: #ff6b6b;',
      '}',
      '.error-message {',
      '  display: block;',
      '  margin-top: 0.5rem;',
      '  font-size: 0.75rem;',
      '  color: #ff6b6b;',
      '}',
      '.btn--success {',
      '  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%) !important;',
      '}',
      '.header__nav.is-open {',
      '  display: flex;',
      '  position: absolute;',
      '  top: 100%;',
      '  left: 0;',
      '  right: 0;',
      '  flex-direction: column;',
      '  padding: 1rem;',
      '  background: rgba(13, 13, 13, 0.98);',
      '  border-top: 1px solid rgba(212, 175, 55, 0.1);',
      '}',
      '@media (max-width: 768px) {',
      '  .header__nav.is-open .header__nav-link,',
      '  .header__nav.is-open .header__nav-cta {',
      '    padding: 0.75rem;',
      '    text-align: center;',
      '  }',
      '}',
      '.header__menu-btn.is-active span:nth-child(1) {',
      '  transform: rotate(45deg) translate(5px, 5px);',
      '}',
      '.header__menu-btn.is-active span:nth-child(2) {',
      '  opacity: 0;',
      '}',
      '.header__menu-btn.is-active span:nth-child(3) {',
      '  transform: rotate(-45deg) translate(5px, -5px);',
      '}'
    ].join('\n');

    document.head.appendChild(style);
  }

  /**
   * Initialize all modules
   */
  function init() {
    addNotificationStyles();
    initScrollAnimations();
    initCounterAnimations();
    initFAQ();
    initSmoothScroll();
    initMobileMenu();
    initHeaderScroll();
    initFormValidation();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
