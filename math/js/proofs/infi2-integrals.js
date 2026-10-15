"use strict";
/* Infinitesimal Calculus 2 · Integrals (single variable). */
(function (ML) {
  const C = ML.C;
  const PAL = [C.pink, C.green, C.blue, C.gold, C.purple, C.orange, C.cyan];
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  /* ---------- local drawing helpers (non-equal axes) ---------- */
  function grid2(v, sx, sy) {
    const [[xa, ya], [xb, yb]] = v.visible();
    for (let x = Math.ceil(xa / sx - 1e-9) * sx; x <= xb + 1e-9; x += sx) v.line(x, ya, x, yb, C.grid, 1);
    for (let y = Math.ceil(ya / sy - 1e-9) * sy; y <= yb + 1e-9; y += sy) v.line(xa, y, xb, y, C.grid, 1);
  }
  function ticks(v, sx, sy) {
    const [[xa, ya], [xb, yb]] = v.visible(), dec = (st) => Math.max(2, Math.min(6, Math.ceil(-Math.log10(st)) + 1)), mx = (xb - xa) * 0.06, my = (yb - ya) * 0.06;
    for (let x = Math.ceil(xa / sx - 1e-9) * sx; x <= xb + 1e-9; x += sx) if (Math.abs(x) > 1e-9 && x - xa > mx && xb - x > mx) v.text(ML.fmt(x, dec(sx)), x, ya, C.dim, 0, -4, "11px system-ui", "center");
    for (let y = Math.ceil(ya / sy - 1e-9) * sy; y <= yb + 1e-9; y += sy) if (Math.abs(y) > 1e-9 && y - ya > my && yb - y > my) v.text(ML.fmt(y, dec(sy)), xa, y, C.dim, 4, -3, "11px system-ui");
  }
  const minmax = (f, lo, hi, N = 60) => {
    let m = Infinity, M = -Infinity;
    for (let i = 0; i <= N; i++) { const y = f(lo + (hi - lo) * i / N); if (y < m) m = y; if (y > M) M = y; }
    return [m, M];
  };

  /* ================================================================== */
  /* 4 · Continuous functions are Riemann integrable                     */
  /* ================================================================== */
  const A4 = 0, B4 = 3, NMAX4 = 60;
  const FN4 = [
    { name: "f(x) = 1.5 + sin 2x   (continuous)", f: (x) => 1.5 + Math.sin(2 * x), cont: true },
    { name: "f(x) = |x − 1.4| + 0.4   (continuous, with a corner)", f: (x) => Math.abs(x - 1.4) + 0.4, cont: true },
    { name: "step function   (discontinuous but still integrable)", f: (x) => (x < 1 ? 1 : x < 2 ? 2.2 : 0.8), cont: false },
    { name: "Dirichlet function   (not integrable)", dir: true },
  ];

  ML.register({
    id: "continuous-implies-integrable",
    course: "infi2",
    topic: "integrals",
    title: "A continuous function is Riemann integrable",
    blurb: "Uniform continuity makes the upper and lower Darboux sums as close as we like.",
    statement: String.raw`If \(f:[a,b]\to\mathbb R\) is continuous, then \(f\) is Riemann integrable on \([a,b]\). Equivalently (Riemann's criterion): for every \(\varepsilon>0\) there is a partition \(P\) with \(U(f,P)-L(f,P)\lt\varepsilon\).`,
    shows: String.raw`For a partition of \([0,3]\) into \(n\) equal pieces: the upper rectangles (pink, total area \(U\)) and lower rectangles (green, total area \(L\)) around the graph of \(f\), and below it the gap \(U-L\) plotted against \(n\) with the target \(\varepsilon\).`,
    vizIntro: String.raw`<b>Increase \(n\)</b> (slider or play) and watch the pink and green rectangles squeeze the graph. The bottom graph shows \(U-L\), which drops below any \(\varepsilon\) for a continuous \(f\). Compare with the step function and with the Dirichlet function, where it never does.`,

    viz(box) {
      const st = ML.stage(box, { x: [-0.2, 3.2], y: [-0.6, 3.1], equal: false, aspect: "4 / 3" });
      const S = { fi: 0, n: 6, eps: 1.2, focus: -1, winT: 0 };
      const F = () => FN4[S.fi];
      const cache = {};
      const pieces = (fi, n) => {
        const f = FN4[fi], d = (B4 - A4) / n, ps = [];
        for (let i = 0; i < n; i++) {
          const x0 = A4 + i * d, x1 = x0 + d;
          if (f.dir) ps.push({ x0, x1, m: 0, M: 1 });
          else { const [m, M] = minmax(f.f, x0, x1, 40); ps.push({ x0, x1, m, M }); }
        }
        return ps;
      };
      const ul = (fi) => {
        if (cache[fi]) return cache[fi];
        const U = [null], L = [null];
        for (let n = 1; n <= NMAX4; n++) {
          const ps = pieces(fi, n), d = (B4 - A4) / n;
          U.push(ps.reduce((s, p) => s + p.M * d, 0)); L.push(ps.reduce((s, p) => s + p.m * d, 0));
        }
        return (cache[fi] = { U, L });
      };
      // modulus of continuity on a grid: omega[j] = max |f(x)-f(y)| over |x-y| <= j*dx
      const omegaCache = {};
      const omega = (fi) => {
        if (omegaCache[fi]) return omegaCache[fi];
        const f = FN4[fi], G = 240, dx = (B4 - A4) / G, v = [];
        if (!f.dir) for (let i = 0; i <= G; i++) v.push(f.f(A4 + i * dx));
        const om = [0];
        for (let j = 1; j <= G; j++) {
          let m = om[j - 1];
          if (f.dir) m = 1; else for (let i = 0; i + j <= G; i++) m = Math.max(m, Math.abs(v[i + j] - v[i]));
          om.push(m);
        }
        return (omegaCache[fi] = { om, dx, G });
      };
      const deltaFor = (fi, eta) => {
        const { om, dx, G } = omega(fi); let J = 0;
        while (J < G && om[J + 1] < eta) J++;
        return J === G ? B4 - A4 : J * dx;
      };
      const integral = (fi) => { if (FN4[fi].dir) return NaN; let s = 0; const N = 4000, f = FN4[fi].f; for (let i = 0; i < N; i++) s += f(A4 + (i + 0.5) * (B4 - A4) / N); return s * (B4 - A4) / N; };

      const fsel = ML.select(st.panel, { label: "Function", options: FN4.map((f, i) => [i, f.name]), onChange: (v) => { S.fi = +v; st.redraw(); } });
      const nS = ML.slider(st.panel, { label: "number of pieces n", min: 1, max: NMAX4, step: 1, value: 6, onInput: (v) => { S.n = v; st.redraw(); } });
      const eS = ML.slider(st.panel, { label: "target ε", min: 0.05, max: 2, step: 0.05, value: 1.2, onInput: (v) => { S.eps = v; st.redraw(); } });
      let acc = 0;
      const anim = ML.loop(st, (dt) => {
        S.winT = (S.winT + dt * 0.18) % 1;
        if (S.focus !== 1) { acc += dt; if (acc > 0.18) { acc = 0; if (S.n >= NMAX4) { pbtn.textContent = "▶ Refine the partition"; return false; } S.n++; nS.set(S.n); } }
      });
      const pbtn = ML.button(st.panel, "▶ Refine the partition", () => {
        if (anim.running) { anim.stop(); pbtn.textContent = "▶ Refine the partition"; }
        else { if (S.n >= NMAX4) { S.n = 1; nS.set(1); } S.focus = -1; anim.start(); pbtn.textContent = "⏸ Pause"; }
      });
      const graph = st.extra({ height: 150 });
      const out = ML.readout(st.panel);
      const eta = () => S.eps / (2 * (B4 - A4));

      st.draw((v) => {
        const f = F(), ps = pieces(S.fi, S.n), d = (B4 - A4) / S.n, [[xa, ya], [xb, yb]] = v.visible();
        grid2(v, 0.5, 0.5); v.axes(); ticks(v, 0.5, 0.5);
        ps.forEach((p) => {
          v.poly([[p.x0, 0], [p.x1, 0], [p.x1, p.M], [p.x0, p.M]], "rgba(255,90,122,.20)", "rgba(255,90,122,.8)", 1);
          if (p.m > 0) v.poly([[p.x0, 0], [p.x1, 0], [p.x1, p.m], [p.x0, p.m]], "rgba(79,209,165,.45)", "rgba(79,209,165,.9)", 1);
        });
        if (S.focus === 4) ps.forEach((p) => v.poly([[p.x0, p.m], [p.x1, p.m], [p.x1, p.M], [p.x0, p.M]], "rgba(255,243,107,.6)", C.yellow, 1.2));
        // the graph
        if (f.dir) {
          v.line(A4, 1, B4, 1, C.blue, 2.5, [2, 5]); v.line(A4, 0, B4, 0, C.blue, 2.5, [2, 5]);
          v.text("f = 1 on rationals", B4, 1, C.blue, -4, -6, "600 11px system-ui", "right"); v.text("f = 0 on irrationals", B4, 0, C.blue, -4, -6, "600 11px system-ui", "right");
        } else if (!f.cont) {
          v.line(0, 1, 1, 1, C.blue, 3); v.line(1, 2.2, 2, 2.2, C.blue, 3); v.line(2, 0.8, 3, 0.8, C.blue, 3);
          v.dot(1, 2.2, C.blue, 4); v.dot(2, 0.8, C.blue, 4);
        } else v.plot(f.f, A4, B4, C.blue, 3, 300);
        if (S.focus === 3 && !f.dir) {
          ps.forEach((p) => v.line((p.x0 + p.x1) / 2, p.m, (p.x0 + p.x1) / 2, p.M, C.yellow, Math.max(2, Math.min(6, 60 / S.n))));
          v.line(-0.12, 0, -0.12, eta(), C.white, 5); v.text("η", -0.12, eta() / 2, C.white, 6, 4, "700 13px system-ui");
          v.text("yellow: M_i − m_i on each piece (all ≤ η)", 1.5, yb, C.yellow, 0, 16, "700 12px system-ui", "center");
        }
        if (S.focus === 1 && f.cont) {                 // uniform continuity: a window of width δ moves, the graph stays within height η
          const dl = Math.max(deltaFor(S.fi, eta()), 1e-9), xw = A4 + S.winT * Math.max(0.0001, (B4 - A4 - dl)), [lo] = minmax(f.f, xw, xw + dl, 40);
          v.poly([[xw, lo], [xw + dl, lo], [xw + dl, lo + eta()], [xw, lo + eta()]], "rgba(255,243,107,.28)", C.yellow, 2.5);
          v.text(`yellow box: width δ = ${ML.fmt(dl, 3)}, height η = ${ML.fmt(eta(), 3)}. The graph never leaves it.`, 1.5, yb, C.yellow, 0, 16, "700 12px system-ui", "center");
        }
        if (S.focus === 1 && !f.cont) v.text("no δ works across a jump: not uniformly continuous", 1.5, yb, C.red, 0, 16, "700 12px system-ui", "center");
        if (S.focus === 2) {
          const dl = Math.min(deltaFor(S.fi, eta()), B4 - A4);
          v.arrow(0, -0.22, d, -0.22, C.green, 3); v.text(`mesh Δ = ${ML.fmt(d, 3)}`, d, -0.22, C.green, 6, 14, "700 11px system-ui");
          v.arrow(0, -0.45, dl, -0.45, C.yellow, 3); v.text(`δ = ${ML.fmt(dl, 3)}`, dl, -0.45, C.yellow, 6, 4, "700 11px system-ui");
        }
        v.text("pink: upper sum U", xa, yb, C.red, 8, 16, "700 11px system-ui"); v.text("green: lower sum L", xa, yb, C.green, 8, 30, "700 11px system-ui");
      });

      graph.draw((g) => {
        const { U, L } = ul(S.fi), top = Math.max(0.5, U[1] - L[1], S.eps) * 1.15;
        g.o.x = [0, NMAX4 + 1]; g.o.y = [-top * 0.1, top]; g.begin();
        g.grid(10, "rgba(58,66,117,.35)"); g.axes();
        g.line(0, S.eps, NMAX4 + 1, S.eps, C.red, 2, [6, 4]); g.text("ε", NMAX4 + 1, S.eps, C.red, -4, -6, "700 12px system-ui", "right");
        g.path((n) => [n, U[n] - L[n]], 1, NMAX4, C.yellow, 2.5, NMAX4 - 1);
        g.line(S.n, 0, S.n, top, C.white, 1.5, [4, 4]);
        g.dot(S.n, U[S.n] - L[S.n], C.white, 5);
        g.text("U − L against n", 1, top, C.yellow, 6, 13, "700 11px system-ui");
        g.text("number of pieces n →", NMAX4 + 1, -top * 0.1, C.dim, -4, -4, "10px system-ui", "right");
      });

      st.after = () => {
        const { U, L } = ul(S.fi), d = (B4 - A4) / S.n, f = F(), ps = pieces(S.fi, S.n), osc = Math.max(...ps.map((p) => p.M - p.m));
        const dl = f.dir ? 0 : deltaFor(S.fi, eta()), I = integral(S.fi), ok = U[S.n] - L[S.n] < S.eps;
        out([
          ["U (upper sum)", ML.fmt(U[S.n], 4)],
          ["L (lower sum)", ML.fmt(L[S.n], 4)],
          ["U − L", `<span class="${ok ? "ok" : "no"}">${ML.fmt(U[S.n] - L[S.n], 4)}</span>  ${ok ? "&lt; ε ✓" : "≥ ε"}`],
          ["η = ε / (2(b−a))", ML.fmt(eta(), 4)],
          ["δ for this η", f.dir || dl <= 1e-9 ? "none exists" : ML.fmt(dl, 3)],
          ["mesh Δ = (b−a)/n", ML.fmt(d, 4) + (f.dir ? "" : (d < dl ? "  &lt; δ ✓" : "  ≥ δ"))],
          ["largest M_i − m_i", ML.fmt(osc, 4) + (f.cont ? (osc < eta() + 1e-9 ? "  ≤ η ✓" : "") : "")],
          ["∫ f", Number.isFinite(I) ? ML.fmt(I, 4) : "does not exist"],
        ], f.dir ? "On every piece M_i = 1 and m_i = 0, so U − L = b − a for every partition: never below ε." : (f.cont ? "Mesh below δ forces every M_i − m_i ≤ η, hence U − L ≤ η(b−a) &lt; ε." : "A step function is integrable (finitely many jumps), but uniform continuity fails, so the proof above does not apply to it."));
      };

      return {
        showStep(i) {
          anim.stop(); pbtn.textContent = "▶ Refine the partition"; S.focus = i;
          if (i === 5) { S.fi = 3; fsel.value = "3"; S.n = 8; nS.set(8); }
          else if (S.fi === 3 && i >= 0) { S.fi = 0; fsel.value = "0"; }
          if (i === 1) { if (S.fi > 1) { S.fi = 0; fsel.value = "0"; } anim.start(); }
          if (i === 2 || i === 3 || i === 4) { const dl = deltaFor(S.fi, eta()); S.n = ML.clamp(Math.ceil((B4 - A4) / Math.max(dl, 1e-6)) + 1, 1, NMAX4); nS.set(S.n); }
          st.redraw();
        },
      };
    },

    idea: String.raw`Uniform continuity: closeness of points implies closeness of values, <i>uniformly</i> on \([a,b]\). So on a fine partition every piece has oscillation \(M_i-m_i\le\eta\) and \(U-L\le\eta(b-a)\).`,
    steps: [
      { fig: String.raw`A partition of \([0,3]\) into \(n\) pieces: the pink upper rectangles (heights \(M_i=\sup\)) have total area \(U\), the green lower rectangles (heights \(m_i=\inf\)) have total area \(L\).`,
        t: String.raw`Recall the criterion: \(f\) is integrable iff \(\forall\varepsilon\,\exists P:\ U(f,P)-L(f,P)\lt\varepsilon\).`,
        d: String.raw`Here \(U(f,P)=\sum M_i\Delta x_i\), \(L(f,P)=\sum m_i\Delta x_i\) with \(M_i=\sup_{[x_{i-1},x_i]}f\), \(m_i=\inf_{[x_{i-1},x_i]}f\). They exist because a continuous function on \([a,b]\) is bounded.` },
      { fig: String.raw`Uniform continuity: a window of width \(\delta\) slides along the axis (animation). Inside every position of the window the graph stays within a band of height \(\eta\) (yellow box).`,
        t: String.raw`\(f\) is uniformly continuous (Heine–Cantor): \(\forall\eta>0\ \exists\delta>0\) such that \(|x-y|\lt\delta\Rightarrow|f(x)-f(y)|\lt\eta\).`,
        d: String.raw`This is where continuity on a <b>closed bounded</b> interval is used: \(\delta\) does not depend on the point.` },
      { fig: String.raw`The partition is refined until its mesh \(\Delta=(b-a)/n\) (green arrow) is smaller than \(\delta\) (yellow arrow).`,
        t: String.raw`Given \(\varepsilon\), put \(\eta=\dfrac{\varepsilon}{2(b-a)}\), take the corresponding \(\delta\), and choose a partition \(P\) whose mesh is \(\lt\delta\).`,
        d: String.raw`For instance \(n\) equal pieces with \((b-a)/n\lt\delta\).` },
      { fig: String.raw`On each piece the vertical yellow bar from \(m_i\) to \(M_i\) is shorter than \(\eta\) (white reference bar on the left).`,
        t: String.raw`On each piece, \(M_i-m_i\lt\eta\).`,
        d: String.raw`By the Extreme Value Theorem there are \(s_i,t_i\) in the piece with \(f(s_i)=M_i\), \(f(t_i)=m_i\). Then \(|s_i-t_i|\le\Delta x_i\lt\delta\), so \(M_i-m_i=f(s_i)-f(t_i)\lt\eta\).` },
      { fig: String.raw`The yellow rectangles fill the gap between the pink and green tops: their total area is \(U-L=\sum(M_i-m_i)\Delta x_i\). It is at most \(\eta(b-a)=\varepsilon/2\lt\varepsilon\), as the table and the bottom graph confirm.`,
        t: String.raw`Add up: \(U-L=\sum_i(M_i-m_i)\Delta x_i\le\eta\sum_i\Delta x_i=\eta(b-a)=\dfrac\varepsilon2\lt\varepsilon\).`,
        d: String.raw`So the criterion holds for every \(\varepsilon\), and \(f\) is Riemann integrable. \(\blacksquare\)` },
      { fig: String.raw`Why continuity matters: for the Dirichlet function, every piece has \(M_i=1\) and \(m_i=0\), so \(U-L=b-a\) for every partition. The bottom graph stays flat above \(\varepsilon\).`,
        t: String.raw`Remark: the hypothesis cannot simply be dropped.`,
        d: String.raw`The Dirichlet function (1 on rationals, 0 on irrationals) is not integrable. By contrast, a step function is integrable even though it is not continuous, since only finitely many pieces contribute to \(U-L\).` },
    ],
    memorize: {
      formula: String.raw`f\in C[a,b]\ \Rightarrow\ U(f,P)-L(f,P)\le\eta\,(b-a)\ \text{ whenever }\ \|P\|\lt\delta(\eta)`,
      bullets: [
        String.raw`Criterion: integrable \(\iff\) \(\forall\varepsilon\,\exists P\): \(U-L\lt\varepsilon\).`,
        String.raw`Engine of the proof: <b>uniform</b> continuity (Heine–Cantor), so one \(\delta\) works for all pieces.`,
        String.raw`Choose \(\eta=\varepsilon/(2(b-a))\) so the final bound is \(\le\varepsilon/2\lt\varepsilon\).`,
      ],
      pitfalls: [
        String.raw`Pointwise continuity is not enough: you must invoke uniform continuity (and say why it holds: compact interval).`,
        String.raw`Do not forget that \(M_i,m_i\) exist (bounded, even attained) because \(f\) is continuous on a closed interval.`,
        String.raw`The converse is false: integrable functions can have jumps (step functions) or infinitely many discontinuities (Thomae).`,
      ],
    },
  });

  /* ================================================================== */
  /* 5 · FTC part 1                                                      */
  /* ================================================================== */
  const T5 = 4;
  const FN5 = [
    { name: "f(t) = 1 + 0.8·sin(1.6t)", f: (t) => 1 + 0.8 * Math.sin(1.6 * t) },
    { name: "f(t) = 0.25t² + 0.4", f: (t) => 0.25 * t * t + 0.4 },
    { name: "f(t) = |t − 2| + 0.3   (corner)", f: (t) => Math.abs(t - 2) + 0.3 },
  ];
  const integ = (f, a, b) => {
    if (a === b) return 0;
    const n = Math.max(2, 2 * Math.ceil(Math.abs(b - a) * 40)), h = (b - a) / n; let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
    return s * h / 3;
  };

  ML.register({
    id: "ftc-derivative-of-area",
    course: "infi2",
    topic: "integrals",
    title: "Fundamental Theorem of Calculus, part 1: F′ = f",
    blurb: "The area function F(x) = ∫f has derivative f(x): the difference quotient is squeezed between min f and max f.",
    statement: String.raw`Let \(f:[a,b]\to\mathbb R\) be continuous and \(F(x)=\int_a^x f(t)\,dt\). Then \(F\) is differentiable on \([a,b]\) (one-sidedly at the endpoints) and \(F'(x)=f(x)\) for every \(x\).`,
    shows: String.raw`Top: the graph of \(f\) with the area \(F(x)\) shaded blue and the thin strip over \([x,x+h]\) shaded orange. Bottom: the graph of \(F\), its secant over \([x,x+h]\) (slope = the difference quotient \(q\)) and its tangent at \(x\) (slope \(f(x)\)).`,
    vizIntro: String.raw`<b>Move \(x\) and shrink \(h\).</b> The difference quotient \(q=\frac{F(x+h)-F(x)}{h}\) is the average height of \(f\) over the strip. It always lies between the lowest and highest point of \(f\) on the strip, and both of those tend to \(f(x)\) as \(h\to0\).`,

    viz(box) {
      const st = ML.stage(box, { x: [-0.3, 4.3], y: [-0.5, 3], equal: false, aspect: "4 / 3" });
      const S = { fi: 0, x: 1.2, h: 0.8, focus: -1 };
      const F = (x) => integ(FN5[S.fi].f, 0, x);
      const hEff = () => {
        let h = S.h; if (Math.abs(h) < 0.003) h = h < 0 ? -0.003 : 0.003;
        return ML.clamp(h, -S.x + 1e-3, T5 - S.x - 1e-3);
      };
      const setView = () => {
        const [m, M] = minmax(FN5[S.fi].f, 0, T5, 100);
        st.view.o.y = [Math.min(0, m) - 0.5, M + 0.6];
      };
      ML.select(st.panel, { label: "Function f", options: FN5.map((f, i) => [i, f.name]), onChange: (v) => { S.fi = +v; setView(); st.redraw(); } });
      const xS = ML.slider(st.panel, { label: "point x", min: 0.2, max: 3.6, step: 0.02, value: 1.2, onInput: (v) => { S.x = v; st.redraw(); } });
      const hS = ML.slider(st.panel, { label: "step h", min: -1.5, max: 1.5, step: 0.005, value: 0.8, fmt: (v) => ML.fmt(v, 3), onInput: (v) => { S.h = v; st.redraw(); } });
      const shrink = ML.loop(st, (dt) => {
        S.h *= Math.exp(-dt * 0.9); hS.set(S.h);
        if (Math.abs(S.h) < 0.004) { sbtn.textContent = "▶ Shrink h → 0"; return false; }
      });
      const sbtn = ML.button(st.panel, "▶ Shrink h → 0", () => {
        if (shrink.running) { shrink.stop(); sbtn.textContent = "▶ Shrink h → 0"; }
        else { if (Math.abs(S.h) < 0.01) { S.h = 0.9; hS.set(0.9); } shrink.start(); sbtn.textContent = "⏸ Pause"; }
      });
      const graph = st.extra({ height: 160 });
      const out = ML.readout(st.panel);
      setView();

      const calc = () => {
        const f = FN5[S.fi].f, h = hEff(), lo = Math.min(S.x, S.x + h), hi = Math.max(S.x, S.x + h);
        const [m, M] = minmax(f, lo, hi, 200), area = integ(f, lo, hi), q = area / (hi - lo);
        return { f, h, lo, hi, m, M, area, q, Fx: F(S.x), Fxh: F(S.x + h) };
      };

      st.draw((v) => {
        const c = calc(), [[xa, ya], [xb, yb]] = v.visible();
        grid2(v, 1, 1); v.axes(); ticks(v, 1, 1);
        const curve = (x0, x1, base) => { const pts = []; for (let i = 0; i <= 60; i++) { const x = x0 + (x1 - x0) * i / 60; pts.push([x, c.f(x)]); } return base ? [[x0, 0], ...pts, [x1, 0]] : pts; };
        v.poly(curve(0, S.x, true), "rgba(108,140,255,.28)", null);
        v.text("F(x) = area from 0 to x", S.x / 2, 0.15, C.blue, 0, 0, "700 12px system-ui", "center");
        v.poly(curve(c.lo, c.hi, true), S.focus === 0 ? "rgba(255,159,90,.8)" : "rgba(255,159,90,.55)", C.orange, 1);
        v.plot(c.f, 0, T5, C.white, 2.5, 300);
        const emph = S.focus === 1;
        v.poly([[c.lo, 0], [c.hi, 0], [c.hi, c.m], [c.lo, c.m]], null, C.green, emph ? 3 : 1.5);
        v.poly([[c.lo, 0], [c.hi, 0], [c.hi, c.M], [c.lo, c.M]], null, C.pink, emph ? 3 : 1.5);
        if (emph) { v.text("M_h = max f", c.hi, c.M, C.pink, 6, -4, "700 11px system-ui"); v.text("m_h = min f", c.hi, c.m, C.green, 6, 12, "700 11px system-ui"); }
        const qEmph = S.focus === 2 || S.focus === 3;
        v.line(c.lo - 0.15, c.q, c.hi + 0.15, c.q, C.red, qEmph ? 4 : 2.5);
        v.text(`q = ${ML.fmt(c.q, 3)}`, c.hi + 0.15, c.q, C.red, 4, -5, "700 12px system-ui");
        v.line(S.x, ya, S.x, yb, C.dim, 1, [4, 4]); v.text("x", S.x, yb, C.dim, 4, 14);
        v.line(S.x + c.h, ya, S.x + c.h, yb, C.dim, 1, [4, 4]); v.text("x+h", S.x + c.h, yb, C.dim, 4, 28);
        v.dot(S.x, c.f(S.x), C.yellow, 5); v.text("f(x)", S.x, c.f(S.x), C.yellow, -6, -8, "700 11px system-ui", "right");
        if (S.focus === 3) v.line(S.x, c.f(S.x), S.x + c.h, c.f(S.x), C.yellow, 2, [3, 3]);
        v.text("f", xb, c.f(T5), C.white, -10, -8, "700 13px system-ui", "right");
      });

      graph.draw((g) => {
        const c = calc(), N = 80, vals = [];
        for (let i = 0; i <= N; i++) vals.push(F(T5 * i / N));
        const mn = Math.min(0, ...vals), mx = Math.max(...vals), pad = (mx - mn) * 0.12;
        g.o.x = [-0.3, 4.3]; g.o.y = [mn - pad, mx + pad]; g.begin();
        g.grid(1, "rgba(58,66,117,.35)"); g.axes();
        g.path((t) => [t, vals[Math.round(t / T5 * N)]], 0, T5, C.cyan, 2.5, N);
        const x = S.x, xh = x + c.h;
        g.line(x, mn - pad, x, mx + pad, C.dim, 1, [4, 4]); g.line(xh, mn - pad, xh, mx + pad, C.dim, 1, [4, 4]);
        // secant with slope q
        const ext = 0.25 * Math.abs(c.h) + 0.15;
        g.line(c.lo - ext, c.Fx + c.q * (c.lo - ext - S.x), c.hi + ext, c.Fx + c.q * (c.hi + ext - S.x), C.red, 2.5);
        // tangent at x with slope f(x)
        const fx = c.f(S.x), tw = S.focus === 4 ? 4 : 2.5;
        g.line(S.x - 0.7, c.Fx - 0.7 * fx, S.x + 0.7, c.Fx + 0.7 * fx, C.green, tw);
        g.dot(x, c.Fx, C.yellow, 5); g.dot(xh, c.Fxh, C.orange, 5);
        if (S.focus === 0) {
          g.line(xh, c.Fx, xh, c.Fxh, C.orange, 4); g.line(x, c.Fx, xh, c.Fx, C.orange, 1.5, [3, 3]);
          g.text("F(x+h) − F(x) = ∫ over the strip", xh, (c.Fx + c.Fxh) / 2, C.orange, 8, 4, "700 11px system-ui");
        }
        if (S.focus === 4) g.text("tangent slope = f(x) = F′(x)", S.x, c.Fx, C.green, 8, -10, "700 12px system-ui");
        g.text("F(t) = ∫₀ᵗ f", -0.2, mx + pad, C.cyan, 4, 13, "700 11px system-ui");
        g.text("red: secant, slope q   green: tangent, slope f(x)", 4.3, mn - pad, C.text, -4, -4, "600 10px system-ui", "right");
      });

      st.after = () => {
        const c = calc(), fx = c.f(S.x), ok = c.m - 1e-9 <= c.q && c.q <= c.M + 1e-9;
        out([
          ["F(x), F(x+h)", `${ML.fmt(c.Fx, 4)},  ${ML.fmt(c.Fxh, 4)}`],
          ["F(x+h) − F(x)", ML.fmt(c.Fxh - c.Fx, 5)],
          ["h", ML.fmt(c.h, 4)],
          ["m_h  ≤  q  ≤  M_h", `${ML.fmt(c.m, 4)} ≤ <b>${ML.fmt(c.q, 4)}</b> ≤ ${ML.fmt(c.M, 4)}  <span class="${ok ? "ok" : "no"}">${ok ? "✓" : "✗"}</span>`],
          ["f(x)", ML.fmt(fx, 4)],
          ["|q − f(x)|", ML.fmt(Math.abs(c.q - fx), 5)],
        ], "As h → 0 the interval [m_h, M_h] shrinks onto f(x), so q → f(x).");
      };

      return {
        showStep(i) {
          shrink.stop(); sbtn.textContent = "▶ Shrink h → 0"; S.focus = i;
          if (i === 3) { S.h = 0.9; hS.set(0.9); shrink.start(); sbtn.textContent = "⏸ Pause"; }
          if ((i === 0 || i === 1 || i === 2) && Math.abs(S.h) < 0.3) { S.h = 0.8; hS.set(0.8); }
          st.redraw();
        },
      };
    },

    idea: String.raw`\(\dfrac{F(x+h)-F(x)}{h}\) is the average of \(f\) over the interval between \(x\) and \(x+h\). An average lies between the minimum and maximum, and continuity forces both to \(f(x)\).`,
    steps: [
      { fig: String.raw`The orange strip over \([x,x+h]\) is exactly \(F(x+h)-F(x)\) (top). In the bottom graph this is the vertical rise of \(F\) over the same interval.`,
        t: String.raw`Additivity of the integral: \(F(x+h)-F(x)=\displaystyle\int_x^{x+h}f(t)\,dt\).`,
        d: String.raw`(For \(h\lt0\) read it as \(-\int_{x+h}^{x}f\).) Let \(J_h\) be the closed interval with endpoints \(x\) and \(x+h\), of length \(|h|\).` },
      { fig: String.raw`On the strip, the lowest point of \(f\) is \(m_h\) (green rectangle top) and the highest is \(M_h\) (pink rectangle top).`,
        t: String.raw`\(f\) is continuous on the closed interval \(J_h\), so it attains a minimum \(m_h\) and a maximum \(M_h\) there.`,
        d: String.raw`This is the Extreme Value Theorem. So \(m_h\le f(t)\le M_h\) for all \(t\in J_h\).` },
      { fig: String.raw`The red horizontal line is the difference quotient \(q\) (the average height of \(f\) on the strip). It always lies between the green and pink levels. Drag \(h\) to either side to check.`,
        t: String.raw`Integrate the inequality: \(m_h\le\dfrac{F(x+h)-F(x)}{h}\le M_h\).`,
        d: String.raw`\(m_h|h|\le\int_{J_h}f\le M_h|h|\). Divide by \(|h|\); the quotient \(\frac{F(x+h)-F(x)}{h}\) equals \(\frac1{|h|}\int_{J_h}f\) in both cases \(h\gtrless0\).` },
      { fig: String.raw`Animation: \(h\) shrinks to \(0\). The green and pink levels both close in on \(f(x)\) (yellow dashed), and the red quotient is squeezed with them.`,
        t: String.raw`Continuity of \(f\) at \(x\): \(m_h\to f(x)\) and \(M_h\to f(x)\) as \(h\to0\).`,
        d: String.raw`Given \(\varepsilon\), pick \(\delta\) with \(|f(t)-f(x)|\lt\varepsilon\) for \(|t-x|\lt\delta\). For \(|h|\lt\delta\): \(f(x)-\varepsilon\le m_h\le M_h\le f(x)+\varepsilon\).` },
      { fig: String.raw`Result: the secant of \(F\) (red) turns into the tangent at \(x\) (green, thick) whose slope is \(f(x)\).`,
        t: String.raw`Squeeze: \(\displaystyle\lim_{h\to0}\frac{F(x+h)-F(x)}{h}=f(x)\), i.e. \(F'(x)=f(x)\). \(\blacksquare\)`,
        d: String.raw`At \(x=a\) or \(x=b\) the argument gives the one-sided derivative.` },
    ],
    memorize: {
      formula: String.raw`F(x)=\int_a^x f\ \Rightarrow\ F'(x)=\lim_{h\to0}\frac1h\int_x^{x+h}f=f(x)`,
      bullets: [
        String.raw`Difference quotient of \(F\) = <i>average value of \(f\)</i> on the strip.`,
        String.raw`Sandwich: \(m_h\le\) quotient \(\le M_h\), where \(m_h,M_h\) are the min and max on the strip (they exist by the EVT).`,
        String.raw`Continuity of \(f\) at \(x\) sends both \(m_h\) and \(M_h\) to \(f(x)\).`,
        String.raw`Corollary: every continuous function has an antiderivative.`,
      ],
      pitfalls: [
        String.raw`Continuity of \(f\) is essential. If \(f\) has a jump at \(x\), then \(F\) has a corner there and \(F'(x)\) does not exist.`,
        String.raw`Treat \(h\lt0\) too (or say "similarly"): the quotient is still the average of \(f\) over the strip.`,
        String.raw`Do not differentiate "under the integral sign" naively: \(F'(x)=f(x)\) is the statement to prove, not a rule you may assume.`,
      ],
    },
  });

  /* ================================================================== */
  /* 6 · FTC part 2 (Newton–Leibniz)                                     */
  /* ================================================================== */
  const B6 = 3;
  const FN6 = [
    { name: "f = cos t + 1.2,   F = sin t + 1.2t", f: (t) => Math.cos(t) + 1.2, F: (t) => Math.sin(t) + 1.2 * t, vy: [-0.3, 2.6], vF: [-0.3, 4.3], fy: 0.5 },
    { name: "f = t²/3,   F = t³/9", f: (t) => t * t / 3, F: (t) => t * t * t / 9, vy: [-0.3, 3.4], vF: [-0.3, 3.4], fy: 0.5 },
    { name: "f = 1/(1+t),   F = ln(1+t)", f: (t) => 1 / (1 + t), F: (t) => Math.log(1 + t), vy: [-0.15, 1.2], vF: [-0.1, 1.6], fy: 0.25 },
  ];
  const makePts = (n, random) => {
    if (!random) return Array.from({ length: n + 1 }, (_, i) => B6 * i / n);
    for (let tries = 0; tries < 200; tries++) {
      const a = Array.from({ length: n - 1 }, () => Math.random() * B6).sort((p, q) => p - q), pts = [0, ...a, B6];
      if (pts.every((p, i) => i === 0 || p - pts[i - 1] >= 0.06)) return pts;
    }
    return Array.from({ length: n + 1 }, (_, i) => B6 * i / n);
  };
  const findXi = (f, x0, x1, s) => {
    const h = (t) => f(t) - s, N = 240; let best = (x0 + x1) / 2, bd = Infinity;
    for (let i = 0; i < N; i++) {
      const t0 = x0 + (x1 - x0) * i / N, t1 = x0 + (x1 - x0) * (i + 1) / N, h0 = h(t0), h1 = h(t1);
      if (Math.abs(h0) < bd) { bd = Math.abs(h0); best = t0; }
      if (h0 === 0) return t0;
      if (h0 * h1 < 0) { let p = t0, q = t1; for (let k = 0; k < 60; k++) { const m = (p + q) / 2; (h(p) * h(m) <= 0) ? (q = m) : (p = m); } return (p + q) / 2; }
    }
    return best;
  };

  ML.register({
    id: "newton-leibniz",
    course: "infi2",
    topic: "integrals",
    title: "Fundamental Theorem of Calculus, part 2 (Newton–Leibniz)",
    blurb: "∫ₐᵇ f = F(b) − F(a): a telescoping sum plus the Mean Value Theorem make every Riemann sum equal F(b) − F(a).",
    statement: String.raw`Let \(f:[a,b]\to\mathbb R\) be continuous and let \(F\) be differentiable on \([a,b]\) with \(F'=f\). Then \(\displaystyle\int_a^b f(t)\,dt=F(b)-F(a)\).`,
    shows: String.raw`Top: \(f\) with rectangles whose heights are \(f(\xi_i)\), the values given by the Mean Value Theorem. Bottom: the graph of \(F\) with the partition points and the chords. The sum of the rectangle areas equals \(F(b)-F(a)\) <b>exactly</b>, for every partition.`,
    vizIntro: String.raw`<b>Change the partition</b> (number of pieces, or random partition) and read the table: the Riemann sum with the special points \(\xi_i\) is always \(F(b)-F(a)\) up to rounding, while the lower and upper sums \(L(P)\le\) it \(\le U(P)\) squeeze the integral.`,

    viz(box) {
      const st = ML.stage(box, { x: [-0.3, 3.3], y: FN6[0].vy, equal: false, aspect: "4 / 3" });
      const S = { fi: 0, n: 5, random: false, pts: makePts(5, false), focus: -1 };
      const FN = () => FN6[S.fi];
      const fsel = ML.select(st.panel, { label: "Function pair", options: FN6.map((f, i) => [i, f.name]), onChange: (v) => { S.fi = +v; st.view.o.y = FN6[S.fi].vy; graph.view.o.y = FN6[S.fi].vF; st.redraw(); } });
      const nS = ML.slider(st.panel, { label: "number of pieces n", min: 1, max: 20, step: 1, value: 5, onInput: (v) => { S.n = v; S.pts = makePts(v, S.random); st.redraw(); } });
      const row = ML.h("div", { class: "btn-row" }); st.panel.append(row);
      ML.button(row, "Uniform partition", () => { S.random = false; S.pts = makePts(S.n, false); st.redraw(); });
      ML.button(row, "🎲 Random partition", () => { S.random = true; S.pts = makePts(S.n, true); st.redraw(); });
      let acc = 0;
      const anim = ML.loop(st, (dt) => {
        acc += dt;
        if (acc > 0.45) { acc = 0; if (S.n >= 20) { pbtn.textContent = "▶ Refine the partition"; return false; } S.n++; nS.set(S.n); S.pts = makePts(S.n, S.random); }
      });
      const pbtn = ML.button(st.panel, "▶ Refine the partition", () => {
        if (anim.running) { anim.stop(); pbtn.textContent = "▶ Refine the partition"; }
        else { if (S.n >= 20) { S.n = 1; nS.set(1); S.pts = makePts(1, S.random); } anim.start(); pbtn.textContent = "⏸ Pause"; }
      });
      const graph = st.extra({ height: 170, x: [-0.3, 3.5], y: FN6[0].vF });
      const out = ML.readout(st.panel);

      const calc = () => {
        const { f, F } = FN(), ps = [];
        let sum = 0, Ls = 0, Us = 0;
        for (let i = 1; i < S.pts.length; i++) {
          const x0 = S.pts[i - 1], x1 = S.pts[i], d = x1 - x0, s = (F(x1) - F(x0)) / d, xi = findXi(f, x0, x1, s), [m, M] = minmax(f, x0, x1, 30);
          ps.push({ x0, x1, d, s, xi, fx: f(xi), rise: F(x1) - F(x0), m, M });
          sum += f(xi) * d; Ls += m * d; Us += M * d;
        }
        return { ps, sum, Ls, Us, tot: F(B6) - F(0) };
      };

      st.draw((v) => {
        const { f } = FN(), c = calc(), [[xa, ya], [xb, yb]] = v.visible(), gy = FN().fy;
        grid2(v, 0.5, gy); v.axes(); ticks(v, 0.5, gy);
        c.ps.forEach((p, i) => {
          const col = PAL[i % PAL.length], emph = S.focus === 3;
          v.poly([[p.x0, 0], [p.x1, 0], [p.x1, p.fx], [p.x0, p.fx]], rgba(col, emph ? 0.6 : 0.38), col, emph ? 2.5 : 1.2);
          v.dot(p.xi, 0, col, 4); v.line(p.xi, 0, p.xi, p.fx, col, 1, [3, 3]);
          if (S.focus === 0 || S.focus === 4) {
            v.poly([[p.x0, 0], [p.x1, 0], [p.x1, p.m], [p.x0, p.m]], null, C.green, 1.5);
            v.poly([[p.x0, 0], [p.x1, 0], [p.x1, p.M], [p.x0, p.M]], null, C.pink, 1.5);
          }
        });
        v.plot(f, 0, B6, C.white, 2.5, 300);
        v.text("f", xb, f(B6), C.white, -10, -8, "700 13px system-ui", "right");
        v.text("rectangle i: width Δxᵢ, height f(ξᵢ), area = F(xᵢ) − F(xᵢ₋₁)", xa, yb, C.text, 6, 15, "600 11px system-ui");
        if (S.focus === 0 || S.focus === 4) v.text("green: lower sum L(P)   pink: upper sum U(P)", xa, yb, C.dim, 6, 30, "600 11px system-ui");
      });

      graph.draw((g) => {
        const { F } = FN(), c = calc();
        g.o.x = [-0.3, 3.5]; g.o.y = FN().vF; g.begin();
        g.grid(0.5, "rgba(58,66,117,.35)"); g.axes();
        g.plot(F, 0, B6, S.focus === 1 || S.focus === 2 ? "rgba(90,215,255,.35)" : C.cyan, 2.5, 200);
        c.ps.forEach((p, i) => {
          const col = PAL[i % PAL.length], F0 = F(p.x0), F1 = F(p.x1);
          g.line(p.x0, F0, p.x1, F1, col, 1.2, [4, 3]);
          if (S.focus === 1) { g.line(p.x0, F0, p.x1, F0, col, 1, [3, 3]); g.line(p.x1, F0, p.x1, F1, col, 4); }
          if (S.focus === 2) { const w = 0.45 * p.d; g.line(p.xi - w, F(p.xi) - w * p.s, p.xi + w, F(p.xi) + w * p.s, col, 3.5); g.dot(p.xi, F(p.xi), col, 4); }
          g.dot(p.x1, F1, col, 3.5);
        });
        g.dot(0, F(0), C.white, 4);
        if (S.focus === 1) {
          const xb = B6 + 0.13, y0 = F(0), y1 = F(B6);
          g.line(xb, y0, xb, y1, C.white, 3); g.line(xb - 0.06, y0, xb + 0.06, y0, C.white, 3); g.line(xb - 0.06, y1, xb + 0.06, y1, C.white, 3);
          g.text("F(b) − F(a)", xb, (y0 + y1) / 2, C.white, -6, 4, "700 11px system-ui", "right");
        }
        if (S.focus === 2) g.text("tangent at ξᵢ ∥ chord", 3.5, g.o.y[0], C.text, -4, -6, "700 11px system-ui", "right");
        g.text("F", -0.2, g.o.y[1], C.cyan, 4, 13, "700 13px system-ui");
      });

      st.after = () => {
        const c = calc(), err = Math.abs(c.sum - c.tot), ok = c.Ls - 1e-9 <= c.sum && c.sum <= c.Us + 1e-9;
        out([
          ["pieces", String(S.pts.length - 1)],
          ["Σ f(ξᵢ)·Δxᵢ", ML.fmt(c.sum, 9)],
          ["F(b) − F(a)", ML.fmt(c.tot, 9)],
          ["difference", err < 1e-9 ? '<span class="ok">0 (up to rounding) ✓</span>' : ML.fmt(err, 9)],
          ["L(P) ≤ sum ≤ U(P)", `${ML.fmt(c.Ls, 4)} ≤ ${ML.fmt(c.sum, 4)} ≤ ${ML.fmt(c.Us, 4)}  <span class="${ok ? "ok" : "no"}">${ok ? "✓" : "✗"}</span>`],
          ["U(P) − L(P)", ML.fmt(c.Us - c.Ls, 4)],
        ], "The equality in the second and third rows holds for every partition. The only thing that changes with the partition is how tightly L and U squeeze it.");
      };

      return {
        showStep(i) {
          anim.stop(); pbtn.textContent = "▶ Refine the partition"; S.focus = i;
          if (i === 1 || i === 2) { S.n = 3; nS.set(3); S.pts = makePts(3, S.random); }
          else if (i >= 0 && i <= 4 && S.n < 3) { S.n = 5; nS.set(5); S.pts = makePts(5, S.random); }
          if (i === 5) { S.n = 1; nS.set(1); S.pts = makePts(1, S.random); anim.start(); pbtn.textContent = "⏸ Pause"; }
          st.redraw();
        },
      };
    },

    idea: String.raw`Telescope: \(F(b)-F(a)=\sum[F(x_i)-F(x_{i-1})]\). The Mean Value Theorem turns each bracket into \(f(\xi_i)\Delta x_i\), so \(F(b)-F(a)\) is a Riemann sum of \(f\) for <i>every</i> partition. It lies between \(L(P)\) and \(U(P)\) for all \(P\), hence equals the integral.`,
    steps: [
      { fig: String.raw`One partition \(P\) with its lower sum \(L(P)\) (green outlines) and upper sum \(U(P)\) (pink outlines). The integral is the unique number between \(L(P)\) and \(U(P)\) for <i>all</i> partitions.`,
        t: String.raw`\(f\) is continuous, hence integrable: \(\sup_P L(P)=\inf_P U(P)=\int_a^b f\).`,
        d: String.raw`This is the previous proof. So it is enough to show \(L(P)\le F(b)-F(a)\le U(P)\) for every partition \(P\).` },
      { fig: String.raw`The graph of \(F\) with the partition points. The coloured vertical rises \(F(x_i)-F(x_{i-1})\) stack up to the white bracket \(F(b)-F(a)\) on the right: the sum telescopes.`,
        t: String.raw`Take a partition \(a=x_0\lt x_1\lt\dots\lt x_n=b\) and telescope: \(F(b)-F(a)=\sum_{i=1}^{n}\big[F(x_i)-F(x_{i-1})\big]\).`,
        d: String.raw`All the intermediate values \(F(x_1),\dots,F(x_{n-1})\) cancel in pairs.` },
      { fig: String.raw`On each piece the tangent line to \(F\) at \(\xi_i\) (thick) is parallel to the chord of that piece: this is the Mean Value Theorem.`,
        t: String.raw`Mean Value Theorem on each \([x_{i-1},x_i]\): there is \(\xi_i\) strictly inside with \(F(x_i)-F(x_{i-1})=F'(\xi_i)\,\Delta x_i=f(\xi_i)\,\Delta x_i\).`,
        d: String.raw`\(F\) is differentiable, hence continuous on each closed piece and differentiable inside.` },
      { fig: String.raw`Top graph: the rectangle over piece \(i\) has height \(f(\xi_i)\), so its area is \(f(\xi_i)\Delta x_i=F(x_i)-F(x_{i-1})\), the rise of \(F\) over the same piece (same colour).`,
        t: String.raw`Therefore \(F(b)-F(a)=\sum_{i=1}^{n}f(\xi_i)\,\Delta x_i\): a Riemann sum of \(f\) for this partition.`,
        d: String.raw`The equality is exact, for every partition, with these particular points \(\xi_i\).` },
      { fig: String.raw`Because \(m_i\le f(\xi_i)\le M_i\), the rectangle sum sits between the green lower sum and the pink upper sum (see the table): \(L(P)\le F(b)-F(a)\le U(P)\).`,
        t: String.raw`Sandwich: \(m_i\le f(\xi_i)\le M_i\) gives \(L(P)\le F(b)-F(a)\le U(P)\) for <b>every</b> \(P\).`,
        d: String.raw`Take the supremum over \(P\) on the left and the infimum on the right: \(\int_a^b f\le F(b)-F(a)\le\int_a^b f\).` },
      { fig: String.raw`Animation: the partition is refined. The sum stays exactly \(F(b)-F(a)\) while \(U-L\) shrinks to \(0\), pinning the integral to that value.`,
        t: String.raw`Conclusion: \(\displaystyle\int_a^b f=F(b)-F(a)\). \(\blacksquare\)`,
        d: String.raw`Note that we never computed a limit of Riemann sums: the number was already equal to \(F(b)-F(a)\) for every partition.` },
    ],
    memorize: {
      formula: String.raw`\int_a^b f(t)\,dt=F(b)-F(a)=\big[F\big]_a^b\qquad(F'=f)`,
      bullets: [
        String.raw`Telescoping: \(F(b)-F(a)=\sum[F(x_i)-F(x_{i-1})]\).`,
        String.raw`MVT: \(F(x_i)-F(x_{i-1})=f(\xi_i)\Delta x_i\), so the sum is a Riemann sum for every partition.`,
        String.raw`\(L(P)\le F(b)-F(a)\le U(P)\) for all \(P\) \(\Rightarrow\) it equals \(\int_a^b f\).`,
        String.raw`Any antiderivative works: two differ by a constant, which cancels in \(F(b)-F(a)\).`,
      ],
      pitfalls: [
        String.raw`The points \(\xi_i\) come from the MVT and depend on the partition: say so, do not claim you can choose them freely.`,
        String.raw`You need \(f\) integrable (continuous is enough) <i>and</i> \(F'=f\) everywhere on \([a,b]\). Without integrability the formula can fail.`,
        String.raw`Do not confuse part 1 (\(F=\int f\) is differentiable and \(F'=f\)) with part 2 (evaluate \(\int f\) using any antiderivative).`,
      ],
    },
  });
})(window.ML);
