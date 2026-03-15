/**
 * Pawsome Stay - Main JavaScript
 * Luxury Pet Hotel LP
 */

(function() {
  'use strict';

  // ============================================
  // DOM Ready
  // ============================================
  document.addEventListener('DOMContentLoaded', function() {
    initFloatingPaws();
    initHeader();
    initMobileNav();
    initScrollAnimations();
    initPricingTabs();
    initFormValidation();
    initSmoothScroll();
    initScrollProgress();

    // Add page loaded class for initial animations
    setTimeout(function() {
      document.body.classList.add('page-loaded');
    }, 100);
  });

  // ============================================
  // Floating Paw Prints
  // ============================================
  function initFloatingPaws() {
    var pawContainer = document.querySelector('.paw-container');
    if (!pawContainer) return;

    var pawCount = 8;
    for (var i = 0; i < pawCount; i++) {
      var paw = document.createElement('span');
      paw.className = 'floating-paw';
      paw.textContent = '\uD83D\uDC3E'; // Paw print emoji
      paw.style.left = (Math.random() * 100) + '%';
      paw.style.top = (Math.random() * 100) + '%';
      paw.style.animationDelay = (Math.random() * 5) + 's';
      paw.style.animationDuration = (6 + Math.random() * 4) + 's';
      paw.style.fontSize = (1 + Math.random() * 1) + 'rem';
      pawContainer.appendChild(paw);
    }
  }

  // ============================================
  // Header Scroll Effect
  // ============================================
  function initHeader() {
    var header = document.querySelector('.header');
    if (!header) return;

    var scrollThreshold = 50;

    function updateHeader() {
      if (window.scrollY > scrollThreshold) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  // ============================================
  // Mobile Navigation
  // ============================================
  function initMobileNav() {
    var menuBtn = document.querySelector('.header__menu-btn');
    var mobileNav = document.querySelector('.mobile-nav');

    if (!menuBtn || !mobileNav) return;

    menuBtn.addEventListener('click', function() {
      menuBtn.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile nav when clicking a link
    var mobileLinks = mobileNav.querySelectorAll('a');
    mobileLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        menuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Close mobile nav on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
        menuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ============================================
  // Scroll Animations (Intersection Observer)
  // ============================================
  function initScrollAnimations() {
    var animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (!animatedElements.length) return;

    var observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.15
    };

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(function(el) {
      observer.observe(el);
    });
  }

  // ============================================
  // Pricing Tabs
  // ============================================
  function initPricingTabs() {
    var tabButtons = document.querySelectorAll('.pricing-tab');
    var panels = document.querySelectorAll('.pricing-panel');

    if (!tabButtons.length || !panels.length) return;

    tabButtons.forEach(function(button) {
      button.addEventListener('click', function() {
        var targetTab = this.getAttribute('data-tab');

        // Update active tab
        tabButtons.forEach(function(btn) {
          btn.classList.remove('pricing-tab--active');
        });
        this.classList.add('pricing-tab--active');

        // Update active panel
        panels.forEach(function(panel) {
          if (panel.getAttribute('data-panel') === targetTab) {
            panel.classList.add('pricing-panel--active');
          } else {
            panel.classList.remove('pricing-panel--active');
          }
        });
      });
    });
  }

  // ============================================
  // Form Validation
  // ============================================
  function initFormValidation() {
    var form = document.querySelector('.booking-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var isValid = validateForm(form);

      if (isValid) {
        // Show success state
        showFormSuccess(form);
      }
    });

    // Real-time validation
    var inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(function(input) {
      input.addEventListener('blur', function() {
        validateField(this);
      });

      input.addEventListener('input', function() {
        if (this.parentElement.classList.contains('form-group--error')) {
          validateField(this);
        }
      });
    });
  }

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

  function validateField(field) {
    var formGroup = field.closest('.form-group');
    var value = field.value.trim();
    var isValid = true;

    // Remove existing error state
    formGroup.classList.remove('form-group--error');

    // Check if required and empty
    if (field.hasAttribute('required') && !value) {
      isValid = false;
    }

    // Email validation
    if (field.type === 'email' && value) {
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
      }
    }

    // Phone validation (Japanese format)
    if (field.type === 'tel' && value) {
      var phoneRegex = /^[0-9\-+()（）\s]+$/;
      if (!phoneRegex.test(value)) {
        isValid = false;
      }
    }

    // Checkbox validation
    if (field.type === 'checkbox' && field.hasAttribute('required')) {
      if (!field.checked) {
        isValid = false;
      }
    }

    if (!isValid) {
      formGroup.classList.add('form-group--error');
    }

    return isValid;
  }

  function showFormSuccess(form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    var originalText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.classList.add('btn--loading');
    submitBtn.innerHTML = '<span>送信中...</span>';
    submitBtn.disabled = true;

    // Simulate form submission
    setTimeout(function() {
      submitBtn.classList.remove('btn--loading');
      submitBtn.innerHTML = '<span>\u2713 送信完了！</span>';
      submitBtn.style.background = 'var(--color-secondary)';

      // Reset form after delay
      setTimeout(function() {
        form.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
        submitBtn.disabled = false;

        // Show success message
        showNotification('\u3054\u4E88\u7D04\u3092\u627F\u308A\u307E\u3057\u305F\u3002\u78BA\u8A8D\u30E1\u30FC\u30EB\u3092\u304A\u9001\u308A\u3057\u307E\u3059\u3002', 'success');
      }, 2000);
    }, 1500);
  }

  // ============================================
  // Notifications
  // ============================================
  function showNotification(message, type) {
    // Remove existing notification
    var existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }

    var notification = document.createElement('div');
    notification.className = 'notification notification--' + (type || 'info');
    notification.innerHTML = '<span>' + message + '</span>';
    notification.style.cssText = '\n      position: fixed;\n      top: 100px;\n      left: 50%;\n      transform: translateX(-50%);\n      padding: 1rem 2rem;\n      background: ' + (type === 'success' ? 'var(--color-secondary)' : 'var(--color-primary)') + ';\n      color: white;\n      border-radius: 10px;\n      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);\n      z-index: 10000;\n      animation: fadeUp 0.5s ease;\n    ';

    document.body.appendChild(notification);

    // Remove after delay
    setTimeout(function() {
      notification.style.animation = 'fadeIn 0.3s ease reverse forwards';
      setTimeout(function() {
        notification.remove();
      }, 300);
    }, 5000);
  }

  // ============================================
  // Smooth Scroll
  // ============================================
  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');

    links.forEach(function(link) {
      link.addEventListener('click', function(e) {
        var targetId = this.getAttribute('href');

        if (targetId === '#') {
          e.preventDefault();
          return;
        }

        var targetElement = document.querySelector(targetId);

        if (targetElement) {
          e.preventDefault();

          var headerHeight = document.querySelector('.header').offsetHeight;
          var targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ============================================
  // Scroll Progress Indicator
  // ============================================
  function initScrollProgress() {
    // Create progress bar
    var progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.width = '0%';
    document.body.appendChild(progressBar);

    function updateProgress() {
      var scrollTop = window.pageYOffset;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var scrollPercent = (scrollTop / docHeight) * 100;

      progressBar.style.width = scrollPercent + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // ============================================
  // Counter Animation (for trust badges if needed)
  // ============================================
  window.animateCounter = function(element, target, duration) {
    if (!element) return;

    duration = duration || 2000;
    var startTime = null;
    var startValue = 0;

    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easedProgress = easeOutQuart(progress);
      var currentValue = Math.floor(easedProgress * target);

      element.textContent = currentValue.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(step);
  };

  // ============================================
  // Parallax Effect (optional)
  // ============================================
  function initParallax() {
    var parallaxElements = document.querySelectorAll('.parallax-element');

    if (!parallaxElements.length) return;

    function updateParallax() {
      var scrollTop = window.pageYOffset;

      parallaxElements.forEach(function(el) {
        var speed = parseFloat(el.getAttribute('data-parallax-speed')) || 0.5;
        var yPos = scrollTop * speed;
        el.style.transform = 'translateY(' + yPos + 'px)';
      });
    }

    window.addEventListener('scroll', updateParallax, { passive: true });
  }

  // ============================================
  // FAQ Accordion Enhancement
  // ============================================
  document.addEventListener('click', function(e) {
    var faqQuestion = e.target.closest('.faq-item__question');
    if (!faqQuestion) return;

    var faqItem = faqQuestion.closest('.faq-item');
    var allFaqItems = document.querySelectorAll('.faq-item');

    // Close other FAQ items (optional - for accordion behavior)
    // Uncomment below for single-open accordion
    /*
    allFaqItems.forEach(function(item) {
      if (item !== faqItem && item.hasAttribute('open')) {
        item.removeAttribute('open');
      }
    });
    */
  });

  // ============================================
  // Lazy Loading Images (native support check)
  // ============================================
  if ('loading' in HTMLImageElement.prototype) {
    var lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(function(img) {
      img.src = img.dataset.src || img.src;
    });
  }

  // ============================================
  // Preload critical assets
  // ============================================
  function preloadAssets() {
    var criticalImages = [
      'images/hero-bg.jpg'
    ];

    criticalImages.forEach(function(src) {
      var link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  // Run preload
  preloadAssets();

})();
