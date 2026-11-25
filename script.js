/**
 * Belnad Health Spa & Beauty Klinik — Clinical Wellness Interactions
 * Handles: glass nav shrink, mobile menu, active nav, scroll reveal,
 * treatment filters, before/after sliders, WhatsApp booking.
 */

(() => {
  'use strict';

  // =========================================================
  // CONFIG — clinic WhatsApp number (international, digits only)
  // Displayed on site as 055 749 2402
  // =========================================================
  const WHATSAPP_NUMBER = '233557492402';
  const WA_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;
  const waLink = (text) => `${WA_BASE}?text=${encodeURIComponent(text)}`;
  const DEFAULT_MSG = 'Hi Belnad Klinik, I would like to book a treatment at Ahoe Market, Ho. Please share your availability.';

  // ---- Helpers ----
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // ---- Elements ----
  const header = $('#siteHeader');
  const menuToggle = $('#menuToggle');
  const navLinks = $('#navLinks');
  const navAnchors = $$('.nav-link[href^="#"]');
  const bookingForm = $('#bookingForm');
  const serviceSelect = $('#service');
  const dateInput = $('#preferredDate');
  const formError = $('#formError');
  const formSuccess = $('#formSuccess');
  const fallbackLink = $('#fallbackLink');
  const yearEl = $('#year');

  // ---- Footer year ----
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- Set default WA links ----
  ['#heroWa', '#floatingWa', '#footerWa'].forEach((sel) => {
    const el = $(sel);
    if (el) el.href = waLink(DEFAULT_MSG);
  });

  // ---- Hero load effect ----
  const hero = $('.hero');
  if (hero) requestAnimationFrame(() => hero.classList.add('loaded'));

  // ---- Sticky header: shrink + glass on scroll ----
  const syncHeader = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  // ---- Mobile menu ----
  const closeMenu = () => {
    if (!menuToggle || !navLinks) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    navLinks.classList.remove('open');
    document.body.classList.remove('menu-open');
  };

  const openMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    navLinks.classList.add('open');
    document.body.classList.add('menu-open');
  };

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      menuToggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
    });

    $$('#navLinks a').forEach((a) => a.addEventListener('click', closeMenu));

    document.addEventListener('click', (e) => {
      if (!navLinks.classList.contains('open')) return;
      if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeMenu();
        menuToggle.focus();
      }
    });

    window.addEventListener('resize', () => { if (window.innerWidth > 980) closeMenu(); });
  }

  // ---- Active nav on scroll ----
  const sections = navAnchors
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navAnchors.forEach((a) => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });
    sections.forEach((s) => navObs.observe(s));
  }

  // ---- Scroll reveal (fade-up, staggered via CSS delays) ----
  const reveals = $$('.reveal');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced && 'IntersectionObserver' in window && reveals.length) {
    const revealObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => revealObs.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  // ---- Treatment filter tabs ----
  const filterTabs = $$('.filter-tab[data-filter]');
  const serviceCards = $$('.service-card[data-category]');

  const filterServices = (filter) => {
    serviceCards.forEach((card) => {
      const match = filter === 'all' || card.dataset.category === filter;
      if (match) {
        card.classList.remove('is-hidden');
        // allow display to apply before removing hiding class
        requestAnimationFrame(() => {
          card.classList.remove('is-hiding');
        });
      } else {
        card.classList.add('is-hiding');
        const onEnd = (e) => {
          if (e.propertyName !== 'opacity') return;
          card.removeEventListener('transitionend', onEnd);
          if (card.classList.contains('is-hiding')) card.classList.add('is-hidden');
        };
        card.addEventListener('transitionend', onEnd);
        // Fallback in case transitionend doesn't fire
        setTimeout(() => {
          if (card.classList.contains('is-hiding')) card.classList.add('is-hidden');
        }, 500);
      }
    });
  };

  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;
      filterTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      filterServices(filter);
    });
  });

  // ---- Before/After sliders ----
  const initBeforeAfter = () => {
    $$('.ba-slider[data-slider]').forEach((slider) => {
      const range = slider.querySelector('.ba-range');
      const before = slider.querySelector('.ba-before');
      const handle = slider.querySelector('.ba-handle');
      if (!range || !before || !handle) return;

      const update = (value) => {
        const pct = Math.min(100, Math.max(0, Number(value)));
        before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
        handle.style.left = `${pct}%`;
      };

      update(range.value);
      range.addEventListener('input', (e) => update(e.target.value));
      range.addEventListener('change', (e) => update(e.target.value));

      // Also support pointer drag directly on slider for smooth feel
      let dragging = false;
      const setFromPointer = (e) => {
        const rect = slider.getBoundingClientRect();
        const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
        const pct = (x / rect.width) * 100;
        range.value = String(pct);
        update(pct);
      };

      slider.addEventListener('pointerdown', (e) => {
        if (e.target === range) return; // range handles itself
        dragging = true;
        slider.setPointerCapture(e.pointerId);
        setFromPointer(e);
      });
      slider.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        setFromPointer(e);
      });
      const stopDrag = () => { dragging = false; };
      slider.addEventListener('pointerup', stopDrag);
      slider.addEventListener('pointercancel', stopDrag);
    });
  };
  initBeforeAfter();

  // ---- "Reserve this treatment" shortcuts ----
  $$('.book-service[data-service]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const service = btn.getAttribute('data-service');
      if (serviceSelect) {
        const opt = [...serviceSelect.options].find((o) => o.value === service);
        if (opt) serviceSelect.value = opt.value;
        serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const booking = $('#booking');
      if (booking) {
        booking.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
        setTimeout(() => $('#clientName')?.focus({ preventScroll: true }), prefersReduced ? 0 : 450);
      }
    });
  });

  // ---- Date min = today ----
  if (dateInput) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    dateInput.min = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  // ---- Booking form -> WhatsApp ----
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      formError.hidden = true;
      formSuccess.hidden = true;

      const name = $('#clientName').value.trim();
      const service = serviceSelect.value;
      const date = dateInput.value;
      const time = $('#preferredTime').value;
      const notes = $('#notes').value.trim();

      const missing = !name || !service || !date || !time;
      if (missing) {
        formError.hidden = false;
        const firstInvalid = [$('#clientName'), serviceSelect, dateInput, $('#preferredTime')]
          .find((el) => !el.value.trim());
        firstInvalid?.focus();
        return;
      }

      let prettyDate = date;
      try {
        const d = new Date(date + 'T00:00:00');
        prettyDate = d.toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
      } catch (_) { /* keep raw */ }

      const selectedOpt = serviceSelect.options[serviceSelect.selectedIndex];
      const priceLabel = selectedOpt?.dataset?.priceLabel
        || (selectedOpt?.dataset?.price ? `GHS ${selectedOpt.dataset.price}` : '');

      const lines = [
        'Hi Belnad Health Spa & Beauty Klinik, I would like to book an appointment.',
        '',
        `Name: ${name}`,
        `Treatment: ${service}`,
      ];
      if (priceLabel) lines.push(`Price: ${priceLabel}`);
      lines.push(
        `Preferred date: ${prettyDate}`,
        `Preferred time: ${time}`
      );
      if (notes) lines.push(`Notes: ${notes}`);
      lines.push('', 'Please confirm availability. Thank you.');

      const url = waLink(lines.join('\n'));
      fallbackLink.href = url;
      formSuccess.hidden = false;
      formSuccess.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'nearest' });

      window.open(url, '_blank', 'noopener');
    });

    $$('input, select, textarea', bookingForm).forEach((el) => {
      el.addEventListener('input', () => { formError.hidden = true; });
      el.addEventListener('change', () => { formError.hidden = true; });
    });
  }
})();
