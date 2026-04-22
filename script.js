const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouchDevice) document.body.classList.add('touch-device');

const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = [...document.querySelectorAll('.nav-menu a')];

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('open');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navMenu.classList.remove('open');
    });
  });
}

const typedEl = document.getElementById('typed-text');
const typedWords = [
  'مواقع أسرع وأكثر تأثيرًا',
  'واجهات احترافية للشركات الناشئة',
  'تجارب رقمية قابلة للنمو',
  'حلول ويب عصرية ومفتوحة المصدر'
];

if (typedEl) {
  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const type = () => {
    const currentWord = typedWords[wordIndex];

    if (!deleting) {
      charIndex++;
      typedEl.textContent = currentWord.slice(0, charIndex);
      if (charIndex === currentWord.length) {
        deleting = true;
        setTimeout(type, 1400);
        return;
      }
    } else {
      charIndex--;
      typedEl.textContent = currentWord.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % typedWords.length;
      }
    }
    setTimeout(type, deleting ? 45 : 85);
  };

  type();
}

const progress = document.getElementById('progress');
const updateProgress = () => {
  if (!progress) return;
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const pct = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
  progress.style.width = `${pct}%`;
};
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

if (!isTouchDevice) {
  const cur = document.getElementById('cur');
  const dot = document.getElementById('cur-dot');

  window.addEventListener('mousemove', e => {
    if (cur) {
      cur.style.left = `${e.clientX}px`;
      cur.style.top = `${e.clientY}px`;
    }
    if (dot) {
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
    }
  });

  document.querySelectorAll('a').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('link-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('link-hover'));
  });
  document.querySelectorAll('button').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('button-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('button-hover'));
  });
}

const sections = [...document.querySelectorAll('section[id]')];
const syncActiveNav = () => {
  const current = sections.find(section => {
    const top = section.offsetTop - 140;
    const bottom = top + section.offsetHeight;
    return window.scrollY >= top && window.scrollY < bottom;
  });

  navLinks.forEach(link => link.classList.remove('active'));
  if (current) {
    const activeLink = navLinks.find(link => link.getAttribute('href') === `#${current.id}`);
    if (activeLink) activeLink.classList.add('active');
  }
};
window.addEventListener('scroll', syncActiveNav, { passive: true });
syncActiveNav();

const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => observer.observe(el));

const cubeWrapper = document.getElementById('cubeWrapper');
const cube3d = document.getElementById('cube3d');
const cubeScrambleBtn = document.getElementById('cubeScrambleBtn');
const cubeSolveBtn = document.getElementById('cubeSolveBtn');
const cubeStatus = document.getElementById('cubeStatus');

const setCubeStatus = (text) => {
  if (cubeStatus) cubeStatus.textContent = text;
};

