/**
 * SANGAKU BEER - Main JavaScript
 * Premium Landing Page
 */

(function() {
  'use strict';

  // ========================================
  // Configuration
  // ========================================
  const CONFIG = {
    ageGateKey: 'sangaku_age_verified',
    loadingDuration: 3000,
    scrollOffset: 80,
    animationThreshold: 0.15
  };

  // ========================================
  // Flavor Wheel Data
  // ========================================
  const FLAVOR_PROFILES = {
    'mine-no-shizuku': {
      bitter: 80,
      hoppy: 90,
      fruity: 70,
      sweet: 30,
      malty: 40,
      roasted: 20,
      spicy: 25,
      floral: 60
    },
    'yama-no-megumi': {
      bitter: 45,
      hoppy: 50,
      fruity: 30,
      sweet: 25,
      malty: 55,
      roasted: 10,
      spicy: 20,
      floral: 40
    },
    'shinrin-kokyu': {
      bitter: 20,
      hoppy: 25,
      fruity: 75,
      sweet: 60,
      malty: 50,
      roasted: 5,
      spicy: 70,
      floral: 35
    },
    'kumo-no-ue': {
      bitter: 50,
      hoppy: 30,
      fruity: 20,
      sweet: 45,
      malty: 80,
      roasted: 95,
      spicy: 15,
      floral: 10
    }
  };

  // ========================================
  // Tour Hotspot Data
  // ========================================
  const TOUR_INFO = {
    entrance: {
      title: 'エントランス',
      text: '北アルプスを望むエントランス。季節の花々がお出迎えします。醸造所見学の受付もこちらで行っています。'
    },
    tanks: {
      title: '発酵タンク',
      text: 'ドイツ製の発酵タンクを8基設置。温度管理はすべてコンピューター制御で、最適な発酵環境を24時間維持しています。'
    },
    brewing: {
      title: '仕込み室',
      text: '麦汁を煮沸し、ホップを投入する心臓部。ステンレス製の美しい設備が並びます。見学時には仕込み工程をご覧いただけます。'
    },
    taproom: {
      title: 'タップルーム',
      text: '出来たてのビールを楽しめるタップルーム。北アルプスの景色を眺めながら、最大8種類のビールをお楽しみいただけます。'
    }
  };

  // ========================================
  // State Management
  // ========================================
  const state = {
    ageVerified: false,
    loadingComplete: false,
    currentBrewingStep: 1,
    currentBeer: 'mine-no-shizuku'
  };

  // ========================================
  // DOM Elements
  // ========================================
  const elements = {
    ageGate: null,
    ageYesBtn: null,
    ageNoBtn: null,
    loadingScreen: null,
    loadingPercentage: null,
    beerLiquid: null,
    beerFoam: null,
    mainContent: null,
    nav: null,
    navToggle: null,
    navMenu: null,
    brewingSteps: null,
    brewingDots: null,
    brewingPrevBtn: null,
    brewingNextBtn: null,
    brewingProgressBar: null,
    tastingBtns: null,
    flavorPolygon: null,
    tastingDetails: null,
    tourHotspots: null,
    tourInfoPanel: null,
    productsScroll: null
  };

  // ========================================
  // Initialize
  // ========================================
  function init() {
    cacheElements();
    checkAgeVerification();
    bindEvents();
  }

  function cacheElements() {
    elements.ageGate = document.getElementById('age-gate');
    elements.ageYesBtn = document.getElementById('age-yes');
    elements.ageNoBtn = document.getElementById('age-no');
    elements.loadingScreen = document.getElementById('loading-screen');
    elements.loadingPercentage = document.querySelector('.loading__percentage');
    elements.beerLiquid = document.querySelector('.beer-glass__liquid');
    elements.beerFoam = document.querySelector('.beer-glass__foam');
    elements.mainContent = document.getElementById('main-content');
    elements.nav = document.getElementById('main-nav');
    elements.navToggle = document.getElementById('nav-toggle');
    elements.navMenu = document.getElementById('nav-menu');
    elements.brewingSteps = document.querySelectorAll('.brewing__step');
    elements.brewingDots = document.querySelectorAll('.brewing__dot');
    elements.brewingPrevBtn = document.querySelector('.brewing__nav-btn--prev');
    elements.brewingNextBtn = document.querySelector('.brewing__nav-btn--next');
    elements.brewingProgressBar = document.querySelector('.brewing__progress-bar');
    elements.tastingBtns = document.querySelectorAll('.tasting__beer-btn');
    elements.flavorPolygon = document.getElementById('flavor-polygon');
    elements.tastingDetails = document.getElementById('tasting-details');
    elements.tourHotspots = document.querySelectorAll('.tour__hotspot');
    elements.tourInfoPanel = document.getElementById('tour-info');
    elements.productsScroll = document.getElementById('products-scroll');
  }

  // ========================================
  // Age Gate
  // ========================================
  function checkAgeVerification() {
    const verified = localStorage.getItem(CONFIG.ageGateKey);
    if (verified === 'true') {
      state.ageVerified = true;
      hideAgeGate();
      startLoading();
    }
  }

  function verifyAge() {
    state.ageVerified = true;
    localStorage.setItem(CONFIG.ageGateKey, 'true');
    hideAgeGate();
    startLoading();
  }

  function denyAge() {
    window.location.href = 'https://www.google.com';
  }

  function hideAgeGate() {
    if (elements.ageGate) {
      elements.ageGate.classList.add('hidden');
    }
  }

  // ========================================
  // Loading Animation
  // ========================================
  function startLoading() {
    let progress = 0;
    const duration = CONFIG.loadingDuration;
    const startTime = Date.now();

    function updateProgress() {
      const elapsed = Date.now() - startTime;
      progress = Math.min((elapsed / duration) * 100, 100);

      if (elements.loadingPercentage) {
        elements.loadingPercentage.textContent = Math.floor(progress);
      }

      if (elements.beerLiquid) {
        elements.beerLiquid.style.height = `${progress * 0.8}%`;
      }

      if (progress >= 70 && elements.beerFoam) {
        elements.beerFoam.classList.add('visible');
      }

      if (progress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        completeLoading();
      }
    }

    requestAnimationFrame(updateProgress);
  }

  function completeLoading() {
    state.loadingComplete = true;

    setTimeout(() => {
      if (elements.loadingScreen) {
        elements.loadingScreen.classList.add('hidden');
      }
      if (elements.mainContent) {
        elements.mainContent.style.display = 'block';
        document.body.classList.remove('no-scroll');
      }

      initializeComponents();
      initScrollAnimations();
      initParticles();
    }, 500);
  }

  // ========================================
  // Event Bindings
  // ========================================
  function bindEvents() {
    if (elements.ageYesBtn) {
      elements.ageYesBtn.addEventListener('click', verifyAge);
    }

    if (elements.ageNoBtn) {
      elements.ageNoBtn.addEventListener('click', denyAge);
    }

    if (elements.navToggle) {
      elements.navToggle.addEventListener('click', toggleNav);
    }

    if (elements.navMenu) {
      elements.navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          closeNav();
        });
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleSmoothScroll);
    });

    if (elements.brewingPrevBtn) {
      elements.brewingPrevBtn.addEventListener('click', () => navigateBrewingStep(-1));
    }

    if (elements.brewingNextBtn) {
      elements.brewingNextBtn.addEventListener('click', () => navigateBrewingStep(1));
    }

    if (elements.brewingDots) {
      elements.brewingDots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToBrewingStep(index + 1));
      });
    }

    if (elements.tastingBtns) {
      elements.tastingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const beer = btn.dataset.beer;
          selectBeer(beer);
        });
      });
    }

    if (elements.tourHotspots) {
      elements.tourHotspots.forEach(hotspot => {
        hotspot.addEventListener('click', () => {
          const spot = hotspot.dataset.spot;
          showTourInfo(spot);
        });
      });
    }

    const tourInfoClose = document.querySelector('.tour__info-close');
    if (tourInfoClose) {
      tourInfoClose.addEventListener('click', hideTourInfo);
    }

    document.querySelectorAll('.product-card__btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const flavor = btn.dataset.flavor;
        if (flavor) {
          scrollToTasting(flavor);
        }
      });
    });

    initImageLazyLoad();
  }

  // ========================================
  // Navigation
  // ========================================
  function toggleNav() {
    elements.navToggle.classList.toggle('active');
    elements.navMenu.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
  }

  function closeNav() {
    elements.navToggle.classList.remove('active');
    elements.navMenu.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  function handleScroll() {
    const scrollY = window.scrollY;

    if (elements.nav) {
      if (scrollY > 100) {
        elements.nav.classList.add('scrolled');
      } else {
        elements.nav.classList.remove('scrolled');
      }
    }

    updateParallax(scrollY);
  }

  function handleSmoothScroll(e) {
    const href = e.currentTarget.getAttribute('href');
    if (href.startsWith('#') && href.length > 1) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const top = target.offsetTop - CONFIG.scrollOffset;
        window.scrollTo({
          top,
          behavior: 'smooth'
        });
      }
    }
  }

  // ========================================
  // Parallax Effect
  // ========================================
  function updateParallax(scrollY) {
    const parallaxLayers = document.querySelectorAll('.parallax-layer');
    parallaxLayers.forEach(layer => {
      const speed = parseFloat(layer.dataset.speed) || 0.5;
      const yPos = scrollY * speed;
      layer.style.transform = `translateY(${yPos}px)`;
    });
  }

  // ========================================
  // Brewing Process
  // ========================================
  function navigateBrewingStep(direction) {
    const newStep = state.currentBrewingStep + direction;
    if (newStep >= 1 && newStep <= 6) {
      goToBrewingStep(newStep);
    }
  }

  function goToBrewingStep(step) {
    state.currentBrewingStep = step;

    elements.brewingSteps.forEach((stepEl, index) => {
      if (index + 1 === step) {
        stepEl.classList.add('active');
      } else {
        stepEl.classList.remove('active');
      }
    });

    elements.brewingDots.forEach((dot, index) => {
      if (index + 1 === step) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    if (elements.brewingProgressBar) {
      const progress = (step / 6) * 100;
      elements.brewingProgressBar.style.width = `${progress}%`;
    }
  }

  // ========================================
  // Flavor Wheel
  // ========================================
  function selectBeer(beerId) {
    state.currentBeer = beerId;

    elements.tastingBtns.forEach(btn => {
      if (btn.dataset.beer === beerId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    updateFlavorWheel(beerId);
    updateTastingDetails(beerId);
  }

  function updateFlavorWheel(beerId) {
    const profile = FLAVOR_PROFILES[beerId];
    if (!profile || !elements.flavorPolygon) return;

    const centerX = 200;
    const centerY = 200;
    const maxRadius = 180;

    const flavors = ['bitter', 'hoppy', 'fruity', 'sweet', 'malty', 'roasted', 'spicy', 'floral'];
    const angleStep = (2 * Math.PI) / flavors.length;
    const startAngle = -Math.PI / 2;

    const points = flavors.map((flavor, index) => {
      const value = profile[flavor] / 100;
      const radius = value * maxRadius;
      const angle = startAngle + index * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    });

    elements.flavorPolygon.setAttribute('points', points.join(' '));

    document.querySelectorAll('.wheel__point').forEach((point, index) => {
      const value = profile[flavors[index]] / 100;
      const radius = value * maxRadius;
      const angle = startAngle + index * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      point.setAttribute('cx', x);
      point.setAttribute('cy', y);
    });
  }

  function updateTastingDetails(beerId) {
    const cards = document.querySelectorAll('.tasting__detail-card');
    cards.forEach(card => {
      if (card.dataset.beer === beerId) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  function scrollToTasting(flavor) {
    const tastingSection = document.getElementById('tasting');
    if (tastingSection) {
      selectBeer(flavor);
      const top = tastingSection.offsetTop - CONFIG.scrollOffset;
      window.scrollTo({
        top,
        behavior: 'smooth'
      });
    }
  }

  // ========================================
  // Virtual Tour
  // ========================================
  function showTourInfo(spot) {
    const info = TOUR_INFO[spot];
    if (!info || !elements.tourInfoPanel) return;

    const titleEl = elements.tourInfoPanel.querySelector('.tour__info-title');
    const textEl = elements.tourInfoPanel.querySelector('.tour__info-text');

    if (titleEl) titleEl.textContent = info.title;
    if (textEl) textEl.textContent = info.text;

    elements.tourInfoPanel.classList.add('visible');
  }

  function hideTourInfo() {
    if (elements.tourInfoPanel) {
      elements.tourInfoPanel.classList.remove('visible');
    }
  }

  // ========================================
  // Counter Animation
  // ========================================
  function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');

    counters.forEach(counter => {
      const target = parseInt(counter.dataset.count, 10);
      const duration = 2000;
      let startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        counter.textContent = Math.floor(easeOutQuart * target);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    });
  }

  // ========================================
  // Image Lazy Loading
  // ========================================
  function initImageLazyLoad() {
    const images = document.querySelectorAll('img');

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    }, { threshold: 0.1 });

    images.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });
        imageObserver.observe(img);
      }
    });
  }

  // ========================================
  // Initialize Components
  // ========================================
  function initializeComponents() {
    goToBrewingStep(1);
    selectBeer('mine-no-shizuku');
    initHorizontalScroll();
    initMapInteractions();
  }

  function initHorizontalScroll() {
    if (!elements.productsScroll) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    elements.productsScroll.addEventListener('mousedown', (e) => {
      isDown = true;
      elements.productsScroll.classList.add('active');
      startX = e.pageX - elements.productsScroll.offsetLeft;
      scrollLeft = elements.productsScroll.scrollLeft;
    });

    elements.productsScroll.addEventListener('mouseleave', () => {
      isDown = false;
      elements.productsScroll.classList.remove('active');
    });

    elements.productsScroll.addEventListener('mouseup', () => {
      isDown = false;
      elements.productsScroll.classList.remove('active');
    });

    elements.productsScroll.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - elements.productsScroll.offsetLeft;
      const walk = (x - startX) * 2;
      elements.productsScroll.scrollLeft = scrollLeft - walk;
    });
  }

  function initMapInteractions() {
    const mapPins = document.querySelectorAll('.map__pin');

    mapPins.forEach(pin => {
      pin.addEventListener('mouseenter', () => {
        pin.classList.add('active');
      });

      pin.addEventListener('mouseleave', () => {
        pin.classList.remove('active');
      });
    });
  }

  // ========================================
  // Scroll Animations
  // ========================================
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');

          if (entry.target.closest('.awards__stats')) {
            animateCounters();
          }

          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: CONFIG.animationThreshold,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => {
      observer.observe(el);
    });
  }

  // ========================================
  // Particles
  // ========================================
  function initParticles() {
    if (typeof window.initBubbleParticles === 'function') {
      window.initBubbleParticles();
    }
    if (typeof window.initHopParticles === 'function') {
      window.initHopParticles();
    }
  }

  // ========================================
  // DOMContentLoaded
  // ========================================
  document.addEventListener('DOMContentLoaded', init);

  // ========================================
  // Expose public API
  // ========================================
  window.SangakuBeer = {
    selectBeer,
    goToBrewingStep,
    showTourInfo,
    hideTourInfo
  };

})();
