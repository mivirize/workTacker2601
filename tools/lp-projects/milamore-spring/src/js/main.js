/**
 * MILAMORE Spring Blossom Collection 2026
 * Premium Landing Page JavaScript
 */

(function () {
  'use strict';

  // ============================================================
  // Environment Detection
  // ============================================================
  var isInIframe = (function() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  })();

  var isLpEditor = isInIframe || window.location.protocol === 'file:';

  // ============================================================
  // DOM Elements
  // ============================================================
  var splash = document.getElementById('splash');
  var header = document.getElementById('header');
  var menuBtn = document.getElementById('menuBtn');
  var mobileNav = document.getElementById('mobileNav');
  var sakuraContainer = document.getElementById('sakura-particles');
  var scrollProgress = document.getElementById('scroll-progress');
  var backToTop = document.getElementById('backToTop');
  var animatedElements = document.querySelectorAll('.animate-on-scroll');

  // ============================================================
  // Splash Screen
  // ============================================================
  function initSplash() {
    if (!splash) return;

    document.body.classList.add('splash-active');
    var splashDuration = isLpEditor ? 1500 : 2500;

    setTimeout(function () {
      splash.classList.add('hidden');
      document.body.classList.remove('splash-active');

      // Show all animated elements
      animatedElements.forEach(function(el) {
        el.classList.add('animated');
      });

      // Enable scroll animations only in normal browser
      if (!isLpEditor) {
        document.documentElement.classList.add('scroll-animation-enabled');
        setTimeout(function () {
          initScrollAnimations();
          checkVisibleElements();
        }, 300);
      }

      // Start sakura particles after splash
      if (!isLpEditor) {
        initSakuraParticles();
      }
    }, splashDuration);
  }

  // ============================================================
  // Sakura Particles
  // ============================================================
  function initSakuraParticles() {
    if (!sakuraContainer) return;

    var petalCount = 25;
    var colors = [
      'linear-gradient(135deg, #ffd6e0 0%, #ffb6c1 50%, #ffc0cb 100%)',
      'linear-gradient(135deg, #ffe4e9 0%, #ffc0cb 50%, #ffb6c1 100%)',
      'linear-gradient(135deg, #fff0f3 0%, #ffd6e0 50%, #ffb6c1 100%)'
    ];

    for (var i = 0; i < petalCount; i++) {
      createPetal(colors);
    }

    // Continue creating petals periodically
    setInterval(function() {
      if (document.querySelectorAll('.sakura-petal').length < petalCount) {
        createPetal(colors);
      }
    }, 2000);
  }

  function createPetal(colors) {
    var petal = document.createElement('div');
    petal.className = 'sakura-petal';

    // Random properties
    var size = 8 + Math.random() * 8;
    var left = Math.random() * 100;
    var duration = 8 + Math.random() * 12;
    var delay = Math.random() * 5;
    var color = colors[Math.floor(Math.random() * colors.length)];

    petal.style.cssText = [
      'width: ' + size + 'px',
      'height: ' + size + 'px',
      'left: ' + left + '%',
      'background: ' + color,
      'animation-duration: ' + duration + 's',
      'animation-delay: ' + delay + 's',
      'opacity: ' + (0.4 + Math.random() * 0.4)
    ].join(';');

    sakuraContainer.appendChild(petal);

    // Remove after animation
    setTimeout(function() {
      if (petal.parentNode) {
        petal.parentNode.removeChild(petal);
      }
    }, (duration + delay) * 1000);
  }

  // ============================================================
  // Header Scroll Effect
  // ============================================================
  function initHeaderScroll() {
    var scrollThreshold = 100;

    function handleScroll() {
      if (window.scrollY > scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // ============================================================
  // Mobile Navigation
  // ============================================================
  function initMobileNav() {
    if (!menuBtn || !mobileNav) return;

    menuBtn.addEventListener('click', function () {
      menuBtn.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.classList.toggle('nav-open');
    });

    var navLinks = mobileNav.querySelectorAll('.mobile-nav__link');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        menuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.classList.remove('nav-open');
      });
    });
  }

  // ============================================================
  // Scroll Animations
  // ============================================================
  var observer = null;

  function initScrollAnimations() {
    if (isLpEditor) {
      animatedElements.forEach(function (el) {
        el.classList.add('animated');
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      animatedElements.forEach(function (el) {
        el.classList.add('animated');
      });
      return;
    }

    document.documentElement.classList.add('scroll-animation-enabled');

    var options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = el.dataset.delay || 0;

          setTimeout(function () {
            el.classList.add('animated');
          }, parseInt(delay, 10));

          observer.unobserve(el);
        }
      });
    }, options);

    animatedElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  function checkVisibleElements() {
    if (!observer) return;

    animatedElements.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var windowHeight = window.innerHeight;

      if (rect.top < windowHeight * 0.85) {
        var delay = el.dataset.delay || 0;
        setTimeout(function () {
          el.classList.add('animated');
        }, parseInt(delay, 10));

        if (observer) {
          observer.unobserve(el);
        }
      }
    });
  }

  // ============================================================
  // Smooth Scroll
  // ============================================================
  function initSmoothScroll() {
    var anchors = document.querySelectorAll('a[href^="#"]');

    anchors.forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = this.getAttribute('href');

        // Prevent default for placeholder links
        if (href === '#') {
          e.preventDefault();
          return;
        }

        var target = document.querySelector(href);

        if (target) {
          e.preventDefault();

          if (isLpEditor) return;

          var headerHeight = header ? header.offsetHeight : 0;
          var targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ============================================================
  // Scroll Progress Bar
  // ============================================================
  function initScrollProgress() {
    if (!scrollProgress) return;

    function updateProgress() {
      var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      var scrolled = (window.scrollY / scrollHeight) * 100;
      scrollProgress.style.width = scrolled + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // ============================================================
  // Back to Top Button
  // ============================================================
  function initBackToTop() {
    if (!backToTop) return;

    function toggleButton() {
      if (window.scrollY > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }

    window.addEventListener('scroll', toggleButton, { passive: true });
    toggleButton();

    backToTop.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // ============================================================
  // Parallax Effect
  // ============================================================
  function initParallax() {
    var parallaxBg = document.querySelector('.parallax-banner__bg');
    if (!parallaxBg || isLpEditor) return;

    function handleParallax() {
      var scrolled = window.scrollY;
      var rect = parallaxBg.getBoundingClientRect();

      if (rect.top < window.innerHeight && rect.bottom > 0) {
        var yPos = (rect.top / window.innerHeight) * 50;
        parallaxBg.style.transform = 'translateY(' + yPos + 'px)';
      }
    }

    window.addEventListener('scroll', handleParallax, { passive: true });
  }

  // ============================================================
  // Counter Animation
  // ============================================================
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var observerOptions = {
      root: null,
      threshold: 0.5
    };

    var counterObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    counters.forEach(function(counter) {
      counterObserver.observe(counter);
    });
  }

  function animateCounter(element) {
    var target = parseInt(element.dataset.count, 10);
    var duration = 2000;
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function
      var easeOutQuart = 1 - Math.pow(1 - progress, 4);
      var current = Math.floor(easeOutQuart * target);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(step);
  }

  // ============================================================
  // Product Card Hover Effect
  // ============================================================
  function initProductHover() {
    var products = document.querySelectorAll('.product');

    products.forEach(function(product) {
      product.addEventListener('mouseenter', function() {
        this.style.zIndex = '10';
      });

      product.addEventListener('mouseleave', function() {
        this.style.zIndex = '';
      });
    });
  }

  // ============================================================
  // Form Handling
  // ============================================================
  function initForm() {
    var form = document.querySelector('.reservation__form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      // Collect form data
      var formData = new FormData(form);
      var data = {};
      formData.forEach(function(value, key) {
        data[key] = value;
      });

      // Show success message (in production, send to server)
      alert('ご予約を承りました。\n確認メールをお送りいたします。');
      form.reset();
    });
  }

  // ============================================================
  // Initialize
  // ============================================================
  function init() {
    initSplash();
    initHeaderScroll();
    initMobileNav();
    initSmoothScroll();
    initScrollProgress();
    initBackToTop();
    initParallax();
    initCounters();
    initProductHover();
    initForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
