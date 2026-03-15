/**
 * POWER FIT - Premium LP
 * Gold Particle Effects
 */

class ParticleSystem {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.getElementById(container)
      : container;

    if (!this.container) return;

    this.options = {
      particleCount: options.particleCount || 50,
      colors: options.colors || ['#D4AF37', '#E5C158', '#FFD700', '#B8960C'],
      minSize: options.minSize || 2,
      maxSize: options.maxSize || 6,
      minSpeed: options.minSpeed || 0.5,
      maxSpeed: options.maxSpeed || 2,
      minOpacity: options.minOpacity || 0.3,
      maxOpacity: options.maxOpacity || 0.8,
      direction: options.direction || 'up', // 'up', 'down', 'left', 'right', 'random'
      glow: options.glow !== undefined ? options.glow : true,
      interactive: options.interactive !== undefined ? options.interactive : false,
      respawnOnExit: options.respawnOnExit !== undefined ? options.respawnOnExit : true
    };

    this.particles = [];
    this.animationId = null;
    this.isRunning = false;
    this.mouseX = 0;
    this.mouseY = 0;

    this.init();
  }

  init() {
    // Set container styles
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.overflow = 'hidden';
    this.container.style.pointerEvents = 'none';

    // Create particles
    for (let i = 0; i < this.options.particleCount; i++) {
      this.createParticle();
    }

    // Add mouse interaction if enabled
    if (this.options.interactive) {
      this.container.style.pointerEvents = 'auto';
      this.container.addEventListener('mousemove', (e) => {
        const rect = this.container.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
      });
    }

    // Start animation
    this.start();

    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    });
  }

  createParticle(atPosition = null) {
    const particle = document.createElement('div');
    const size = this.randomBetween(this.options.minSize, this.options.maxSize);
    const color = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
    const opacity = this.randomBetween(this.options.minOpacity, this.options.maxOpacity);

    // Particle styles
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border-radius: 50%;
      opacity: ${opacity};
      pointer-events: none;
      will-change: transform, opacity;
      ${this.options.glow ? `box-shadow: 0 0 ${size * 2}px ${color};` : ''}
    `;

    // Initial position
    const containerRect = this.container.getBoundingClientRect();
    let x, y;

    if (atPosition) {
      x = atPosition.x;
      y = atPosition.y;
    } else {
      x = Math.random() * containerRect.width;
      y = this.getInitialY(containerRect.height);
    }

    // Particle data
    const particleData = {
      element: particle,
      x: x,
      y: y,
      size: size,
      color: color,
      opacity: opacity,
      speed: this.randomBetween(this.options.minSpeed, this.options.maxSpeed),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: this.randomBetween(0.01, 0.05),
      wobbleAmplitude: this.randomBetween(10, 30)
    };

    this.particles.push(particleData);
    this.container.appendChild(particle);

    return particleData;
  }

  getInitialY(containerHeight) {
    switch (this.options.direction) {
      case 'up':
        return containerHeight + Math.random() * 100;
      case 'down':
        return -Math.random() * 100;
      default:
        return Math.random() * containerHeight;
    }
  }

  updateParticle(particle) {
    const containerRect = this.container.getBoundingClientRect();

    // Update wobble
    particle.wobble += particle.wobbleSpeed;

    // Calculate movement
    const wobbleX = Math.sin(particle.wobble) * particle.wobbleAmplitude;

    switch (this.options.direction) {
      case 'up':
        particle.y -= particle.speed;
        particle.x += Math.sin(particle.wobble) * 0.5;
        break;
      case 'down':
        particle.y += particle.speed;
        particle.x += Math.sin(particle.wobble) * 0.5;
        break;
      case 'left':
        particle.x -= particle.speed;
        particle.y += Math.sin(particle.wobble) * 0.5;
        break;
      case 'right':
        particle.x += particle.speed;
        particle.y += Math.sin(particle.wobble) * 0.5;
        break;
      case 'random':
        particle.x += Math.cos(particle.wobble) * particle.speed;
        particle.y += Math.sin(particle.wobble) * particle.speed;
        break;
    }

    // Interactive: particles avoid mouse
    if (this.options.interactive) {
      const dx = particle.x - this.mouseX;
      const dy = particle.y - this.mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 100;

      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        particle.x += (dx / distance) * force * 5;
        particle.y += (dy / distance) * force * 5;
      }
    }

    // Check bounds and respawn
    const isOutOfBounds = this.isOutOfBounds(particle, containerRect);

    if (isOutOfBounds && this.options.respawnOnExit) {
      this.resetParticle(particle, containerRect);
    }

    // Apply transform
    particle.element.style.transform = `translate3d(${particle.x}px, ${particle.y}px, 0)`;

    // Fade based on position
    const fadeZone = containerRect.height * 0.2;
    let newOpacity = particle.opacity;

    if (this.options.direction === 'up') {
      if (particle.y < fadeZone) {
        newOpacity = (particle.y / fadeZone) * particle.opacity;
      }
    } else if (this.options.direction === 'down') {
      if (particle.y > containerRect.height - fadeZone) {
        newOpacity = ((containerRect.height - particle.y) / fadeZone) * particle.opacity;
      }
    }

    particle.element.style.opacity = Math.max(0, newOpacity);
  }

  isOutOfBounds(particle, containerRect) {
    const margin = particle.size * 2;

    switch (this.options.direction) {
      case 'up':
        return particle.y < -margin;
      case 'down':
        return particle.y > containerRect.height + margin;
      case 'left':
        return particle.x < -margin;
      case 'right':
        return particle.x > containerRect.width + margin;
      default:
        return particle.x < -margin ||
               particle.x > containerRect.width + margin ||
               particle.y < -margin ||
               particle.y > containerRect.height + margin;
    }
  }

  resetParticle(particle, containerRect) {
    switch (this.options.direction) {
      case 'up':
        particle.x = Math.random() * containerRect.width;
        particle.y = containerRect.height + particle.size;
        break;
      case 'down':
        particle.x = Math.random() * containerRect.width;
        particle.y = -particle.size;
        break;
      case 'left':
        particle.x = containerRect.width + particle.size;
        particle.y = Math.random() * containerRect.height;
        break;
      case 'right':
        particle.x = -particle.size;
        particle.y = Math.random() * containerRect.height;
        break;
      default:
        particle.x = Math.random() * containerRect.width;
        particle.y = Math.random() * containerRect.height;
    }

    particle.wobble = Math.random() * Math.PI * 2;
    particle.speed = this.randomBetween(this.options.minSpeed, this.options.maxSpeed);
  }

  animate() {
    if (!this.isRunning) return;

    this.particles.forEach(particle => {
      this.updateParticle(particle);
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stop();
    this.particles.forEach(particle => {
      particle.element.remove();
    });
    this.particles = [];
  }

  randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }
}

/**
 * Sparkle Effect (for buttons and interactive elements)
 */
class SparkleEffect {
  constructor(element, options = {}) {
    this.element = typeof element === 'string'
      ? document.querySelector(element)
      : element;

    if (!this.element) return;

    this.options = {
      particleCount: options.particleCount || 10,
      colors: options.colors || ['#D4AF37', '#FFD700', '#E5C158'],
      duration: options.duration || 600,
      spread: options.spread || 50
    };

    this.init();
  }

  init() {
    this.element.style.position = 'relative';
    this.element.style.overflow = 'hidden';

    this.element.addEventListener('click', (e) => {
      this.createSparkle(e);
    });
  }

  createSparkle(event) {
    const rect = this.element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let i = 0; i < this.options.particleCount; i++) {
      this.createSparkleParticle(x, y);
    }
  }

  createSparkleParticle(x, y) {
    const particle = document.createElement('div');
    const size = 3 + Math.random() * 5;
    const color = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
    const angle = Math.random() * Math.PI * 2;
    const velocity = 50 + Math.random() * this.options.spread;
    const endX = x + Math.cos(angle) * velocity;
    const endY = y + Math.sin(angle) * velocity;

    particle.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
      box-shadow: 0 0 ${size * 2}px ${color};
    `;

    this.element.appendChild(particle);

    // Animate
    particle.animate([
      {
        transform: 'translate(0, 0) scale(1)',
        opacity: 1
      },
      {
        transform: `translate(${endX - x}px, ${endY - y}px) scale(0)`,
        opacity: 0
      }
    ], {
      duration: this.options.duration,
      easing: 'cubic-bezier(0, 0.5, 0.5, 1)'
    }).onfinish = () => {
      particle.remove();
    };
  }
}

