/* shivangsinha.tech — shared behaviour (no dependencies) */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  /* ── Theme toggle ───────────────────────────────── */
  const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  const root = document.documentElement;
  const saved = store.get("theme");
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  const isDark = () =>
    root.dataset.theme ? root.dataset.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  $$(".theme-btn").forEach((btn) => {
    const paint = () => {
      btn.innerHTML = isDark() ? SUN : MOON;
      btn.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
    };
    paint();
    btn.addEventListener("click", () => {
      root.dataset.theme = isDark() ? "light" : "dark";
      store.set("theme", root.dataset.theme);
      paint();
    });
  });

  /* ── Reveal on scroll ───────────────────────────── */
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("in"));
  }

  /* ── Tiny JSON-ish highlighter ──────────────────── */
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function highlight(src) {
    return esc(src)
      .replace(/(^\s*\/\/[^\n]*)/gm, '<span class="c">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<span class="k">$1</span>$2')
      .replace(/(:\s*|\[\s*|,\s*)("(?:[^"\\]|\\.)*")/g, '$1<span class="s">$2</span>')
      .replace(/\b(-?\d+(?:\.\d+)?)\b(?![^<]*>)/g, '<span class="n">$1</span>');
  }

  /* ── Pipeline explorer ──────────────────────────── */
  // Usage: <div class="explorer" data-pipeline="lensr"></div> + window.PIPELINES.lensr = {...}
  function mountExplorer(el, cfg) {
    const modes = cfg.modes || [];
    let mode = modes.length ? modes[0].id : null;
    let idx = 0;
    let timer = null;

    el.innerHTML = `
      <div class="explorer-bar">
        ${modes.length ? `<span class="label">${cfg.modeLabel || "Mode"}</span>
        <div class="seg" role="group" aria-label="${cfg.modeLabel || "Mode"}">
          ${modes.map((m) => `<button type="button" data-mode="${m.id}" aria-pressed="${m.id === mode}">${m.label}</button>`).join("")}
        </div>` : ""}
        <span class="spacer"></span>
        <button type="button" class="ctrl" data-act="prev" aria-label="Previous stage"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg></button>
        <button type="button" class="ctrl" data-act="play"></button>
        <button type="button" class="ctrl" data-act="next" aria-label="Next stage"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></button>
      </div>
      <div class="progress"><i></i></div>
      <div class="explorer-body">
        <ol class="stages" role="tablist" aria-label="Pipeline stages">
          ${cfg.stages.map((s, i) => `<li><button type="button" class="stage-btn" role="tab" data-i="${i}">
            <span class="n">${i + 1}</span><span class="title">${s.title}</span><span class="who">${s.who || ""}</span></button></li>`).join("")}
        </ol>
        <div class="stage-detail" role="tabpanel" aria-live="polite"></div>
      </div>`;

    const btns = $$(".stage-btn", el);
    const detail = $(".stage-detail", el);
    const bar = $(".progress > i", el);
    const playBtn = $('[data-act="play"]', el);
    const skipped = (s) => mode && (s.skipIn || []).includes(mode);
    const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg> Play';
    const PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg> Pause';

    function render() {
      const s = cfg.stages[idx];
      btns.forEach((b, i) => {
        b.setAttribute("aria-selected", String(i === idx));
        b.classList.toggle("done", i < idx);
        b.classList.toggle("skipped", skipped(cfg.stages[i]));
        b.tabIndex = i === idx ? 0 : -1;
      });
      bar.style.width = `${((idx + 1) / cfg.stages.length) * 100}%`;
      const modeNote = mode && s.modeNote && s.modeNote[mode];
      detail.innerHTML = `<div class="fade-in">
        <div class="where">${(s.tags || []).map((t, i) => `<span class="tag ${i === 0 ? "c" : ""}">${t}</span>`).join("")}
          ${skipped(s) ? `<span class="tag warn">skipped in ${modes.find((m) => m.id === mode).label} mode</span>` : ""}</div>
        <h3>${s.title}</h3>
        <div class="what">${s.what}</div>
        ${modeNote ? `<p class="what" style="margin-top:10px"><strong>${modes.find((m) => m.id === mode).label} mode:</strong> ${modeNote}</p>` : ""}
        ${s.why ? `<div class="why"><b>Why it's built this way</b>${s.why}</div>` : ""}
        ${s.data ? `<div class="io-label">${s.dataLabel || "Data at this point"}</div><pre class="code">${highlight(s.data.trim())}</pre>` : ""}
      </div>`;
      const active = btns[idx];
      const list = active.closest(".stages");
      if (list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: active.parentElement.offsetLeft - 12, behavior: reduceMotion ? "auto" : "smooth" });
      }
    }

    function go(i) { idx = (i + cfg.stages.length) % cfg.stages.length; render(); }
    function stop() { clearInterval(timer); timer = null; playBtn.innerHTML = PLAY; }
    function play() {
      playBtn.innerHTML = PAUSE;
      timer = setInterval(() => {
        if (idx === cfg.stages.length - 1) return stop();
        let n = idx + 1;
        while (n < cfg.stages.length - 1 && skipped(cfg.stages[n])) n++;
        go(n);
      }, 3200);
    }

    btns.forEach((b) => b.addEventListener("click", () => { stop(); go(+b.dataset.i); }));
    $(".stages", el).addEventListener("keydown", (e) => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault(); stop(); go(idx + d); btns[idx].focus();
    });
    $('[data-act="prev"]', el).addEventListener("click", () => { stop(); go(idx - 1); });
    $('[data-act="next"]', el).addEventListener("click", () => { stop(); go(idx + 1); });
    playBtn.addEventListener("click", () => {
      if (timer) return stop();
      if (idx === cfg.stages.length - 1) go(0);
      play();
    });
    $$("[data-mode]", el).forEach((b) => b.addEventListener("click", () => {
      mode = b.dataset.mode;
      $$("[data-mode]", el).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    }));
    playBtn.innerHTML = PLAY;
    render();
  }

  $$("[data-pipeline]").forEach((el) => {
    const cfg = (window.PIPELINES || {})[el.dataset.pipeline];
    if (cfg) mountExplorer(el, cfg);
  });

  /* ── Lensr SSE replay ───────────────────────────── */
  const replay = $("#sse-replay");
  if (replay && window.SSE_SCRIPT) {
    const log = $(".replay-log", replay);
    const ui = $(".mock", replay);
    const btn = $("[data-replay]", replay);
    let timers = [];

    const stepsEl = $(".steps", ui);
    const answerEl = $(".answer", ui);
    const badgeEl = $(".badge", ui);

    function reset() {
      timers.forEach(clearTimeout); timers = [];
      log.innerHTML = '<div class="empty">// press "Replay stream" to watch the events arrive</div>';
      $$(".step", stepsEl).forEach((s) => s.classList.remove("on"));
      answerEl.innerHTML = '<span class="muted">Answer card renders here…</span>';
      badgeEl.style.visibility = "hidden";
    }

    function apply(ev) {
      if (ev.step) { const s = $(`[data-step="${ev.step}"]`, stepsEl); if (s) s.classList.add("on"); }
      if (ev.type === "intent_detected") { badgeEl.textContent = "intent: " + ev.payload.intent; badgeEl.style.visibility = "visible"; }
      if (ev.type === "partial_answer") answerEl.innerHTML = `<p style="margin:0">${esc(ev.payload.delta)}</p>`;
      if (ev.type === "final") {
        answerEl.innerHTML += `<div class="picks">${ev.ui.picks.map((p) => `<div class="pick"><b>${esc(p[0])}</b><span class="muted">${esc(p[1])}</span></div>`).join("")}</div>`;
      }
      if (ev.type === "enrichment") {
        answerEl.innerHTML += `<div class="enrich">${[62, 88, 74, 95].map((h, i) => `<span style="height:${h}%;animation-delay:${i * 80}ms"></span>`).join("")}</div>`;
      }
    }

    function run() {
      reset(); log.innerHTML = "";
      window.SSE_SCRIPT.forEach((ev) => {
        timers.push(setTimeout(() => {
          const row = document.createElement("div");
          row.className = "ev";
          row.innerHTML = `<span class="t">${(ev.at / 1000).toFixed(1)}s</span><span><span class="ty">${ev.type}</span> <span class="pl">${esc(JSON.stringify(ev.payload))}</span></span>`;
          log.appendChild(row);
          log.scrollTop = log.scrollHeight;
          apply(ev);
        }, reduceMotion ? 0 : ev.at * 0.55));
      });
    }

    btn.addEventListener("click", run);
    reset();
  }

  /* ── DailyAI cost calculator ────────────────────── */
  const calc = $("#cost-calc");
  if (calc) {
    const readers = $("#readers", calc);
    const views = $("#views", calc);
    const interval = $("#interval", calc);
    const feeds = $("#feeds", calc);
    const fmt = (n) => n.toLocaleString("en-US");

    function update() {
      const r = +readers.value, v = +views.value, iv = +interval.value, f = +feeds.value;
      $("#readers-o", calc).textContent = fmt(r);
      $("#views-o", calc).textContent = v;
      $("#interval-o", calc).textContent = iv + " min";
      $("#feeds-o", calc).textContent = f;
      const perView = r * v;
      const perRefresh = Math.round((24 * 60) / iv) * f;
      const max = Math.max(perView, perRefresh, 1);
      $("#bar-view", calc).style.width = (perView / max) * 100 + "%";
      $("#bar-refresh", calc).style.width = (perRefresh / max) * 100 + "%";
      $("#val-view", calc).textContent = fmt(perView);
      $("#val-refresh", calc).textContent = fmt(perRefresh);
      $("#val-rss", calc).textContent = "0";
      const ratio = perView / Math.max(perRefresh, 1);
      $("#calc-verdict", calc).textContent = ratio >= 1
        ? `Summarise-once uses ${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}× fewer model calls, and the cost doesn't change as readership grows.`
        : `At this small audience the per-view approach is cheaper, but its cost rises with every new reader while the refresh cost stays flat.`;
    }
    [readers, views, interval, feeds].forEach((i) => i.addEventListener("input", update));
    update();
  }

  /* ── Year ───────────────────────────────────────── */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
