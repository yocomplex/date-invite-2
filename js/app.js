(() => {
  const C = window.CONFIG;
  const $ = (s, el = document) => el.querySelector(s);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    quizIndex: 0,
    triviaScore: 0,
    triviaLog: [],
    takes: {},
    arcade: null,
    rsvp: null,
    dates: new Set(),
    time: null,
    prizesOk: new Set(),
    verdict: null,
  };

  // Rooms that show a progress dot, in order.
  const order = ["foyer", "library", "takes", "arcade", "result", "date"];
  const dots = $("#dots");
  order.forEach(() => dots.appendChild(document.createElement("i")));

  const rooms = () => [...document.querySelectorAll("[data-room]")];
  let pendingRoom = null;

  function swap(id) {
    rooms().forEach((r) => { r.classList.remove("leave"); r.hidden = r.id !== id; });
    const idx = order.indexOf(id);
    [...dots.children].forEach((d, i) => {
      d.className = idx === -1 ? "past" : i < idx ? "past" : i === idx ? "on" : "";
    });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function show(id) {
    const cur = rooms().find((r) => !r.hidden);
    pendingRoom = id;
    if (reduceMotion || !cur || cur.id === id) return swap(id);
    cur.classList.add("leave");
    setTimeout(() => swap(pendingRoom), 230);
  }

  // Wrap title text in per-letter spans (words stay unbroken) for the entrance and bob effect.
  function letterize(t) {
    if (reduceMotion) return;
    const label = [...t.childNodes].map((n) => (n.nodeType === 3 ? n.textContent : " ")).join("").replace(/\s+/g, " ").trim();
    let i = 0;
    const out = [];
    [...t.childNodes].forEach((n) => {
      if (n.nodeType !== 3) { out.push(n.cloneNode(true)); return; }
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { out.push(document.createTextNode(" ")); return; }
        const w = document.createElement("span");
        w.className = "w";
        [...part].forEach((ch) => {
          const s = document.createElement("span");
          s.className = "ch";
          s.style.setProperty("--i", i++);
          s.textContent = ch;
          s.setAttribute("aria-hidden", "true");
          w.appendChild(s);
        });
        out.push(w);
      });
    });
    t.replaceChildren(...out);
    t.setAttribute("aria-label", label);
  }
  document.querySelectorAll(".title").forEach(letterize);

  function fireworks() {
    if (reduceMotion) return;
    [0, 1, 2, 3].forEach((i) =>
      setTimeout(() => FX.burst(window.innerWidth * (0.2 + 0.2 * i), window.innerHeight * (0.22 + Math.random() * 0.2),
        { emojis: ["🎆", "✨", "💖", "🎃"], n: 16 }), i * 350));
  }

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  // ---- Foyer ----
  document.querySelectorAll(".melody").forEach((m) => {
    m.addEventListener("click", () => {
      m.classList.remove("boing");
      void m.offsetWidth;
      m.classList.add("boing");
      const r = m.getBoundingClientRect();
      FX.burst(r.left + r.width / 2, r.top + r.height * 0.3, { emojis: ["💖", "🎀", "✨"], n: 12 });
    });
    m.addEventListener("animationend", (e) => { if (e.animationName === "boing") m.classList.remove("boing"); });
  });
  $("#foyer [data-next]").addEventListener("click", () => { show("library"); renderQuestion(); });

  // ---- Library (scored trivia) ----
  function renderQuestion() {
    const q = C.trivia[state.quizIndex];
    const max = q.type === "single" ? 1 : q.pick;
    const picks = [];
    $("#quizCount").textContent = `Question ${state.quizIndex + 1} of ${C.trivia.length}`;
    $("#barFill").style.width = `${(state.quizIndex / C.trivia.length) * 100}%`;
    const box = $("#quiz");
    box.innerHTML = "";
    const card = el("div", "card");
    card.appendChild(el("p", "q", q.prompt));
    if (q.sub) card.appendChild(el("p", "small", q.sub));
    const opts = el("div", "opts");
    const lock = el("button", "btn", "Lock it in 🔒");
    lock.type = "button";
    lock.disabled = true;

    q.options.forEach((o, oi) => {
      const b = el("button", "opt", o);
      b.style.animationDelay = `${oi * 45}ms`;
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => {
        const i = picks.indexOf(o);
        if (i > -1) picks.splice(i, 1);
        else {
          if (max === 1) picks.length = 0;
          if (picks.length >= max) return;
          picks.push(o);
        }
        opts.querySelectorAll(".opt").forEach((x) => x.setAttribute("aria-pressed", String(picks.includes(x.textContent))));
        lock.disabled = picks.length === 0;
      });
      opts.appendChild(b);
    });

    lock.addEventListener("click", () => {
      const hits = picks.filter((p) => q.answers.includes(p)).length;
      const pass = hits >= q.need;
      if (pass) state.triviaScore++;
      state.triviaLog.push(`${q.prompt} -> ${picks.join(", ")} (${pass ? "pass" : "miss"})`);
      opts.querySelectorAll(".opt").forEach((x) => {
        x.disabled = true;
        if (q.answers.includes(x.textContent)) x.classList.add("right");
        else if (picks.includes(x.textContent)) x.classList.add("wrong");
      });
      const lr = lock.getBoundingClientRect();
      if (pass) FX.burst(lr.left + lr.width / 2, lr.top, { emojis: ["✨", "💖", "🎃"], n: 14 });
      else { card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake"); }
      $("#barFill").style.width = `${((state.quizIndex + 1) / C.trivia.length) * 100}%`;
      lock.remove();
      card.appendChild(el("p", "fb " + (pass ? "ok" : ""), (pass ? "✨ Correct! " : "👻 Spooky close. ") + q.reveal));
      const last = state.quizIndex === C.trivia.length - 1;
      const next = el("button", "btn", last ? "Done 📖" : "Next question →");
      next.type = "button";
      next.addEventListener("click", () => {
        if (last) { show("takes"); renderTakes(); }
        else { state.quizIndex++; renderQuestion(); }
      });
      card.appendChild(next);
    });

    card.append(opts, lock);
    box.appendChild(card);
  }

  // ---- Hot takes (unscored) ----
  function renderTakes() {
    const list = $("#takeList");
    list.innerHTML = "";
    C.hotTakes.forEach((t, i) => {
      const card = el("div", "card take");
      card.style.marginBottom = "10px";
      card.appendChild(el("p", "q", `"${t.q}"`));
      const row = el("div", "btnrow");
      [t.yes, t.no].forEach((label) => {
        const b = el("button", "chip", label === t.no ? "🚩 " + label : "🙃 " + label);
        b.type = "button";
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", () => {
          state.takes[t.q] = label;
          row.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
          $("#takesNext").disabled = Object.keys(state.takes).length < C.hotTakes.length;
        });
        row.appendChild(b);
      });
      card.appendChild(row);
      list.appendChild(card);
    });
  }
  $("#takesNext").addEventListener("click", () => { show("arcade"); });

  // ---- Arcade ----
  $("#arcadeIntro").textContent = `Tap ghosts 👻 to catch them. Skip the bats 🦇 (−1). bosh caught ${C.joshHighScore}. Catch more to win the round.`;
  $("#time").textContent = C.gameSeconds;
  const arena = $("#arena");
  let running = false;

  const retrigger = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };

  function floater(text, x, y, cls) {
    const f = el("span", "floater " + cls, text);
    f.style.left = x + "px";
    f.style.top = y + "px";
    arena.appendChild(f);
    setTimeout(() => f.remove(), 800);
  }

  function countdown(done) {
    const steps = ["3", "2", "1", "GO!"];
    let i = 0;
    const tick = () => {
      arena.innerHTML = "";
      if (i >= steps.length) return done();
      arena.appendChild(el("div", "count", steps[i++]));
      setTimeout(tick, 650);
    };
    tick();
  }

  $("#arcadeStart").addEventListener("click", () => {
    if (running) return;
    running = true;
    $("#arcadeStart").hidden = true;
    $("#score").textContent = 0;
    $("#time").textContent = C.gameSeconds;
    countdown(play);
  });

  function play() {
    let score = 0;
    let left = C.gameSeconds;

    const spawn = () => {
      if (arena.querySelectorAll(".target:not(.hit)").length >= 3) return;
      const isBat = Math.random() < 0.2;
      const t = el("button", "target", isBat ? "🦇" : "👻");
      t.type = "button";
      t.setAttribute("aria-label", isBat ? "bat" : "ghost");
      t.style.left = Math.random() * (arena.clientWidth - 64) + "px";
      t.style.top = Math.random() * (arena.clientHeight - 64) + "px";
      t.style.setProperty("--dx", Math.random() * 80 - 40 + "px");
      t.style.setProperty("--dy", Math.random() * 80 - 40 + "px");
      const grab = (e) => {
        e.preventDefault();
        if (t.classList.contains("hit")) return;
        const moved = getComputedStyle(t).translate;
        t.style.translate = moved === "none" ? "0 0" : moved;
        score = Math.max(0, score + (isBat ? -1 : 1));
        $("#score").textContent = score;
        retrigger($("#score"), "bump");
        const ar = arena.getBoundingClientRect();
        const tr = t.getBoundingClientRect();
        const cx = tr.left + tr.width / 2;
        const cy = tr.top + tr.height / 2;
        floater(isBat ? "−1" : "+1", cx - ar.left - 10, cy - ar.top - 20, isBat ? "bad" : "good");
        if (isBat) { retrigger(arena, "shake"); FX.burst(cx, cy, { emojis: ["💥"], n: 5 }); }
        else FX.burst(cx, cy, { emojis: ["✨", "💖"], n: 8 });
        t.classList.add("hit");
        setTimeout(() => t.remove(), 250);
      };
      t.addEventListener("pointerdown", grab);
      t.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") grab(e); });
      arena.appendChild(t);
      setTimeout(() => t.remove(), 1200);
    };

    const spawner = setInterval(spawn, 520);
    const clock = setInterval(() => {
      left--;
      $("#time").textContent = left;
      $("#time").classList.toggle("low", left <= 5);
      if (left <= 0) {
        clearInterval(spawner);
        clearInterval(clock);
        running = false;
        arena.innerHTML = "";
        $("#time").classList.remove("low");
        state.arcade = score;
        $("#arcadeIntro").textContent = `You caught ${score}. bosh caught ${C.joshHighScore}.`;
        $("#arcadeNext").hidden = false;
      }
    }, 1000);
  }
  $("#arcadeNext").addEventListener("click", () => { show("result"); renderResult(); });

  // ---- Result ----
  function confetti() {
    if (reduceMotion) return;
    const bits = ["🎃", "🦇", "💖", "✨", "🍬", "👻"];
    for (let i = 0; i < 28; i++) {
      const s = el("span", "confetti", bits[i % bits.length]);
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDuration = 2.5 + Math.random() * 2.5 + "s";
      s.style.animationDelay = Math.random() * 0.8 + "s";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 6500);
    }
  }

  function renderResult() {
    const triviaWin = state.triviaScore >= C.triviaPassMark;
    const arcadeWin = state.arcade > C.joshHighScore;
    const wins = Number(triviaWin) + Number(arcadeWin);
    state.verdict = wins === 2 ? "dani" : wins === 0 ? "josh" : "draw";

    $("#scoreboard").innerHTML = `
      <div class="${triviaWin ? "win" : ""}">Trivia<b><span data-count="${state.triviaScore}">0</span> / ${C.trivia.length}</b>${triviaWin ? "You win" : "bosh wins"}</div>
      <div class="${arcadeWin ? "win" : ""}">Arcade<b><span data-count="${state.arcade}">0</span> vs ${C.joshHighScore}</b>${arcadeWin ? "You win" : "bosh wins"}</div>`;

    const lines = {
      dani: "You win the mansion! bosh owes you one.",
      josh: "bosh squeaks it out. Prizes are still only what you tick below.",
      draw: "One round each. It's a draw, so you both win.",
    };
    document.querySelectorAll("#scoreboard [data-count]").forEach((s) => FX.countUp(s, +s.dataset.count, 900));
    $("#verdict").textContent = "";
    setTimeout(() => FX.type($("#verdict"), lines[state.verdict]), 900);
    if (state.verdict !== "josh") setTimeout(confetti, 700);

    const list = $("#prizeList");
    list.innerHTML = "";
    C.prizes.forEach((p, pi) => {
      const lab = el("label", "check", `<input type="checkbox"> <span>${p.e} ${p.n}</span>`);
      lab.style.animationDelay = `${1.2 + pi * 0.12}s`;
      $("input", lab).addEventListener("change", (e) => {
        if (e.target.checked) state.prizesOk.add(p.id);
        else state.prizesOk.delete(p.id);
      });
      list.appendChild(lab);
    });
  }
  $("#resultNext").addEventListener("click", () => show("date"));

  // ---- Date ----
  function chipRow(container, items, { multi, onChange }) {
    const chosen = new Set();
    items.forEach((it) => {
      const b = el("button", "chip", it.label);
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => {
        if (multi) { chosen.has(it.id) ? chosen.delete(it.id) : chosen.add(it.id); }
        else { chosen.clear(); chosen.add(it.id); }
        container.querySelectorAll(".chip").forEach((c, k) => c.setAttribute("aria-pressed", String(chosen.has(items[k].id))));
        onChange(chosen);
      });
      container.appendChild(b);
    });
  }
  chipRow($("#dateChips"), C.dates, { multi: true, onChange: (s) => { state.dates = new Set(s); validate(); } });
  chipRow($("#timeChips"), C.times.map((t) => ({ id: t, label: t })), {
    multi: false, onChange: (s) => { state.time = [...s][0] || null; validate(); },
  });

  document.querySelectorAll("[data-rsvp]").forEach((b) =>
    b.addEventListener("click", () => {
      state.rsvp = b.dataset.rsvp;
      document.querySelectorAll("[data-rsvp]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $("#dateFields").hidden = state.rsvp !== "yes";
      $("#noteWrap").hidden = false;
      validate();
    })
  );

  function validate() {
    const ready = state.rsvp === "no" || (state.rsvp === "yes" && state.dates.size > 0 && state.time);
    $("#send").disabled = !ready;
  }

  const dateLabel = (id) => C.dates.find((d) => d.id === id).label;
  const prizeName = (id) => { const p = C.prizes.find((x) => x.id === id); return p ? `${p.e} ${p.n}` : "none"; };

  function buildMessage() {
    const lines = [
      `${C.herName} finished the Haunted Mansion.`,
      "",
      `RSVP: ${state.rsvp === "yes" ? "YES" : "Not this time"}`,
    ];
    if (state.rsvp === "yes") {
      lines.push(`Days she can do: ${[...state.dates].map(dateLabel).join(" / ")}`);
      lines.push(`Time: ${state.time}`);
    }
    lines.push(
      `Note: ${$("#note").value.trim() || "(none)"}`,
      "",
      `Result: ${state.verdict} | Trivia ${state.triviaScore}/${C.trivia.length} | Arcade ${state.arcade} vs ${C.joshHighScore}`,
      `Prizes she picked: ${[...state.prizesOk].map(prizeName).join("; ") || "none"}`,
      "",
      "Trivia answers:",
      ...state.triviaLog.map((l) => "- " + l),
      "",
      "Hot takes:",
      ...Object.entries(state.takes).map(([q, a]) => `- ${q} -> ${a}`)
    );
    return lines.join("\n");
  }

  $("#send").addEventListener("click", async () => {
    const btn = $("#send");
    const err = $("#err");
    err.hidden = true;
    btn.disabled = true;
    btn.textContent = "Sending... 🦇";
    const message = buildMessage();
    try { localStorage.setItem("danis-mansion-result", message); } catch (_) {}

    try {
      const res = await fetch(C.web3formsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: C.web3formsKey,
          subject: `${C.herName} answered the Haunted Mansion: ${state.rsvp === "yes" ? "YES 🎃" : "not this time"}`,
          from_name: "My Melody's Haunted Mansion",
          name: C.herName,
          message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);
      finish();
    } catch (e) {
      err.textContent = "The bats dropped the message. Your answers are saved on this device, so tap Send again to retry.";
      err.hidden = false;
      btn.disabled = false;
      btn.textContent = "Try sending again 🦇";
    }
  });

  function finish() {
    const yes = state.rsvp === "yes";
    $("#doneTitle").textContent = yes ? "It's a date!" : "Message sent";
    letterize($("#doneTitle"));
    $("#doneText").textContent = yes
      ? "bosh got your answers. He'll take it from here."
      : "bosh got your answer. Thanks for playing, Dani.";
    $("#recap").innerHTML = yes
      ? `<p><b>${[...state.dates].map(dateLabel).join(" or ")}</b> at <b>${state.time}</b></p>
         <p>🎃 pumpkin patch with a ferris wheel</p><p>😼 and then we'll see where it goes from there</p>`
      : "<p>Nothing else needed.</p>";
    show("done");
    if (yes) { confetti(); fireworks(); }
  }
})();
