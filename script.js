(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
 
  // شعار بديل إذا لم تُرفع الصورة
  const logo = document.getElementById('logo');
  logo.addEventListener('error', () => { logo.hidden = true; document.getElementById('mono').hidden = false; });
 
  const card = document.getElementById('card');
  const glow = document.querySelector('.glow');
  const cv = document.getElementById('dust'), ctx = cv.getContext('2d');
  let w, h, dpr, motes = [], sparks = [];
  let lastTouch = -1e9;           // آخر وقت لمس/تحريك
  let gx = innerWidth / 2, gy = innerHeight * .35;   // موضع الضوء الحالي
  let tx = gx, ty = gy;           // موضع الهدف
 
  const setTilt = (nx, ny) => {   // nx, ny بين -0.5 و 0.5
    card.style.setProperty('--rx', (nx * 8).toFixed(2) + 'deg');
    card.style.setProperty('--ry', (-ny * 8).toFixed(2) + 'deg');
  };
 
  // --- مؤشر / لمس: الضوء يتبع الإصبع أو الماوس ---
  const follow = e => { tx = e.clientX; ty = e.clientY; lastTouch = performance.now(); };
  addEventListener('pointermove', e => {
    follow(e);
    if (e.pointerType === 'mouse' && !reduce) setTilt(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5);
  });
 
  // --- شرارات ذهبية عند اللمس ---
  addEventListener('pointerdown', e => {
    follow(e);
    if (reduce) return;
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * 6.28, s = (Math.random() * 2.2 + .8) * dpr;
      sparks.push({ x: e.clientX * dpr, y: e.clientY * dpr, vx: Math.cos(a) * s, vy: Math.sin(a) * s - dpr * .6,
                    r: (Math.random() * 1.6 + .6) * dpr, life: 1 });
    }
  });
 
  // --- ميلان حسب حركة الهاتف (جيروسكوب) ---
  let gyroOn = false;
  const startGyro = () => {
    if (gyroOn || reduce || !('DeviceOrientationEvent' in window)) return;
    const attach = () => {
      gyroOn = true;
      addEventListener('deviceorientation', e => {
        if (e.gamma == null) return;
        const nx = Math.max(-1, Math.min(1, e.gamma / 30)) * .5;
        const ny = Math.max(-1, Math.min(1, (e.beta - 50) / 30)) * .5;
        setTilt(nx, ny);
      });
    };
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {   // iOS
      DeviceOrientationEvent.requestPermission().then(r => r === 'granted' && attach()).catch(() => {});
    } else attach();
  };
  addEventListener('pointerdown', e => { if (e.pointerType === 'touch') startGyro(); }, { once: true });
 
  // --- اهتزاز خفيف عند الضغط على الأزرار ---
  document.querySelectorAll('.cta, .alt').forEach(a =>
    a.addEventListener('click', () => navigator.vibrate && navigator.vibrate(15)));
 
  // --- غبار ذهبي ---
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr;
    const n = Math.round(Math.min(60, innerWidth / 16));
    motes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: (Math.random() * 1.6 + .4) * dpr, v: (Math.random() * .25 + .08) * dpr,
      a: Math.random() * .5 + .15, p: Math.random() * 6.28
    }));
  };
 
  const frame = t => {
    // ضوء يتجول وحده إذا لم يلمس أحد الشاشة منذ ثلاث ثوانٍ
    if (t - lastTouch > 3000) {
      tx = innerWidth * (.5 + .38 * Math.sin(t / 3800));
      ty = innerHeight * (.42 + .3 * Math.sin(t / 2900 + 1));
    }
    gx += (tx - gx) * .06; gy += (ty - gy) * .06;
    glow.style.setProperty('--x', gx.toFixed(1) + 'px');
    glow.style.setProperty('--y', gy.toFixed(1) + 'px');
 
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f2c3b0';
    for (const m of motes) {
      m.y -= m.v; m.x += Math.sin(t / 2500 + m.p) * .25 * dpr;
      if (m.y < -5) { m.y = h + 5; m.x = Math.random() * w; }
      ctx.globalAlpha = m.a * (.6 + .4 * Math.sin(t / 900 + m.p));
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.28); ctx.fill();
    }
    ctx.fillStyle = '#fff0e6';
    sparks = sparks.filter(s => s.life > 0);
    for (const s of sparks) {
      s.x += s.vx; s.y += s.vy; s.vx *= .96; s.vy = s.vy * .96 + .02 * dpr; s.life -= .022;
      ctx.globalAlpha = Math.max(s.life, 0);
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
    }
    requestAnimationFrame(frame);
  };
 
  addEventListener('resize', resize);
  resize();
  if (reduce) { glow.style.setProperty('--x', '50%'); glow.style.setProperty('--y', '35%'); }
  else requestAnimationFrame(frame);
})();
