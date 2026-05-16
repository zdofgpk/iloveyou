/* ============================================================
   NUESTRO PRIMER AÑO — script.js
   Real 3D Page Flip | Mobile Swipe | Poem Modal | Heart Rain
   ============================================================ */
'use strict';

// ── DOM ────────────────────────────────────────────────────
const cover       = document.getElementById('cover');
const book        = document.getElementById('book');
const pagesStack  = document.getElementById('pagesStack');
const pages       = Array.from(document.querySelectorAll('.page'));
const prevBtn     = document.getElementById('prevBtn');
const nextBtn     = document.getElementById('nextBtn');
const dotsWrap    = document.getElementById('dotsWrap');
const restartBtn  = document.getElementById('restartBtn');
const musicBtn    = document.getElementById('musicBtn');
const bgMusic     = document.getElementById('bgMusic');
const iPlay       = document.getElementById('iPlay');
const iPause      = document.getElementById('iPause');
const heartCanvas = document.getElementById('heartRain');
const ctx         = heartCanvas.getContext('2d');
const ambientEl   = document.getElementById('ambientHearts');
const poemTrigger = document.getElementById('poemTrigger');
const poemModal   = document.getElementById('poemModal');
const poemClose   = document.getElementById('poemClose');

const TOTAL = pages.length;
let current = 0;
let busy    = false;
let musicOn = false;

// ══════════════════════════════════════════════════════════
// 1. HEART RAIN (Canvas — 10 seconds)
// ══════════════════════════════════════════════════════════
function resizeCanvas() {
  heartCanvas.width  = window.innerWidth;
  heartCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive: true });

// Draw one heart shape centred at (cx, cy)
function heartPath(cx, cy, size) {
  const s = size / 28;
  ctx.save();
  ctx.translate(cx, cy + size * .12);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.bezierCurveTo(-18, -28, -42, -14, -28, 6);
  ctx.lineTo(0, 28);
  ctx.lineTo(28, 6);
  ctx.bezierCurveTo(42, -14, 18, -28, 0, -10);
  ctx.restore();
}

class RainHeart {
  constructor(initial = false) { this.reset(initial); }
  reset(initial = false) {
    this.x     = Math.random() * heartCanvas.width;
    this.y     = initial ? Math.random() * -heartCanvas.height : -55;
    this.size  = 12 + Math.random() * 34;
    this.speed = .5 + Math.random() * 1.3;
    this.drift = (Math.random() - .5) * .55;
    this.alpha = .12 + Math.random() * .5;
    this.rot   = (Math.random() - .5) * .4;
    this.rotV  = (Math.random() - .5) * .018;
    const pal  = ['#e8546a','#ff9aae','#ffd6e0','#c9a96e','#ffb3c1'];
    this.color = pal[Math.floor(Math.random() * pal.length)];
  }
  update() {
    this.y   += this.speed;
    this.x   += this.drift;
    this.rot += this.rotV;
    if (this.y > heartCanvas.height + 60) this.reset();
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.translate(-this.x, -this.y);
    heartPath(this.x, this.y, this.size);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.fill();
    ctx.restore();
  }
}

const RAIN_N  = 50;
const rain    = Array.from({ length: RAIN_N }, () => new RainHeart(true));
let rainOn    = true;
const RAIN_MS = 10000;
let rainT0;

function rainLoop(ts) {
  if (!rainOn) { ctx.clearRect(0, 0, heartCanvas.width, heartCanvas.height); return; }
  if (!rainT0) rainT0 = ts;
  const elapsed = ts - rainT0;
  const fade    = elapsed > RAIN_MS - 2000
    ? Math.max(0, 1 - (elapsed - (RAIN_MS - 2000)) / 2000)
    : 1;
  ctx.clearRect(0, 0, heartCanvas.width, heartCanvas.height);
  rain.forEach(h => {
    h.update();
    ctx.globalAlpha = h.alpha * fade;
    h.draw();
  });
  if (elapsed >= RAIN_MS) { rainOn = false; ctx.clearRect(0, 0, heartCanvas.width, heartCanvas.height); return; }
  requestAnimationFrame(rainLoop);
}
requestAnimationFrame(rainLoop);

// ══════════════════════════════════════════════════════════
// 2. AMBIENT FLOATING HEARTS
// ══════════════════════════════════════════════════════════
function spawnAmbient() {
  const el   = document.createElement('div');
  el.className = 'a-heart';
  const sz   = 10 + Math.random() * 26;
  const pal  = ['#e8546a','#ff9aae','#ffd6e0','#c9a96e'];
  const fill = pal[Math.floor(Math.random() * pal.length)];
  const dur  = 10 + Math.random() * 12;
  const del  = Math.random() * 14;
  const dx   = (Math.random() - .5) * 80;
  const op   = (.06 + Math.random() * .18).toFixed(2);

  el.style.cssText = `left:${Math.random()*100}%;--dur:${dur}s;--delay:${del}s;--dx:${dx}px;--op:${op};`;
  el.innerHTML = `<svg viewBox="0 0 50 46" width="${sz}" height="${sz}">
    <path d="M25 42 C10 30 1 22 1 13 A13 13 0 0 1 25 9 A13 13 0 0 1 49 13 C49 22 40 30 25 42Z" fill="${fill}"/>
  </svg>`;
  ambientEl.appendChild(el);
}
for (let i = 0; i < 20; i++) setTimeout(() => spawnAmbient(), i * 380);

