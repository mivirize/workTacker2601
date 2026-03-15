/**
 * VIRTUAL DIMENSION - CDJ-3000X Style
 * Minimal JavaScript for smooth interactions
 */

(function() {
  'use strict';

  // ============================================
  // Smooth Scroll
  // ============================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // ============================================
  // Header scroll effect
  // ============================================
  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 100) {
        header.style.background = 'rgba(0, 0, 0, 0.95)';
      } else {
        header.style.background = 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, transparent 100%)';
      }

      lastScroll = currentScroll;
    }, { passive: true });
  }

  // ============================================
  // Intersection Observer for animations
  // ============================================
  function initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all animated elements
    document.querySelectorAll('.animate-fade-up').forEach(el => {
      observer.observe(el);
    });
  }

  // ============================================
  // Gallery hover effect
  // ============================================
  function initGallery() {
    const items = document.querySelectorAll('.gallery__item');

    items.forEach(item => {
      item.addEventListener('mouseenter', () => {
        items.forEach(other => {
          if (other !== item) {
            other.style.opacity = '0.5';
          }
        });
      });

      item.addEventListener('mouseleave', () => {
        items.forEach(other => {
          other.style.opacity = '1';
        });
      });
    });
  }

  // ============================================
  // Initialize
  // ============================================
  function init() {
    initSmoothScroll();
    initHeader();
    initScrollAnimations();
    initGallery();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
