// Visual effects: ambient embers, tap/hit bursts, parallax, typewriter, count-up.
// Everything degrades to a plain no-op when the user prefers reduced motion.
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const FX = {
    burst() {},
    countUp(el, to) { el.textContent = to; },
    type(el, text) { el.textContent = text; },
    enableTilt: async () => false,
  };
  window.FX = FX;
  if (reduce) return;

  // ---- Canvas layer ----
  const cv = document.createElement("canvas");
  cv.id = "fx";
  cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  // Rising embers (pink, orange, purple, white).
  const COLORS = ["255,143,199", "255,138,31", "190,150,255", "255,255,255"];
  const make = (anywhere) => ({
    x: Math.random() * W,
    y: anywhere ? Math.random() * H : H + 10,
    r: 1 + Math.random() * 2.4,
    vy: 0.25 + Math.random() * 0.6,
    ph: Math.random() * 6.28,
    sp: 0.01 + Math.random() * 0.02,
    c: COLORS[(Math.random() * COLORS.length) | 0],
    a: 0.25 + Math.random() * 0.45,
  });
  const embers = Array.from({ length: W < 500 ? 26 : 46 }, () => make(true));

  // Short-lived emoji particles for bursts.
  const bits = [];
  FX.burst = (x, y, { emojis = ["✨"], n = 10 } = {}) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28;
      const s = 1.5 + Math.random() * 4.5;
      bits.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 2.2,
        life: 1,
        d: 0.016 + Math.random() * 0.02,
        e: emojis[i % emojis.length],
        size: 14 + Math.random() * 14,
      });
    }
    if (bits.length > 220) bits.splice(0, bits.length - 220);
  };

  function frame() {
    ctx.clearRect(0, 0, W, H);

    for (const p of embers) {
      p.y -= p.vy;
      p.ph += p.sp;
      p.x += Math.sin(p.ph) * 0.45;
      if (p.y < -10) Object.assign(p, make(false));
      const fade = Math.min(1, p.y / (H * 0.35));
      ctx.fillStyle = `rgba(${p.c},${(p.a * fade).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fill();
    }

    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      b.vy += 0.12;
      b.x += b.vx;
      b.y += b.vy;
      b.life -= b.d;
      if (b.life <= 0) { bits.splice(i, 1); continue; }
      ctx.globalAlpha = b.life;
      ctx.font = `${b.size}px serif`;
      ctx.fillText(b.e, b.x, b.y);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Tap sparkles anywhere except the game arena (it has its own effects).
  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest && e.target.closest(".arena")) return;
    FX.burst(e.clientX, e.clientY, { emojis: ["✨", "💖"], n: 5 });
  });

  // ---- Parallax: pointer, phone tilt, or a slow idle drift -> --px / --py ----
  const root = document.documentElement;
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  let tx = 0, ty = 0, cx = 0, cy = 0, lastInput = -1e9;

  document.addEventListener("pointermove", (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
    lastInput = performance.now();
  }, { passive: true });

  // Android fires this freely; iOS only after FX.enableTilt() gets permission from a tap.
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma == null || e.beta == null) return;
    tx = clamp(e.gamma / 25);
    ty = clamp((e.beta - 40) / 25);
    lastInput = performance.now();
  }, { passive: true });

  FX.enableTilt = async () => {
    try {
      const D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === "function") {
        const res = await Promise.race([D.requestPermission(), new Promise((r) => setTimeout(() => r("timeout"), 2500))]);
        return res === "granted";
      }
      return !!D;
    } catch (_) { return false; }
  };

  // ---- Desktop-only custom cursor + magnetic buttons ----
  let stepCursor = () => {};
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const dot = document.createElement("div");
    dot.id = "cur-dot";
    const ring = document.createElement("div");
    ring.id = "cur-ring";
    document.body.append(dot, ring);
    root.classList.add("has-cursor");
    let mx = -100, my = -100, rx = -100, ry = -100;

    document.addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    }, { passive: true });
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest && e.target.closest("button, label, .chip, .opt, .check, .melody");
      ring.classList.toggle("big", !!t);
      ring.classList.toggle("hot", !!(e.target.closest && e.target.closest(".target")));
    });
    document.addEventListener("pointerdown", () => ring.classList.add("down"));
    document.addEventListener("pointerup", () => ring.classList.remove("down"));
    stepCursor = () => {
      rx += (mx - rx) * 0.2;
      ry += (my - ry) * 0.2;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
    };

    let mag = null;
    document.addEventListener("pointermove", (e) => {
      const b = e.target.closest && e.target.closest(".btn:not(:disabled), .chip");
      if (b !== mag) {
        if (mag) { mag.style.removeProperty("--mx"); mag.style.removeProperty("--my"); }
        mag = b;
      }
      if (b) {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + "px");
        b.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1) + "px");
      }
    }, { passive: true });
  }

  function drive(now) {
    if (now - lastInput > 2500) {
      tx = Math.sin(now / 2300) * 0.55;
      ty = Math.cos(now / 3100) * 0.4;
    }
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    root.style.setProperty("--px", cx.toFixed(3));
    root.style.setProperty("--py", cy.toFixed(3));
    stepCursor();
    requestAnimationFrame(drive);
  }
  requestAnimationFrame(drive);

  // ---- Text helpers ----
  FX.type = (el, text, speed = 28) => {
    clearInterval(el._typer);
    el.textContent = "";
    let i = 0;
    el._typer = setInterval(() => {
      el.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(el._typer);
    }, speed);
  };

  FX.countUp = (el, to, ms = 800) => {
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
})();
