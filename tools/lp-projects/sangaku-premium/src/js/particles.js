/**
 * SANGAKU BEER - Particle Effects
 * Rising Bubbles and Floating Hops
 */

(function() {
  'use strict';

  // ========================================
  // Configuration
  // ========================================
  const PARTICLE_CONFIG = {
    bubbles: {
      count: 30,
      minSize: 4,
      maxSize: 12,
      minDuration: 6,
      maxDuration: 15,
      colors: [
        'rgba(212, 168, 83, 0.4)',
        'rgba(212, 168, 83, 0.3)',
        'rgba(255, 255, 255, 0.3)',
        'rgba(201, 169, 98, 0.4)'
      ]
    },
    hops: {
      count: 8,
      minSize: 15,
      maxSize: 30,
      minDuration: 20,
      maxDuration: 35
    },
    heroBubbles: {
      count: 20,
      minSize: 3,
      maxSize: 8,
      minDuration: 4,
      maxDuration: 10
    },
    ageGateParticles: {
      count: 15,
      minSize: 2,
      maxSize: 6,
      minDuration: 8,
      maxDuration: 16
    }
  };

  // ========================================
  // Utility Functions
  // ========================================
  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // ========================================
  // Bubble Particle Class
  // ========================================
  class Bubble {
    constructor(container, config) {
      this.container = container;
      this.config = config;
      this.element = null;
      this.create();
    }

    create() {
      this.element = document.createElement('div');
      this.element.className = 'bubble';

      const size = random(this.config.minSize, this.config.maxSize);
      const duration = random(this.config.minDuration, this.config.maxDuration);
      const delay = random(0, 10);
      const left = random(0, 100);
      const drift = random(-30, 30);
      const color = randomItem(this.config.colors);

      this.element.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        bottom: -${size}px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, ${color}, transparent);
        box-shadow: inset 0 -2px 4px rgba(255, 255, 255, 0.2);
        pointer-events: none;
        animation: risingBubble ${duration}s linear ${delay}s infinite;
        --drift: ${drift}px;
        --duration: ${duration}s;
        z-index: 1;
      `;

      this.container.appendChild(this.element);
    }

    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  }

  // ========================================
  // Hop Particle Class
  // ========================================
  class HopParticle {
    constructor(container, config) {
      this.container = container;
      this.config = config;
      this.element = null;
      this.create();
    }

    create() {
      this.element = document.createElement('div');
      this.element.className = 'hop-particle';

      const size = random(this.config.minSize, this.config.maxSize);
      const duration = random(this.config.minDuration, this.config.maxDuration);
      const delay = random(0, 15);
      const left = random(0, 100);
      const opacity = random(0.2, 0.5);

      this.element.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        bottom: -${size}px;
        pointer-events: none;
        opacity: ${opacity};
        animation: floatingHop ${duration}s linear ${delay}s infinite;
        z-index: 1;
      `;

      this.element.innerHTML = this.createHopSVG(size);

      this.container.appendChild(this.element);
    }

    createHopSVG(size) {
      return `
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="#1B4D3E" stroke-width="1.5">
          <ellipse cx="12" cy="8" rx="4" ry="6" />
          <ellipse cx="8" cy="14" rx="3" ry="5" />
          <ellipse cx="16" cy="14" rx="3" ry="5" />
          <ellipse cx="12" cy="18" rx="3" ry="4" />
          <path d="M12 22 L12 8" />
        </svg>
      `;
    }

    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  }

  // ========================================
  // Foam Bubble Class (for loading/product cards)
  // ========================================
  class FoamBubble {
    constructor(container, size, delay) {
      this.container = container;
      this.size = size;
      this.delay = delay;
      this.element = null;
      this.create();
    }

    create() {
      this.element = document.createElement('div');
      this.element.className = 'foam-bubble-particle';

      const x = random(0, 100);
      const y = random(0, 100);
      const duration = random(2, 4);

      this.element.style.cssText = `
        position: absolute;
        width: ${this.size}px;
        height: ${this.size}px;
        left: ${x}%;
        top: ${y}%;
        background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(255, 254, 240, 0.6));
        border-radius: 50%;
        animation: foamBubble ${duration}s ease-in-out ${this.delay}s infinite;
        pointer-events: none;
      `;

      this.container.appendChild(this.element);
    }

    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  }

  // ========================================
  // Particle System Manager
  // ========================================
  class ParticleSystem {
    constructor() {
      this.particles = [];
      this.containers = {};
      this.isInitialized = false;
    }

    init() {
      if (this.isInitialized) return;

      this.containers.main = document.getElementById('particles-container');
      this.containers.hero = document.getElementById('hero-bubbles');
      this.containers.ageGate = document.getElementById('age-gate-particles');

      this.createMainParticles();
      this.createHeroParticles();
      this.createAgeGateParticles();
      this.createProductCardBubbles();

      this.isInitialized = true;
    }

    createMainParticles() {
      if (!this.containers.main) return;

      for (let i = 0; i < PARTICLE_CONFIG.bubbles.count; i++) {
        const bubble = new Bubble(this.containers.main, PARTICLE_CONFIG.bubbles);
        this.particles.push(bubble);
      }

      for (let i = 0; i < PARTICLE_CONFIG.hops.count; i++) {
        const hop = new HopParticle(this.containers.main, PARTICLE_CONFIG.hops);
        this.particles.push(hop);
      }
    }

    createHeroParticles() {
      if (!this.containers.hero) return;

      for (let i = 0; i < PARTICLE_CONFIG.heroBubbles.count; i++) {
        const config = {
          ...PARTICLE_CONFIG.heroBubbles,
          colors: [
            'rgba(255, 255, 255, 0.3)',
            'rgba(212, 168, 83, 0.3)',
            'rgba(255, 254, 240, 0.4)'
          ]
        };
        const bubble = new Bubble(this.containers.hero, config);
        this.particles.push(bubble);
      }
    }

    createAgeGateParticles() {
      if (!this.containers.ageGate) return;

      for (let i = 0; i < PARTICLE_CONFIG.ageGateParticles.count; i++) {
        const config = {
          ...PARTICLE_CONFIG.ageGateParticles,
          colors: [
            'rgba(212, 168, 83, 0.2)',
            'rgba(201, 169, 98, 0.2)',
            'rgba(255, 255, 255, 0.15)'
          ]
        };
        const bubble = new Bubble(this.containers.ageGate, config);
        this.particles.push(bubble);
      }
    }

    createProductCardBubbles() {
      const productBubbleContainers = document.querySelectorAll('.product-card__bubbles');

      productBubbleContainers.forEach(container => {
        for (let i = 0; i < 5; i++) {
          const size = random(3, 6);
          const delay = random(0, 2);
          const bubble = new FoamBubble(container, size, delay);
          this.particles.push(bubble);
        }
      });
    }

    destroy() {
      this.particles.forEach(particle => particle.destroy());
      this.particles = [];
      this.isInitialized = false;
    }

    pause() {
      Object.values(this.containers).forEach(container => {
        if (container) {
          container.style.animationPlayState = 'paused';
        }
      });
    }

    resume() {
      Object.values(this.containers).forEach(container => {
        if (container) {
          container.style.animationPlayState = 'running';
        }
      });
    }
  }

  // ========================================
  // Interactive Bubble Effect
  // ========================================
  class InteractiveBubbles {
    constructor(container) {
      this.container = container;
      this.bubbles = [];
      this.maxBubbles = 10;
      this.init();
    }

    init() {
      this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
      this.container.addEventListener('click', (e) => this.onClick(e));
    }

    onMouseMove(e) {
      if (Math.random() > 0.9) {
        this.createBubble(e.clientX, e.clientY);
      }
    }

    onClick(e) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const offsetX = random(-20, 20);
          const offsetY = random(-20, 20);
          this.createBubble(e.clientX + offsetX, e.clientY + offsetY);
        }, i * 50);
      }
    }

    createBubble(x, y) {
      if (this.bubbles.length >= this.maxBubbles) {
        const oldBubble = this.bubbles.shift();
        if (oldBubble && oldBubble.parentNode) {
          oldBubble.parentNode.removeChild(oldBubble);
        }
      }

      const bubble = document.createElement('div');
      bubble.className = 'interactive-bubble';

      const size = random(8, 16);

      bubble.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        left: ${x - size / 2}px;
        top: ${y - size / 2}px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, rgba(212, 168, 83, 0.6), rgba(212, 168, 83, 0.2));
        pointer-events: none;
        z-index: 9999;
        animation: interactiveBubbleRise 2s ease-out forwards;
      `;

      document.body.appendChild(bubble);
      this.bubbles.push(bubble);

      setTimeout(() => {
        if (bubble && bubble.parentNode) {
          bubble.parentNode.removeChild(bubble);
          const index = this.bubbles.indexOf(bubble);
          if (index > -1) {
            this.bubbles.splice(index, 1);
          }
        }
      }, 2000);
    }
  }

  // ========================================
  // Add Interactive Bubble Animation
  // ========================================
  const interactiveBubbleStyle = document.createElement('style');
  interactiveBubbleStyle.textContent = `
    @keyframes interactiveBubbleRise {
      0% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateY(-100px) scale(0.5);
      }
    }
  `;
  document.head.appendChild(interactiveBubbleStyle);

  // ========================================
  // Initialize
  // ========================================
  const particleSystem = new ParticleSystem();

  function initBubbleParticles() {
    particleSystem.init();
  }

  function initHopParticles() {
    // Hops are already initialized in particleSystem.init()
  }

  function initInteractiveBubbles() {
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      new InteractiveBubbles(heroSection);
    }
  }

  // ========================================
  // Visibility API - Pause when not visible
  // ========================================
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      particleSystem.pause();
    } else {
      particleSystem.resume();
    }
  });

  // ========================================
  // Export
  // ========================================
  window.initBubbleParticles = initBubbleParticles;
  window.initHopParticles = initHopParticles;
  window.initInteractiveBubbles = initInteractiveBubbles;
  window.particleSystem = particleSystem;

  // Auto-initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initBubbleParticles();
      initInteractiveBubbles();
    });
  } else {
    initBubbleParticles();
    initInteractiveBubbles();
  }

})();
