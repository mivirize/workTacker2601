/**
 * Pawsome Stay - Landing Page JavaScript
 * Standard Tier - Vanilla JS Only
 * Cute, warm interactions for pet hotel LP
 */

(function() {
  'use strict';

  /**
   * Initialize scroll animations using Intersection Observer
   */
  function initScrollAnimations() {
    var animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (!animatedElements.length) return;

    var observerOptions = {
      root: null,
      rootMargin: '0px',
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

    animatedElements.forEach(function(element) {
      observer.observe(element);
    });
  }

  /**
   * Create floating paw particle
   */
  function createPawParticle(container) {
    var paw = document.createElement('div');
    paw.className = 'paw-particle';

    var size = 15 + Math.random() * 20;
    var left = Math.random() * 100;
    var duration = 12 + Math.random() * 8;
    var delay = Math.random() * 10;

    // Paw SVG
    paw.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width: ' + size + 'px; height: ' + size + 'px; color: rgba(255, 181, 197, 0.4);"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm-4 7c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm8 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-4-12c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zM8 5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm8 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/></svg>';

    paw.style.cssText = 'left: ' + left + '%; animation-duration: ' + duration + 's; animation-delay: ' + delay + 's;';

    container.appendChild(paw);
  }

  /**
   * Initialize paw particles
   */
  function initPawParticles() {
    var container = document.getElementById('paw-particles');
    if (!container) return;

    // Create 15 paw particles
    for (var i = 0; i < 15; i++) {
      createPawParticle(container);
    }
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

          // Close mobile menu if open
          var nav = document.querySelector('.header__nav');
          var menuBtn = document.querySelector('.header__menu-btn');
          if (nav && nav.classList.contains('is-open')) {
            nav.classList.remove('is-open');
            menuBtn.classList.remove('is-active');
          }
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

    window.addEventListener('scroll', function() {
      var currentScrollY = window.pageYOffset;

      if (currentScrollY > 50) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }, { passive: true });
  }

  /**
   * Add hover effect to cards
   */
  function initCardHoverEffects() {
    var cards = document.querySelectorAll('.feature-card, .service-card, .room-card');

    cards.forEach(function(card) {
      card.addEventListener('mouseenter', function() {
        this.style.setProperty('--hover-scale', '1.02');
      });

      card.addEventListener('mouseleave', function() {
        this.style.setProperty('--hover-scale', '1');
      });
    });
  }

  /**
   * Add ripple effect to buttons
   */
  function initButtonRipple() {
    var buttons = document.querySelectorAll('.btn');

    buttons.forEach(function(button) {
      button.addEventListener('click', function(e) {
        var ripple = document.createElement('span');
        var rect = this.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        var x = e.clientX - rect.left - size / 2;
        var y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = [
          'position: absolute;',
          'width: ' + size + 'px;',
          'height: ' + size + 'px;',
          'left: ' + x + 'px;',
          'top: ' + y + 'px;',
          'background: rgba(255, 255, 255, 0.3);',
          'border-radius: 50%;',
          'transform: scale(0);',
          'animation: ripple 0.6s ease-out;',
          'pointer-events: none;'
        ].join('');

        this.appendChild(ripple);

        setTimeout(function() {
          ripple.remove();
        }, 600);
      });
    });
  }

  /**
   * Add dynamic styles
   */
  function addDynamicStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes ripple {',
      '  to { transform: scale(4); opacity: 0; }',
      '}',
      '.header__nav.is-open {',
      '  display: flex;',
      '  position: absolute;',
      '  top: 100%;',
      '  left: 0;',
      '  right: 0;',
      '  flex-direction: column;',
      '  padding: 1rem;',
      '  background: rgba(255, 251, 252, 0.98);',
      '  border-top: 1px solid rgba(255, 181, 197, 0.3);',
      '  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);',
      '}',
      '@media (max-width: 768px) {',
      '  .header__nav.is-open .header__nav-link,',
      '  .header__nav.is-open .header__nav-cta {',
      '    padding: 0.75rem;',
      '    text-align: center;',
      '    display: block;',
      '  }',
      '  .header__nav.is-open .header__nav-link::after {',
      '    display: none;',
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
   * Initialize image placeholder backgrounds
   */
  function initImagePlaceholders() {
    var images = document.querySelectorAll('img');

    images.forEach(function(img) {
      // Add loading state
      img.style.backgroundColor = 'linear-gradient(135deg, #FFD6E0 0%, #C5EDE4 100%)';

      img.addEventListener('load', function() {
        this.style.backgroundColor = 'transparent';
      });

      img.addEventListener('error', function() {
        // Keep gradient background if image fails to load
        this.style.background = 'linear-gradient(135deg, #FFD6E0 0%, #C5EDE4 100%)';
      });
    });
  }

  /**
   * Initialize pricing table hover
   */
  function initPricingTableHover() {
    var rows = document.querySelectorAll('.pricing__table tbody tr');

    rows.forEach(function(row) {
      row.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.01)';
        this.style.boxShadow = '0 4px 15px rgba(255, 181, 197, 0.2)';
      });

      row.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = 'none';
      });
    });
  }

  /**
   * Initialize all modules
   */
  function init() {
    addDynamicStyles();
    initScrollAnimations();
    initPawParticles();
    initFAQ();
    initSmoothScroll();
    initMobileMenu();
    initHeaderScroll();
    initCardHoverEffects();
    initButtonRipple();
    initImagePlaceholders();
    initPricingTableHover();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
