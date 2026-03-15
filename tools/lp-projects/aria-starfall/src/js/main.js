/**
 * ARIA of STARFALL - Main JavaScript
 * Anime Special Site Template
 * Enhanced with cho-kaguyahime reference animations
 */

(function() {
  'use strict';

  // ========================================
  // Utility Functions (Phase 0)
  // ========================================

  /**
   * Throttle function - limits execution rate
   */
  function throttle(fn, wait) {
    var lastTime = 0;
    return function() {
      var now = Date.now();
      if (now - lastTime >= wait) {
        lastTime = now;
        fn.apply(this, arguments);
      }
    };
  }

  /**
   * Debounce function - delays execution until pause
   */
  function debounce(fn, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        fn.apply(context, args);
      }, wait);
    };
  }

  /**
   * LP-Editor environment detection
   */
  function isEditorEnvironment() {
    try {
      return window.self !== window.top || window.location.protocol === 'file:';
    } catch (e) {
      return true;
    }
  }

  // ========================================
  // Easing Functions (Phase 1)
  // jQuery Easing compatible
  // ========================================
  var Easing = {
    linear: function(t) {
      return t;
    },
    easeInQuad: function(t) {
      return t * t;
    },
    easeOutQuad: function(t) {
      return t * (2 - t);
    },
    easeInOutQuad: function(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    easeInCubic: function(t) {
      return t * t * t;
    },
    easeOutCubic: function(t) {
      return 1 - Math.pow(1 - t, 3);
    },
    easeInOutCubic: function(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    easeInQuart: function(t) {
      return t * t * t * t;
    },
    easeOutQuart: function(t) {
      return 1 - Math.pow(1 - t, 4);
    },
    easeInOutQuart: function(t) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    },
    easeOutBack: function(t) {
      var c1 = 1.70158;
      var c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeOutElastic: function(t) {
      var c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
  };

  // Export for global access
  window.Easing = Easing;

  // ========================================
  // Custom Smooth Scroll (Phase 1)
  // ========================================
  function smoothScrollTo(targetY, duration, easingFn) {
    duration = duration || 1000;
    easingFn = easingFn || Easing.easeOutQuart;

    var startY = window.scrollY;
    var diff = targetY - startY;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easedProgress = easingFn(progress);
      window.scrollTo(0, startY + diff * easedProgress);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // ========================================
  // DOM Ready
  // ========================================
  document.addEventListener('DOMContentLoaded', function() {
    // Add editor mode class if in LP-Editor
    if (isEditorEnvironment()) {
      document.body.classList.add('lp-editor-mode');
    }

    initLoading();
    initStarfield();
    initHeader();
    initGlobalNav();
    initScrollAnimations();
    initMovieSlider();
    initMusicSlider();
    initCharacterSelector();
    initSmoothScroll();
    initScrollSpy();
    initParallax();
    preventDefaultLinks();
  });

  // ========================================
  // Loading Screen (Phase 2 Enhanced)
  // ========================================
  function initLoading() {
    var loadingScreen = document.getElementById('loading');
    if (!loadingScreen) return;

    // Wait for fonts and page load
    var fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    var pageReady = new Promise(function(resolve) {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });

    Promise.all([fontsReady, pageReady]).then(function() {
      // Minimum display time for smooth experience
      setTimeout(function() {
        loadingScreen.classList.add('is-hidden');
        document.body.classList.remove('loading');

        // Trigger hero animations with stagger
        triggerHeroAnimations();
      }, 1500);
    });
  }

  function triggerHeroAnimations() {
    var heroElements = document.querySelectorAll('.hero .animate-fade-in');
    heroElements.forEach(function(el, index) {
      setTimeout(function() {
        el.classList.add('is-visible');
      }, 200 + (index * 300));
    });
  }

  // ========================================
  // Starfield Particles
  // ========================================
  function initStarfield() {
    var starfield = document.getElementById('starfield');
    if (!starfield) return;

    // Skip heavy particles in editor mode
    var starCount = isEditorEnvironment() ? 30 : 100;
    var fragment = document.createDocumentFragment();

    for (var i = 0; i < starCount; i++) {
      var star = document.createElement('div');
      star.className = Math.random() > 0.9 ? 'star star--large' : 'star';

      star.style.cssText = [
        'left:' + Math.random() * 100 + '%',
        'top:' + Math.random() * 100 + '%',
        '--twinkle-duration:' + (2 + Math.random() * 4) + 's',
        '--twinkle-delay:' + Math.random() * 3 + 's'
      ].join(';');

      fragment.appendChild(star);
    }

    // Add shooting stars (skip in editor mode)
    if (!isEditorEnvironment()) {
      for (var j = 0; j < 3; j++) {
        var shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        shootingStar.style.cssText = [
          'top:' + (Math.random() * 50) + '%',
          'animation-delay:' + (j * 5 + Math.random() * 5) + 's'
        ].join(';');
        fragment.appendChild(shootingStar);
      }
    }

    starfield.appendChild(fragment);
  }

  // ========================================
  // Header Scroll Effect (Phase 8 Enhanced)
  // ========================================
  function initHeader() {
    var header = document.getElementById('header');
    if (!header) return;

    var ticking = false;
    var maxScroll = 300;

    function updateHeader() {
      var scrollY = window.scrollY;
      var opacity = Math.min(scrollY / maxScroll, 1);

      // Update CSS variable for smooth opacity transition
      header.style.setProperty('--header-opacity', opacity);

      if (scrollY > 100) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }

      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  }

  // ========================================
  // Global Navigation
  // ========================================
  function initGlobalNav() {
    var menuBtn = document.getElementById('menuBtn');
    var globalNav = document.getElementById('globalNav');

    if (!menuBtn || !globalNav) return;

    menuBtn.addEventListener('click', function() {
      var isOpen = globalNav.classList.toggle('is-open');
      menuBtn.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('no-scroll', isOpen);
    });

    // Close nav on link click
    var navLinks = globalNav.querySelectorAll('.global-nav__link');
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        globalNav.classList.remove('is-open');
        menuBtn.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
      });
    });

    // Close nav on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && globalNav.classList.contains('is-open')) {
        globalNav.classList.remove('is-open');
        menuBtn.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
      }
    });
  }

  // ========================================
  // Scroll Spy (Phase 6)
  // ========================================
  function initScrollSpy() {
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.global-nav__link');

    if (sections.length === 0 || navLinks.length === 0) return;

    function updateActiveLink() {
      var scrollY = window.scrollY + 200;

      sections.forEach(function(section) {
        var sectionTop = section.offsetTop;
        var sectionHeight = section.offsetHeight;
        var sectionId = section.getAttribute('id');

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          navLinks.forEach(function(link) {
            link.classList.remove('is-active');
            if (link.getAttribute('href') === '#' + sectionId) {
              link.classList.add('is-active');
            }
          });
        }
      });
    }

    window.addEventListener('scroll', throttle(updateActiveLink, 100), { passive: true });
    updateActiveLink(); // Initial call
  }

  // ========================================
  // Scroll Animations
  // ========================================
  function initScrollAnimations() {
    var animatedElements = document.querySelectorAll(
      '.animate-fade-up, .animate-slide-left, .animate-scale-up, .section__title'
    );

    if (!animatedElements.length) return;

    // In editor mode, show all elements immediately
    if (isEditorEnvironment()) {
      animatedElements.forEach(function(el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    };

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          // Add stagger delay if specified
          var delay = entry.target.dataset.delay || 0;
          setTimeout(function() {
            entry.target.classList.add('is-visible');
          }, parseInt(delay, 10));
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(function(el) {
      observer.observe(el);
    });
  }

  // ========================================
  // Movie Slider (Phase 3 Enhanced - Crossfade)
  // ========================================
  function initMovieSlider() {
    var track = document.getElementById('movieTrack');
    var prevBtn = document.getElementById('moviePrev');
    var nextBtn = document.getElementById('movieNext');
    var dotsContainer = document.getElementById('movieDots');

    if (!track) return;

    var items = track.querySelectorAll('.movie-slider__item');
    if (items.length === 0) return;

    var currentIndex = 0;
    var isAnimating = false;

    // Create dots
    if (dotsContainer) {
      items.forEach(function(_, index) {
        var dot = document.createElement('button');
        dot.className = 'movie-slider__dot' + (index === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'スライド ' + (index + 1));
        dot.addEventListener('click', function() {
          if (!isAnimating) goToSlide(index);
        });
        dotsContainer.appendChild(dot);
      });
    }

    function goToSlide(index) {
      if (index === currentIndex || isAnimating) return;
      isAnimating = true;

      // Normalize index
      if (index < 0) index = items.length - 1;
      if (index >= items.length) index = 0;

      var prev = items[currentIndex];
      var next = items[index];

      // Crossfade animation
      prev.classList.add('fade-out');
      prev.classList.remove('active');
      next.classList.add('active');

      // Update dots
      if (dotsContainer) {
        var dots = dotsContainer.querySelectorAll('.movie-slider__dot');
        dots[currentIndex].classList.remove('active');
        dots[index].classList.add('active');
      }

      // Cleanup after animation
      setTimeout(function() {
        prev.classList.remove('fade-out');
        isAnimating = false;
      }, 600);

      currentIndex = index;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        if (!isAnimating) goToSlide(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        if (!isAnimating) goToSlide(currentIndex + 1);
      });
    }
  }

  // ========================================
  // Music Slider (Phase 3 Enhanced - Crossfade)
  // ========================================
  function initMusicSlider() {
    var track = document.getElementById('musicTrack');
    var prevBtn = document.getElementById('musicPrev');
    var nextBtn = document.getElementById('musicNext');
    var dotsContainer = document.getElementById('musicDots');

    if (!track) return;

    var items = track.querySelectorAll('.music-slider__item');
    if (items.length === 0) return;

    var currentIndex = 0;
    var isAnimating = false;

    // Create dots
    if (dotsContainer) {
      items.forEach(function(_, index) {
        var dot = document.createElement('button');
        dot.className = 'music-slider__dot' + (index === 0 ? ' active' : '');
        dot.setAttribute('aria-label', '楽曲 ' + (index + 1));
        dot.addEventListener('click', function() {
          if (!isAnimating) goToSlide(index);
        });
        dotsContainer.appendChild(dot);
      });
    }

    function goToSlide(index) {
      if (index === currentIndex || isAnimating) return;
      isAnimating = true;

      // Normalize index
      if (index < 0) index = items.length - 1;
      if (index >= items.length) index = 0;

      var prev = items[currentIndex];
      var next = items[index];

      // Crossfade animation
      prev.classList.add('fade-out');
      prev.classList.remove('active');
      next.classList.add('active');

      // Update dots
      if (dotsContainer) {
        var dots = dotsContainer.querySelectorAll('.music-slider__dot');
        dots[currentIndex].classList.remove('active');
        dots[index].classList.add('active');
      }

      // Cleanup after animation
      setTimeout(function() {
        prev.classList.remove('fade-out');
        isAnimating = false;
      }, 600);

      currentIndex = index;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        if (!isAnimating) goToSlide(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        if (!isAnimating) goToSlide(currentIndex + 1);
      });
    }
  }

  // ========================================
  // Character Selector (Phase 4 Enhanced)
  // ========================================
  function initCharacterSelector() {
    var thumbs = document.querySelectorAll('.character__thumb');
    var details = document.querySelectorAll('.character__detail');
    var prevBtn = document.getElementById('charPrev');
    var nextBtn = document.getElementById('charNext');

    if (thumbs.length === 0 || details.length === 0) return;

    var currentIndex = 0;
    var isAnimating = false;

    function showCharacter(index) {
      if (index === currentIndex || isAnimating) return;
      isAnimating = true;

      // Normalize index
      if (index < 0) index = thumbs.length - 1;
      if (index >= thumbs.length) index = 0;

      // Update thumbs with animation
      thumbs[currentIndex].classList.remove('active');
      thumbs[index].classList.add('active');

      // Update details with slide animation
      var prevDetail = details[currentIndex];
      var nextDetail = details[index];

      prevDetail.classList.add('fade-out');
      prevDetail.classList.remove('active');

      setTimeout(function() {
        nextDetail.classList.add('active');
        prevDetail.classList.remove('fade-out');
        isAnimating = false;
      }, 300);

      currentIndex = index;
    }

    // Thumbnail click
    thumbs.forEach(function(thumb, index) {
      thumb.addEventListener('click', function() {
        showCharacter(index);
      });
    });

    // Navigation buttons
    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        showCharacter(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        showCharacter(currentIndex + 1);
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      var characterSection = document.getElementById('character');
      if (!characterSection) return;

      var rect = characterSection.getBoundingClientRect();
      var isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible && !isAnimating) {
        if (e.key === 'ArrowLeft') {
          showCharacter(currentIndex - 1);
        } else if (e.key === 'ArrowRight') {
          showCharacter(currentIndex + 1);
        }
      }
    });
  }

  // ========================================
  // Smooth Scroll (Phase 1 Enhanced)
  // ========================================
  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');

    links.forEach(function(link) {
      link.addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href === '#') return;

        var target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        var headerHeight = document.getElementById('header')?.offsetHeight || 0;
        var targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

        // Use custom smooth scroll with easing
        smoothScrollTo(targetPosition, 1000, Easing.easeOutQuart);
      });
    });
  }

  // ========================================
  // Parallax Effect (Phase 9)
  // ========================================
  function initParallax() {
    var heroBg = document.querySelector('.hero__bg');
    var heroContent = document.querySelector('.hero__content');
    var hero = document.querySelector('.hero');

    if (!heroBg || !heroContent || !hero) return;

    // Skip in editor mode
    if (isEditorEnvironment()) return;

    var ticking = false;

    function updateParallax() {
      var scrollY = window.scrollY;
      var heroHeight = hero.offsetHeight;

      if (scrollY <= heroHeight) {
        var parallaxY = scrollY * 0.3;
        var contentY = scrollY * -0.1;

        heroBg.style.transform = 'translateY(' + parallaxY + 'px)';
        heroContent.style.transform = 'translateY(' + contentY + 'px)';
      }

      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  // ========================================
  // Prevent Default Links
  // ========================================
  function preventDefaultLinks() {
    var links = document.querySelectorAll('a[href="#"]');

    links.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
      });
    });
  }

  // ========================================
  // LP-Editor Compatibility
  // ========================================
  function initLPEditorCompat() {
    if (!isEditorEnvironment()) return;

    // MutationObserver for repeat blocks
    var repeatContainers = document.querySelectorAll('[data-repeat]');

    if (repeatContainers.length === 0) return;

    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Reinitialize components when repeat items change
          setTimeout(function() {
            initMovieSlider();
            initMusicSlider();
            initScrollAnimations();
          }, 100);
        }
      });
    });

    repeatContainers.forEach(function(container) {
      observer.observe(container, { childList: true });
    });
  }

  // Initialize LP-Editor compatibility
  document.addEventListener('DOMContentLoaded', initLPEditorCompat);

})();
