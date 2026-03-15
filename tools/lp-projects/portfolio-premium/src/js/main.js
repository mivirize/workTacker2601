/* ============================================
   Web Design Trends 2026 Showcase - Main JavaScript v2.0
   17 Modular Init Functions (IIFE)
   Reference: lp-site-patterns.md (71 sites)
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // DOM Ready
  // ============================================
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initLoader();
    initHeader();
    initMobileMenu();
    initCustomCursor();
    initMouseTrail();
    initParticles();
    initScrollAnimations();
    initCounters();
    initParallax();
    initAnimationShowcase();
    initEffectsLab();
    initColorPalettes();
    initTypographyControls();
    initSakuraEffect();
    initTrendMapDemos();
    initLayoutLab();
    initKineticTypo();
    initMicroInteractions();
    initSmoothScroll();
    initPreventDefault();
  }

  // ============================================
  // MODULE: Loader
  // ============================================
  function initLoader() {
    var loader = document.getElementById('loader');
    if (!loader) return;

    window.addEventListener('load', function() {
      setTimeout(function() {
        loader.classList.add('hidden');
        document.body.style.overflow = '';
      }, 2000);
    });

    document.body.style.overflow = 'hidden';
  }

  // ============================================
  // MODULE: Header
  // ============================================
  function initHeader() {
    var header = document.querySelector('.header');
    if (!header) return;

    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });

    // Active nav link tracking
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', function() {
      var current = '';
      var scrollY = window.pageYOffset;

      sections.forEach(function(section) {
        var sectionTop = section.offsetTop - 100;
        var sectionHeight = section.offsetHeight;

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach(function(link) {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
          link.classList.add('active');
        }
      });
    }, { passive: true });
  }

  // ============================================
  // MODULE: Mobile Menu
  // ============================================
  function initMobileMenu() {
    var menuToggle = document.getElementById('menuToggle');
    var mobileMenu = document.getElementById('mobileMenu');
    if (!menuToggle || !mobileMenu) return;

    menuToggle.addEventListener('click', function() {
      mobileMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });

    var menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        mobileMenu.classList.remove('active');
        menuToggle.classList.remove('active');
      });
    });
  }

  // ============================================
  // MODULE: Custom Cursor
  // ============================================
  function initCustomCursor() {
    var cursor = document.getElementById('cursor');
    if (!cursor || window.innerWidth < 768) return;

    var cursorDot = cursor.querySelector('.cursor__dot');
    var cursorOutline = cursor.querySelector('.cursor__outline');

    var mouseX = 0;
    var mouseY = 0;
    var outlineX = 0;
    var outlineY = 0;

    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top = mouseY + 'px';
    });

    function animateOutline() {
      outlineX += (mouseX - outlineX) * 0.15;
      outlineY += (mouseY - outlineY) * 0.15;

      cursorOutline.style.left = outlineX + 'px';
      cursorOutline.style.top = outlineY + 'px';

      requestAnimationFrame(animateOutline);
    }
    animateOutline();

    var interactiveElements = document.querySelectorAll('a, button, .bento-item, .showcase__demo, .palette-card__swatch, .effects-lab__btn, .layout-lab__btn, .kinetic-demo, .gradient-card, .micro-demo__btn');
    interactiveElements.forEach(function(el) {
      el.addEventListener('mouseenter', function() {
        cursor.classList.add('hover');
      });
      el.addEventListener('mouseleave', function() {
        cursor.classList.remove('hover');
      });
    });
  }

  // ============================================
  // MODULE: Mouse Trail
  // Pattern: mousemove dot generation with opacity fadeout
  // ============================================
  function initMouseTrail() {
    var container = document.getElementById('mouseTrailContainer');
    if (!container || window.innerWidth < 768) return;

    var throttled = false;

    document.addEventListener('mousemove', function(e) {
      if (throttled) return;
      throttled = true;

      setTimeout(function() {
        throttled = false;
      }, 50);

      var trail = document.createElement('div');
      trail.className = 'mouse-trail';
      trail.style.left = (e.clientX - 10) + 'px';
      trail.style.top = (e.clientY - 10) + 'px';
      container.appendChild(trail);

      setTimeout(function() {
        if (trail.parentNode) {
          trail.parentNode.removeChild(trail);
        }
      }, 500);
    });
  }

  // ============================================
  // MODULE: Particles
  // ============================================
  function initParticles() {
    var container = document.getElementById('particles');
    if (!container) return;

    var particleCount = 30;
    var colors = ['#6366f1', '#8b5cf6', '#06b6d4'];

    for (var i = 0; i < particleCount; i++) {
      createParticle(container, colors);
    }
  }

  function createParticle(container, colors) {
    var particle = document.createElement('div');
    particle.className = 'particle';

    var size = 2 + Math.random() * 4;
    var left = Math.random() * 100;
    var delay = Math.random() * 15;
    var duration = 15 + Math.random() * 10;
    var color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText =
      'width:' + size + 'px;' +
      'height:' + size + 'px;' +
      'left:' + left + '%;' +
      'background:' + color + ';' +
      'animation-delay:' + delay + 's;' +
      'animation-duration:' + duration + 's;';

    container.appendChild(particle);
  }

  // ============================================
  // MODULE: Scroll Animations (IntersectionObserver)
  // ============================================
  function initScrollAnimations() {
    var elements = document.querySelectorAll('.animate-on-scroll');
    if (!elements.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var delay = entry.target.dataset.delay || 0;
          setTimeout(function() {
            entry.target.classList.add('animated');
          }, parseInt(delay));
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(function(el) {
      observer.observe(el);
    });
  }

  // ============================================
  // MODULE: Counter Animation (easeOutQuart)
  // ============================================
  function initCounters() {
    var counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          entry.target.classList.add('counted');
          animateCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function(counter) {
      observer.observe(counter);
    });
  }

  function animateCounter(element) {
    var target = parseFloat(element.dataset.target) || 0;
    var duration = 2000;
    var isDecimal = target % 1 !== 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);

      // easeOutQuart
      var easeOutQuart = 1 - Math.pow(1 - progress, 4);
      var current = easeOutQuart * target;

      if (isDecimal) {
        element.textContent = current.toFixed(1);
      } else {
        element.textContent = Math.floor(current).toLocaleString();
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        if (isDecimal) {
          element.textContent = target.toFixed(1);
        } else {
          element.textContent = target.toLocaleString();
        }
      }
    }

    requestAnimationFrame(step);
  }

  // ============================================
  // MODULE: Parallax
  // Pattern: scroll-driven translateY on background
  // ============================================
  function initParallax() {
    var parallaxBg = document.querySelector('.parallax-bg');
    if (!parallaxBg) return;

    window.addEventListener('scroll', function() {
      var rect = parallaxBg.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        var yPos = (rect.top / window.innerHeight) * 50;
        parallaxBg.style.transform = 'translateY(' + yPos + 'px)';
      }
    }, { passive: true });
  }

  // ============================================
  // MODULE: Animation Showcase
  // Hover to trigger animation class on demo boxes
  // ============================================
  function initAnimationShowcase() {
    var demos = document.querySelectorAll('.showcase__demo');
    if (!demos.length) return;

    demos.forEach(function(demo) {
      var animName = demo.dataset.anim;
      var box = demo.querySelector('.showcase__demo-box');
      if (!animName || !box) return;

      demo.addEventListener('mouseenter', function() {
        box.classList.add('anim-' + animName);
        demo.classList.add('active');
      });

      demo.addEventListener('mouseleave', function() {
        box.classList.remove('anim-' + animName);
        demo.classList.remove('active');
      });
    });
  }

  // ============================================
  // MODULE: Effects Lab
  // Toggle buttons to switch gradient/mask/filter effects
  // ============================================
  function initEffectsLab() {
    var gradientPreview = document.getElementById('gradientPreview');
    var maskPreview = document.getElementById('maskPreview');
    var filterPreview = document.getElementById('filterPreview');

    // Gradient definitions
    var gradients = {
      1: 'linear-gradient(135deg, rgb(203, 196, 248) 0%, rgb(245, 186, 191) 100%)',
      2: 'radial-gradient(circle at 30% 50%, rgba(99, 102, 241, 0.6), transparent 50%), radial-gradient(circle at 70% 50%, rgba(6, 182, 212, 0.6), transparent 50%)',
      3: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 25%, #06b6d4 50%, #10b981 75%, #f59e0b 100%)',
      4: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
      5: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a25 50%, #0a0a0f 100%)'
    };

    // Mask definitions
    var masks = {
      1: 'radial-gradient(circle at center, black 50%, transparent 70%)',
      2: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
      3: 'linear-gradient(45deg, black 25%, transparent 25%) -50px 0, linear-gradient(-45deg, black 25%, transparent 25%) -50px 0, linear-gradient(45deg, transparent 75%, black 75%), linear-gradient(-45deg, transparent 75%, black 75%)'
    };

    // Filter definitions
    var filters = {
      1: 'none',
      2: 'blur(4px)',
      3: 'brightness(1.4) contrast(1.1)',
      4: 'hue-rotate(90deg)',
      5: 'saturate(2) contrast(1.1)'
    };

    var buttons = document.querySelectorAll('.effects-lab__btn');
    buttons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var effect = btn.dataset.effect;
        var index = btn.dataset.index;

        // Update active state within the same panel
        var panel = btn.closest('.effects-lab__panel');
        panel.querySelectorAll('.effects-lab__btn').forEach(function(b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');

        if (effect === 'gradient' && gradientPreview) {
          var sample = gradientPreview.querySelector('.effects-lab__sample');
          if (sample) {
            sample.style.background = gradients[index] || gradients[1];
          }
        }

        if (effect === 'mask' && maskPreview) {
          var img = maskPreview.querySelector('img');
          if (img) {
            var maskVal = masks[index] || 'none';
            if (maskVal === 'none' || index === '1') {
              img.style.webkitMask = masks[index];
              img.style.mask = masks[index];
            } else {
              img.style.webkitMask = maskVal;
              img.style.mask = maskVal;
            }
          }
        }

        if (effect === 'filter' && filterPreview) {
          var filterImg = filterPreview.querySelector('img');
          if (filterImg) {
            filterImg.style.filter = filters[index] || 'none';
          }
        }
      });
    });

    // Set initial gradient preview
    if (gradientPreview) {
      var sample = gradientPreview.querySelector('.effects-lab__sample');
      if (sample) {
        sample.style.background = gradients[1];
      }
    }

    // Set initial mask preview
    if (maskPreview) {
      var img = maskPreview.querySelector('img');
      if (img) {
        img.style.webkitMask = masks[1];
        img.style.mask = masks[1];
      }
    }
  }

  // ============================================
  // MODULE: Color Palettes
  // Category filtering + click-to-copy color
  // ============================================
  function initColorPalettes() {
    var filters = document.querySelectorAll('.color-typo__filter');
    var cards = document.querySelectorAll('.palette-card');
    var swatches = document.querySelectorAll('.palette-card__swatch');

    if (!filters.length) return;

    // Filter buttons
    filters.forEach(function(filterBtn) {
      filterBtn.addEventListener('click', function() {
        var category = filterBtn.dataset.filter;

        filters.forEach(function(f) { f.classList.remove('active'); });
        filterBtn.classList.add('active');

        cards.forEach(function(card) {
          if (category === 'all' || card.dataset.category === category) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });

    // Click swatch to copy color
    swatches.forEach(function(swatch) {
      swatch.addEventListener('click', function() {
        var color = swatch.dataset.color;
        if (!color) return;

        copyToClipboard(color);
        showToast('Copied: ' + color);
      });
    });
  }

  // ============================================
  // MODULE: Typography Controls
  // Range inputs for weight/size on demo text
  // ============================================
  function initTypographyControls() {
    var weightInput = document.getElementById('typoWeight');
    var sizeInput = document.getElementById('typoSize');
    var weightValue = document.getElementById('typoWeightValue');
    var sizeValue = document.getElementById('typoSizeValue');
    var heroText = document.querySelector('.typography-demo__hero');

    if (!weightInput || !sizeInput || !heroText) return;

    weightInput.addEventListener('input', function() {
      var val = weightInput.value;
      heroText.style.fontVariationSettings = "'wght' " + val;
      heroText.style.fontWeight = val;
      if (weightValue) weightValue.textContent = val;
    });

    sizeInput.addEventListener('input', function() {
      var val = sizeInput.value;
      heroText.style.fontSize = val + 'px';
      if (sizeValue) sizeValue.textContent = val + 'px';
    });
  }

  // ============================================
  // MODULE: Sakura Effect
  // Pattern: lp-design-reference.md sakuraFall animation
  // ============================================
  function initSakuraEffect() {
    var container = document.getElementById('sakuraContainer');
    var toggle = document.getElementById('sakuraToggle');
    if (!container) return;

    var petalCount = 25;
    var colors = ['rgba(255, 214, 224, 0.7)', 'rgba(255, 182, 193, 0.6)', 'rgba(255, 192, 203, 0.5)'];

    for (var i = 0; i < petalCount; i++) {
      createSakuraPetal(container, colors);
    }

    // Toggle button
    if (toggle) {
      toggle.addEventListener('click', function() {
        var petals = container.querySelectorAll('.sakura-petal');
        var isHidden = container.style.display === 'none';

        if (isHidden) {
          container.style.display = '';
          toggle.textContent = 'Hide Sakura';
        } else {
          container.style.display = 'none';
          toggle.textContent = 'Show Sakura';
        }
      });
    }
  }

  function createSakuraPetal(container, colors) {
    var petal = document.createElement('div');
    petal.className = 'sakura-petal';

    var size = 6 + Math.random() * 8;
    var left = Math.random() * 100;
    var duration = 8 + Math.random() * 12;
    var delay = Math.random() * 10;
    var color = colors[Math.floor(Math.random() * colors.length)];

    petal.style.cssText =
      'width:' + size + 'px;' +
      'height:' + size + 'px;' +
      'left:' + left + '%;' +
      'background:' + color + ';' +
      'animation-delay:' + delay + 's;' +
      'animation-duration:' + duration + 's;';

    container.appendChild(petal);
  }

  // ============================================
  // MODULE: Trend Map Demos
  // Mini boxes animated via CSS
  // ============================================
  function initTrendMapDemos() {
    var miniBoxes = document.querySelectorAll('.trend-map__mini-box');
    if (!miniBoxes.length) return;
    // Mini boxes are animated via CSS; just ensure they're visible on scroll
  }

  // ============================================
  // MODULE: Layout Lab
  // Switch between layout modes (bento, split, hero)
  // ============================================
  function initLayoutLab() {
    var buttons = document.querySelectorAll('.layout-lab__btn');
    var demo = document.getElementById('layoutDemo');
    if (!buttons.length || !demo) return;

    buttons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var layout = btn.dataset.layout;

        buttons.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        demo.setAttribute('data-active-layout', layout);
      });
    });

    // Set initial layout
    demo.setAttribute('data-active-layout', 'bento');
  }

  // ============================================
  // MODULE: Kinetic Typography
  // CSS-driven with touch support for mobile
  // ============================================
  function initKineticTypo() {
    var demos = document.querySelectorAll('.kinetic-demo');
    if (!demos.length) return;
    // Kinetic effects are CSS-driven via :hover
    // Add touch support for mobile
    demos.forEach(function(demo) {
      demo.addEventListener('touchstart', function() {
        demo.classList.add('is-active');
      });
      demo.addEventListener('touchend', function() {
        setTimeout(function() {
          demo.classList.remove('is-active');
        }, 600);
      });
    });
  }

  // ============================================
  // MODULE: Micro Interactions
  // Ripple button + magnetic hover effect
  // ============================================
  function initMicroInteractions() {
    // Ripple button
    var rippleButtons = document.querySelectorAll('.micro-demo__btn--ripple');
    rippleButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement('span');
        ripple.className = 'ripple';
        var size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        setTimeout(function() {
          if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
        }, 600);
      });
    });

    // Magnetic hover
    var magnetic = document.getElementById('magneticDemo');
    if (magnetic) {
      var ball = magnetic.querySelector('.micro-demo__magnetic-ball');
      magnetic.addEventListener('mousemove', function(e) {
        var rect = magnetic.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        if (ball) ball.style.transform = 'translate(' + (x * 0.3) + 'px,' + (y * 0.3) + 'px)';
      });
      magnetic.addEventListener('mouseleave', function() {
        if (ball) ball.style.transform = 'translate(0, 0)';
      });
    }
  }

  // ============================================
  // MODULE: Smooth Scroll
  // ============================================
  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');

    links.forEach(function(link) {
      link.addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href === '#') {
          e.preventDefault();
          return;
        }

        var target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        var headerEl = document.querySelector('.header');
        var headerHeight = headerEl ? headerEl.offsetHeight : 0;
        var targetPosition = target.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      });
    });
  }

  // ============================================
  // MODULE: Prevent Default Links
  // Prevent href="#" from jumping to top
  // ============================================
  function initPreventDefault() {
    var deadLinks = document.querySelectorAll('a[href="#"]');
    deadLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
      });
    });
  }

  // ============================================
  // UTILITIES
  // ============================================
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        // silently fail
      }
      document.body.removeChild(textarea);
    }
  }

  function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove('hide');
    toast.classList.add('show');

    setTimeout(function() {
      toast.classList.remove('show');
      toast.classList.add('hide');
    }, 2500);

    setTimeout(function() {
      toast.classList.remove('hide');
    }, 2800);
  }

})();
