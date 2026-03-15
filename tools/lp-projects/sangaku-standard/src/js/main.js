/**
 * SANGAKU BEER - Main JavaScript
 * Standard tier LP with age verification and animations
 */

(function() {
  'use strict';

  // ==========================================================================
  // Age Gate
  // ==========================================================================
  const AgeGate = {
    STORAGE_KEY: 'sangaku_age_verified',
    modal: null,
    yesBtn: null,
    noBtn: null,

    init: function() {
      this.modal = document.getElementById('age-gate');
      this.yesBtn = document.getElementById('age-yes');
      this.noBtn = document.getElementById('age-no');

      if (!this.modal) return;

      // Check if already verified
      if (this.isVerified()) {
        this.hide();
        return;
      }

      this.show();
      this.bindEvents();
    },

    isVerified: function() {
      try {
        return sessionStorage.getItem(this.STORAGE_KEY) === 'true';
      } catch (e) {
        return false;
      }
    },

    setVerified: function() {
      try {
        sessionStorage.setItem(this.STORAGE_KEY, 'true');
      } catch (e) {
        // SessionStorage not available
      }
    },

    show: function() {
      this.modal.classList.remove('hidden');
      document.body.classList.add('no-scroll');
      this.modal.setAttribute('aria-hidden', 'false');

      // Focus on yes button for accessibility
      if (this.yesBtn) {
        this.yesBtn.focus();
      }
    },

    hide: function() {
      this.modal.classList.add('hidden');
      document.body.classList.remove('no-scroll');
      this.modal.setAttribute('aria-hidden', 'true');
    },

    handleYes: function() {
      this.setVerified();
      this.hide();
    },

    handleNo: function() {
      // Redirect to a safe page (e.g., Google)
      window.location.href = 'https://www.google.com';
    },

    bindEvents: function() {
      var self = this;

      if (this.yesBtn) {
        this.yesBtn.addEventListener('click', function() {
          self.handleYes();
        });
      }

      if (this.noBtn) {
        this.noBtn.addEventListener('click', function() {
          self.handleNo();
        });
      }

      // Prevent closing with escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !self.isVerified()) {
          e.preventDefault();
        }
      });
    }
  };

  // ==========================================================================
  // Header Scroll Effect
  // ==========================================================================
  const Header = {
    header: null,
    scrollThreshold: 100,

    init: function() {
      this.header = document.getElementById('header');
      if (!this.header) return;

      this.bindEvents();
      this.checkScroll();
    },

    checkScroll: function() {
      if (window.scrollY > this.scrollThreshold) {
        this.header.classList.add('scrolled');
      } else {
        this.header.classList.remove('scrolled');
      }
    },

    bindEvents: function() {
      var self = this;
      var ticking = false;

      window.addEventListener('scroll', function() {
        if (!ticking) {
          window.requestAnimationFrame(function() {
            self.checkScroll();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  };

  // ==========================================================================
  // Mobile Navigation
  // ==========================================================================
  const MobileNav = {
    menuBtn: null,
    nav: null,

    init: function() {
      this.menuBtn = document.getElementById('menu-btn');
      this.nav = document.getElementById('nav');

      if (!this.menuBtn || !this.nav) return;

      this.bindEvents();
    },

    toggle: function() {
      var isActive = this.menuBtn.classList.toggle('active');
      this.nav.classList.toggle('active');
      document.body.classList.toggle('no-scroll', isActive);

      // Update aria attributes
      this.menuBtn.setAttribute('aria-expanded', isActive);
      this.menuBtn.setAttribute('aria-label', isActive ? 'メニューを閉じる' : 'メニューを開く');
    },

    close: function() {
      this.menuBtn.classList.remove('active');
      this.nav.classList.remove('active');
      document.body.classList.remove('no-scroll');
      this.menuBtn.setAttribute('aria-expanded', 'false');
      this.menuBtn.setAttribute('aria-label', 'メニューを開く');
    },

    bindEvents: function() {
      var self = this;

      this.menuBtn.addEventListener('click', function() {
        self.toggle();
      });

      // Close menu when clicking nav links
      var navLinks = this.nav.querySelectorAll('a');
      navLinks.forEach(function(link) {
        link.addEventListener('click', function() {
          self.close();
        });
      });

      // Close menu on resize
      window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
          self.close();
        }
      });
    }
  };

  // ==========================================================================
  // Scroll Animations
  // ==========================================================================
  const ScrollAnimations = {
    elements: [],
    observer: null,

    init: function() {
      this.elements = document.querySelectorAll('.animate-on-scroll');
      if (this.elements.length === 0) return;

      // Check for reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.showAll();
        return;
      }

      this.createObserver();
      this.observeElements();
    },

    createObserver: function() {
      var self = this;
      var options = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.15
      };

      this.observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            self.animateElement(entry.target);
            self.observer.unobserve(entry.target);
          }
        });
      }, options);
    },

    observeElements: function() {
      var self = this;
      this.elements.forEach(function(el) {
        self.observer.observe(el);
      });
    },

    animateElement: function(element) {
      // Add delay for staggered animations in grid layouts
      var parent = element.parentElement;
      if (parent) {
        var siblings = parent.querySelectorAll('.animate-on-scroll');
        var index = Array.prototype.indexOf.call(siblings, element);
        if (index > 0) {
          element.style.transitionDelay = (index * 0.1) + 's';
        }
      }
      element.classList.add('animated');
    },

    showAll: function() {
      this.elements.forEach(function(el) {
        el.classList.add('animated');
      });
    }
  };

  // ==========================================================================
  // Smooth Scroll
  // ==========================================================================
  const SmoothScroll = {
    init: function() {
      this.bindEvents();
    },

    scrollTo: function(target) {
      var element = document.querySelector(target);
      if (!element) return;

      var headerHeight = document.getElementById('header').offsetHeight;
      var elementPosition = element.getBoundingClientRect().top + window.scrollY;
      var offsetPosition = elementPosition - headerHeight - 20;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    },

    bindEvents: function() {
      var self = this;

      document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
          var href = this.getAttribute('href');
          if (href === '#') return;

          e.preventDefault();
          self.scrollTo(href);
        });
      });
    }
  };

  // ==========================================================================
  // Counter Animation
  // ==========================================================================
  const CounterAnimation = {
    counters: [],

    init: function() {
      this.counters = document.querySelectorAll('[data-count]');
      if (this.counters.length === 0) return;

      this.observeCounters();
    },

    animateCounter: function(element) {
      var target = parseInt(element.getAttribute('data-count'), 10);
      var duration = 2000;
      var startTime = null;
      var current = 0;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);

        // Ease out quart
        var easeProgress = 1 - Math.pow(1 - progress, 4);
        current = Math.floor(easeProgress * target);

        element.textContent = current.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    },

    observeCounters: function() {
      var self = this;
      var options = {
        threshold: 0.5
      };

      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            self.animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, options);

      this.counters.forEach(function(counter) {
        observer.observe(counter);
      });
    }
  };

  // ==========================================================================
  // Parallax Effect (for hero background)
  // ==========================================================================
  const Parallax = {
    hero: null,
    heroImage: null,

    init: function() {
      this.hero = document.getElementById('hero');
      if (!this.hero) return;

      this.heroImage = this.hero.querySelector('.hero__bg-image');
      if (!this.heroImage) return;

      // Check for reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      this.bindEvents();
    },

    update: function() {
      var scrolled = window.scrollY;
      var heroHeight = this.hero.offsetHeight;

      if (scrolled < heroHeight) {
        var parallaxValue = scrolled * 0.4;
        this.heroImage.style.transform = 'translateY(' + parallaxValue + 'px) scale(1.1)';
      }
    },

    bindEvents: function() {
      var self = this;
      var ticking = false;

      window.addEventListener('scroll', function() {
        if (!ticking) {
          window.requestAnimationFrame(function() {
            self.update();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  };

  // ==========================================================================
  // Initialize
  // ==========================================================================
  function init() {
    AgeGate.init();
    Header.init();
    MobileNav.init();
    ScrollAnimations.init();
    SmoothScroll.init();
    CounterAnimation.init();
    Parallax.init();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
