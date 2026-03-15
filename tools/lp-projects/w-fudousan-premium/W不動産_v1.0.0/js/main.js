/**
 * W不動産 LP - Main JavaScript
 * Premium Edition - Refactored
 */

(function() {
  'use strict';

  // ========================================
  // DOM Ready
  // ========================================
  document.addEventListener('DOMContentLoaded', function() {
    initHeroAnimations();
    initScrollAnimations();
    initFaqAccordion();
    initSmoothScroll();
    initHeaderScroll();
    initCounterAnimation();
    initMobileMenu();
  });

  // ========================================
  // Hero Animations (Immediate)
  // ========================================
  function initHeroAnimations() {
    const heroElements = document.querySelectorAll('.animate-fade-in');

    if (!heroElements.length) return;

    // Stagger animation for hero elements
    heroElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('is-visible');
      }, 100 + (index * 150));
    });
  }

  // ========================================
  // Scroll Animations
  // ========================================
  function initScrollAnimations() {
    // Select all elements with animate-on-scroll class
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (!animatedElements.length) return;

    // Intersection Observer
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
  }

  // ========================================
  // FAQ Accordion
  // ========================================
  function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
      const question = item.querySelector('.faq-item__question');

      if (question) {
        question.addEventListener('click', () => {
          // Close other items
          faqItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('is-open')) {
              otherItem.classList.remove('is-open');
            }
          });

          // Toggle current item
          item.classList.toggle('is-open');
        });
      }
    });
  }

  // ========================================
  // Smooth Scroll
  // ========================================
  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');

        if (href === '#') {
          e.preventDefault();
          return;
        }

        const target = document.querySelector(href);

        if (target) {
          e.preventDefault();

          // Close mobile menu if open
          const mobileMenu = document.getElementById('mobileMenu');
          const menuBtn = document.getElementById('menuBtn');
          if (mobileMenu && mobileMenu.classList.contains('is-open')) {
            mobileMenu.classList.remove('is-open');
            menuBtn?.classList.remove('is-open');
            menuBtn?.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll');
          }

          const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ========================================
  // Header Scroll Effect
  // ========================================
  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;

          if (scrollY > 100) {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
          } else {
            header.style.boxShadow = 'none';
          }

          ticking = false;
        });

        ticking = true;
      }
    }, { passive: true });
  }

  // ========================================
  // Counter Animation
  // ========================================
  function initCounterAnimation() {
    const counters = document.querySelectorAll('[data-count]');

    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }

  function animateCounter(element) {
    const target = parseInt(element.dataset.count, 10);
    if (!target || element.dataset.animated) return;

    element.dataset.animated = 'true';
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quart
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(easeOutQuart * target);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ========================================
  // Mobile Menu
  // ========================================
  function initMobileMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (!menuBtn || !mobileMenu) return;

    menuBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('is-open');
      menuBtn.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', isOpen);

      // Prevent body scroll when menu is open
      document.body.classList.toggle('no-scroll', isOpen);
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        mobileMenu.classList.remove('is-open');
        menuBtn.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
      }
    });
  }

})();