// ══════════════════════════════════════════════════════════
// 3. BURST PARTICLES (on cover open)
// ══════════════════════════════════════════════════════════
function burstParticles() {
  const ring = document.getElementById('burstRing');
  const N    = 22;
  const pal  = ['#e8546a','#ff9aae','#ffd6e0','#c9a96e','#ffb3c1'];

  for (let i = 0; i < N; i++) {
    const p     = document.createElement('div');
    const angle = (360 / N) * i;
    const dist  = 75 + Math.random() * 55;
    const sz    = 7 + Math.random() * 13;
    const fill  = pal[Math.floor(Math.random() * pal.length)];
    const rad   = angle * Math.PI / 180;
    const tx    = Math.cos(rad) * dist;
    const ty    = Math.sin(rad) * dist;

    p.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0;pointer-events:none;';
    p.innerHTML = `<svg viewBox="0 0 50 46" width="${sz}" height="${sz}" style="fill:${fill}">
      <path d="M25 42 C10 30 1 22 1 13 A13 13 0 0 1 25 9 A13 13 0 0 1 49 13 C49 22 40 30 25 42Z"/>
    </svg>`;
    ring.appendChild(p);

    p.animate([
      { opacity: 0, transform: 'translate(-50%,-50%) scale(0)' },
      { opacity: 1, transform: `translate(calc(-50% + ${tx*.35}px),calc(-50% + ${ty*.35}px)) scale(1)`, offset: .18 },
      { opacity: .9, transform: `translate(calc(-50% + ${tx}px),calc(-50% + ${ty}px)) scale(1)`, offset: .55 },
      { opacity: 0, transform: `translate(calc(-50% + ${tx*1.5}px),calc(-50% + ${ty*1.5+35}px)) scale(.6)` }
    ], {
      duration: 850 + Math.random() * 450,
      delay:    Math.random() * 160,
      easing:   'cubic-bezier(.25,.46,.45,.94)',
      fill:     'forwards'
    });
  }
  setTimeout(() => { ring.innerHTML = ''; }, 1800);
}

// ══════════════════════════════════════════════════════════
// 4. COVER → OPEN BOOK
// ══════════════════════════════════════════════════════════
function openBook() {
  burstParticles();
  cover.classList.add('opening');

  setTimeout(() => {
    cover.classList.add('gone');
    book.classList.add('open');
    book.removeAttribute('aria-hidden');
    // Show first page
    pages[0].classList.add('current');
    buildDots();
    updateNav();
  }, 820);
}

cover.addEventListener('click', openBook);
cover.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBook(); }
});

// ══════════════════════════════════════════════════════════
// 5. PAGE FLIP
// ══════════════════════════════════════════════════════════
function goTo(target, dir) {
  if (busy || target < 0 || target >= TOTAL || target === current) return;
  busy = true;

  const outPage = pages[current];
  const inPage  = pages[target];

  // Prepare incoming page (visible but beneath)
  inPage.classList.add('current');

  // Outgoing: flip out
  const outClass = dir === 'next' ? 'flip-out-left' : 'flip-out-right';
  outPage.classList.add(outClass);

  // Incoming: flip in (slight delay so it appears from behind)
  const inClass  = dir === 'next' ? 'flip-in-right' : 'flip-in-left';
  setTimeout(() => { inPage.classList.add(inClass); }, 60);

  outPage.addEventListener('animationend', () => {
    outPage.classList.remove('current', outClass);
    inPage.classList.remove(inClass);
    current = target;
    busy    = false;
    updateNav();
    updateDots();
    // Trigger final celebration
    if (current === TOTAL - 1) fireFinal();
  }, { once: true });
}

// ── Navigation buttons ──────────────────────────────────
prevBtn.addEventListener('click', () => goTo(current - 1, 'prev'));
nextBtn.addEventListener('click', () => goTo(current + 1, 'next'));

function updateNav() {
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === TOTAL - 1;
}

// ── Keyboard ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!book.classList.contains('open')) return;
  if (poemModal.classList.contains('open')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(current + 1, 'next');
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(current - 1, 'prev');
});

// ── Touch / Swipe ────────────────────────────────────────
let tx0 = 0, ty0 = 0;
document.addEventListener('touchstart', e => {
  tx0 = e.changedTouches[0].clientX;
  ty0 = e.changedTouches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', e => {
  if (!book.classList.contains('open')) return;
  if (poemModal.classList.contains('open')) return;
  const dx = e.changedTouches[0].clientX - tx0;
  const dy = e.changedTouches[0].clientY - ty0;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 42) {
    if (dx < 0) goTo(current + 1, 'next');
    else         goTo(current - 1, 'prev');
  }
}, { passive: true });

