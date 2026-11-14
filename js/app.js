/* THW Theorie – Lern-App (PWA, offline, ohne Server) */
(() => {
  "use strict";

  // ---------- Konstanten ----------
  const STORE_KEY = "thw-theorie-v1";
  const INTERVALS = [0, 0, 1, 3, 7, 14, 30]; // Tage je Fach (0 = neu, 1–5 Fächer, 6 = gemeistert)
  const BOX_LABELS = ["Neu", "Fach 1", "Fach 2", "Fach 3", "Fach 4", "Fach 5", "Profi"];
  const LEVELS = [
    "Grünschnabel", "Anwärter", "Junghelfer", "Helfer", "Truppmann", "Truppführer",
    "Gruppenführer", "Zugtruppführer", "Zugführer", "Fachberater", "Ortsbeauftragter", "THW-Legende"
  ];
  const BADGES = [
    { id: "first",   ico: "🎯", name: "Erste Antwort",   test: s => s.total.answered >= 1 },
    { id: "r50",     ico: "💪", name: "50 richtig",      test: s => s.total.right >= 50 },
    { id: "r250",    ico: "🏋️", name: "250 richtig",     test: s => s.total.right >= 250 },
    { id: "r1000",   ico: "🦾", name: "1000 richtig",    test: s => s.total.right >= 1000 },
    { id: "combo10", ico: "⚡", name: "10er-Combo",      test: s => s.bestCombo >= 10 },
    { id: "combo25", ico: "🌩️", name: "25er-Combo",      test: s => s.bestCombo >= 25 },
    { id: "streak3", ico: "🔥", name: "3 Tage Serie",    test: s => s.streak.best >= 3 },
    { id: "streak7", ico: "📅", name: "7 Tage Serie",    test: s => s.streak.best >= 7 },
    { id: "streak30",ico: "🏆", name: "30 Tage Serie",   test: s => s.streak.best >= 30 },
    { id: "goal",    ico: "✅", name: "Tagesziel",       test: s => s.goalsReached >= 1 },
    { id: "chapter", ico: "📘", name: "Kapitel gemeistert", test: () => CH.some(c => chapterMastery(c.id) >= 1) },
    { id: "all",     ico: "🎓", name: "Alles gemeistert", test: () => allQ().length > 0 && allQ().every(q => card(q.id).box >= 6) },
    { id: "exam",    ico: "📝", name: "Prüfung bestanden", test: s => s.exams.some(e => e.passed) },
    { id: "exam0",   ico: "💯", name: "Fehlerfreie Prüfung", test: s => s.exams.some(e => e.wrong === 0) },
    { id: "night",   ico: "🦉", name: "Nachteule",       test: s => s.flags.night },
  ];

  let CH = []; // wird aus dem importierten Katalog aufgebaut
  const BUILTIN = window.THW_QUESTIONS || [];

  // ---------- Zustand ----------
  const defaults = () => ({
    cards: {},
    xp: 0,
    total: { answered: 0, right: 0 },
    bestCombo: 0,
    streak: { count: 0, best: 0, last: null },
    daily: { date: null, count: 0, goalHit: false },
    goalsReached: 0,
    badges: {},
    exams: [],
    custom: [],
    flags: {},
    settings: { mode: "quiz", goal: 20, sessionSize: 15, newPerSession: 8, examSize: 40, examPass: 80, examMinutes: 30, tips: true },
    chapters: []
  });
  let S = load();

  // Kapitel aus den Fragen ableiten (Reihenfolge wie im Katalog)
  function rebuildChapters() {
    const meta = (S.chapters || []).concat(window.THW_CHAPTERS || []), seen = [];
    allQ().forEach(q => { if (!seen.includes(q.k)) seen.push(q.k); });
    CH = seen.map(k => { const m = meta.find(c => c.id === k); return { id: k, name: (m && m.name) || k, icon: (m && m.icon) || "📘" }; });
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY));
      if (raw) {
        const d = defaults();
        return { ...d, ...raw, settings: { ...d.settings, ...(raw.settings || {}) }, total: { ...d.total, ...(raw.total || {}) }, streak: { ...d.streak, ...(raw.streak || {}) }, daily: { ...d.daily, ...(raw.daily || {}) } };
      }
    } catch (e) { /* ignore */ }
    return defaults();
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { toast("Speichern fehlgeschlagen"); } }

  // ---------- Helfer ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  const view = $("#view");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = n => String(n).padStart(2, "0");
  const dayStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dayStr(d); };
  const today = () => dayStr();
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const allQ = () => BUILTIN.concat(S.custom || []);
  const qById = id => allQ().find(q => q.id === id);
  const chName = id => (CH.find(c => c.id === id) || { name: id, icon: "📘" });
  const card = id => S.cards[id] || { box: 0, due: null, right: 0, wrong: 0, lastWrong: false };
  const isDue = c => c.box > 0 && c.due && c.due <= today();
  const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));

  function chapterQs(chId) { return allQ().filter(q => q.k === chId); }
  function chapterMastery(chId) {
    const qs = chapterQs(chId); if (!qs.length) return 0;
    return qs.reduce((s, q) => s + Math.min(card(q.id).box, 6) / 6, 0) / qs.length;
  }

  // ---------- Level / XP ----------
  const xpNeeded = lvl => 60 * lvl * (lvl + 1); // kumulativ bis Level lvl+1
  function levelInfo() {
    let lvl = 0; while (S.xp >= xpNeeded(lvl + 1) && lvl < LEVELS.length - 1) lvl++;
    const base = lvl === 0 ? 0 : xpNeeded(lvl), next = xpNeeded(lvl + 1);
    const max = lvl >= LEVELS.length - 1;
    return { lvl, title: LEVELS[lvl], cur: S.xp - base, need: next - base, pct: max ? 100 : Math.round((S.xp - base) / (next - base) * 100), max };
  }

  function touchDay() {
    const t = today();
    if (S.daily.date !== t) S.daily = { date: t, count: 0, goalHit: false };
    if (S.streak.last !== t) {
      S.streak.count = (S.streak.last === addDays(-1)) ? S.streak.count + 1 : 1;
      S.streak.last = t;
      S.streak.best = Math.max(S.streak.best, S.streak.count);
    }
    const h = new Date().getHours(); if (h >= 23 || h < 4) S.flags.night = true;
  }
  function currentStreak() {
    if (!S.streak.last) return 0;
    return (S.streak.last === today() || S.streak.last === addDays(-1)) ? S.streak.count : 0;
  }

  // Ergebnis einer Karte verbuchen (Leitner)
  function grade(id, correct, opts = {}) {
    touchDay();
    const c = { ...card(id) };
    if (correct === "hard") { c.box = Math.max(1, c.box); c.due = addDays(1); }
    else if (correct) { c.box = Math.min(6, c.box + 1); c.right++; c.lastWrong = false; c.due = addDays(INTERVALS[c.box]); }
    else { c.box = 1; c.wrong++; c.lastWrong = true; c.due = today(); }
    S.cards[id] = c;
    S.total.answered++;
    if (correct === true) S.total.right++;
    S.daily.count++;
    let gained = 0;
    if (!opts.noXp) {
      gained = correct === true ? 10 + Math.min(opts.combo || 0, 10) * 2 : (correct === "hard" ? 4 : 2);
      addXp(gained);
    }
    if (!S.daily.goalHit && S.daily.count >= S.settings.goal) {
      S.daily.goalHit = true; S.goalsReached++; addXp(50);
      setTimeout(() => { toast("🎉 Tagesziel erreicht! +50 XP"); confetti(); }, 300);
    }
    save(); checkBadges(); updateChrome();
    return gained;
  }

  function addXp(n) {
    const before = levelInfo().lvl;
    S.xp += n;
    const after = levelInfo();
    if (after.lvl > before) setTimeout(() => { toast(`⬆️ Neuer Rang: ${after.title}!`); confetti(); }, 600);
  }

  function checkBadges() {
    BADGES.forEach(b => {
      if (!S.badges[b.id] && b.test(S)) {
        S.badges[b.id] = today();
        setTimeout(() => toast(`${b.ico} Abzeichen: ${b.name}`), 900);
      }
    });
    save();
  }

  // ---------- UI-Chrome ----------
  function updateChrome() { $("#streakChip").textContent = `🔥 ${currentStreak()}`; }
  function setTitle(t, back) {
    $("#title").textContent = t;
    const b = $("#backBtn"); b.hidden = !back; b.onclick = back || null;
  }
  function setTab(tab) {
    document.querySelectorAll("#tabbar button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  }
  const toastQ = []; let toastBusy = false;
  function toast(msg) { toastQ.push(msg); if (!toastBusy) nextToast(); }
  function nextToast() {
    const t = $("#toast"), msg = toastQ.shift();
    if (!msg) { toastBusy = false; return; }
    toastBusy = true; t.textContent = msg; t.classList.add("show");
    setTimeout(() => { t.classList.remove("show"); setTimeout(nextToast, 300); }, 2000);
  }
  function floatXp(n, el) {
    if (!n) return;
    const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
    const f = document.createElement("div"); f.className = "xp-float"; f.textContent = `+${n} XP`;
    f.style.left = (r.left + r.width / 2 - 30) + "px"; f.style.top = (r.top - 10) + "px";
    document.body.appendChild(f); setTimeout(() => f.remove(), 1000);
  }
  function confetti() {
    const cv = $("#confetti"), ctx = cv.getContext("2d");
    cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio);
    const colors = ["#003399", "#1f4fd1", "#f59e0b", "#16a34a", "#ffffff", "#dc2626"];
    const parts = Array.from({ length: 120 }, () => ({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 12, vy: Math.random() * -12 - 2, s: Math.random() * 6 + 4, c: colors[Math.random() * colors.length | 0], r: Math.random() * 6 }));
    let frames = 0;
    (function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; p.r += .2; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (++frames < 110) requestAnimationFrame(tick); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })();
  }

  // ---------- Warteschlangen ----------
  function buildQueue(pool, { size = S.settings.sessionSize, newMax = S.settings.newPerSession, fill = false } = {}) {
    const due = shuffle(pool.filter(q => isDue(card(q.id)))).sort((a, b) => card(a.id).box - card(b.id).box);
    const fresh = shuffle(pool.filter(q => card(q.id).box === 0)).slice(0, newMax);
    let queue = due.slice(0, size);
    queue = queue.concat(fresh.slice(0, Math.max(0, size - queue.length)));
    if (fill && queue.length < size) {
      const rest = shuffle(pool.filter(q => !queue.includes(q))).sort((a, b) => card(a.id).box - card(b.id).box);
      queue = queue.concat(rest.slice(0, size - queue.length));
    }
    return shuffle(queue);
  }

  // ---------- Views ----------
  const routes = { home: renderHome, chapters: renderChapters, exam: renderExamStart, stats: renderStats, more: renderMore };
  function go(tab) { document.body.classList.remove("in-session"); setTab(tab); routes[tab](); window.scrollTo(0, 0); }

  function renderHome() {
    setTitle("THW Theorie");
    if (!allQ().length) {
      view.innerHTML = `<div class="card hero"><div style="font-size:44px">📥</div><h2 style="font-size:22px">Willkommen!</h2>
        <div class="muted">Es ist noch kein Fragenkatalog geladen. Importiere einmalig den offiziellen THW-Fragenkatalog, danach geht's los.</div>
        <button class="btn gold" id="toImport">Fragenkatalog importieren</button></div>
        <div class="card"><h2>So geht's</h2><div class="muted">Den aktuellen Fragenkatalog bekommst du über das THW (ILIAS) bzw. von deinem Ausbildungsbeauftragten. Unter <b>Mehr → Fragenkatalog</b> kannst du ihn als Datei oder Text einfügen. Die Fragen bleiben nur auf deinem Gerät.</div></div>`;
      $("#toImport").onclick = () => go("more");
      return;
    }
    const L = levelInfo();
    const qs = allQ();
    const dueN = qs.filter(q => isDue(card(q.id))).length;
    const newN = qs.filter(q => card(q.id).box === 0).length;
    const wrongN = qs.filter(q => card(q.id).lastWrong).length;
    const boxes = [0, 1, 2, 3, 4, 5, 6].map(b => qs.filter(q => Math.min(card(q.id).box, 6) === b).length);
    const goalPct = Math.min(100, Math.round((S.daily.date === today() ? S.daily.count : 0) / S.settings.goal * 100));
    const mastered = boxes[6], learnedPct = Math.round(qs.reduce((s, q) => s + card(q.id).box / 6, 0) / qs.length * 100);
    view.innerHTML = `
      <div class="card hero">
        <div class="row">
          <div class="ring" style="--p:${L.pct}"><b>Lv ${L.lvl + 1}</b></div>
          <div class="grow">
            <div style="font-size:20px;font-weight:800">${esc(L.title)}</div>
            <div class="muted">${S.xp} XP${L.max ? "" : ` · noch ${L.need - L.cur} bis „${esc(LEVELS[L.lvl + 1])}“`}</div>
            <div class="bar" style="margin-top:8px"><i style="width:${L.pct}%"></i></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="row"><div class="grow"><h2>Tagesziel</h2><div class="muted">${S.daily.date === today() ? S.daily.count : 0} / ${S.settings.goal} Fragen · 🔥 ${currentStreak()} Tage Serie</div></div><div class="big">${goalPct}%</div></div>
        <div class="bar ok" style="margin-top:8px"><i style="width:${goalPct}%"></i></div>
      </div>
      <div class="card">
        <div class="seg" id="modeSeg">
          <button data-m="quiz" class="${S.settings.mode === "quiz" ? "on" : ""}">☑️ Ankreuzen</button>
          <button data-m="flash" class="${S.settings.mode === "flash" ? "on" : ""}">🃏 Karteikarten</button>
        </div>
        <div class="muted">${dueN} fällig · ${newN} neu · ${mastered} gemeistert · Gesamtfortschritt ${learnedPct}%</div>
        <button class="btn" id="learnBtn">${dueN + newN > 0 ? "▶︎ Lernen starten" : "▶︎ Freies Üben"}</button>
        <button class="btn secondary" id="wrongBtn" ${wrongN ? "" : "disabled"}>🔁 Fehler wiederholen (${wrongN})</button>
      </div>
      <div class="card">
        <h2>Karteikasten</h2>
        <div class="muted">Richtig → ein Fach weiter (längere Pause). Falsch → zurück in Fach 1.</div>
        <div class="leitner">${boxes.map(n => `<div style="height:${Math.max(4, n / Math.max(1, ...boxes) * 90)}%;${n ? "" : "opacity:.3"}"><span>${n}</span></div>`).join("")}</div>
        <div class="leitner-labels">${["Neu", "1", "2", "3", "4", "5", "★"].map(l => `<span>${l}</span>`).join("")}</div>
      </div>`;
    view.querySelectorAll("#modeSeg button").forEach(b => b.onclick = () => { S.settings.mode = b.dataset.m; save(); renderHome(); });
    $("#learnBtn").onclick = () => startSession(buildQueue(allQ(), { fill: true }), "Lernen");
    $("#wrongBtn").onclick = () => startSession(shuffle(allQ().filter(q => card(q.id).lastWrong)).slice(0, S.settings.sessionSize), "Fehler");
  }

  function renderChapters() {
    setTitle("Kapitel");
    if (!CH.length) { view.innerHTML = `<div class="card muted">Noch kein Fragenkatalog importiert (→ Mehr).</div>`; return; }
    view.innerHTML = `<div class="card">${CH.map(c => {
      const qs = chapterQs(c.id); if (!qs.length) return "";
      const m = chapterMastery(c.id), due = qs.filter(q => isDue(card(q.id))).length;
      const boxes = [1, 2, 3, 4, 5, 6].map(b => qs.filter(q => card(q.id).box >= b).length / qs.length);
      return `<div class="list-item" data-ch="${c.id}">
        <div class="emoji">${c.icon}</div>
        <div class="grow"><div style="font-weight:700">${esc(c.name)}</div>
          <div class="muted">${qs.length} Fragen · ${Math.round(m * 100)}% ${due ? `· ${due} fällig` : ""} ${m >= 1 ? "· ⭐" : ""}</div>
          <div class="boxes">${boxes.map(p => `<i style="background:${p > 0 ? `color-mix(in srgb, var(--ok) ${Math.round(p * 100)}%, var(--line))` : ""}"></i>`).join("")}</div>
        </div><div class="muted" style="font-size:22px">›</div></div>`;
    }).join("")}</div>`;
    view.querySelectorAll("[data-ch]").forEach(el => el.onclick = () => renderChapter(el.dataset.ch));
  }

  function renderChapter(chId) {
    const c = chName(chId), qs = chapterQs(chId);
    setTitle(c.name, () => go("chapters"));
    view.innerHTML = `
      <div class="card"><div class="row"><div style="font-size:40px">${c.icon}</div><div class="grow"><h2>${esc(c.name)}</h2>
        <div class="muted">${qs.length} Fragen · ${Math.round(chapterMastery(chId) * 100)}% gemeistert</div></div></div>
        <button class="btn" id="chLearn">☑️ Kapitel lernen (Ankreuzen)</button>
        <button class="btn secondary" id="chFlash">🃏 Kapitel als Karteikarten</button>
      </div>
      <div class="card"><h2>Alle Fragen</h2>${qs.map(q => {
        const cd = card(q.id);
        return `<div class="list-item"><div class="grow"><div style="font-size:15px">${esc(q.q)}</div>
          <div class="muted">${BOX_LABELS[Math.min(cd.box, 6)]} · ✓${cd.right} ✗${cd.wrong}</div></div></div>`;
      }).join("")}</div>`;
    $("#chLearn").onclick = () => startSession(buildQueue(qs, { size: qs.length, newMax: qs.length, fill: true }), c.name, "quiz", () => renderChapter(chId));
    $("#chFlash").onclick = () => startSession(buildQueue(qs, { size: qs.length, newMax: qs.length, fill: true }), c.name, "flash", () => renderChapter(chId));
  }

  // ---------- Lern-Session ----------
  function startSession(queue, label, mode = S.settings.mode, onExit = () => go("home")) {
    if (!queue.length) { toast("Gerade nichts zu lernen 👍"); return; }
    document.body.classList.add("in-session");
    const sess = { queue: queue.slice(), retried: new Set(), i: 0, combo: 0, right: 0, wrong: 0, xp: 0, total: queue.length, label, mode, onExit };
    const exit = () => { if (sess.i === 0 || confirm("Lernrunde beenden? Dein Fortschritt bleibt gespeichert.")) { document.body.classList.remove("in-session"); onExit(); } };
    setTitle(label, exit);
    nextQuestion(sess);
  }

  function nextQuestion(sess) {
    if (sess.i >= sess.queue.length) return sessionSummary(sess);
    const q = sess.queue[sess.i];
    (sess.mode === "flash" ? renderFlash : renderQuiz)(sess, q);
    window.scrollTo(0, 0);
  }

  function headHtml(sess, q) {
    const pct = Math.round(sess.i / sess.queue.length * 100), c = chName(q.k), cd = card(q.id);
    return `<div class="progress-top"><i style="width:${pct}%"></i></div>
      <div class="q-head"><span>${c.icon} ${esc(c.name)}</span><span>${sess.i + 1}/${sess.queue.length} · ${BOX_LABELS[Math.min(cd.box, 6)]}</span></div>`;
  }

  function afterAnswer(sess, q, correct, anchor) {
    if (correct === true) { sess.combo++; sess.right++; } else if (correct === false) { sess.combo = 0; sess.wrong++; }
    S.bestCombo = Math.max(S.bestCombo || 0, sess.combo);
    const g = grade(q.id, correct, { combo: sess.combo - 1 });
    sess.xp += g; floatXp(g, anchor);
    // Vokabel-Prinzip: falsch Beantwortetes kommt in derselben Runde noch einmal dran
    if (correct === false && !sess.retried.has(q.id)) {
      sess.retried.add(q.id);
      const pos = Math.min(sess.queue.length, sess.i + 4);
      sess.queue.splice(pos, 0, q);
    }
  }

  function renderQuiz(sess, q) {
    const order = shuffle(q.a.map((_, i) => i));
    const multi = q.c.length > 1;
    let sel = new Set(), done = false;
    view.innerHTML = `${headHtml(sess, q)}
      <div class="q-text">${esc(q.q)}</div>
      <div class="muted" style="margin:-6px 0 10px">Eine oder mehrere Antworten können richtig sein.</div>
      <div id="answers">${order.map(i => `<button class="answer" data-i="${i}"><span class="box"></span><span class="grow">${esc(q.a[i])}${q.r && q.r[i] ? `<span class="reason">💡 ${esc(q.r[i])}</span>` : ""}</span></button>`).join("")}</div>
      <div id="feedback"></div>
      <button class="btn" id="checkBtn" disabled>Antwort prüfen</button>
      ${sess.combo >= 3 ? `<div class="combo" style="text-align:center;margin-top:10px">⚡ Combo x${sess.combo}</div>` : ""}`;
    const btns = view.querySelectorAll(".answer"), check = $("#checkBtn");
    btns.forEach(b => b.onclick = () => {
      if (done) return;
      const i = +b.dataset.i; sel.has(i) ? sel.delete(i) : sel.add(i);
      b.classList.toggle("sel", sel.has(i)); b.querySelector(".box").textContent = sel.has(i) ? "✓" : "";
      check.disabled = sel.size === 0;
    });
    check.onclick = () => {
      if (!done) {
        done = true;
        const ok = sameSet([...sel], q.c);
        btns.forEach(b => {
          const i = +b.dataset.i, isC = q.c.includes(i), isS = sel.has(i);
          b.classList.remove("sel");
          if (isC && isS) b.classList.add("right");
          else if (!isC && isS) b.classList.add("wrong");
          else if (isC && !isS) b.classList.add("missed");
          b.querySelector(".box").textContent = isC ? "✓" : (isS ? "✗" : "");
        });
        afterAnswer(sess, q, ok, check);
        $("#feedback").innerHTML = `<div class="verdict ${ok ? "ok" : "bad"} pop">${ok ? pick(["Richtig! 💪", "Stark! ✅", "Sitzt! 🎯", "Genau so! 👏"]) : (multi ? "Nicht ganz – alle richtigen ankreuzen." : "Leider falsch.")}</div>
          ${q.e ? `<div class="explain tip">💡 ${esc(q.e)}</div>` : ""}
          ${hasTips(q) ? tipToggleHtml() : ""}`;
        bindTipToggle();
        view.classList.add("checked");
        if (!ok) view.querySelector("#answers").classList.add("shake");
        check.textContent = sess.i + 1 >= sess.queue.length ? "Auswertung" : "Weiter ›";
      } else { sess.i++; nextQuestion(sess); }
    };
  }

  function renderFlash(sess, q) {
    view.innerHTML = `${headHtml(sess, q)}
      <div class="flash" id="flash"><div class="flash-inner">
        <div class="flash-face"><div class="tag">Frage</div><div class="q-text">${esc(q.q)}</div><div class="hint-tap">Antwort im Kopf überlegen – dann antippen zum Umdrehen</div></div>
        <div class="flash-face flash-back"><div class="tag">Antwort</div><div style="font-weight:700">${esc(q.q)}</div>
          <ul>${q.c.map(i => `<li>${esc(q.a[i])}${q.r && q.r[i] ? `<span class="reason">💡 ${esc(q.r[i])}</span>` : ""}</li>`).join("")}</ul>${q.e ? `<div class="explain tip">💡 ${esc(q.e)}</div>` : ""}
          ${hasTips(q) ? tipToggleHtml() : ""}</div>
      </div></div>
      <div id="rate"><button class="btn" id="flipBtn">Umdrehen</button></div>
      ${sess.combo >= 3 ? `<div class="combo" style="text-align:center;margin-top:10px">⚡ Combo x${sess.combo}</div>` : ""}`;
    const flash = $("#flash"); bindTipToggle();
    view.classList.add("checked");
    const flip = () => {
      if (flash.classList.contains("flipped")) return;
      flash.classList.add("flipped");
      $("#rate").innerHTML = `<div class="btn-row">
        <button class="btn bad" data-r="0">✗ Nicht gewusst</button>
        <button class="btn gold" data-r="h">~ Unsicher</button>
        <button class="btn ok" data-r="1">✓ Gewusst</button></div>`;
      $("#rate").querySelectorAll("button").forEach(b => b.onclick = () => {
        const r = b.dataset.r === "1" ? true : b.dataset.r === "h" ? "hard" : false;
        if (r === "hard") sess.combo = 0;
        afterAnswer(sess, q, r, b);
        sess.i++; setTimeout(() => nextQuestion(sess), 250);
      });
    };
    flash.onclick = e => { if (!e.target.closest(".tip-toggle")) flip(); }; $("#flipBtn").onclick = flip;
  }

  function sessionSummary(sess) {
    const n = sess.right + sess.wrong, pct = n ? Math.round(sess.right / n * 100) : 0;
    if (pct >= 80 && n >= 5) confetti();
    setTitle("Geschafft!", null);
    view.innerHTML = `<div class="card hero pop" style="text-align:center">
        <div style="font-size:56px">${pct >= 90 ? "🏆" : pct >= 70 ? "💪" : "📚"}</div>
        <div class="big">${pct}% richtig</div>
        <div class="muted">${sess.right} richtig · ${sess.wrong} falsch · +${sess.xp} XP</div>
      </div>
      <div class="card"><div class="muted">${pct >= 90 ? "Hervorragend – weiter so!" : pct >= 70 ? "Gute Runde! Die falschen Fragen kommen bald wieder." : "Dranbleiben! Wiederholung macht den Meister."}</div>
        <button class="btn" id="again">Noch eine Runde</button>
        <button class="btn secondary" id="done">Fertig</button></div>`;
    $("#again").onclick = () => startSession(buildQueue(allQ(), { fill: true }), "Lernen", sess.mode, sess.onExit);
    $("#done").onclick = () => { document.body.classList.remove("in-session"); sess.onExit(); };
  }
  const pick = arr => arr[Math.random() * arr.length | 0];
  const hasTips = q => !!(q.e || (q.r && q.r.some(Boolean)));
  const tipToggleHtml = () => `<button class="tip-toggle">💡 Infotipps ${S.settings.tips ? "ausblenden" : "einblenden"}</button>`;
  function applyTips() { document.body.classList.toggle("tips-on", !!S.settings.tips); }
  function bindTipToggle() {
    view.querySelectorAll(".tip-toggle").forEach(b => b.onclick = e => {
      e.stopPropagation(); S.settings.tips = !S.settings.tips; save(); applyTips();
      view.querySelectorAll(".tip-toggle").forEach(x => x.textContent = `💡 Infotipps ${S.settings.tips ? "ausblenden" : "einblenden"}`);
    });
  }

  // ---------- Prüfung ----------
  function renderExamStart() {
    setTitle("Prüfungssimulation");
    const st = S.settings, last = S.exams.slice(-5).reverse();
    view.innerHTML = `<div class="card">
        <h2>📝 Wie in der Prüfung</h2>
        <div class="muted">${st.examSize} zufällige Fragen aus allen Kapiteln, ${st.examMinutes} Minuten Zeit, bestanden ab ${st.examPass}% richtig. Eine Frage zählt nur, wenn <b>alle</b> richtigen Antworten angekreuzt sind. Auflösung erst am Ende.</div>
        <button class="btn" id="examGo" ${allQ().length ? "" : "disabled"}>Prüfung starten</button>
        <div class="muted" style="margin-top:8px">Standard wie in der THW-Prüfungsvorschrift (DV 2-220): 40 Fragen, 30 Minuten, mind. 80 % richtig (höchstens 8 Fehler). Anpassbar unter „Mehr“.</div>
      </div>
      ${last.length ? `<div class="card"><h2>Letzte Prüfungen</h2>${last.map(e => `<div class="list-item"><div class="emoji">${e.passed ? "✅" : "❌"}</div><div class="grow">${e.pct}% · ${e.wrong} Fehler</div><div class="muted">${e.date}</div></div>`).join("")}</div>` : ""}`;
    $("#examGo").onclick = startExam;
  }

  function startExam() {
    const st = S.settings, pool = allQ();
    // gleichmäßig über Kapitel verteilen
    const byCh = CH.map(c => shuffle(pool.filter(q => q.k === c.id))).filter(a => a.length);
    const custom = shuffle(pool.filter(q => !CH.find(c => c.id === q.k))); if (custom.length) byCh.push(custom);
    const qs = []; let r = 0;
    while (qs.length < Math.min(st.examSize, pool.length)) { const a = byCh[r % byCh.length]; if (a.length) qs.push(a.pop()); r++; }
    const ex = { qs: shuffle(qs), ans: qs.map(() => new Set()), orders: qs.map(q => shuffle(q.a.map((_, i) => i))), i: 0, end: Date.now() + st.examMinutes * 60000 };
    document.body.classList.add("in-session");
    setTitle("Prüfung", () => { if (confirm("Prüfung abbrechen? Sie wird nicht gewertet.")) { clearInterval(ex.timer); go("exam"); } });
    ex.timer = setInterval(() => {
      const left = ex.end - Date.now(), t = $("#examTimer");
      if (left <= 0) { clearInterval(ex.timer); toast("⏰ Zeit abgelaufen"); finishExam(ex); return; }
      if (t) t.textContent = `${Math.floor(left / 60000)}:${pad(Math.floor(left / 1000) % 60)}`;
    }, 500);
    renderExamQ(ex);
  }

  function renderExamQ(ex) {
    const q = ex.qs[ex.i], sel = ex.ans[ex.i], answered = ex.ans.filter(a => a.size).length;
    view.innerHTML = `<div class="progress-top"><i style="width:${answered / ex.qs.length * 100}%"></i></div>
      <div class="q-head"><span>Frage ${ex.i + 1} von ${ex.qs.length}</span><span class="timer" id="examTimer">–:–</span></div>
      <div class="q-text">${esc(q.q)}</div>
      ${ex.orders[ex.i].map(i => `<button class="answer ${sel.has(i) ? "sel" : ""}" data-i="${i}"><span class="box">${sel.has(i) ? "✓" : ""}</span><span>${esc(q.a[i])}</span></button>`).join("")}
      <div class="btn-row"><button class="btn secondary" id="prev" ${ex.i ? "" : "disabled"}>‹ Zurück</button>
        ${ex.i + 1 < ex.qs.length ? `<button class="btn" id="next">Weiter ›</button>` : `<button class="btn ok" id="submit">Abgeben</button>`}</div>
      ${ex.i + 1 < ex.qs.length ? `<button class="btn secondary" id="submit2" style="border:0">Jetzt abgeben (${answered}/${ex.qs.length} beantwortet)</button>` : ""}`;
    view.querySelectorAll(".answer").forEach(b => b.onclick = () => {
      const i = +b.dataset.i; sel.has(i) ? sel.delete(i) : sel.add(i);
      b.classList.toggle("sel", sel.has(i)); b.querySelector(".box").textContent = sel.has(i) ? "✓" : "";
    });
    $("#prev").onclick = () => { ex.i--; renderExamQ(ex); };
    const n = $("#next"); if (n) n.onclick = () => { ex.i++; renderExamQ(ex); window.scrollTo(0, 0); };
    const submit = () => {
      const open = ex.ans.filter(a => !a.size).length;
      if (open && !confirm(`${open} Frage(n) unbeantwortet. Trotzdem abgeben?`)) return;
      clearInterval(ex.timer); finishExam(ex);
    };
    const s1 = $("#submit"), s2 = $("#submit2"); if (s1) s1.onclick = submit; if (s2) s2.onclick = submit;
  }

  function finishExam(ex) {
    const res = ex.qs.map((q, i) => ({ q, sel: [...ex.ans[i]], ok: sameSet([...ex.ans[i]], q.c) }));
    const right = res.filter(r => r.ok).length, wrong = res.length - right, pct = Math.round(right / res.length * 100);
    const passed = pct >= S.settings.examPass;
    res.filter(r => r.sel.length).forEach(r => grade(r.q.id, r.ok, { noXp: true })); // Unbeantwortetes nicht in den Karteikasten
    addXp(right * 5 + (passed ? 100 : 0));
    S.exams.push({ date: today(), pct, wrong, passed }); save(); checkBadges(); updateChrome();
    if (passed) confetti();
    setTitle("Ergebnis", () => go("exam"));
    document.body.classList.add("in-session");
    view.innerHTML = `<div class="card hero pop" style="text-align:center">
        <div style="font-size:56px">${passed ? "🎓" : "😬"}</div>
        <div class="big">${passed ? "Bestanden!" : "Nicht bestanden"}</div>
        <div class="muted">${pct}% richtig · ${wrong} Fehler · +${right * 5 + (passed ? 100 : 0)} XP</div>
        <div class="exam-grid">${res.map(r => `<i class="${r.ok ? "" : "f"}"></i>`).join("")}</div>
      </div>
      ${wrong ? `<div class="card"><h2>Deine Fehler</h2>${res.filter(r => !r.ok).map(r => `
        <div class="list-item" style="display:block"><div style="font-weight:700;margin-bottom:6px">${esc(r.q.q)}</div>
        ${r.q.a.map((a, i) => { const c = r.q.c.includes(i), s = r.sel.includes(i); return `<div style="font-size:14px;margin:3px 0;color:${c ? "var(--ok)" : s ? "var(--bad)" : "var(--muted)"}">${c ? "✓" : s ? "✗" : "·"} ${esc(a)}</div>`; }).join("")}
        ${r.q.e ? `<div class="explain tip">💡 ${esc(r.q.e)}</div>` : ""}</div>`).join("")}</div>` : ""}
      <div class="card"><button class="btn" id="exAgain">Neue Prüfung</button><button class="btn secondary" id="exDone">Fertig</button></div>`;
    $("#exAgain").onclick = startExam;
    $("#exDone").onclick = () => go("exam");
  }

  // ---------- Erfolge ----------
  function renderStats() {
    setTitle("Erfolge");
    const L = levelInfo(), acc = S.total.answered ? Math.round(S.total.right / S.total.answered * 100) : 0;
    const passed = S.exams.filter(e => e.passed).length;
    view.innerHTML = `<div class="card hero"><div class="row"><div class="ring" style="--p:${L.pct}"><b>Lv ${L.lvl + 1}</b></div>
        <div class="grow"><div style="font-size:20px;font-weight:800">${esc(L.title)}</div><div class="muted">${S.xp} XP gesamt</div></div></div></div>
      <div class="card"><div class="badges">
        <div class="badge"><span class="ico">🔥</span><b>${currentStreak()}</b><br>Serie (beste ${S.streak.best})</div>
        <div class="badge"><span class="ico">🎯</span><b>${acc}%</b><br>Trefferquote</div>
        <div class="badge"><span class="ico">⚡</span><b>${S.bestCombo || 0}</b><br>beste Combo</div>
        <div class="badge"><span class="ico">📊</span><b>${S.total.answered}</b><br>Antworten</div>
        <div class="badge"><span class="ico">📝</span><b>${passed}/${S.exams.length}</b><br>Prüfungen</div>
        <div class="badge"><span class="ico">⭐</span><b>${allQ().filter(q => card(q.id).box >= 6).length}</b><br>gemeistert</div>
      </div></div>
      <div class="card"><h2>Abzeichen (${Object.keys(S.badges).length}/${BADGES.length})</h2><div class="badges">
        ${BADGES.map(b => `<div class="badge ${S.badges[b.id] ? "" : "locked"}"><span class="ico">${b.ico}</span>${esc(b.name)}</div>`).join("")}
      </div></div>
      <div class="card"><h2>Ränge</h2>${LEVELS.map((t, i) => `<div class="list-item"><div class="emoji">${i <= L.lvl ? "🎖️" : "🔒"}</div><div class="grow">${esc(t)}</div><div class="muted">${i === 0 ? 0 : xpNeeded(i)} XP</div></div>`).join("")}</div>`;
  }

  // ---------- Mehr / Einstellungen ----------
  function renderMore() {
    setTitle("Mehr");
    const st = S.settings;
    const standalone = window.navigator.standalone || window.Android || matchMedia("(display-mode: standalone)").matches;
    view.innerHTML = `
      ${standalone ? "" : `<div class="card"><h2>📲 Als App installieren</h2><div class="muted">In Safari unten auf <b>Teilen</b> (□↑) tippen → <b>„Zum Home-Bildschirm“</b>. Danach startet die App im Vollbild und funktioniert offline.</div></div>`}
      <div class="card"><h2>Einstellungen</h2>
        <label class="field">Tagesziel (Fragen)<input type="number" min="5" max="200" data-s="goal" value="${st.goal}"></label>
        <label class="field">Fragen pro Lernrunde<input type="number" min="5" max="100" data-s="sessionSize" value="${st.sessionSize}"></label>
        <label class="field">Neue Fragen pro Runde<input type="number" min="0" max="50" data-s="newPerSession" value="${st.newPerSession}"></label>
        <label class="field">Prüfung: Anzahl Fragen<input type="number" min="5" max="200" data-s="examSize" value="${st.examSize}"></label>
        <label class="field">Prüfung: Minuten<input type="number" min="1" max="180" data-s="examMinutes" value="${st.examMinutes}"></label>
        <label class="field">Prüfung: bestanden ab %<input type="number" min="1" max="100" data-s="examPass" value="${st.examPass}"></label>
      </div>
      <div class="card"><h2>📥 Fragenkatalog</h2>
        <div class="muted">Aktuell geladen: <b>${allQ().length}</b> Fragen in ${CH.length} Kapiteln.<br>
        Datei wählen (JSON oder Text) oder Inhalt einfügen. Formate siehe README im Repo. Kurzform Text:<br>
        <code># Kapitelname<br>? Frage<br>+ richtige Antwort || Begründung<br>- falsche Antwort || Begründung<br>&gt; Infotipp zur Frage</code></div>
        <button class="btn secondary" id="pickCat">Datei wählen …</button>
        <input type="file" id="catFile" accept=".json,.txt,application/json,text/plain" hidden>
        <textarea id="importTxt" placeholder="oder hier einfügen …"></textarea>
        <div class="btn-row"><button class="btn" id="importAdd">Hinzufügen</button><button class="btn gold" id="importReplace">Katalog ersetzen</button></div>
        <div class="muted" style="margin-top:6px">„Ersetzen“ tauscht die Fragen aus. Dein Lernstand bleibt für gleiche Fragen erhalten.</div>
        ${S.custom.length ? `<button class="btn secondary" id="exportCat">Katalog exportieren (für anderes Gerät)</button><button class="btn secondary" id="clearCustom" style="border-color:var(--bad);color:var(--bad)">Katalog löschen</button>` : ""}
      </div>
      <div class="card"><h2>💡 Infotipps</h2>
        <label class="field">Begründungen nach dem Antworten zeigen<input type="checkbox" id="tipsChk" ${st.tips ? "checked" : ""} style="width:auto;transform:scale(1.4)"></label>
      </div>
      <div class="card"><h2>💾 Sicherung</h2>
        <div class="muted">Dein Fortschritt liegt nur auf diesem Gerät. Exportiere ihn ab und zu als Backup.</div>
        <button class="btn secondary" id="exportBtn">Fortschritt exportieren</button>
        <button class="btn secondary" id="restoreBtn">Sicherung einspielen</button>
        <input type="file" id="restoreFile" accept="application/json,.json" hidden>
        <button class="btn bad" id="resetBtn">Fortschritt zurücksetzen</button>
      </div>
      <div class="card"><h2>ℹ️ Über</h2><div class="muted">Inoffizielle Lernhilfe, kein Produkt der Bundesanstalt THW. Die App enthält selbst keine Prüfungsfragen. Du importierst den offiziellen Katalog, und er bleibt nur auf deinem Gerät. Im Zweifel gilt immer, was in den aktuellen THW-Unterlagen und bei deinen Ausbildern steht.</div></div>`;
    view.querySelectorAll("[data-s]").forEach(inp => inp.onchange = () => {
      const v = parseInt(inp.value, 10); if (!isNaN(v) && v > 0) { S.settings[inp.dataset.s] = v; save(); toast("Gespeichert"); }
    });
    const doImport = (txt, replace) => {
      let res;
      try { res = parseCatalog(txt); } catch (e) { toast("Format nicht erkannt"); return; }
      if (!res.questions.length) { toast("Keine gültigen Fragen gefunden"); return; }
      if (replace) { S.custom = []; S.chapters = []; }
      const ids = new Set(allQ().map(q => q.id)); let n = 0;
      res.questions.forEach(q => { if (!ids.has(q.id)) { S.custom.push(q); ids.add(q.id); n++; } });
      res.chapters.forEach(c => { if (!S.chapters.find(x => x.id === c.id)) S.chapters.push(c); });
      save(); rebuildChapters(); toast(`${n} Fragen ${replace ? "geladen" : "hinzugefügt"}`); renderMore();
    };
    $("#importAdd").onclick = () => doImport($("#importTxt").value, false);
    $("#importReplace").onclick = () => { if (!S.custom.length || confirm("Vorhandenen Katalog ersetzen?")) doImport($("#importTxt").value, true); };
    $("#pickCat").onclick = () => $("#catFile").click();
    $("#catFile").onchange = e => { const f = e.target.files[0]; if (f) f.text().then(t => { $("#importTxt").value = t; toast("Datei geladen – jetzt Hinzufügen oder Ersetzen"); }); };
    $("#tipsChk").onchange = e => { S.settings.tips = e.target.checked; save(); applyTips(); };
    const ec = $("#exportCat"); if (ec) ec.onclick = () => shareJson({ chapters: S.chapters, questions: S.custom }, `thw-fragenkatalog-${today()}.json`);
    const cc = $("#clearCustom"); if (cc) cc.onclick = () => { if (confirm("Fragenkatalog vom Gerät löschen? Dein Lernstand bleibt erhalten.")) { S.custom = []; S.chapters = []; save(); rebuildChapters(); renderMore(); } };
    $("#exportBtn").onclick = () => shareJson(S, `thw-theorie-backup-${today()}.json`);
    $("#restoreBtn").onclick = () => $("#restoreFile").click();
    $("#restoreFile").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => { const d = JSON.parse(t); if (!d.cards) throw 0; localStorage.setItem(STORE_KEY, JSON.stringify(d)); S = load(); rebuildChapters(); applyTips(); toast("Sicherung eingespielt"); updateChrome(); renderMore(); })
        .catch(() => toast("Datei nicht lesbar"));
    };
    $("#resetBtn").onclick = () => {
      if (confirm("Wirklich ALLEN Fortschritt löschen? Das lässt sich nicht rückgängig machen.")) {
        const keep = { custom: S.custom, settings: S.settings }; S = { ...defaults(), ...keep }; save(); updateChrome(); toast("Zurückgesetzt"); renderMore();
      }
    };
  }

  // ---------- Katalog-Import ----------
  function hash(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; return h.toString(36); }
  function normQ(q) {
    if (!q || !q.q || !Array.isArray(q.a) || !Array.isArray(q.c) || !q.a.length) return null;
    const a = q.a.map(x => String(x).trim()), c = [...new Set(q.c.map(Number))].filter(i => i >= 0 && i < a.length);
    if (!c.length) return null;
    const r = Array.isArray(q.r) ? a.map((_, i) => q.r[i] ? String(q.r[i]).trim() : "") : null;
    const k = String(q.k || q.chapter || "Allgemein").trim(), text = String(q.q).trim();
    return { id: q.id ? String(q.id) : "h" + hash(k + "|" + text), k, q: text, a, c, e: q.e ? String(q.e).trim() : "", ...(r && r.some(Boolean) ? { r } : {}) };
  }
  function parseCatalog(txt) {
    txt = String(txt || "").replace(/^\uFEFF/, "").trim();
    if (!txt) return { chapters: [], questions: [] };
    if (txt[0] === "[" || txt[0] === "{") {
      let d = JSON.parse(txt), chapters = [];
      if (!Array.isArray(d)) { chapters = (d.chapters || []).map(c => ({ id: String(c.id || c.name), name: String(c.name || c.id), icon: c.icon })); d = d.questions || []; }
      return { chapters, questions: d.map(normQ).filter(Boolean) };
    }
    const qs = [], chapters = []; let ch = "Allgemein", cur = null;
    txt.split(/\r?\n/).forEach(raw => {
      const line = raw.trim(); if (!line) return;
      if (line[0] === "#") { ch = line.replace(/^#+\s*/, ""); if (!chapters.find(c => c.id === ch)) chapters.push({ id: ch, name: ch }); return; }
      const m = line.match(/^([?+*>-])\s*(.*)$/);
      if (m && m[1] === "?") { cur = { k: ch, q: m[2], a: [], c: [], r: [], e: "" }; qs.push(cur); return; }
      if (!cur) return;
      if (m && "+*-".includes(m[1])) { const [ans, why] = m[2].split("||").map(x => x.trim()); if (m[1] !== "-") cur.c.push(cur.a.length); cur.a.push(ans); cur.r.push(why || ""); return; }
      if (m && m[1] === ">") { cur.e += (cur.e ? " " : "") + m[2]; return; }
      if (!cur.a.length) cur.q += " " + line; // Fortsetzung der Frage
      else cur.a[cur.a.length - 1] += " " + line; // Fortsetzung der Antwort
    });
    return { chapters, questions: qs.map(normQ).filter(Boolean) };
  }
  async function shareJson(obj, name) {
    if (window.Android && window.Android.saveFile) { window.Android.saveFile(name, JSON.stringify(obj, null, 1)); return; } // Android-App
    const blob = new Blob([JSON.stringify(obj, null, 1)], { type: "application/json" });
    const file = new File([blob], name, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); } catch (e) { /* abgebrochen */ } }
    else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); }
  }

  // ---------- Start ----------
  document.querySelectorAll("#tabbar button").forEach(b => b.onclick = () => go(b.dataset.tab));
  rebuildChapters(); updateChrome(); applyTips();
  go("home");
  // Android-Zurück-Taste: true = in der App zurückgegangen, false = App darf schließen
  window.__thwBack = () => {
    const b = $("#backBtn");
    if (!b.hidden && b.onclick) { b.onclick(); return true; }
    const active = document.querySelector("#tabbar button.active");
    if (!document.body.classList.contains("in-session") && active && active.dataset.tab !== "home") { go("home"); return true; }
    return false;
  };
  if ("serviceWorker" in navigator && location.protocol !== "file:" && !window.Android) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  window.__thw = { get state() { return S; }, parseCatalog }; // für Tests/Debug
})();