/**
 * Mouse Trail Effect
 */
class MouseTrail {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.getElementById(container)
      : container || document.body;

    this.options = {
      particleCount: options.particleCount || 20,
      color: options.color || '#D4AF37',
      size: options.size || 8,
      fadeTime: options.fadeTime || 500
    };

    this.particles = [];
    this.mouseX = 0;
    this.mouseY = 0;

    this.init();
  }

  init() {
    // Create particle pool
    for (let i = 0; i < this.options.particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'mouse-trail-particle';
      particle.style.cssText = `
        position: fixed;
        width: ${this.options.size}px;
        height: ${this.options.size}px;
        background-color: ${this.options.color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        opacity: 0;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 ${this.options.size}px ${this.options.color};
        transition: opacity ${this.options.fadeTime}ms ease;
      `;

      document.body.appendChild(particle);
      this.particles.push({
        element: particle,
        x: 0,
        y: 0,
        active: false
      });
    }

    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.spawnParticle();
    });
  }

  spawnParticle() {
    // Find inactive particle
    const particle = this.particles.find(p => !p.active);
    if (!particle) return;

    particle.active = true;
    particle.x = this.mouseX;
    particle.y = this.mouseY;

    particle.element.style.left = `${particle.x}px`;
    particle.element.style.top = `${particle.y}px`;
    particle.element.style.opacity = '1';

    setTimeout(() => {
      particle.element.style.opacity = '0';

      setTimeout(() => {
        particle.active = false;
      }, this.options.fadeTime);
    }, 50);
  }
}

