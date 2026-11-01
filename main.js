/* =====================================================================
   VALERI HAIR STUDIO — скрипт сайта
   Один файл вместо script-base.js и script.js.

   Содержание:
   1.  Общие настройки и режимы (анимации / без анимаций)
   2.  Плавная прокрутка (Lenis) и переходы по якорям
   3.  Шапка, мобильное меню, нижняя кнопка записи
   4.  Первый экран «Вход через арку» (перенесено из prototype/index.html)
   5.  Появление блоков при прокрутке
   6.  Ползунки «до / после»
   7.  Ленты со стрелками; «До и после» на прокрутке; прайс; студия; фон записи
   8.  Процедуры: окно с полным описанием (serviceData)
   9.  Раскрывающиеся разделы
   10. Запись и контакты: контур арки
   11. Запуск
   ===================================================================== */
(() => {
  'use strict';

  /* ---------- 1. Общие настройки ---------- */
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const mobile = () => innerWidth < 768;
  const hasGsap = !!(window.gsap && window.ScrollTrigger && window.SplitText);
  // .motion ставится в <head>, если нет prefers-reduced-motion; без GSAP анимаций тоже нет
  const motion = root.classList.contains('motion') && hasGsap;
  if (!motion) root.classList.remove('motion');
  window.VHS_READY = true;

  const header = $('#header');
  const hero = $('#hero');
  const mobileBar = $('.mobile-bar');
  let lenis = null;

  /* ---------- 2. Плавная прокрутка и якоря ---------- */
  function lockScroll(lock) {
    if (lenis) lock ? lenis.stop() : lenis.start();
    else document.body.style.overflow = lock ? 'hidden' : '';
  }

  function scrollToTarget(target, immediate) {
    if (lenis) {
      lenis.scrollTo(target, { offset: 0, duration: 1.4, immediate: !!immediate, force: true });
    } else {
      const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY;
      scrollTo({ top, behavior: immediate || !motion ? 'auto' : 'smooth' });
    }
  }

  function initAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = id === '#top' ? 0 : document.getElementById(id.slice(1));
      if (target === null) return;
      e.preventDefault();
      setMenu(false);
      scrollToTarget(target);
      if (target !== 0) {
        // фокус переносим на секцию — удобно для клавиатуры и экранных дикторов
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
      if (history.replaceState) history.replaceState(null, '', id === '#top' ? location.pathname + location.search : id);
    });
  }

  /* ---------- 3. Шапка, меню, нижняя кнопка ---------- */
  const menu = $('#menu');
  const toggle = $('.menu-toggle');
  let menuOpen = false;

  function setMenu(open) {
    if (open === menuOpen || !menu) return;
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    header.classList.toggle('menu-open', open);
    lockScroll(open);
    if (open) setTimeout(() => $('a', menu).focus({ preventScroll: true }), 50);
  }
  toggle?.addEventListener('click', () => setMenu(!menuOpen));
  addEventListener('resize', () => { if (innerWidth >= 1100) setMenu(false); });

  // длина закрепления первого экрана (как в прототипе: 200 % высоты, на телефоне 150 %)
  const pinLength = () => (mobile() ? 1.5 : 2) * innerHeight;
  // шапка светлеет после прохода сквозь арку и прячется при прокрутке вниз
  let lastY = 0, hidden = false;
  function onScrollHeader(y) {
    const solidAt = motion ? pinLength() + innerHeight * 0.2 : innerHeight - 80;
    header.classList.toggle('is-solid', y > solidAt);
    mobileBar?.classList.toggle('is-visible', y > solidAt);
    // направление меняем только при заметном сдвиге, чтобы шапка не мигала от мелких колебаний
    const dy = y - lastY;
    if (Math.abs(dy) > 6) { hidden = dy > 0 && y > solidAt + innerHeight * 0.2; lastY = y; }
    if (y <= solidAt || menuOpen) hidden = false;
    header.classList.toggle('is-hidden', hidden);
  }

  /* ---------- 4. Первый экран «Вход через арку» ----------
     Перенесено из prototype/index.html. Тайминги, плавность и эффекты — как в прототипе. */
  const photo = $('#photo'), photoScale = $('#photoScale');
  const archLine = $('#archLine'), mark = $('#mark');

  /* геометрия арки: ширина : высота ≈ 1 : 1.9, верх полукруглый */
  let A = {};
  const state = { reveal: 0 };
  function archBox() {
    const W = innerWidth, H = innerHeight;
    const h = mobile() ? Math.min(H * 0.64, W * 0.66 * 1.9) : H * 0.72;
    const w = h / 1.9;
    const x = (W - w) / 2, y = (H - h) / 2 + (mobile() ? -H * 0.02 : 0);
    A = { W, H, x, y, w, h, r: w / 2 };
    // контур арки: снизу слева → вверх → полукруг → вниз справа
    archLine.setAttribute('d', `M${x},${y + h} V${y + A.r} A${A.r},${A.r} 0 0 1 ${x + w},${y + A.r} V${y + h}`);
    $('#archSvg').setAttribute('viewBox', `0 0 ${W} ${H}`);
    root.style.setProperty('--mono-w', (w * 0.56) + 'px');
    setReveal(state.reveal);
  }

  /* вырез фото: p=0 — форма арки, p=1 — весь экран */
  function setReveal(p) {
    state.reveal = p;
    const k = 1 - p;
    const t = A.y * k, b = (A.H - A.y - A.h) * k, l = A.x * k, r = (A.W - A.x - A.w) * k;
    // верх остаётся аркой (полукруг на всю текущую ширину) почти до конца, потом плавно выпрямляется
    const curW = A.W - l - r;
    const rad = (curW / 2) * Math.pow(k, 0.55);
    photo.style.clipPath = `inset(${t}px ${r}px ${b}px ${l}px round ${rad}px ${rad}px ${4 * k}px ${4 * k}px)`;
  }

  /* проявление частей монограммы «шторкой» по диагонали */
  const NS = 'http://www.w3.org/2000/svg';
  function makeWipe(svg, el, dir) {
    const defs = svg.querySelector('defs');
    const len = Math.hypot(dir[0], dir[1]); const d = [dir[0] / len, dir[1] / len]; const n = [-d[1], d[0]];
    const bb = el.getBBox();
    const corners = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]];
    const proj = corners.map(c => c[0] * d[0] + c[1] * d[1]);
    const min = Math.min(...proj), max = Math.max(...proj);
    const cp = document.createElementNS(NS, 'clipPath'); cp.id = 'wipe-' + el.id; cp.setAttribute('clipPathUnits', 'userSpaceOnUse');
    const poly = document.createElementNS(NS, 'polygon'); cp.appendChild(poly); defs.appendChild(cp);
    el.setAttribute('clip-path', `url(#${cp.id})`);
    const o = { t: 0 }, BIG = 5000;
    const draw = () => {
      const s = min + (max - min) * o.t;
      const c = [d[0] * s, d[1] * s]; // точка на линии фронта (проекция от начала координат)
      const p1 = [c[0] + n[0] * BIG, c[1] + n[1] * BIG], p2 = [c[0] - n[0] * BIG, c[1] - n[1] * BIG];
      const p3 = [p2[0] - d[0] * BIG, p2[1] - d[1] * BIG], p4 = [p1[0] - d[0] * BIG, p1[1] - d[1] * BIG];
      poly.setAttribute('points', [p1, p2, p3, p4].map(p => p.join(',')).join(' '));
    };
    draw();
    return { o, draw };
  }

  /* блик по золоту: полоса света, видимая только на буквах */
  function makeShine(svg) {
    const defs = svg.querySelector('defs');
    const mask = document.createElementNS(NS, 'mask'); mask.id = 'shine-mask';
    ['x-thin', 'v', 'x-ribbon'].forEach(id => { const c = svg.getElementById(id).cloneNode(); c.removeAttribute('id'); c.removeAttribute('clip-path'); c.setAttribute('fill', '#fff'); mask.appendChild(c); });
    defs.appendChild(mask);
    const g = document.createElementNS(NS, 'linearGradient'); g.id = 'shine-grad';
    [['0', 'rgba(255,246,220,0)'], ['.5', 'rgba(255,246,220,.85)'], ['1', 'rgba(255,246,220,0)']].forEach(([o, c]) => { const s = document.createElementNS(NS, 'stop'); s.setAttribute('offset', o); s.setAttribute('stop-color', c); g.appendChild(s); });
    defs.appendChild(g);
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('y', -400); rect.setAttribute('width', 260); rect.setAttribute('height', 2000); rect.setAttribute('x', -700);
    rect.setAttribute('fill', 'url(#shine-grad)'); rect.setAttribute('transform', 'rotate(20 500 500)');
    const wrap = document.createElementNS(NS, 'g'); wrap.setAttribute('mask', 'url(#shine-mask)'); wrap.appendChild(rect);
    svg.appendChild(wrap);
    return rect;
  }

  /* пылинки в лучах света (останавливаются, когда первый экран не виден) */
  function dust() {
    const c = $('#dust'), ctx = c.getContext('2d'); let w, h, dpr, run = false, last = 0;
    const parts = [];
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);
    const N = mobile() ? 26 : 48;
    for (let i = 0; i < N; i++) parts.push({ x: Math.random() * w, y: Math.random() * h, r: .5 + Math.random() * 1.6, vy: -(.06 + Math.random() * .18), ph: Math.random() * 6.28, a: .15 + Math.random() * .4 });
    function loop(t) {
      if (!run) return;
      // скорость как в прототипе при первом открытии, но одинаковая на экранах 60 и 120 Гц
      const k = last ? Math.min((t - last) / 16.7, 3) * 2 : 2; last = t;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y += p.vy * k; p.x += Math.sin(t / 2600 + p.ph) * .12 * k;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        const tw = .6 + .4 * Math.sin(t / 900 + p.ph);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(255,236,200,${p.a * tw})`); g.addColorStop(1, 'rgba(255,236,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    new IntersectionObserver(([e]) => {
      const was = run; run = e.isIntersecting;
      hero.classList.toggle('is-off', !run); // пауза «живого фото», пока первый экран не виден
      if (run && !was) { last = 0; requestAnimationFrame(loop); }
    }).observe(hero);
  }

  let intro = null;
  function initHeroIntro() {
    const svg = $('.mono', hero);
    archBox();
    const len = archLine.getTotalLength();
    gsap.set(archLine, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set(mark, { opacity: 1 });
    gsap.set(['#word', '#sub'], { opacity: 0 });
    gsap.set(photo, { opacity: 0 });
    const wipes = {
      thin: makeWipe(svg, svg.getElementById('x-thin'), [-0.62, 1]),   // сверху справа вниз влево
      ribbon: makeWipe(svg, svg.getElementById('x-ribbon'), [0.55, 1]), // сверху слева вниз
      v: makeWipe(svg, svg.getElementById('v'), [0, 1])                  // сверху вниз к острию
    };
    const shine = makeShine(svg);
    intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to(archLine, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 0.2)
      .to(wipes.thin.o, { t: 1, duration: 0.9, onUpdate: wipes.thin.draw }, 1.1)
      .to(wipes.ribbon.o, { t: 1, duration: 0.9, onUpdate: wipes.ribbon.draw }, 1.25)
      .to(wipes.v.o, { t: 1, duration: 0.9, onUpdate: wipes.v.draw }, 1.4)
      .to(shine, { attr: { x: 1500 }, duration: 1.1, ease: 'power2.inOut' }, 2.05)
      .fromTo('#word', { opacity: 0, letterSpacing: '0.6em' }, { opacity: 1, letterSpacing: '0.32em', duration: 1.0 }, 2.2)
      .fromTo('#sub', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.8 }, 2.45)
      .to([header, '#cue'], { opacity: 1, duration: 0.8 }, 2.6);
    if (mobile()) intro.timeScale(1.35);
    try { if (sessionStorage.getItem('valeri-intro')) intro.timeScale(5); sessionStorage.setItem('valeri-intro', '1'); } catch (e) {}
    // если человек начал листать во время вступления — сразу к концу
    const skip = () => { if (intro.progress() < 1) intro.progress(1); };
    ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, skip, { once: true, passive: true }));
    // страница открылась не в начале (обновление, переход по ссылке с #) — вступление не нужно
    if (scrollY > innerHeight * 0.5 || location.hash.length > 1) skip();
    dust();
  }

  /* «проход сквозь арку» при прокрутке */
  function initHeroScroll() {
    hero.style.marginBottom = '0px'; // резерв места из CSS заменяет настоящее закрепление
    const split = SplitText.create('#h1', { type: 'lines', mask: 'lines' });
    gsap.set('#copy .line-wrap, #copy .eyebrow, #copy .lead, #copy .actions', { opacity: 1 });
    gsap.set(split.lines, { yPercent: 110 });
    gsap.set('#copy .eyebrow, #copy .lead, #copy .actions', { opacity: 0, y: 18 });

    const r = { p: 0 };
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: () => '+=' + pinLength(), pin: true, scrub: 1, invalidateOnRefresh: true }
    })
      .to(mark, { opacity: 0, y: -60, duration: 0.18 }, 0)
      .to('#cue', { opacity: 0, duration: 0.08 }, 0)
      .fromTo(photo, { opacity: 0 }, { opacity: 1, duration: 0.16 }, 0.02)
      .fromTo(photoScale, { scale: 1.3 }, { scale: 1, duration: 0.55, ease: 'power1.out' }, 0.08)
      .to(r, { p: 1, duration: 0.5, ease: 'power2.inOut', onUpdate: () => setReveal(r.p) }, 0.12)
      .to('#archSvg', { opacity: 0, scale: 1.35, transformOrigin: '50% 50%', duration: 0.26 }, 0.12)
      .to('#shade', { opacity: 1, duration: 0.2 }, 0.52)
      .to('#copy .eyebrow', { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.62)
      .to(split.lines, { yPercent: 0, duration: 0.18, stagger: 0.05, ease: 'power3.out' }, 0.66)
      .to('#copy .lead', { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.8)
      .to('#copy .actions', { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.86)
      .to({}, { duration: 0.1 }); // небольшая пауза, прежде чем секция открепится
  }

  /* ---------- 5. Появление блоков при прокрутке ---------- */
  function initReveals() {
    // сначала только записываем начальные состояния, потом создаём триггеры:
    // так браузер пересчитывает раскладку страницы один раз, а не на каждом элементе
    const reveal = $$('[data-reveal]');
    const curtains = $$('[data-curtain]');
    const num = $('.rating-num');
    gsap.set(reveal, { opacity: 0, y: 24 });
    curtains.forEach((el) => {
      gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set($$('img', el), { scale: el.closest('.valeria-photo') ? 1.1 : 1.08 });
    });
    if (num) num.textContent = '0,0';

    // заголовки секций — по строкам, маской снизу; строки считаем, когда до заголовка доходит прокрутка
    $$('[data-split]').forEach((el) => ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => {
        const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
        gsap.set(split.lines, { yPercent: 110 });
        el.classList.add('is-split');
        gsap.to(split.lines, { yPercent: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' });
      }
    }));
    // обычный текст и блоки — целиком, мягко снизу
    ScrollTrigger.batch(reveal, {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out', overwrite: true })
    });
    // фото — шторкой снизу вверх и с лёгким уменьшением
    curtains.forEach((el) => ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => {
        gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out' });
        gsap.to($$('img', el), { scale: 1, duration: 1.4, ease: 'expo.out' });
      }
    }));
    // рейтинг: плавный отсчёт от 0 до 5,0
    if (num) {
      const o = { v: 0 };
      ScrollTrigger.create({
        trigger: num, start: 'top 88%', once: true,
        onEnter: () => gsap.to(o, { v: parseFloat(num.dataset.count), duration: 1.2, ease: 'power3.out', onUpdate: () => { num.textContent = o.v.toFixed(1).replace('.', ','); } })
      });
    }
  }

  /* ---------- 6. Ползунки «до / после» ----------
     Мышью линию можно тянуть за любое место фото. На телефоне тянем за ручку,
     а свайп по самому фото листает ленту; короткое касание переносит линию в точку касания.
     С клавиатуры работает невидимый ползунок <input type="range">. */
  function initCompare() {
    $$('.compare').forEach((frame) => {
      const input = $('.compare-range', frame);
      if (!input) return;
      const flip = frame.classList.contains('compare--feature'); // «после» слева
      const lb = $('.compare-label--before', frame), la = $('.compare-label--after', frame);
      const set = (v) => {
        v = Math.max(0, Math.min(100, v));
        frame.style.setProperty('--pos', v + '%');
        input.value = String(Math.round(v));
        const afterShare = flip ? v : 100 - v;
        la.style.opacity = afterShare < 6 ? '0' : '';
        lb.style.opacity = afterShare > 94 ? '0' : '';
        input.setAttribute('aria-valuetext', `«После» — ${Math.round(afterShare)} %`);
      };
      frame.compareSet = set;
      set(+input.value);
      input.addEventListener('input', () => set(+input.value));
      input.addEventListener('focus', () => frame.classList.toggle('is-focus', input.matches(':focus-visible')));
      input.addEventListener('blur', () => frame.classList.remove('is-focus'));

      const posFrom = (x) => { const r = frame.getBoundingClientRect(); return (x - r.left) / r.width * 100; };
      let drag = null;
      frame.addEventListener('pointerdown', (e) => {
        const onHandle = !!e.target.closest('.compare-divider i');
        if (e.pointerType === 'mouse' || onHandle) {
          drag = { id: e.pointerId };
          frame.setPointerCapture(e.pointerId);
          frame.classList.add('is-drag');
          set(posFrom(e.clientX));
          e.preventDefault();
        } else {
          drag = { tap: true, x: e.clientX, y: e.clientY, t: performance.now() };
        }
      });
      frame.addEventListener('pointermove', (e) => { if (drag && !drag.tap) set(posFrom(e.clientX)); });
      const end = (e) => {
        if (!drag) return;
        // короткое касание без сдвига — переносим линию в точку касания
        if (drag.tap && e.type === 'pointerup' && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8 && performance.now() - drag.t < 400) {
          const o = { v: parseFloat(frame.style.getPropertyValue('--pos')) || 50 };
          if (motion) gsap.to(o, { v: posFrom(e.clientX), duration: 0.35, ease: 'power3.out', onUpdate: () => set(o.v) });
          else set(posFrom(e.clientX));
        }
        drag = null;
        frame.classList.remove('is-drag');
      };
      frame.addEventListener('pointerup', end);
      frame.addEventListener('pointercancel', end);
    });
  }

  /* ---------- 7. Ленты со стрелками ---------- */
  function initStrips() {
    const groups = {};
    $$('[data-target]').forEach((btn) => (groups[btn.dataset.target] ||= []).push(btn));
    Object.entries(groups).forEach(([id, btns]) => {
      const strip = document.getElementById(id);
      if (!strip) return;
      btns.forEach((btn) => btn.addEventListener('click', () => {
        const item = strip.firstElementChild;
        const gap = parseFloat(getComputedStyle(strip).columnGap) || 20;
        const step = item ? item.getBoundingClientRect().width + gap : 320;
        strip.scrollBy({ left: step * Number(btn.dataset.dir), behavior: motion ? 'smooth' : 'auto' });
      }));
      // стрелка гаснет, когда дальше листать некуда
      const update = () => {
        const max = strip.scrollWidth - strip.clientWidth - 4;
        btns.forEach((b) => { b.disabled = b.dataset.dir === '-1' ? strip.scrollLeft <= 4 : strip.scrollLeft >= max; });
      };
      strip.addEventListener('scroll', update, { passive: true });
      addEventListener('resize', update);
      update();
    });
  }

  /* ---------- 7а. До и после: главный пример раскрывается прокруткой ---------- */
  function initResults() {
    const stage = $('#resultsStage'), feat = $('#compareFeature');
    if (!stage || !feat) return;
    feat.compareSet(0);
    const aside = $('.results-aside');
    const o = { v: 0 };
    gsap.timeline({
      scrollTrigger: { trigger: stage, start: 'top top', end: () => '+=' + innerHeight * 1.2, pin: true, scrub: 1, invalidateOnRefresh: true }
    })
      .to({}, { duration: 0.08 })
      .to(o, { v: 100, duration: 0.82, ease: 'power1.inOut', onUpdate: () => { feat.compareSet(o.v); aside?.style.setProperty('--p', o.v / 100); } })
      .to({}, { duration: 0.1 }); // пауза на «после», прежде чем секция открепится
  }

  /* ---------- 7б. Процедуры: появление строк и смена картинки у списка ---------- */
  function initServices() {
    const media = $('.services-media');
    const rows = $$('.price-row');
    // картинка в арке: detail-products → process-hair, когда список пролистан до середины
    if (media && rows[3]) {
      ScrollTrigger.create({
        trigger: rows[3], start: 'top 60%',
        onEnter: () => media.classList.add('is-b'), onLeaveBack: () => media.classList.remove('is-b')
      });
    }
    if (!motion) return;
    // строки по очереди: линия прорисовывается, затем текст поднимается на 16 px
    ScrollTrigger.batch(rows, {
      start: 'top 90%', once: true,
      onEnter: (batch) => batch.forEach((row, i) => {
        const btn = $('.price-btn', row);
        gsap.timeline({ delay: i * 0.08 })
          .to(row, { '--line': 1, duration: 0.9, ease: 'expo.out' }, 0)
          .to([$('.price-num', btn), $('.price-main', btn), $('.price-cost', btn)], { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: 'power3.out' }, 0.18)
          .to($('.price-arrow', btn), { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.4);
      })
    });
  }

  /* ---------- 7в. Студия: на компьютере вертикальная прокрутка двигает ленту по горизонтали ---------- */
  function initStudio() {
    const stage = $('#studioStage'), flow = $('#studioFlow'), track = $('#studioTrack');
    if (!stage || !flow || !track) return;
    const arches = $$('.arch', track);
    // фото проявляются шторкой снизу вверх, по очереди
    gsap.set(arches, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set($$('img', track), { scale: 1.08 });
    ScrollTrigger.create({
      trigger: track, start: 'top 85%', once: true,
      onEnter: () => {
        gsap.to(arches, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, stagger: 0.08, ease: 'expo.out' });
        gsap.to($$('img', track), { scale: 1, duration: 1.4, stagger: 0.08, ease: 'expo.out' });
      }
    });

    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      // насколько нужно сдвинуть ленту, чтобы показать последнее фото
      const distance = () => {
        const last = track.lastElementChild.getBoundingClientRect(), box = flow.getBoundingClientRect();
        const padR = parseFloat(getComputedStyle(flow).paddingRight) || 0;
        return Math.max(0, last.right - box.left + padR - innerWidth);
      };
      const move = gsap.to(flow, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: {
          trigger: stage, start: 'top top', end: () => '+=' + distance() * 0.6,
          pin: true, scrub: 1, invalidateOnRefresh: true
        }
      });
      // параллакс: фото внутри арки отстаёт от рамки примерно на 8 %
      $$('.studio-shot', track).forEach((shot) => {
        gsap.fromTo($('img', shot), { xPercent: -7 }, {
          xPercent: 7, ease: 'none',
          scrollTrigger: { trigger: shot, containerAnimation: move, start: 'left right', end: 'right left', scrub: true }
        });
      });
    });
  }

  /* ---------- 7г. Запись: фон чуть медленнее прокрутки ---------- */
  function initContacts() {
    const img = $('.contacts-bg img');
    if (!img) return;
    gsap.fromTo(img, { yPercent: -5, scale: 1.08 }, {
      yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: '#contacts', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- 8. Процедуры: окно с полным описанием ----------
     Тексты и цены — дословно из текущего сайта (script-base.js). */
  const serviceData = {
    reconstruction: { kicker: 'Комплекс №1', title: 'Восстановление и реконструкция', lead: 'Базовый комплекс глубокого восстановления и питания для сухих, ломких и повреждённых волос. Подходит детям.', groups: [['Если волосы', ['сухие и ломкие', 'повреждены после окрашивания', 'путаются и трудно расчёсываются', 'потеряли блеск и мягкость', 'выглядят тусклыми и безжизненными']], ['Что даёт процедура', ['глубоко восстанавливает структуру волос', 'насыщает аминокислотами, белками и витаминами', 'увлажняет и питает по всей длине', 'делает волосы мягкими, гладкими и послушными']], ['Комплекс включает', ['1. Очищение и подготовка волос', '2. Глубокое восстановление и питание', '3. Закрепление результата и защита']]], price: [['Стоимость', '300 BYN'], ['Длина более 60 см', 'доплата до 70 BYN'], ['Выраженная густота', 'доплата до 70 BYN']], note: 'Подходит детям, обладателям сухих и повреждённых волос, после кератина/ботокса/окрашивания и для поддержания качества волос между процедурами.' },
    biotin: { kicker: 'Комплекс №2', title: 'BIOTIN', lead: 'Технология восстановления волос для укрепления длины. Подходит детям и кудрявым волосам.', groups: [['Если волосы', ['ломаются по длине', 'повреждены после окрашивания и осветления', 'путаются и сложно расчёсываются', 'стали тонкими и ослабленными', 'не получается отрастить длину']], ['Что даёт процедура', ['укрепляет структуру волос изнутри', 'снижает ломкость и сечение', 'помогает сохранить и отрастить длину', 'повышает прочность и эластичность', 'сохраняет объём без утяжеления', 'делает волосы лёгкими и рассыпчатыми']], ['Активные компоненты', ['биотин B7', 'аминокислоты', 'protein-комплекс', 'гидролизованный коллаген', 'активные восстанавливающие компоненты нового поколения']]], price: [['Стоимость', '330 BYN'], ['Длина более 60 см', 'доплата до 70 BYN'], ['Выраженная густота', 'доплата до 70 BYN']] },
    strotex: { kicker: 'Комплекс №3', title: 'STROTEX', lead: 'Самое мощное восстановление для блонда, пушистых, пористых и сильно повреждённых волос.', highlight: 'STROTEX — первая в Беларуси система восстановления волос такого формата.', groups: [['Если волосы', ['повреждены окрашиванием или утюжками', 'пушатся и теряют гладкость', 'ломаются по длине', 'выглядят тусклыми и безжизненными', 'имеют нежелательный жёлтый оттенок после осветления']], ['Что даёт процедура', ['максимально восстанавливает структуру волос', 'глубоко уплотняет волос изнутри', 'уменьшает пушистость и пористость', 'придаёт гладкость и эффект ламинирования', 'визуально делает блонд более чистым и ярким', 'усиливает блеск без утяжеления']], ['Комплекс включает', ['аминокислотный комплекс', 'восстановление дисульфидных связей', 'гиалуроновую кислоту', 'биоминералы', 'восстанавливающие компоненты глубокого действия', 'защитный комплекс для закрепления результата']]], price: [['Стоимость', '350 BYN'], ['Длина более 60 см', 'доплата до 70 BYN'], ['Выраженная густота', 'доплата до 70 BYN']], note: 'Важно: это не тонирование. Более чистый и яркий визуальный оттенок достигается за счёт глубокого восстановления структуры волос.' },
    vivabond: { kicker: 'Комплекс №4', title: 'VIVA BOND™', lead: 'Восстановление повреждённых и пушистых волос с разглаживающим и ламинирующим эффектом — без кератина.', highlight: 'VIVA BOND™ — первая в Беларуси система восстановления с разглаживающим эффектом.', groups: [['Если волосы', ['пушатся при малейшей влажности', 'выглядят пористыми и неухоженными', 'повреждены окрашиванием или осветлением', 'путаются и сложно укладываются', 'хочется гладкости и блеска без утяжеления']], ['Что даёт процедура', ['частично убирает пушистость и пористость', 'создаёт натуральный гладкий эффект без перегружения', 'уплотняет структуру волос', 'делает волосы более послушными и ухоженными', 'сохраняет естественный объём у корней', 'придаёт интенсивный блеск и эффект ламинирования']], ['Комплекс включает', ['bond-комплекс нового поколения', 'аминокислотный комплекс', 'формирование новых водородных и ионных связей внутри волоса', 'восстановление повреждённых участков кератиновой структуры', 'компоненты ультрауплотнения', 'защитный ламинирующий комплекс']]], price: [['Стоимость', '380 BYN'], ['Длина более 60 см', 'доплата до 70 BYN'], ['Выраженная густота', 'доплата до 70 BYN']], note: 'Комплекс разглаживает волосы, но не выпрямляет сильный завиток.' },
    keratin: { kicker: 'PRICE LIST', title: 'Кератин / ботокс', lead: 'Процедура направлена на выпрямление — от лёгкой волны до тугого завитка. Придаёт гладкость, рассыпчатость, блеск и мягкость и помогает сократить время на укладку.', groups: [['Дополнительно', ['1 шаг восстановления — в подарок', 'укрепление волос профессиональной несмываемой сывороткой — в подарок', 'активные компоненты помогают удерживать влагу и защищают структуру волос']], ['Ориентир', ['время процедуры: около 3,5–4 часов', 'эффект: ориентировочно 3–7 месяцев']]], price: [['Короткие — до 30 см', '350 BYN'], ['Средние — до 50 см', '400 BYN'], ['Длинные — до 80 см', '450 BYN'], ['Очень длинные — от 80 см', '500 BYN']], note: 'Доплата за густоту: 6–7 см — без доплаты; 8–9 см — 30 BYN; 10–11 см — 40 BYN; свыше 12 см — 60 BYN.' },
    total: { kicker: 'PRICE LIST', title: 'Тотальная реконструкция', lead: 'Две полноценные процедуры в один день: мощное многоступенчатое восстановление волос любой сложности + кератин/ботокс. В комплекс входит премиальный комплекс витаминов A, E и F.', groups: [['Что входит', ['многоступенчатое восстановление', 'кератин / ботокс', 'премиальный комплекс витаминов A, E, F']]], price: [['Короткие — до 30 см', '400 BYN'], ['Средние — до 50 см', '450 BYN'], ['Длинные — до 80 см', '500 BYN'], ['Очень длинные — от 80 см', '600 BYN']], note: 'Доплата за густоту: 6–7 см — без доплаты; 8–9 см — 30 BYN; 10–11 см — 40 BYN; свыше 12 см — 60 BYN.' },
    peeling: { kicker: 'Уход за кожей головы', title: 'Пилинг кожи головы', lead: 'Глубокое очищение кожи головы с терапевтическим уходовым эффектом.', groups: [['Что даёт пилинг', ['помогает снять зуд, воспаление и дискомфорт', 'глубоко очищает кожу головы и продлевает ощущение свежести', 'улучшает состояние кожи вокруг волосяных фолликулов', 'уменьшает жирность корней', 'подготавливает кожу и волосы к последующим процедурам']], ['Кому подходит', ['при жирной коже головы', 'при наличии перхоти', 'если голова быстро загрязняется', 'при зуде или неприятных ощущениях', 'при частом использовании стайлинга']]], price: [['Отдельная процедура', '80 BYN'], ['В дополнение к другой процедуре', '40 BYN']] }
  };

  const modal = $('#serviceModal');
  const modalPanel = $('.modal-panel', modal);
  let modalOpener = null;

  function renderService(key) {
    const s = serviceData[key];
    if (!s) return;
    $('#modalKicker').textContent = s.kicker;
    $('#modalTitle').textContent = s.title;
    $('#modalLead').textContent = s.lead;
    let html = '';
    if (s.highlight) html += `<div class="modal-highlight"><span>Первое в Беларуси</span><p>${s.highlight}</p></div>`;
    s.groups.forEach(([title, items]) => { html += `<div class="modal-group"><h3>${title}</h3><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`; });
    html += `<div class="modal-group"><h3>Стоимость</h3><table class="price-table"><tbody>${s.price.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table></div>`;
    if (s.note) html += `<div class="modal-callout">${s.note}</div>`;
    $('#modalBody').innerHTML = html;
    $('.modal-scroll', modal).scrollTop = 0;
  }

  function openModal(key, opener) {
    renderService(key);
    modalOpener = opener || document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll(true);
    setTimeout(() => $('.modal-close', modal).focus({ preventScroll: true }), 60);
  }
  function closeModal() {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    lockScroll(false);
    modalOpener?.focus({ preventScroll: true });
  }

  function initModal() {
    $$('[data-service]').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.service, btn)));
    $$('[data-close-modal]', modal).forEach(el => el.addEventListener('click', closeModal));
    // кнопка записи в окне: закрываем окно, ссылку DIKIDI обрабатывает его виджет
    $('.modal-foot a', modal)?.addEventListener('click', () => closeModal());
    // фокус не уходит из открытого окна
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const f = $$('button, a[href], [tabindex]:not([tabindex="-1"])', modalPanel).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  // Esc закрывает окно процедуры и мобильное меню
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modal?.classList.contains('is-open')) closeModal();
    else if (menuOpen) { setMenu(false); toggle.focus(); }
  });

  /* ---------- 9. Раскрывающиеся разделы: плавное раскрытие по высоте ---------- */
  function initAccordions() {
    if (!motion) return; // без анимаций работают обычные <details>
    $$('.accordion details').forEach((d) => {
      const summary = $('summary', d), body = $('.acc-body', d);
      let busy = false;
      summary.addEventListener('click', (e) => {
        e.preventDefault();
        if (busy) return;
        busy = true;
        if (d.open) {
          gsap.fromTo(body, { height: body.offsetHeight }, { height: 0, opacity: 0, duration: 0.5, ease: 'power3.out', onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'height,opacity' }); busy = false; ScrollTrigger.refresh(); } });
          $('i', summary).style.transform = 'rotate(0deg)';
        } else {
          d.open = true;
          $('i', summary).style.transform = '';
          gsap.fromTo(body, { height: 0, opacity: 0 }, { height: body.scrollHeight, opacity: 1, duration: 0.6, ease: 'power3.out', onComplete: () => { gsap.set(body, { clearProps: 'height,opacity' }); busy = false; ScrollTrigger.refresh(); } });
        }
      });
      body.style.overflow = 'hidden';
    });
  }

  /* ---------- 10. Запись и контакты: контур арки ---------- */
  function initBookingArch() {
    const box = $('#bookingArch');
    if (!box) return;
    const svg = $('svg', box), path = $('path', svg);
    const draw = () => {
      const w = box.clientWidth, h = box.clientHeight, r = w / 2;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      path.setAttribute('d', `M0.7,${h} V${r} A${r - 0.7},${r - 0.7} 0 0 1 ${w - 0.7},${r} V${h}`);
    };
    draw();
    new ResizeObserver(draw).observe(box);
    if (motion) {
      // контур прорисовывается при появлении секции, как на первом экране
      const len = () => path.getTotalLength();
      gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, {
        strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut',
        scrollTrigger: { trigger: box, start: 'top 75%', once: true }
      });
    }
  }

  /* ---------- 11. Запуск ---------- */
  initAnchors();
  initCompare();
  initStrips();
  initModal();
  initBookingArch();

  if (!motion) {
    // режим без анимаций: всё видно сразу, шапка работает на обычной прокрутке
    if (hasGsap) { gsap.registerPlugin(ScrollTrigger); initServices(); }
    onScrollHeader(scrollY);
    addEventListener('scroll', () => onScrollHeader(scrollY), { passive: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  addEventListener('resize', archBox);
  initHeroIntro();

  // строки заголовков считаем после загрузки шрифтов, иначе переносы будут неточными
  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1200))]);
  fontsReady.then(() => {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', (e) => { ScrollTrigger.update(); onScrollHeader(e.scroll); });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    if (menuOpen || modal.classList.contains('is-open')) lenis.stop();

    // порядок важен: закрепления создаём сверху вниз.
    // Работу делим на несколько коротких задач, чтобы не подвешивать телефон во время вступления.
    initHeroScroll();
    initResults();
    setTimeout(() => {
      initServices();
      initStudio();
      initContacts();
      setTimeout(() => {
        initReveals();
        initAccordions();
        ScrollTrigger.refresh();
        // переход по ссылке с якорем: после закреплений позиции изменились — прокручиваем заново
        if (location.hash.length > 1) {
          const t = document.getElementById(location.hash.slice(1));
          if (t) requestAnimationFrame(() => scrollToTarget(t, true));
        }
        onScrollHeader(scrollY);
      }, 0);
    }, 0);
  });
})();
