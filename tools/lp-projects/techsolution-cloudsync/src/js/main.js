/**
 * CloudSync Pro - Landing Page JavaScript
 */

(function() {
  'use strict';

  // FAQ Accordion
  function initFaqAccordion() {
    const faqQuestions = document.querySelectorAll('.faq__question');

    faqQuestions.forEach(function(question) {
      question.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        const answer = this.nextElementSibling;

        // Close all other FAQs
        faqQuestions.forEach(function(q) {
          if (q !== question) {
            q.setAttribute('aria-expanded', 'false');
            q.nextElementSibling.hidden = true;
          }
        });

        // Toggle current FAQ
        this.setAttribute('aria-expanded', !isExpanded);
        answer.hidden = isExpanded;
      });
    });
  }

  // Smooth Scroll for anchor links
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
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

  // Header scroll effect
  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', function() {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 100) {
        header.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
      } else {
        header.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
      }

      lastScroll = currentScroll;
    });
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    initFaqAccordion();
    initSmoothScroll();
    initHeaderScroll();
  });
})();