// Initialize particle systems when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Loading screen particles
  const loadingParticles = document.getElementById('loadingParticles');
  if (loadingParticles) {
    new ParticleSystem(loadingParticles, {
      particleCount: 30,
      direction: 'up',
      minSpeed: 0.5,
      maxSpeed: 1.5,
      glow: true
    });
  }

  // Hero particles
  const heroParticles = document.getElementById('heroParticles');
  if (heroParticles) {
    new ParticleSystem(heroParticles, {
      particleCount: 40,
      direction: 'up',
      minSpeed: 0.3,
      maxSpeed: 1,
      minSize: 2,
      maxSize: 5,
      glow: true
    });
  }

  // Solution section particles
  const solutionParticles = document.getElementById('solutionParticles');
  if (solutionParticles) {
    new ParticleSystem(solutionParticles, {
      particleCount: 25,
      direction: 'up',
      minSpeed: 0.2,
      maxSpeed: 0.8,
      glow: true
    });
  }

  // Stats section particles
  const statsParticles = document.getElementById('statsParticles');
  if (statsParticles) {
    new ParticleSystem(statsParticles, {
      particleCount: 30,
      direction: 'up',
      minSpeed: 0.3,
      maxSpeed: 1,
      glow: true
    });
  }

  // Final CTA particles
  const finalCtaParticles = document.getElementById('finalCtaParticles');
  if (finalCtaParticles) {
    new ParticleSystem(finalCtaParticles, {
      particleCount: 35,
      direction: 'up',
      minSpeed: 0.2,
      maxSpeed: 0.7,
      glow: true
    });
  }

  // Add sparkle effect to gold buttons
  const goldButtons = document.querySelectorAll('.btn--gold');
  goldButtons.forEach(btn => {
    new SparkleEffect(btn, {
      particleCount: 12,
      spread: 60
    });
  });
});

// Export for external use
window.ParticleSystem = ParticleSystem;
window.SparkleEffect = SparkleEffect;
window.MouseTrail = MouseTrail;
