/* ============================================
   2026 Web Design Trends Showcase
   Complete JavaScript Implementation
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // Initialize on DOM Ready
  // ============================================
  document.addEventListener('DOMContentLoaded', function() {
    initLoader();
    initNavigation();
    initCustomCursor();
    initHeroParticles();
    initHero3DStarfield();
    initParallax();
    initPinPanels();
    initCounters();
    initCard3DTilt();
    initCube3D();
    initHorizontalScroll();
    initTypography();
    initParticleShowcase();
    initScrollAnimations();
    initMicroInteractions();
    initSmoothScroll();
    // New features
    initScrollProgress();
    initCSSScrollFallback();
    initTrustCounters();
    initFormInteractions();
    initCTAParticles();
    initStickyCards();
  });

  // ============================================
  // LOADER
  // ============================================
  function initLoader() {
    var loader = document.getElementById('loader');
    if (!loader) return;

    window.addEventListener('load', function() {
      setTimeout(function() {
        loader.classList.add('hidden');
        document.body.style.overflow = '';
        initRevealAnimations();
      }, 2500);
    });

    document.body.style.overflow = 'hidden';
  }

  // ============================================
  // NAVIGATION
  // ============================================
  function initNavigation() {
    var nav = document.querySelector('.nav');
    var navToggle = document.getElementById('navToggle');
    var mobileNav = document.getElementById('mobileNav');

    // Scroll effect
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }, { passive: true });

    // Mobile menu
    if (navToggle && mobileNav) {
      navToggle.addEventListener('click', function() {
        mobileNav.classList.toggle('active');
      });

      var mobileLinks = mobileNav.querySelectorAll('a');
      mobileLinks.forEach(function(link) {
        link.addEventListener('click', function() {
          mobileNav.classList.remove('active');
        });
      });
    }
  }

  // ============================================
  // CUSTOM CURSOR
  // ============================================
  function initCustomCursor() {
    var cursor = document.getElementById('cursor');
    if (!cursor || window.innerWidth < 1024) return;

    var dot = cursor.querySelector('.cursor__dot');
    var ring = cursor.querySelector('.cursor__ring');

    var mouseX = 0, mouseY = 0;
    var ringX = 0, ringY = 0;

    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    // Hover effect
    var interactives = document.querySelectorAll('a, button, .card-3d, .gallery-card, .bento-item');
    interactives.forEach(function(el) {
      el.addEventListener('mouseenter', function() { cursor.classList.add('active'); });
      el.addEventListener('mouseleave', function() { cursor.classList.remove('active'); });
    });
  }

  // ============================================
  // HERO PARTICLES
  // ============================================
  function initHeroParticles() {
    var container = document.getElementById('heroParticles');
    if (!container) return;

    var colors = ['#6366f1', '#8b5cf6', '#06b6d4'];

    for (var i = 0; i < 25; i++) {
      var particle = document.createElement('div');
      var size = 2 + Math.random() * 3;
      var duration = 12 + Math.random() * 8;
      particle.style.cssText = 'position: absolute; width: ' + size + 'px; height: ' + size + 'px; background: ' + colors[Math.floor(Math.random() * colors.length)] + '; border-radius: 50%; left: ' + Math.random() * 100 + '%; opacity: 0.4; animation: particleFloat ' + duration + 's linear -' + (Math.random() * duration) + 's infinite;';
      container.appendChild(particle);
    }

    // Add keyframes
    var style = document.createElement('style');
    style.textContent = '@keyframes particleFloat { 0% { transform: translateY(100vh) scale(0); opacity: 0; } 10% { opacity: 0.4; } 90% { opacity: 0.4; } 100% { transform: translateY(-100vh) scale(1); opacity: 0; } }';
    document.head.appendChild(style);
  }

  // ============================================
  // HERO STARFIELD - Optimized Space Effect
  // ============================================
  function initHero3DStarfield() {
    var starfield = document.getElementById('heroStarfield');
    var nebula = document.getElementById('heroNebula');
    var shootingStars = document.getElementById('heroShootingStars');
    var constellation = document.getElementById('heroConstellation');

    if (!starfield) return;

    // Create stars
    var starCount = 70;
    for (var i = 0; i < starCount; i++) {
      var star = document.createElement('div');
      var rand = Math.random();
      var sizeClass = rand < 0.5 ? 'star--small' : rand < 0.85 ? 'star--medium' : 'star--large';
      star.className = 'star ' + sizeClass;

      // Position stars in radial pattern from center
      var angle = Math.random() * Math.PI * 2;
      var distance = 15 + Math.random() * 35;
      var x = 50 + Math.cos(angle) * distance;
      var y = 50 + Math.sin(angle) * distance;

      // Stagger delays based on size
      var baseDuration = sizeClass === 'star--small' ? 18 : sizeClass === 'star--medium' ? 12 : 8;
      var delay = Math.random() * baseDuration;

      star.style.cssText = 'left: ' + x + '%; top: ' + y + '%; animation-delay: -' + delay + 's;';
      starfield.appendChild(star);
    }

    // Create nebula clouds
    if (nebula) {
      for (var i = 1; i <= 3; i++) {
        var cloud = document.createElement('div');
        cloud.className = 'nebula-cloud nebula-cloud--' + i;
        nebula.appendChild(cloud);
      }
    }

    // Throttled mouse parallax
    var heroSection = document.getElementById('hero');
    var targetX = 0, targetY = 0;
    var currentX = 0, currentY = 0;
    var animating = false;

    if (heroSection) {
      heroSection.addEventListener('mousemove', function(e) {
        var rect = heroSection.getBoundingClientRect();
        targetX = (e.clientX - rect.left) / rect.width - 0.5;
        targetY = (e.clientY - rect.top) / rect.height - 0.5;

        if (!animating) {
          animating = true;
          requestAnimationFrame(updateParallax);
        }
      }, { passive: true });

      function updateParallax() {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;

        starfield.style.transform = 'translate(' + (currentX * 20) + 'px, ' + (currentY * 20) + 'px)';

        if (nebula) {
          nebula.style.transform = 'translate(' + (-currentX * 30) + 'px, ' + (-currentY * 30) + 'px)';
        }

        // Stop animation when close enough to target
        if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
          requestAnimationFrame(updateParallax);
        } else {
          animating = false;
        }
      }
    }

    // Shooting stars - less frequent
    if (shootingStars) {
      function createShootingStar() {
        var star = document.createElement('div');
        star.className = 'shooting-star';
        var startX = 10 + Math.random() * 60;
        var startY = Math.random() * 40;
        var duration = 0.8 + Math.random() * 0.4;

        star.style.cssText = 'left: ' + startX + '%; top: ' + startY + '%; animation: shootingStar ' + duration + 's ease-out forwards;';
        shootingStars.appendChild(star);

        setTimeout(function() { star.remove(); }, duration * 1000 + 100);
      }

      function scheduleShootingStar() {
        setTimeout(function() {
          createShootingStar();
          scheduleShootingStar();
        }, 4000 + Math.random() * 6000);
      }

      setTimeout(createShootingStar, 2000);
      scheduleShootingStar();
    }

    // Constellation - simplified
    if (constellation) {
      var svg = constellation.querySelector('.constellation-svg');
      if (svg) {
        var points = [
          {x: 20, y: 30}, {x: 35, y: 25}, {x: 50, y: 35}, {x: 65, y: 28}, {x: 80, y: 40}
        ];

        for (var i = 0; i < points.length - 1; i++) {
          var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', points[i].x);
          line.setAttribute('y1', points[i].y);
          line.setAttribute('x2', points[i + 1].x);
          line.setAttribute('y2', points[i + 1].y);
          line.setAttribute('class', 'constellation-line');
          line.style.animationDelay = (i * 0.4) + 's';
          svg.appendChild(line);
        }

        points.forEach(function(point, index) {
          var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', point.x);
          circle.setAttribute('cy', point.y);
          circle.setAttribute('r', 1.5);
          circle.setAttribute('class', 'constellation-star');
          circle.style.animationDelay = (index * 0.3 + 0.5) + 's';
          svg.appendChild(circle);
        });
      }
    }
  }

  // ============================================
  // PARALLAX EFFECT
  // ============================================
  function initParallax() {
    var shapes = document.querySelectorAll('.parallax-shape');
    var parallaxText = document.querySelector('.parallax-text');

    window.addEventListener('scroll', function() {
      var scrollY = window.scrollY;

      shapes.forEach(function(shape, i) {
        var speed = 0.1 + (i * 0.05);
        shape.style.transform = 'translateY(' + (scrollY * speed) + 'px)';
      });

      if (parallaxText) {
        parallaxText.style.transform = 'translateY(' + (scrollY * 0.3) + 'px)';
      }
    }, { passive: true });
  }

  // ============================================
  // PIN PANELS (ScrollTrigger-like)
  // ============================================
  function initPinPanels() {
    var panels = document.querySelectorAll('.pin-panel');
    if (!panels.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.5 });

    panels.forEach(function(panel) {
      observer.observe(panel);
    });
  }

  // ============================================
  // COUNTER ANIMATION
  // ============================================
  function initCounters() {
    var counters = document.querySelectorAll('.counter-number');
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

  function animateCounter(el) {
    var target = parseFloat(el.dataset.target) || 0;
    var duration = 2000;
    var isDecimal = target % 1 !== 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easeOutQuart = 1 - Math.pow(1 - progress, 4);
      var current = easeOutQuart * target;

      el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString();
      }
    }

    requestAnimationFrame(step);
  }

  // ============================================
  // 3D CARD TILT
  // ============================================
  function initCard3DTilt() {
    var cards = document.querySelectorAll('.card-3d');

    cards.forEach(function(card) {
      var inner = card.querySelector('.card-3d__inner');
      var glow = card.querySelector('.card-3d__glow');

      card.addEventListener('mousemove', function(e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;

        var rotateX = (y - centerY) / 10;
        var rotateY = (centerX - x) / 10;

        inner.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';

        if (glow) {
          var percentX = (x / rect.width) * 100;
          var percentY = (y / rect.height) * 100;
          glow.style.setProperty('--mouse-x', percentX + '%');
          glow.style.setProperty('--mouse-y', percentY + '%');
        }
      });

      card.addEventListener('mouseleave', function() {
        inner.style.transform = 'rotateX(0) rotateY(0)';
      });
    });
  }

  // ============================================
  // 3D CUBE DRAG
  // ============================================
  function initCube3D() {
    var cube = document.getElementById('cube3d');
    if (!cube) return;

    var isDragging = false;
    var startX, startY;
    var rotateX = -20, rotateY = 30;

    cube.addEventListener('mousedown', function(e) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      cube.style.animation = 'none';
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      var deltaX = e.clientX - startX;
      var deltaY = e.clientY - startY;
      rotateY += deltaX * 0.5;
      rotateX -= deltaY * 0.5;
      cube.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
      startX = e.clientX;
      startY = e.clientY;
    });

    document.addEventListener('mouseup', function() {
      isDragging = false;
    });
  }

  // ============================================
  // HORIZONTAL SCROLL
  // ============================================
  function initHorizontalScroll() {
    var container = document.getElementById('horizontalScroll');
    if (!container) return;

    var isDown = false;
    var startX, scrollLeft;

    container.addEventListener('mousedown', function(e) {
      isDown = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', function() { isDown = false; });
    container.addEventListener('mouseup', function() { isDown = false; });

    container.addEventListener('mousemove', function(e) {
      if (!isDown) return;
      e.preventDefault();
      var x = e.pageX - container.offsetLeft;
      var walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    });

    // Touch support
    var touchStartX = 0, touchScrollLeft = 0;

    container.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].pageX;
      touchScrollLeft = container.scrollLeft;
    }, { passive: true });

    container.addEventListener('touchmove', function(e) {
      var x = e.touches[0].pageX;
      container.scrollLeft = touchScrollLeft + (touchStartX - x);
    }, { passive: true });
  }

  // ============================================
  // TYPOGRAPHY DEMOS
  // ============================================
  function initTypography() {
    // Variable Font Weight
    var weightSlider = document.getElementById('weightSlider');
    var weightValue = document.getElementById('weightValue');
    var variableText = document.getElementById('variableText');

    if (weightSlider && variableText) {
      weightSlider.addEventListener('input', function() {
        var weight = this.value;
        variableText.style.fontWeight = weight;
        if (weightValue) weightValue.textContent = weight;
      });
    }

    // Wave Text Animation
    var waveText = document.querySelector('.wave-text');
    if (waveText) {
      var text = waveText.textContent;
      waveText.innerHTML = '';
      for (var i = 0; i < text.length; i++) {
        var span = document.createElement('span');
        span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
        span.style.animationDelay = (i * 0.1) + 's';
        waveText.appendChild(span);
      }
    }

    // Scramble Text
    var scrambleText = document.querySelector('.scramble-text');
    if (scrambleText) {
      var originalText = scrambleText.dataset.text || scrambleText.textContent;
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

      scrambleText.addEventListener('mouseenter', function() {
        var iterations = 0;
        var interval = setInterval(function() {
          scrambleText.textContent = originalText
            .split('')
            .map(function(char, index) {
              if (index < iterations) return originalText[index];
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('');

          if (iterations >= originalText.length) {
            clearInterval(interval);
          }
          iterations += 1 / 3;
        }, 30);
      });
    }

    // Split Text Reveal
    var splitWords = document.querySelectorAll('.split-word');
    if (splitWords.length) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            splitWords.forEach(function(word) {
              word.classList.add('visible');
            });
          }
        });
      }, { threshold: 0.5 });

      observer.observe(document.querySelector('.split-reveal'));
    }
  }

  // ============================================
  // PARTICLE SHOWCASE - Optimized
  // ============================================
  function initParticleShowcase() {
    // Sakura Particles
    var sakuraContainer = document.getElementById('sakuraContainer');
    if (sakuraContainer) {
      var sakuraColors = ['#ffc0cb', '#ffb6c1', '#ff69b4'];
      for (var i = 0; i < 25; i++) {
        var petal = document.createElement('div');
        petal.className = 'sakura-petal';
        var size = 10 + Math.random() * 10;
        var duration = 8 + Math.random() * 6;
        var delay = Math.random() * duration;
        petal.style.cssText = 'width: ' + size + 'px; height: ' + size + 'px; left: ' + Math.random() * 100 + '%; top: -5%; background: ' + sakuraColors[Math.floor(Math.random() * sakuraColors.length)] + '; animation-duration: ' + duration + 's; animation-delay: -' + delay + 's;';
        sakuraContainer.appendChild(petal);
      }
    }

    // Light Particles
    var lightContainer = document.getElementById('lightContainer');
    if (lightContainer) {
      for (var i = 0; i < 28; i++) {
        var light = document.createElement('div');
        light.className = 'light-particle';
        var size = 5 + Math.random() * 8;
        var duration = 5 + Math.random() * 5;
        var delay = Math.random() * duration;
        light.style.cssText = 'width: ' + size + 'px; height: ' + size + 'px; left: ' + Math.random() * 100 + '%; top: 105%; animation-duration: ' + duration + 's; animation-delay: -' + delay + 's; box-shadow: 0 0 ' + (size * 2) + 'px ' + size + 'px rgba(255, 255, 255, 0.6);';
        lightContainer.appendChild(light);
      }
    }

    // Geometric Particles
    var geoContainer = document.getElementById('geometricContainer');
    if (geoContainer) {
      var geoColors = ['rgba(6, 182, 212, 0.7)', 'rgba(99, 102, 241, 0.7)', 'rgba(139, 92, 246, 0.7)'];
      var shapes = ['circle', 'square', 'hex'];

      for (var i = 0; i < 25; i++) {
        var geo = document.createElement('div');
        var size = 15 + Math.random() * 20;
        var shape = shapes[Math.floor(Math.random() * shapes.length)];
        var color = geoColors[Math.floor(Math.random() * geoColors.length)];
        var duration = 7 + Math.random() * 6;
        var delay = Math.random() * duration;

        if (shape === 'hex') {
          geo.className = 'hex-particle';
          geo.style.cssText = 'width: ' + size + 'px; height: ' + size + 'px; left: ' + Math.random() * 100 + '%; top: 105%; border-color: ' + color + '; animation-duration: ' + duration + 's; animation-delay: -' + delay + 's;';
        } else {
          geo.className = 'geo-particle';
          var borderRadius = shape === 'circle' ? '50%' : '4px';
          geo.style.cssText = 'width: ' + size + 'px; height: ' + size + 'px; left: ' + Math.random() * 100 + '%; top: 105%; border-radius: ' + borderRadius + '; border-color: ' + color + '; background: ' + color.replace('0.7', '0.2') + '; animation-duration: ' + duration + 's; animation-delay: -' + delay + 's;';
        }
        geoContainer.appendChild(geo);
      }
    }

    // NEW: Snow Particles
    var snowContainer = document.getElementById('snowContainer');
    if (snowContainer) {
      for (var i = 0; i < 20; i++) {
        var snow = document.createElement('div');
        snow.className = 'snow-particle';
        var size = 3 + Math.random() * 5;
        var duration = 6 + Math.random() * 6;
        var delay = Math.random() * duration;
        snow.style.cssText = 'width: ' + size + 'px; height: ' + size + 'px; left: ' + Math.random() * 100 + '%; top: -5%; animation-duration: ' + duration + 's; animation-delay: -' + delay + 's;';
        snowContainer.appendChild(snow);
      }
    }

    // NEW: Confetti Particles
    var confettiContainer = document.getElementById('confettiContainer');
    if (confettiContainer) {
      var confettiColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#6366f1', '#f472b6'];
      for (var i = 0; i < 20; i++) {
        var confetti = document.createElement('div');
        confetti.className = 'confetti-particle';
        var color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        var duration = 4 + Math.random() * 4;
        var delay = Math.random() * duration;
        confetti.style.cssText = 'left: ' + Math.random() * 100 + '%; top: -5%; background: ' + color + '; animation-duration: ' + duration + 's; animation-delay: -' + delay + 's;';
        confettiContainer.appendChild(confetti);
      }
    }

    // NEW: Bubble Particles
    var bubbleContainer = document.getElementById('bubbleContainer');
    if (bubbleContainer) {
      for (var i = 0; i < 15; i++) {
        var bubble = document.createElement('div');
        bubble.className = 'bubble-particle';
        var size = 10 + Math.random() * 25;
        var duration = 6 + Math.random() * 6;
        var delay = Math.random() * duration;
        bubble.style.cssText = 'width: ' + size + 'px; height: ' + size + 'px; left: ' + Math.random() * 100 + '%; top: 105%; animation-duration: ' + duration + 's; animation-delay: -' + delay + 's;';
        bubbleContainer.appendChild(bubble);
      }
    }

    // NEW: Twinkle Stars
    var starsContainer = document.getElementById('starsContainer');
    if (starsContainer) {
      for (var i = 0; i < 30; i++) {
        var star = document.createElement('div');
        star.className = 'twinkle-star';
        var size = 1 + Math.random() * 3;
        var duration = 1 + Math.random() * 2;
        var delay = Math.random() * duration;
        star.style.cssText = 'width: ' + size + 'px; height: ' + size + 'px; left: ' + Math.random() * 100 + '%; top: ' + Math.random() * 100 + '%; animation-duration: ' + duration + 's; animation-delay: -' + delay + 's;';
        starsContainer.appendChild(star);
      }
    }

    // NEW: Firefly Particles
    var fireflyContainer = document.getElementById('fireflyContainer');
    if (fireflyContainer) {
      for (var i = 0; i < 12; i++) {
        var firefly = document.createElement('div');
        firefly.className = 'firefly-particle';
        var size = 3 + Math.random() * 4;
        var duration = 3 + Math.random() * 4;
        var delay = Math.random() * duration;
        firefly.style.cssText = 'width: ' + size + 'px; height: ' + size + 'px; left: ' + Math.random() * 100 + '%; top: ' + Math.random() * 100 + '%; animation-duration: ' + duration + 's; animation-delay: -' + delay + 's;';
        fireflyContainer.appendChild(firefly);
      }
    }
  }

  // ============================================
  // SCROLL ANIMATIONS
  // ============================================
  function initScrollAnimations() {
    var items = document.querySelectorAll('.animate-item, .bento-item');

    // Check if we're in an iframe (LP-Editor environment)
    var isInIframe = false;
    try {
      isInIframe = window.self !== window.top;
    } catch (e) {
      isInIframe = true;
    }

    // In LP-Editor, show all items immediately
    if (isInIframe) {
      items.forEach(function(item) {
        item.classList.add('visible');
      });
      return;
    }

    // Normal browser: use IntersectionObserver
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry, index) {
        if (entry.isIntersecting) {
          setTimeout(function() {
            entry.target.classList.add('visible');
          }, index * 100);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    items.forEach(function(item) {
      observer.observe(item);
    });
  }

  function initRevealAnimations() {
    var reveals = document.querySelectorAll('.reveal-text, .split-text');

    reveals.forEach(function(el, i) {
      setTimeout(function() {
        el.classList.add('visible');
      }, i * 150);
    });
  }

  // ============================================
  // MICRO INTERACTIONS
  // ============================================
  function initMicroInteractions() {
    // Magnetic buttons
    var magneticBtns = document.querySelectorAll('[data-magnetic]');

    magneticBtns.forEach(function(btn) {
      btn.addEventListener('mousemove', function(e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.2) + 'px, ' + (y * 0.2) + 'px)';
      });

      btn.addEventListener('mouseleave', function() {
        btn.style.transform = 'translate(0, 0)';
      });
    });

    // Ripple effect
    var rippleBtns = document.querySelectorAll('.micro-btn--ripple');

    rippleBtns.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement('span');
        ripple.style.cssText = '\n          position: absolute;\n          left: ' + (e.clientX - rect.left) + 'px;\n          top: ' + (e.clientY - rect.top) + 'px;\n          width: 0;\n          height: 0;\n          background: rgba(255,255,255,0.3);\n          border-radius: 50%;\n          transform: translate(-50%, -50%);\n          animation: rippleEffect 0.6s ease-out;\n          pointer-events: none;\n        ';
        btn.appendChild(ripple);
        setTimeout(function() { ripple.remove(); }, 600);
      });
    });

    // Add ripple keyframes
    var style = document.createElement('style');
    style.textContent = '\n      @keyframes rippleEffect {\n        to { width: 300px; height: 300px; opacity: 0; }\n      }\n    ';
    document.head.appendChild(style);
  }

  // ============================================
  // SMOOTH SCROLL
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

        var nav = document.querySelector('.nav');
        var navHeight = nav ? nav.offsetHeight : 0;
        var targetPosition = target.offsetTop - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      });
    });
  }

  // ============================================
  // SCROLL PROGRESS BAR (with CSS fallback)
  // ============================================
  function initScrollProgress() {
    var progressBar = document.querySelector('.scroll-progress__bar');
    var progressText = document.querySelector('.progress-circle__text');
    var circleFill = document.querySelector('.progress-circle__fill');
    var progressBars = document.querySelectorAll('.progress-bar-fill');

    // Check if CSS scroll-driven animations are supported
    var supportsScrollDriven = CSS.supports && CSS.supports('animation-timeline', 'scroll()');

    // Always update progress text (CSS doesn't handle text content)
    // Also handle visual updates for non-supporting browsers
    window.addEventListener('scroll', function() {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      // Always update text content
      if (progressText) {
        progressText.textContent = Math.round(progress) + '%';
      }

      // For non-CSS-supporting browsers, also update visual elements
      if (!supportsScrollDriven) {
        if (progressBar) {
          progressBar.style.width = progress + '%';
        }

        progressBars.forEach(function(bar) {
          bar.style.width = progress + '%';
        });

        if (circleFill) {
          var circumference = 283;
          var offset = circumference - (progress / 100) * circumference;
          circleFill.style.strokeDashoffset = offset;
        }
      }
    }, { passive: true });

    // Trigger initial scroll event
    window.dispatchEvent(new Event('scroll'));
  }

  // ============================================
  // CSS SCROLL-DRIVEN FALLBACK
  // ============================================
  function initCSSScrollFallback() {
    var viewCards = document.querySelectorAll('.view-card');

    // Check if we're in an iframe (LP-Editor environment)
    var isInIframe = false;
    try {
      isInIframe = window.self !== window.top;
    } catch (e) {
      isInIframe = true;
    }

    // In LP-Editor, show all cards immediately
    if (isInIframe) {
      viewCards.forEach(function(card) {
        card.classList.add('visible');
      });
      return;
    }

    // Check if CSS scroll-driven animations are supported
    var supportsScrollDriven = CSS.supports && CSS.supports('animation-timeline', 'view()');

    if (!supportsScrollDriven) {
      // Apply fallback animations using IntersectionObserver
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.2 });

      viewCards.forEach(function(card) {
        observer.observe(card);
      });
    }
  }

  // ============================================
  // TRUST COUNTERS (CTA Section)
  // ============================================
  function initTrustCounters() {
    var trustNumbers = document.querySelectorAll('.trust-number');
    if (!trustNumbers.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          entry.target.classList.add('counted');
          animateTrustCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });

    trustNumbers.forEach(function(counter) {
      observer.observe(counter);
    });
  }

  function animateTrustCounter(el) {
    var target = parseFloat(el.dataset.target) || 0;
    var duration = 2000;
    var isDecimal = target % 1 !== 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easeOutQuart = 1 - Math.pow(1 - progress, 4);
      var current = easeOutQuart * target;

      if (isDecimal) {
        el.textContent = current.toFixed(1);
      } else {
        el.textContent = Math.floor(current).toLocaleString();
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString();
      }
    }

    requestAnimationFrame(step);
  }

  // ============================================
  // FORM INTERACTIONS
  // ============================================
  function initFormInteractions() {
    // Range Slider
    var rangeSlider = document.getElementById('priceRange');
    var rangeValue = document.getElementById('rangeValue');

    if (rangeSlider && rangeValue) {
      rangeSlider.addEventListener('input', function() {
        var value = parseInt(this.value).toLocaleString();
        rangeValue.textContent = value + '円';
      });
    }

    // Form Submit Animation
    var forms = document.querySelectorAll('.demo-form form');
    forms.forEach(function(form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();

        var submitBtn = form.querySelector('.form-submit');
        if (submitBtn) {
          var loader = submitBtn.querySelector('.form-submit__loader');
          var text = submitBtn.querySelector('span');

          if (loader && text) {
            text.style.opacity = '0';
            loader.style.display = 'block';

            setTimeout(function() {
              loader.style.display = 'none';
              text.textContent = '送信完了!';
              text.style.opacity = '1';

              setTimeout(function() {
                text.textContent = '送信する';
                form.reset();
              }, 2000);
            }, 1500);
          }
        }
      });
    });
  }

  // ============================================
  // CTA PARTICLES
  // ============================================
  function initCTAParticles() {
    var container = document.getElementById('ctaParticles');
    if (!container) return;

    var colors = ['rgba(239, 68, 68, 0.4)', 'rgba(99, 102, 241, 0.4)', 'rgba(6, 182, 212, 0.4)'];

    for (var i = 0; i < 22; i++) {
      var particle = document.createElement('div');
      var size = 5 + Math.random() * 6;
      var duration = 10 + Math.random() * 10;
      particle.style.cssText = 'position: absolute; width: ' + size + 'px; height: ' + size + 'px; background: ' + colors[Math.floor(Math.random() * colors.length)] + '; border-radius: 50%; left: ' + Math.random() * 100 + '%; top: ' + Math.random() * 100 + '%; animation: ctaFloat ' + duration + 's ease-in-out -' + (Math.random() * duration) + 's infinite;';
      container.appendChild(particle);
    }

    // Add keyframes
    var style = document.createElement('style');
    style.textContent = '@keyframes ctaFloat { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; } 50% { transform: translateY(-25px) scale(1.15); opacity: 0.6; } }';
    document.head.appendChild(style);
  }

  // ============================================
  // STICKY CARDS ANIMATION
  // ============================================
  function initStickyCards() {
    var stickyCards = document.querySelectorAll('.sticky-card');
    if (!stickyCards.length) return;

    // Check if we're in an iframe (LP-Editor environment)
    var isInIframe = false;
    try {
      isInIframe = window.self !== window.top;
    } catch (e) {
      isInIframe = true;
    }

    // In LP-Editor, show all cards immediately
    if (isInIframe) {
      stickyCards.forEach(function(card) {
        card.classList.add('visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.3 });

    stickyCards.forEach(function(card) {
      observer.observe(card);
    });
  }

  // ============================================
  // VIEW TRANSITIONS API DEMO
  // ============================================
  function initViewTransitions() {
    var triggerBtns = document.querySelectorAll('.vt-trigger-btn');
    var shuffleBtn = document.getElementById('vtShuffleBtn');

    // Transition type triggers
    triggerBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var type = btn.getAttribute('data-transition');
        var preview = btn.closest('.vt-card').querySelector('.vt-preview-box');
        if (!preview) return;

        // Simple animation fallback (View Transitions API demo)
        var colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'];
        var letters = ['A', 'B', 'C', 'D', 'E'];
        var currentIndex = letters.indexOf(preview.textContent);
        var nextIndex = (currentIndex + 1) % letters.length;

        // Check for View Transitions API support
        if (document.startViewTransition) {
          document.startViewTransition(function() {
            preview.style.background = colors[nextIndex];
            preview.textContent = letters[nextIndex];
          });
        } else {
          // Fallback animation
          preview.style.opacity = '0';
          preview.style.transform = 'scale(0.8)';
          setTimeout(function() {
            preview.style.background = colors[nextIndex];
            preview.textContent = letters[nextIndex];
            preview.style.opacity = '1';
            preview.style.transform = 'scale(1)';
          }, 150);
        }
      });
    });

    // Shuffle button for named transitions
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', function() {
        var grid = document.querySelector('.vt-names-grid');
        if (!grid) return;

        var elements = Array.from(grid.children);

        // Shuffle array
        for (var i = elements.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = elements[i];
          elements[i] = elements[j];
          elements[j] = temp;
        }

        if (document.startViewTransition) {
          document.startViewTransition(function() {
            elements.forEach(function(el) {
              grid.appendChild(el);
            });
          });
        } else {
          elements.forEach(function(el) {
            grid.appendChild(el);
          });
        }
      });
    }
  }

  // ============================================
  // CONTAINER QUERIES DEMO
  // ============================================
  function initContainerQueries() {
    var resizable = document.getElementById('cqResizable');
    var widthValue = document.getElementById('cqWidthValue');

    if (!resizable || !widthValue) return;

    // Update width indicator
    function updateWidthIndicator() {
      var width = resizable.offsetWidth;
      widthValue.textContent = width + 'px';
    }

    // Initial update
    updateWidthIndicator();

    // Watch for resize
    var resizeObserver = new ResizeObserver(function() {
      updateWidthIndicator();
    });
    resizeObserver.observe(resizable);
  }

  // Initialize new demos after DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    initViewTransitions();
    initContainerQueries();
  });

})();