// ── Dots ────────────────────────────────────────────────
function buildDots() {
  dotsWrap.innerHTML = '';
  pages.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', `Ir a página ${i + 1}`);
    d.addEventListener('click', () => goTo(i, i > current ? 'next' : 'prev'));
    dotsWrap.appendChild(d);
  });
}
function updateDots() {
  dotsWrap.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('active', i === current);
  });
}

// ══════════════════════════════════════════════════════════
// 6. POEM MODAL
// ══════════════════════════════════════════════════════════
function openPoem() {
  poemModal.classList.add('open');
  poemModal.focus();
}
function closePoem() {
  poemModal.classList.remove('open');
}

poemTrigger.addEventListener('click', openPoem);
poemTrigger.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPoem(); }
});
poemClose.addEventListener('click', closePoem);
poemModal.addEventListener('click', e => {
  if (e.target === poemModal) closePoem();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && poemModal.classList.contains('open')) closePoem();
});

// ══════════════════════════════════════════════════════════
// 7. FINAL CELEBRATION
// ══════════════════════════════════════════════════════════
let finalFired = false;
function fireFinal() {
  if (finalFired) return;
  finalFired = true;
  const pal = ['#e8546a','#ff9aae','#ffd6e0','#c9a96e','#ffb3c1'];
  for (let i = 0; i < 28; i++) {
    const h  = document.createElement('div');
    const sz = 12 + Math.random() * 22;
    const c  = pal[Math.floor(Math.random() * pal.length)];
    const lf = 15 + Math.random() * 70;
    h.innerHTML = `<svg viewBox="0 0 50 46" width="${sz}" height="${sz}" style="fill:${c}">
      <path d="M25 42 C10 30 1 22 1 13 A13 13 0 0 1 25 9 A13 13 0 0 1 49 13 C49 22 40 30 25 42Z"/>
    </svg>`;
    Object.assign(h.style, {
      position: 'fixed', left: `${lf}%`, bottom: '8%',
      zIndex: 400, pointerEvents: 'none'
    });
    document.body.appendChild(h);
    const rx = (Math.random() - .5) * 130;
    const ry = -(28 + Math.random() * 58);
    h.animate([
      { opacity: 0, transform: 'scale(0) rotate(0deg)' },
      { opacity: 1, transform: `translate(${rx*.3}px,${ry*.3}vh) scale(1) rotate(${Math.random()*180}deg)`, offset: .2 },
      { opacity: .8, transform: `translate(${rx}px,${ry}vh) scale(1) rotate(${Math.random()*360}deg)`, offset: .7 },
      { opacity: 0, transform: `translate(${rx*1.2}px,${ry*1.4}vh) scale(.7)` }
    ], {
      duration: 1600 + Math.random() * 900,
      delay:    Math.random() * 350,
      easing:   'cubic-bezier(.25,.46,.45,.94)',
      fill:     'forwards'
    }).finished.then(() => h.remove());
  }
}

// ══════════════════════════════════════════════════════════
// 8. RESTART
// ══════════════════════════════════════════════════════════
restartBtn.addEventListener('click', () => {
  book.style.opacity = '0';
  book.style.transition = 'opacity .4s';

  setTimeout(() => {
    // Reset pages state
    pages.forEach(p => {
      p.className = 'page';
      if (p.classList.contains('final-page')) p.classList.add('final-page');
      if (p.classList.contains('poem-trigger-page')) p.classList.add('poem-trigger-page');
    });
    current = 0;
    finalFired = false;
    book.classList.remove('open');
    book.setAttribute('aria-hidden', 'true');
    book.style.opacity = '';
    book.style.transition = '';

    // Re-show cover
    cover.classList.remove('gone', 'opening');
    cover.style.opacity = '0';
    requestAnimationFrame(() => {
      cover.style.transition = 'opacity .5s ease';
      cover.style.opacity    = '1';
    });
    setTimeout(() => { cover.style.transition = ''; }, 600);

    // Restart rain
    rainOn = true; rainT0 = null;
    requestAnimationFrame(rainLoop);
  }, 400);
});

// ══════════════════════════════════════════════════════════
// 9. MUSIC
// ══════════════════════════════════════════════════════════
musicBtn.addEventListener('click', () => {
  if (musicOn) {
    bgMusic.pause();
    iPlay.style.display  = '';
    iPause.style.display = 'none';
    musicOn = false;
  } else {
    bgMusic.volume = .38;
    bgMusic.play().catch(() => {});
    iPlay.style.display  = 'none';
    iPause.style.display = '';
    musicOn = true;
  }
});
// ══════════════════════════════════════════════════════════
// 10. POLAROID 3D HOVER (desktop only)
// ══════════════════════════════════════════════════════════
if (window.matchMedia('(hover:hover)').matches) {
  document.querySelectorAll('.polaroid').forEach(card => {
    const base = card.classList.contains('tilt-l') ? -2.5
      : card.classList.contains('tilt-r') ? 2 : 0;
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - .5;
      const y = (e.clientY - r.top)  / r.height - .5;
      card.style.transform = `rotate(${base + x*4}deg) rotateX(${-y*6}deg) scale(1.05)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}
