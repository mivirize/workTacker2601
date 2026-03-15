/**
 * Pawsome Stay - Premium Pet Hotel LP
 * Main JavaScript
 */

(function() {
  'use strict';

  // ========================================
  // Configuration
  // ========================================
  const CONFIG = {
    loadingDuration: 2500,
    scrollOffset: 70,
    animationThreshold: 0.15,
    counterDuration: 2000,
    sliderAutoplayInterval: 5000
  };

  // ========================================
  // DOM Elements
  // ========================================
  const DOM = {
    loading: document.getElementById('loading'),
    nav: document.getElementById('nav'),
    navToggle: document.getElementById('nav-toggle'),
    mobileMenu: document.getElementById('mobile-menu'),
    heroCta: document.getElementById('hero-cta'),
    finalCtaBtn: document.getElementById('final-cta-btn'),
    reservationModal: document.getElementById('reservation-modal'),
    reservationForm: document.getElementById('reservation-form')
  };

  // ========================================
  // State
  // ========================================
  const state = {
    lastScrollY: 0,
    isNavVisible: false,
    isAtTop: true,
    currentTestimonialIndex: 0,
    testimonialAutoplay: null
  };

  // ========================================
  // Utilities
  // ========================================
  const utils = {
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    throttle(func, limit) {
      let inThrottle;
      return function executedFunction(...args) {
        if (!inThrottle) {
          func(...args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }
  };

  // ========================================
  // Loading Screen
  // ========================================
  function initLoading() {
    document.body.classList.add('loading');

    setTimeout(() => {
      if (DOM.loading) {
        DOM.loading.classList.add('hidden');
        document.body.classList.remove('loading');

        // Trigger initial animations
        setTimeout(() => {
          if (DOM.nav) {
            DOM.nav.classList.add('visible', 'at-top');
          }
          initScrollAnimations();
          initCounters();
        }, 300);
      }
    }, CONFIG.loadingDuration);
  }

  // ========================================
  // Navigation
  // ========================================
  function initNavigation() {
    // Mobile menu toggle
    if (DOM.navToggle) {
      DOM.navToggle.addEventListener('click', toggleMobileMenu);
    }

    // Close mobile menu on link click
    if (DOM.mobileMenu) {
      const links = DOM.mobileMenu.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', () => {
          toggleMobileMenu();
        });
      });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleAnchorClick);
    });

    // Scroll handler
    window.addEventListener('scroll', utils.throttle(handleScroll, 100), { passive: true });
  }

  function toggleMobileMenu() {
    if (DOM.navToggle && DOM.mobileMenu) {
      DOM.navToggle.classList.toggle('active');
      DOM.mobileMenu.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    }
  }

  function handleAnchorClick(e) {
    const href = e.currentTarget.getAttribute('href');
    if (href === '#') {
      e.preventDefault();
      return;
    }

    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const offsetTop = target.offsetTop - CONFIG.scrollOffset;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  }

  function handleScroll() {
    const currentScrollY = window.scrollY;
    const isScrollingDown = currentScrollY > state.lastScrollY;

    // Show/hide navigation
    if (DOM.nav) {
      if (currentScrollY > 100) {
        DOM.nav.classList.remove('at-top');
        if (isScrollingDown && currentScrollY > 300) {
          DOM.nav.classList.remove('visible');
        } else {
          DOM.nav.classList.add('visible');
        }
      } else {
        DOM.nav.classList.add('at-top', 'visible');
      }
    }

    state.lastScrollY = currentScrollY;
  }

  // ========================================
  // Scroll Animations
  // ========================================
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('animated');
          }, parseInt(delay));
        }
      });
    }, {
      threshold: CONFIG.animationThreshold,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
  }

  // ========================================
  // Counter Animation
  // ========================================
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');

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
    const target = parseInt(element.dataset.count);
    const duration = CONFIG.counterDuration;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = utils.easeOutQuart(progress);
      element.textContent = Math.floor(eased * target).toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // ========================================
  // Service Tabs
  // ========================================
  function initServiceTabs() {
    const tabs = document.querySelectorAll('.service-tab');
    const panels = document.querySelectorAll('.service-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const service = tab.dataset.service;

        // Update tabs
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update panels
        panels.forEach(panel => {
          panel.classList.remove('active');
          if (panel.id === `panel-${service}`) {
            panel.classList.add('active');
          }
        });
      });
    });
  }

  // ========================================
  // Room Explorer
  // ========================================
  function initRoomExplorer() {
    const navButtons = document.querySelectorAll('.room-nav-btn');
    const roomViews = document.querySelectorAll('.room-view');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const room = btn.dataset.room;

        // Update navigation
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update room views
        roomViews.forEach(view => {
          view.classList.remove('active');
          if (view.id === `room-${room}`) {
            view.classList.add('active');
          }
        });
      });
    });

    // 360 view button (placeholder)
    const view360Btns = document.querySelectorAll('.room-360-btn');
    view360Btns.forEach(btn => {
      btn.addEventListener('click', () => {
        alert('360\u00B0ビューは準備中です。お楽しみに！');
      });
    });
  }

  // ========================================
  // Testimonials Slider
  // ========================================
  function initTestimonials() {
    const track = document.querySelector('.testimonial-track');
    const cards = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.testimonial-prev');
    const nextBtn = document.querySelector('.testimonial-next');
    const dotsContainer = document.querySelector('.testimonial-dots');

    if (!track || cards.length === 0) return;

    const totalSlides = cards.length;
    let slidesPerView = getSlidesPerView();

    // Create dots
    for (let i = 0; i < Math.ceil(totalSlides / slidesPerView); i++) {
      const dot = document.createElement('span');
      dot.classList.add('dot');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }

    function getSlidesPerView() {
      if (window.innerWidth < 768) return 1;
      if (window.innerWidth < 1024) return 2;
      return 3;
    }

    function goToSlide(index) {
      state.currentTestimonialIndex = index;
      const slideWidth = cards[0].offsetWidth + 32; // Include gap
      track.style.transform = `translateX(-${index * slideWidth * slidesPerView}px)`;

      // Update dots
      const dots = dotsContainer.querySelectorAll('.dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
    }

    function nextSlide() {
      const maxIndex = Math.ceil(totalSlides / slidesPerView) - 1;
      const newIndex = state.currentTestimonialIndex >= maxIndex ? 0 : state.currentTestimonialIndex + 1;
      goToSlide(newIndex);
    }

    function prevSlide() {
      const maxIndex = Math.ceil(totalSlides / slidesPerView) - 1;
      const newIndex = state.currentTestimonialIndex <= 0 ? maxIndex : state.currentTestimonialIndex - 1;
      goToSlide(newIndex);
    }

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    // Autoplay
    state.testimonialAutoplay = setInterval(nextSlide, CONFIG.sliderAutoplayInterval);

    // Pause on hover
    track.addEventListener('mouseenter', () => {
      clearInterval(state.testimonialAutoplay);
    });

    track.addEventListener('mouseleave', () => {
      state.testimonialAutoplay = setInterval(nextSlide, CONFIG.sliderAutoplayInterval);
    });

    // Handle resize
    window.addEventListener('resize', utils.debounce(() => {
      slidesPerView = getSlidesPerView();
      goToSlide(0);
    }, 250));
  }

  // ========================================
  // Pricing Tabs
  // ========================================
  function initPricingTabs() {
    const tabs = document.querySelectorAll('.pricing-tab');
    const tables = document.querySelectorAll('.pricing-table');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const priceTab = tab.dataset.priceTab;

        // Update tabs
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update tables
        tables.forEach(table => {
          table.classList.remove('active');
          if (table.id === `price-${priceTab}`) {
            table.classList.add('active');
          }
        });
      });
    });
  }

  // ========================================
  // FAQ Accordion
  // ========================================
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');

      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all items
        faqItems.forEach(i => i.classList.remove('active'));

        // Toggle current item
        if (!isActive) {
          item.classList.add('active');
        }
      });
    });
  }

  // ========================================
  // Modal
  // ========================================
  function initModal() {
    const openButtons = [DOM.heroCta, DOM.finalCtaBtn];
    const modal = DOM.reservationModal;

    if (!modal) return;

    const overlay = modal.querySelector('.modal__overlay');
    const closeBtn = modal.querySelector('.modal__close');

    function openModal() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    openButtons.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openModal();
        });
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // Form submission
    if (DOM.reservationForm) {
      DOM.reservationForm.addEventListener('submit', handleFormSubmit);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Validate
    if (!data.name || !data.email || !data.phone || !data['pet-type']) {
      alert('\u5FC5\u9808\u9805\u76EE\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002');
      return;
    }

    // Simulate submission
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>\u9001\u4FE1\u4E2D...</span>';
    submitBtn.disabled = true;

    setTimeout(() => {
      alert('\u3054\u4E88\u7D04\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3059\uFF01\n\u62C5\u5F53\u8005\u3088\u308A\u30E1\u30FC\u30EB\u3067\u3054\u9023\u7D61\u3044\u305F\u3057\u307E\u3059\u3002');
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      e.target.reset();
      DOM.reservationModal.classList.remove('active');
      document.body.style.overflow = '';
    }, 1500);
  }

  // ========================================
  // Before/After Slider
  // ========================================
  function initBeforeAfterSlider() {
    const sliders = document.querySelectorAll('.ba-slider');

    sliders.forEach(slider => {
      const container = slider.closest('.ba-container');
      const beforeImage = container.querySelector('.ba-before');
      const handle = container.querySelector('.ba-handle');

      function updateSlider(value) {
        beforeImage.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
        handle.style.left = `${value}%`;
      }

      slider.addEventListener('input', (e) => {
        updateSlider(e.target.value);
      });

      // Initialize
      updateSlider(50);
    });
  }

  // ========================================
  // Heart Burst Effect
  // ========================================
  function initHeartBurst() {
    const ctaButtons = document.querySelectorAll('.btn--primary, .btn--accent');

    ctaButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        createHeartBurst(e.clientX, e.clientY);
      });
    });
  }

  function createHeartBurst(x, y) {
    const hearts = ['\u2764\uFE0F', '\uD83D\uDC95', '\uD83D\uDC96', '\uD83D\uDC97', '\uD83D\uDC9D'];
    const container = document.body;

    for (let i = 0; i < 8; i++) {
      const heart = document.createElement('span');
      heart.className = 'heart-burst';
      heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      heart.style.left = `${x}px`;
      heart.style.top = `${y}px`;
      heart.style.setProperty('--angle', `${(i * 45) + Math.random() * 20}deg`);

      const angle = (i * 45) * (Math.PI / 180);
      const distance = 50 + Math.random() * 50;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      heart.style.animation = 'none';
      container.appendChild(heart);

      requestAnimationFrame(() => {
        heart.style.animation = '';
        heart.style.transform = `translate(${tx}px, ${ty - 100}px) scale(0)`;
        heart.style.opacity = '0';
        heart.style.transition = 'all 1s ease-out';

        setTimeout(() => heart.remove(), 1000);
      });
    }
  }

  // ========================================
  // Scroll to Top
  // ========================================
  function initScrollToTop() {
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.className = 'scroll-top';
    scrollTopBtn.innerHTML = '\u2191';
    scrollTopBtn.setAttribute('aria-label', '\u30DA\u30FC\u30B8\u30C8\u30C3\u30D7\u3078\u623B\u308B');
    document.body.appendChild(scrollTopBtn);

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    window.addEventListener('scroll', utils.throttle(() => {
      if (window.scrollY > 500) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }, 100), { passive: true });
  }

  // ========================================
  // Play Button (Live Camera)
  // ========================================
  function initPlayButton() {
    const playBtn = document.querySelector('.play-btn');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        alert('\u30E9\u30A4\u30D6\u30AB\u30E1\u30E9\u306E\u30C7\u30E2\u306F\u6E96\u5099\u4E2D\u3067\u3059\u3002\n\u5B9F\u969B\u306E\u30B5\u30FC\u30D3\u30B9\u3067\u306F\u3001\u304A\u9810\u304B\u308A\u4E2D\u306E\u30DA\u30C3\u30C8\u306E\u69D8\u5B50\u3092\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0\u3067\u3054\u89A7\u3044\u305F\u3060\u3051\u307E\u3059\u3002');
      });
    }
  }

  // ========================================
  // Initialize
  // ========================================
  function init() {
    initLoading();
    initNavigation();
    initServiceTabs();
    initRoomExplorer();
    initTestimonials();
    initPricingTabs();
    initFAQ();
    initModal();
    initBeforeAfterSlider();
    initHeartBurst();
    initScrollToTop();
    initPlayButton();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
