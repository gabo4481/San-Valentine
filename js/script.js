document.addEventListener('DOMContentLoaded', () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------
     Floating items (corazones y gatos)
     ----------------------*/
  (function createFloating() {
    const loader = document.getElementById('heartLoader');
    if (!loader) return;
    const numFloating = 30;
    for (let i = 0; i < numFloating; i++) {
      const floating = document.createElement('div');
      floating.classList.add('floating-item');
      const type = Math.random() < 0.6 ? 'cat' : 'heart';
      const icon = document.createElement('i');
      icon.className = type === 'cat' ? 'fas fa-cat' : 'fas fa-heart';
      floating.classList.add(type === 'cat' ? 'cat' : 'heart');
      floating.appendChild(icon);

      floating.style.top = (Math.random() * 90) + '%';
      floating.style.left = (Math.random() * 90) + '%';
      const size = 1.0 + Math.random() * 2.2;
      floating.style.fontSize = size + 'rem';
      const duration = 5 + Math.random() * 9;
      floating.style.animation = `flotar ${duration}s infinite alternate ease-in-out`;
      floating.style.animationDelay = (Math.random() * 5) + 's';
      floating.style.opacity = 0.35 + Math.random() * 0.6;
      loader.appendChild(floating);
    }
  })();

  /* ----------------------
     Simple Carousel class (reusable)
     ----------------------*/
  class SimpleCarousel {
    constructor(opts) {
      this.container = opts.container; // viewport (.carousel)
      this.images = opts.images || [];
      this.captions = opts.captions || [];
      this.interval = prefersReduced ? 0 : (opts.interval || 2000);
      this.dotsContainer = opts.dotsContainer || null;
      this.prevBtn = opts.prevBtn || null;
      this.nextBtn = opts.nextBtn || null;
      this.pauseBtn = opts.pauseBtn || null;
      this.current = 0;
      this.timer = null;
      this.paused = prefersReduced;
      this.track = null; // will hold .carousel-track
      this.items = [];
      this.build();
      this.attachEvents();
      // update position on resize to keep slides aligned
      window.addEventListener('resize', () => this.update());
      if (this.interval && !this.paused) this.start();
    }

    build() {
      // create track inside the viewport and populate
      this.container.innerHTML = '';
      const track = document.createElement('div');
      track.className = 'carousel-track';
      this.track = track;

      this.images.forEach((src, i) => {
        const item = document.createElement('div');
        item.className = 'carousel-item';
        // ensure each item fills the viewport (one image per view on mobile)
        item.style.flex = '0 0 100%';

        const img = document.createElement('img');
        img.src = src;
        img.alt = this.captions[i] || `imagen ${i + 1}`;
        img.loading = i === 0 ? 'eager' : 'lazy';
        img.decoding = 'async';
        item.appendChild(img);
        if (this.captions[i]) {
          const p = document.createElement('p');
          p.textContent = this.captions[i];
          item.appendChild(p);
        }
        track.appendChild(item);
        this.items.push(item);
      });

      this.container.appendChild(track);

      if (this.dotsContainer) {
        this.dotsContainer.innerHTML = '';
        this.dots = [];
        this.items.forEach((_, idx) => {
          const dot = document.createElement('span');
          dot.className = 'dot';
          dot.dataset.index = idx;
          dot.addEventListener('click', () => this.go(idx));
          this.dotsContainer.appendChild(dot);
          this.dots.push(dot);
        });
      }

      // ensure first frame
      this.update();
    }

    update() {
      if (!this.track || !this.items.length) return;
      // translate by one item width (pixel-accurate and responsive)
      const itemWidth = this.items[0].getBoundingClientRect().width || this.items[0].offsetWidth;
      const translateX = this.current * itemWidth;
      this.track.style.transform = `translateX(-${translateX}px)`;
      if (this.dots) this.dots.forEach((d, i) => d.classList.toggle('active', i === this.current));
      if (this.pauseBtn) this.pauseBtn.setAttribute('aria-pressed', String(this.paused));
    }

    go(index) {
      if (!this.items.length) return;
      this.current = (index + this.items.length) % this.items.length;
      this.update();
    }

    next() { this.go(this.current + 1); }
    prev() { this.go(this.current - 1); }

    start() {
      if (this.timer || !this.interval || this.paused) return;
      this.timer = setInterval(() => this.next(), this.interval);
    }

    stop() {
      if (!this.timer) return;
      clearInterval(this.timer);
      this.timer = null;
    }

    togglePause() {
      this.paused = !this.paused;
      if (this.paused) this.stop(); else this.start();
      this.update();
    }

    attachEvents() {
      if (this.prevBtn) this.prevBtn.addEventListener('click', () => { this.prev(); this.pauseAutoTemporarily(); });
      if (this.nextBtn) this.nextBtn.addEventListener('click', () => { this.next(); this.pauseAutoTemporarily(); });
      if (this.pauseBtn) this.pauseBtn.addEventListener('click', () => this.togglePause());

      // touch swipe on viewport
      let touchStartX = 0;
      this.container.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, {passive:true});
      this.container.addEventListener('touchend', (e) => {
        const diff = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(diff) > 40) {
          if (diff > 0) this.prev(); else this.next();
          this.pauseAutoTemporarily();
        }
      });

      // pause on hover/focus (desktop & keyboard)
      this.container.addEventListener('mouseenter', () => { if (!prefersReduced) this.stop(); });
      this.container.addEventListener('mouseleave', () => { if (!prefersReduced && !this.paused) this.start(); });
      this.container.addEventListener('focusin', () => { if (!prefersReduced) this.stop(); });
      this.container.addEventListener('focusout', () => { if (!prefersReduced && !this.paused) this.start(); });
    }

    pauseAutoTemporarily() {
      if (!this.interval) return;
      this.stop();
      if (this._resumeTimer) clearTimeout(this._resumeTimer);
      this._resumeTimer = setTimeout(() => { if (!this.paused) this.start(); }, 4000);
    }
  }

  /* ----------------------
     Inicializar los dos carruseles (caritas + recuerdos)
     ----------------------*/
  const caritasImgs = Array.from({length:9}, (_, i) => `img/caritas/${i+1}.jpeg`);
  const recuerdosImgs = Array.from({length:9}, (_, i) => `img/recuerdos/r${i+1}.jpeg`);
  const recuerdosCaptions = [
    '💖 Nuestro primer paseo', '🐱 Tarde de mimos', '🌅 La primera aventura', '📸 Foto tonta con gatos', '🍿 Noche de pelis', '🎂 Tu cumpleaños', '🌙 Noche estrellada', '☕ Desayuno lento', '🎶 Canción favorita'
  ];

  // Caritas
  const caritasCarousel = new SimpleCarousel({
    container: document.getElementById('carouselCaritas'),
    images: caritasImgs,
    captions: [],
    interval: 2000,
    dotsContainer: document.getElementById('carouselCaritasDots'),
    prevBtn: document.querySelector('.carousel-prev[data-target="carouselCaritas"]'),
    nextBtn: document.querySelector('.carousel-next[data-target="carouselCaritas"]'),
    pauseBtn: document.querySelector('.carousel-pause[data-target="carouselCaritas"]')
  });

  // Recuerdos
  const recuerdosCarousel = new SimpleCarousel({
    container: document.getElementById('carousel'),
    images: recuerdosImgs,
    captions: recuerdosCaptions,
    interval: 2000,
    dotsContainer: document.getElementById('carouselDots'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pauseBtn: document.querySelector('.carousel-pause[data-target="carousel"]')
  });

  /* ----------------------
     Envelope / carta (abrir/cerrar)
     ----------------------*/
  (function envelopeBehavior(){
    const envelope = document.getElementById('envelope');
    if (!envelope) return;

    function createPetalConfetti(x, y, count = 26) {
      if (prefersReduced) return;
      const body = document.body;
      const petals = [];
      for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'petal';

        // randomize initial rotation & size
        const angle = Math.random() * 360;
        const size = 6 + Math.random() * 16; // varied sizes
        el.style.width = `${size}px`;
        el.style.height = `${Math.round(size * 1.5)}px`;

        // much wider horizontal spread and small vertical jitter
        const spreadX = (Math.random() * 800 - 400); // -400 .. 400px
        const spreadY = (Math.random() * 120 - 60);  // -60 .. 60px
        el.style.left = `${x + spreadX}px`;
        el.style.top = `${y + spreadY}px`;

        el.style.transform = `rotate(${angle}deg) translate3d(0,0,0)`;

        // substantially slower + staggered start
        const dur = 2200 + Math.random() * 2800; // 2200 - 5000 ms
        const delay = Math.random() * 800; // stagger
        el.style.animation = `petal-fall ${dur}ms cubic-bezier(.2,.7,.2,1) ${delay}ms forwards`;

        petals.push(el);
        body.appendChild(el);

        // remove after animation (include delay)
        setTimeout(() => el.remove(), dur + delay + 500);
      }
    }

    const toggle = () => {
      const isOpen = envelope.classList.toggle('open');
      envelope.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) {
        // origin: top-center of the envelope
        const r = envelope.getBoundingClientRect();
        const originX = Math.round(r.left + r.width / 2);
        const originY = Math.round(r.top + r.height / 4);
        createPetalConfetti(originX, originY, 22);
      }
    };

    envelope.addEventListener('click', toggle);
    envelope.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  })();

  /* ----------------------
     Ramo: insertar SVGs desde img/flores + usar icono pareja
     ----------------------*/
  (function ramoInit(){
    const ramo = document.getElementById('ramo');
    if (!ramo) return;
    const inner = ramo.querySelector('.ramo-inner');
    const flowerCount = 10; // usuario provee 10 SVGs

    // build wrapped flowers (wrapper receives parallax transforms, child keeps float animation)
    for (let i = 1; i <= flowerCount; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'flower-wrap';
      wrap.style.transitionDelay = `${i * 18}ms`;
      const img = document.createElement('img');
      img.className = 'flower';
      img.src = `img/flores/flores${i}.svg`;
      img.alt = 'flor';
      img.style.transitionDelay = `${i * 80}ms`;
      wrap.appendChild(img);
      inner.appendChild(wrap);
    }

    // la imagen principal de la pareja se muestra ahora en el hero en lugar del ramo.

    // IntersectionObserver para activar 'bloom'
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          ramo.classList.add('bloom');
          obs.disconnect();
        }
      });
    }, {threshold: 0.25});
    obs.observe(ramo);

    // --- Parallax / tilt interaction ---
    if (!prefersReduced) {
      const wrappers = Array.from(inner.querySelectorAll('.flower-wrap'));
      let tx = 0, ty = 0;
      let raf = null;

      function applyParallax() {
        wrappers.forEach((w, i) => {
          const depth = (i + 1) / wrappers.length;
          const moveX = tx * 14 * depth; // scale movement by depth
          const moveY = ty * 10 * depth;
          w.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
        });
        raf = null;
      }

      function onPointerMove(e) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const nx = ((e.clientX - cx) / cx); // -1 .. 1
        const ny = ((e.clientY - cy) / cy);
        tx = nx; ty = ny;
        if (!raf) raf = requestAnimationFrame(applyParallax);
      }

      function onDeviceOrientation(ev) {
        // gamma: left-right tilt, beta: front-back tilt
        const gamma = ev.gamma || 0; // -90 .. 90
        const beta = ev.beta || 0;   // -180 .. 180
        tx = Math.max(-1, Math.min(1, gamma / 30));
        ty = Math.max(-1, Math.min(1, beta / 30));
        if (!raf) raf = requestAnimationFrame(applyParallax);
      }

      // prefer device orientation on mobile, fallback to pointer
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS requires permission; we'll fallback to pointermove unless user allows
        // add a quiet listener for deviceorientation (some browsers will never fire without permission)
        window.addEventListener('deviceorientation', onDeviceOrientation, {passive:true});
      } else if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', onDeviceOrientation, {passive:true});
      }
      // pointer fallback
      window.addEventListener('pointermove', onPointerMove, {passive:true});
    }
  })();

  /* ----------------------
     Botón 'Sigue leyendo' (scroll suave)
     ----------------------*/
  const btnSigue = document.getElementById('btnSigue');
  if (btnSigue) btnSigue.addEventListener('click', () => document.getElementById('carga').scrollIntoView({behavior:'smooth', block:'start'}));

  /* ----------------------
     Respetar prefers-reduced-motion: detener autoplays si está activo
     ----------------------*/
  if (prefersReduced) {
    [caritasCarousel, recuerdosCarousel].forEach(c => { if (c && !c.paused) c.togglePause(); });
  }

});