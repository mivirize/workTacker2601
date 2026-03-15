/**
 * POWER FIT - Premium LP
 * Scroll Animations & Effects
 */

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initCounterAnimations();
  initChartAnimations();
  initTimelineAnimation();
  initTextReveal();
  initImageParallax();
});

/**
 * Scroll-triggered Animations
 */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.animate-on-scroll');

  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('animated');
          }, delay * 1000);

          // Optionally unobserve after animation
          // observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(el => {
      observer.observe(el);
    });
  } else {
    // Fallback for older browsers
    animatedElements.forEach(el => {
      el.classList.add('animated');
    });
  }
}

/**
 * Counter Animations
 */
function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-count]');

  if (counters.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  counters.forEach(counter => {
    observer.observe(counter);
  });
}

/**
 * Animate a single counter
 */
function animateCounter(element) {
  const target = parseFloat(element.dataset.count);
  const decimals = parseInt(element.dataset.decimals) || 0;
  const duration = parseInt(element.dataset.duration) || 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-out-quart)
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = easeOutQuart * target;

    if (decimals > 0) {
      element.textContent = current.toFixed(decimals);
    } else {
      element.textContent = Math.floor(current).toLocaleString('ja-JP');
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      if (decimals > 0) {
        element.textContent = target.toFixed(decimals);
      } else {
        element.textContent = target.toLocaleString('ja-JP');
      }
    }
  }

  requestAnimationFrame(update);
}

/**
 * Chart Bar Animations
 */
function initChartAnimations() {
  const chartBars = document.querySelectorAll('.ai-tech__chart-bar');
  const statBars = document.querySelectorAll('.stat-item__bar-fill');

  if (chartBars.length === 0 && statBars.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.3
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add delay for staggered effect
        const bars = entry.target.querySelectorAll('.ai-tech__chart-bar, .stat-item__bar-fill');
        bars.forEach((bar, index) => {
          setTimeout(() => {
            bar.classList.add('animated');
          }, index * 150);
        });

        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe parent containers
  const aiTechSection = document.querySelector('.ai-tech');
  const statsSection = document.querySelector('.stats');

  if (aiTechSection) observer.observe(aiTechSection);
  if (statsSection) observer.observe(statsSection);
}

/**
 * Timeline Animation
 */
function initTimelineAnimation() {
  const timelineFill = document.getElementById('processLineFill');
  const timelineSteps = document.querySelectorAll('.process__step');

  if (!timelineFill || timelineSteps.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Animate timeline line
        timelineFill.classList.add('animated');

        // Animate steps with stagger
        timelineSteps.forEach((step, index) => {
          setTimeout(() => {
            step.classList.add('animated');
          }, index * 300);
        });

        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const processSection = document.querySelector('.process');
  if (processSection) observer.observe(processSection);
}

/**
 * Text Reveal Animation
 */
function initTextReveal() {
  const revealElements = document.querySelectorAll('.text-reveal');

  if (revealElements.length === 0) return;

  revealElements.forEach(el => {
    const text = el.textContent;
    el.innerHTML = '';

    // Wrap each word in a span
    const words = text.split(' ');
    words.forEach((word, index) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'text-reveal__word';
      wordSpan.style.transitionDelay = `${index * 0.1}s`;

      const innerSpan = document.createElement('span');
      innerSpan.textContent = word + ' ';
      wordSpan.appendChild(innerSpan);

      el.appendChild(wordSpan);
    });
  });

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => observer.observe(el));
}

/**
 * Image Parallax Effect
 */
function initImageParallax() {
  const parallaxImages = document.querySelectorAll('.parallax-image');

  if (parallaxImages.length === 0) return;

  function updateParallax() {
    parallaxImages.forEach(img => {
      const rect = img.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rect.top < viewportHeight && rect.bottom > 0) {
        const scrollProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
        const offset = (scrollProgress - 0.5) * 50;

        img.style.transform = `translateY(${offset}px) scale(1.1)`;
      }
    });
  }

  window.addEventListener('scroll', throttle(updateParallax, 16), { passive: true });
  updateParallax();
}

/**
 * Staggered Grid Animation
 */
function animateGrid(gridSelector, itemSelector) {
  const grid = document.querySelector(gridSelector);
  if (!grid) return;

  const items = grid.querySelectorAll(itemSelector);

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        items.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add('animated');
          }, index * 100);
        });

        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  observer.observe(grid);
}

/**
 * Magnetic Elements
 */
function initMagneticElements() {
  const magneticElements = document.querySelectorAll('[data-magnetic]');

  if (magneticElements.length === 0 || window.innerWidth < 1024) return;

  magneticElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const strength = parseFloat(el.dataset.magnetic) || 0.5;

      const x = ((e.clientX - rect.left) / rect.width - 0.5) * strength * 50;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * strength * 50;

      el.style.transform = `translate(${x}px, ${y}px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
    });
  });
}

/**
 * 3D Tilt Effect
 */
function init3DTilt() {
  const tiltElements = document.querySelectorAll('[data-tilt]');

  if (tiltElements.length === 0 || window.innerWidth < 1024) return;

  tiltElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const tiltX = (y - 0.5) * 20;
      const tiltY = (x - 0.5) * -20;

      el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(20px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    });
  });
}

/**
 * Scroll Progress for Sections
 */
function initSectionProgress() {
  const sections = document.querySelectorAll('section');
  const indicators = document.querySelectorAll('.section-progress-dot');

  if (sections.length === 0 || indicators.length === 0) return;

  function updateProgress() {
    const scrollPosition = window.pageYOffset;
    const windowHeight = window.innerHeight;

    sections.forEach((section, index) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop - windowHeight / 2 &&
          scrollPosition < sectionTop + sectionHeight - windowHeight / 2) {
        indicators.forEach(i => i.classList.remove('active'));
        if (indicators[index]) {
          indicators[index].classList.add('active');
        }
      }
    });
  }

  window.addEventListener('scroll', throttle(updateProgress, 100), { passive: true });
  updateProgress();
}

/**
 * Utility: Throttle function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Split Text Animation
 */
function splitTextAnimation(element) {
  if (!element) return;

  const text = element.textContent;
  element.innerHTML = '';

  const chars = text.split('');
  chars.forEach((char, index) => {
    const span = document.createElement('span');
    span.className = 'char-animate';
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.transitionDelay = `${index * 0.03}s`;
    element.appendChild(span);
  });

  // Trigger animation
  requestAnimationFrame(() => {
    element.querySelectorAll('.char-animate').forEach(char => {
      char.classList.add('animated');
    });
  });
}

/**
 * Reveal on Scroll Direction
 */
function initDirectionalReveal() {
  let lastScrollY = window.pageYOffset;

  const elements = document.querySelectorAll('[data-reveal-direction]');

  if (elements.length === 0) return;

  window.addEventListener('scroll', throttle(() => {
    const currentScrollY = window.pageYOffset;
    const direction = currentScrollY > lastScrollY ? 'down' : 'up';

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible) {
        el.classList.add(`reveal-${direction}`);
      }
    });

    lastScrollY = currentScrollY;
  }, 100), { passive: true });
}

// Export functions for external use
window.PowerFitAnimations = {
  initScrollAnimations,
  initCounterAnimations,
  animateCounter,
  splitTextAnimation,
  animateGrid
};
