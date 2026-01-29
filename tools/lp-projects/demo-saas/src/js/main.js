/**
 * CloudSync Pro - Rich Interactive LP
 * Main JavaScript file
 */

(function() {
  'use strict';

  // ==============================
  // Scroll Progress Bar
  // ==============================
  function initScrollProgress() {
    const progressBar = document.querySelector('.scroll-progress');
    if (!progressBar) return;

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // ==============================
  // Header Scroll State
  // ==============================
  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScrollY = 0;
    const scrollThreshold = 100;

    function updateHeader() {
      const currentScrollY = window.scrollY;

      // Add scrolled class when scrolled past threshold
      if (currentScrollY > scrollThreshold) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }

      // Hide/show header based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 300) {
        header.classList.add('header--hidden');
      } else {
        header.classList.remove('header--hidden');
      }

      lastScrollY = currentScrollY;
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  // ==============================
  // Mobile Menu
  // ==============================
  function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const body = document.body;

    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('is-active');
      mobileMenu.classList.toggle('is-open');
      body.classList.toggle('menu-open');
    });

    // Close menu when clicking on links
    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-active');
        mobileMenu.classList.remove('is-open');
        body.classList.remove('menu-open');
      });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        hamburger.classList.remove('is-active');
        mobileMenu.classList.remove('is-open');
        body.classList.remove('menu-open');
      }
    });
  }

  // ==============================
  // Scroll Animations (Intersection Observer)
  // ==============================
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    if (animatedElements.length === 0) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const delay = element.dataset.delay || 0;
          const animation = element.dataset.animation || 'fade-up';

          setTimeout(() => {
            element.classList.add('is-visible');
            element.classList.add(`animate--${animation}`);
          }, parseInt(delay));

          // Unobserve after animation
          observer.unobserve(element);
        }
      });
    }, observerOptions);

    animatedElements.forEach(element => {
      observer.observe(element);
    });
  }

  // ==============================
  // Counter Animation
  // ==============================
  function initCounterAnimation() {
    const counters = document.querySelectorAll('.counter');
    if (counters.length === 0) return;

    const observerOptions = {
      threshold: 0.5
    };

    const animateCounter = (counter) => {
      const target = parseFloat(counter.dataset.target);
      const duration = 2000;
      const start = 0;
      const startTime = performance.now();
      const isDecimal = target % 1 !== 0;
      const decimals = isDecimal ? 1 : 0;

      function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * easeOut;

        counter.textContent = current.toFixed(decimals).replace(/\.0$/, '');

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          // Format final number
          if (target >= 1000) {
            counter.textContent = target.toLocaleString();
          } else {
            counter.textContent = target.toFixed(decimals).replace(/\.0$/, '');
          }
        }
      }

      requestAnimationFrame(updateCounter);
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

  // ==============================
  // Testimonial Slider
  // ==============================
  let sliderInstance = null;

  function initTestimonialSlider() {
    const slider = document.querySelector('.testimonials__slider');
    if (!slider) return;

    const track = slider.querySelector('.testimonials__track');
    const prevBtn = slider.querySelector('.slider-btn--prev');
    const nextBtn = slider.querySelector('.slider-btn--next');
    const dotsContainer = slider.querySelector('.slider-dots');

    // Clean up previous instance
    if (sliderInstance) {
      if (sliderInstance.autoPlayTimer) {
        clearInterval(sliderInstance.autoPlayTimer);
      }
      // Remove old event listeners by cloning buttons
      if (prevBtn) {
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
      }
      if (nextBtn) {
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
      }
    }

    // Get fresh references after cleanup
    const freshPrevBtn = slider.querySelector('.slider-btn--prev');
    const freshNextBtn = slider.querySelector('.slider-btn--next');
    const cards = track.querySelectorAll('.testimonial-card');

    if (cards.length === 0) return;

    let currentIndex = 0;
    let isAnimating = false;
    const autoPlayInterval = 5000;
    let autoPlayTimer = null;

    // Clear and recreate dots
    dotsContainer.innerHTML = '';
    cards.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.classList.add('slider-dot');
      dot.setAttribute('aria-label', `Slide ${index + 1}`);
      if (index === 0) dot.classList.add('is-active');
      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.slider-dot');

    function updateSlider() {
      // Update cards visibility
      cards.forEach((card, index) => {
        card.classList.remove('is-active', 'is-prev', 'is-next');
        if (index === currentIndex) {
          card.classList.add('is-active');
        } else if (index === getPrevIndex()) {
          card.classList.add('is-prev');
        } else if (index === getNextIndex()) {
          card.classList.add('is-next');
        }
      });

      // Update dots
      dots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === currentIndex);
      });
    }

    function getPrevIndex() {
      return (currentIndex - 1 + cards.length) % cards.length;
    }

    function getNextIndex() {
      return (currentIndex + 1) % cards.length;
    }

    function goToSlide(index) {
      if (isAnimating || index === currentIndex) return;
      isAnimating = true;
      currentIndex = index;
      updateSlider();
      resetAutoPlay();
      setTimeout(() => {
        isAnimating = false;
      }, 500);
    }

    function goToPrev() {
      goToSlide(getPrevIndex());
    }

    function goToNext() {
      goToSlide(getNextIndex());
    }

    function startAutoPlay() {
      autoPlayTimer = setInterval(goToNext, autoPlayInterval);
    }

    function resetAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
      }
      startAutoPlay();
    }

    // Event listeners
    if (freshPrevBtn) freshPrevBtn.addEventListener('click', goToPrev);
    if (freshNextBtn) freshNextBtn.addEventListener('click', goToNext);

    // Touch/Swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;
      if (diff > swipeThreshold) {
        goToNext();
      } else if (diff < -swipeThreshold) {
        goToPrev();
      }
    }

    // Pause on hover
    slider.addEventListener('mouseenter', () => {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
    });

    slider.addEventListener('mouseleave', () => {
      startAutoPlay();
    });

    // Store instance for cleanup
    sliderInstance = { autoPlayTimer };

    // Initialize
    updateSlider();
    startAutoPlay();

    // Watch for DOM changes (for LP-Editor support)
    const observer = new MutationObserver((mutations) => {
      let needsReinit = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' &&
            (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
          // Check if testimonial cards were added/removed
          for (const node of [...mutation.addedNodes, ...mutation.removedNodes]) {
            if (node.nodeType === 1 &&
                (node.classList?.contains('testimonial-card') ||
                 node.querySelector?.('.testimonial-card'))) {
              needsReinit = true;
              break;
            }
          }
        }
        if (needsReinit) break;
      }
      if (needsReinit) {
        // Debounce reinit
        setTimeout(() => initTestimonialSlider(), 100);
      }
    });

    observer.observe(track, { childList: true, subtree: true });
  }

  // Expose reinit function for external use (LP-Editor)
  window.reinitTestimonialSlider = initTestimonialSlider;

  // ==============================
  // Pricing Toggle
  // ==============================
  function initPricingToggle() {
    const toggle = document.getElementById('billing-toggle');
    if (!toggle) return;

    const priceAmounts = document.querySelectorAll('.pricing-card__amount[data-monthly]');

    toggle.addEventListener('change', () => {
      const isYearly = toggle.checked;

      priceAmounts.forEach(amount => {
        const monthly = amount.dataset.monthly;
        const yearly = amount.dataset.yearly;

        // Animate the change
        amount.style.transform = 'scale(0.8)';
        amount.style.opacity = '0';

        setTimeout(() => {
          amount.textContent = isYearly ? yearly : monthly;
          amount.style.transform = 'scale(1)';
          amount.style.opacity = '1';
        }, 150);
      });
    });
  }

  // ==============================
  // FAQ Accordion
  // ==============================
  function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length === 0) return;

    faqItems.forEach(item => {
      const question = item.querySelector('.faq-item__question');
      const answer = item.querySelector('.faq-item__answer');
      const icon = item.querySelector('.faq-item__icon');

      if (!question || !answer) return;

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        // Close all other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item && otherItem.classList.contains('is-open')) {
            otherItem.classList.remove('is-open');
            const otherAnswer = otherItem.querySelector('.faq-item__answer');
            const otherIcon = otherItem.querySelector('.faq-item__icon');
            if (otherAnswer) otherAnswer.style.maxHeight = '0';
            if (otherIcon) otherIcon.textContent = '+';
          }
        });

        // Toggle current item
        item.classList.toggle('is-open');
        if (!isOpen) {
          answer.style.maxHeight = answer.scrollHeight + 'px';
          if (icon) icon.textContent = '−';
        } else {
          answer.style.maxHeight = '0';
          if (icon) icon.textContent = '+';
        }
      });
    });
  }

  // ==============================
  // Smooth Scroll for Anchor Links
  // ==============================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      });
    });
  }

  // ==============================
  // Particles Animation (Hero Background)
  // ==============================
  function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 4 + 2}px;
        height: ${Math.random() * 4 + 2}px;
        background: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: float ${Math.random() * 10 + 10}s linear infinite;
        animation-delay: -${Math.random() * 10}s;
      `;
      particlesContainer.appendChild(particle);
    }
  }

  // ==============================
  // Typing Effect (Optional)
  // ==============================
  function initTypingEffect() {
    const typingElements = document.querySelectorAll('[data-typing]');

    typingElements.forEach(element => {
      const text = element.textContent;
      element.textContent = '';
      element.style.visibility = 'visible';

      let i = 0;
      const speed = parseInt(element.dataset.typingSpeed) || 50;

      function type() {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        }
      }

      // Start typing when element is visible
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          type();
          observer.disconnect();
        }
      });

      observer.observe(element);
    });
  }

  // ==============================
  // Parallax Effect
  // ==============================
  function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    if (parallaxElements.length === 0) return;

    function updateParallax() {
      const scrollY = window.scrollY;

      parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.parallax) || 0.5;
        const yPos = -(scrollY * speed);
        element.style.transform = `translate3d(0, ${yPos}px, 0)`;
      });
    }

    window.addEventListener('scroll', updateParallax, { passive: true });
  }

  // ==============================
  // Tilt Effect on Cards (Optional)
  // ==============================
  function initTiltEffect() {
    const tiltCards = document.querySelectorAll('[data-tilt]');

    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
      });
    });
  }

  // ==============================
  // Initialize All
  // ==============================
  function init() {
    initScrollProgress();
    initHeaderScroll();
    initMobileMenu();
    initScrollAnimations();
    initCounterAnimation();
    initTestimonialSlider();
    initPricingToggle();
    initFaqAccordion();
    initSmoothScroll();
    initParticles();
    initTypingEffect();
    initParallax();
    initTiltEffect();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
