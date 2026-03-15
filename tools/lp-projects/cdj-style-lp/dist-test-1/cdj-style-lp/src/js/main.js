/**
 * CDJ-3000X Style LP - Main JavaScript
 */
(function() {
  'use strict';

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Header scroll effect
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.background = window.pageYOffset > 100
        ? 'rgba(0, 0, 0, 0.95)'
        : 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)';
    }, { passive: true });
  }

  // Scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-fade-up').forEach(el => observer.observe(el));

  // Gallery hover effect
  const galleryItems = document.querySelectorAll('.gallery__item');
  galleryItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      galleryItems.forEach(other => {
        if (other !== item) other.style.opacity = '0.5';
      });
    });
    item.addEventListener('mouseleave', () => {
      galleryItems.forEach(other => other.style.opacity = '1');
    });
  });
})();
