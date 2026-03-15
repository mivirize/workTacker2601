/**
 * POWER FIT - Premium LP
 * Main JavaScript Entry Point
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  initLoading();
  initNavigation();
  initCustomCursor();
  initProgressBar();
  initSmoothScroll();
  initMagneticButtons();
  initFAQ();
  initPricingTabs();
  initContactForm();
  initParallax();
});

/**
 * Loading Screen
 */
function initLoading() {
  const loadingScreen = document.getElementById('loadingScreen');
  const loadingProgress = document.getElementById('loadingProgress');
  const loadingPercentage = document.getElementById('loadingPercentage');

  if (!loadingScreen) return;

  document.body.classList.add('loading');

  let progress = 0;
  const duration = 2000;
  const interval = 20;
  const increment = 100 / (duration / interval);

  const timer = setInterval(() => {
    progress += increment + Math.random() * 2;
    if (progress >= 100) {
      progress = 100;
      clearInterval(timer);

      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        document.body.classList.remove('loading');

        // Trigger hero animations
        triggerHeroAnimations();
      }, 500);
    }

    if (loadingProgress) {
      loadingProgress.style.width = `${progress}%`;
    }
    if (loadingPercentage) {
      loadingPercentage.textContent = `${Math.floor(progress)}%`;
    }
  }, interval);
}

/**
 * Hero animations after loading
 */
function triggerHeroAnimations() {
  const heroElements = document.querySelectorAll('.hero .animate-on-scroll');
  heroElements.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add('animated');
    }, index * 150);
  });
}

/**
 * Navigation
 */
function initNavigation() {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav__link');

  if (!nav) return;

  // Scroll behavior
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });

  // Mobile menu toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('open');
      document.body.classList.toggle('nav-open');
    });

    // Close menu on link click
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('open');
        document.body.classList.remove('nav-open');
      });
    });
  }

  // Active link highlighting
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    const scrollPosition = window.pageYOffset + 200;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { passive: true });
}

/**
 * Custom Cursor
 */
function initCustomCursor() {
  const cursor = document.getElementById('cursor');
  const cursorFollower = document.getElementById('cursorFollower');

  if (!cursor || !cursorFollower || window.innerWidth < 1024) return;

  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let followerX = 0;
  let followerY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    // Smooth cursor movement
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;
    followerX += (mouseX - followerX) * 0.1;
    followerY += (mouseY - followerY) * 0.1;

    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
    cursorFollower.style.left = `${followerX}px`;
    cursorFollower.style.top = `${followerY}px`;

    requestAnimationFrame(animate);
  }

  animate();

  // Cursor interactions
  const interactiveElements = document.querySelectorAll('a, button, .magnetic-btn, input, textarea');

  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('active');
    });

    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('active');
    });
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    cursorFollower.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    cursorFollower.style.opacity = '1';
  });
}

/**
 * Progress Bar
 */
function initProgressBar() {
  const progressBar = document.getElementById('progressBar');

  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrolled = window.pageYOffset;
    const progress = (scrolled / documentHeight) * 100;

    progressBar.style.width = `${progress}%`;
  }, { passive: true });
}

/**
 * Smooth Scroll
 */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');

      if (href === '#') {
        e.preventDefault();
        return;
      }

      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();

        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * Magnetic Buttons
 */
function initMagneticButtons() {
  const magneticBtns = document.querySelectorAll('.magnetic-btn');

  if (window.innerWidth < 1024) return;

  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });
}

/**
 * FAQ Accordion
 */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-item__question');

    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all items
        faqItems.forEach(i => i.classList.remove('active'));

        // Open clicked item if it wasn't active
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}

/**
 * Pricing Tabs
 */
function initPricingTabs() {
  const tabs = document.querySelectorAll('.pricing__tab');
  const panels = document.querySelectorAll('.pricing__panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // Update tabs
      tabs.forEach(t => t.classList.remove('pricing__tab--active'));
      tab.classList.add('pricing__tab--active');

      // Update panels
      panels.forEach(panel => {
        panel.classList.remove('pricing__panel--active');
        if (panel.id === `panel-${targetTab}`) {
          panel.classList.add('pricing__panel--active');
        }
      });
    });
  });
}

/**
 * Contact Form
 */
function initContactForm() {
  const form = document.getElementById('contactForm');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Basic validation
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;
        field.style.borderColor = '#ff5f57';
      } else {
        field.style.borderColor = '';
      }
    });

    if (!isValid) {
      return;
    }

    // Simulate form submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.querySelector('.btn__text').textContent;

    submitBtn.disabled = true;
    submitBtn.querySelector('.btn__text').textContent = '送信中...';

    setTimeout(() => {
      submitBtn.querySelector('.btn__text').textContent = '送信完了！';
      submitBtn.style.background = 'linear-gradient(135deg, #28c840, #1fa334)';

      setTimeout(() => {
        form.reset();
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn__text').textContent = originalText;
        submitBtn.style.background = '';
      }, 3000);
    }, 1500);
  });

  // Remove error styling on input
  const inputs = form.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      input.style.borderColor = '';
    });
  });
}

/**
 * Parallax Effect
 */
function initParallax() {
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  if (parallaxElements.length === 0) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;

    parallaxElements.forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.5;
      const offset = scrolled * speed;
      el.style.transform = `translateY(${offset}px)`;
    });
  }, { passive: true });
}

/**
 * Utility: Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Utility: Throttle function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
