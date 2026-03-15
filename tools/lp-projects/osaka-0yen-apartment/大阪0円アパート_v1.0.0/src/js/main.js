/**
 * 大阪0円アパート - Premium LP JavaScript
 */

(function() {
  'use strict';

  // ========== DOM Ready ==========
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initHeader();
    initMobileMenu();
    initScrollAnimations();
    initCounterAnimations();
    initFAQAccordion();
    initSimulator();
    initFixedCTA();
    initParticles();
    initSmoothScroll();
  }

  // ========== Header Scroll Effect ==========
  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 50) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }

      lastScroll = currentScroll;
    }, { passive: true });
  }

  // ========== Mobile Menu ==========
  function initMobileMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (!menuBtn || !mobileMenu) return;

    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('mobile-menu--open');
      menuBtn.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('mobile-menu--open') ? 'hidden' : '';
    });

    // Close menu when clicking links
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('mobile-menu--open');
        menuBtn.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ========== Scroll Animations ==========
  function initScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    if (!elements.length) return;

    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          // Trigger counter animation if this element contains counters
          const counters = entry.target.querySelectorAll('[data-count]');
          counters.forEach(counter => animateCounter(counter));
        }
      });
    }, observerOptions);

    elements.forEach(el => observer.observe(el));
  }

  // ========== Counter Animations ==========
  function initCounterAnimations() {
    // Also observe standalone counters in hero section
    const heroStats = document.querySelector('.hero__stats');
    if (!heroStats) return;

    const observerOptions = {
      threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counters = entry.target.querySelectorAll('[data-count]');
          counters.forEach(counter => animateCounter(counter));
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    observer.observe(heroStats);

    // Savings counter in comparison section
    const savingsNumber = document.querySelector('.comparison__savings-number');
    if (savingsNumber) {
      const savingsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            savingsObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      savingsObserver.observe(savingsNumber);
    }
  }

  function animateCounter(element) {
    // Get target from data-count attribute or text content
    let target = parseFloat(element.dataset.count);
    if (!target) {
      // Fallback: parse from text content (remove commas and non-numeric chars except decimal)
      const textValue = element.textContent.replace(/[^0-9.]/g, '');
      target = parseFloat(textValue);
    }

    if (!target || element.dataset.animated) return;

    element.dataset.animated = 'true';
    const duration = 2000;
    const startTime = performance.now();
    const isDecimal = target % 1 !== 0;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quart
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = target * easeOutQuart;

      if (isDecimal) {
        element.textContent = current.toFixed(1);
      } else {
        element.textContent = Math.floor(current).toLocaleString();
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        if (isDecimal) {
          element.textContent = target.toFixed(1);
        } else {
          element.textContent = Math.floor(target).toLocaleString();
        }
      }
    }

    requestAnimationFrame(update);
  }

  // ========== FAQ Accordion ==========
  function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq__item');

    faqItems.forEach(item => {
      const question = item.querySelector('.faq__question');
      const answer = item.querySelector('.faq__answer');

      if (!question || !answer) return;

      question.addEventListener('click', () => {
        const isOpen = question.getAttribute('aria-expanded') === 'true';

        // Close all other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('faq__item--open');
            otherItem.querySelector('.faq__question')?.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current item
        item.classList.toggle('faq__item--open');
        question.setAttribute('aria-expanded', !isOpen);
      });
    });
  }

  // ========== Cost Simulator ==========
  function initSimulator() {
    const slider = document.getElementById('rentSlider');
    const rentDisplay = document.getElementById('rentDisplay');
    const normalCost = document.getElementById('normalCost');
    const ourCost = document.getElementById('ourCost');
    const savingsAmount = document.getElementById('savingsAmount');

    if (!slider) return;

    function calculateCosts(rent) {
      // General real estate costs
      const normalDeposit = rent * 2; // 敷金2ヶ月
      const normalKeyMoney = rent; // 礼金1ヶ月
      const normalFee = rent * 1.1; // 仲介手数料1ヶ月+税
      const normalRent = rent; // 前家賃
      const normalGuarantee = rent * 0.5; // 保証料
      const normalInsurance = 18000; // 火災保険
      const normalKey = 16500; // 鍵交換

      const totalNormal = normalDeposit + normalKeyMoney + normalFee + normalRent + normalGuarantee + normalInsurance + normalKey;

      // Our costs (0 yen for deposit, key money, commission)
      const ourRent = rent; // 前家賃
      const ourGuarantee = rent * 0.5; // 保証料
      const ourInsurance = 15000; // 火災保険
      const ourKey = 15000; // 鍵交換

      const totalOur = ourRent + ourGuarantee + ourInsurance + ourKey;

      const savings = totalNormal - totalOur;

      return { totalNormal, totalOur, savings };
    }

    function updateDisplay() {
      const rent = parseInt(slider.value);
      const costs = calculateCosts(rent);

      if (rentDisplay) {
        rentDisplay.textContent = rent.toLocaleString();
      }
      if (normalCost) {
        normalCost.textContent = costs.totalNormal.toLocaleString() + '円';
      }
      if (ourCost) {
        ourCost.textContent = costs.totalOur.toLocaleString() + '円';
      }
      if (savingsAmount) {
        savingsAmount.textContent = costs.savings.toLocaleString() + '円';
      }
    }

    slider.addEventListener('input', updateDisplay);
    updateDisplay(); // Initial calculation
  }

  // ========== Fixed CTA ==========
  function initFixedCTA() {
    const fixedCta = document.getElementById('fixedCta');
    const hero = document.getElementById('hero');

    if (!fixedCta || !hero) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          fixedCta.classList.add('fixed-cta--visible');
        } else {
          fixedCta.classList.remove('fixed-cta--visible');
        }
      });
    }, { threshold: 0 });

    observer.observe(hero);
  }

  // ========== Particles ==========
  function initParticles() {
    createParticles('heroParticles', 30);
    createParticles('ctaParticles', 20);
  }

  function createParticles(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const colors = [
      'rgba(255, 107, 53, 0.6)',
      'rgba(246, 173, 85, 0.6)',
      'rgba(255, 255, 255, 0.3)'
    ];

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';

      const size = 4 + Math.random() * 8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const duration = 15 + Math.random() * 25;
      const delay = Math.random() * 15;

      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${left}%;
        animation: floatUp ${duration}s linear ${delay}s infinite;
      `;

      container.appendChild(particle);
    }
  }

  // ========== Smooth Scroll ==========
  function initSmoothScroll() {
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
          const headerHeight = document.getElementById('header')?.offsetHeight || 0;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

})();