if (cubeWrapper && cube3d && window.DOMMatrix) {
  const CUBIE_PX = 66;
  const HALF_PX = CUBIE_PX / 2;
  const STEP_PX = 69;
  const FACE_DEFS = [
    { key: 'front', transform: `translateZ(${HALF_PX}px)` },
    { key: 'back', transform: `rotateY(180deg) translateZ(${HALF_PX}px)` },
    { key: 'right', transform: `rotateY(90deg) translateZ(${HALF_PX}px)` },
    { key: 'left', transform: `rotateY(-90deg) translateZ(${HALF_PX}px)` },
    { key: 'top', transform: `rotateX(90deg) translateZ(${HALF_PX}px)` },
    { key: 'bottom', transform: `rotateX(-90deg) translateZ(${HALF_PX}px)` },
  ];
  const FACE_CLASS = {
    front: 'fc-green',
    back: 'fc-blue',
    right: 'fc-red',
    left: 'fc-orange',
    top: 'fc-white',
    bottom: 'fc-yellow',
    inner: 'fc-inner',
  };
  const cubies = [];
  let history = [];
  let busy = false;
  let manualMode = false;
  let manualTimer = 0;
  let rotX = -22;
  let rotY = 45;
  let velX = 0;
  let velY = 0.18;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let lastDx = 0;
  let lastDy = 0;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const viewport = cubeWrapper.querySelector('.cube-viewport');

  const setButtonsDisabled = (disabled) => {
    if (cubeScrambleBtn) cubeScrambleBtn.disabled = disabled;
    if (cubeSolveBtn) cubeSolveBtn.disabled = disabled;
  };

  const markManual = (duration = 8000) => {
    manualMode = true;
    clearTimeout(manualTimer);
    manualTimer = setTimeout(() => { manualMode = false; }, duration);
  };

  const createFace = (faceName, lx, ly, lz) => {
    const face = document.createElement('div');
    let fc = FACE_CLASS.inner;
    if (faceName === 'front' && lz === 1) fc = FACE_CLASS.front;
    if (faceName === 'back' && lz === -1) fc = FACE_CLASS.back;
    if (faceName === 'right' && lx === 1) fc = FACE_CLASS.right;
    if (faceName === 'left' && lx === -1) fc = FACE_CLASS.left;
    if (faceName === 'top' && ly === 1) fc = FACE_CLASS.top;
    if (faceName === 'bottom' && ly === -1) fc = FACE_CLASS.bottom;
    face.className = `cubie-face ${fc}`;
    face.style.transform = FACE_DEFS.find(fd => fd.key === faceName).transform + (fc === FACE_CLASS.inner ? ' scale(0.98)' : '');
    if (fc !== FACE_CLASS.inner) {
      face.innerHTML = '<div class="gloss"></div><div class="shine"></div>';
    }
    return face;
  };

  const makeCubie = (lx, ly, lz) => {
    const el = document.createElement('div');
    el.className = 'cubie';
    FACE_DEFS.forEach(fd => {
      el.appendChild(createFace(fd.key, lx, ly, lz));
    });
    const m = new DOMMatrix().translate(lx * STEP_PX, -ly * STEP_PX, lz * STEP_PX);
    el.style.transform = m.toString();
    return { el, m };
  };

  const buildCube = () => {
    cube3d.innerHTML = '';
    cubies.length = 0;
    for (let y = 1; y >= -1; y--) {
      for (let x = -1; x <= 1; x++) {
        for (let z = 1; z >= -1; z--) {
          const cubie = makeCubie(x, y, z);
          cube3d.appendChild(cubie.el);
          cubies.push(cubie);
        }
      }
    }
  };

  const snap = (m) => {
    m.m41 = Math.round(m.m41 / STEP_PX) * STEP_PX;
    m.m42 = Math.round(m.m42 / STEP_PX) * STEP_PX;
    m.m43 = Math.round(m.m43 / STEP_PX) * STEP_PX;
    ['m11', 'm12', 'm13', 'm21', 'm22', 'm23', 'm31', 'm32', 'm33'].forEach(f => {
      if (Math.abs(m[f]) < 0.1) m[f] = 0;
      else m[f] = Math.sign(m[f]);
    });
  };

  const rotateLayer = (axis, slice, angle, ms = 220) => new Promise(resolve => {
    const layer = cubies.filter(c => {
      const x = Math.round(c.m.m41 / STEP_PX);
      const y = Math.round(-c.m.m42 / STEP_PX);
      const z = Math.round(c.m.m43 / STEP_PX);
      const val = axis === 'x' ? x : axis === 'y' ? y : z;
      return val === slice;
    });
    if (!layer.length) {
      resolve();
      return;
    }

    const pivot = document.createElement('div');
    pivot.style.cssText = 'position:absolute;width:0;height:0;transform-style:preserve-3d;';
    cube3d.appendChild(pivot);
    layer.forEach(c => pivot.appendChild(c.el));
    pivot.getBoundingClientRect();
    pivot.style.transition = `transform ${ms}ms cubic-bezier(0.34, 1.25, 0.64, 1)`;
    pivot.style.transform = axis === 'y' ? `rotateY(${angle}deg)` : axis === 'x' ? `rotateX(${angle}deg)` : `rotateZ(${angle}deg)`;

    setTimeout(() => {
      const rotM = new DOMMatrix(axis === 'y' ? `rotateY(${angle}deg)` : axis === 'x' ? `rotateX(${angle}deg)` : `rotateZ(${angle}deg)`);
      layer.forEach(c => {
        c.m = rotM.multiply(c.m);
        snap(c.m);
        cube3d.appendChild(c.el);
        c.el.style.transition = 'none';
        c.el.style.transform = c.m.toString();
        void c.el.offsetHeight;
      });
      pivot.remove();
      resolve();
    }, ms + 40);
  });

  const MOVES = [
    { axis: 'y', slice: 1, angle: 90 }, { axis: 'y', slice: 1, angle: -90 },
    { axis: 'y', slice: 0, angle: 90 }, { axis: 'y', slice: 0, angle: -90 },
    { axis: 'y', slice: -1, angle: 90 }, { axis: 'y', slice: -1, angle: -90 },
    { axis: 'x', slice: 1, angle: 90 }, { axis: 'x', slice: 1, angle: -90 },
    { axis: 'x', slice: 0, angle: 90 }, { axis: 'x', slice: 0, angle: -90 },
    { axis: 'x', slice: -1, angle: 90 }, { axis: 'x', slice: -1, angle: -90 },
    { axis: 'z', slice: 1, angle: 90 }, { axis: 'z', slice: 1, angle: -90 },
    { axis: 'z', slice: -1, angle: 90 }, { axis: 'z', slice: -1, angle: -90 },
  ];

  const scrambleCube = async (count = 14, ms = 185) => {
    if (busy) return;
    busy = true;
    setButtonsDisabled(true);
    markManual(15000);
    setCubeStatus('جاري خلط المكعب...');
    history = [];
    for (let i = 0; i < count; i += 1) {
      let move;
      do {
        move = MOVES[Math.floor(Math.random() * MOVES.length)];
      } while (history.length && history[history.length - 1].axis === move.axis && history[history.length - 1].slice === move.slice);
      history.push(move);
      await rotateLayer(move.axis, move.slice, move.angle, ms);
      await sleep(18);
    }
    busy = false;
    setButtonsDisabled(false);
    setCubeStatus('تم الخلط — اضغط ترتيب لإعادته');
  };

  const solveCube = async (ms = 320) => {
    if (busy) return;
    if (!history.length) {
      setCubeStatus('المكعب مرتب بالفعل');
      return;
    }
    busy = true;
    setButtonsDisabled(true);
    markManual(15000);
    setCubeStatus('جاري ترتيب المكعب...');
    const moves = [...history].reverse().map(m => ({ ...m, angle: -m.angle }));
    for (const move of moves) {
      await rotateLayer(move.axis, move.slice, move.angle, ms);
      await sleep(28);
    }
    history = [];
    busy = false;
    setButtonsDisabled(false);
    setCubeStatus('تم ترتيب المكعب ✓');
  };

  const applyRotation = () => {
    cube3d.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  };

  const animateRotation = () => {
    if (!dragging) {
      velY *= 0.92;
      velX *= 0.92;
      if (!manualMode && !busy) {
        velY += (0.25 - velY) * 0.025;
        velX += (0 - velX) * 0.025;
      }
      rotY += velY;
      rotX += velX;
      rotX = Math.max(-65, Math.min(65, rotX));
    }
    applyRotation();
    requestAnimationFrame(animateRotation);
  };

  const beginDrag = (x, y) => {
    dragging = true;
    startX = x;
    startY = y;
    velX = 0;
    velY = 0;
    lastDx = 0;
    lastDy = 0;
    markManual(8000);
  };

  const moveDrag = (x, y) => {
    if (!dragging) return;
    lastDx = (x - startX) * 0.45;
    lastDy = (y - startY) * 0.45;
    rotY += lastDx;
    rotX -= lastDy;
    rotX = Math.max(-65, Math.min(65, rotX));
    startX = x;
    startY = y;
  };

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    velY = lastDx * 0.85;
    velX = -lastDy * 0.85;
    markManual(8000);
  };

  buildCube();
  applyRotation();
  animateRotation();
  setCubeStatus('مكعب كامل 3×3 — اسحب لتدويره');

  viewport?.addEventListener('mousedown', (event) => {
    beginDrag(event.clientX, event.clientY);
    event.preventDefault();
  });
  document.addEventListener('mousemove', (event) => moveDrag(event.clientX, event.clientY));
  document.addEventListener('mouseup', endDrag);

  viewport?.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    beginDrag(touch.clientX, touch.clientY);
  }, { passive: true });
  document.addEventListener('touchmove', (event) => {
    if (!dragging) return;
    const touch = event.touches[0];
    moveDrag(touch.clientX, touch.clientY);
  }, { passive: true });
  document.addEventListener('touchend', endDrag);

  cubeWrapper.addEventListener('keydown', (event) => {
    const step = 10;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    markManual(5000);
    if (event.key === 'ArrowUp') rotX -= step;
    if (event.key === 'ArrowDown') rotX += step;
    if (event.key === 'ArrowLeft') rotY -= step;
    if (event.key === 'ArrowRight') rotY += step;
    rotX = Math.max(-65, Math.min(65, rotX));
    applyRotation();
  });

  cubeScrambleBtn?.addEventListener('click', () => scrambleCube(14, 200));
  cubeSolveBtn?.addEventListener('click', () => solveCube(340));
} else if (cubeWrapper) {
  setCubeStatus('المتصفح لا يدعم العرض ثلاثي الأبعاد بالشكل المطلوب');
}

const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 70));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = `${current}${suffix}`;
    }, 24);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.4 });
counters.forEach(el => counterObserver.observe(el));

const canvas = document.getElementById('bg-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [];
  let width = 0;
  let height = 0;

  const resize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const count = Math.min(80, Math.floor(width / 22));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.8 + 0.6,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
    }));
  };

  const render = () => {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p, i) => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > width) p.dx *= -1;
      if (p.y < 0 || p.y > height) p.dy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(114, 242, 255, 0.45)';
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(79, 140, 255, ${0.12 - dist / 1000})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(render);
  };

  resize();
  render();
  window.addEventListener('resize', resize);
}

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = contactForm.querySelector('[name="name"]').value.trim();
    const service = contactForm.querySelector('[name="service"]').value.trim();
    const message = contactForm.querySelector('[name="message"]').value.trim();
    const text = `مرحباً، أنا ${name || 'عميل جديد'} وأرغب في ${service || 'تنفيذ مشروع ويب'}.

التفاصيل:
${message || 'أرغب في مناقشة تفاصيل المشروع.'}`;
    window.open(`https://wa.me/966591880896?text=${encodeURIComponent(text)}`, '_blank');
  });
}
