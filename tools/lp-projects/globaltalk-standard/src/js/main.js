/**
 * Global Talk - Online English School LP
 * Main JavaScript
 */

(function () {
  'use strict';

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Debounce function to limit function execution rate
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Debounced function
   */
  function debounce(func, wait) {
    var timeout;
    return function executedFunction() {
      var context = this;
      var args = arguments;
      var later = function () {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ==========================================================================
  // Scroll Animation
  // ==========================================================================

  function initScrollAnimation() {
    var animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (animatedElements.length === 0) return;

    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all elements
      animatedElements.forEach(function (el) {
        el.classList.add('animated');
      });
      return;
    }

    var observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.15
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ==========================================================================
  // Smooth Scroll
  // ==========================================================================

  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
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

  // ==========================================================================
  // Mobile Menu
  // ==========================================================================

  function initMobileMenu() {
    var menuBtn = document.querySelector('.header__menu-btn');
    var nav = document.querySelector('.header__nav');
    var header = document.querySelector('.header');

    if (!menuBtn || !nav) return;

    menuBtn.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      menuBtn.classList.toggle('is-active', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen);

      // Add mobile menu styles dynamically
      if (isOpen) {
        nav.style.display = 'flex';
        nav.style.flexDirection = 'column';
        nav.style.position = 'absolute';
        nav.style.top = '100%';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.backgroundColor = 'white';
        nav.style.padding = '1rem';
        nav.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        nav.style.gap = '1rem';
      } else {
        nav.style.display = '';
        nav.style.flexDirection = '';
        nav.style.position = '';
        nav.style.top = '';
        nav.style.left = '';
        nav.style.right = '';
        nav.style.backgroundColor = '';
        nav.style.padding = '';
        nav.style.boxShadow = '';
        nav.style.gap = '';
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target) && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        menuBtn.classList.remove('is-active');
        menuBtn.setAttribute('aria-expanded', false);
        nav.style.display = '';
      }
    });
  }

  // ==========================================================================
  // Header Scroll Effect
  // ==========================================================================

  function initHeaderScroll() {
    var header = document.querySelector('.header');

    if (!header) return;

    var lastScroll = 0;
    var scrollThreshold = 100;

    var handleScroll = debounce(function () {
      var currentScroll = window.pageYOffset;

      if (currentScroll > scrollThreshold) {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
      } else {
        header.style.boxShadow = '';
      }

      lastScroll = currentScroll;
    }, 10);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // ==========================================================================
  // FAQ Accordion
  // ==========================================================================

  function initFaqAccordion() {
    var faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(function (item) {
      var question = item.querySelector('.faq-item__question');
      var answer = item.querySelector('.faq-item__answer');

      if (!question || !answer) return;

      question.addEventListener('click', function () {
        var isExpanded = question.getAttribute('aria-expanded') === 'true';

        // Close all other items
        faqItems.forEach(function (otherItem) {
          if (otherItem !== item) {
            var otherQuestion = otherItem.querySelector('.faq-item__question');
            var otherAnswer = otherItem.querySelector('.faq-item__answer');

            if (otherQuestion && otherAnswer) {
              otherQuestion.setAttribute('aria-expanded', 'false');
              otherItem.classList.remove('active');
            }
          }
        });

        // Toggle current item
        question.setAttribute('aria-expanded', !isExpanded);
        item.classList.toggle('active', !isExpanded);
      });
    });
  }

  // ==========================================================================
  // Counter Animation
  // ==========================================================================

  function initCounterAnimation() {
    var counters = document.querySelectorAll('[data-count]');

    if (counters.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      counters.forEach(function (counter) {
        counter.textContent = parseInt(counter.getAttribute('data-count'), 10).toLocaleString();
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (counter) {
      observer.observe(counter);
    });
  }

  function animateCounter(element) {
    var target = parseInt(element.getAttribute('data-count'), 10);
    var duration = 2000;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easeOutQuart = 1 - Math.pow(1 - progress, 4);
      var current = Math.floor(easeOutQuart * target);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // ==========================================================================
  // Form Handling
  // ==========================================================================

  function initFormHandling() {
    var form = document.getElementById('trial-form');

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Gather form data
      var formData = new FormData(form);
      var data = {};
      formData.forEach(function (value, key) {
        data[key] = value;
      });

      // Validate required fields
      var name = data.name || '';
      var email = data.email || '';
      var privacy = form.querySelector('#privacy').checked;

      if (!name.trim()) {
        showFormError('お名前を入力してください');
        return;
      }

      if (!email.trim() || !isValidEmail(email)) {
        showFormError('有効なメールアドレスを入力してください');
        return;
      }

      if (!privacy) {
        showFormError('プライバシーポリシーに同意してください');
        return;
      }

      // Show success message (in production, send to server)
      showFormSuccess();
      form.reset();
    });
  }

  function isValidEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function showFormError(message) {
    // Remove existing error
    var existingError = document.querySelector('.form-error');
    if (existingError) {
      existingError.remove();
    }

    var errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.style.cssText = 'padding: 0.75rem 1rem; background-color: #FEE2E2; color: #DC2626; border-radius: 0.5rem; margin-bottom: 1rem; font-size: 0.875rem;';
    errorDiv.textContent = message;

    var form = document.getElementById('trial-form');
    form.insertBefore(errorDiv, form.firstChild);

    setTimeout(function () {
      errorDiv.remove();
    }, 5000);
  }

  function showFormSuccess() {
    var form = document.getElementById('trial-form');
    var wrapper = form.parentElement;

    // Replace form with success message
    wrapper.innerHTML = '<div class="form-success" style="text-align: center; padding: 2rem;">' +
      '<div style="width: 64px; height: 64px; background-color: #10B981; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">' +
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
      '</div>' +
      '<h3 style="font-size: 1.25rem; font-weight: 700; color: #1E3A5F; margin-bottom: 0.5rem;">お申し込みありがとうございます</h3>' +
      '<p style="color: #6B7280;">2営業日以内に担当者よりご連絡いたします。</p>' +
      '</div>';
  }

  // ==========================================================================
  // Initialize All Functions
  // ==========================================================================

  function init() {
    initScrollAnimation();
    initSmoothScroll();
    initMobileMenu();
    initHeaderScroll();
    initFaqAccordion();
    initCounterAnimation();
    initFormHandling();
  }

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
