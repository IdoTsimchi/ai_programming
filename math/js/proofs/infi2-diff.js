"use strict";
/* Infi 2 · Differentiability & the gradient (4 proofs). Structure follows linalg2-inner.js. */
(function (ML) {
  const C = ML.C, fmt = ML.fmt, clamp = ML.clamp;
  const SMALL = "11px system-ui, sans-serif", BOLD = "600 11px system-ui, sans-serif";

  /** Find s in [a,b] with fn(s)=0 (first sign change, else the point with smallest |fn|, ties toward the middle). */
  function findRoot(fn, a, b) {
    if (!(b > a)) return a;
    const N = 240, mid = (a + b) / 2;
    let best = mid, bestAbs = Infinity, sPrev = a, vPrev = fn(a);
    const consider = (s, v) => {
      const av = Math.abs(v);
      if (av < bestAbs - 1e-13 || (av <= bestAbs + 1e-13 && Math.abs(s - mid) < Math.abs(best - mid))) { bestAbs = av; best = s; }
    };
    if (Number.isFinite(vPrev)) consider(a, vPrev);
    for (let i = 1; i <= N; i++) {
      const s = a + (b - a) * i / N, v = fn(s);
      if (!Number.isFinite(v)) { vPrev = NaN; sPrev = s; continue; }
      consider(s, v);
      if (Number.isFinite(vPrev) && vPrev * v < 0) {
        let lo = sPrev, hi = s, vlo = vPrev;
        for (let k = 0; k < 50; k++) {
          const m = (lo + hi) / 2, vm = fn(m);
          if (vlo * vm <= 0) hi = m; else { lo = m; vlo = vm; }
        }
        return (lo + hi) / 2;
      }
      sPrev = s; vPrev = v;
    }
    return best;
  }

  /* ================================================================== */
  /* 1 · differentiable ⇒ continuous, partials exist, D_u f = ∇f·u        */
  /* ================================================================== */
  const F1 = [
    { name: "sin x · cos y  (smooth)", kind: "smooth", f: (x, y) => Math.sin(x) * Math.cos(y), start: [0.9, 0.5] },
    { name: "Two bumps  (smooth)", kind: "smooth", start: [0.6, -0.3],
      f: (x, y) => Math.exp(-(x * x + y * y) / 2) + 0.7 * Math.exp(-((x - 1.6) ** 2 + (y + 1.2) ** 2)) },
    { name: "Cone √(x²+y²)  (kink at 0)", kind: "cone", f: (x, y) => Math.hypot(x, y), start: [0, 0] },
    { name: "xy/(x²+y²)  (partials exist at 0, f not continuous)", kind: "disc", start: [0, 0],
      f: (x, y) => { const r = x * x + y * y; return r < 1e-300 ? 0 : x * y / r; } },
  ];

  ML.register({
    id: "differentiable-linear-approx",
    course: "infi2",
    topic: "diff",
    title: "Differentiable ⇒ continuous, and ∇f gives every directional derivative",
    blurb: "The definition of differentiability gives continuity, all directional derivatives, and the gradient formula.",
    statement: String.raw`Let \(f\) be differentiable at \(p\in\mathbb R^2\), i.e. there is \(a\in\mathbb R^2\) with \(\displaystyle\lim_{h\to 0}\frac{f(p+h)-f(p)-a\cdot h}{\|h\|}=0\). Then (i) \(f\) is continuous at \(p\); (ii) every directional derivative exists and \(D_uf(p)=a\cdot u\); in particular \(a=\nabla f(p)=(f_x(p),f_y(p))\), so \(D_uf(p)=\nabla f(p)\cdot u\).`,
    vizIntro: String.raw`<b>Drag p, turn the direction <span style="color:#fff36b">u</span>, and zoom in.</b> On the right the surface sliced along u (blue) and its tangent line (gold) merge as the window shrinks, and the error ratio \(\dfrac{|f(p+hu)-f(p)-h\,\nabla f\cdot u|}{h}\) falls to 0 in <i>every</i> direction. Now pick the last two functions (they start at the origin) and watch the ratio refuse to vanish.`,

    viz(box) {
      const st = ML.stage(box, { x: [-3, 3], y: [-3, 3] });
      const S = { p: { x: F1[0].start[0], y: F1[0].start[1] }, fi: 0, theta: 40, zoom: 0.3, heat: null };
      const cur = () => F1[S.fi];
      const buildHeat = () => { S.heat = ML.heatmap(cur().f, [-3, 3], [-3, 3], { n: 150, bands: 12 }); };
      buildHeat();
      const atOrigin = () => Math.hypot(S.p.x, S.p.y) < 1e-9;
      const dirU = () => [Math.cos(ML.rad(S.theta)), Math.sin(ML.rad(S.theta))];
      const W = () => Math.pow(10, -S.zoom);

      ML.select(st.panel, {
        label: "Function", options: F1.map((f, i) => [i, f.name]),
        onChange: (v) => { S.fi = +v; S.p.x = cur().start[0]; S.p.y = cur().start[1]; buildHeat(); st.redraw(); },
      });
      const thSl = ML.slider(st.panel, { label: "Direction u (angle)", min: 0, max: 359, step: 1, value: S.theta, fmt: (v) => v + "°", onInput: (v) => { S.theta = v; st.redraw(); } });
      ML.slider(st.panel, { label: "Zoom in around p", min: 0, max: 3, step: 0.01, value: S.zoom, fmt: (z) => "window ±" + ML.fmt(Math.pow(10, -z), 3), onInput: (z) => { S.zoom = z; st.redraw(); } });
      ML.button(st.panel, "Move p to the origin", () => { S.p.x = 0; S.p.y = 0; st.redraw(); });
      const slice = st.extra({ x: [-1, 1], y: [-1, 1], height: 150 });
      const errPlot = st.extra({ x: [0, 3], y: [0, 1], height: 140 });
      const out = ML.readout(st.panel);

      const grad = () => ML.num.grad(cur().f, S.p.x, S.p.y);

      st.draw((v) => {
        v.image(S.heat.canvas, -3, 3, -3, 3);
        v.axes("rgba(255,255,255,.22)");
        const { x, y } = S.p, u = dirU(), w = W(), [gx, gy] = grad(), gn = Math.hypot(gx, gy);
        v.circle(x, y, w, "rgba(255,255,255,.75)", null, 1.5, [4, 4]);
        v.line(x - u[0] * Math.max(w, 0.04), y - u[1] * Math.max(w, 0.04), x + u[0] * Math.max(w, 0.04), y + u[1] * Math.max(w, 0.04), C.yellow, 3);
        v.arrow(x, y, x + u[0] * 0.9, y + u[1] * 0.9, C.yellow, 3);
        if (gn > 1e-6) v.arrow(x, y, x + gx / gn * Math.min(1.4, 0.35 + 0.5 * gn), y + gy / gn * Math.min(1.4, 0.35 + 0.5 * gn), C.red, 3);
        v.text("u", x + u[0] * 0.9, y + u[1] * 0.9, C.yellow, 6, -6);
        if (gn > 1e-6) v.text("∇f", x + gx / gn * 0.6, y + gy / gn * 0.6, C.red, 8, 14);
        v.handle(x, y, C.white, "p");
      });

      slice.draw((g) => {
        const f = cur().f, { x, y } = S.p, u = dirU(), w = W(), [gx, gy] = grad(), D = gx * u[0] + gy * u[1], f0 = f(x, y), n = 240;
        let mn = f0, mx = f0;
        for (let i = 0; i <= n; i++) {
          const s = -w + 2 * w * i / n;
          if (Math.abs(s) < 1e-15) continue;
          const val = f(x + s * u[0], y + s * u[1]), lv = f0 + D * s;
          mn = Math.min(mn, val, lv); mx = Math.max(mx, val, lv);
        }
        const pad = Math.max((mx - mn) * 0.15, 1e-9);
        g.o.x = [-w, w]; g.o.y = [mn - pad, mx + pad]; g.begin();
        g.line(0, mn - pad, 0, mx + pad, C.axis, 1);
        g.path((s) => (Math.abs(s) < 1e-15 ? null : [s, f(x + s * u[0], y + s * u[1])]), -w, w, C.blue, 3, n);
        g.line(-w, f0 - D * w, w, f0 + D * w, C.gold, 2, [6, 5]);
        g.dot(0, f0, C.white, 5);
        g.text("slice f(p+s·u)  vs  tangent line", -w, mx + pad, C.text, 4, 13, BOLD);
      });

      errPlot.draw((g) => {
        const f = cur().f, { x, y } = S.p, [gx, gy] = grad(), f0 = f(x, y);
        const offs = [0, 72, 144, 216, 288], cols = [C.yellow, C.cyan, C.pink, C.green, C.purple];
        const ratio = (th, h) => {
          const ux = Math.cos(th), uy = Math.sin(th);
          return Math.abs(f(x + h * ux, y + h * uy) - f0 - h * (gx * ux + gy * uy)) / h;
        };
        const curves = offs.map((o) => { const pts = []; for (let i = 0; i <= 70; i++) { const z = 3 * i / 70; pts.push([z, ratio(ML.rad(S.theta + o), Math.pow(10, -z))]); } return pts; });
        let mx = 0; curves.forEach((c) => c.forEach((p) => { if (Number.isFinite(p[1])) mx = Math.max(mx, p[1]); }));
        const ymax = clamp(mx * 1.1, 0.05, 2);
        g.o.y = [-ymax * 0.1, ymax]; g.begin();
        g.line(0, 0, 3, 0, C.axis, 1.5);
        curves.forEach((c, i) => g.path((t) => { const k = Math.round(t / 3 * 70); return c[k]; }, 0, 3, cols[i], i ? 1.6 : 3, 70));
        g.line(S.zoom, 0, S.zoom, ymax, C.gold, 1.5, [4, 4]);
        g.text("h = 1", 0.03, -ymax * 0.1, C.dim, 0, -4, SMALL);
        g.text("h = 0.001", 2.97, -ymax * 0.1, C.dim, 0, -4, SMALL, "right");
        g.text("error ratio  (h → 0 to the right)", 1.5, ymax, C.text, 0, 13, BOLD, "center");
      });

      st.after = () => {
        const f = cur().f, { x, y } = S.p, u = dirU(), w = W(), [gx, gy] = grad(), D = gx * u[0] + gy * u[1];
        const f0 = f(x, y), fw = f(x + w * u[0], y + w * u[1]);
        const ratio = Math.abs(fw - f0 - w * D) / w;
        const kind = cur().kind, org = atOrigin();
        let grow, verdict;
        if (kind === "cone" && org) {
          grow = "does not exist: one-sided slopes of f(x,0) are +1 and −1";
          verdict = `<span class="no">Not differentiable at 0: the graph has a kink, so no tangent plane. The ratio stays at 1.</span>`;
        } else if (kind === "disc" && org) {
          grow = "(0, 0): both partials exist";
          verdict = `<span class="warn">Partials exist, but f jumps (f = ½ on the diagonal), so f is not continuous, hence not differentiable. The ratio blows up unless u is along an axis.</span>`;
        } else {
          grow = `(${fmt(gx, 3)}, ${fmt(gy, 3)})`;
          verdict = `<span class="ok">Differentiable here: the ratio tends to 0 for every direction u.</span>`;
        }
        out([
          ["p", `(${fmt(x)}, ${fmt(y)}),  f(p) = ${fmt(f0, 4)}`],
          ["∇f(p)", grow],
          ["D<sub>u</sub>f = ∇f·u", fmt(D, 4)],
          [`quotient at h = ${fmt(w, 3)}`, fmt((fw - f0) / w, 4)],
          ["|f(p+hu) − f(p)|", fmt(Math.abs(fw - f0), 4) + "  (continuity: should → 0)"],
          ["error ratio at h", fmt(ratio, 4)],
        ], verdict);
      };

      ML.drag(st, () => [S.p], (i, x, y) => { S.p.x = x; S.p.y = y; }, { snap: 0.05, clamp: [-2.95, 2.95, -2.95, 2.95] });
      st.redraw();
    },

    idea: String.raw`Differentiability says \(f(p+h)=f(p)+a\cdot h+\|h\|\,\varepsilon(h)\) with \(\varepsilon(h)\to0\). Everything follows by choosing the shape of \(h\): shrink it to get continuity, put \(h=tu\) to get directional derivatives.`,
    steps: [
      { t: String.raw`Write the definition with an explicit error term.`, d: String.raw`There is \(a\in\mathbb R^2\) with \(\dfrac{f(p+h)-f(p)-a\cdot h}{\|h\|}\to0\). Put \(\varepsilon(h):=\dfrac{f(p+h)-f(p)-a\cdot h}{\|h\|}\) for \(h\neq 0\). Then \(f(p+h)=f(p)+a\cdot h+\|h\|\,\varepsilon(h)\) and \(\varepsilon(h)\to0\) as \(h\to0\).` },
      { t: String.raw`Continuity.`, d: String.raw`By Cauchy–Schwarz \(|a\cdot h|\le\|a\|\|h\|\), so \(|f(p+h)-f(p)|\le\|a\|\|h\|+\|h\|\,|\varepsilon(h)|\to0\) as \(h\to0\). Hence \(f(p+h)\to f(p)\).` },
      { t: String.raw`Directional derivative along a unit vector \(u\).`, d: String.raw`Take \(h=tu\) with \(t\ne0\) (so \(\|h\|=|t|\)): \(\dfrac{f(p+tu)-f(p)}{t}=a\cdot u+\dfrac{|t|}{t}\,\varepsilon(tu)\).` },
      { t: String.raw`Let \(t\to0\).`, d: String.raw`\(\dfrac{|t|}{t}=\pm1\) is bounded and \(\varepsilon(tu)\to0\), so the limit exists and \(D_uf(p)=a\cdot u\).` },
      { t: String.raw`Identify \(a\).`, d: String.raw`Choose \(u=e_1\) and \(u=e_2\): \(f_x(p)=a_1\), \(f_y(p)=a_2\). So \(a=\nabla f(p)\) and \(D_uf(p)=\nabla f(p)\cdot u\) for every \(u\). \(\blacksquare\)` },
      { t: String.raw`Why the converse fails (what the picture shows).`, d: String.raw`For \(f=\dfrac{xy}{x^2+y^2},\ f(0,0)=0\): \(f(x,0)=f(0,y)=0\), so both partials at \(0\) exist, but \(f=\tfrac12\) on the diagonal, so \(f\) is not even continuous at \(0\). Existence of partials controls only two directions; differentiability needs the \(o(\|h\|)\) estimate in <i>all</i> directions at once.` },
    ],
    memorize: {
      formula: String.raw`f(p+h)=f(p)+\nabla f(p)\cdot h+o(\|h\|),\qquad D_uf(p)=\nabla f(p)\cdot u`,
      bullets: [
        String.raw`Chain of implications: \(C^1\Rightarrow\) differentiable \(\Rightarrow\) continuous and all \(D_uf\) exist \(\Rightarrow\) partials exist. None of the arrows reverses.`,
        String.raw`Proof pattern: write \(f(p+h)-f(p)=a\cdot h+\|h\|\varepsilon(h)\); then let \(h\to0\) (continuity) or set \(h=tu\) (directional derivative).`,
        String.raw`The tangent plane is \(z=f(p)+\nabla f(p)\cdot(x-p)\): the picture "zoom in and it looks flat".`,
      ],
      pitfalls: [
        String.raw`"Partials exist" does not give continuity or differentiability (example \(xy/(x^2+y^2)\)).`,
        String.raw`\(D_uf=\nabla f\cdot u\) needs differentiability. For \(f=\frac{x^2y}{x^2+y^2}\) (with \(f(0)=0\)) all \(D_uf(0)=\cos^2\theta\sin\theta\) exist, but \(\nabla f(0)=0\), so the formula fails.`,
        String.raw`The denominator in the definition is \(\|h\|\) (a number), not \(h\) (a vector).`,
      ],
    },
  });

  /* ================================================================== */
  /* 2 · continuous partials ⇒ differentiable (MVT twice)                 */
  /* ================================================================== */
  const bumpParts = (x, y) => {
    const e1 = Math.exp(-(x * x + y * y) / 2), e2 = Math.exp(-((x - 1.6) ** 2 + (y + 1.2) ** 2));
    return [e1, e2];
  };
  const F2 = [
    { name: "sin x · cos y", f: (x, y) => Math.sin(x) * Math.cos(y), fx: (x, y) => Math.cos(x) * Math.cos(y), fy: (x, y) => -Math.sin(x) * Math.sin(y) },
    { name: "(x²y − y³/3) / 3", f: (x, y) => (x * x * y - y * y * y / 3) / 3, fx: (x, y) => 2 * x * y / 3, fy: (x, y) => (x * x - y * y) / 3 },
    { name: "Two bumps",
      f: (x, y) => { const [a, b] = bumpParts(x, y); return a + 0.7 * b; },
      fx: (x, y) => { const [a, b] = bumpParts(x, y); return -x * a - 1.4 * (x - 1.6) * b; },
      fy: (x, y) => { const [a, b] = bumpParts(x, y); return -y * a - 1.4 * (y + 1.2) * b; } },
  ];

  /** Staircase decomposition of f(p+(h,k)) − f(p) with the two Mean Value points. */
  function staircase(F, x, y, h, k) {
    const D1 = F.f(x + h, y) - F.f(x, y), D2 = F.f(x + h, y + k) - F.f(x + h, y);
    const xi = Math.abs(h) > 1e-12 ? findRoot((s) => F.fx(s, y) - D1 / h, Math.min(x, x + h), Math.max(x, x + h)) : x;
    const eta = Math.abs(k) > 1e-12 ? findRoot((t) => F.fy(x + h, t) - D2 / k, Math.min(y, y + k), Math.max(y, y + k)) : y;
    const e1 = F.fx(xi, y) - F.fx(x, y), e2 = F.fy(x + h, eta) - F.fy(x, y);
    const delta = D1 + D2, lin = F.fx(x, y) * h + F.fy(x, y) * k, rem = delta - lin;
    return { xi, eta, e1, e2, D1, D2, delta, lin, rem, mvt: F.fx(xi, y) * h + F.fy(x + h, eta) * k };
  }

  ML.register({
    id: "c1-implies-differentiable",
    course: "infi2",
    topic: "diff",
    title: "Continuous partials ⇒ differentiable",
    blurb: "Walk from p to p+(h,k) in two straight legs and use the one-variable Mean Value Theorem on each.",
    statement: String.raw`Suppose \(f_x,f_y\) exist in a neighborhood of \(p=(x,y)\) and are continuous at \(p\). Then \(f\) is differentiable at \(p\): \(\;f(p+(h,k))=f(p)+f_x(p)h+f_y(p)k+o(\|(h,k)\|)\).`,
    vizIntro: String.raw`<b>Drag p and the point p+(h,k).</b> The path goes right (<span style="color:#ffcc4d">leg 1</span>) then up (<span style="color:#5ad7ff">leg 2</span>). On each leg the Mean Value Theorem gives a point (<span style="color:#ff6b8b">ξ</span>, <span style="color:#4fd1a5">η</span>) where the slope equals the chord slope, drawn on the right. Press <i>Shrink</i> and watch the errors \(\varepsilon_1,\varepsilon_2\) go to 0.`,

    viz(box) {
      const st = ML.stage(box, { x: [-3, 3], y: [-3, 3] });
      const S = { p: { x: -0.8, y: 0.4 }, h: 1.6, k: 1.1, fi: 0, heat: null };
      const cur = () => F2[S.fi];
      const buildHeat = () => { S.heat = ML.heatmap(cur().f, [-3, 3], [-3, 3], { n: 150, bands: 12 }); };
      buildHeat();
      const clampP = () => {
        const loX = -2.95 - Math.min(0, S.h), hiX = 2.95 - Math.max(0, S.h), loY = -2.95 - Math.min(0, S.k), hiY = 2.95 - Math.max(0, S.k);
        if (loX <= hiX) S.p.x = clamp(S.p.x, loX, hiX);
        if (loY <= hiY) S.p.y = clamp(S.p.y, loY, hiY);
      };

      ML.select(st.panel, { label: "Function", options: F2.map((f, i) => [i, f.name]), onChange: (v) => { S.fi = +v; buildHeat(); st.redraw(); } });
      const row = ML.h("div", { class: "btn-row" }); st.panel.append(row);
      ML.button(row, "Shrink (h,k) × ½", () => { S.h /= 2; S.k /= 2; st.redraw(); });
      ML.button(row, "Reset", () => { S.h = 1.6; S.k = 1.1; S.p.x = -0.8; S.p.y = 0.4; clampP(); st.redraw(); });
      const mvtPlot = st.extra({ x: [0, 2.1], y: [0, 1], height: 150 });
      const epsPlot = st.extra({ x: [0, 2.5], y: [0, 1], height: 120 });
      const out = ML.readout(st.panel);

      st.draw((v) => {
        v.image(S.heat.canvas, -3, 3, -3, 3);
        v.axes("rgba(255,255,255,.2)");
        const { x, y } = S.p, { h, k } = S, r = staircase(cur(), x, y, h, k);
        v.line(x, y, x + h, y + k, "rgba(255,255,255,.35)", 1.5, [4, 5]);
        v.arrow(x, y, x + h, y, C.gold, 3.5);
        v.arrow(x + h, y, x + h, y + k, C.cyan, 3.5);
        v.dot(r.xi, y, C.pink, 6, C.white); v.text("ξ", r.xi, y, C.pink, -4, -12, "700 15px system-ui");
        v.dot(x + h, r.eta, C.green, 6, C.white); v.text("η", x + h, r.eta, C.green, 10, 5, "700 15px system-ui");
        v.handle(x, y, C.white, "p"); v.handle(x + h, y + k, C.white, "p+(h,k)");
      });

      /* MVT pictures: chord (gold) is parallel to the tangent at the Mean Value point */
      const leg = (g, off, a, b, fn, mark, color, title) => {
        g.text(title, off + 0.03, 1, C.text, 0, 13, BOLD);
        if (!(b - a > 1e-9)) { g.text("length 0: nothing to do", off + 0.5, 0.5, C.dim, 0, 0, SMALL, "center"); return; }
        const n = 90; let mn = Infinity, mx = -Infinity;
        for (let i = 0; i <= n; i++) { const v = fn(a + (b - a) * i / n); mn = Math.min(mn, v); mx = Math.max(mx, v); }
        const rg = (mx - mn) || 1, X = (s) => off + 0.06 + 0.88 * (s - a) / (b - a), Y = (v) => 0.12 + 0.66 * (v - mn) / rg;
        g.path((s) => [X(s), Y(fn(s))], a, b, C.blue, 2.5, n);
        g.line(X(a), Y(fn(a)), X(b), Y(fn(b)), C.gold, 2, [5, 4]);
        const m = (Y(fn(b)) - Y(fn(a))) / (X(b) - X(a));
        g.line(X(a), Y(fn(mark)) + m * (X(a) - X(mark)), X(b), Y(fn(mark)) + m * (X(b) - X(mark)), color, 2);
        g.dot(X(mark), Y(fn(mark)), color, 5, C.white);
      };
      mvtPlot.draw((g) => {
        const { x, y } = S.p, { h, k } = S, F = cur(), r = staircase(F, x, y, h, k);
        g.begin();
        g.line(1.05, 0, 1.05, 1, C.grid, 1);
        leg(g, 0, Math.min(x, x + h), Math.max(x, x + h), (s) => F.f(s, y), r.xi, C.pink, "leg 1: s ↦ f(s, y)");
        leg(g, 1.05, Math.min(y, y + k), Math.max(y, y + k), (t) => F.f(x + h, t), r.eta, C.green, "leg 2: t ↦ f(x+h, t)");
      });

      epsPlot.draw((g) => {
        const { x, y } = S.p, F = cur(), pts = [];
        let mx = 0.02;
        for (let i = 0; i <= 50; i++) {
          const z = 2.5 * i / 50, s = Math.pow(10, -z), r = staircase(F, x, y, S.h * s, S.k * s);
          pts.push([z, Math.abs(r.e1), Math.abs(r.e2)]); mx = Math.max(mx, Math.abs(r.e1), Math.abs(r.e2));
        }
        g.o.y = [-mx * 0.1, mx * 1.1]; g.begin();
        g.line(0, 0, 2.5, 0, C.axis, 1.5);
        g.path((t) => { const q = pts[Math.round(t / 2.5 * 50)]; return [t, q[1]]; }, 0, 2.5, C.pink, 2.5, 50);
        g.path((t) => { const q = pts[Math.round(t / 2.5 * 50)]; return [t, q[2]]; }, 0, 2.5, C.green, 2.5, 50);
        g.text("|ε₁|", 2.0, mx * 1.1, C.pink, 0, 30, BOLD);
        g.text("|ε₂|", 2.3, mx * 1.1, C.green, 0, 30, BOLD);
        g.text("shrink the step: scale 1", 0.03, -mx * 0.1, C.dim, 0, -4, SMALL);
        g.text("0.003", 2.47, -mx * 0.1, C.dim, 0, -4, SMALL, "right");
        g.text("ε₁, ε₂ as the step shrinks along the same ray", 1.25, mx * 1.1, C.text, 0, 13, BOLD, "center");
      });

      st.after = () => {
        const { x, y } = S.p, { h, k } = S, r = staircase(cur(), x, y, h, k), nrm = Math.hypot(h, k);
        out([
          ["Δ = f(p+(h,k)) − f(p)", fmt(r.delta, 5)],
          ["f<sub>x</sub>(ξ,y)·h + f<sub>y</sub>(x+h,η)·k", `<span class="ok">${fmt(r.mvt, 5)}  (equal, by MVT)</span>`],
          ["linear part f<sub>x</sub>(p)h + f<sub>y</sub>(p)k", fmt(r.lin, 5)],
          ["remainder R = Δ − linear", fmt(r.rem, 5)],
          ["ε₁ = f<sub>x</sub>(ξ,y) − f<sub>x</sub>(p)", fmt(r.e1, 5)],
          ["ε₂ = f<sub>y</sub>(x+h,η) − f<sub>y</sub>(p)", fmt(r.e2, 5)],
          ["|R| / ‖(h,k)‖", `<b>${nrm > 1e-12 ? fmt(Math.abs(r.rem) / nrm, 5) : "–"}</b>  (→ 0 as the step shrinks)`],
        ]);
      };

      ML.drag(st, () => [S.p, { x: S.p.x + S.h, y: S.p.y + S.k }],
        (i, x, y) => {
          if (i === 0) { S.p.x = x; S.p.y = y; clampP(); }
          else { S.h = clamp(x, -2.95, 2.95) - S.p.x; S.k = clamp(y, -2.95, 2.95) - S.p.y; }
        }, { snap: 0.05 });
      st.redraw();
    },

    idea: String.raw`Go from \(p\) to \(p+(h,k)\) in two straight legs. On each leg the function of one variable satisfies the ordinary Mean Value Theorem, so the increment is a partial derivative <i>somewhere nearby</i> times the step. Continuity of the partials at \(p\) says "nearby" is as good as "at \(p\)".`,
    steps: [
      { t: String.raw`Set-up.`, d: String.raw`Let \(p=(x,y)\) and take \((h,k)\) so small that the rectangle with corners \(p\) and \((x+h,y+k)\) lies in the neighborhood where \(f_x,f_y\) exist. We want \(f(p+(h,k))-f(p)-f_x(p)h-f_y(p)k=o(\|(h,k)\|)\).` },
      { t: String.raw`Telescope along the staircase.`, d: String.raw`\(f(x+h,y+k)-f(x,y)=\big[f(x+h,y)-f(x,y)\big]+\big[f(x+h,y+k)-f(x+h,y)\big]\): first move horizontally, then vertically.` },
      { t: String.raw`MVT on leg 1.`, d: String.raw`\(s\mapsto f(s,y)\) is differentiable on the interval between \(x\) and \(x+h\) (because \(f_x\) exists), so there is \(\xi\) between them with \(f(x+h,y)-f(x,y)=f_x(\xi,y)\,h\).` },
      { t: String.raw`MVT on leg 2.`, d: String.raw`Likewise \(t\mapsto f(x+h,t)\) is differentiable, so there is \(\eta\) between \(y\) and \(y+k\) with \(f(x+h,y+k)-f(x+h,y)=f_y(x+h,\eta)\,k\).` },
      { t: String.raw`Subtract the linear part.`, d: String.raw`Put \(\varepsilon_1=f_x(\xi,y)-f_x(p)\) and \(\varepsilon_2=f_y(x+h,\eta)-f_y(p)\). Adding the two legs: \(f(p+(h,k))-f(p)=f_x(p)h+f_y(p)k+\varepsilon_1h+\varepsilon_2k.\)` },
      { t: String.raw`The errors vanish (this is where continuity is used).`, d: String.raw`\(\|(\xi,y)-p\|\le|h|\le\|(h,k)\|\) and \(\|(x+h,\eta)-p\|\le\|(h,k)\|\). As \((h,k)\to0\) both points tend to \(p\), and \(f_x,f_y\) are continuous at \(p\), so \(\varepsilon_1,\varepsilon_2\to0\).` },
      { t: String.raw`Conclude.`, d: String.raw`Since \(|h|,|k|\le\|(h,k)\|\): \(\dfrac{|\varepsilon_1h+\varepsilon_2k|}{\|(h,k)\|}\le|\varepsilon_1|+|\varepsilon_2|\to0\). So \(f\) is differentiable at \(p\) with \(\nabla f(p)=(f_x(p),f_y(p))\). \(\blacksquare\)` },
    ],
    memorize: {
      formula: String.raw`f(x+h,y+k)-f(x,y)=f_x(\xi,y)\,h+f_y(x+h,\eta)\,k\quad\Longrightarrow\quad C^1\Rightarrow\text{differentiable}`,
      bullets: [
        String.raw`Two moves: <b>telescope</b> in two legs, then <b>MVT</b> on each leg.`,
        String.raw`The intermediate points \(\xi,\eta\) depend on \((h,k)\); continuity of \(f_x,f_y\) <i>at \(p\)</i> is what makes \(f_x(\xi,y)\to f_x(p)\).`,
        String.raw`Hypotheses: partials exist <i>near</i> \(p\) and are continuous <i>at</i> \(p\).`,
      ],
      pitfalls: [
        String.raw`Existence of the partials only at \(p\) is not enough (\(xy/(x^2+y^2)\)); the MVT needs them on a whole neighborhood.`,
        String.raw`You cannot pull \(f_x(\xi,y)\) out as if it were \(f_x(p)\): they are different numbers. The whole point of step 6 is to bound the difference.`,
        String.raw`The converse is false: \(f=(x^2+y^2)\sin\frac1{\sqrt{x^2+y^2}}\), \(f(0)=0\), is differentiable at \(0\) but its partials are not continuous there.`,
      ],
    },
  });

  /* ================================================================== */
  /* 3 · ∇f ⟂ level curves, steepest ascent                               */
  /* ================================================================== */
  const F3 = [
    { name: "Ellipses: (x² + 2y²)/3", f: (x, y) => (x * x + 2 * y * y) / 3, g: (x, y) => [2 * x / 3, 4 * y / 3], start: [1.2, 0.7] },
    { name: "Waves: sin x · cos y", f: (x, y) => Math.sin(x) * Math.cos(y), g: (x, y) => [Math.cos(x) * Math.cos(y), -Math.sin(x) * Math.sin(y)], start: [0.7, 0.5] },
    { name: "Two bumps", start: [0.9, 0.4],
      f: (x, y) => { const [a, b] = bumpParts(x, y); return a + 0.7 * b; },
      g: (x, y) => { const [a, b] = bumpParts(x, y); return [-x * a - 1.4 * (x - 1.6) * b, -y * a - 1.4 * (y + 1.2) * b]; } },
    { name: "Saddle: (x² − y²)/3", f: (x, y) => (x * x - y * y) / 3, g: (x, y) => [2 * x / 3, -2 * y / 3], start: [1.0, 0.6] },
  ];

  /** Trace the level curve through (x0,y0): follow the unit tangent (−f_y, f_x)/|∇f| with RK2 + Newton projection. */
  function traceLevel(F, x0, y0, dir, maxSteps, step) {
    const pts = [[x0, y0]], c = F.f(x0, y0);
    const tan = (a, b) => { const g = F.g(a, b), n = Math.hypot(g[0], g[1]); return n < 1e-6 ? null : [-g[1] / n * dir, g[0] / n * dir]; };
    let x = x0, y = y0, closed = false;
    for (let i = 0; i < maxSteps; i++) {
      const t1 = tan(x, y); if (!t1) break;
      const t2 = tan(x + t1[0] * step / 2, y + t1[1] * step / 2); if (!t2) break;
      x += t2[0] * step; y += t2[1] * step;
      const g = F.g(x, y), n2 = g[0] * g[0] + g[1] * g[1];
      if (n2 < 1e-12) break;
      const e = (F.f(x, y) - c) / n2; x -= e * g[0]; y -= e * g[1];
      pts.push([x, y]);
      if (Math.abs(x) > 3.3 || Math.abs(y) > 3.3) break;
      if (i > 20 && Math.hypot(x - x0, y - y0) < step * 0.9) { closed = true; break; }
    }
    return { pts, closed };
  }

  ML.register({
    id: "gradient-perp-level",
    course: "infi2",
    topic: "diff",
    title: "The gradient is ⟂ to level curves and points uphill",
    blurb: "Chain rule on a curve inside a level set, then Cauchy–Schwarz for the steepest direction.",
    statement: String.raw`Let \(f\) be differentiable near \(p\) with \(\nabla f(p)\neq0\), and let \(\gamma(t)\) be a differentiable curve with \(\gamma(0)=p\) lying in the level set \(\{f=f(p)\}\). Then \(\nabla f(p)\cdot\gamma'(0)=0\). Moreover, among unit vectors \(u\), \(D_uf(p)\) is largest for \(u=\nabla f(p)/\|\nabla f(p)\|\), and the largest value is \(\|\nabla f(p)\|\).`,
    vizIntro: String.raw`<b>Drag p.</b> The white curve is the level curve through p (traced numerically). The red arrow \(\nabla f\) always meets it at a right angle. Turn <span style="color:#fff36b">u</span> with the slider: the slope \(D_uf\) follows \(\|\nabla f\|\cos\varphi\), maximal along \(\nabla f\) and zero along the curve. Try the saddle and drag p onto the origin.`,

    viz(box) {
      const st = ML.stage(box, { x: [-3, 3], y: [-3, 3] });
      const S = { p: { x: F3[0].start[0], y: F3[0].start[1] }, fi: 0, theta: 20, heat: null };
      const cur = () => F3[S.fi];
      const buildHeat = () => { S.heat = ML.heatmap(cur().f, [-3, 3], [-3, 3], { n: 150, bands: 14 }); };
      buildHeat();
      const STEP = 0.05;

      ML.select(st.panel, {
        label: "Function", options: F3.map((f, i) => [i, f.name]),
        onChange: (v) => { S.fi = +v; S.p.x = cur().start[0]; S.p.y = cur().start[1]; buildHeat(); st.redraw(); },
      });
      const thSl = ML.slider(st.panel, { label: "Direction u (angle)", min: 0, max: 359, step: 1, value: S.theta, fmt: (v) => v + "°", onInput: (v) => { S.theta = v; st.redraw(); } });
      const gradDeg = () => { const g = cur().g(S.p.x, S.p.y); return ((Math.round(ML.deg(Math.atan2(g[1], g[0]))) % 360) + 360) % 360; };
      const setTheta = (d) => { S.theta = ((d % 360) + 360) % 360; thSl.set(S.theta); st.redraw(); };
      const row = ML.h("div", { class: "btn-row" }); st.panel.append(row);
      ML.button(row, "u → ∇f (steepest)", () => { const g = cur().g(S.p.x, S.p.y); if (Math.hypot(g[0], g[1]) > 1e-6) setTheta(gradDeg()); });
      ML.button(row, "u → along the curve", () => { const g = cur().g(S.p.x, S.p.y); if (Math.hypot(g[0], g[1]) > 1e-6) setTheta(gradDeg() + 90); });
      const plot = st.extra({ x: [0, 360], y: [-1, 1], height: 130 });
      st.note("Slope D<sub>u</sub>f as u turns through 360° (yellow dot = current u).");
      const out = ML.readout(st.panel);

      /** level curve data for the current state */
      const level = () => {
        const F = cur(), { x, y } = S.p;
        const g = F.g(x, y), gn = Math.hypot(g[0], g[1]);
        if (gn < 1e-6) return null;
        const fwd = traceLevel(F, x, y, +1, 700, STEP);
        const bwd = traceLevel(F, x, y, -1, fwd.closed ? 1 : 700, STEP);
        const full = bwd.pts.slice().reverse().concat(fwd.pts.slice(1));
        const tangent = [(fwd.pts[1][0] - bwd.pts[1][0]) / (2 * STEP), (fwd.pts[1][1] - bwd.pts[1][1]) / (2 * STEP)];
        return { full, tangent, g, gn };
      };

      st.draw((v) => {
        v.image(S.heat.canvas, -3, 3, -3, 3);
        v.axes("rgba(255,255,255,.18)");
        const { x, y } = S.p, L = level(), th = ML.rad(S.theta), u = [Math.cos(th), Math.sin(th)];
        if (L) {
          const c = v.ctx; c.strokeStyle = C.white; c.lineWidth = 3; c.setLineDash([]); c.beginPath();
          L.full.forEach(([a, b], i) => { const q = v.P(a, b); i ? c.lineTo(...q) : c.moveTo(...q); });
          c.stroke();
          const ng = [L.g[0] / L.gn, L.g[1] / L.gn], tau = [-ng[1], ng[0]], a = 0.2;
          v.arrow(x, y, x + tau[0] * 1.1, y + tau[1] * 1.1, C.cyan, 3.5);
          v.arrow(x, y, x + ng[0] * Math.min(1.5, 0.45 + 0.6 * L.gn), y + ng[1] * Math.min(1.5, 0.45 + 0.6 * L.gn), C.red, 4);
          v.line(x + ng[0] * a, y + ng[1] * a, x + (ng[0] + tau[0]) * a, y + (ng[1] + tau[1]) * a, C.white, 1.5);
          v.line(x + tau[0] * a, y + tau[1] * a, x + (ng[0] + tau[0]) * a, y + (ng[1] + tau[1]) * a, C.white, 1.5);
          v.text("∇f", x + ng[0] * 0.8, y + ng[1] * 0.8, C.red, 8, 14);
          v.text("γ′(0)", x + tau[0] * 1.1, y + tau[1] * 1.1, C.cyan, 8, -6);
        } else v.text("∇f = 0 here: critical point", x, y, C.yellow, 12, 24);
        v.arrow(x, y, x + u[0] * 0.9, y + u[1] * 0.9, C.yellow, 3);
        v.text("u", x + u[0] * 0.9, y + u[1] * 0.9, C.yellow, 6, -6);
        v.handle(x, y, C.white, "p");
      });

      plot.draw((g) => {
        const gg = cur().g(S.p.x, S.p.y), gn = Math.hypot(gg[0], gg[1]), phi = Math.atan2(gg[1], gg[0]), m = Math.max(gn, 0.3) * 1.2;
        g.o.y = [-m, m]; g.begin();
        g.line(0, 0, 360, 0, C.axis, 1.5);
        g.plot((d) => gn * Math.cos(ML.rad(d) - phi), 0, 360, C.blue, 2.5, 180);
        const th = ML.rad(S.theta);
        g.dot(S.theta, gn * Math.cos(th - phi), C.yellow, 6);
        g.text("0°", 4, -m, C.dim, 0, -4, SMALL); g.text("360°", 356, -m, C.dim, 0, -4, SMALL, "right");
      });

      st.after = () => {
        const L = level(), th = ML.rad(S.theta), u = [Math.cos(th), Math.sin(th)];
        if (!L) { out([["∇f(p)", "(0, 0)"]], `<span class="warn">At a critical point the level set need not be a smooth curve (for the saddle it is two crossing lines). The theorem needs ∇f(p) ≠ 0.</span>`); return; }
        const dot = L.g[0] * L.tangent[0] + L.g[1] * L.tangent[1], D = L.g[0] * u[0] + L.g[1] * u[1], cosphi = D / L.gn;
        out([
          ["∇f(p)", `(${fmt(L.g[0], 3)}, ${fmt(L.g[1], 3)}),  |∇f| = ${fmt(L.gn, 3)}`],
          ["∇f · γ′(0)  (numerical)", `<span class="ok">${fmt(dot, 4)}  ≈ 0</span>`],
          ["angle between u and ∇f", fmt(ML.deg(Math.acos(clamp(cosphi, -1, 1))), 1) + "°"],
          ["D<sub>u</sub>f = ∇f·u", `<b>${fmt(D, 4)}</b>`],
          ["max over u  = |∇f|", fmt(L.gn, 4) + (cosphi > 0.9995 ? "  <span class=\"ok\">← reached</span>" : "")],
        ], "γ′(0) is estimated from the traced curve, so the dot product tests the theorem rather than assuming it.");
      };

      ML.drag(st, () => [S.p], (i, x, y) => { S.p.x = x; S.p.y = y; }, { snap: 0.05, clamp: [-2.95, 2.95, -2.95, 2.95] });
      st.redraw();
    },

    idea: String.raw`Along any curve inside a level set, \(f\) is constant, so its derivative along the curve is \(0\). The chain rule says that derivative is \(\nabla f\cdot\gamma'\). For steepest ascent, \(\nabla f\cdot u\) is a dot product, and Cauchy–Schwarz says it is largest when \(u\) points along \(\nabla f\).`,
    steps: [
      { t: String.raw`Set up a curve in the level set.`, d: String.raw`Let \(c=f(p)\) and \(\gamma:(-\delta,\delta)\to\mathbb R^2\) differentiable with \(\gamma(0)=p\) and \(f(\gamma(t))=c\) for all \(t\).` },
      { t: String.raw`Differentiate \(t\mapsto f(\gamma(t))\).`, d: String.raw`The function is constant, so its derivative is \(0\). Since \(f\) is differentiable at \(p\) and \(\gamma\) at \(0\), the chain rule applies: \(\dfrac{d}{dt}f(\gamma(t))\Big|_{t=0}=\nabla f(p)\cdot\gamma'(0)\).` },
      { t: String.raw`Conclude orthogonality.`, d: String.raw`Hence \(\nabla f(p)\cdot\gamma'(0)=0\). When \(\nabla f(p)\ne0\) the implicit function theorem says the level set is locally a \(C^1\) curve, so \(\gamma'(0)\) ranges over the whole tangent line and \(\nabla f(p)\) is a normal vector to the level curve.` },
      { t: String.raw`Steepest ascent: rate in direction \(u\).`, d: String.raw`For a unit vector \(u\) we proved earlier that \(D_uf(p)=\nabla f(p)\cdot u\) (differentiability).` },
      { t: String.raw`Apply Cauchy–Schwarz.`, d: String.raw`\(D_uf(p)=\nabla f\cdot u=\|\nabla f\|\cos\varphi\le\|\nabla f\|\,\|u\|=\|\nabla f\|\), where \(\varphi\) is the angle between \(u\) and \(\nabla f\).` },
      { t: String.raw`Equality case.`, d: String.raw`Equality holds iff \(\cos\varphi=1\), i.e. \(u=\nabla f/\|\nabla f\|\). Then \(D_uf=\|\nabla f\|\): the gradient direction is the unique steepest ascent, \(-\nabla f\) the steepest descent, and along the level curve (\(\varphi=\pm90^\circ\)) the slope is \(0\), consistent with step 3. \(\blacksquare\)` },
    ],
    memorize: {
      formula: String.raw`\nabla f(p)\perp\{f=c\},\qquad \max_{\|u\|=1}D_uf(p)=\|\nabla f(p)\|\ \text{ at }\ u=\tfrac{\nabla f(p)}{\|\nabla f(p)\|}`,
      bullets: [
        String.raw`Proof 1 in one line: \(f(\gamma(t))\equiv c\ \Rightarrow\ 0=\nabla f\cdot\gamma'\).`,
        String.raw`Proof 2 in one line: \(D_uf=\|\nabla f\|\cos\varphi\), so maximal at \(\varphi=0\), zero at \(\varphi=\pm90^\circ\), minimal at \(\varphi=180^\circ\).`,
        String.raw`Tangent line to the level curve at \(p\): \(\nabla f(p)\cdot(x-p)=0\).`,
      ],
      pitfalls: [
        String.raw`Needs \(\nabla f(p)\ne0\). At critical points the level set can be a point or cross itself (saddle).`,
        String.raw`The gradient lives in the \((x,y)\)-plane (domain), perpendicular to the contour lines drawn there, not in the 3D graph.`,
        String.raw`The chain rule needs \(f\) <i>differentiable</i> at \(p\); existence of the partials is not enough.`,
      ],
    },
  });

  /* ================================================================== */
  /* 4 · Clairaut / Schwarz: f_xy = f_yx                                  */
  /* ================================================================== */
  const cR = (x, y) => x * x + y * y;
  const F4 = [
    { name: "e^(x/2) · sin y", kind: "smooth", f: (x, y) => Math.exp(x / 2) * Math.sin(y),
      fx: (x, y) => 0.5 * Math.exp(x / 2) * Math.sin(y), fy: (x, y) => Math.exp(x / 2) * Math.cos(y),
      fxy: (x, y) => 0.5 * Math.exp(x / 2) * Math.cos(y), fyx: (x, y) => 0.5 * Math.exp(x / 2) * Math.cos(y), start: [-0.6, -0.4] },
    { name: "sin x · cos y", kind: "smooth", f: (x, y) => Math.sin(x) * Math.cos(y),
      fx: (x, y) => Math.cos(x) * Math.cos(y), fy: (x, y) => -Math.sin(x) * Math.sin(y),
      fxy: (x, y) => -Math.cos(x) * Math.sin(y), fyx: (x, y) => -Math.cos(x) * Math.sin(y), start: [0.3, 0.5] },
    { name: "Counterexample: xy(x²−y²)/(x²+y²)", kind: "bad",
      f: (x, y) => { const r = cR(x, y); return r < 1e-300 ? 0 : x * y * (x * x - y * y) / r; },
      fx: (x, y) => { const r = cR(x, y); return r < 1e-300 ? 0 : y * (x ** 4 + 4 * x * x * y * y - y ** 4) / (r * r); },
      fy: (x, y) => { const r = cR(x, y); return r < 1e-300 ? 0 : x * (x ** 4 - 4 * x * x * y * y - y ** 4) / (r * r); },
      fxy: (x, y) => { const r = cR(x, y); return r < 1e-300 ? -1 : (x ** 6 + 9 * x ** 4 * y * y - 9 * x * x * y ** 4 - y ** 6) / (r * r * r); },
      fyx: (x, y) => { const r = cR(x, y); return r < 1e-300 ? 1 : (x ** 6 + 9 * x ** 4 * y * y - 9 * x * x * y ** 4 - y ** 6) / (r * r * r); },
      start: [0, 0] },
  ];

  /** Double difference over the rectangle and the Mean Value points of both routes. */
  function doubleDiff(F, x, y, h, k) {
    const D = F.f(x + h, y + k) - F.f(x + h, y) - F.f(x, y + k) + F.f(x, y);
    const ok = Math.abs(h) > 1e-9 && Math.abs(k) > 1e-9;
    if (!ok) return { D, ok };
    const xa = Math.min(x, x + h), xb = Math.max(x, x + h), ya = Math.min(y, y + k), yb = Math.max(y, y + k);
    // route 1: MVT in x on φ(s)=f(s,y+k)−f(s,y), then MVT in y on t ↦ f_x(ξ,t)
    const xi = findRoot((s) => F.fx(s, y + k) - F.fx(s, y) - D / h, xa, xb);
    const eta = findRoot((t) => F.fxy(xi, t) - (F.fx(xi, y + k) - F.fx(xi, y)) / k, ya, yb);
    // route 2: MVT in y on ψ(t)=f(x+h,t)−f(x,t), then MVT in x on s ↦ f_y(s,η′)
    const eta2 = findRoot((t) => F.fy(x + h, t) - F.fy(x, t) - D / k, ya, yb);
    const xi2 = findRoot((s) => F.fyx(s, eta2) - (F.fy(x + h, eta2) - F.fy(x, eta2)) / h, xa, xb);
    return { D, ok, q: D / (h * k), xi, eta, xi2, eta2, v1: F.fxy(xi, eta), v2: F.fyx(xi2, eta2) };
  }

  ML.register({
    id: "clairaut-mixed-partials",
    course: "infi2",
    topic: "diff",
    title: "Equality of mixed partials (Schwarz / Clairaut)",
    blurb: "A double difference over a rectangle, read in two orders with the Mean Value Theorem twice.",
    statement: String.raw`Suppose \(f_x,f_y,f_{xy},f_{yx}\) exist in a neighborhood of \(p\) and \(f_{xy},f_{yx}\) are continuous at \(p\) (here \(f_{xy}=\partial_y(\partial_xf)\)). Then \(f_{xy}(p)=f_{yx}(p)\).`,
    vizIntro: String.raw`<b>Drag p and set the rectangle size with h and k.</b> Its double difference \(\Delta=f(x{+}h,y{+}k)-f(x{+}h,y)-f(x,y{+}k)+f(x,y)\) can be split in two orders. Both give \(\Delta/(hk)\) as a mixed partial at a point inside the rectangle (<span style="color:#ff6b8b">ξ,η</span> and <span style="color:#4fd1a5">ξ′,η′</span>). Shrink the rectangle: the curve converges. Then pick the counterexample and see why continuity matters.`,

    viz(box) {
      const st = ML.stage(box, { x: [-3, 3], y: [-3, 3] });
      const S = { p: { x: F4[0].start[0], y: F4[0].start[1] }, h: 1.2, k: 0.9, fi: 0, heat: null };
      const cur = () => F4[S.fi];
      const buildHeat = () => { S.heat = ML.heatmap(cur().f, [-3, 3], [-3, 3], { n: 150, bands: 12 }); };
      buildHeat();
      const clampP = () => {
        const loX = -2.95 - Math.min(0, S.h), hiX = 2.95 - Math.max(0, S.h), loY = -2.95 - Math.min(0, S.k), hiY = 2.95 - Math.max(0, S.k);
        S.p.x = clamp(S.p.x, loX, hiX); S.p.y = clamp(S.p.y, loY, hiY);
      };

      ML.select(st.panel, {
        label: "Function", options: F4.map((f, i) => [i, f.name]),
        onChange: (v) => { S.fi = +v; S.p.x = cur().start[0]; S.p.y = cur().start[1]; S.h = 1.2; S.k = 0.5; hSl.set(S.h); kSl.set(S.k); clampP(); buildHeat(); st.redraw(); },
      });
      const hSl = ML.slider(st.panel, { label: "h (width)", min: -2, max: 2, step: 0.01, value: S.h, onInput: (v) => { S.h = v; clampP(); st.redraw(); } });
      const kSl = ML.slider(st.panel, { label: "k (height)", min: -2, max: 2, step: 0.01, value: S.k, onInput: (v) => { S.k = v; clampP(); st.redraw(); } });
      ML.button(st.panel, "Shrink rectangle × ½", () => { S.h /= 2; S.k /= 2; hSl.set(S.h); kSl.set(S.k); st.redraw(); });
      const plot = st.extra({ x: [0, 2.5], y: [-1, 1], height: 150 });
      const out = ML.readout(st.panel);

      st.draw((v) => {
        v.image(S.heat.canvas, -3, 3, -3, 3);
        v.axes("rgba(255,255,255,.2)");
        const { x, y } = S.p, { h, k } = S, r = doubleDiff(cur(), x, y, h, k);
        v.poly([[x, y], [x + h, y], [x + h, y + k], [x, y + k]], "rgba(255,255,255,.12)", C.white, 2.5);
        const cx = x + h / 2, cy = y + k / 2;
        [[x, y, "+", C.gold], [x + h, y, "−", C.pink], [x + h, y + k, "+", C.gold], [x, y + k, "−", C.pink]].forEach(([a, b, s, col]) => {
          v.text(s, a, b, col, a >= cx ? 14 : -22, b >= cy ? -8 : 20, "700 20px system-ui");
        });
        if (r.ok) {
          v.line(r.xi, y, r.xi, y + k, "rgba(255,107,139,.8)", 1.5, [3, 4]);
          v.line(x, r.eta2, x + h, r.eta2, "rgba(79,209,165,.8)", 1.5, [3, 4]);
          v.dot(r.xi, r.eta, C.pink, 6, C.white); v.text("ξ,η", r.xi, r.eta, C.pink, 8, -8, "700 13px system-ui");
          v.dot(r.xi2, r.eta2, C.green, 6, C.white); v.text("ξ′,η′", r.xi2, r.eta2, C.green, 8, 16, "700 13px system-ui");
        }
        v.handle(x, y, C.white, "p");
      });

      plot.draw((g) => {
        const F = cur(), { x, y } = S.p, ptsQ = [];
        let lo = Math.min(F.fxy(x, y), F.fyx(x, y)), hi = Math.max(F.fxy(x, y), F.fyx(x, y));
        for (let i = 0; i <= 50; i++) {
          const z = 2.5 * i / 50, s = Math.pow(10, -z), r = doubleDiff(F, x, y, S.h * s, S.k * s);
          const q = r.ok ? r.q : NaN; ptsQ.push(q);
          if (Number.isFinite(q)) { lo = Math.min(lo, q); hi = Math.max(hi, q); }
        }
        const pad = Math.max(0.2, (hi - lo) * 0.18);
        g.o.y = [lo - pad, hi + pad]; g.begin();
        g.line(0, F.fxy(x, y), 2.5, F.fxy(x, y), C.gold, 2, [6, 5]);
        g.line(0, F.fyx(x, y), 2.5, F.fyx(x, y), C.green, 2, [2, 5]);
        g.path((t) => [t, ptsQ[Math.round(t / 2.5 * 50)]], 0, 2.5, C.white, 2.8, 50);
        g.text("f_xy(p)", 2.47, F.fxy(x, y), C.gold, 0, -6, BOLD, "right");
        g.text("f_yx(p)", 2.47, F.fyx(x, y), C.green, 0, 14, BOLD, "right");
        g.text("Δ/(hk) as the rectangle shrinks →", 1.25, hi + pad, C.text, 0, 13, BOLD, "center");
        g.text("full size", 0.03, lo - pad, C.dim, 0, -4, SMALL);
      });

      st.after = () => {
        const F = cur(), { x, y } = S.p, r = doubleDiff(F, x, y, S.h, S.k), a = F.fxy(x, y), b = F.fyx(x, y);
        const rows = [["f<sub>xy</sub>(p)  /  f<sub>yx</sub>(p)", `${fmt(a, 4)}  /  ${fmt(b, 4)}`]];
        let note;
        if (r.ok) {
          rows.unshift(
            ["Δ", fmt(r.D, 5)],
            ["Δ / (hk)", `<b>${fmt(r.q, 5)}</b>`],
            ["route 1: f<sub>xy</sub>(ξ,η)", fmt(r.v1, 5)],
            ["route 2: f<sub>yx</sub>(ξ′,η′)", fmt(r.v2, 5)]);
        } else rows.unshift(["rectangle", "choose h ≠ 0 and k ≠ 0"]);
        if (Math.abs(a - b) > 1e-9) note = `<span class="no">f<sub>xy</sub>(0,0) = ${fmt(a, 1)} but f<sub>yx</sub>(0,0) = ${fmt(b, 1)}: the mixed partials are <b>not</b> continuous at 0 (their limit depends on the direction), so the theorem does not apply. For the rectangle [0,h]×[0,k] we get Δ/(hk) = (h²−k²)/(h²+k²).</span>`;
        else note = `<span class="ok">Both routes give the same number, and it tends to f<sub>xy</sub>(p) = f<sub>yx</sub>(p).</span>`;
        out(rows, note);
      };

      ML.drag(st, () => [S.p], (i, x, y) => { S.p.x = x; S.p.y = y; clampP(); }, { snap: 0.05 });
      st.redraw();
    },

    idea: String.raw`Cut the rectangle's double difference \(\Delta\) in two different orders. Mean Value Theorem twice turns \(\Delta\) into \(f_{xy}\cdot hk\) in one order and \(f_{yx}\cdot hk\) in the other, so both mixed partials equal \(\Delta/(hk)\) up to nearby points; continuity at \(p\) finishes.`,
    steps: [
      { t: String.raw`Define the double difference.`, d: String.raw`For small \(h,k\ne0\): \(\Delta=f(x{+}h,y{+}k)-f(x{+}h,y)-f(x,y{+}k)+f(x,y)\). It is "(top edge) − (bottom edge)" or equally "(right edge) − (left edge)".` },
      { t: String.raw`Route 1, first MVT (in \(x\)).`, d: String.raw`Let \(\varphi(s)=f(s,y{+}k)-f(s,y)\). Then \(\Delta=\varphi(x{+}h)-\varphi(x)=\varphi'(\xi)\,h=\big[f_x(\xi,y{+}k)-f_x(\xi,y)\big]h\) for some \(\xi\) between \(x\) and \(x{+}h\).` },
      { t: String.raw`Route 1, second MVT (in \(y\)).`, d: String.raw`The function \(t\mapsto f_x(\xi,t)\) is differentiable (\(f_{xy}\) exists), so \(f_x(\xi,y{+}k)-f_x(\xi,y)=f_{xy}(\xi,\eta)\,k\) for some \(\eta\) between \(y\) and \(y{+}k\). Therefore \(\Delta=f_{xy}(\xi,\eta)\,hk\).` },
      { t: String.raw`Route 2, same idea with the roles swapped.`, d: String.raw`With \(\psi(t)=f(x{+}h,t)-f(x,t)\): \(\Delta=\psi'(\eta')k=\big[f_y(x{+}h,\eta')-f_y(x,\eta')\big]k=f_{yx}(\xi',\eta')\,hk\), with \(\xi',\eta'\) inside the rectangle.` },
      { t: String.raw`Compare.`, d: String.raw`For every small rectangle: \(f_{xy}(\xi,\eta)=\dfrac{\Delta}{hk}=f_{yx}(\xi',\eta')\), where both points lie within distance \(\|(h,k)\|\) of \(p\).` },
      { t: String.raw`Let the rectangle shrink to \(p\).`, d: String.raw`Take \(h=k\to0\). Both points tend to \(p\); by continuity of \(f_{xy}\) and \(f_{yx}\) at \(p\): \(f_{xy}(p)=\lim\dfrac{\Delta}{hk}=f_{yx}(p)\). \(\blacksquare\)` },
      { t: String.raw`Where continuity was used (the red-flag example).`, d: String.raw`For \(f=\dfrac{xy(x^2-y^2)}{x^2+y^2}\), \(f(0,0)=0\): \(f_x(0,y)=-y\) and \(f_y(x,0)=x\), so \(f_{xy}(0,0)=-1\ne1=f_{yx}(0,0)\). The mixed partials exist everywhere but are discontinuous at \(0\); the limit in the last step fails.` },
    ],
    memorize: {
      formula: String.raw`\Delta=f(x{+}h,y{+}k)-f(x{+}h,y)-f(x,y{+}k)+f(x,y)=f_{xy}(\xi,\eta)\,hk=f_{yx}(\xi',\eta')\,hk`,
      bullets: [
        String.raw`Key object: the <b>double difference</b> over a rectangle; MVT applied <b>twice</b>, in two orders.`,
        String.raw`Conclusion \(f_{xy}(p)=f_{yx}(p)\) uses continuity of the mixed partials <i>at \(p\)</i>.`,
        String.raw`Standard consequence: for \(C^2\) functions the Hessian matrix is symmetric.`,
      ],
      pitfalls: [
        String.raw`Without continuity of the mixed partials equality can fail (\(xy(x^2-y^2)/(x^2+y^2)\)). Quote this example when asked "is the hypothesis needed?".`,
        String.raw`Say which convention you use for \(f_{xy}\): \(\partial_y\partial_x f\) here. The theorem makes the order irrelevant, but the notation must be defined.`,
        String.raw`\(\xi,\eta\) (route 1) and \(\xi',\eta'\) (route 2) are different points; only their common limit \(p\) is the same.`,
      ],
    },
  });
})(window.ML);
