"use strict";
/* Infinitesimal Calculus 2 · Series of numbers (5 proofs). Every figure is a 2D graph; steps are linked to the figure. */
(function (ML) {
  const C = ML.C, fmt = ML.fmt;
  const LANE = [C.blue, C.pink, C.green, C.gold, C.purple, C.orange, C.cyan];
  const FONT = "11px system-ui, sans-serif", BOLD = "700 12px system-ui, sans-serif";

  /* ---------- local helpers ---------- */
  const rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const niceStep = (span, target = 5) => {
    const raw = span / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / mag;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * mag;
  };
  /** light grid, tick labels and axes for the current view ranges */
  function frame(v, opt) {
    const o = Object.assign({ xfmt: (x) => fmt(x, 3), yfmt: (y) => fmt(y, 3) }, opt || {});
    const [[xa, ya], [xb, yb]] = v.visible();
    const sx = niceStep(xb - xa), sy = niceStep(yb - ya, 4);
    if (!(sx > 0 && sy > 0) || !Number.isFinite(sx + sy)) return;
    for (let x = Math.ceil(xa / sx) * sx, k = 0; x <= xb && k < 40; x += sx, k++) {
      v.line(x, ya, x, yb, C.grid, 1); v.text(o.xfmt(x), x, ya, C.dim, 0, -5, FONT, "center");
    }
    for (let y = Math.ceil(ya / sy) * sy, k = 0; y <= yb && k < 40; y += sy, k++) {
      v.line(xa, y, xb, y, C.grid, 1); v.text(o.yfmt(y), xa, y, C.dim, 4, -3, FONT);
    }
    v.axes();
  }
  function btnRow(st, items) {
    const row = ML.h("div", { class: "btn-row" }); st.panel.append(row);
    items.forEach(([t, f]) => ML.button(row, t, f)); return row;
  }
  /** Play/Pause button that counts a slider value up (speed = steps per second) */
  function player(st, { get, set, min, max, speed }) {
    let acc = 0, btn;
    const anim = ML.loop(st, (dt) => {
      acc += dt * speed;
      while (acc >= 1) {
        acc -= 1;
        if (get() >= max) { btn.textContent = "▶ Play"; return false; }
        set(get() + 1);
      }
    });
    btn = ML.button(st.panel, "▶ Play", () => {
      if (anim.running) { anim.stop(); btn.textContent = "▶ Play"; return; }
      if (get() >= max) set(min);
      btn.textContent = "⏸ Pause"; anim.start();
    });
    return { stop() { anim.stop(); btn.textContent = "▶ Play"; } };
  }
  const glow = (cv, on) => { cv.style.outline = on ? "2px solid " + C.gold : "none"; cv.style.outlineOffset = "-2px"; };

  /* ================================================================== */
  /* 1 · Geometric series                                               */
  /* ================================================================== */
  ML.register({
    id: "geometric-series",
    course: "infi2",
    topic: "series",
    title: "The geometric series",
    blurb: "Σ rⁿ = 1/(1−r) exactly when |r| < 1: telescope the partial sums.",
    statement: String.raw`Let \(r\in\mathbb R\). The geometric series \(\displaystyle\sum_{n=0}^{\infty} r^n\) converges if and only if \(|r|\lt 1\), and in that case \(\displaystyle\sum_{n=0}^{\infty} r^n=\frac{1}{1-r}\).`,
    shows: String.raw`The statement itself: the partial sums \(S_N=1+r+\dots+r^N\) (blue dots) for the ratio \(r\) you choose, the limit \(\frac1{1-r}\) (gold) when \(|r|\lt1\), and below it the same sum drawn as steps along a number line.`,
    vizIntro: String.raw`<b>Move the ratio \(r\) and the number of terms \(N\).</b> Try \(r=0.5\), then \(r=-0.5\), then \(r=1\), \(r=-1\) and \(r=1.2\) (use the buttons). For \(|r|\lt1\) the dots settle on the gold line; otherwise they never do.`,

    viz(box) {
      const NMAX = 25;
      const st = ML.stage(box, { x: [-1.5, NMAX + 1.5], y: [-1, 3], equal: false, aspect: "4 / 3" });
      const S = { r: 0.6, N: 8, focus: -1 };
      let saved = null;
      const part = (r) => { const a = []; let s = 0, t = 1; for (let n = 0; n <= NMAX; n++) { s += t; a.push(s); t *= r; } return a; };
      const closed = (r, n) => (Math.abs(r - 1) < 1e-12 ? n + 1 : (1 - Math.pow(r, n + 1)) / (1 - r));

      const rSl = ML.slider(st.panel, { label: "ratio \\(r\\)", min: -1.5, max: 1.5, step: 0.01, value: S.r, onInput: (x) => { S.r = x; st.redraw(); } });
      const nSl = ML.slider(st.panel, { label: "\\(N\\) (last index in the sum)", min: 0, max: NMAX, step: 1, value: S.N, fmt: (x) => String(x), onInput: (x) => { S.N = x; st.redraw(); } });
      const setR = (r) => { S.r = r; rSl.set(r); st.redraw(); };
      const setN = (n) => { S.N = n; nSl.set(n); };
      btnRow(st, [["r = 1/2", () => setR(0.5)], ["r = −1/2", () => setR(-0.5)], ["r = 1", () => setR(1)], ["r = −1", () => setR(-1)], ["r = 1.2", () => setR(1.2)]]);
      player(st, { get: () => S.N, set: setN, min: 0, max: NMAX, speed: 3 });
      const nl = st.extra({ x: [-0.5, 3], y: [-11.5, 1.4], height: 170 });
      const out = ML.readout(st.panel);

      st.draw((v) => {
        const r = S.r, sm = part(r), N = S.N, lim = Math.abs(r) < 1 ? 1 / (1 - r) : null;
        const vals = sm.slice(0, N + 1); if (lim !== null) vals.push(lim);
        const lo = Math.min(0, ...vals), hi = Math.max(1, ...vals), pad = (hi - lo) * 0.15 + 0.05;
        v.o.y = [lo - pad, hi + pad]; v.begin();
        frame(v);
        if (lim !== null) {
          v.line(-1.5, lim, NMAX + 1.5, lim, C.gold, 2, [7, 5]);
          v.text(`limit 1/(1−r) = ${fmt(lim, 3)}`, NMAX + 1.2, lim, C.gold, 0, -7, BOLD, "right");
        }
        for (let n = 1; n <= N; n++) v.line(n - 1, sm[n - 1], n, sm[n], "rgba(108,140,255,.45)", 1.5);
        if (S.focus === 2 && lim !== null) for (let n = 0; n <= N; n++) v.line(n, sm[n], n, lim, C.red, 2.5);
        if (S.focus === 3) for (let n = 1; n <= N; n++) v.line(n, sm[n - 1], n, sm[n], C.orange, 4.5);
        for (let n = 0; n <= N; n++) v.dot(n, sm[n], n === N ? C.white : C.blue, n === N ? 6 : 4.5);
        if (S.focus === 1) {
          const c = v.ctx; c.strokeStyle = C.gold; c.lineWidth = 2.5;
          for (let n = 0; n <= N; n++) { const [px, py] = v.P(n, closed(r, n)); c.beginPath(); c.arc(px, py, 8.5, 0, 7); c.stroke(); }
          v.text("rings: (1 − r^(N+1)) / (1 − r)     dots: 1 + r + … + r^N", -1.3, hi + pad, C.gold, 4, 32, BOLD);
        }
        if (S.focus === 3) v.text("orange: the term r^n added at step n", -1.3, hi + pad, C.orange, 4, 32, BOLD);
        v.text("N", NMAX + 1.4, lo - pad, C.dim, 0, -22, BOLD, "right");
        v.text("S_N = 1 + r + … + r^N", -1.3, hi + pad, C.text, 4, 14, BOLD);
      });

      nl.draw((g) => {
        const r = S.r, sm = part(r), K = Math.min(S.N, 10), lim = Math.abs(r) < 1 ? 1 / (1 - r) : null;
        const xs = [0].concat(sm.slice(0, K + 1)); if (lim !== null) xs.push(lim);
        const lo = Math.min(...xs), hi = Math.max(...xs), pad = (hi - lo) * 0.12 + 0.2;
        g.o.x = [lo - pad, hi + pad]; g.o.y = [-K - 1.6, 1.5]; g.begin();
        g.line(lo - pad, 0.55, hi + pad, 0.55, C.grid, 1);
        if (lim !== null) { g.line(lim, 1.2, lim, -K - 1.4, C.gold, 2, [6, 5]); g.text("1/(1−r)", lim, 1.2, C.gold, 4, 11, FONT); }
        for (let n = 0; n <= K; n++) {
          const y = -n, a = n === 0 ? 0 : sm[n - 1], b = sm[n], col = LANE[n % LANE.length];
          g.arrow(a, y, b, y, col, S.focus === 4 ? 4.5 : 3);
          g.text(n === 0 ? "1" : "r^" + n, (a + b) / 2, y, col, 0, -7, FONT, "center");
          g.line(b, y, b, y - 1, "rgba(255,255,255,.2)", 1, [3, 3]);
        }
        g.text("number line: step n goes from S_(n−1) to S_n (length r^n)", lo - pad, 1.2, C.text, 6, 6, "600 11px system-ui");
      });

      st.after = () => {
        const r = S.r, sm = part(r), N = S.N, lim = Math.abs(r) < 1 ? 1 / (1 - r) : null;
        const rows = [["r", fmt(r, 3)], ["S_N (direct sum)", fmt(sm[N], 5)],
          ["closed form", Math.abs(r - 1) < 1e-12 ? `N + 1 = ${N + 1}` : fmt(closed(r, N), 5)],
          ["limit", lim !== null ? fmt(lim, 5) : "does not exist"]];
        if (lim !== null) rows.push(["|S − S_N|", fmt(Math.pow(Math.abs(r), N + 1) / Math.abs(1 - r), 6)]);
        rows.push(["|r^N|", fmt(Math.pow(Math.abs(r), N), 4)]);
        out(rows, lim !== null ? `<span class="ok">|r| &lt; 1: converges to 1/(1−r).</span>` : `<span class="no">|r| ≥ 1: the terms r^n do not tend to 0, so the series diverges.</span>`);
      };

      const forceR = (r) => { if (saved === null) saved = S.r; setR(r); };
      return {
        showStep(i) {
          if (i === -1) { if (saved !== null) { setR(saved); saved = null; } }
          else if (i === 2 && Math.abs(S.r) >= 1) forceR(0.6);
          else if (i === 3 && Math.abs(S.r) < 1) forceR(1.2);
          if ((i === 2 || i === 3 || i === 4) && S.N < 8) setN(8);
          S.focus = i; glow(nl.canvas, i === 4); st.redraw();
        },
      };
    },

    idea: String.raw`Telescope: multiplying \(S_N\) by \((1-r)\) kills almost every term and leaves \(1-r^{N+1}\). Then everything depends on whether \(r^{N+1}\to0\).`,
    steps: [
      { fig: String.raw`Each blue dot is the partial sum \(S_N\) drawn at position \(N\). "The series converges" means exactly that the dots settle down to one value.`, t: String.raw`Name the partial sums.`, d: String.raw`Let \(S_N=\sum_{n=0}^{N} r^n=1+r+\dots+r^N\). By definition the series converges iff the sequence \((S_N)\) has a finite limit, and the sum is that limit.` },
      { fig: String.raw`The gold rings are the closed formula \(\frac{1-r^{N+1}}{1-r}\) (for \(r=1\): \(N+1\)); they sit exactly on the blue dots, which are the direct sums.`, t: String.raw`Telescope to get a closed form.`, d: String.raw`\((1-r)S_N=(1+r+\dots+r^N)-(r+r^2+\dots+r^{N+1})=1-r^{N+1}\). Hence for \(r\ne1\): \(\;S_N=\dfrac{1-r^{N+1}}{1-r}\). For \(r=1\): \(S_N=N+1\).` },
      { fig: String.raw`The gold dashed line is the limit \(\frac1{1-r}\); the red segments are the errors \(|S-S_N|=\frac{|r|^{N+1}}{|1-r|}\) and they shrink geometrically. (If \(|r|\ge1\), the figure sets \(r=0.6\) for this step.)`, t: String.raw`Case \(|r|\lt1\): compute the limit.`, d: String.raw`If \(|r|\lt1\) then \(r^{N+1}\to0\), so \(S_N\to\dfrac{1-0}{1-r}=\dfrac1{1-r}\). The error is \(|S-S_N|=\dfrac{|r|^{N+1}}{|1-r|}\).` },
      { fig: String.raw`The orange segments are the terms \(r^n\) added at each step (from \(S_{n-1}\) to \(S_n\)). For \(|r|\ge1\) they never shrink, so the dots cannot settle. (If \(|r|\lt1\), the figure sets \(r=1.2\) for this step.)`, t: String.raw`Case \(|r|\ge1\): divergence.`, d: String.raw`Here \(|r^n|\ge1\), so \(r^n\not\to0\). A convergent series must have terms tending to \(0\) (see the harmonic-series proof), so it diverges. Directly: \(r=1\): \(S_N=N+1\to\infty\); \(r=-1\): \(S_N\) alternates \(1,0,1,0,\dots\); \(|r|\gt1\): \(|S_N|\to\infty\).` },
      { fig: String.raw`Lower graph, highlighted: the sum as steps on a number line. Step \(n\) goes from \(S_{n-1}\) to \(S_n\) and has length \(r^n\); the steps shrink and pile up at the gold line \(\frac1{1-r}\).`, t: String.raw`Check the answer geometrically.`, d: String.raw`Walk along the number line: a step of length \(1\), then \(r\), then \(r^2,\dots\). For \(0\lt r\lt1\) every step is the fraction \(r\) of the previous one, so the total length is \(1+r+r^2+\dots=\frac1{1-r}\): the walk piles up at that point and never passes it.` },
    ],
    memorize: {
      formula: String.raw`\sum_{n=0}^{\infty} r^n=\frac1{1-r}\ \ (|r|\lt1),\qquad S_N=\frac{1-r^{N+1}}{1-r}`,
      bullets: [
        String.raw`Starting at index \(m\): \(\sum_{n=m}^{\infty} r^n=\dfrac{r^m}{1-r}\) ("first term over one minus the ratio").`,
        String.raw`The trick: \((1-r)S_N\) telescopes to \(1-r^{N+1}\).`,
        String.raw`Diverges for every \(|r|\ge1\) because the terms do not tend to \(0\).`,
        String.raw`Error after \(N+1\) terms: \(\dfrac{|r|^{N+1}}{|1-r|}\).`,
      ],
      pitfalls: [
        String.raw`Check the starting index: \(\sum_{n=1}^\infty r^n=\frac r{1-r}\), not \(\frac1{1-r}\).`,
        String.raw`\(r=-1\) does not "sum to \(\tfrac12\)": the partial sums \(1,0,1,0,\dots\) do not converge.`,
        String.raw`"\(r^{N+1}\to0\)" needs \(|r|\lt1\). Say it explicitly, and treat \(|r|\ge1\) separately.`,
      ],
    },
  });

  /* ================================================================== */
  /* 2 · Terms → 0 is necessary, not sufficient (harmonic series)       */
  /* ================================================================== */
  ML.register({
    id: "harmonic-diverges-nth-term",
    course: "infi2",
    topic: "series",
    title: "Terms tend to 0, and the harmonic series diverges",
    blurb: "(a) a convergent series has aₙ → 0; (b) the converse fails: Σ 1/n = ∞.",
    statement: String.raw`(a) If \(\sum a_n\) converges, then \(a_n\to0\). (b) The converse is false: \(\displaystyle\sum_{n=1}^{\infty}\frac1n=\infty\), although \(\frac1n\to0\).`,
    shows: String.raw`The statement itself: the bars are the terms \(a_n\) (top), and the dots are the partial sums \(S_N=a_1+\dots+a_N\) (bottom). Choose \(\sum 1/n\) (partial sums grow forever) or \(\sum1/n^2\) (partial sums settle).`,
    vizIntro: String.raw`<b>Slide \(N\) or press Play.</b> In both series the bars shrink to 0. Only for \(\sum1/n^2\) do the dots in the lower graph settle; for \(\sum1/n\) they keep climbing. The dashed rectangles show why.`,

    viz(box) {
      const NMAX = 64;
      const st = ML.stage(box, { x: [-3, NMAX + 2], y: [-0.14, 1.12], equal: false, aspect: "4 / 3" });
      const S = { kind: "h", N: 20, focus: -1 };
      let saved = null;
      const LQ = Math.PI * Math.PI / 6;
      const term = (kind, n) => (kind === "h" ? 1 / n : 1 / (n * n));
      const sums = { h: [0], q: [0] };
      for (let n = 1; n <= NMAX; n++) { sums.h[n] = sums.h[n - 1] + 1 / n; sums.q[n] = sums.q[n - 1] + 1 / (n * n); }

      const sel = ML.select(st.panel, { label: "Series", options: [["h", "Σ 1/n  (harmonic)"], ["q", "Σ 1/n²  (converges)"]], onChange: (x) => { S.kind = x; st.redraw(); } });
      const nSl = ML.slider(st.panel, { label: "\\(N\\) (terms shown)", min: 1, max: NMAX, step: 1, value: S.N, fmt: (x) => String(x), onInput: (x) => { S.N = x; st.redraw(); } });
      const setN = (n) => { S.N = n; nSl.set(n); };
      const setKind = (k) => { S.kind = k; sel.value = k; };
      player(st, { get: () => S.N, set: setN, min: 1, max: NMAX, speed: 6 });
      const sg = st.extra({ x: [-3, NMAX + 2], y: [-0.3, 5.4], height: 170 });
      const out = ML.readout(st.panel);

      st.draw((v) => {
        const N = S.N, h = S.kind === "h";
        frame(v);
        for (let n = 1; n <= NMAX; n++) {
          const t = term(S.kind, n), on = n <= N, k = n < 2 ? -1 : Math.floor(Math.log2(n - 1));
          const col = h ? (k < 0 ? C.text : LANE[k % LANE.length]) : C.blue;
          v.poly([[n - 1, 0], [n, 0], [n, t], [n - 1, t]], on ? rgba(col, 0.55) : "rgba(255,255,255,.04)", on ? col : "rgba(255,255,255,.12)", 1);
        }
        if (h) for (let k = 0; k <= 5; k++) {
          const a = Math.pow(2, k), b = 2 * a, done = b <= N;
          if (!done && S.focus !== 3) continue;
          const ht = 1 / b;
          v.poly([[a, 0], [b, 0], [b, ht], [a, ht]], null, C.gold, S.focus === 3 ? 3 : 1.5);
          v.text("area ½", (a + b) / 2, 1 / (a + 1) + 0.035, C.gold, 0, 0, FONT, "center");
        }
        if (S.focus === 2 || S.focus === 5) v.text(S.kind === "h" ? "terms 1/n → 0" : "terms → 0", NMAX, 0.17, C.white, 0, 0, BOLD, "right");
        v.text("height of bar n  =  term a_n  (area under the bars = partial sum)", -2.5, 1.12, C.text, 4, 14, BOLD);
        v.text("n", NMAX + 1.6, -0.14, C.dim, 0, -22, BOLD, "right");
      });

      sg.draw((g) => {
        const N = S.N, h = S.kind === "h", sm = sums[S.kind];
        g.o.y = h ? [-0.3, 5.4] : [-0.15, 2.1]; g.begin();
        frame(g);
        if (!h) { g.line(-3, LQ, NMAX + 2, LQ, C.gold, 2, [7, 5]); g.text("L = π²/6 ≈ 1.645", NMAX + 1.5, LQ, C.gold, 0, -7, BOLD, "right"); }
        if (h) {
          g.plot((x) => Math.log(x + 1), 1, NMAX, "rgba(255,255,255,.55)", 1.6, 100, [5, 4]);
          g.text("ln(N+1)", NMAX, Math.log(NMAX + 1), C.dim, -4, 14, FONT, "right");
          const strong = S.focus === 4 || S.focus === 5;
          for (let k = 0; k <= 5; k++) g.line(Math.pow(2, k), 1 + k / 2, Math.pow(2, k + 1), 1 + k / 2, C.green, strong ? 4 : 2);
          if (strong) g.text("lower bound 1 + k/2 for N ≥ 2^k", 2, 4.9, C.green, 0, 0, BOLD);
        }
        if (S.focus === 1) for (let n = 1; n <= N; n++) g.line(n, sm[n - 1], n, sm[n], C.red, 3.5);
        for (let n = 1; n <= N; n++) g.dot(n, sm[n], n === N ? C.white : C.blue, n === N ? 5 : 3.2);
        g.text("S_N = a_1 + … + a_N", -2.7, h ? 5.4 : 2.1, C.text, 4, 14, BOLD);
        if (S.focus === 1) g.text("red stem n = S_n − S_(n−1) = a_n", NMAX + 1, h ? 0.5 : 0.4, C.red, 0, 0, BOLD, "right");
      });

      st.after = () => {
        const N = S.N, h = S.kind === "h", sm = sums[S.kind], t = term(S.kind, N);
        const rows = [["N", String(N)], ["a_N", fmt(t, 5)], ["S_N", fmt(sm[N], 5)]];
        if (h) rows.push(["lower bound 1 + ⌊log₂N⌋/2", fmt(1 + Math.floor(Math.log2(N)) / 2, 3)], ["ln(N+1)", fmt(Math.log(N + 1), 4)]);
        else rows.push(["limit L = π²/6", fmt(LQ, 5)], ["S_N − S_(N−1)", fmt(N > 1 ? sm[N] - sm[N - 1] : sm[1], 5) + " = a_N"]);
        out(rows, h ? `<span class="no">a_n → 0, but S_N is unbounded (no limit).</span>` : `<span class="ok">Here S_N → L, and the terms a_n = S_n − S_(n−1) → 0.</span>`);
      };

      const force = (k, n) => { if (saved === null) saved = { kind: S.kind, N: S.N }; setKind(k); if (n && S.N < n) setN(n); };
      return {
        showStep(i) {
          if (i === -1) { if (saved) { setKind(saved.kind); setN(saved.N); saved = null; } }
          else if (i === 0 || i === 1) force("q", 24);
          else if (i === 2) force("h", 30);
          else force("h", 64);
          S.focus = i; st.redraw();
        },
      };
    },

    idea: String.raw`(a) The term is a difference of two partial sums that both tend to the same limit. (b) Group \(\frac1n\) into blocks of \(2^k\) terms, each block adds at least \(\frac12\), so the sum is unbounded.`,
    steps: [
      { fig: String.raw`The dots are the partial sums \(S_n\) of the convergent series \(\sum1/n^2\); they approach \(L=\pi^2/6\) (gold line). \(S_{n-1}\) is the same dots shifted by one place, so it has the same limit.`, t: String.raw`(a) Assume \(\sum a_n\) converges, say to \(L\).`, d: String.raw`Let \(S_n=a_1+\dots+a_n\). Convergence means \(S_n\to L\). Then also \(S_{n-1}\to L\) (it is the same sequence, shifted by one index).` },
      { fig: String.raw`Each red stem joins \(S_{n-1}\) to \(S_n\); its length is the term \(a_n\). Since both ends approach \(L\), the stems shrink to \(0\).`, t: String.raw`(a) The terms tend to \(0\).`, d: String.raw`\(a_n=S_n-S_{n-1}\to L-L=0\). Contrapositive: if \(a_n\not\to0\), then \(\sum a_n\) diverges.` },
      { fig: String.raw`Switched to \(\sum 1/n\): the bars (the terms \(\frac1n\)) shrink towards \(0\), but the partial sums in the lower graph keep climbing.`, t: String.raw`(b) The converse is false: take \(a_n=\frac1n\).`, d: String.raw`\(a_n=\frac1n\to0\), yet we show \(H_N=\sum_{n=1}^N\frac1n\to\infty\). Since \(H_N\) is increasing, it is enough to show that some subsequence is unbounded.` },
      { fig: String.raw`Each dashed gold rectangle spans one block \([2^k,2^{k+1}]\) and has height \(2^{-(k+1)}\), so its area is \(2^k\cdot2^{-(k+1)}=\frac12\). The bars of that block lie on or above it.`, t: String.raw`Group the terms in dyadic blocks.`, d: String.raw`For every \(k\ge0\): \(\displaystyle\sum_{n=2^k+1}^{2^{k+1}}\frac1n\ \ge\ 2^k\cdot\frac1{2^{k+1}}=\frac12\) (there are \(2^k\) terms, each at least \(\frac1{2^{k+1}}\)).` },
      { fig: String.raw`The green staircase is the lower bound \(1+\frac k2\), valid for \(N\ge2^k\). The partial sums \(H_N\) (dots) never go below it.`, t: String.raw`Add up the blocks.`, d: String.raw`\(H_{2^m}=1+\displaystyle\sum_{k=0}^{m-1}\ \sum_{n=2^k+1}^{2^{k+1}}\frac1n\ \ge\ 1+\frac m2.\)` },
      { fig: String.raw`Both facts at once: the bars shrink to \(0\) (top) while the partial sums outgrow every bound (bottom); the dashed curve \(\ln(N+1)\) is another lower bound.`, t: String.raw`Conclude.`, d: String.raw`\(1+\frac m2\to\infty\), so the subsequence \(H_{2^m}\) is unbounded. As \(H_N\) is increasing, \(H_N\to\infty\): the series diverges although \(\frac1n\to0\). Hence "\(a_n\to0\)" is necessary but not sufficient.` },
    ],
    memorize: {
      formula: String.raw`\sum a_n\ \text{converges}\ \Rightarrow\ a_n\to0\qquad\text{but}\qquad\sum_{n=1}^{\infty}\frac1n=\infty`,
      bullets: [
        String.raw`Test for divergence: if \(a_n\not\to0\), then \(\sum a_n\) diverges.`,
        String.raw`Proof of (a): \(a_n=S_n-S_{n-1}\to L-L=0\).`,
        String.raw`Harmonic series: \(H_{2^m}\ge1+\frac m2\) (in fact \(H_N\sim\ln N\)).`,
        String.raw`Grouping idea: block \(k\) has \(2^k\) terms, each at least \(2^{-(k+1)}\), so it adds at least \(\frac12\).`,
      ],
      pitfalls: [
        String.raw`The implication goes one way: \(a_n\to0\) does NOT imply convergence.`,
        String.raw`Count the terms in a block correctly: from \(2^k+1\) to \(2^{k+1}\) there are \(2^k\) of them.`,
        String.raw`State that \(H_N\) is increasing before deducing \(H_N\to\infty\) from an unbounded subsequence.`,
      ],
    },
  });

  /* ================================================================== */
  /* 3 · p-series and the integral test                                 */
  /* ================================================================== */
  ML.register({
    id: "p-series-integral-test",
    course: "infi2",
    topic: "series",
    title: "p-series and the integral test",
    blurb: "Σ 1/nᵖ converges exactly when p > 1: squeeze the sum between two integrals.",
    statement: String.raw`\(\displaystyle\sum_{n=1}^{\infty}\frac1{n^p}\) converges if and only if \(p\gt1\). More generally, if \(f\ge0\) is decreasing on \([1,\infty)\), then \(\sum f(n)\) and \(\int_1^\infty f\) converge or diverge together.`,
    shows: String.raw`The statement itself: the curve \(y=1/x^p\), the blue rectangles (left endpoints, total area \(S_N\)) lying over the curve and the pink rectangles (right endpoints, total area \(S_N-1\)) lying under it. Lower graph: \(S_N\) squeezed between two integrals.`,
    vizIntro: String.raw`<b>Change \(p\) and \(N\).</b> The blue area is the partial sum \(S_N\). It is always at least the area under the curve from 1 to \(N+1\), and at most \(1\) plus the area under the curve from 1 to \(N\).`,

    viz(box) {
      const NMAX = 24;
      const st = ML.stage(box, { x: [-1.5, NMAX + 2.5], y: [-0.12, 1.18], equal: false, aspect: "4 / 3" });
      const S = { p: 1.5, N: 10, focus: -1 };
      let saved = null;
      const one = () => Math.abs(S.p - 1) < 1e-9;
      const f = (x) => Math.pow(x, -S.p);
      const I = (a, b) => (one() ? Math.log(b / a) : (Math.pow(b, 1 - S.p) - Math.pow(a, 1 - S.p)) / (1 - S.p));
      const partial = (N) => { let s = 0; for (let n = 1; n <= N; n++) s += f(n); return s; };

      const pSl = ML.slider(st.panel, { label: "exponent \\(p\\)", min: 0.3, max: 3, step: 0.05, value: S.p, onInput: (x) => { S.p = x; st.redraw(); } });
      const nSl = ML.slider(st.panel, { label: "\\(N\\) (number of terms)", min: 1, max: NMAX, step: 1, value: S.N, fmt: (x) => String(x), onInput: (x) => { S.N = x; st.redraw(); } });
      const setP = (p) => { S.p = p; pSl.set(p); };
      const setN = (n) => { S.N = n; nSl.set(n); };
      btnRow(st, [["p = 1/2", () => { setP(0.5); st.redraw(); }], ["p = 1", () => { setP(1); st.redraw(); }], ["p = 2", () => { setP(2); st.redraw(); }]]);
      player(st, { get: () => S.N, set: setN, min: 1, max: NMAX, speed: 4 });
      const gx = st.extra({ x: [-1.5, NMAX + 2.5], y: [0, 6], height: 180 });
      const out = ML.readout(st.panel);

      st.draw((v) => {
        const N = S.N, k = Math.min(3, N), foc = S.focus;
        frame(v);
        for (let n = 1; n <= N; n++) {
          const dim = foc === 1 && n !== k, hot = foc === 1 && n === k;
          v.poly([[n, 0], [n + 1, 0], [n + 1, f(n)], [n, f(n)]], rgba(C.blue, dim ? 0.07 : 0.3), dim ? "rgba(108,140,255,.25)" : C.blue, hot ? 3.5 : 1);
        }
        for (let n = 2; n <= N; n++) {
          const dim = foc === 1 && n - 1 !== k, hot = foc === 1 && n - 1 === k;
          v.poly([[n - 1, 0], [n, 0], [n, f(n)], [n - 1, f(n)]], rgba(C.pink, dim ? 0.07 : 0.4), dim ? "rgba(255,107,139,.25)" : C.pink, hot ? 3.5 : 1);
        }
        v.plot(f, 1, NMAX + 2.4, C.white, 2.6, 160);
        v.text("y = 1/x^p", NMAX + 2.3, f(NMAX + 2.3), C.white, 0, -8, BOLD, "right");
        if (foc === 0 || foc === 1) {
          v.line(k, 0, k, f(k), C.gold, 1.5, [5, 4]); v.line(k + 1, 0, k + 1, f(k), C.gold, 1.5, [5, 4]);
          v.dot(k, f(k), C.gold, 5); v.dot(k + 1, f(k + 1), C.gold, 5);
          v.text("f(k)", k, f(k), C.gold, -6, -8, BOLD, "right"); v.text("f(k+1)", k + 1, f(k + 1), C.gold, 8, -8, BOLD);
        }
        if (foc === 1) v.text("pink ≤ area under curve on [k, k+1] ≤ blue", 2, 1.08, C.gold, 0, 0, BOLD);
        if (foc === 2) v.text("blue total = S_N ≥ area on [1, N+1];  pink total = S_N − 1 ≤ area on [1, N]", -1.2, 1.08, C.gold, 0, 0, BOLD);
        v.text("blue: left-endpoint rectangles    pink: right-endpoint rectangles", -1.3, 1.18, C.text, 4, 14, FONT);
        v.text("x", NMAX + 2.3, -0.12, C.dim, 0, -22, BOLD, "right");
      });

      gx.draw((g) => {
        const N = S.N, LB = (x) => I(1, x + 1), UB = (x) => 1 + I(1, x);
        const top = Math.min(14, Math.max(1.5, UB(NMAX), partial(NMAX)) * 1.08);
        g.o.y = [-top * 0.06, top]; g.begin(); frame(g);
        if (S.p > 1 + 1e-9) { const b = S.p / (S.p - 1); g.line(-1.5, b, NMAX + 2.5, b, C.gold, S.focus === 4 ? 3.5 : 1.8, [7, 5]); g.text("bound p/(p−1) = " + fmt(b, 3), NMAX + 2.2, b, C.gold, 0, -7, BOLD, "right"); }
        const hot = S.focus === 3;
        g.plot(UB, 1, NMAX, C.pink, hot ? 3.5 : 2, 80); g.plot(LB, 1, NMAX, C.blue, hot ? 3.5 : 2, 80);
        for (let n = 1; n <= N; n++) g.dot(n, partial(n), n === N ? C.white : "rgba(255,255,255,.8)", n === N ? 5 : 3);
        g.text("pink: 1 + ∫₁ᴺ x^(−p) dx    blue: ∫₁^(N+1) x^(−p) dx    dots: S_N", -1.3, top, C.text, 4, 14, FONT);
      });

      st.after = () => {
        const N = S.N, s = partial(N);
        const lb = I(1, N + 1), ub = 1 + I(1, N), ok = lb <= s + 1e-9 && s <= ub + 1e-9;
        const rows = [["p", fmt(S.p, 2)], ["N", String(N)], ["∫₁^(N+1) x^(−p) dx", fmt(lb, 5)], ["S_N", fmt(s, 5)], ["1 + ∫₁^N x^(−p) dx", fmt(ub, 5)],
          ["squeeze holds?", `<span class="${ok ? "ok" : "no"}">${fmt(lb, 3)} ≤ ${fmt(s, 3)} ≤ ${fmt(ub, 3)} ${ok ? "✓" : ""}</span>`]];
        out(rows, S.p > 1 + 1e-9 ? `<span class="ok">p &gt; 1: S_N ≤ p/(p−1) = ${fmt(S.p / (S.p - 1), 3)} for every N, so S_N is bounded and increasing: converges.</span>`
          : `<span class="no">p ≤ 1: S_N ≥ ∫₁^(N+1) x^(−p) dx → ∞, so the series diverges.</span>`);
      };

      const force = (p) => { if (saved === null) saved = S.p; setP(p); };
      return {
        showStep(i) {
          if (i === -1) { if (saved !== null) { setP(saved); saved = null; } }
          else if (i === 4 && S.p <= 1 + 1e-9) force(2);
          else if (i === 5 && S.p > 1 + 1e-9) force(1);
          if (S.N < 8) setN(10);
          S.focus = i; glow(gx.canvas, i === 3); st.redraw();
        },
      };
    },

    idea: String.raw`Because \(f\) is decreasing, each term \(f(n)\) is sandwiched between the areas under the curve on \([n-1,n]\) and \([n,n+1]\). Adding up squeezes the sum between two integrals, so the sum and the integral behave alike.`,
    steps: [
      { fig: String.raw`The white curve is \(f(x)=1/x^p\). On the unit interval \([k,k+1]\) it stays between \(f(k+1)\) (right end) and \(f(k)\) (left end), because \(f\) is decreasing.`, t: String.raw`Set up: \(f(x)=x^{-p}\) is positive and decreasing.`, d: String.raw`Let \(f(x)=x^{-p}\), \(a_n=f(n)\). For \(n\ge1\) and \(x\in[n,n+1]\): \(\;f(n+1)\le f(x)\le f(n)\).` },
      { fig: String.raw`Zoom on one interval \([k,k+1]\): the pink rectangle (height \(f(k+1)\)) fits under the curve and the blue one (height \(f(k)\)) contains the area under the curve.`, t: String.raw`Integrate over each unit interval.`, d: String.raw`Integrating over \([n,n+1]\) (length 1): \(\;f(n+1)\le\displaystyle\int_n^{n+1}f(x)\,dx\le f(n)\).` },
      { fig: String.raw`Blue rectangles together (area \(S_N\)) cover the area under the curve on \([1,N+1]\). Pink rectangles together (area \(S_N-1\)) fit under the curve on \([1,N]\). Lower graph: the dots \(S_N\) between the blue and pink curves.`, t: String.raw`Add the inequalities for \(n=1,\dots,N\).`, d: String.raw`Right inequality: \(\displaystyle\int_1^{N+1}f\le\sum_{n=1}^{N}f(n)=S_N\). Left inequality (for \(n=2,\dots,N\)): \(S_N-f(1)\le\displaystyle\int_1^{N}f\). So \(\displaystyle\int_1^{N+1}f\ \le\ S_N\ \le\ 1+\int_1^{N}f.\)` },
      { fig: String.raw`The two bound curves in the lower graph are exactly these closed forms (highlighted): blue \(\int_1^{N+1}x^{-p}dx\), pink \(1+\int_1^{N}x^{-p}dx\).`, t: String.raw`Compute the integrals.`, d: String.raw`For \(b\gt1\): \(\displaystyle\int_1^b x^{-p}dx=\frac{b^{1-p}-1}{1-p}\) if \(p\ne1\), and \(=\ln b\) if \(p=1\).` },
      { fig: String.raw`Case \(p\gt1\): the gold dashed line is the bound \(1+\frac1{p-1}=\frac p{p-1}\); the dots \(S_N\) stay below it. (If \(p\le1\), the figure sets \(p=2\) for this step.)`, t: String.raw`Case \(p\gt1\): bounded, hence convergent.`, d: String.raw`Here \(b^{1-p}\le1\), so \(\int_1^N x^{-p}dx\le\frac1{p-1}\) and \(S_N\le1+\frac1{p-1}=\frac p{p-1}\). \((S_N)\) is increasing and bounded above, hence convergent (monotone convergence).` },
      { fig: String.raw`Case \(p\le1\): the blue curve \(\int_1^{N+1}x^{-p}dx\) grows without bound and drags the dots \(S_N\) up with it. (If \(p\gt1\), the figure sets \(p=1\) for this step.)`, t: String.raw`Case \(p\le1\): unbounded, hence divergent.`, d: String.raw`\(S_N\ge\displaystyle\int_1^{N+1}x^{-p}dx\), which equals \(\ln(N+1)\to\infty\) for \(p=1\) and \(\frac{(N+1)^{1-p}-1}{1-p}\to\infty\) for \(p\lt1\). So \(S_N\to\infty\) and the series diverges.` },
    ],
    memorize: {
      formula: String.raw`\int_1^{N+1}\!\frac{dx}{x^p}\ \le\ \sum_{n=1}^{N}\frac1{n^p}\ \le\ 1+\int_1^{N}\!\frac{dx}{x^p},\qquad \sum\frac1{n^p}\ \text{converges}\iff p\gt1`,
      bullets: [
        String.raw`Integral test: \(f\ge0\) decreasing \(\Rightarrow\) \(\sum f(n)\) and \(\int_1^\infty f\) converge or diverge together.`,
        String.raw`For \(p\gt1\): \(\sum_{n\ge1} n^{-p}\le\dfrac p{p-1}\).`,
        String.raw`\(p=1\) (harmonic) is the borderline and diverges like \(\ln N\).`,
        String.raw`Picture: left-endpoint rectangles over the curve, right-endpoint rectangles under it.`,
      ],
      pitfalls: [
        String.raw`The test needs \(f\) positive AND decreasing (at least eventually); check and say so.`,
        String.raw`It decides convergence only. The integral is NOT the value of the sum.`,
        String.raw`Mind the bounds: the lower bound runs to \(N+1\), the upper one adds the first term \(f(1)\) and stops at \(N\).`,
      ],
    },
  });

  /* ================================================================== */
  /* 4 · Ratio test                                                     */
  /* ================================================================== */
  const NM = 30, lf = [0];
  for (let n = 1; n <= NM + 1; n++) lf[n] = lf[n - 1] + Math.log(n);
  const RDEFS = [
    { name: "2ⁿ/n!", la: (n) => n * Math.LN2 - lf[n], L: 0, Ls: "0" },
    { name: "n/2ⁿ", la: (n) => Math.log(n) - n * Math.LN2, L: 0.5, Ls: "1/2" },
    { name: "n!/nⁿ", la: (n) => lf[n] - n * Math.log(n), L: 1 / Math.E, Ls: "1/e ≈ 0.368" },
    { name: "3ⁿ/n²", la: (n) => n * Math.log(3) - 2 * Math.log(n), L: 3, Ls: "3" },
    { name: "1/n", la: (n) => -Math.log(n), L: 1, Ls: "1" },
    { name: "1/n²", la: (n) => -2 * Math.log(n), L: 1, Ls: "1" },
  ];
  RDEFS.forEach((d) => {
    d.loga = [NaN]; d.ratio = [NaN];
    for (let n = 1; n <= NM; n++) d.loga[n] = d.la(n);
    for (let n = 1; n < NM; n++) d.ratio[n] = Math.exp(d.loga[n + 1] - d.loga[n]);
  });

  ML.register({
    id: "ratio-test",
    course: "infi2",
    topic: "series",
    title: "The ratio test",
    blurb: "If |aₙ₊₁/aₙ| → L: L < 1 converges absolutely, L > 1 diverges. Proof: compare with a geometric series.",
    statement: String.raw`Let \(a_n\ne0\) and suppose \(L=\displaystyle\lim_{n\to\infty}\left|\frac{a_{n+1}}{a_n}\right|\) exists in \([0,\infty]\). If \(L\lt1\), then \(\sum a_n\) converges absolutely. If \(L\gt1\), then \(\sum a_n\) diverges. If \(L=1\), the test is inconclusive.`,
    shows: String.raw`The statement itself, for the series you pick: top graph, the terms \(|a_n|\) with the geometric comparison line \(|a_N|r^{n-N}\); bottom graph, the ratios \(|a_{n+1}/a_n|\) with their limit \(L\), the number \(1\) and your chosen \(r\).`,
    vizIntro: String.raw`<b>Pick a series</b> and move \(r\). When \(L\lt1\) choose \(r\) strictly between \(L\) and \(1\): from some index \(N\) on every ratio is below \(r\), and the terms hide under a geometric series. (Terms are shown on a log scale so geometric growth is a straight line.)`,

    viz(box) {
      const st = ML.stage(box, { x: [-1, NM + 1.5], y: [-8, 2], equal: false, aspect: "4 / 3" });
      const S = { i: 1, r: 0.75, log: true, focus: -1 };
      let saved = null;
      const D = () => RDEFS[S.i];
      const defaultR = (d) => (d.L === 1 ? 1 : (1 + d.L) / 2);
      const sel = ML.select(st.panel, { label: "Series  \\(a_n\\)", options: RDEFS.map((d, i) => [i, d.name]), onChange: (x) => setSeries(+x) });
      sel.value = String(S.i);
      const rSl = ML.slider(st.panel, { label: "your \\(r\\)", min: 0.02, max: 3, step: 0.01, value: S.r, onInput: (x) => { S.r = x; st.redraw(); } });
      const logBtn = ML.button(st.panel, "Scale: log₁₀ (click for linear)", () => { S.log = !S.log; logBtn.textContent = S.log ? "Scale: log₁₀ (click for linear)" : "Scale: linear (click for log₁₀)"; st.redraw(); });
      const rg = st.extra({ x: [-1, NM + 1.5], y: [0, 3.5], height: 170 });
      const out = ML.readout(st.panel);

      function setSeries(i) { S.i = i; sel.value = String(i); S.r = defaultR(RDEFS[i]); rSl.set(S.r); st.redraw(); }
      const valid = (d, r) => (d.L < 1 ? r > d.L && r < 1 : d.L > 1 && r > 1 && r < d.L);
      function startIndex(d, r) {
        if (d.L === 1 || !valid(d, r)) return null;
        let n0 = null;
        for (let n = NM - 1; n >= 1; n--) { const ok = d.L < 1 ? d.ratio[n] <= r : d.ratio[n] >= r; if (ok) n0 = n; else break; }
        return n0;
      }
      const yv = (d, n) => (S.log ? d.loga[n] / Math.LN10 : Math.exp(d.loga[n]));
      const yTerm = (d, n0, r, n) => { const la = d.loga[n0] + (n - n0) * Math.log(r); return S.log ? la / Math.LN10 : Math.exp(la); };

      st.draw((v) => {
        const d = D(), n0 = startIndex(d, S.r), foc = S.focus;
        const ys = []; for (let n = 1; n <= NM; n++) ys.push(yv(d, n));
        if (n0 !== null) ys.push(yTerm(d, n0, S.r, NM));
        let lo = Math.min(...ys), hi = Math.max(...ys);
        if (!S.log) lo = 0;
        const pad = (hi - lo) * 0.12 + 0.2;
        v.o.y = [lo - pad, hi + pad]; v.begin();
        frame(v, { yfmt: (y) => (S.log ? "1e" + fmt(y, 1) : fmt(y, 3)) });
        for (let n = 1; n < NM; n++) v.line(n, yv(d, n), n + 1, yv(d, n + 1), "rgba(108,140,255,.4)", 1.5);
        const showMaj = n0 !== null && (foc === -1 || foc >= 2);
        if (n0 !== null && (foc === -1 || foc >= 1)) { v.line(n0, lo - pad, n0, hi + pad, C.gold, 1.5, [6, 5]); v.text("N = " + n0, n0, lo - pad, C.gold, 5, -28, BOLD); }
        if (showMaj) {
          const col = d.L < 1 ? C.green : C.red, w = foc === 3 || foc === 4 ? 4 : 2.6;
          v.path((x) => [x, yTerm(d, n0, S.r, x)], n0, NM, col, w, 60);
          v.text(d.L < 1 ? "majorant |a_N|·r^(n−N)" : "minorant |a_N|·r^(n−N) → ∞", d.L < 1 ? Math.max(n0 + 0.6, NM * 0.45) : n0 + 0.6, yTerm(d, n0, S.r, d.L < 1 ? Math.max(n0 + 0.6, NM * 0.45) : n0 + 0.6), col, 0, d.L < 1 ? -12 : 20, BOLD);
        }
        for (let n = 1; n <= NM; n++) v.dot(n, yv(d, n), C.blue, 4);
        if (foc === 3 && n0 !== null && d.L < 1) v.text(`tail Σ_(n≥N) a_n ≤ a_N/(1−r) = ${fmt(Math.exp(d.loga[n0]) / (1 - S.r), 4)}`, 1, lo - pad, C.green, 0, -26, BOLD);
        if (d.L === 1) v.text("L = 1: the test says nothing", NM / 2, (hi + lo) / 2, C.gold, 0, 0, "700 14px system-ui", "center");
        v.text(`terms |a_n| = ${d.name}${S.log ? "  (log₁₀ scale)" : ""}`, -0.8, hi + pad, C.text, 4, 14, BOLD);
        v.text("n", NM + 1.3, lo - pad, C.dim, 0, -22, BOLD, "right");
      });

      rg.draw((g) => {
        const d = D(), n0 = startIndex(d, S.r), foc = S.focus;
        let mx = 1.5; for (let n = 1; n < NM; n++) mx = Math.max(mx, d.ratio[n] * 1.12);
        mx = Math.min(3.6, Math.max(mx, S.r * 1.15)); g.o.y = [-mx * 0.07, mx]; g.begin(); frame(g);
        g.line(-1, 1, NM + 1.5, 1, C.white, 1.5, [4, 4]); g.text("1", NM + 1.3, 1, C.white, 0, -5, BOLD, "right");
        if (Number.isFinite(d.L) && d.L <= mx) { g.line(-1, d.L, NM + 1.5, d.L, C.gold, 2, [7, 5]); g.text("L = " + d.Ls, NM * 0.5, d.L, C.gold, 0, -6, BOLD, "center"); }
        if (d.L !== 1) g.line(-1, S.r, NM + 1.5, S.r, valid(d, S.r) ? C.green : C.red, foc === 0 ? 3.5 : 2);
        if (d.L !== 1) g.text("r = " + fmt(S.r, 2), NM + 1.3, S.r, valid(d, S.r) ? C.green : C.red, 0, -6, BOLD, "right");
        if (foc === 1 && n0 !== null) { const a = g.P(n0, mx), b = g.P(NM + 1.5, 0); g.ctx.fillStyle = "rgba(79,209,165,.13)"; g.ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); g.text("n ≥ N: ratio on the right side of r", NM, mx * 0.92, C.green, 0, 0, BOLD, "right"); }
        for (let n = 1; n < NM; n++) g.dot(n, d.ratio[n], C.blue, 3.6);
        g.text("ratios |a_(n+1)/a_n|", -0.8, mx, C.text, 4, 14, BOLD);
      });

      st.after = () => {
        const d = D(), n0 = startIndex(d, S.r), okR = valid(d, S.r);
        const rows = [["series", d.name], ["L = lim |a_(n+1)/a_n|", d.Ls], ["your r", fmt(S.r, 2) + (d.L === 1 ? " (not needed)" : okR ? " ✓" : "  ✗")]];
        rows.push(["index N", n0 !== null ? String(n0) : "—"]);
        if (n0 !== null && d.L < 1) rows.push(["tail bound a_N/(1−r)", fmt(Math.exp(d.loga[n0]) / (1 - S.r), 4)]);
        let note;
        if (d.L < 1) note = okR ? `<span class="ok">L &lt; 1: choose L &lt; r &lt; 1 (here r = ${fmt(S.r, 2)}). From N on, |a_n| ≤ |a_N| r^(n−N): converges absolutely.</span>` : `<span class="warn">Choose r strictly between L = ${d.Ls} and 1.</span>`;
        else if (d.L > 1) note = okR ? `<span class="no">L &gt; 1: choose 1 &lt; r &lt; L. From N on, |a_n| ≥ |a_N| r^(n−N) → ∞: diverges.</span>` : `<span class="warn">Choose r strictly between 1 and L = ${d.Ls}.</span>`;
        else note = `<span class="warn">L = 1: no r works. Both Σ1/n (diverges) and Σ1/n² (converges) have L = 1.</span>`;
        out(rows, note);
      };

      const useSeries = (i) => { if (saved === null) saved = S.i; setSeries(i); };
      setSeries(1);
      return {
        showStep(i) {
          if (i === -1) { if (saved !== null) { setSeries(saved); saved = null; } }
          else if (i >= 0 && i <= 3 && D().L >= 1) useSeries(1);
          else if (i === 4) useSeries(3);
          else if (i === 5) useSeries(4);
          S.focus = i; glow(rg.canvas, i === 0 || i === 1); st.redraw();
        },
      };
    },

    idea: String.raw`If the ratios settle below a number \(r\lt1\), then from some index on each term is at most \(r\) times the previous one, so the terms are dominated by a convergent geometric series.`,
    steps: [
      { fig: String.raw`Lower graph: the ratios \(|a_{n+1}/a_n|\) (blue dots) tend to \(L\) (gold). The green line \(r\) lies strictly between \(L\) and \(1\); use the slider to choose it.`, t: String.raw`Case \(L\lt1\): choose a number \(r\) with \(L\lt r\lt1\).`, d: String.raw`For example \(r=\frac{1+L}{2}\). The gap \(r-L\gt0\) is what allows the next step.` },
      { fig: String.raw`The vertical dashed line marks the index \(N\): from there on, every ratio dot lies below the green line \(r\) (shaded region).`, t: String.raw`Use the definition of the limit.`, d: String.raw`Since \(\left|\frac{a_{n+1}}{a_n}\right|\to L\lt r\): there is \(N\) such that \(\left|\frac{a_{n+1}}{a_n}\right|\le r\) for all \(n\ge N\).` },
      { fig: String.raw`Top graph: from \(N\) on, the terms \(|a_n|\) (blue dots) lie on or below the green line \(|a_N|r^{n-N}\), a geometric sequence (a straight line on the log scale).`, t: String.raw`Bound the terms by a geometric sequence.`, d: String.raw`For \(n\ge N\) we get \(|a_{n+1}|\le r|a_n|\), so by induction \(|a_n|\le|a_N|\,r^{\,n-N}\) for all \(n\ge N\).` },
      { fig: String.raw`The green line is a convergent geometric series with ratio \(r\lt1\). Its tail sum \(\frac{|a_N|}{1-r}\) (shown on the graph) bounds the tail of \(\sum|a_n|\).`, t: String.raw`Compare with the geometric series.`, d: String.raw`\(\sum_{n\ge N}|a_N|r^{n-N}=\dfrac{|a_N|}{1-r}\) converges because \(r\lt1\). By the comparison test \(\sum|a_n|\) converges, i.e. \(\sum a_n\) converges absolutely (and hence converges).` },
      { fig: String.raw`Switched to \(3^n/n^2\) with \(L=3\): the ratios stay above \(r=2\gt1\) from index \(N\) on, and the terms grow at least like the red geometric line \(|a_N|r^{n-N}\to\infty\).`, t: String.raw`Case \(L\gt1\): the terms blow up.`, d: String.raw`Choose \(1\lt r\lt L\) (any \(r\gt1\) if \(L=\infty\)). Then \(\left|\frac{a_{n+1}}{a_n}\right|\ge r\) for \(n\ge N\), so \(|a_n|\ge|a_N|r^{n-N}\to\infty\). Hence \(a_n\not\to0\) and \(\sum a_n\) diverges.` },
      { fig: String.raw`Switched to \(\sum1/n\) (try \(\sum1/n^2\) in the selector): the ratios creep up to \(L=1\) but never stay below a fixed \(r\lt1\), so no majorant exists. Both series have \(L=1\), yet one diverges and the other converges.`, t: String.raw`Case \(L=1\): no conclusion.`, d: String.raw`\(a_n=\frac1n\) (divergent) and \(a_n=\frac1{n^2}\) (convergent) both have \(\left|\frac{a_{n+1}}{a_n}\right|\to1\): the ratios \(\frac n{n+1}\) and \(\frac{n^2}{(n+1)^2}\) tend to \(1\). So the test cannot decide.` },
    ],
    memorize: {
      formula: String.raw`L=\lim\left|\frac{a_{n+1}}{a_n}\right|:\quad L\lt1\Rightarrow\text{converges (abs.)},\quad L\gt1\Rightarrow\text{diverges},\quad L=1\Rightarrow\text{no information}`,
      bullets: [
        String.raw`Proof idea: pick \(r\) with \(L\lt r\lt1\), then \(|a_n|\le|a_N|r^{n-N}\) for \(n\ge N\): compare with a geometric series.`,
        String.raw`Best for factorials and exponentials: \(\frac{2^n}{n!}\), \(\frac{n!}{n^n}\), \(\frac{n}{2^n}\).`,
        String.raw`If the limit does not exist, use \(\limsup\left|\frac{a_{n+1}}{a_n}\right|\lt1\) (converges) and \(\liminf\gt1\) (diverges).`,
        String.raw`\(L\gt1\) gives divergence because \(a_n\not\to0\).`,
      ],
      pitfalls: [
        String.raw`Having every ratio \(\lt1\) is NOT enough: for \(a_n=\frac1n\) all ratios are \(\lt1\) but the series diverges. You need \(L\lt1\) (a fixed \(r\lt1\)).`,
        String.raw`\(L=1\) means "try another test" (integral test, comparison, Leibniz...).`,
        String.raw`Take absolute values: the test uses \(\left|\frac{a_{n+1}}{a_n}\right|\) and gives absolute convergence.`,
      ],
    },
  });

  /* ================================================================== */
  /* 5 · Leibniz alternating series test                                */
  /* ================================================================== */
  const LN = 60;
  const LSER = [
    { name: "Σ (−1)^(n+1) / n    (→ ln 2)", a: (n) => 1 / n, lim: Math.LN2, mono: true, zero: true },
    { name: "Σ (−1)^(n+1) / √n", a: (n) => 1 / Math.sqrt(n), lim: null, mono: true, zero: true },
    { name: "Σ (−1)^(n+1) (1 + 1/n)    (aₙ → 1)", a: (n) => 1 + 1 / n, lim: undefined, mono: true, zero: false },
    { name: "a₂ₖ₋₁ = 1/k, a₂ₖ = 1/k²    (not monotone)", a: (n) => (n % 2 ? 1 / ((n + 1) / 2) : 1 / Math.pow(n / 2, 2)), lim: undefined, mono: false, zero: true },
  ];
  (function prep() {
    // reference value for Σ(−1)^(n+1)/√n: average of two consecutive partial sums far out (error ≈ 1e-8)
    let s = 0, prev = 0; for (let n = 1; n <= 200000; n++) { prev = s; s += (n % 2 ? 1 : -1) / Math.sqrt(n); }
    LSER[1].lim = (s + prev) / 2;
    LSER.forEach((d) => {
      d.S = [0]; for (let n = 1; n <= LN; n++) d.S[n] = d.S[n - 1] + (n % 2 ? 1 : -1) * d.a(n);
      if (d.lim === undefined) d.lim = null;
    });
  })();

  ML.register({
    id: "leibniz-alternating",
    course: "infi2",
    topic: "series",
    title: "Leibniz test for alternating series",
    blurb: "If aₙ decreases to 0, then Σ(−1)ⁿ⁺¹aₙ converges and the error is at most the first omitted term.",
    statement: String.raw`Let \((a_n)\) be decreasing with \(a_n\to0\). Then \(\displaystyle\sum_{n=1}^{\infty}(-1)^{n+1}a_n\) converges, and its sum \(S\) satisfies \(|S-S_n|\le a_{n+1}\) for all \(n\), where \(S_n\) is the \(n\)-th partial sum.`,
    shows: String.raw`The statement itself: the partial sums \(S_n\) (dots, joined by a zig-zag) for the series you choose, the limit \(S\) (gold) when it exists, and below, the true error \(|S-S_n|\) against the bound \(a_{n+1}\).`,
    vizIntro: String.raw`<b>Slide \(N\) or press Play.</b> The sums zig-zag up and down with shrinking steps. Green dots (even \(n\)) rise, pink dots (odd \(n\)) fall, and the limit is always trapped in between. Then try the two counterexamples in the selector.`,

    viz(box) {
      const st = ML.stage(box, { x: [-1.5, LN + 1.5], y: [-1, 2], equal: false, aspect: "4 / 3" });
      const S = { i: 0, N: 14, focus: -1 };
      let saved = null;
      const D = () => LSER[S.i];
      const sel = ML.select(st.panel, { label: "Series", options: LSER.map((d, i) => [i, d.name]), onChange: (x) => { S.i = +x; st.redraw(); } });
      const nSl = ML.slider(st.panel, { label: "\\(N\\) (partial sums shown)", min: 1, max: LN, step: 1, value: S.N, fmt: (x) => String(x), onInput: (x) => { S.N = x; st.redraw(); } });
      const setN = (n) => { S.N = n; nSl.set(n); };
      player(st, { get: () => S.N, set: setN, min: 1, max: LN, speed: 5 });
      const eg = st.extra({ x: [-1.5, LN + 1.5], y: [0, 1.1], height: 160 });
      const out = ML.readout(st.panel);

      st.draw((v) => {
        const d = D(), N = S.N, foc = S.focus, Sn = d.S;
        const all = Sn.slice(0, LN + 1).concat(d.lim !== null ? [d.lim] : []);
        const lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.14 + 0.05, X1 = Math.max(16, N + 5);
        v.o.x = [-1.5, X1]; v.o.y = [lo - pad, hi + pad]; v.begin(); frame(v);
        if (d.lim !== null) { v.line(-1.5, d.lim, X1, d.lim, C.gold, 2, [7, 5]); v.text("S = " + fmt(d.lim, 4), X1 - 0.2, d.lim, C.gold, 0, -7, BOLD, "right"); }
        if (foc === 2) for (let k = 0; 2 * k + 1 <= N; k++) {
          v.poly([[2 * k, Sn[2 * k]], [2 * k + 1, Sn[2 * k]], [2 * k + 1, Sn[2 * k + 1]], [2 * k, Sn[2 * k + 1]]], "rgba(255,204,77,.28)", C.gold, 1.5);
        }
        for (let n = 1; n <= N; n++) v.line(n - 1, Sn[n - 1], n, Sn[n], "rgba(255,255,255,.28)", 1.4);
        if (foc === 1 || foc === 3) {
          for (let n = 2; n <= N; n++) if (n % 2 === 0 && n >= 4) v.line(n - 2, Sn[n - 2], n, Sn[n], C.green, 3);
          for (let n = 3; n <= N; n++) if (n % 2 === 1) v.line(n - 2, Sn[n - 2], n, Sn[n], C.pink, 3);
        }
        for (let n = 0; n <= N; n++) v.dot(n, Sn[n], n === N ? C.white : n % 2 === 0 ? C.green : C.pink, n === N ? 6 : 4.5);
        if (foc === 4 && N + 1 <= LN) {
          const a = Sn[N], b = Sn[N + 1];
          v.line(N + 0.35, a, N + 0.35, b, C.red, 4);
          v.dot(N + 1, b, "rgba(0,0,0,0)", 6, C.red);
          v.text("a_(N+1)", N + 0.35, (a + b) / 2, C.red, 12, 4, BOLD);
          v.text("S lies between S_N and S_(N+1)", X1 - 0.2, hi + pad, C.red, 0, 14, BOLD, "right");
        }
        if (d.lim === null) v.text("no limit: the sums do not settle", (X1 - 1.5) / 2, hi + pad, C.gold, 0, 14, BOLD, "center");
        v.text("S_n = a_1 − a_2 + a_3 − … ± a_n     green: even n    pink: odd n", -1.3, lo - pad, C.text, 4, -24, FONT);
        v.text("n", X1 - 0.2, lo - pad, C.dim, 0, -8, BOLD, "right");
      });

      eg.draw((g) => {
        const d = D(), N = S.N;
        const X1 = Math.max(16, N + 5);
        g.o.x = [-1.5, X1]; g.o.y = [-0.05, 1.1]; g.begin(); frame(g);
        if (d.lim === null) { g.text("no limit S exists, so there is no error to measure", (X1 - 1.5) / 2, 0.5, C.gold, 0, 0, BOLD, "center"); return; }
        for (let n = 1; n < LN - 1; n++) g.line(n, d.a(n + 1), n + 1, d.a(n + 2), C.pink, 2);
        for (let n = 1; n <= N && n < LN; n++) g.dot(n, Math.abs(d.lim - d.S[n]), n === N ? C.white : C.blue, n === N ? 5 : 3.2);
        g.text("pink curve: bound a_(n+1)     dots: true error |S − S_n|", -1.3, 1.1, C.text, 4, 14, FONT);
      });

      st.after = () => {
        const d = D(), N = S.N, rows = [["N", String(N)], ["S_N", fmt(d.S[N], 5)], ["a_(N+1)", fmt(d.a(N + 1), 5)]];
        if (d.lim !== null) rows.push(["limit S", fmt(d.lim, 5)], ["|S − S_N|", fmt(Math.abs(d.lim - d.S[N]), 6)], ["bound a_(N+1)", fmt(d.a(N + 1), 6)]);
        rows.push(["a_n decreasing?", `<span class="${d.mono ? "ok" : "no"}">${d.mono ? "yes" : "no"}</span>`], ["a_n → 0 ?", `<span class="${d.zero ? "ok" : "no"}">${d.zero ? "yes" : "no (→ 1)"}</span>`]);
        out(rows, d.mono && d.zero ? `<span class="ok">Both hypotheses hold: the series converges and |S − S_N| ≤ a_(N+1).</span>` : `<span class="no">A hypothesis fails here, and the series does not converge.</span>`);
      };

      return {
        showStep(i) {
          if (i === -1) { if (saved) { S.i = saved.i; sel.value = String(S.i); setN(saved.N); saved = null; } }
          else if (i === 5) { if (!saved) saved = { i: S.i, N: S.N }; S.i = 3; sel.value = "3"; setN(60); }
          else {
            if (saved) { S.i = saved.i; sel.value = String(S.i); saved = null; }
            if (D().lim === null) { S.i = 0; sel.value = "0"; }
            if (i === 2 && S.N > 24) setN(16);
          }
          S.focus = i; glow(eg.canvas, i === 4); st.redraw();
        },
      };
    },

    idea: String.raw`The even partial sums rise, the odd ones fall, and each odd one is above its even neighbour. So they trap each other in nested intervals whose length \(a_{2k+1}\to0\), and both chains meet at a single number.`,
    steps: [
      { fig: String.raw`Blue/green/pink dots are the partial sums \(S_n\) of the selected series, joined by a zig-zag: odd steps go up by \(a_n\), even steps go down by \(a_n\), and the steps get smaller.`, t: String.raw`Set up the partial sums.`, d: String.raw`Let \(a_n\ge0\) be decreasing with \(a_n\to0\), and \(S_n=\sum_{j=1}^{n}(-1)^{j+1}a_j=a_1-a_2+a_3-\dots\pm a_n\), with \(S_0=0\).` },
      { fig: String.raw`Green dots (even \(n\)) climb; pink dots (odd \(n\)) descend. The two chains are drawn as thick lines.`, t: String.raw`Even partial sums increase, odd ones decrease.`, d: String.raw`\(S_{2k+2}-S_{2k}=a_{2k+1}-a_{2k+2}\ge0\) and \(S_{2k+3}-S_{2k+1}=-(a_{2k+2}-a_{2k+3})\le0\), because \((a_n)\) is decreasing.` },
      { fig: String.raw`Each gold bar is an interval \(I_k=[S_{2k},S_{2k+1}]\). Every bar sits inside the previous one and the bars get thinner: the length of \(I_k\) is \(a_{2k+1}\to0\).`, t: String.raw`The chains trap each other in nested intervals.`, d: String.raw`\(S_{2k+1}-S_{2k}=a_{2k+1}\ge0\), so \(S_{2k}\le S_{2k+1}\). With the previous step: \(I_k=[S_{2k},S_{2k+1}]\) satisfy \(I_{k+1}\subseteq I_k\) and have length \(a_{2k+1}\to0\).` },
      { fig: String.raw`Both thick chains squeeze towards the gold dashed line \(S\); the vertical gap between them is exactly the bar length \(a_{2k+1}\), which tends to \(0\).`, t: String.raw`Both chains converge to the same limit.`, d: String.raw`\((S_{2k})\) is increasing and bounded above by \(S_1\), so \(S_{2k}\to\alpha\). Then \(S_{2k+1}=S_{2k}+a_{2k+1}\to\alpha+0=\alpha\). Even and odd subsequences share the limit \(\alpha\), hence \(S_n\to\alpha=:S\).` },
      { fig: String.raw`At the chosen \(N\) the red bracket from \(S_N\) to \(S_{N+1}\) has length \(a_{N+1}\) and contains the limit \(S\). Lower graph (highlighted): the true error \(|S-S_n|\) (dots) stays under the bound \(a_{n+1}\) (pink curve).`, t: String.raw`Estimate the error.`, d: String.raw`For even \(n=2k\): \(S\in I_k=[S_{2k},S_{2k+1}]\). For odd \(n=2k+1\): \(S\in[S_{2k+2},S_{2k+1}]\). So \(S\) always lies between \(S_n\) and \(S_{n+1}\), hence \(|S-S_n|\le|S_{n+1}-S_n|=a_{n+1}\).` },
      { fig: String.raw`Switched to a counterexample (\(a_{2k-1}=\frac1k\), \(a_{2k}=\frac1{k^2}\): \(a_n\to0\) but not monotone). No gold line appears: the sums keep drifting upwards. Try the series with \(a_n\to1\) in the selector too.`, t: String.raw`Neither hypothesis can be dropped.`, d: String.raw`(i) \(a_n=1+\frac1n\) decreases but \(a_n\to1\ne0\): the terms do not tend to \(0\) and the sums oscillate. (ii) \(a_{2k-1}=\frac1k,\ a_{2k}=\frac1{k^2}\to0\) is not monotone, and \(S_{2k}=\sum_{j\le k}\bigl(\frac1j-\frac1{j^2}\bigr)\to\infty\).` },
    ],
    memorize: {
      formula: String.raw`a_n\downarrow0\ \Rightarrow\ \sum(-1)^{n+1}a_n\ \text{converges},\qquad |S-S_n|\le a_{n+1}`,
      bullets: [
        String.raw`Proof picture: \(S_{2k}\uparrow\), \(S_{2k+1}\downarrow\), nested intervals of length \(a_{2k+1}\to0\).`,
        String.raw`The sum lies between any two consecutive partial sums; the error is at most the first omitted term.`,
        String.raw`Example: \(\sum\frac{(-1)^{n+1}}n=\ln2\) converges, although \(\sum\frac1n\) diverges: conditional convergence.`,
        String.raw`Both hypotheses are needed: \(a_n\to0\) AND \(a_n\) decreasing (at least eventually).`,
      ],
      pitfalls: [
        String.raw`Leibniz gives convergence only. It does not give absolute convergence (check \(\sum a_n\) separately).`,
        String.raw`\(a_n\to0\) alone is not enough: the example \(a_{2k-1}=\frac1k,\ a_{2k}=\frac1{k^2}\) diverges.`,
        String.raw`The error bound uses \(a_{n+1}\), the FIRST omitted term, not \(a_n\).`,
      ],
    },
  });
})(window.ML);
