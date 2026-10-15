"use strict";
/* Infinitesimal Calculus 2 · Taylor & approximation (single variable). */
(function (ML) {
  const C = ML.C;
  const fact = (k) => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };

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
  const setRange = (sl, [lo, hi]) => { sl.input.min = lo; sl.input.max = hi; };

  /* ================================================================== */
  /* 1 · Taylor with the Lagrange remainder                              */
  /* ================================================================== */
  const FN1 = [
    { name: "eˣ", f: Math.exp, d: (k, t) => Math.exp(t), vx: [-3.2, 3.2], vy: [-2, 9], gx: 1, gy: 2, dom: [-3, 3], ar: [-2, 2], a0: 0, x0: 1.5 },
    { name: "sin x", f: Math.sin, d: (k, t) => Math.sin(t + k * Math.PI / 2), vx: [-7, 7], vy: [-3.5, 3.5], gx: 1, gy: 1, dom: [-6.5, 6.5], ar: [-3, 3], a0: 0, x0: 3 },
    { name: "cos x", f: Math.cos, d: (k, t) => Math.cos(t + k * Math.PI / 2), vx: [-7, 7], vy: [-3.5, 3.5], gx: 1, gy: 1, dom: [-6.5, 6.5], ar: [-3, 3], a0: 0, x0: 3 },
    { name: "ln(1+x)", f: (x) => Math.log(1 + x), d: (k, t) => (k === 0 ? Math.log(1 + t) : (k % 2 ? 1 : -1) * fact(k - 1) / Math.pow(1 + t, k)), vx: [-1, 3.2], vy: [-4, 3], gx: 0.5, gy: 1, dom: [-0.9, 3], ar: [-0.8, 2], a0: 0, x0: 1.2 },
    { name: "1/(1−x)", f: (x) => 1 / (1 - x), d: (k, t) => fact(k) / Math.pow(1 - t, k + 1), vx: [-3.2, 1], vy: [-1, 10], gx: 0.5, gy: 2, dom: [-3, 0.9], ar: [-2, 0.8], a0: 0, x0: 0.7 },
  ];

  ML.register({
    id: "taylor-lagrange-remainder",
    course: "infi2",
    topic: "taylor",
    title: "Taylor's theorem with the Lagrange remainder",
    blurb: "f(x) = Pₙ(x) + f⁽ⁿ⁺¹⁾(ξ)(x−a)ⁿ⁺¹/(n+1)!, proved by applying Rolle's theorem to an auxiliary function.",
    statement: String.raw`Let \(f\) have \(n+1\) derivatives on an open interval \(I\) containing \(a\) and \(x\). Then there exists \(\xi\) strictly between \(a\) and \(x\) such that
\(\displaystyle f(x)=\sum_{k=0}^{n}\frac{f^{(k)}(a)}{k!}(x-a)^k+\frac{f^{(n+1)}(\xi)}{(n+1)!}(x-a)^{n+1}.\)`,
    shows: String.raw`The function \(f\) (blue), its Taylor polynomial \(P_n\) at \(a\) (gold), and the gap \(R_n(x)=f(x)-P_n(x)\) at the point \(x\). The bottom graph is the auxiliary function \(g(t)\) from the proof. Use the buttons under the steps to see each step on its own.`,
    vizIntro: String.raw`<b>Choose a function, move \(a\), \(x\) and the degree \(n\).</b> The orange bar is the Lagrange bound on the gap; the true gap always fits inside it. The bottom graph is \(g(t)\), which is zero at both \(t=a\) and \(t=x\), so Rolle's theorem gives a horizontal tangent at some \(\xi\).`,

    viz(box) {
      const st = ML.stage(box, { x: FN1[0].vx, y: FN1[0].vy, equal: false, aspect: "4 / 3" });
      const S = { fi: 0, a: 0, x: 1.5, n: 3, focus: -1 };
      const F = () => FN1[S.fi];
      let aS, xS, nS;
      const setFn = (i) => {
        S.fi = i; const f = FN1[i];
        st.view.o.x = f.vx; st.view.o.y = f.vy;
        setRange(aS, f.ar); setRange(xS, f.dom);
        S.a = f.a0; S.x = f.x0; aS.set(S.a); xS.set(S.x); st.redraw();
      };
      ML.select(st.panel, { label: "Function f", options: FN1.map((f, i) => [i, f.name]), onChange: (v) => setFn(+v) });
      aS = ML.slider(st.panel, { label: "center a", min: -2, max: 2, step: 0.05, value: 0, onInput: (v) => { S.a = v; st.redraw(); } });
      xS = ML.slider(st.panel, { label: "point x", min: -3, max: 3, step: 0.05, value: 1.5, onInput: (v) => { S.x = v; st.redraw(); } });
      nS = ML.slider(st.panel, { label: "degree n", min: 0, max: 10, step: 1, value: 3, onInput: (v) => { S.n = v; st.redraw(); } });
      let tAcc = 0;
      const anim = ML.loop(st, (dt) => {
        tAcc += dt;
        if (tAcc > 0.9) { tAcc = 0; if (S.n >= 10) { playBtn.textContent = "▶ Add terms"; return false; } S.n++; nS.set(S.n); }
      });
      const playBtn = ML.button(st.panel, "▶ Add terms", () => {
        if (anim.running) { anim.stop(); playBtn.textContent = "▶ Add terms"; } else { if (S.n >= 10) { S.n = 0; nS.set(0); } anim.start(); playBtn.textContent = "⏸ Pause"; }
      });
      const graph = st.extra({ height: 160 });
      const out = ML.readout(st.panel);

      function calc() {
        const f = F(), a = S.a, x = S.x, n = S.n;
        const P = (t) => { let s = 0; for (let k = 0; k <= n; k++) s += f.d(k, a) * Math.pow(t - a, k) / fact(k); return s; };
        const fx = f.f(x), Px = P(x), R = fx - Px, dx = x - a, deg = Math.abs(dx) < 1e-9;
        const K = deg ? 0 : R / Math.pow(dx, n + 1);
        const lo = Math.min(a, x), hi = Math.max(a, x);
        let M = 0;
        for (let i = 0; i <= 200; i++) M = Math.max(M, Math.abs(f.d(n + 1, lo + (hi - lo) * i / 200)));
        const B = M * Math.pow(Math.abs(dx), n + 1) / fact(n + 1);
        // xi: the point with f^(n+1)(xi) = (n+1)! K
        const target = fact(n + 1) * K, h = (t) => f.d(n + 1, t) - target;
        let xi = (lo + hi) / 2;
        if (!deg) {
          let found = false, best = Infinity;
          const N = 400;
          for (let i = 0; i < N && !found; i++) {
            const t0 = lo + (hi - lo) * i / N, t1 = lo + (hi - lo) * (i + 1) / N, h0 = h(t0), h1 = h(t1);
            if (Math.abs(h0) < best) { best = Math.abs(h0); xi = t0; }
            if (h0 === 0) { xi = t0; found = true; } else if (h0 * h1 < 0) {
              let p = t0, q = t1;
              for (let it = 0; it < 60; it++) { const m = (p + q) / 2; (h(p) * h(m) <= 0) ? (q = m) : (p = m); }
              xi = (p + q) / 2; found = true;
            }
          }
        }
        const g = (t) => { let s = fx; for (let k = 0; k <= n; k++) s -= f.d(k, t) * Math.pow(x - t, k) / fact(k); return s - K * Math.pow(x - t, n + 1); };
        const gp = (t) => Math.pow(x - t, n) * ((n + 1) * K - f.d(n + 1, t) / fact(n));
        return { f, a, x, n, P, fx, Px, R, dx, deg, K, lo, hi, M, B, xi, g, gp, target };
      }

      st.draw((v) => {
        const c = calc(), f = c.f, [[xa, ya], [xb, yb]] = v.visible();
        grid2(v, f.gx, f.gy); v.axes(); ticks(v, f.gx, f.gy);
        v.plot(f.f, xa, xb, C.blue, 2.5, 500);
        v.plot(c.P, xa, xb, C.gold, 2.5, 500);
        v.line(c.a, ya, c.a, yb, C.dim, 1, [4, 4]); v.text("a", c.a, yb, C.dim, 4, 14);
        v.line(c.x, ya, c.x, yb, C.dim, 1, [4, 4]); v.text("x", c.x, yb, C.dim, 4, 14);
        v.text("f", xa, yb, C.blue, 8, 16); v.text("Pₙ", xa, yb, C.gold, 26, 16);
        if (!c.deg && Number.isFinite(c.fx)) {
          const thick = S.focus === 0 || S.focus === 4;
          v.line(c.x, c.Px, c.x, c.fx, C.white, thick ? 6 : 3);
          v.dot(c.x, c.fx, C.blue, 5); v.dot(c.x, c.Px, C.gold, 5);
          v.text("Rₙ(x)", c.x, (c.fx + c.Px) / 2, C.white, 8, 4, "700 12px system-ui");
          // Lagrange bound bar next to the gap
          const off = (xb - xa) * 0.018, Bc = Math.min(c.B, (yb - ya) * 3), bw = S.focus === 5 ? 5 : 3;
          v.line(c.x + off, c.Px - Bc, c.x + off, c.Px + Bc, C.orange, bw);
          v.line(c.x + off * 0.4, c.Px - Bc, c.x + off * 1.6, c.Px - Bc, C.orange, bw);
          v.line(c.x + off * 0.4, c.Px + Bc, c.x + off * 1.6, c.Px + Bc, C.orange, bw);
          if (S.focus === 5) v.text("bound ± M|x−a|ⁿ⁺¹/(n+1)!", c.x + off, c.Px + Bc, C.orange, -8, -6, "700 11px system-ui", "right");
          if (S.focus === 3 || S.focus === 4) {
            v.line(c.xi, ya, c.xi, yb, C.green, 2, [6, 4]); v.text("ξ", c.xi, yb, C.green, 4, 28, "700 14px system-ui");
            v.dot(c.xi, f.f(c.xi), C.green, 5);
          }
        }
        v.dot(c.a, f.f(c.a), C.white, 5, C.bg);
      });

      graph.draw((g) => {
        const c = calc();
        if (c.deg) { g.o.x = [0, 1]; g.o.y = [-1, 1]; g.begin(); g.text("choose x ≠ a", 0.5, 0, C.dim, 0, 0, "600 13px system-ui", "center"); return; }
        const N = 160, vals = [];
        for (let i = 0; i <= N; i++) vals.push(c.g(c.lo + (c.hi - c.lo) * i / N));
        let mn = Math.min(0, ...vals), mx = Math.max(0, ...vals);
        if (!Number.isFinite(mn) || !Number.isFinite(mx)) return;
        let pad = (mx - mn) * 0.15 || 0.1;
        const wd = (c.hi - c.lo) * 0.06;
        g.o.x = [c.lo - wd, c.hi + wd]; g.o.y = [mn - pad, mx + pad]; g.begin();
        g.grid((c.hi - c.lo) / 4 || 1, "rgba(58,66,117,.35)"); g.axes();
        g.plot(c.g, c.lo, c.hi, C.cyan, 2.5, 200);
        if (S.focus === 2) {
          let gm = 0; for (let i = 0; i <= N; i++) gm = Math.max(gm, Math.abs(c.gp(c.lo + (c.hi - c.lo) * i / N)));
          const sc = gm > 1e-12 ? Math.max(Math.abs(mn), Math.abs(mx), 1e-9) / gm : 1;
          g.plot((t) => c.gp(t) * sc, c.lo, c.hi, C.purple, 2, 200, [6, 4]);
          g.text("g′(t) (own scale) = (x−t)ⁿ[(n+1)K − f⁽ⁿ⁺¹⁾(t)/n!]", c.lo, mx + pad * 0.5, C.purple, 4, 0, "600 11px system-ui");
        }
        g.dot(c.a, 0, C.white, 5); g.dot(c.x, 0, C.white, 5);
        const emph = S.focus === 1;
        g.text("g(a)=0", c.a, 0, emph ? C.yellow : C.dim, c.a < c.x ? 4 : -4, -8, (emph ? "700 " : "600 ") + "11px system-ui", c.a < c.x ? "left" : "right");
        g.text("g(x)=0", c.x, 0, emph ? C.yellow : C.dim, c.a < c.x ? -4 : 4, -8, (emph ? "700 " : "600 ") + "11px system-ui", c.a < c.x ? "right" : "left");
        if (emph) { g.dot(c.a, 0, "rgba(255,243,107,.2)", 11, C.yellow); g.dot(c.x, 0, "rgba(255,243,107,.2)", 11, C.yellow); }
        if (S.focus === 3 || S.focus === 4) {
          const gv = c.g(c.xi);
          g.line(c.xi, mn - pad, c.xi, mx + pad, C.green, 1.5, [6, 4]);
          g.line(c.xi - (c.hi - c.lo) * 0.12, gv, c.xi + (c.hi - c.lo) * 0.12, gv, C.green, 3);
          g.dot(c.xi, gv, C.green, 5);
          g.text("ξ: g′(ξ)=0", c.xi, gv, C.green, 6, -8, "700 12px system-ui");
        }
        g.text("g(t) from the proof", c.lo - wd, mx + pad, C.cyan, 6, 13, "600 11px system-ui");
      });

      st.after = () => {
        const c = calc(), ok = Math.abs(c.R) <= c.B + 1e-9;
        const check = c.deg ? "" : c.f.d(c.n + 1, c.xi) * Math.pow(c.dx, c.n + 1) / fact(c.n + 1);
        out([
          ["f(x)", ML.fmt(c.fx, 5)],
          ["Pₙ(x)", ML.fmt(c.Px, 5)],
          ["gap Rₙ(x)", ML.fmt(c.R, 6)],
          ["M = max |f⁽ⁿ⁺¹⁾|", ML.fmt(c.M, 4) + " on [a, x]"],
          ["bound", ML.fmt(c.B, 6) + `  <span class="${ok ? "ok" : "no"}">${ok ? "|Rₙ| ≤ bound ✓" : "violated"}</span>`],
          ["ξ", c.deg ? "–" : ML.fmt(c.xi, 4)],
          ["f⁽ⁿ⁺¹⁾(ξ)(x−a)ⁿ⁺¹/(n+1)!", check === "" ? "–" : ML.fmt(check, 6) + "  (equals the gap)"],
        ], c.deg ? "x = a: the formula reads f(a) = f(a)." : "The last two rows agree: that is the theorem.");
      };

      setFn(0);
      return { showStep(i) { S.focus = i; anim.stop(); playBtn.textContent = "▶ Add terms"; st.redraw(); } };
    },

    idea: String.raw`Build \(g(t)=f(x)-\sum_{k\le n}\frac{f^{(k)}(t)}{k!}(x-t)^k-K(x-t)^{n+1}\), with \(K\) chosen so that \(g(a)=0\). Also \(g(x)=0\), and \(g'\) telescopes to one clean term. Rolle then gives \(\xi\).`,
    steps: [
      { fig: String.raw`The gap \(R_n(x)=f(x)-P_n(x)\) at the chosen point \(x\) (thick white segment between the two curves). \(K\) is this gap divided by \((x-a)^{n+1}\).`,
        t: String.raw`Fix \(x\ne a\) and define the number \(K\) by \(f(x)=P_n(x)+K(x-a)^{n+1}\).`,
        d: String.raw`This is always possible: \(K=\dfrac{f(x)-P_n(x)}{(x-a)^{n+1}}\). We must show \(K=\dfrac{f^{(n+1)}(\xi)}{(n+1)!}\) for some \(\xi\) between \(a\) and \(x\).` },
      { fig: String.raw`The auxiliary function \(g(t)\) (bottom graph) on the interval between \(a\) and \(x\): it is zero at <b>both</b> endpoints, \(g(a)=0\) and \(g(x)=0\) (circled).`,
        t: String.raw`Define \(g(t)=f(x)-\sum_{k=0}^{n}\frac{f^{(k)}(t)}{k!}(x-t)^k-K(x-t)^{n+1}\) and check \(g(a)=g(x)=0\).`,
        d: String.raw`At \(t=x\) every term with \(k\ge1\) and the \(K\)-term contain \((x-t)^k=0\), leaving \(f(x)-f(x)=0\). At \(t=a\) we get \(f(x)-P_n(x)-K(x-a)^{n+1}=0\) by the choice of \(K\).` },
      { fig: String.raw`The derivative \(g'(t)\) (purple dashed, drawn on its own vertical scale) next to \(g(t)\): after the telescoping only one term of \(g'\) survives.`,
        t: String.raw`Differentiate \(g\): the sum telescopes.`,
        d: String.raw`\(\dfrac{d}{dt}\Big[\dfrac{f^{(k)}(t)}{k!}(x-t)^k\Big]=\dfrac{f^{(k+1)}(t)}{k!}(x-t)^k-\dfrac{f^{(k)}(t)}{(k-1)!}(x-t)^{k-1}\). Summing over \(k=0..n\) leaves \(\dfrac{f^{(n+1)}(t)}{n!}(x-t)^n\). Hence \(g'(t)=(x-t)^n\Big[(n+1)K-\dfrac{f^{(n+1)}(t)}{n!}\Big].\)` },
      { fig: String.raw`Rolle: \(g\) has a horizontal tangent at a point \(\xi\) strictly between \(a\) and \(x\) (green, bottom). The same \(\xi\) is marked on the graph of \(f\) (green dashed line, top).`,
        t: String.raw`Apply Rolle's theorem to \(g\) on the closed interval between \(a\) and \(x\).`,
        d: String.raw`\(g\) is continuous there and differentiable inside, and \(g(a)=g(x)=0\). So there is \(\xi\) strictly between \(a\) and \(x\) with \(g'(\xi)=0\).` },
      { fig: String.raw`At \(\xi\): the number \(\dfrac{f^{(n+1)}(\xi)}{(n+1)!}(x-a)^{n+1}\) (last row of the table) equals the gap \(R_n(x)\) (white segment).`,
        t: String.raw`Solve \(g'(\xi)=0\) for \(K\).`,
        d: String.raw`Since \(\xi\ne x\), \((x-\xi)^n\ne0\), so \((n+1)K=\dfrac{f^{(n+1)}(\xi)}{n!}\), i.e. \(K=\dfrac{f^{(n+1)}(\xi)}{(n+1)!}\). Substituting into the definition of \(K\) gives the theorem. \(\blacksquare\)` },
      { fig: String.raw`Corollary: the orange bar around \(P_n(x)\) has half-length \(M|x-a|^{n+1}/(n+1)!\), where \(M\) is the maximum of \(|f^{(n+1)}|\) between \(a\) and \(x\). The true gap always fits inside.`,
        t: String.raw`Corollary (error estimate).`,
        d: String.raw`If \(|f^{(n+1)}|\le M\) between \(a\) and \(x\), then \(|f(x)-P_n(x)|\le \dfrac{M|x-a|^{n+1}}{(n+1)!}\).` },
    ],
    memorize: {
      formula: String.raw`f(x)=P_n(x)+\frac{f^{(n+1)}(\xi)}{(n+1)!}(x-a)^{n+1},\qquad |R_n(x)|\le\frac{M|x-a|^{n+1}}{(n+1)!}`,
      bullets: [
        String.raw`Trick: \(g(t)=f(x)-\sum_{k\le n}\frac{f^{(k)}(t)}{k!}(x-t)^k-K(x-t)^{n+1}\) has \(g(a)=g(x)=0\) and a telescoping derivative.`,
        String.raw`For \(n=0\) this is exactly the Mean Value Theorem, so Taylor's theorem is the "higher-order MVT".`,
        String.raw`To bound the error: find \(M=\sup|f^{(n+1)}|\) between \(a\) and \(x\), then plug in.`,
      ],
      pitfalls: [
        String.raw`\(\xi\) depends on \(x\), \(a\) and \(n\). It is not a fixed point and you cannot compute it, only locate it between \(a\) and \(x\).`,
        String.raw`\(M\) is a maximum over the <i>whole</i> interval between \(a\) and \(x\), not just the value at \(x\).`,
        String.raw`You need \(f^{(n+1)}\) to exist on the open interval and \(f^{(n)}\) continuous on the closed one, otherwise Rolle fails.`,
      ],
    },
  });

  /* ================================================================== */
  /* 2 · Peano remainder and uniqueness                                  */
  /* ================================================================== */
  const FN2 = [
    { name: "eˣ", f: Math.exp, c: (k) => 1 / fact(k), wmax: 1.5 },
    { name: "sin x", f: Math.sin, c: (k) => (k % 2 ? (((k - 1) / 2) % 2 ? -1 : 1) / fact(k) : 0), wmax: 1.5 },
    { name: "cos x", f: Math.cos, c: (k) => (k % 2 ? 0 : ((k / 2) % 2 ? -1 : 1) / fact(k)), wmax: 1.5 },
    { name: "ln(1+x)", f: (x) => Math.log(1 + x), c: (k) => (k === 0 ? 0 : (k % 2 ? 1 : -1) / k), wmax: 0.9 },
  ];

  ML.register({
    id: "taylor-peano-uniqueness",
    course: "infi2",
    topic: "taylor",
    title: "Peano remainder and uniqueness of the Taylor polynomial",
    blurb: "f(x) = Pₙ(x) + o((x−a)ⁿ), and no other polynomial of degree ≤ n has this property.",
    statement: String.raw`Let \(f\) be \(n\) times differentiable at \(a\) and let \(P_n\) be its Taylor polynomial at \(a\). Then
(1) \(f(x)=P_n(x)+o\big((x-a)^n\big)\) as \(x\to a\);
(2) if \(Q\) is a polynomial of degree \(\le n\) with \(f(x)=Q(x)+o\big((x-a)^n\big)\), then \(Q=P_n\).`,
    shows: String.raw`Near \(a=0\): the function \(f\) (blue), the approximating polynomial (gold), and the ratio \(|f-\text{approx}|/|x|^n\) (bottom graph). Zooming in drives the ratio to \(0\) for the Taylor polynomial but not for a perturbed polynomial.`,
    vizIntro: String.raw`<b>Zoom in toward \(a=0\)</b> with the window slider or the play button and watch the bottom graph. With \(P_n\) the ratio dives to \(0\). Switch to the perturbed polynomial \(Q=P_n+\delta x^k\): the ratio now stays away from \(0\) (it tends to \(|\delta|\) for \(k=n\) and blows up for \(k\lt n\)).`,

    viz(box) {
      const st = ML.stage(box, { x: [-1, 1], y: [-1, 1], equal: false, aspect: "4 / 3" });
      const S = { fi: 0, n: 3, e: 0.2, mode: 0, k: 3, delta: 0.5, focus: -1 };
      const F = () => FN2[S.fi];
      const w = () => Math.min(Math.pow(10, S.e), F().wmax);
      const P = (x) => { let s = 0; for (let k = 0; k <= S.n; k++) s += F().c(k) * Math.pow(x, k); return s; };
      const A = (x) => P(x) + (S.mode === 1 ? S.delta * Math.pow(x, S.k) : 0);
      const ratio = (x) => (Math.abs(x) < 1e-12 ? NaN : Math.abs(F().f(x) - A(x)) / Math.pow(Math.abs(x), S.n));

      ML.select(st.panel, { label: "Function f (a = 0)", options: FN2.map((f, i) => [i, f.name]), onChange: (v) => { S.fi = +v; st.redraw(); } });
      const nS = ML.slider(st.panel, { label: "degree n", min: 1, max: 5, step: 1, value: 3, onInput: (v) => { S.n = v; if (S.k > v) { S.k = v; kS.set(v); } kS.input.max = v; st.redraw(); } });
      const eS = ML.slider(st.panel, { label: "window half-width w", min: -2, max: 0.3, step: 0.01, value: 0.2, fmt: (v) => ML.fmt(Math.pow(10, v), 3), onInput: (v) => { S.e = v; st.redraw(); } });
      const modeSel = ML.select(st.panel, { label: "Approximating polynomial", options: [[0, "Taylor polynomial Pₙ"], [1, "Perturbed Q = Pₙ + δ·xᵏ"]], onChange: (v) => { S.mode = +v; st.redraw(); } });
      const kS = ML.slider(st.panel, { label: "power k of the perturbation", min: 0, max: 5, step: 1, value: 3, onInput: (v) => { S.k = v; st.redraw(); } });
      const dS = ML.slider(st.panel, { label: "size δ of the perturbation", min: -1, max: 1, step: 0.05, value: 0.5, onInput: (v) => { S.delta = v; st.redraw(); } });
      kS.input.max = S.n;
      const zoom = ML.loop(st, (dt) => {
        S.e = Math.max(-2, S.e - dt * 0.45); eS.set(S.e);
        if (S.e <= -2) { zbtn.textContent = "▶ Zoom in toward a"; return false; }
      });
      const zbtn = ML.button(st.panel, "▶ Zoom in toward a", () => {
        if (zoom.running) { zoom.stop(); zbtn.textContent = "▶ Zoom in toward a"; }
        else { if (S.e <= -1.99) { S.e = 0.3; eS.set(0.3); } zoom.start(); zbtn.textContent = "⏸ Pause"; }
      });
      const graph = st.extra({ height: 150 });
      const out = ML.readout(st.panel);
      const setMode = (m) => { S.mode = m; modeSel.value = String(m); };

      st.draw((v) => {
        const W = w(), f = F();
        let mn = Infinity, mx = -Infinity;
        for (let i = 0; i <= 120; i++) { const x = -W + 2 * W * i / 120, a = f.f(x), b = A(x); [a, b].forEach((q) => { if (Number.isFinite(q)) { mn = Math.min(mn, q); mx = Math.max(mx, q); } }); }
        if (!(mx > mn)) { mn -= 1; mx += 1; }
        const pad = (mx - mn) * 0.15;
        v.o.x = [-W, W]; v.o.y = [mn - pad, mx + pad]; v.begin();
        const sx = W / 2, sy = (mx - mn) / 4;
        grid2(v, sx, sy); v.axes(); ticks(v, sx, sy);
        if (S.focus === 0) {   // shade the gap r(x) = f - P_n
          const pts = []; for (let i = 0; i <= 80; i++) { const x = -W + 2 * W * i / 80; pts.push([x, f.f(x)]); }
          for (let i = 80; i >= 0; i--) { const x = -W + 2 * W * i / 80; pts.push([x, A(x)]); }
          v.poly(pts, "rgba(255,255,255,.35)", null);
          v.text("gap r(x) = f(x) − Pₙ(x)", 0, mx + pad * 0.6, C.white, 0, 0, "700 12px system-ui", "center");
        }
        v.plot(f.f, -W, W, C.blue, 2.5, 300);
        v.plot(A, -W, W, C.gold, 2.5, 300, S.mode === 1 ? [7, 4] : null);
        v.dot(0, f.f(0), C.white, 5, C.bg); v.text("a = 0", 0, v.visible()[0][1], C.dim, 4, -4, "11px system-ui");
        v.text("f", -W, mx + pad, C.blue, 8, 16); v.text(S.mode === 1 ? "Q" : "Pₙ", -W, mx + pad, C.gold, 26, 16);
        v.text(`window |x| ≤ ${ML.fmt(W, 3)}`, W, mx + pad, C.dim, -8, 16, "11px system-ui", "right");
      });

      graph.draw((g) => {
        const W = w(), N = 300, vals = [];
        for (let i = 0; i <= N; i++) { const x = -W + 2 * W * i / N, r = ratio(x); if (Number.isFinite(r)) vals.push(r); }
        let top = Math.max(0.05, ...vals) * 1.15, clipped = false;
        if (top > 8) { top = 8; clipped = true; }
        g.o.x = [-W, W]; g.o.y = [-top * 0.1, top]; g.begin();
        g.grid(W / 2, "rgba(58,66,117,.35)"); g.axes();
        g.path((t) => { const x = -W + 2 * W * t; return Math.abs(x) < 1e-12 ? null : [x, Math.min(ratio(x), top * 1.5)]; }, 0, 1, C.cyan, 2.5, N);
        const lim = S.mode === 0 ? 0 : (S.k === S.n ? Math.abs(S.delta) : Infinity);
        if (Number.isFinite(lim)) { g.line(-W, lim, W, lim, C.green, 1.5, [6, 4]); g.text(S.mode === 0 || lim === 0 ? "limit 0" : `limit |δ| = ${ML.fmt(lim, 2)}`, -W, lim, C.green, 6, -6, "700 11px system-ui"); }
        else g.text("→ ∞ as x → 0", 0, top * 0.7, C.red, 0, 0, "700 12px system-ui", "center");
        g.text("|f(x) − approx(x)| / |x|ⁿ", W, top, C.cyan, -4, 12, "600 11px system-ui", "right");
        if (clipped) g.text("(clipped)", -W, top, C.dim, 4, 12, "11px system-ui");
        g.dot(0, 0, C.white, 4);
      });

      st.after = () => {
        const W = w(); let mx = 0;
        for (let i = 1; i <= 200; i++) { const x = W * i / 200, r1 = ratio(x), r2 = ratio(-x); if (Number.isFinite(r1)) mx = Math.max(mx, r1); if (Number.isFinite(r2)) mx = Math.max(mx, r2); }
        out([
          ["window", `|x| ≤ ${ML.fmt(W, 3)}`],
          ["approximation", S.mode === 0 ? "Taylor polynomial Pₙ" : `Pₙ + ${ML.fmt(S.delta, 2)}·x^${S.k}`],
          ["max of ratio on window", ML.fmt(mx, 5)],
        ], S.mode === 0 ? "For Pₙ the maximum shrinks to 0 as the window shrinks." : (S.k === S.n ? "The ratio stays near |δ| ≠ 0: Q is not a valid approximation of order n." : "The ratio explodes as the window shrinks: Q is far worse than order n."));
      };

      return {
        showStep(i) {
          zoom.stop(); zbtn.textContent = "▶ Zoom in toward a"; S.focus = i;
          if (i === 0) { setMode(0); }
          if (i === 1 || i === 2) { setMode(0); S.e = 0.3; eS.set(0.3); zoom.start(); zbtn.textContent = "⏸ Pause"; }
          if (i === 3) { setMode(1); S.k = S.n; kS.set(S.n); S.delta = 0.5; dS.set(0.5); S.e = -1.2; eS.set(-1.2); }
          if (i === 4) { setMode(1); S.k = Math.max(0, S.n - 1); kS.set(S.k); S.delta = 0.5; dS.set(0.5); S.e = -1.2; eS.set(-1.2); }
          st.redraw();
        },
      };
    },

    idea: String.raw`Part (1): the remainder \(r=f-P_n\) has \(r(a)=\dots=r^{(n)}(a)=0\), so \(n-1\) applications of L'Hôpital leave the definition of \(r^{(n)}(a)\). Part (2): the difference of two such polynomials is a polynomial that is \(o((x-a)^n)\); its lowest non-zero term would dominate, a contradiction.`,
    steps: [
      { fig: String.raw`The gap \(r(x)=f(x)-P_n(x)\) (white fill) near \(a=0\): the two curves agree so closely that the gap is invisible except far from \(a\). This reflects \(r(a)=r'(a)=\dots=r^{(n)}(a)=0\).`,
        t: String.raw`Let \(r=f-P_n\). Then \(r(a)=r'(a)=\dots=r^{(n)}(a)=0\).`,
        d: String.raw`By construction \(P_n^{(k)}(a)=f^{(k)}(a)\) for \(k=0,\dots,n\).` },
      { fig: String.raw`The ratio \(r(x)/(x-a)^n\) (bottom) while the window shrinks (animation): it is driven to \(0\). The \(n-1\) L'Hôpital steps are what justify this.`,
        t: String.raw`Apply L'Hôpital's rule \(n-1\) times to \(\dfrac{r(x)}{(x-a)^n}\).`,
        d: String.raw`At each step numerator and denominator tend to \(0\) as \(x\to a\), and the next quotient has a limit: \(\displaystyle \lim\frac{r(x)}{(x-a)^n}=\lim\frac{r'(x)}{n(x-a)^{n-1}}=\dots=\lim\frac{r^{(n-1)}(x)}{n!\,(x-a)}.\)` },
      { fig: String.raw`Same animation: the final quotient \(\dfrac{r^{(n-1)}(x)}{n!(x-a)}\) is exactly a difference quotient of \(r^{(n-1)}\) at \(a\), so its limit is \(r^{(n)}(a)/n!=0\).`,
        t: String.raw`The last quotient is the definition of a derivative.`,
        d: String.raw`Since \(r^{(n-1)}(a)=0\): \(\displaystyle\frac{r^{(n-1)}(x)}{n!(x-a)}=\frac1{n!}\cdot\frac{r^{(n-1)}(x)-r^{(n-1)}(a)}{x-a}\to\frac{r^{(n)}(a)}{n!}=0.\) This proves (1).` },
      { fig: String.raw`Part (2): the approximation is replaced by \(Q=P_n+\delta x^n\), another polynomial of degree \(\le n\). Its ratio (bottom) does <b>not</b> go to \(0\): it settles at \(|\delta|\).`,
        t: String.raw`Uniqueness: suppose \(Q\) also satisfies \(f=Q+o((x-a)^n)\). Put \(D=P_n-Q\).`,
        d: String.raw`\(D=(f-Q)-(f-P_n)=o((x-a)^n)\) as a difference of two such terms, and \(D(x)=\sum_{k=0}^{n}d_k(x-a)^k\) is a polynomial of degree \(\le n\).` },
      { fig: String.raw`The perturbation is moved to a lower power \(k\lt n\): the ratio now blows up near \(0\). The lowest non-zero term of \(D\) always dominates in this way.`,
        t: String.raw`If \(D\ne0\), let \(m\) be the smallest index with \(d_m\ne0\) (so \(m\le n\)). Contradiction.`,
        d: String.raw`Then \(\dfrac{D(x)}{(x-a)^m}\to d_m\ne0\). But \(\dfrac{D(x)}{(x-a)^m}=\dfrac{D(x)}{(x-a)^n}\,(x-a)^{n-m}\to 0\cdot 0=0\). So \(d_m=0\), a contradiction. Hence \(D\equiv0\) and \(Q=P_n\). \(\blacksquare\)` },
    ],
    memorize: {
      formula: String.raw`f(x)=\sum_{k=0}^{n}\frac{f^{(k)}(a)}{k!}(x-a)^k+o\big((x-a)^n\big)\quad(x\to a)`,
      bullets: [
        String.raw`Needs only that \(f^{(n)}(a)\) exists (a <i>local</i> statement: no estimate of the error size).`,
        String.raw`Proof of (1): \(r=f-P_n\) vanishes with all derivatives up to order \(n\) at \(a\), so L'Hôpital \(n-1\) times, then the definition of \(r^{(n)}(a)\).`,
        String.raw`Uniqueness: lowest non-zero coefficient of \(D=P_n-Q\) would dominate \(D(x)/(x-a)^m\).`,
        String.raw`Use it to compute limits and Taylor polynomials by substitution (e.g. \(\sin x=x-\frac{x^3}{6}+o(x^4)\)).`,
      ],
      pitfalls: [
        String.raw`The order is \(o((x-a)^n)\), not \(o((x-a)^{n+1})\), unless \(f^{(n+1)}(a)\) exists.`,
        String.raw`L'Hôpital needs each new quotient to have a limit. Say so, do not just differentiate numerator and denominator.`,
        String.raw`Uniqueness is among polynomials of degree \(\le n\) only. It says nothing about convergence of the full Taylor series.`,
      ],
    },
  });

  /* ================================================================== */
  /* 3 · Taylor series of e^x, sin x, cos x converge to the function     */
  /* ================================================================== */
  const NMAX = 30;
  const FN3 = [
    { name: "eˣ", f: Math.exp, c: (k) => 1 / fact(k), vx: [-4.3, 4.3], vy: [-3, 16], gx: 1, gy: 4, dom: [-4, 4], x0: 2, bound: (x, n) => Math.exp(Math.max(0, x)) * Math.pow(Math.abs(x), n + 1) / fact(n + 1), bname: "eˣ-bound: e^{max(0,x)}|x|ⁿ⁺¹/(n+1)!" },
    { name: "sin x", f: Math.sin, c: (k) => (k % 2 ? (((k - 1) / 2) % 2 ? -1 : 1) / fact(k) : 0), vx: [-7, 7], vy: [-4, 4], gx: 1, gy: 1, dom: [-6, 6], x0: 4, bound: (x, n) => Math.pow(Math.abs(x), n + 1) / fact(n + 1), bname: "|x|ⁿ⁺¹/(n+1)!" },
    { name: "cos x", f: Math.cos, c: (k) => (k % 2 ? 0 : ((k / 2) % 2 ? -1 : 1) / fact(k)), vx: [-7, 7], vy: [-4, 4], gx: 1, gy: 1, dom: [-6, 6], x0: 4, bound: (x, n) => Math.pow(Math.abs(x), n + 1) / fact(n + 1), bname: "|x|ⁿ⁺¹/(n+1)!" },
    { name: "ln(1+x)  (caution)", f: (x) => Math.log(1 + x), c: (k) => (k === 0 ? 0 : (k % 2 ? 1 : -1) / k), vx: [-1, 2.4], vy: [-4, 4], gx: 0.5, gy: 1, dom: [-0.9, 2], x0: 1.5, bound: null },
    { name: "e^(−1/x²)  (caution)", f: (x) => (x === 0 ? 0 : Math.exp(-1 / (x * x))), c: () => 0, vx: [-2.2, 2.2], vy: [-0.3, 1.3], gx: 0.5, gy: 0.5, dom: [-2, 2], x0: 1, bound: null },
  ];

  ML.register({
    id: "taylor-series-exp-sin",
    course: "infi2",
    topic: "taylor",
    title: "The Taylor series of eˣ, sin x, cos x converge to the function",
    blurb: "The remainder tends to 0 for every real x, because xⁿ/n! → 0. And why this fails for ln(1+x) and e^(−1/x²).",
    statement: String.raw`For every real \(x\):
\(\displaystyle e^x=\sum_{k=0}^{\infty}\frac{x^k}{k!},\qquad \sin x=\sum_{k=0}^{\infty}\frac{(-1)^kx^{2k+1}}{(2k+1)!},\qquad \cos x=\sum_{k=0}^{\infty}\frac{(-1)^kx^{2k}}{(2k)!}.\)`,
    shows: String.raw`Top: the function (blue) and its Taylor polynomial \(P_n\) (gold) at \(0\), with the point \(x\). Bottom: on a logarithmic scale, the true error \(|f(x)-P_n(x)|\) (gold dots) for every \(n\), under the Lagrange bound (blue). The error goes to \(0\) for \(e^x,\sin,\cos\) and does not for the two caution examples.`,
    vizIntro: String.raw`<b>Add terms with the slider or the play button</b> and watch \(P_n\) hug the curve over a larger and larger range. The bottom graph shows the error for every degree \(n\) at the current \(x\), on a log scale. Then try the two caution examples at the end of the list.`,

    viz(box) {
      const st = ML.stage(box, { x: FN3[0].vx, y: FN3[0].vy, equal: false, aspect: "4 / 3" });
      const S = { fi: 0, x: 2, n: 5, focus: -1 };
      const F = () => FN3[S.fi];
      const coefs = (f) => { const a = []; for (let k = 0; k <= NMAX; k++) a.push(f.c(k)); return a; };
      const Pn = (cs, n, x) => { let s = 0, p = 1; for (let k = 0; k <= n; k++) { s += cs[k] * p; p *= x; } return s; };
      let xS, nS;
      let fsel3;
      const setFn = (i) => {
        S.fi = i; const f = FN3[i]; st.view.o.x = f.vx; st.view.o.y = f.vy; if (fsel3) fsel3.value = String(i);
        setRange(xS, f.dom); S.x = f.x0; xS.set(S.x);
        if (i === 3) { S.x = 1.5; xS.set(1.5); }
        st.redraw();
      };
      fsel3 = ML.select(st.panel, { label: "Function f", options: FN3.map((f, i) => [i, f.name]), onChange: (v) => { setFn(+v); } });
      xS = ML.slider(st.panel, { label: "point x", min: -4, max: 4, step: 0.05, value: 2, onInput: (v) => { S.x = v; st.redraw(); } });
      nS = ML.slider(st.panel, { label: "degree n", min: 0, max: NMAX, step: 1, value: 5, onInput: (v) => { S.n = v; st.redraw(); } });
      let acc = 0;
      const anim = ML.loop(st, (dt) => {
        acc += dt;
        if (acc > 0.25) { acc = 0; if (S.n >= NMAX) { pbtn.textContent = "▶ Add terms"; return false; } S.n++; nS.set(S.n); }
      });
      const pbtn = ML.button(st.panel, "▶ Add terms", () => {
        if (anim.running) { anim.stop(); pbtn.textContent = "▶ Add terms"; }
        else { if (S.n >= NMAX) { S.n = 0; nS.set(0); } anim.start(); pbtn.textContent = "⏸ Pause"; }
      });
      const graph = st.extra({ height: 170 });
      const out = ML.readout(st.panel);

      const series = () => {
        const f = F(), cs = coefs(f), x = S.x, fx = f.f(x), err = [], bnd = [], lem = [];
        let s = 0, p = 1;
        for (let n = 0; n <= NMAX; n++) {
          s += cs[n] * p; p *= x;
          err.push(Math.abs(fx - s));
          bnd.push(f.bound ? f.bound(x, n) : null);
          lem.push(Math.pow(Math.abs(x), n) / fact(n));
        }
        return { f, cs, fx, err, bnd, lem };
      };

      st.draw((v) => {
        const { f, cs, fx } = series(), [[xa, ya], [xb, yb]] = v.visible(), rng = yb - ya;
        grid2(v, f.gx, f.gy); v.axes(); ticks(v, f.gx, f.gy);
        v.plot(f.f, xa, xb, C.blue, 2.5, 500);
        v.plot((t) => ML.clamp(Pn(cs, S.n, t), ya - 4 * rng, yb + 4 * rng), xa, xb, C.gold, 2.5, 600);
        v.line(S.x, ya, S.x, yb, C.dim, 1, [4, 4]); v.text("x", S.x, yb, C.dim, 4, 14);
        const Px = Pn(cs, S.n, S.x);
        v.dot(S.x, fx, C.blue, 5); v.dot(S.x, ML.clamp(Px, ya - rng, yb + rng), C.gold, 5);
        if (Math.abs(Px - fx) < 4 * rng) v.line(S.x, fx, S.x, Px, C.white, S.focus === 1 ? 6 : 3);
        if (S.focus === 1) v.text("Rₙ(x) = f(x) − Pₙ(x)", S.x, (fx + Px) / 2, C.white, 8, 4, "700 12px system-ui");
        v.text("f", xa, yb, C.blue, 8, 16); v.text("Pₙ", xa, yb, C.gold, 26, 16);
        v.text(`n = ${S.n}`, xb, yb, C.text, -8, 16, "700 12px system-ui", "right");
      });

      graph.draw((g) => {
        const { f, err, bnd, lem } = series(), lg = (q) => Math.log10(Math.max(q, 1e-16));
        let top = 1;
        err.forEach((q) => { top = Math.max(top, lg(q)); });
        bnd.forEach((q) => { if (q != null && Number.isFinite(q)) top = Math.max(top, lg(q)); });
        if (S.focus === 3) lem.forEach((q) => { top = Math.max(top, lg(q)); });
        top = Math.min(10, Math.ceil(top + 0.5));
        g.o.x = [-1, NMAX + 1]; g.o.y = [-16.5, top]; g.begin();
        for (let k = -15; k <= top; k += 3) { g.line(-1, k, NMAX + 1, k, "rgba(58,66,117,.4)", 1); g.text("1e" + k, -1, k, C.dim, 3, -3, "10px system-ui"); }
        g.line(S.n, -16.5, S.n, top, C.white, 1.5, [4, 4]);
        if (f.bound) {
          const th = S.focus === 2 || S.focus === 4 ? 3.5 : 2;
          g.path((n) => [n, lg(f.bound(S.x, n))], 0, NMAX, C.blue, th, NMAX, [6, 4]);
        }
        err.forEach((q, n) => g.dot(n, lg(q), C.gold, n === S.n ? 6 : 3.5));
        if (S.focus === 3) {
          lem.forEach((q, n) => g.dot(n, lg(q), C.purple, 3.5));
          const N0 = Math.ceil(2 * Math.abs(S.x)) || 1;
          if (N0 <= NMAX) {
            g.line(N0, -16.5, N0, top, C.purple, 1.5, [3, 3]); g.text("N > 2|x|", N0, top, C.purple, 4, 12, "700 11px system-ui");
            g.path((n) => (n < N0 ? null : [n, lg(Math.pow(Math.abs(S.x), N0) / fact(N0) * Math.pow(0.5, n - N0))]), N0, NMAX, C.green, 2, NMAX, [3, 3]);
            g.text("geometric majorant (½)ⁿ⁻ᴺ", NMAX, lg(Math.pow(Math.abs(S.x), N0) / fact(N0) * Math.pow(0.5, NMAX - N0)), C.green, -4, -8, "700 11px system-ui", "right");
          }
          g.text("purple: |x|ⁿ/n!", NMAX + 0.5, top, C.purple, -4, 12, "700 11px system-ui", "right");
        } else {
          g.text("gold: |f(x) − Pₙ(x)|" + (f.bound ? "    blue: Lagrange bound" : ""), NMAX + 0.5, top, C.text, -4, 12, "600 11px system-ui", "right");
        }
        g.text("degree n →", NMAX + 0.5, -16.5, C.dim, -4, -4, "10px system-ui", "right");
      });

      st.after = () => {
        const { f, cs, fx, err, bnd } = series(), e = err[S.n], b = bnd[S.n];
        out([
          ["f(x)", ML.fmt(fx, 6)],
          ["Pₙ(x)", ML.fmt(Pn(cs, S.n, S.x), 6)],
          ["error |f − Pₙ|", e < 1e-14 ? "≈ 0 (below 1e-14)" : ML.fmt(e, 8)],
          ["Lagrange bound", b == null ? "none (see note)" : ML.fmt(b, 8) + `  <span class="${e <= b * (1 + 1e-9) + 1e-14 ? "ok" : "no"}">✓ error ≤ bound</span>`],
        ], S.fi === 3 ? "ln(1+x) is only the sum of its Taylor series for −1 < x ≤ 1. At x = 1.5 the terms grow and the error explodes." :
           S.fi === 4 ? "All derivatives of e^(−1/x²) vanish at 0, so every Pₙ is the zero polynomial, yet f(x) ≠ 0. The series converges, to the wrong function." :
           "The error is below the bound, and the bound tends to 0 as n grows.");
      };

      setFn(0);
      return {
        showStep(i) {
          anim.stop(); pbtn.textContent = "▶ Add terms"; S.focus = i;
          if (i === 0) { setFn(0); S.n = 5; nS.set(5); }
          if (i === 3) { if (S.fi > 2) setFn(0); S.x = 4; xS.set(4); }
          if (i === 4) { S.n = 0; nS.set(0); acc = 0; anim.start(); pbtn.textContent = "⏸ Pause"; }
          if (i === 5) { setFn(3); S.n = 20; nS.set(20); }
          st.redraw();
        },
      };
    },

    idea: String.raw`The Lagrange remainder is at most \(\dfrac{e^{|x|}|x|^{n+1}}{(n+1)!}\) (or \(\dfrac{|x|^{n+1}}{(n+1)!}\) for sin, cos), and for fixed \(x\) the factorial beats the power: \(\dfrac{|x|^n}{n!}\to0\).`,
    steps: [
      { fig: String.raw`The Taylor polynomial \(P_5\) (gold) of the chosen function at \(0\), against the function (blue). The coefficients are \(f^{(k)}(0)/k!\).`,
        t: String.raw`Compute the Taylor polynomials at \(0\).`,
        d: String.raw`\((e^x)^{(k)}(0)=1\), and \(\sin\) has derivatives \(\sin,\cos,-\sin,-\cos\) at \(0\) equal to \(0,1,0,-1\) repeating (similarly for \(\cos\)). This gives the coefficients \(\frac1{k!}\), \(\frac{(-1)^k}{(2k+1)!}\), \(\frac{(-1)^k}{(2k)!}\).` },
      { fig: String.raw`The remainder \(R_n(x)=f(x)-P_n(x)\) at the chosen \(x\) (white segment between the curves).`,
        t: String.raw`Write the Lagrange remainder: \(R_n(x)=\dfrac{f^{(n+1)}(\xi)}{(n+1)!}x^{n+1}\) for some \(\xi\) between \(0\) and \(x\).`,
        d: String.raw`The series converges to \(f(x)\) exactly when \(R_n(x)\to0\) (because \(R_n=f-P_n\)).` },
      { fig: String.raw`The blue dashed line (bottom, log scale) is the bound; the gold dots (true errors) stay below it for every \(n\).`,
        t: String.raw`Bound the derivative at \(\xi\).`,
        d: String.raw`\(|\sin^{(n+1)}\xi|\le1\) and \(|\cos^{(n+1)}\xi|\le1\); \(e^{\xi}\le e^{|x|}\) since \(|\xi|\le|x|\). So \(|R_n(x)|\le\dfrac{e^{|x|}|x|^{n+1}}{(n+1)!}\) (just \(\dfrac{|x|^{n+1}}{(n+1)!}\) for sin and cos).` },
      { fig: String.raw`The lemma: the sequence \(|x|^n/n!\) (purple dots). Beyond \(N>2|x|\) it is below a geometric sequence with ratio \(\tfrac12\) (green dashed), so it tends to \(0\).`,
        t: String.raw`Lemma: for fixed \(x\), \(\dfrac{|x|^n}{n!}\to0\).`,
        d: String.raw`Fix \(N>2|x|\). For \(n>N\): \(\dfrac{|x|^n}{n!}=\dfrac{|x|^N}{N!}\cdot\dfrac{|x|}{N+1}\cdots\dfrac{|x|}{n}\le\dfrac{|x|^N}{N!}\Big(\dfrac12\Big)^{n-N}\to0.\)` },
      { fig: String.raw`Animation: adding terms (\(n\) increasing). The gold error dots fall below any level, squeezed to \(0\) by the bound.`,
        t: String.raw`Squeeze: \(R_n(x)\to0\), so \(P_n(x)\to f(x)\) for every real \(x\).`,
        d: String.raw`Since \(0\le|R_n(x)|\le\) (bound) \(\to0\) (the factor \(e^{|x|}\) does not depend on \(n\)), the Taylor series converges to \(f(x)\) at every real \(x\). \(\blacksquare\)` },
      { fig: String.raw`Caution: \(\ln(1+x)\) at \(x=1.5\) (outside \(-1\lt x\le1\)). The polynomial gets <i>worse</i> as \(n\) grows and the error dots rise. Switch to \(e^{-1/x^2}\) in the menu to see a series that converges to the wrong function.`,
        t: String.raw`Remark: convergence of the Taylor series to \(f\) is not automatic.`,
        d: String.raw`\(\ln(1+x)=\sum_{k\ge1}(-1)^{k-1}x^k/k\) only for \(-1\lt x\le1\). For \(f(x)=e^{-1/x^2}\), \(f(0)=0\), every derivative at \(0\) is \(0\), so the Taylor series is identically \(0\ne f\). Remainder estimates are exactly what rules these cases out.` },
    ],
    memorize: {
      formula: String.raw`|R_n(x)|\le\frac{e^{|x|}|x|^{n+1}}{(n+1)!}\xrightarrow[n\to\infty]{}0\quad\Longrightarrow\quad e^x=\sum_{k\ge0}\frac{x^k}{k!}`,
      bullets: [
        String.raw`Series converges to \(f\) \(\iff\) \(R_n(x)\to0\). Always prove this with the remainder.`,
        String.raw`\(e^x\): derivatives are all \(e^x\), bounded by \(e^{|x|}\) near \(0\). \(\sin,\cos\): derivatives bounded by \(1\).`,
        String.raw`Key lemma: \(x^n/n!\to0\) (compare with a geometric series after \(N>2|x|\)).`,
        String.raw`The series for \(\sin\) has only odd powers, for \(\cos\) only even powers.`,
      ],
      pitfalls: [
        String.raw`Do not claim "the Taylor series of \(f\) equals \(f\)" for a general smooth \(f\): \(e^{-1/x^2}\) is a counterexample.`,
        String.raw`Radius of convergence is not the same as the domain of \(f\): \(\ln(1+x)\) and \(\frac1{1+x^2}\) are defined far beyond their radius.`,
        String.raw`In the bound for \(e^x\), \(\xi\) is between \(0\) and \(x\), so \(e^\xi\le e^{\max(0,x)}\le e^{|x|}\); the bound must not depend on \(n\).`,
      ],
    },
  });
})(window.ML);
