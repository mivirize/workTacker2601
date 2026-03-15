/**
 * Global Talk Premium LP - Main JavaScript
 * Handles all interactions, animations, and dynamic features
 */

(function() {
  'use strict';

  // =====================================================
  // DOM Ready
  // =====================================================
  document.addEventListener('DOMContentLoaded', function() {
    initLoadingScreen();
    initHeader();
    initMobileMenu();
    initScrollAnimations();
    initCounterAnimations();
    initParticles();
    initPricingToggle();
    initStoriesSlider();
    initScrollProgress();
    initBackToTop();
    initSmoothScroll();
    initFormValidation();
    initAIDashboardAnimation();
  });

  // =====================================================
  // Loading Screen
  // =====================================================
  function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return;

    window.addEventListener('load', function() {
      setTimeout(function() {
        loadingScreen.classList.add('hidden');
        document.body.style.overflow = '';
      }, 2000);
    });

    // Fallback if load event already fired
    if (document.readyState === 'complete') {
      setTimeout(function() {
        loadingScreen.classList.add('hidden');
        document.body.style.overflow = '';
      }, 2000);
    }
  }

  // =====================================================
  // Header Scroll Effect
  // =====================================================
  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    let lastScroll = 0;

    function handleScroll() {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // =====================================================
  // Mobile Menu
  // =====================================================
  function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking on links
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // =====================================================
  // Scroll Animations
  // =====================================================
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    if (animatedElements.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          // Optionally unobserve after animation
          // observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(function(element) {
      observer.observe(element);
    });
  }

  // =====================================================
  // Counter Animations
  // =====================================================
  function initCounterAnimations() {
    const counters = document.querySelectorAll('.counter');
    if (counters.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    counters.forEach(function(counter) {
      observer.observe(counter);
    });
  }

  function animateCounter(element) {
    const target = parseFloat(element.getAttribute('data-target')) || 0;
    const decimals = parseInt(element.getAttribute('data-decimals')) || 0;
    const duration = 2000;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = easeOutQuart * target;

      if (decimals > 0) {
        element.textContent = current.toFixed(decimals);
      } else {
        element.textContent = Math.floor(current).toLocaleString();
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // =====================================================
  // Particles
  // =====================================================
  function initParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;

    const particleCount = 30;
    const colors = [
      'rgba(237, 137, 54, 0.3)',
      'rgba(26, 54, 93, 0.2)',
      'rgba(255, 255, 255, 0.2)'
    ];

    for (let i = 0; i < particleCount; i++) {
      createParticle(container, colors);
    }
  }

  function createParticle(container, colors) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = 4 + Math.random() * 8;
    const left = Math.random() * 100;
    const duration = 15 + Math.random() * 20;
    const delay = Math.random() * 15;
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = left + '%';
    particle.style.background = color;
    particle.style.animationDuration = duration + 's';
    particle.style.animationDelay = delay + 's';

    container.appendChild(particle);
  }

  // =====================================================
  // Pricing Toggle
  // =====================================================
  function initPricingToggle() {
    const toggle = document.getElementById('pricing-toggle');
    if (!toggle) return;

    const monthlyPrices = document.querySelectorAll('.pricing-card__amount.monthly');
    const yearlyPrices = document.querySelectorAll('.pricing-card__amount.yearly');

    toggle.addEventListener('click', function() {
      toggle.classList.toggle('active');
      const isYearly = toggle.classList.contains('active');

      monthlyPrices.forEach(function(el) {
        el.classList.toggle('hidden', isYearly);
      });

      yearlyPrices.forEach(function(el) {
        el.classList.toggle('hidden', !isYearly);
        if (isYearly) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });
    });
  }

  // =====================================================
  // Stories Slider
  // =====================================================
  function initStoriesSlider() {
    const track = document.querySelector('.stories-track');
    const cards = document.querySelectorAll('.story-card');
    const prevBtn = document.querySelector('.stories-btn--prev');
    const nextBtn = document.querySelector('.stories-btn--next');
    const dots = document.querySelectorAll('.stories-dot');

    if (!track || cards.length === 0) return;

    let currentIndex = 0;
    let cardsPerView = getCardsPerView();

    function getCardsPerView() {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }

    function updateSlider() {
      const cardWidth = cards[0].offsetWidth + 24; // Including gap
      const offset = -currentIndex * cardWidth;
      track.style.transform = 'translateX(' + offset + 'px)';

      // Update dots
      dots.forEach(function(dot, index) {
        dot.classList.toggle('active', index === currentIndex);
      });
    }

    function goToSlide(index) {
      const maxIndex = Math.max(0, cards.length - cardsPerView);
      currentIndex = Math.max(0, Math.min(index, maxIndex));
      updateSlider();
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        goToSlide(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        goToSlide(currentIndex + 1);
      });
    }

    dots.forEach(function(dot, index) {
      dot.addEventListener('click', function() {
        goToSlide(index);
      });
    });

    // Auto-play
    let autoPlayInterval = setInterval(function() {
      const maxIndex = Math.max(0, cards.length - cardsPerView);
      if (currentIndex >= maxIndex) {
        currentIndex = 0;
      } else {
        currentIndex++;
      }
      updateSlider();
    }, 5000);

    // Pause on hover
    track.addEventListener('mouseenter', function() {
      clearInterval(autoPlayInterval);
    });

    track.addEventListener('mouseleave', function() {
      autoPlayInterval = setInterval(function() {
        const maxIndex = Math.max(0, cards.length - cardsPerView);
        if (currentIndex >= maxIndex) {
          currentIndex = 0;
        } else {
          currentIndex++;
        }
        updateSlider();
      }, 5000);
    });

    // Handle resize
    window.addEventListener('resize', function() {
      cardsPerView = getCardsPerView();
      updateSlider();
    });
  }

  // =====================================================
  // Scroll Progress
  // =====================================================
  function initScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;

    function updateProgress() {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      progressBar.style.width = progress + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // =====================================================
  // Back to Top
  // =====================================================
  function initBackToTop() {
    const button = document.getElementById('back-to-top');
    if (!button) return;

    function toggleButton() {
      if (window.pageYOffset > 500) {
        button.classList.add('visible');
      } else {
        button.classList.remove('visible');
      }
    }

    window.addEventListener('scroll', toggleButton, { passive: true });

    button.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    toggleButton();
  }

  // =====================================================
  // Smooth Scroll
  // =====================================================
  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(function(link) {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') {
          e.preventDefault();
          return;
        }

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // =====================================================
  // Form Validation
  // =====================================================
  function initFormValidation() {
    const trialForm = document.getElementById('trial-form');
    const contactForm = document.getElementById('contact-form');

    if (trialForm) {
      trialForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleTrialFormSubmit(trialForm);
      });
    }

    if (contactForm) {
      contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleContactFormSubmit(contactForm);
      });
    }
  }

  function handleTrialFormSubmit(form) {
    const name = form.querySelector('#name');
    const email = form.querySelector('#email');

    if (!validateField(name) || !validateEmail(email)) {
      return;
    }

    // Simulate form submission
    const submitBtn = form.querySelector('.trial-form__submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>送信中...</span>';
    submitBtn.disabled = true;

    setTimeout(function() {
      submitBtn.innerHTML = '<span>送信完了!</span>';
      form.reset();

      setTimeout(function() {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }, 2000);
    }, 1500);
  }

  function handleContactFormSubmit(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(function(field) {
      if (field.type === 'email') {
        if (!validateEmail(field)) isValid = false;
      } else if (field.type === 'checkbox') {
        if (!field.checked) {
          isValid = false;
          field.parentElement.classList.add('error');
        } else {
          field.parentElement.classList.remove('error');
        }
      } else {
        if (!validateField(field)) isValid = false;
      }
    });

    if (!isValid) return;

    // Simulate form submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>送信中...</span>';
    submitBtn.disabled = true;

    setTimeout(function() {
      submitBtn.innerHTML = '<span>送信完了!</span>';
      form.reset();

      setTimeout(function() {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        alert('お問い合わせありがとうございます。担当者より24時間以内にご連絡いたします。');
      }, 1500);
    }, 1500);
  }

  function validateField(field) {
    if (field.value.trim() === '') {
      field.classList.add('error');
      return false;
    }
    field.classList.remove('error');
    return true;
  }

  function validateEmail(field) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(field.value.trim())) {
      field.classList.add('error');
      return false;
    }
    field.classList.remove('error');
    return true;
  }

  // =====================================================
  // AI Dashboard Animation
  // =====================================================
  function initAIDashboardAnimation() {
    const dashboard = document.querySelector('.ai-dashboard');
    if (!dashboard) return;

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateMetricBars(dashboard);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(dashboard);
  }

  function animateMetricBars(dashboard) {
    const bars = dashboard.querySelectorAll('.ai-metric__fill');
    bars.forEach(function(bar, index) {
      setTimeout(function() {
        bar.style.animationPlayState = 'running';
      }, index * 200);
    });
  }

  // =====================================================
  // Connection Lines Animation (Hero)
  // =====================================================
  function initConnectionLines() {
    const lines = document.querySelectorAll('.connection-line');
    if (lines.length === 0) return;

    lines.forEach(function(line, index) {
      line.style.animationDelay = (index * 0.5) + 's';
    });
  }

  // =====================================================
  // World Map Points Animation
  // =====================================================
  function initWorldMapAnimation() {
    const points = document.querySelectorAll('.pulse-point');
    if (points.length === 0) return;

    points.forEach(function(point, index) {
      point.style.animationDelay = (index * 0.3) + 's';
    });
  }

  // Initialize additional animations after DOM load
  document.addEventListener('DOMContentLoaded', function() {
    initConnectionLines();
    initWorldMapAnimation();
  });

})();
