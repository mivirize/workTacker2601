/**
 * Pawsome Stay - Premium Pet Hotel LP
 * Advanced Animations
 */

(function() {
  'use strict';

  // ========================================
  // Parallax Effects
  // ========================================
  class ParallaxManager {
    constructor() {
      this.elements = [];
      this.ticking = false;
      this.init();
    }

    init() {
      this.collectElements();
      this.bindEvents();
    }

    collectElements() {
      document.querySelectorAll('[data-parallax]').forEach(el => {
        this.elements.push({
          el,
          speed: parseFloat(el.dataset.parallaxSpeed) || 0.5,
          direction: el.dataset.parallaxDirection || 'vertical'
        });
      });
    }

    bindEvents() {
      window.addEventListener('scroll', () => this.requestTick(), { passive: true });
    }

    requestTick() {
      if (!this.ticking) {
        requestAnimationFrame(() => this.update());
        this.ticking = true;
      }
    }

    update() {
      this.elements.forEach(item => {
        const rect = item.el.getBoundingClientRect();
        const scrolled = window.scrollY;
        const rate = (rect.top + scrolled) * item.speed;

        if (item.direction === 'vertical') {
          item.el.style.transform = `translateY(${rate * 0.1}px)`;
        } else {
          item.el.style.transform = `translateX(${rate * 0.1}px)`;
        }
      });

      this.ticking = false;
    }
  }

  // ========================================
  // Magnetic Button Effect
  // ========================================
  class MagneticButton {
    constructor(el) {
      this.el = el;
      this.boundingRect = null;
      this.strength = 30;
      this.init();
    }

    init() {
      this.el.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.el.addEventListener('mouseleave', () => this.handleMouseLeave());
      this.el.addEventListener('mouseenter', () => this.handleMouseEnter());
    }

    handleMouseEnter() {
      this.boundingRect = this.el.getBoundingClientRect();
    }

    handleMouseMove(e) {
      if (!this.boundingRect) return;

      const x = e.clientX - this.boundingRect.left - this.boundingRect.width / 2;
      const y = e.clientY - this.boundingRect.top - this.boundingRect.height / 2;

      this.el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;

      const inner = this.el.querySelector('span');
      if (inner) {
        inner.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
      }
    }

    handleMouseLeave() {
      this.el.style.transform = '';
      const inner = this.el.querySelector('span');
      if (inner) {
        inner.style.transform = '';
      }
    }
  }

  // ========================================
  // Text Reveal Animation
  // ========================================
  class TextReveal {
    constructor(el) {
      this.el = el;
      this.originalText = el.textContent;
      this.init();
    }

    init() {
      this.wrapCharacters();
      this.observe();
    }

    wrapCharacters() {
      const chars = this.originalText.split('');
      this.el.innerHTML = chars.map((char, i) => {
        if (char === ' ') return ' ';
        return `<span class="char" style="animation-delay: ${i * 30}ms">${char}</span>`;
      }).join('');
    }

    observe() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.el.classList.add('revealed');
            observer.unobserve(this.el);
          }
        });
      }, { threshold: 0.5 });

      observer.observe(this.el);
    }
  }

  // ========================================
  // Smooth Scroll Reveal
  // ========================================
  class SmoothReveal {
    constructor() {
      this.init();
    }

    init() {
      const elements = document.querySelectorAll('.smooth-reveal');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      });

      elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
      });
    }
  }

  // ========================================
  // Stagger Animation
  // ========================================
  class StaggerAnimation {
    constructor(container) {
      this.container = container;
      this.children = Array.from(container.children);
      this.staggerDelay = parseInt(container.dataset.staggerDelay) || 100;
      this.init();
    }

    init() {
      this.children.forEach((child, index) => {
        child.style.opacity = '0';
        child.style.transform = 'translateY(30px)';
        child.style.transition = `opacity 0.5s ease ${index * this.staggerDelay}ms, transform 0.5s ease ${index * this.staggerDelay}ms`;
      });

      this.observe();
    }

    observe() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animate();
            observer.unobserve(this.container);
          }
        });
      }, { threshold: 0.2 });

      observer.observe(this.container);
    }

    animate() {
      this.children.forEach(child => {
        child.style.opacity = '1';
        child.style.transform = 'translateY(0)';
      });
    }
  }

  // ========================================
  // Mouse Follower
  // ========================================
  class MouseFollower {
    constructor() {
      this.follower = null;
      this.followerInner = null;
      this.mouseX = 0;
      this.mouseY = 0;
      this.followerX = 0;
      this.followerY = 0;
      this.speed = 0.15;
      this.init();
    }

    init() {
      // Check for touch device
      if ('ontouchstart' in window) return;

      this.createFollower();
      this.bindEvents();
      this.animate();
    }

    createFollower() {
      this.follower = document.createElement('div');
      this.follower.className = 'mouse-follower';
      this.follower.innerHTML = '<div class="mouse-follower__inner"></div>';
      document.body.appendChild(this.follower);

      this.followerInner = this.follower.querySelector('.mouse-follower__inner');

      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .mouse-follower {
          position: fixed;
          top: 0;
          left: 0;
          width: 40px;
          height: 40px;
          pointer-events: none;
          z-index: 9999;
          mix-blend-mode: difference;
        }
        .mouse-follower__inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(255, 181, 197, 0.5);
          transform: scale(1);
          transition: transform 0.3s ease, background 0.3s ease;
        }
        .mouse-follower.hovering .mouse-follower__inner {
          transform: scale(1.5);
          background: rgba(255, 107, 157, 0.7);
        }
        .mouse-follower.clicking .mouse-follower__inner {
          transform: scale(0.8);
        }
      `;
      document.head.appendChild(style);
    }

    bindEvents() {
      document.addEventListener('mousemove', (e) => {
        this.mouseX = e.clientX - 20;
        this.mouseY = e.clientY - 20;
      });

      // Hover effects
      const hoverElements = document.querySelectorAll('a, button, .hover-trigger');
      hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => this.follower.classList.add('hovering'));
        el.addEventListener('mouseleave', () => this.follower.classList.remove('hovering'));
      });

      // Click effect
      document.addEventListener('mousedown', () => this.follower.classList.add('clicking'));
      document.addEventListener('mouseup', () => this.follower.classList.remove('clicking'));
    }

    animate() {
      this.followerX += (this.mouseX - this.followerX) * this.speed;
      this.followerY += (this.mouseY - this.followerY) * this.speed;

      this.follower.style.transform = `translate(${this.followerX}px, ${this.followerY}px)`;

      requestAnimationFrame(() => this.animate());
    }
  }

  // ========================================
  // Tilt Effect
  // ========================================
  class TiltEffect {
    constructor(el) {
      this.el = el;
      this.maxTilt = 10;
      this.init();
    }

    init() {
      this.el.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.el.addEventListener('mouseleave', () => this.handleMouseLeave());
    }

    handleMouseMove(e) {
      const rect = this.el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const xPercent = (x / rect.width - 0.5) * 2;
      const yPercent = (y / rect.height - 0.5) * 2;

      const rotateX = -yPercent * this.maxTilt;
      const rotateY = xPercent * this.maxTilt;

      this.el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

    handleMouseLeave() {
      this.el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
  }

  // ========================================
  // Scroll Progress
  // ========================================
  class ScrollProgress {
    constructor() {
      this.progressBar = null;
      this.init();
    }

    init() {
      this.createProgressBar();
      this.bindEvents();
    }

    createProgressBar() {
      this.progressBar = document.createElement('div');
      this.progressBar.className = 'scroll-progress';
      document.body.appendChild(this.progressBar);

      const style = document.createElement('style');
      style.textContent = `
        .scroll-progress {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(90deg, #FFB5C5, #FF6B9D, #98D8C8);
          z-index: 10001;
          transform-origin: left;
          transform: scaleX(0);
          transition: transform 0.1s ease;
        }
      `;
      document.head.appendChild(style);
    }

    bindEvents() {
      window.addEventListener('scroll', () => this.updateProgress(), { passive: true });
    }

    updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollTop / docHeight;
      this.progressBar.style.transform = `scaleX(${progress})`;
    }
  }

  // ========================================
  // Number Scramble
  // ========================================
  class NumberScramble {
    constructor(el) {
      this.el = el;
      this.target = parseInt(el.textContent);
      this.duration = 2000;
      this.chars = '0123456789';
      this.init();
    }

    init() {
      this.observe();
    }

    observe() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animate();
            observer.unobserve(this.el);
          }
        });
      }, { threshold: 0.5 });

      observer.observe(this.el);
    }

    animate() {
      const startTime = Date.now();
      const targetStr = this.target.toString();

      const update = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        if (progress < 1) {
          // Scramble phase
          const scrambled = targetStr.split('').map((char, i) => {
            if (progress > (i / targetStr.length) + 0.5) {
              return char;
            }
            return this.chars[Math.floor(Math.random() * this.chars.length)];
          }).join('');
          this.el.textContent = scrambled;
          requestAnimationFrame(update);
        } else {
          this.el.textContent = this.target.toLocaleString();
        }
      };

      requestAnimationFrame(update);
    }
  }

  // ========================================
  // Wave Text
  // ========================================
  class WaveText {
    constructor(el) {
      this.el = el;
      this.text = el.textContent;
      this.init();
    }

    init() {
      this.wrapCharacters();
    }

    wrapCharacters() {
      const chars = this.text.split('');
      this.el.innerHTML = chars.map((char, i) => {
        if (char === ' ') return ' ';
        return `<span class="wave-char" style="animation-delay: ${i * 50}ms">${char}</span>`;
      }).join('');

      // Add wave animation style
      if (!document.querySelector('#wave-text-style')) {
        const style = document.createElement('style');
        style.id = 'wave-text-style';
        style.textContent = `
          .wave-char {
            display: inline-block;
            animation: waveChar 2s ease-in-out infinite;
          }
          @keyframes waveChar {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }

  // ========================================
  // Typewriter Effect
  // ========================================
  class Typewriter {
    constructor(el) {
      this.el = el;
      this.text = el.textContent;
      this.speed = parseInt(el.dataset.typeSpeed) || 50;
      this.el.textContent = '';
      this.init();
    }

    init() {
      this.observe();
    }

    observe() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.type();
            observer.unobserve(this.el);
          }
        });
      }, { threshold: 0.5 });

      observer.observe(this.el);
    }

    type() {
      let i = 0;
      const cursor = document.createElement('span');
      cursor.className = 'typewriter-cursor';
      cursor.textContent = '|';
      cursor.style.animation = 'blink 1s infinite';
      this.el.appendChild(cursor);

      if (!document.querySelector('#typewriter-style')) {
        const style = document.createElement('style');
        style.id = 'typewriter-style';
        style.textContent = `
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      const typeChar = () => {
        if (i < this.text.length) {
          this.el.insertBefore(document.createTextNode(this.text.charAt(i)), cursor);
          i++;
          setTimeout(typeChar, this.speed);
        } else {
          setTimeout(() => cursor.remove(), 2000);
        }
      };

      typeChar();
    }
  }

  // ========================================
  // Initialize Animations
  // ========================================
  function initAnimations() {
    // Parallax
    new ParallaxManager();

    // Magnetic buttons
    document.querySelectorAll('.btn--magnetic').forEach(btn => {
      new MagneticButton(btn);
    });

    // Text reveal
    document.querySelectorAll('.text-reveal').forEach(el => {
      new TextReveal(el);
    });

    // Smooth reveal
    new SmoothReveal();

    // Stagger animations
    document.querySelectorAll('[data-stagger]').forEach(container => {
      new StaggerAnimation(container);
    });

    // Tilt effect
    document.querySelectorAll('.tilt-effect').forEach(el => {
      new TiltEffect(el);
    });

    // Scroll progress
    new ScrollProgress();

    // Number scramble
    document.querySelectorAll('.number-scramble').forEach(el => {
      new NumberScramble(el);
    });

    // Wave text
    document.querySelectorAll('.wave-text').forEach(el => {
      new WaveText(el);
    });

    // Typewriter
    document.querySelectorAll('.typewriter').forEach(el => {
      new Typewriter(el);
    });

    // Optional: Mouse follower (uncomment if desired)
    // new MouseFollower();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    initAnimations();
  }
})();
