/**
 * NEON GENESIS LIVE 2026
 * Interactive JavaScript
 */

(function() {
  'use strict';

  // ==============================
  // Custom Cursor
  // ==============================
  function initCustomCursor() {
    const cursor = document.getElementById('cursorGlow');
    if (!cursor || window.innerWidth < 768) return;

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth cursor animation
    function animateCursor() {
      const dx = mouseX - cursorX;
      const dy = mouseY - cursorY;
      cursorX += dx * 0.15;
      cursorY += dy * 0.15;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover effect on interactive elements
    const hoverElements = document.querySelectorAll('a, button, .goods-card, .ticket-card');
    hoverElements.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }

  // ==============================
  // Particles Background
  // ==============================
  function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 60;
    const colors = ['#00f0ff', '#ff00ff', '#ffff00', '#ff3366'];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');

      const size = Math.random() * 4 + 1;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const duration = Math.random() * 20 + 15;
      const delay = Math.random() * 20;

      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${left}%;
        animation-duration: ${duration}s;
        animation-delay: -${delay}s;
        box-shadow: 0 0 ${size * 2}px ${color};
      `;

      container.appendChild(particle);
    }
  }

  // ==============================
  // Header Scroll
  // ==============================
  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScrollY = 0;

    function updateHeader() {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 100) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
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
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('is-active');
      mobileMenu.classList.toggle('is-open');
      document.body.style.overflow = mobileMenu.classList.contains('is-open') ? 'hidden' : '';
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-active');
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  // ==============================
  // Countdown Timer
  // ==============================
  function initCountdown() {
    const countdown = document.getElementById('countdown');
    if (!countdown) return;

    const targetDate = new Date(countdown.dataset.target || '2026-03-15T17:00:00+09:00').getTime();

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    function updateCountdown() {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Animate number change
      animateNumber(daysEl, days);
      animateNumber(hoursEl, hours);
      animateNumber(minutesEl, minutes);
      animateNumber(secondsEl, seconds);
    }

    function animateNumber(el, value) {
      const newValue = value.toString().padStart(2, '0');
      if (el.textContent !== newValue) {
        el.style.transform = 'scale(1.1)';
        el.textContent = newValue;
        setTimeout(() => {
          el.style.transform = 'scale(1)';
        }, 100);
      }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // ==============================
  // Scroll Animations
  // ==============================
  function initScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, parseInt(delay));
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }

  // ==============================
  // Smooth Scroll
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
  // Product Modal
  // ==============================
  function initProductModal() {
    const modal = document.getElementById('productModal');
    if (!modal) return;

    const backdrop = modal.querySelector('.modal__backdrop');
    const closeBtn = modal.querySelector('.modal__close');
    const detailBtns = document.querySelectorAll('.goods-detail-btn');

    // Product data
    const products = {
      1: {
        icon: '&#128085;',
        name: 'NEON GENESIS Tシャツ',
        desc: 'サイバーパンクデザインの公式Tシャツ。バックにはツアーロゴをプリント。',
        price: '¥4,500',
        details: '<p>サイズ: S / M / L / XL / XXL</p><p>カラー: ブラック / ホワイト</p><p>素材: 綿100%</p>'
      },
      2: {
        icon: '&#128294;',
        name: '限定ペンライト',
        desc: '24色切替・ライブ連動機能付きの高機能ペンライト。',
        price: '¥3,500',
        details: '<p>サイズ: 約25cm</p><p>電池: 単4×3本（別売）</p><p>Bluetooth連動対応</p>'
      },
      3: {
        icon: '&#127942;',
        name: 'アクリルスタンド',
        desc: '全高約15cm・LEDベース付きのコレクターズアイテム。',
        price: '¥1,800',
        details: '<p>サイズ: 約H150×W100mm</p><p>LEDベース: USB給電</p><p>3色発光対応</p>'
      },
      4: {
        icon: '&#129507;',
        name: 'マフラータオル',
        desc: '今治産・ネオンカラー刺繍入りの高品質タオル。',
        price: '¥2,500',
        details: '<p>サイズ: 約110×20cm</p><p>素材: 綿100%（今治製）</p><p>刺繍: ネオンカラー糸</p>'
      },
      5: {
        icon: '&#128191;',
        name: '限定CD「NEON TRACKS」',
        desc: '会場限定リミックス収録のスペシャルCD。',
        price: '¥3,000',
        details: '<p>収録曲: 全10曲</p><p>特典: ブックレット付き</p><p>会場限定リミックス3曲収録</p>'
      },
      6: {
        icon: '&#128308;',
        name: '缶バッジセット',
        desc: '5種セット・ランダムシークレット1種付き。',
        price: '¥1,200',
        details: '<p>サイズ: 直径44mm</p><p>内容: 5種+シークレット1種</p><p>全6種コンプリート可能</p>'
      },
      7: {
        icon: '&#128196;',
        name: 'クリアファイルセット',
        desc: 'A4サイズ・3枚セットのクリアファイル。',
        price: '¥800',
        details: '<p>サイズ: A4</p><p>内容: 3枚セット</p><p>デザイン: ライブビジュアル</p>'
      },
      8: {
        icon: '&#127873;',
        name: 'VIP限定グッズBOX',
        desc: '限定100セット・シリアルナンバー入りの豪華BOX。',
        price: '¥15,000',
        details: '<p>内容物:</p><p>・限定Tシャツ</p><p>・サイン入りポスター</p><p>・記念メダル</p><p>・特製ケース</p><p>・シリアルナンバーカード</p>'
      }
    };

    function openModal(productId) {
      const product = products[productId];
      if (!product) return;

      document.getElementById('modalIcon').innerHTML = product.icon;
      document.getElementById('modalTitle').textContent = product.name;
      document.getElementById('modalDesc').textContent = product.desc;
      document.getElementById('modalPrice').textContent = product.price;
      document.getElementById('modalDetails').innerHTML = product.details;

      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    detailBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = btn.dataset.product;
        openModal(productId);
      });
    });

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  // ==============================
  // Glitch Effect on Hover
  // ==============================
  function initGlitchEffect() {
    const glitchElements = document.querySelectorAll('.glitch');

    glitchElements.forEach(el => {
      const text = el.textContent || el.innerText;
      el.setAttribute('data-text', text);
    });
  }

  // ==============================
  // 3D Card Tilt Effect
  // ==============================
  function initCardTilt() {
    const cards = document.querySelectorAll('.goods-card, .ticket-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ==============================
  // Audio Visualizer Animation (Fake)
  // ==============================
  function initEqualizer() {
    const equalizer = document.querySelector('.equalizer');
    if (!equalizer) return;

    const bars = equalizer.querySelectorAll('span');

    function animateBars() {
      bars.forEach(bar => {
        const height = Math.random() * 50 + 10;
        bar.style.height = height + 'px';
      });
    }

    // Random animation every 100ms for more dynamic feel
    setInterval(animateBars, 150);
  }

  // ==============================
  // Typing Effect for CTA
  // ==============================
  function initTypingEffect() {
    const ctaTitle = document.querySelector('.cta__title');
    if (!ctaTitle) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        ctaTitle.classList.add('typing');
        observer.unobserve(ctaTitle);
      }
    }, { threshold: 0.5 });

    observer.observe(ctaTitle);
  }

  // ==============================
  // Neon Flicker Effect
  // ==============================
  function initNeonFlicker() {
    const neonElements = document.querySelectorAll('.neon-text');

    function flicker(el) {
      const flickerDelay = Math.random() * 5000 + 3000;

      setTimeout(() => {
        el.style.opacity = '0.8';
        setTimeout(() => {
          el.style.opacity = '1';
          setTimeout(() => {
            el.style.opacity = '0.9';
            setTimeout(() => {
              el.style.opacity = '1';
              flicker(el);
            }, 50);
          }, 50);
        }, 50);
      }, flickerDelay);
    }

    neonElements.forEach(el => {
      el.style.transition = 'opacity 0.05s';
      flicker(el);
    });
  }

  // ==============================
  // Initialize All
  // ==============================
  function init() {
    initCustomCursor();
    initParticles();
    initHeaderScroll();
    initMobileMenu();
    initCountdown();
    initScrollAnimations();
    initSmoothScroll();
    initProductModal();
    initGlitchEffect();
    initCardTilt();
    initEqualizer();
    initTypingEffect();
    initNeonFlicker();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
