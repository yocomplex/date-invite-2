// Loading intro: pumpkin fills, then "tap to enter" (that tap also unlocks phone tilt on iOS).
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const loader = document.getElementById("loader");
  const app = document.getElementById("app");
  let revealed = false;

  function reveal() {
    if (revealed) return;
    revealed = true;
    app.hidden = false;
    root.classList.remove("loading");
  }

  if (reduce || !loader) {
    if (loader) loader.remove();
    reveal();
    return;
  }

  const num = document.getElementById("ldNum");
  const fill = document.getElementById("ldFill");
  const label = document.getElementById("ldLabel");
  const enter = document.getElementById("ldEnter");

  const imgReady = new Promise((res) => {
    const i = new Image();
    i.onload = i.onerror = res;
    i.src = "assets/my-melody.png";
  });
  let ready = false;
  Promise.race([
    Promise.all([document.fonts ? document.fonts.ready : null, imgReady]),
    new Promise((r) => setTimeout(r, 3500)),
  ]).then(() => { ready = true; });

  let shown = 0;
  let enterShown = false;
  const t0 = performance.now();

  function showEnter() {
    if (enterShown) return;
    enterShown = true;
    num.textContent = 100;
    fill.style.setProperty("--p", 1);
    label.textContent = "the mansion is ready";
    enter.hidden = false;
    enter.focus({ preventScroll: true });
  }

  function tick(now) {
    const k = Math.min(1, (now - t0) / 1800);
    let p = k * k * (3 - 2 * k);
    if (!ready) p = Math.min(p, 0.9);
    shown = Math.max(shown, p);
    num.textContent = Math.round(shown * 100);
    fill.style.setProperty("--p", shown.toFixed(3));
    if (shown >= 1) showEnter();
    else requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  setTimeout(showEnter, 6000); // safety net if animation frames are throttled

  enter.addEventListener("click", async () => {
    enter.disabled = true;
    await window.FX.enableTilt();
    loader.classList.add("open");
    reveal();
    setTimeout(() => loader.remove(), 1500);
  });
})();
