/**
 * FAQAI FAQ Widget - Embeddable FAQ display
 *
 * Usage (iframe approach):
 *
 * 1. Direct slug specification:
 *    <script src="https://faq.example.com/embed.js"
 *            data-site-slug="g-direct"
 *            data-container="#faq-container"
 *            defer></script>
 *
 * 2. Auto-detect from current domain:
 *    <script src="https://faq.example.com/embed.js"
 *            data-auto-detect="true"
 *            data-container="#faq-container"
 *            defer></script>
 *
 * Options (data attributes):
 *   data-site-slug   - Site slug (e.g., "g-direct")
 *   data-auto-detect - Auto-detect site from current domain ("true")
 *   data-container   - CSS selector for container element (default: "#faqai-container")
 *   data-height      - iframe height (default: "600px")
 *   data-api-url     - API URL override (default: script origin)
 *   data-portal-url  - Portal URL override (default: script origin)
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var siteSlug = script.getAttribute('data-site-slug');
  var autoDetect = script.getAttribute('data-auto-detect') === 'true';
  var containerSelector = script.getAttribute('data-container') || '#faqai-container';
  var height = script.getAttribute('data-height') || '600px';
  var scriptOrigin = new URL(script.src).origin;
  var apiUrl = script.getAttribute('data-api-url') || scriptOrigin.replace(':3002', ':3001');
  var portalUrl = script.getAttribute('data-portal-url') || scriptOrigin;

  function createIframe(slug) {
    var container = document.querySelector(containerSelector);
    if (!container) {
      console.warn('[FAQAI] Container not found:', containerSelector);
      return;
    }

    var iframe = document.createElement('iframe');
    iframe.src = portalUrl + '/' + slug;
    iframe.style.width = '100%';
    iframe.style.height = height;
    iframe.style.border = 'none';
    iframe.style.borderRadius = '12px';
    iframe.style.overflow = 'hidden';
    iframe.setAttribute('title', 'FAQ');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow', 'clipboard-write');

    container.innerHTML = '';
    container.appendChild(iframe);
  }

  function init() {
    if (siteSlug) {
      createIframe(siteSlug);
      return;
    }

    if (autoDetect) {
      var domain = window.location.hostname;
      fetch(apiUrl + '/api/v1/public/sites/by-domain/' + encodeURIComponent(domain))
        .then(function (res) { return res.json(); })
        .then(function (json) {
          if (json.success && json.data && json.data.slug) {
            createIframe(json.data.slug);
          } else {
            console.warn('[FAQAI] No FAQ site found for domain:', domain);
          }
        })
        .catch(function (err) {
          console.error('[FAQAI] Failed to detect site:', err);
        });
      return;
    }

    console.warn('[FAQAI] No data-site-slug or data-auto-detect specified');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
