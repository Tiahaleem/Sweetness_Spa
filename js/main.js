/* ============================================================
   SWEETNESS SPA & WELLNESS — MAIN SCRIPT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- CONFIG: update these once real details arrive ---------- */
  const SPA_NAME = "Sweetness Spa & Wellness";
  const WHATSAPP_NUMBER = "2349014213875"; // Real WhatsApp number (2349014213875)
  const WHATSAPP_MESSAGE = `Hello, I would like to book an appointment at ${SPA_NAME}.`;

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => preloader && preloader.classList.add('done'), 350);
  });
  // Fallback in case 'load' is delayed
  setTimeout(() => preloader && preloader.classList.add('done'), 1800);

  /* ---------- Sticky header shrink on scroll ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile hamburger menu ---------- */
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('mainNav');
  hamburger.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- WhatsApp links (floating + hero + final CTA) ---------- */
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  ['floatWhatsapp', 'heroWhatsapp', 'ctaWhatsapp', 'asideWhatsapp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute('href', waUrl);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    }
  });

  /* ---------- Stats count-up, triggered once when scrolled into view ---------- */
  const statsBlock = document.getElementById('statsBlock');
  if (statsBlock) {
    const numbers = statsBlock.querySelectorAll('.stat-number');
    let counted = false;

    const animateCount = (el) => {
      const target = parseFloat(el.getAttribute('data-count'));
      const decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
      const duration = 1400;
      const start = performance.now();

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const value = target * eased;
        el.textContent = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString();
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !counted) {
          counted = true;
          numbers.forEach(animateCount);
          observer.disconnect();
        }
      });
    }, { threshold: 0.4 });

    observer.observe(statsBlock);
  }

  /* ---------- Testimonial slider ---------- */
  const track = document.getElementById('testiTrack');
  const dotsWrap = document.getElementById('testiDots');
  const prevBtn = document.getElementById('testiPrev');
  const nextBtn = document.getElementById('testiNext');

  if (track) {
    const slides = track.querySelectorAll('.testi-slide');
    let index = 0;
    let autoplay;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
    const dots = dotsWrap.querySelectorAll('button');

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach(d => d.classList.remove('active'));
      dots[index].classList.add('active');
      resetAutoplay();
    }

    function resetAutoplay() {
      clearInterval(autoplay);
      autoplay = setInterval(() => goTo(index + 1), 6000);
    }

    prevBtn.addEventListener('click', () => goTo(index - 1));
    nextBtn.addEventListener('click', () => goTo(index + 1));
    resetAutoplay();
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Filter bar (Services: cards / Gallery: masonry items) ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const filterables = document.querySelectorAll('.service-card, .masonry-item');
  const categorySections = document.querySelectorAll('.service-category');

  if (filterBtns.length && filterables.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');

        filterables.forEach(item => {
          const match = filter === 'all' || item.getAttribute('data-category') === filter;
          item.classList.toggle('is-hidden', !match);
        });

        categorySections.forEach(section => {
          const visible = section.querySelectorAll('.service-card:not(.is-hidden)');
          section.style.display = (filter === 'all' || visible.length) ? '' : 'none';
        });

        if (filter !== 'all' && categorySections.length) {
          const target = document.getElementById(filter);
          if (target) {
            const offset = document.getElementById('filterBar').offsetHeight + 20;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        }
      });
    });
  }

  /* ---------- Gallery lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    const items = Array.from(document.querySelectorAll('.masonry-item'));
    let current = 0;

    function openLightbox(i) {
      const visibleItems = items.filter(it => !it.classList.contains('is-hidden'));
      current = visibleItems.indexOf(items[i]) >= 0 ? i : 0;
      showSlide(i, visibleItems);
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function showSlide(i) {
      const item = items[i];
      const img = item.querySelector('img');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxCaption.textContent = item.getAttribute('data-caption') || '';
      current = i;
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function step(dir) {
      const visible = items.filter(it => !it.classList.contains('is-hidden'));
      const visibleIndex = visible.indexOf(items[current]);
      const nextVisibleIndex = (visibleIndex + dir + visible.length) % visible.length;
      const nextItem = visible[nextVisibleIndex];
      showSlide(items.indexOf(nextItem));
    }

    items.forEach((item, i) => {
      item.addEventListener('click', () => openLightbox(i));
    });

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* ---------- BOOKING FORM SUBMISSION ----------
     No backend in this build: we format the fields into a message and
     hand off to WhatsApp via wa.me, so requests reach the spa instantly.
     To connect a real booking backend/database later, replace the body
     of this handler with an API call (e.g. fetch('/api/bookings', {...})),
     keeping the same field names (service, date, time, name, phone,
     email, notes) and reusing showConfirmation() below for the UI. */
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    const confirmation = document.getElementById('bookingConfirmation');
    const confirmLink = document.getElementById('confirmWhatsappLink');
    const resetBtn = document.getElementById('resetForm');
    const dateInput = document.getElementById('date');

    // Don't allow picking a date in the past
    dateInput.min = new Date().toISOString().split('T')[0];

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // clear previous invalid states
      bookingForm.querySelectorAll('.form-row.invalid').forEach(el => el.classList.remove('invalid'));

      const requiredFields = ['service', 'date', 'time', 'name', 'location', 'phone'];
      let firstInvalid = null;
      requiredFields.forEach(id => {
        const field = document.getElementById(id);
        if (!field.value) {
          field.closest('.form-row').classList.add('invalid');
          if (!firstInvalid) firstInvalid = field;
        }
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const data = Object.fromEntries(new FormData(bookingForm).entries());
      const lines = [
        `Hello, I would like to book an appointment at ${SPA_NAME}.`,
        ``,
        `Service: ${data.service}`,
        `Date: ${data.date}`,
        `Time: ${data.time}`,
        `Name: ${data.name}`,
        `Address (home/hotel): ${data.location}`,
        `Phone: ${data.phone}`,
      ];
      if (data.email) lines.push(`Email: ${data.email}`);
      if (data.notes) lines.push(`Notes: ${data.notes}`);

      const message = lines.join('\n');
      const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      confirmLink.href = waHref;
      window.open(waHref, '_blank'); // auto-redirect; confirmLink stays as a fallback if the popup is blocked

      bookingForm.hidden = true;
      confirmation.hidden = false;
      const check = confirmation.querySelector('.confirm-check');
      check.style.animation = 'none';
      void check.offsetWidth; // restart the check-draw animation
      check.style.animation = '';
    });

    resetBtn.addEventListener('click', () => {
      bookingForm.reset();
      bookingForm.querySelectorAll('.form-row.invalid').forEach(el => el.classList.remove('invalid'));
      confirmation.hidden = true;
      bookingForm.hidden = false;
    });
  }

  /* ---------- CONTACT FORM SUBMISSION ----------
     Same no-backend pattern as the booking form: build a message from
     the fields and hand off to WhatsApp via wa.me. To connect a real
     mailer/backend later, replace the body of this handler, keeping
     the same field names (name, phone, email, subject, message). */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const confirmation = document.getElementById('contactConfirmation');
    const confirmLink = document.getElementById('contactWhatsappLink');
    const resetBtn = document.getElementById('resetContactForm');

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      contactForm.querySelectorAll('.form-row.invalid').forEach(el => el.classList.remove('invalid'));

      const requiredFields = ['cName', 'cPhone', 'cMessage'];
      let firstInvalid = null;
      requiredFields.forEach(id => {
        const field = document.getElementById(id);
        if (!field.value) {
          field.closest('.form-row').classList.add('invalid');
          if (!firstInvalid) firstInvalid = field;
        }
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const data = Object.fromEntries(new FormData(contactForm).entries());
      const lines = [
        `Hello, I have a question for ${SPA_NAME}.`,
        ``,
        `Subject: ${data.subject}`,
        `Name: ${data.name}`,
        `Phone: ${data.phone}`,
      ];
      if (data.email) lines.push(`Email: ${data.email}`);
      lines.push(``, `Message: ${data.message}`);

      const message = lines.join('\n');
      const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      confirmLink.href = waHref;
      window.open(waHref, '_blank'); // auto-redirect; confirmLink stays as a fallback if the popup is blocked

      contactForm.hidden = true;
      confirmation.hidden = false;
      const check = confirmation.querySelector('.confirm-check');
      check.style.animation = 'none';
      void check.offsetWidth;
      check.style.animation = '';
    });

    resetBtn.addEventListener('click', () => {
      contactForm.reset();
      contactForm.querySelectorAll('.form-row.invalid').forEach(el => el.classList.remove('invalid'));
      confirmation.hidden = true;
      contactForm.hidden = false;
    });
  }

  /* ---------- Scroll-triggered reveal animations ---------- */
  if ('IntersectionObserver' in window) {
    const revealSelector = [
      '.page-hero-content > *',
      '.section-head',
      '.mission-head',
      '.difference-copy',
      '.why-copy > h2',
      '.service-row',
      '.service-card',
      '.masonry-item',
      '.mission-card',
      '.difference-item',
      '.team-card',
      '.why-list > li',
      '.why-stats',
      '.story-media',
      '.story-body > *',
      '.location-media',
      '.location-body > *',
      '.booking-card',
      '.aside-block',
      '.contact-info-list > li',
      '.testi-slider',
      '.final-cta .container > *'
    ].join(',');

    const groups = new Map();
    document.querySelectorAll(revealSelector).forEach(el => {
      el.classList.add('reveal-target');
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });
    groups.forEach(list => {
      list.forEach((el, i) => {
        el.style.transitionDelay = `${Math.min(i * 90, 360)}ms`;
      });
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal-target').forEach(el => revealObserver.observe(el));
  }

  /* ---------- Decorative floating leaves in hero sections ---------- */
  const leafSVG = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,10 C75,10 90,35 90,55 C60,60 40,90 20,90 C10,60 25,10 50,10 Z" fill="currentColor"/></svg>';
  const leafPositions = [
    { top: '16%', left: '6%',  size: 46, delay: '0s',   color: 'var(--gold-light)' },
    { top: '68%', left: '90%', size: 30, delay: '1.4s', color: 'var(--nude)' },
    { top: '38%', left: '84%', size: 22, delay: '.7s',  color: 'var(--gold-light)' }
  ];
  document.querySelectorAll('.hero, .page-hero').forEach(heroEl => {
    leafPositions.forEach(pos => {
      const leaf = document.createElement('span');
      leaf.className = 'decor-leaf';
      leaf.setAttribute('aria-hidden', 'true');
      leaf.style.top = pos.top;
      leaf.style.left = pos.left;
      leaf.style.width = pos.size + 'px';
      leaf.style.height = pos.size + 'px';
      leaf.style.color = pos.color;
      leaf.style.animationDelay = pos.delay;
      leaf.innerHTML = leafSVG;
      heroEl.appendChild(leaf);
    });
  });

});