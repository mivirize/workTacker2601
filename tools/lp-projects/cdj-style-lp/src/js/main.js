/**
 * CDJ-3000X Style LP - Main JavaScript
 * Scroll animations, parallax, counters, and interactions
 */
(function() {
  'use strict';

  // ===========================================
  // Smooth Scroll
  // ===========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') {
        e.preventDefault();
        return;
      }
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===========================================
  // Header Scroll Effect
  // ===========================================
  const header = document.getElementById('header');
  let lastScroll = 0;

  if (header) {
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      // Background change
      if (currentScroll > 100) {
        header.style.background = 'rgba(0, 0, 0, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
      } else {
        header.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)';
        header.style.backdropFilter = 'none';
      }

      // Hide/show on scroll
      if (currentScroll > lastScroll && currentScroll > 200) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }
      header.style.transition = 'transform 0.3s ease, background 0.3s ease';

      lastScroll = currentScroll;
    }, { passive: true });
  }

  // ===========================================
  // Scroll Animations (Intersection Observer)
  // ===========================================
  const animatedElements = document.querySelectorAll(
    '.animate-fade-up, .animate-fade-in, .animate-slide-left, .animate-slide-right, .animate-scale-in, .reveal-image'
  );

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.1
  };

  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Don't unobserve to allow re-animation if needed
      }
    });
  }, observerOptions);

  animatedElements.forEach(el => {
    // Skip hero elements (they animate on load)
    if (!el.closest('.hero')) {
      animationObserver.observe(el);
    }
  });

  // ===========================================
  // Parallax Effect
  // ===========================================
  const parallaxElements = document.querySelectorAll('.parallax, .hero__product');

  function updateParallax() {
    const scrollY = window.pageYOffset;

    parallaxElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const speed = parseFloat(el.dataset.parallaxSpeed) || 0.3;

      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const yPos = (rect.top - window.innerHeight / 2) * speed;
        el.style.transform = `translateY(${yPos}px)`;
      }
    });
  }

  window.addEventListener('scroll', updateParallax, { passive: true });
  updateParallax();

  // ===========================================
  // Counter Animation
  // ===========================================
  const counters = document.querySelectorAll('[data-count]');

  function animateCounter(element) {
    const target = parseInt(element.dataset.count, 10);
    const duration = parseInt(element.dataset.duration, 10) || 2000;
    const suffix = element.dataset.suffix || '';
    const prefix = element.dataset.prefix || '';
    let startTime = null;

    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const current = Math.floor(easedProgress * target);

      element.textContent = prefix + current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = prefix + target.toLocaleString() + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => counterObserver.observe(counter));

  // ===========================================
  // Gallery Hover Effect
  // ===========================================
  const galleryItems = document.querySelectorAll('.gallery__item');

  galleryItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      galleryItems.forEach(other => {
        if (other !== item) {
          other.style.opacity = '0.4';
          other.style.transform = 'scale(0.98)';
        }
      });
    });

    item.addEventListener('mouseleave', () => {
      galleryItems.forEach(other => {
        other.style.opacity = '1';
        other.style.transform = 'scale(1)';
      });
    });
  });

  // ===========================================
  // Feature Cards Stagger Animation
  // ===========================================
  const featureCards = document.querySelectorAll('.feature');

  const featureObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const content = entry.target.querySelector('.feature__content');
        const image = entry.target.querySelector('.feature__image');

        if (content) content.classList.add('is-visible');
        if (image) image.classList.add('is-visible');
      }
    });
  }, { threshold: 0.2 });

  featureCards.forEach(card => featureObserver.observe(card));

  // ===========================================
  // Button Ripple Effect
  // ===========================================
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        left: ${x}px;
        top: ${y}px;
        width: 20px;
        height: 20px;
        margin-left: -10px;
        margin-top: -10px;
        pointer-events: none;
      `;

      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Add ripple keyframes
  if (!document.getElementById('ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(20);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ===========================================
  // Magnetic Button Effect
  // ===========================================
  document.querySelectorAll('.btn--pill').forEach(btn => {
    btn.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      this.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });

    btn.addEventListener('mouseleave', function() {
      this.style.transform = 'translate(0, 0)';
    });
  });

  // ===========================================
  // Cursor Glow Effect (optional, for desktop)
  // ===========================================
  if (window.matchMedia('(pointer: fine)').matches) {
    const cursorGlow = document.createElement('div');
    cursorGlow.style.cssText = `
      position: fixed;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      transition: opacity 0.3s ease;
      opacity: 0;
    `;
    document.body.appendChild(cursorGlow);

    document.addEventListener('mousemove', (e) => {
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top = e.clientY + 'px';
      cursorGlow.style.opacity = '1';
    });

    document.addEventListener('mouseleave', () => {
      cursorGlow.style.opacity = '0';
    });
  }

  // ===========================================
  // Lazy Load Images
  // ===========================================
  const lazyImages = document.querySelectorAll('img[data-src]');

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  }, { rootMargin: '100px' });

  lazyImages.forEach(img => imageObserver.observe(img));

  // ===========================================
  // Scroll Progress Indicator
  // ===========================================
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 2px;
    background: linear-gradient(90deg, #fff, #888);
    z-index: 10001;
    transition: width 0.1s ease;
  `;
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    progressBar.style.width = scrollPercent + '%';
  }, { passive: true });

  // ===========================================
  // Initialize
  // ===========================================
  console.log('CDJ-3000X Style LP initialized');

})();
