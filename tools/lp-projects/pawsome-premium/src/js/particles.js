/**
 * Pawsome Stay - Premium Pet Hotel LP
 * Particle Effects - Paw Prints & Hearts
 */

(function() {
  'use strict';

  // ========================================
  // Configuration
  // ========================================
  const PARTICLE_CONFIG = {
    paws: {
      count: 15,
      minSize: 12,
      maxSize: 24,
      minDuration: 8,
      maxDuration: 15,
      colors: ['#FFB5C5', '#FF6B9D', '#98D8C8', '#FFD4E0'],
      emoji: '\uD83D\uDC3E'
    },
    hearts: {
      count: 10,
      minSize: 10,
      maxSize: 20,
      minDuration: 10,
      maxDuration: 18,
      emojis: ['\u2764\uFE0F', '\uD83D\uDC95', '\uD83D\uDC96', '\uD83D\uDC97', '\uD83E\uDE77']
    },
    sparkles: {
      count: 20,
      minSize: 4,
      maxSize: 8,
      minDuration: 5,
      maxDuration: 10
    }
  };

  // ========================================
  // Particle Container
  // ========================================
  class ParticleContainer {
    constructor() {
      this.container = document.getElementById('particles-container');
      this.isEnabled = true;
      this.particles = [];
      this.animationFrameId = null;

      this.init();
    }

    init() {
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'particles-container';
        this.container.className = 'particles-container';
        document.body.appendChild(this.container);
      }

      // Check for reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.isEnabled = false;
        return;
      }

      this.addStyles();
    }

    addStyles() {
      if (document.querySelector('#particle-styles')) return;

      const style = document.createElement('style');
      style.id = 'particle-styles';
      style.textContent = `
        .particles-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          pointer-events: none;
          will-change: transform, opacity;
        }

        .particle--paw {
          animation: pawFloat linear infinite;
        }

        .particle--heart {
          animation: heartFloat linear infinite;
        }

        .particle--sparkle {
          border-radius: 50%;
          animation: sparkleFloat linear infinite;
        }

        @keyframes pawFloat {
          0% {
            transform: translateY(100vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100px) translateX(100px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes heartFloat {
          0% {
            transform: translateY(100vh) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          50% {
            transform: translateY(50vh) translateX(50px) scale(1.2);
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-100px) translateX(-50px) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes sparkleFloat {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translateY(80vh) scale(1);
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0);
            opacity: 0;
          }
        }

        /* Mouse trail */
        .mouse-trail-particle {
          position: fixed;
          pointer-events: none;
          z-index: 9998;
          font-size: 16px;
          animation: trailFade 0.8s ease-out forwards;
        }

        @keyframes trailFade {
          0% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: scale(0.5) rotate(180deg);
          }
        }

        /* Burst effect */
        .burst-particle {
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          font-size: 20px;
        }

        @keyframes burstOut {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(0.5);
          }
        }

        /* Confetti */
        .confetti {
          position: fixed;
          width: 10px;
          height: 10px;
          pointer-events: none;
          z-index: 9999;
          animation: confettiFall linear forwards;
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotateX(0) rotateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateX(720deg) rotateY(360deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    clear() {
      this.particles.forEach(p => p.remove());
      this.particles = [];
    }
  }

  // ========================================
  // Paw Print Particles
  // ========================================
  class PawParticles {
    constructor(container) {
      this.container = container;
      this.config = PARTICLE_CONFIG.paws;
      this.particles = [];
    }

    createParticle() {
      const particle = document.createElement('span');
      particle.className = 'particle particle--paw';
      particle.textContent = this.config.emoji;

      const size = this.randomBetween(this.config.minSize, this.config.maxSize);
      const duration = this.randomBetween(this.config.minDuration, this.config.maxDuration);
      const delay = Math.random() * 5;
      const left = Math.random() * 100;
      const color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];

      particle.style.cssText = `
        font-size: ${size}px;
        left: ${left}%;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        filter: drop-shadow(0 0 3px ${color});
      `;

      this.container.appendChild(particle);
      this.particles.push(particle);

      return particle;
    }

    start() {
      for (let i = 0; i < this.config.count; i++) {
        this.createParticle();
      }
    }

    stop() {
      this.particles.forEach(p => p.remove());
      this.particles = [];
    }

    randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }
  }

  // ========================================
  // Heart Particles
  // ========================================
  class HeartParticles {
    constructor(container) {
      this.container = container;
      this.config = PARTICLE_CONFIG.hearts;
      this.particles = [];
    }

    createParticle() {
      const particle = document.createElement('span');
      particle.className = 'particle particle--heart';
      particle.textContent = this.config.emojis[Math.floor(Math.random() * this.config.emojis.length)];

      const size = this.randomBetween(this.config.minSize, this.config.maxSize);
      const duration = this.randomBetween(this.config.minDuration, this.config.maxDuration);
      const delay = Math.random() * 8;
      const left = Math.random() * 100;

      particle.style.cssText = `
        font-size: ${size}px;
        left: ${left}%;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
      `;

      this.container.appendChild(particle);
      this.particles.push(particle);

      return particle;
    }

    start() {
      for (let i = 0; i < this.config.count; i++) {
        this.createParticle();
      }
    }

    stop() {
      this.particles.forEach(p => p.remove());
      this.particles = [];
    }

    randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }
  }

  // ========================================
  // Sparkle Particles
  // ========================================
  class SparkleParticles {
    constructor(container) {
      this.container = container;
      this.config = PARTICLE_CONFIG.sparkles;
      this.particles = [];
    }

    createParticle() {
      const particle = document.createElement('span');
      particle.className = 'particle particle--sparkle';

      const size = this.randomBetween(this.config.minSize, this.config.maxSize);
      const duration = this.randomBetween(this.config.minDuration, this.config.maxDuration);
      const delay = Math.random() * 10;
      const left = Math.random() * 100;

      const colors = ['#FFD700', '#FFF', '#FFB5C5', '#98D8C8'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        background: ${color};
        box-shadow: 0 0 ${size}px ${color};
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
      `;

      this.container.appendChild(particle);
      this.particles.push(particle);

      return particle;
    }

    start() {
      for (let i = 0; i < this.config.count; i++) {
        this.createParticle();
      }
    }

    stop() {
      this.particles.forEach(p => p.remove());
      this.particles = [];
    }

    randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }
  }

  // ========================================
  // Mouse Trail
  // ========================================
  class MouseTrail {
    constructor() {
      this.isEnabled = true;
      this.lastX = 0;
      this.lastY = 0;
      this.throttleTime = 50;
      this.lastTime = 0;
      this.emojis = ['\uD83D\uDC3E', '\u2764\uFE0F', '\u2728'];

      this.init();
    }

    init() {
      // Disable on touch devices
      if ('ontouchstart' in window) {
        this.isEnabled = false;
        return;
      }

      // Check for reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.isEnabled = false;
        return;
      }

      document.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: true });
    }

    handleMouseMove(e) {
      if (!this.isEnabled) return;

      const currentTime = Date.now();
      if (currentTime - this.lastTime < this.throttleTime) return;

      const distance = Math.sqrt(
        Math.pow(e.clientX - this.lastX, 2) +
        Math.pow(e.clientY - this.lastY, 2)
      );

      if (distance > 30) {
        this.createTrailParticle(e.clientX, e.clientY);
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.lastTime = currentTime;
      }
    }

    createTrailParticle(x, y) {
      const particle = document.createElement('span');
      particle.className = 'mouse-trail-particle';
      particle.textContent = this.emojis[Math.floor(Math.random() * this.emojis.length)];
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;

      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 800);
    }

    enable() {
      this.isEnabled = true;
    }

    disable() {
      this.isEnabled = false;
    }
  }

  // ========================================
  // Burst Effect
  // ========================================
  class BurstEffect {
    constructor() {
      this.emojis = ['\u2764\uFE0F', '\uD83D\uDC95', '\uD83D\uDC96', '\uD83D\uDC97', '\uD83D\uDE0D', '\u2728', '\uD83C\uDF1F'];
    }

    trigger(x, y, count = 12) {
      for (let i = 0; i < count; i++) {
        const particle = document.createElement('span');
        particle.className = 'burst-particle';
        particle.textContent = this.emojis[Math.floor(Math.random() * this.emojis.length)];

        const angle = (i / count) * 360;
        const distance = 80 + Math.random() * 60;
        const tx = Math.cos(angle * Math.PI / 180) * distance;
        const ty = Math.sin(angle * Math.PI / 180) * distance;

        particle.style.cssText = `
          left: ${x}px;
          top: ${y}px;
          --tx: ${tx}px;
          --ty: ${ty}px;
          animation: burstOut 0.8s ease-out forwards;
        `;

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
      }
    }

    attachToElements(selector) {
      document.querySelectorAll(selector).forEach(el => {
        el.addEventListener('click', (e) => {
          const rect = el.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          this.trigger(x, y);
        });
      });
    }
  }

  // ========================================
  // Confetti Effect
  // ========================================
  class ConfettiEffect {
    constructor() {
      this.colors = ['#FFB5C5', '#FF6B9D', '#98D8C8', '#FFD700', '#FF69B4', '#87CEEB'];
    }

    trigger(x = window.innerWidth / 2, y = 0, count = 50) {
      for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';

        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const size = 5 + Math.random() * 10;
        const duration = 2 + Math.random() * 2;
        const startX = x + (Math.random() - 0.5) * 200;

        confetti.style.cssText = `
          left: ${startX}px;
          top: ${y}px;
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
          animation-duration: ${duration}s;
        `;

        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), duration * 1000);
      }
    }
  }

  // ========================================
  // Floating Emoji Effect
  // ========================================
  class FloatingEmoji {
    constructor(container, emoji, options = {}) {
      this.container = container;
      this.emoji = emoji;
      this.options = Object.assign({
        count: 5,
        minSize: 16,
        maxSize: 32,
        speed: 'slow'
      }, options);

      this.create();
    }

    create() {
      for (let i = 0; i < this.options.count; i++) {
        const element = document.createElement('span');
        element.textContent = this.emoji;
        element.className = 'floating-emoji';

        const size = this.options.minSize + Math.random() * (this.options.maxSize - this.options.minSize);
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = this.options.speed === 'slow' ? 15 + Math.random() * 10 : 5 + Math.random() * 5;
        const delay = Math.random() * 5;

        element.style.cssText = `
          position: absolute;
          font-size: ${size}px;
          left: ${x}%;
          top: ${y}%;
          opacity: 0.3;
          animation: floatEmoji ${duration}s ease-in-out ${delay}s infinite;
          pointer-events: none;
        `;

        this.container.appendChild(element);
      }

      // Add animation if not exists
      if (!document.querySelector('#floating-emoji-style')) {
        const style = document.createElement('style');
        style.id = 'floating-emoji-style';
        style.textContent = `
          @keyframes floatEmoji {
            0%, 100% {
              transform: translateY(0) translateX(0) rotate(0deg);
            }
            25% {
              transform: translateY(-20px) translateX(10px) rotate(10deg);
            }
            50% {
              transform: translateY(-10px) translateX(-10px) rotate(-5deg);
            }
            75% {
              transform: translateY(-30px) translateX(5px) rotate(5deg);
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }

  // ========================================
  // Initialize Particles
  // ========================================
  function initParticles() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const container = new ParticleContainer();

    if (!container.isEnabled) return;

    // Initialize particle systems
    const pawParticles = new PawParticles(container.container);
    const heartParticles = new HeartParticles(container.container);
    const sparkleParticles = new SparkleParticles(container.container);

    // Start particles
    pawParticles.start();
    heartParticles.start();
    sparkleParticles.start();

    // Initialize mouse trail
    const mouseTrail = new MouseTrail();

    // Initialize burst effect on CTA buttons
    const burstEffect = new BurstEffect();
    burstEffect.attachToElements('.btn--primary, .btn--accent');

    // Initialize confetti effect (can be triggered manually)
    const confettiEffect = new ConfettiEffect();

    // Make confetti available globally for special occasions
    window.pawsomeConfetti = () => confettiEffect.trigger();

    // Add floating emojis to specific sections
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      new FloatingEmoji(heroSection, '\uD83D\uDC3E', { count: 3, speed: 'slow' });
    }

    const ctaSection = document.querySelector('.final-cta');
    if (ctaSection) {
      const ctaParticles = ctaSection.querySelector('.final-cta__particles');
      if (ctaParticles) {
        new FloatingEmoji(ctaParticles, '\u2764\uFE0F', { count: 5 });
        new FloatingEmoji(ctaParticles, '\uD83D\uDC3E', { count: 5 });
        new FloatingEmoji(ctaParticles, '\u2728', { count: 3 });
      }
    }

    // Visibility change handler - pause/resume particles
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pawParticles.stop();
        heartParticles.stop();
        sparkleParticles.stop();
        mouseTrail.disable();
      } else {
        pawParticles.start();
        heartParticles.start();
        sparkleParticles.start();
        mouseTrail.enable();
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticles);
  } else {
    initParticles();
  }
})();
