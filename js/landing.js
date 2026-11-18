/* ============================================================
   SWEETNESS SPA & WELLNESS — LANDING PAGE SCRIPT
   Handles: UTM capture, Meta/Snapchat pixel events, booking form
   validation + WhatsApp handoff, sticky CTA, scroll reveal.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- CONFIG ---------- */
  const SPA_NAME = "Sweetness Spa & Wellness";
  const WHATSAPP_NUMBER = "2349014213875"; // Real WhatsApp number

  const metaPixelId = document.querySelector('meta[name="lp-meta-pixel-id"]')?.content || '';
  const snapPixelId = document.querySelector('meta[name="lp-snap-pixel-id"]')?.content || '';
  const META_PIXEL_READY = !!metaPixelId && !metaPixelId.startsWith('YOUR_');
  const SNAP_PIXEL_READY = !!snapPixelId && !snapPixelId.startsWith('YOUR_');

  if (!META_PIXEL_READY) {
    console.warn('[Sweetness Spa] Meta Pixel ID not configured — edit the lp-meta-pixel-id meta tag in landing.html. Pixel events will be logged to console instead of sent.');
  }
  if (!SNAP_PIXEL_READY) {
    console.warn('[Sweetness Spa] Snapchat Pixel ID not configured — edit the lp-snap-pixel-id meta tag in landing.html. Pixel events will be logged to console instead of sent.');
  }

  if (META_PIXEL_READY && window.fbq) {
    fbq('init', metaPixelId);
    fbq('track', 'PageView');
  }
  if (SNAP_PIXEL_READY && window.snaptr) {
    snaptr('init', snapPixelId);
    snaptr('track', 'PAGE_VIEW');
  }

  /* ---------- UTM capture + preservation ----------
     Reads UTM params from the URL on first load, stores them in
     sessionStorage so they survive navigation within this landing
     page (anchor links, form submit), and reattaches them to any
     outbound link if needed later (e.g. a "view full services"
     link back to the main site). */
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const STORAGE_KEY = 'sweetness_utm_params';

  function captureUtmParams() {
    const params = new URLSearchParams(window.location.search);
    const found = {};
    let hasAny = false;
    UTM_KEYS.forEach(key => {
      const val = params.get(key);
      if (val) { found[key] = val; hasAny = true; }
    });
    if (hasAny) {
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found)); } catch (e) {}
      return found;
    }
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  }

  const utmParams = captureUtmParams();

  function utmSummaryLine() {
    const parts = UTM_KEYS.filter(k => utmParams[k]).map(k => `${k}=${utmParams[k]}`);
    return parts.length ? `\n\n[Source: ${parts.join(', ')}]` : '';
  }

  /* ---------- Shared event tracking helper ----------
     Fires to Meta Pixel + Snapchat Pixel (when configured) and
     always logs to console so events are verifiable before pixel
     IDs are added. `dedupeKey`, when given, prevents the same
     event firing twice in one page load (e.g. double-click). */
  const firedEvents = new Set();

  function trackEvent(eventName, metaEventName, snapEventName, data = {}, dedupeKey = null) {
    if (dedupeKey) {
      if (firedEvents.has(dedupeKey)) return;
      firedEvents.add(dedupeKey);
    }
    const payload = { ...data, utm: utmParams, timestamp: new Date().toISOString() };
    console.log(`[Sweetness Spa Tracking] ${eventName}`, payload);

    if (META_PIXEL_READY && window.fbq && metaEventName) {
      fbq('track', metaEventName, data);
    }
    if (SNAP_PIXEL_READY && window.snaptr && snapEventName) {
      snaptr('track', snapEventName, data);
    }
  }

  // Landing page view (already fired above as PageView/PAGE_VIEW; log it uniformly too)
  trackEvent('landing_page_view', null, null, { page: 'landing' });

  /* ---------- Service viewed (fires once per card, on first scroll into view) ---------- */
  const serviceCards = document.querySelectorAll('.lp-service-card');
  if (serviceCards.length) {
    const serviceObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const title = entry.target.querySelector('h3')?.textContent || 'Unknown service';
          trackEvent('service_viewed', 'ViewContent', 'VIEW_CONTENT', { content_name: title }, `service_viewed_${title}`);
          serviceObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    serviceCards.forEach(card => serviceObserver.observe(card));
  }

  /* ---------- WhatsApp CTA clicks (hero, sticky bar, confirmation) ---------- */
  function buildGenericWhatsappLink() {
    const msg = `Hello, I'd like to know more about booking a session at ${SPA_NAME}.${utmSummaryLine()}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }
  const genericWaLink = buildGenericWhatsappLink();
  ['lpHeroWhatsapp', 'lpStickyWhatsapp'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.href = genericWaLink;
    el.addEventListener('click', () => {
      // Click tracked here; this is a "clicked CTA" event, not a confirmed
      // conversion — we can't know the user actually sent the WhatsApp
      // message, only that they opened the chat.
      trackEvent('whatsapp_cta_clicked', 'Contact', 'ADD_TO_CART', { cta: id });
    });
  });

  /* ---------- "Request a Booking" CTA scroll ---------- */
  document.querySelectorAll('[data-lp-event="cta_scroll_to_form"]').forEach(el => {
    el.addEventListener('click', () => {
      trackEvent('cta_scroll_to_form_clicked', null, null, {});
    });
  });

  /* ---------- Booking form ---------- */
  const form = document.getElementById('lpBookingForm');
  const submitBtn = document.getElementById('lpSubmitBtn');
  const confirmation = document.getElementById('lpConfirmation');
  const confirmWaLink = document.getElementById('lpConfirmWhatsappLink');
  const resetBtn = document.getElementById('lpResetForm');
  const dateInput = document.getElementById('lpDate');
  const timeSelect = document.getElementById('lpTime');

  // Prevent picking a past date
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  // Populate all 24 hourly slots (business is open 24/7)
  if (timeSelect) {
    for (let h = 0; h < 24; h++) {
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const suffix = h < 12 ? 'AM' : 'PM';
      const label = `${hour12}:00 ${suffix}`;
      const opt = document.createElement('option');
      opt.value = label;
      opt.textContent = label;
      timeSelect.appendChild(opt);
    }
  }

  let formStartTracked = false;
  if (form) {
    form.addEventListener('focusin', () => {
      if (!formStartTracked) {
        formStartTracked = true;
        trackEvent('booking_form_started', 'InitiateCheckout', 'START_CHECKOUT', {});
      }
    }, { once: false });
  }

  function validateField(field, condition) {
    const wrapper = field.closest('.lp-field');
    if (!wrapper) return condition;
    wrapper.classList.toggle('has-error', !condition);
    return condition;
  }

  function isSubmitting() {
    return submitBtn && submitBtn.classList.contains('is-loading');
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Prevent duplicate submissions (double-click / double-tap)
      if (isSubmitting()) return;

      const nameEl = document.getElementById('lpName');
      const phoneEl = document.getElementById('lpPhone');
      const serviceEl = document.getElementById('lpService');
      const cityEl = document.getElementById('lpCity');
      const dateEl = document.getElementById('lpDate');
      const timeEl = document.getElementById('lpTime');
      const notesEl = document.getElementById('lpNotes');

      let valid = true;
      valid = validateField(nameEl, nameEl.value.trim().length > 1) && valid;

      const phoneDigits = phoneEl.value.replace(/[^0-9+]/g, '');
      valid = validateField(phoneEl, phoneDigits.length >= 10) && valid;

      valid = validateField(serviceEl, !!serviceEl.value) && valid;
      valid = validateField(cityEl, !!cityEl.value) && valid;

      let dateValid = !!dateEl.value;
      if (dateValid) {
        const chosen = new Date(dateEl.value + 'T00:00:00');
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        dateValid = chosen >= now;
      }
      valid = validateField(dateEl, dateValid) && valid;
      valid = validateField(timeEl, !!timeEl.value) && valid;

      if (!valid) return;

      // Loading state
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      const lines = [
        `Hello, I would like to request a booking at ${SPA_NAME}.`,
        ``,
        `Name: ${nameEl.value.trim()}`,
        `WhatsApp Number: ${phoneEl.value.trim()}`,
        `Service: ${serviceEl.options[serviceEl.selectedIndex].text}`,
        `City: ${cityEl.value}`,
        `Preferred Date: ${dateEl.value}`,
        `Preferred Time: ${timeEl.value}`,
      ];
      if (notesEl.value.trim()) lines.push(`Notes: ${notesEl.value.trim()}`);
      lines.push('', 'This is a booking request — please confirm availability.');
      const message = lines.join('\n') + utmSummaryLine();
      const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

      // Fire the completed-request conversion event now (the form data
      // was genuinely submitted) — separate from any later "message
      // actually sent" signal, which we cannot observe from here.
      trackEvent('booking_request_completed', 'Lead', 'SIGN_UP', {
        service: serviceEl.value,
        city: cityEl.value,
      });

      setTimeout(() => {
        confirmWaLink.href = waHref;
        window.open(waHref, '_blank'); // auto-redirect; fallback link stays visible if popup is blocked
        form.hidden = true;
        confirmation.hidden = false;
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
      }, 450); // brief delay so the loading state is visible, not instant/jarring
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      form.hidden = false;
      confirmation.hidden = true;
      formStartTracked = false;
      document.querySelectorAll('.lp-field.has-error').forEach(el => el.classList.remove('has-error'));
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('lpYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- "Book this" on a price card: pre-select the service, jump to the form ---------- */
  document.querySelectorAll('.lp-book-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const select = document.getElementById('lpService');
      const formSection = document.getElementById('lp-booking-form');
      if (form && form.hidden) { form.hidden = false; confirmation.hidden = true; }
      if (select) {
        select.value = btn.dataset.service;
        const wrap = select.closest('.lp-field');
        if (wrap) wrap.classList.remove('has-error');
      }
      trackEvent('price_card_book_clicked', null, null, { service: btn.dataset.service });
      if (formSection) formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---------- Scroll reveal (same pattern as main site) ---------- */
  const revealTargets = document.querySelectorAll('.reveal-target');
  if (revealTargets.length && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = `${(i % 4) * 90}ms`;
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealTargets.forEach(el => revealObserver.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('in-view'));
  }

});