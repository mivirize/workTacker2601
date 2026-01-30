/**
 * LUNA 1st LIVE - Lunar Eclipse ～月蝕の夜に～
 * Main JavaScript with Enhanced Animations
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
  var particlesContainer = document.getElementById('particles');
  var animatedElements = document.querySelectorAll('.animate-on-scroll');

  // ============================================================
  // Splash Screen
  // ============================================================
  function initSplash() {
    if (!splash) return;

    // Show splash in all environments
    document.body.classList.add('splash-active');

    // Shorter splash time in LP-Editor environment
    var splashDuration = isLpEditor ? 1500 : 3500;

    // Hide splash after loading animation completes
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
    }, splashDuration);
  }

  // ============================================================
  // Floating Particles
  // ============================================================
  function createParticles() {
    var particleCount = 30;

    for (var i = 0; i < particleCount; i++) {
      var particle = document.createElement('div');
      particle.className = 'particle';

      // Random position
      particle.style.left = Math.random() * 100 + '%';

      // Random size
      var size = Math.random() * 4 + 2;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';

      // Random animation delay
      particle.style.animationDelay = Math.random() * 15 + 's';

      // Random animation duration
      particle.style.animationDuration = 15 + Math.random() * 10 + 's';

      // Random opacity
      particle.style.opacity = 0.3 + Math.random() * 0.5;

      particlesContainer.appendChild(particle);
    }
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
    handleScroll(); // Check initial state
  }

  // ============================================================
  // Mobile Navigation
  // ============================================================
  function initMobileNav() {
    menuBtn.addEventListener('click', function () {
      menuBtn.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.classList.toggle('nav-open');
    });

    // Close menu when clicking links
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
  // Scroll Animations (Intersection Observer)
  // ============================================================
  var observer = null;

  function initScrollAnimations() {
    // Skip in LP-Editor environment
    if (isLpEditor) {
      animatedElements.forEach(function (el) {
        el.classList.add('animated');
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      // Fallback for older browsers
      animatedElements.forEach(function (el) {
        el.classList.add('animated');
      });
      return;
    }

    // Enable scroll animation styles
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
  // Smooth Scroll for Navigation Links
  // ============================================================
  function initSmoothScroll() {
    var anchors = document.querySelectorAll('a[href^="#"]');

    anchors.forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = this.getAttribute('href');

        // Prevent default for placeholder links (href="#")
        if (href === '#') {
          e.preventDefault();
          return;
        }

        var target = document.querySelector(href);

        if (target) {
          e.preventDefault();

          // Skip smooth scroll in LP-Editor to avoid issues
          if (isLpEditor) return;

          var headerHeight = header.offsetHeight;
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
  // Parallax Effect for Hero Section
  // ============================================================
  function initParallax() {
    var fv = document.querySelector('.fv');
    var aurora = document.querySelector('.fv__aurora');
    var artist = document.querySelector('.fv__artist-img');

    if (!fv || !aurora) return;

    function handleParallax() {
      var scrolled = window.scrollY;
      var fvHeight = fv.offsetHeight;

      if (scrolled > fvHeight) return;

      var parallaxValue = scrolled * 0.3;

      if (aurora) {
        aurora.style.transform = 'translateY(' + parallaxValue + 'px)';
      }

      if (artist) {
        artist.style.transform = 'translateY(' + (-scrolled * 0.1) + 'px)';
      }
    }

    window.addEventListener('scroll', handleParallax, { passive: true });
  }

  // ============================================================
  // Mouse Trail Effect (subtle glow)
  // ============================================================
  function initMouseTrail() {
    var trailContainer = document.createElement('div');
    trailContainer.className = 'mouse-trail';
    trailContainer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998;overflow:hidden;';
    document.body.appendChild(trailContainer);

    var trails = [];
    var maxTrails = 5;

    document.addEventListener('mousemove', function (e) {
      if (splash && !splash.classList.contains('hidden')) return;

      var trail = document.createElement('div');
      trail.style.cssText = [
        'position:absolute;',
        'width:20px;',
        'height:20px;',
        'background:radial-gradient(circle,rgba(255,215,0,0.3) 0%,transparent 70%);',
        'border-radius:50%;',
        'pointer-events:none;',
        'left:' + (e.clientX - 10) + 'px;',
        'top:' + (e.clientY - 10) + 'px;',
        'transform:scale(1);',
        'opacity:1;',
        'transition:transform 0.5s ease,opacity 0.5s ease;'
      ].join('');

      trailContainer.appendChild(trail);
      trails.push(trail);

      // Fade out
      setTimeout(function () {
        trail.style.transform = 'scale(2)';
        trail.style.opacity = '0';
      }, 10);

      // Remove from DOM
      setTimeout(function () {
        if (trail.parentNode) {
          trail.parentNode.removeChild(trail);
        }
        trails.shift();
      }, 500);

      // Limit trails
      while (trails.length > maxTrails) {
        var oldTrail = trails.shift();
        if (oldTrail.parentNode) {
          oldTrail.parentNode.removeChild(oldTrail);
        }
      }
    });
  }

  // ============================================================
  // Twinkling Stars Enhancement
  // ============================================================
  function enhanceTwinkle() {
    var twinkles = document.querySelectorAll('.twinkle');

    twinkles.forEach(function (star) {
      // Randomize animation delay
      star.style.animationDelay = Math.random() * 2 + 's';
      star.style.animationDuration = 1.5 + Math.random() * 1 + 's';
    });
  }

  // ============================================================
  // Button Hover Effects
  // ============================================================
  function initButtonEffects() {
    var buttons = document.querySelectorAll('.btn');

    buttons.forEach(function (btn) {
      btn.addEventListener('mouseenter', function (e) {
        var ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        ripple.style.cssText = [
          'position:absolute;',
          'background:rgba(255,255,255,0.3);',
          'border-radius:50%;',
          'transform:scale(0);',
          'animation:ripple 0.6s ease-out;',
          'pointer-events:none;'
        ].join('');

        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height) * 2;
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';

        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.appendChild(ripple);

        setTimeout(function () {
          if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
          }
        }, 600);
      });
    });

    // Add ripple animation style
    var style = document.createElement('style');
    style.textContent = '@keyframes ripple{to{transform:scale(1);opacity:0;}}';
    document.head.appendChild(style);
  }

  // ============================================================
  // Goods Card Hover Enhancement
  // ============================================================
  function initGoodsHover() {
    var goodsItems = document.querySelectorAll('.goods__item');

    goodsItems.forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        // Add slight rotation on hover
        this.style.transform = 'translateY(-10px) rotate(' + (Math.random() * 2 - 1) + 'deg)';
      });

      item.addEventListener('mouseleave', function () {
        this.style.transform = '';
      });
    });
  }

  // ============================================================
  // Scroll Progress Indicator
  // ============================================================
  function initScrollProgress() {
    var progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.cssText = [
      'position:fixed;',
      'top:0;',
      'left:0;',
      'height:3px;',
      'background:linear-gradient(90deg,#ffd700,#c9a227);',
      'z-index:10000;',
      'transition:width 0.1s ease;',
      'box-shadow:0 0 10px rgba(255,215,0,0.5);'
    ].join('');
    document.body.appendChild(progressBar);

    function updateProgress() {
      var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      var scrolled = (window.scrollY / scrollHeight) * 100;
      progressBar.style.width = scrolled + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // ============================================================
  // Initialize Everything
  // ============================================================
  function init() {
    // Core functionality
    initSplash();
    createParticles();
    initHeaderScroll();
    initMobileNav();
    initSmoothScroll();

    // Visual enhancements
    initParallax();
    initMouseTrail();
    enhanceTwinkle();
    initButtonEffects();
    initGoodsHover();
    initScrollProgress();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
