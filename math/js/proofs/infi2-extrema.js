"use strict";
/* Infi 2 · Extrema: Fermat, second-derivative test, Lagrange multipliers. */
(function (ML) {
  const C = ML.C;

  /* ------------------------------------------------------------------ */
  /* helpers shared by the three vizzes                                  */
  const hessNum = (F, x, y) => {            // second partials by central differences
    const h = 1e-3;
    const fxx = (F(x + h, y) - 2 * F(x, y) + F(x - h, y)) / (h * h);
    const fyy = (F(x, y + h) - 2 * F(x, y) + F(x, y - h)) / (h * h);
    const fxy = (F(x + h, y + h) - F(x + h, y - h) - F(x - h, y + h) + F(x - h, y - h)) / (4 * h * h);
    return [fxx, fxy, fyy];
  };
  const hessFromGrad = (F, x, y) => {       // Jacobian of the gradient (for Newton)
    const h = 1e-4, a = ML.num.grad(F, x + h, y), b = ML.num.grad(F, x - h, y), c = ML.num.grad(F, x, y + h), d = ML.num.grad(F, x, y - h);
    return [[(a[0] - b[0]) / (2 * h), (c[0] - d[0]) / (2 * h)], [(a[1] - b[1]) / (2 * h), (c[1] - d[1]) / (2 * h)]];
  };

  /* ================================================================== */
  /* 1 · Fermat: local extremum  =>  grad f = 0                          */
  /* ================================================================== */
  const R1 = 3;
  const FERMAT_FN = [
    { name: "Peak (a local maximum)", f: (x, y) => 3 - 0.5 * (x - 0.8) ** 2 - 0.8 * (y + 0.6) ** 2 },
    { name: "Waves: sin x · cos y", f: (x, y) => 2 * Math.sin(x) * Math.cos(y) },
    { name: "Saddle: (x² − y²)/2 (∇f = 0, but no extremum)", f: (x, y) => (x * x - y * y) / 2 },
    { name: "Cubic: x³/2 + y²/2 (∇f = 0, but no extremum)", f: (x, y) => 0.5 * x ** 3 + 0.5 * y * y,
      kind: "degenerate: along the x-axis f = x³/2 changes sign, so it is <b>not</b> an extremum" },
  ];

  function newton(F, x, y, lim) {
    for (let k = 0; k < 80; k++) {
      const g = ML.num.grad(F, x, y), gn = Math.hypot(g[0], g[1]);
      if (gn < 1e-6) return [x, y];
      const H = hessFromGrad(F, x, y), det = H[0][0] * H[1][1] - H[0][1] * H[1][0];
      if (Math.abs(det) < 1e-12) return gn < 1e-4 ? [x, y] : null;
      let dx = (H[1][1] * g[0] - H[0][1] * g[1]) / det, dy = (-H[1][0] * g[0] + H[0][0] * g[1]) / det;
      const L = Math.hypot(dx, dy);
      if (L > 0.8) { dx *= 0.8 / L; dy *= 0.8 / L; }
      x -= dx; y -= dy;
      if (!(Math.abs(x) < lim + 0.5 && Math.abs(y) < lim + 0.5)) return null;
    }
    const g = ML.num.grad(F, x, y);
    return Math.hypot(g[0], g[1]) < 1e-4 ? [x, y] : null;
  }
  /** nearest critical point reachable by Newton from p or from rings of starts around p */
  function findCritical(F, p, lim) {
    const starts = [[p.x, p.y]];
    for (const r of [0.4, 0.9, 1.5, 2.2]) for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8; starts.push([p.x + r * Math.cos(a), p.y + r * Math.sin(a)]);
    }
    let best = null, bd = Infinity;
    for (const [x0, y0] of starts) {
      const s = newton(F, x0, y0, lim);
      if (s && Math.abs(s[0]) <= lim && Math.abs(s[1]) <= lim) {
        const d = Math.hypot(s[0] - p.x, s[1] - p.y);
        if (d < bd) { bd = d; best = s; }
      }
    }
    return best;
  }

  ML.register({
    id: "fermat-critical-point",
    course: "infi2",
    topic: "extrema",
    title: "Fermat: a local extremum is a critical point",
    blurb: "If p is a local max or min of a differentiable f, then ∇f(p) = 0. Reduce to one variable twice.",
    statement: String.raw`Let \(f:U\to\mathbb R\) have partial derivatives at \(p=(a,b)\in U\) (\(U\subseteq\mathbb R^2\) open). If \(f\) has a local maximum or minimum at \(p\), then \(\nabla f(p)=(f_x(a,b),\,f_y(a,b))=(0,0)\).`,
    vizIntro: String.raw`<b>Drag the white point.</b> The pink graph is the slice of \(f\) along the horizontal line through the point (slope \(f_x\)); the blue graph is the slice along the vertical line (slope \(f_y\)). If the slope in either slice is not \(0\), you can walk up <i>and</i> down, so \(p\) is no extremum. Press the button to snap to a critical point, then try the saddle and the cubic: \(\nabla f=0\) is necessary, not sufficient.`,

    viz(box) {
      const st = ML.stage(box, { x: [-R1, R1], y: [-R1, R1] });
      const S = { fi: 0, p: { x: 1.6, y: 0.9 } };
      const F = () => FERMAT_FN[S.fi].f;
      let hm = null;

      ML.select(st.panel, {
        label: "Surface", options: FERMAT_FN.map((q, i) => [i, q.name]),
        onChange: (v) => { S.fi = +v; build(); st.redraw(); },
      });
      const msg = ML.h("div", { class: "caption" });
      ML.button(st.panel, "Find a critical point nearby", () => {
        const c = findCritical(F(), S.p, R1);
        if (c) { S.p.x = c[0]; S.p.y = c[1]; msg.textContent = "Snapped to a point where ∇f = 0 (Newton's method on ∇f = 0)."; }
        else msg.textContent = "No critical point in the window for this surface (try another one).";
        st.redraw();
      });
      st.panel.append(msg);
      const gx = st.extra({ x: [-R1, R1], y: [-1, 1], height: 120 });
      const gy = st.extra({ x: [-R1, R1], y: [-1, 1], height: 120 });
      const out = ML.readout(st.panel);

      function build() {
        hm = ML.heatmap(F(), [-R1, R1], [-R1, R1], { n: 180, bands: 14 });
        const pad = (hm.max - hm.min) * 0.08 || 1;
        gx.view.o.y = gy.view.o.y = [hm.min - pad, hm.max + pad];
      }

      const slice = (g, fn, t0, slope, color, label) => {
        g.axes(); g.grid(1);
        g.plot(fn, -R1, R1, color, 2.5);
        const y0 = fn(t0), span = 1.3;
        g.line(t0 - span, y0 - slope * span, t0 + span, y0 + slope * span, C.gold, 2, [5, 4]);
        g.dot(t0, y0, C.white, 5);
        g.text(label, -R1 + 0.1, hm.max, C.text, 0, 14, "600 12px system-ui");
      };

      st.draw((v) => {
        const f = F(), { x, y } = S.p, [fx, fy] = ML.num.grad(f, x, y), gn = Math.hypot(fx, fy);
        v.image(hm.canvas, -R1, R1, -R1, R1);
        v.axes("rgba(255,255,255,.2)");
        v.line(-R1, y, R1, y, C.pink, 2, [6, 5]);
        v.line(x, -R1, x, R1, C.cyan, 2, [6, 5]);
        if (gn > 0.02) v.arrow(x, y, x + fx / gn * 0.9, y + fy / gn * 0.9, C.gold, 4);
        v.handle(x, y, C.white);
        v.text(gn > 0.02 ? "∇f" : "∇f ≈ 0", x, y, C.gold, 12, -14);
      });
      gx.draw((g) => {
        const f = F(), { x, y } = S.p;
        slice(g, (t) => f(t, y), x, ML.num.fx(f, x, y), C.pink, "f(x, y₀)  slice along the pink line");
      });
      gy.draw((g) => {
        const f = F(), { x, y } = S.p;
        slice(g, (t) => f(x, t), y, ML.num.fy(f, x, y), C.cyan, "f(x₀, y)  slice along the blue line");
      });

      st.after = () => {
        const f = F(), { x, y } = S.p, [fx, fy] = ML.num.grad(f, x, y), gn = Math.hypot(fx, fy);
        let verdict, note;
        if (gn > 0.03) {
          verdict = `<span class="no">∇f ≠ 0</span>`;
          note = "A non-zero slope means the function rises in one direction and falls in the opposite one, so p is <b>not</b> a local extremum. Contrapositive of Fermat.";
        } else {
          const [a, b, c] = hessNum(f, x, y), D = a * c - b * b;
          let kind;
          if (FERMAT_FN[S.fi].kind) kind = FERMAT_FN[S.fi].kind;
          else if (D > 1e-3) kind = a > 0 ? "local minimum" : "local maximum";
          else if (D < -1e-3) kind = "saddle point: <b>no</b> extremum";
          else kind = "degenerate (D≈0): look at f directly; here it can be an inflection, not an extremum";
          verdict = `<span class="ok">∇f ≈ 0: critical point</span>`;
          note = `Critical point, and it is a ${kind}. Remember: Fermat is a one-way street (extremum ⇒ ∇f = 0).`;
        }
        out([
          ["point p", `(${ML.fmt(x)}, ${ML.fmt(y)})`],
          ["f(p)", ML.fmt(f(x, y))],
          ["f<sub>x</sub>(p)", ML.fmt(fx)],
          ["f<sub>y</sub>(p)", ML.fmt(fy)],
          ["|∇f(p)|", ML.fmt(gn)],
          ["verdict", verdict],
        ], note);
      };
      ML.drag(st, () => [S.p], (i, x, y) => { S.p.x = x; S.p.y = y; msg.textContent = ""; }, { clamp: [-R1, R1, -R1, R1] });
      build(); st.redraw();
    },

    idea: String.raw`Slice the surface along the two coordinate lines through \(p\). Each slice is a one-variable function with a local extremum at \(0\), and for those the derivative must vanish.`,
    steps: [
      { t: String.raw`Set up: assume \(p=(a,b)\) is a local minimum.`, d: String.raw`There is \(\delta>0\) with \(f(x,y)\ge f(a,b)\) whenever \(|(x,y)-(a,b)|<\delta\). (For a maximum apply everything to \(-f\).)` },
      { t: String.raw`Restrict to the horizontal line through \(p\).`, d: String.raw`Define \(\varphi(t)=f(a+t,\,b)\) for \(|t|<\delta\). Because \((a+t,b)\) is within \(\delta\) of \(p\), \(\varphi(t)\ge\varphi(0)\): \(\varphi\) has a local minimum at \(t=0\).` },
      { t: String.raw`The derivative of \(\varphi\) is the partial derivative.`, d: String.raw`By definition \(\varphi'(0)=\lim_{t\to0}\frac{f(a+t,b)-f(a,b)}{t}=f_x(a,b)\), which exists by assumption.` },
      { t: String.raw`One-variable Fermat: \(\varphi'(0)=0\).`, d: String.raw`For \(t>0\): \(\frac{\varphi(t)-\varphi(0)}{t}\ge0\), so the limit is \(\ge0\). For \(t<0\) the quotient is \(\le0\), so the limit is \(\le0\). Both one-sided limits equal \(\varphi'(0)\), hence \(\varphi'(0)=0\), i.e. \(f_x(a,b)=0\).` },
      { t: String.raw`Repeat on the vertical line.`, d: String.raw`With \(\psi(t)=f(a,\,b+t)\) the same argument gives \(f_y(a,b)=\psi'(0)=0\).` },
      { t: String.raw`Conclude and note what we did <i>not</i> prove.`, d: String.raw`\(\nabla f(a,b)=(0,0)\). The converse is false: \(f=x^2-y^2\) and \(f=x^3+y^2\) have \(\nabla f(0,0)=0\) but no extremum there.` },
    ],
    memorize: {
      formula: String.raw`p\ \text{local extremum}\ \Longrightarrow\ \nabla f(p)=0\qquad(\text{not }\Longleftarrow)`,
      bullets: [
        String.raw`Proof = apply the 1-D Fermat theorem to \(t\mapsto f(p+te_i)\) for each coordinate direction \(e_i\).`,
        String.raw`Only existence of the partials at \(p\) is used, not full differentiability.`,
        String.raw`Contrapositive for optimization: if \(\nabla f(p)\ne0\), move along \(\pm\nabla f\) to get larger/smaller values.`,
        String.raw`Candidates for extrema on a closed region: critical points, boundary points, and points where \(f\) is not differentiable.`,
      ],
      pitfalls: [
        String.raw`\(\nabla f(p)=0\) does <b>not</b> imply an extremum (saddle \(x^2-y^2\), inflection \(x^3+y^2\)).`,
        String.raw`The theorem is for <i>interior</i> points. On a boundary the max/min need not be critical.`,
        String.raw`Don't skip the one-sided-limit argument in the 1-D step: that is where the actual proof happens.`,
      ],
    },
  });

  /* ================================================================== */
  /* 2 · Second-derivative (Hessian) test                                */
  /* ================================================================== */
  const HESS_FN = [
    { name: "x² + y²", f: (x, y) => x * x + y * y, H: [2, 0, 2], note: "" },
    { name: "−x² − 2y²", f: (x, y) => -x * x - 2 * y * y, H: [-2, 0, -4], note: "" },
    { name: "x² − y²", f: (x, y) => x * x - y * y, H: [2, 0, -2], note: "" },
    { name: "x² + xy + y² (tilted axes)", f: (x, y) => x * x + x * y + y * y, H: [2, 1, 2], note: "" },
    { name: "x⁴ + y⁴ (D = 0)", f: (x, y) => x ** 4 + y ** 4, H: [0, 0, 0], note: "Here D = 0 and the test says nothing, yet the origin <b>is</b> a strict minimum." },
    { name: "x² + y³ (D = 0)", f: (x, y) => x * x + y ** 3, H: [2, 0, 0], note: "Here D = 0 too, but the origin is <b>not</b> an extremum (y³ changes sign). Same D, different truth: the test is inconclusive." },
  ];

  ML.register({
    id: "second-derivative-test",
    course: "infi2",
    topic: "extrema",
    title: "The second-derivative (Hessian) test",
    blurb: "D = f_xx f_yy − f_xy² decides min / max / saddle, via Taylor and completing the square.",
    statement: String.raw`Let \(f\) be \(C^2\) near a critical point \(p\) (\(\nabla f(p)=0\)) and \(D=f_{xx}f_{yy}-f_{xy}^2\) at \(p\). If \(D>0,\,f_{xx}>0\): strict local min. If \(D>0,\,f_{xx}<0\): strict local max. If \(D<0\): saddle point. If \(D=0\): no conclusion.`,
    vizIntro: String.raw`Near a critical point \(f(p+h)\approx f(p)+Q(h)\) with \(Q(h)=\tfrac12 h^{T}Hh\). Switch between <b>f</b> and its quadratic approximation <b>Q</b> and <b>zoom in</b>: the two pictures become identical. Orange = above \(f(p)\), blue = below. Rotate the direction \(u\) to see the 1-D profile through the point: it is a parabola \(\tfrac12(u^THu)r^2\).`,

    viz(box) {
      const st = ML.stage(box, { x: [-1.2, 1.2], y: [-1.2, 1.2] });
      const S = { fi: 0, w: 1.2, theta: 30, mode: 0 };
      const cache = { key: "", img: null };
      const Hm = () => { const [a, b, c] = HESS_FN[S.fi].H; return [[a, b], [b, c]]; };
      const Q = (x, y) => { const [a, b, c] = HESS_FN[S.fi].H; return 0.5 * (a * x * x + 2 * b * x * y + c * y * y); };

      ML.select(st.panel, {
        label: "Function f (critical point at the origin)", options: HESS_FN.map((q, i) => [i, q.name]),
        onChange: (v) => { S.fi = +v; st.redraw(); },
      });
      ML.select(st.panel, { label: "Show", options: [[0, "f(x, y)"], [1, "Quadratic approximation Q(h) = ½ hᵀ H h"]], onChange: (v) => { S.mode = +v; st.redraw(); } });
      const zoom = ML.slider(st.panel, {
        label: "Zoom window ±w", min: 0.1, max: 2, step: 0.05, value: S.w,
        onInput: (v) => { S.w = v; st.view.o.x = [-v, v]; st.view.o.y = [-v, v]; st.redraw(); },
      });
      ML.slider(st.panel, { label: "Direction u (degrees)", min: 0, max: 180, step: 1, value: S.theta, fmt: (v) => v + "°", onInput: (v) => { S.theta = v; st.redraw(); } });
      const prof = st.extra({ x: [-1, 1], y: [-1, 1], height: 130 });
      const out = ML.readout(st.panel);

      const heat = () => {
        const key = `${S.fi}|${S.mode}|${S.w}`;
        if (cache.key !== key) {
          let M = 0; const f = HESS_FN[S.fi].f;
          for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) M = Math.max(M, Math.abs(f(-S.w + 2 * S.w * i / 40, -S.w + 2 * S.w * j / 40)));
          M = Math.max(M, 1e-9);
          cache.img = ML.heatmap(S.mode ? Q : f, [-S.w, S.w], [-S.w, S.w], { n: 150, bands: 12, stops: ML.DIVERGING, min: -M, max: M });
          cache.key = key;
        }
        return cache.img;
      };

      st.draw((v) => {
        const w = S.w, e = ML.la.eig(Hm()), th = ML.rad(S.theta), u = [Math.cos(th), Math.sin(th)];
        v.image(heat().canvas, -w, w, -w, w);
        v.axes("rgba(255,255,255,.18)");
        // Hessian eigen-directions (principal axes of Q)
        e.vals.forEach(({ l, v: ev }) => {
          v.line(-ev[0] * w * 2, -ev[1] * w * 2, ev[0] * w * 2, ev[1] * w * 2, C.gold, 2, [8, 6]);
          v.text("λ=" + ML.fmt(l), ev[0] * w * 0.75, ev[1] * w * 0.75, C.gold, 6, -6, "600 12px system-ui");
        });
        v.arrow(0, 0, u[0] * w * 0.9, u[1] * w * 0.9, C.white, 3);
        v.dot(0, 0, C.white, 5, "#000");
        v.text(S.mode ? "Q(h)" : "f", -w * 0.95, w * 0.9, C.white, 0, 0, "700 14px system-ui");
        // profile graph limits depend on the zoom and the direction
        const f = HESS_FN[S.fi].f;
        let m = 1e-9;
        for (let i = 0; i <= 60; i++) { const r = -w + 2 * w * i / 60; m = Math.max(m, Math.abs(f(r * u[0], r * u[1]))); }
        prof.view.o.x = [-w, w]; prof.view.o.y = [-m * 1.15, m * 1.15];
      });
      prof.draw((g) => {
        const w = S.w, th = ML.rad(S.theta), u = [Math.cos(th), Math.sin(th)], f = HESS_FN[S.fi].f;
        g.axes(); g.grid(Math.max(0.1, Math.round(w * 5) / 10));
        g.plot((r) => f(r * u[0], r * u[1]), -w, w, C.white, 2.5);
        g.plot((r) => Q(r * u[0], r * u[1]), -w, w, C.gold, 1.8, 120, [5, 4]);
        g.text("f(r·u) solid, ½(uᵀHu)r² dashed", w * 0.97, g.o.y[1], C.text, 0, 14, "600 11px system-ui", "right");
      });

      st.after = () => {
        const [a, b, c] = HESS_FN[S.fi].H, D = a * c - b * b, e = ML.la.eig(Hm());
        let verdict;
        if (Math.abs(D) < 1e-9) verdict = `<span class="warn">D = 0: inconclusive</span>`;
        else if (D < 0) verdict = `<span class="no">D &lt; 0: saddle point</span>`;
        else verdict = a > 0 ? `<span class="ok">D &gt; 0, f<sub>xx</sub> &gt; 0: strict local minimum</span>` : `<span class="ok">D &gt; 0, f<sub>xx</sub> &lt; 0: strict local maximum</span>`;
        const eg = e.complex ? "–" : (e.scalar ? ML.fmt(e.tr / 2) + ", " + ML.fmt(e.tr / 2) : e.vals.map((q) => ML.fmt(q.l)).join(", "));
        const u = ML.rad(S.theta), uHu = a * Math.cos(u) ** 2 + 2 * b * Math.cos(u) * Math.sin(u) + c * Math.sin(u) ** 2;
        out([
          ["f<sub>xx</sub>, f<sub>xy</sub>, f<sub>yy</sub>", `${ML.fmt(a)}, ${ML.fmt(b)}, ${ML.fmt(c)}`],
          ["D = f<sub>xx</sub>f<sub>yy</sub> − f<sub>xy</sub>²", ML.fmt(D)],
          ["eigenvalues of H", eg],
          ["uᵀHu in direction u", ML.fmt(uHu) + (uHu > 1e-9 ? "  (curves up)" : uHu < -1e-9 ? "  (curves down)" : "  (flat)")],
          ["verdict", verdict],
        ], HESS_FN[S.fi].note || (D > 1e-9 ? "Completing the square: Q = ½f<sub>xx</sub>(h₁ + (f<sub>xy</sub>/f<sub>xx</sub>)h₂)² + ½(D/f<sub>xx</sub>)h₂², which is definite exactly when D &gt; 0." : D < -1e-9 ? "H has one positive and one negative eigenvalue: Q goes up in one direction and down in another." : ""));
      };
      st.view.o.x = st.view.o.y = [-S.w, S.w];
      st.redraw();
    },

    idea: String.raw`At a critical point \(f(p+h)=f(p)+Q(h)+o(|h|^2)\). If the quadratic form \(Q\) is definite it beats the error term; completing the square shows definiteness is equivalent to \(D>0\) and the sign of \(f_{xx}\).`,
    steps: [
      { t: String.raw`Second-order Taylor at a critical point.`, d: String.raw`Since \(\nabla f(p)=0\) and \(f\in C^2\): \(f(p+h)=f(p)+\tfrac12 h^{T}Hh+R(h)\) with \(R(h)/|h|^2\to0\). Here \(H=\begin{pmatrix}f_{xx}&f_{xy}\\ f_{xy}&f_{yy}\end{pmatrix}\) and \(Q(h)=\tfrac12h^THh\).` },
      { t: String.raw`Case \(D>0,\ f_{xx}>0\): complete the square.`, d: String.raw`\(2Q=f_{xx}h_1^2+2f_{xy}h_1h_2+f_{yy}h_2^2=f_{xx}\Big(h_1+\tfrac{f_{xy}}{f_{xx}}h_2\Big)^2+\tfrac{D}{f_{xx}}h_2^2.\) Both coefficients are positive, so \(Q(h)>0\) for \(h\ne0\): \(Q\) is positive definite.` },
      { t: String.raw`A positive definite form dominates \(|h|^2\).`, d: String.raw`\(Q(h)=|h|^2\,Q(h/|h|)\) and \(Q\) is continuous and positive on the compact unit circle, so it has a minimum \(m>0\) there: \(Q(h)\ge m|h|^2\).` },
      { t: String.raw`Absorb the remainder.`, d: String.raw`Because \(R(h)=o(|h|^2)\), there is \(\delta>0\) with \(|R(h)|\le\tfrac m2|h|^2\) for \(|h|<\delta\). Hence \(f(p+h)-f(p)\ge\tfrac m2|h|^2>0\) for \(0<|h|<\delta\): strict local minimum.` },
      { t: String.raw`Case \(D>0,\ f_{xx}<0\).`, d: String.raw`Apply step 2–4 to \(-f\): its \(f_{xx}\) becomes \(-f_{xx}>0\) and \(D\) is unchanged (two sign flips). So \(-f\) has a strict min, i.e. \(f\) has a strict max.` },
      { t: String.raw`Case \(D<0\): saddle.`, d: String.raw`\(H\) has eigenvalues of opposite signs, so there are directions \(u,w\) with \(Q(u)>0>Q(w)\). By step 4's remainder argument \(f(p+tu)>f(p)\) and \(f(p+tw)<f(p)\) for all small \(t\ne0\): every neighborhood contains higher and lower values.` },
      { t: String.raw`Case \(D=0\): nothing can be said.`, d: String.raw`\(Q\) is degenerate (zero in some direction) so the remainder decides. \(x^4+y^4\) has a min and \(x^2+y^3\) has no extremum, both with \(D=0\) at the origin.` },
    ],
    memorize: {
      formula: String.raw`D=f_{xx}f_{yy}-f_{xy}^2:\quad \begin{cases}D>0,\ f_{xx}>0&\text{min}\\ D>0,\ f_{xx}<0&\text{max}\\ D<0&\text{saddle}\\ D=0&\text{?}\end{cases}`,
      bullets: [
        String.raw`\(D=\det H=\lambda_1\lambda_2\) and \(f_{xx}+f_{yy}=\lambda_1+\lambda_2\): \(D>0\) means the eigenvalues share a sign, the trace gives which.`,
        String.raw`Proof skeleton: Taylor \(\Rightarrow\) \(Q\) definite \(\Rightarrow\) \(Q\ge m|h|^2\) \(\Rightarrow\) beats \(o(|h|^2)\).`,
        String.raw`Positive definite \(\iff f_{xx}>0\) and \(D>0\) (Sylvester / completing the square).`,
        String.raw`Needs \(C^2\) (continuous second partials) so that Taylor and the symmetry \(f_{xy}=f_{yx}\) hold.`,
      ],
      pitfalls: [
        String.raw`\(D=0\) is <b>inconclusive</b>, not "no extremum": \(x^4+y^4\) vs \(x^2+y^3\).`,
        String.raw`\(D>0\) alone doesn't tell min from max. You must also check the sign of \(f_{xx}\) (or \(f_{yy}\)).`,
        String.raw`Only valid at a <i>critical point</i>: check \(\nabla f=0\) first.`,
      ],
    },
  });

  /* ================================================================== */
  /* 3 · Lagrange multipliers                                            */
  /* ================================================================== */
  const CONSTRAINTS = [
    { name: "circle: x² + y² = 4", g: (x, y) => x * x + y * y, c: 4, d: 2 },
    { name: "ellipse: x² + 4y² = 4", g: (x, y) => x * x + 4 * y * y, c: 4, d: 2 },
    { name: "superellipse: x⁴ + y⁴ = 8", g: (x, y) => x ** 4 + y ** 4, c: 8, d: 4 },
  ];
  const OBJECTIVES = [
    { name: "f = x + y", f: (x, y) => x + y },
    { name: "f = x·y", f: (x, y) => x * y },
    { name: "f = (x−1.5)² + (y−1)²  (squared distance to (1.5, 1))", f: (x, y) => (x - 1.5) ** 2 + (y - 1) ** 2 },
  ];
  const TAU = 2 * Math.PI;

  ML.register({
    id: "lagrange-multipliers",
    course: "infi2",
    topic: "extrema",
    title: "Lagrange multipliers",
    blurb: "At a constrained extremum the gradients line up: ∇f = λ∇g. Proof: both are ⟂ to the constraint curve.",
    statement: String.raw`Let \(f,g\in C^1\) near \(p\), \(g(p)=c\), \(\nabla g(p)\ne0\). If \(p\) is a local extremum of \(f\) restricted to the level set \(\{g=c\}\), then there is \(\lambda\in\mathbb R\) with \(\;\nabla f(p)=\lambda\,\nabla g(p)\).`,
    vizIntro: String.raw`<b>Drag the point along the constraint curve</b> (or use the slider). The yellow arrow is \(\nabla f\), the blue arrow is \(\nabla g\) (both drawn with unit length, real sizes in the table). The dashed white segment is the tangent. The bottom graph is \(\sin\) of the angle between the gradients: where it crosses \(0\), the graph of \(F(t)=f(\gamma(t))\) above has a max or min.`,

    viz(box) {
      const st = ML.stage(box, { x: [-3, 3], y: [-3, 3] });
      const S = { ci: 0, oi: 0, t: 0.6, heat: null, zeros: [], Fmin: 0, Fmax: 1 };
      const con = () => CONSTRAINTS[S.ci], obj = () => OBJECTIVES[S.oi].f;
      const gam = (t) => {                           // star-shaped parametrization by polar angle
        const k = con(), co = Math.cos(t), si = Math.sin(t), r = Math.pow(k.c / k.g(co, si), 1 / k.d);
        return [r * co, r * si];
      };
      const grads = (t) => {
        const [x, y] = gam(t), gf = ML.num.grad(obj(), x, y), gg = ML.num.grad(con().g, x, y);
        return { x, y, gf, gg, cross: gf[0] * gg[1] - gf[1] * gg[0], nf: Math.hypot(gf[0], gf[1]), ng: Math.hypot(gg[0], gg[1]) };
      };
      const crossAt = (t) => grads(t).cross;

      ML.select(st.panel, { label: "Constraint g = c", options: CONSTRAINTS.map((q, i) => [i, q.name]), onChange: (v) => { S.ci = +v; rebuild(); } });
      ML.select(st.panel, { label: "Objective f", options: OBJECTIVES.map((q, i) => [i, q.name]), onChange: (v) => { S.oi = +v; rebuild(); } });
      const tSl = ML.slider(st.panel, { label: "Position t (angle)", min: 0, max: 359, step: 1, value: ML.deg(S.t), fmt: (v) => v + "°", onInput: (v) => { S.t = ML.rad(v); st.redraw(); } });
      const gF = st.extra({ x: [0, TAU], y: [-1, 1], height: 105 });
      const gS = st.extra({ x: [0, TAU], y: [-1.15, 1.15], height: 95 });
      const out = ML.readout(st.panel);

      function rebuild() {
        S.heat = ML.heatmap(obj(), [-3, 3], [-3, 3], { n: 170, bands: 14 });
        // zeros of the cross product (sign changes, refined by bisection) and the range of F
        const N = 720, z = [];
        let prev = crossAt(0), mn = Infinity, mx = -Infinity;
        for (let k = 0; k <= N; k++) {
          const t = TAU * k / N, [x, y] = gam(t), Fv = obj()(x, y);
          mn = Math.min(mn, Fv); mx = Math.max(mx, Fv);
          const cur = crossAt(t);
          if (k > 0 && cur === 0) z.push(t);              // sample lands exactly on a zero (symmetric cases)
          else if (k > 0 && prev * cur < 0) {
            let a = TAU * (k - 1) / N, b = t;
            for (let i = 0; i < 40; i++) { const m = (a + b) / 2; (crossAt(a) * crossAt(m) <= 0) ? (b = m) : (a = m); }
            z.push((a + b) / 2);
          }
          prev = cur;
        }
        S.zeros = z; const pad = (mx - mn) * 0.12 || 1; gF.view.o.y = [mn - pad, mx + pad];
        S.Fmin = mn; S.Fmax = mx; st.redraw();
      }

      st.draw((v) => {
        const gm = grads(S.t);
        v.image(S.heat.canvas, -3, 3, -3, 3);
        v.axes("rgba(255,255,255,.18)");
        v.path(gam, 0, TAU, C.white, 3.5, 360);
        S.zeros.forEach((t) => { const [x, y] = gam(t); v.circle(x, y, 0.09, C.gold, null, 2.5); });
        // tangent from finite difference
        const h = 1e-3, a = gam(S.t - h), b = gam(S.t + h), tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const tx = (b[0] - a[0]) / tl, ty = (b[1] - a[1]) / tl;
        v.line(gm.x - tx, gm.y - ty, gm.x + tx, gm.y + ty, C.white, 2, [4, 4]);
        if (gm.nf > 1e-6) v.arrow(gm.x, gm.y, gm.x + gm.gf[0] / gm.nf * 1.1, gm.y + gm.gf[1] / gm.nf * 1.1, C.yellow, 4);
        if (gm.ng > 1e-6) v.arrow(gm.x, gm.y, gm.x + gm.gg[0] / gm.ng * 1.1, gm.y + gm.gg[1] / gm.ng * 1.1, C.cyan, 4);
        v.handle(gm.x, gm.y, C.white);
        v.text("∇f", gm.x + gm.gf[0] / (gm.nf || 1) * 1.1, gm.y + gm.gf[1] / (gm.nf || 1) * 1.1, C.yellow, 6, -6);
        v.text("∇g", gm.x + gm.gg[0] / (gm.ng || 1) * 1.1, gm.y + gm.gg[1] / (gm.ng || 1) * 1.1, C.cyan, 6, 14);
      });
      gF.draw((g) => {
        g.axes(); g.grid(1);
        g.plot((t) => { const p = gam(t); return obj()(p[0], p[1]); }, 0, TAU, C.blue, 2.5, 360);
        S.zeros.forEach((t) => { const p = gam(t); g.dot(t, obj()(p[0], p[1]), C.gold, 6); });
        const p = gam(S.t); g.dot(S.t, obj()(p[0], p[1]), C.white, 5);
        g.text("F(t) = f(γ(t))", 0.1, gF.view.o.y[1], C.text, 0, 13, "600 11px system-ui");
      });
      gS.draw((g) => {
        g.axes(); g.grid(1);
        g.plot((t) => { const q = grads(t); return q.nf * q.ng > 1e-9 ? q.cross / (q.nf * q.ng) : 0; }, 0, TAU, C.pink, 2.5, 360);
        S.zeros.forEach((t) => g.dot(t, 0, C.gold, 6));
        const q = grads(S.t); g.dot(S.t, q.nf * q.ng > 1e-9 ? q.cross / (q.nf * q.ng) : 0, C.white, 5);
        g.text("sin(angle between ∇f and ∇g)", 0.1, 1.15, C.text, 0, 13, "600 11px system-ui");
      });

      st.after = () => {
        const q = grads(S.t), f = obj(), h = 1e-4;
        const dF = (f(...gam(S.t + h)) - f(...gam(S.t - h))) / (2 * h);
        const s = q.nf * q.ng > 1e-9 ? q.cross / (q.nf * q.ng) : 0, par = Math.abs(s) < 0.02;
        const lam = q.ng > 1e-9 ? (q.gf[0] * q.gg[0] + q.gf[1] * q.gg[1]) / (q.ng * q.ng) : NaN;
        out([
          ["point γ(t)", `(${ML.fmt(q.x)}, ${ML.fmt(q.y)})`],
          ["∇f", `(${ML.fmt(q.gf[0])}, ${ML.fmt(q.gf[1])})`],
          ["∇g", `(${ML.fmt(q.gg[0])}, ${ML.fmt(q.gg[1])})`],
          ["sin(angle) ∝ f<sub>x</sub>g<sub>y</sub> − f<sub>y</sub>g<sub>x</sub>", ML.fmt(s, 3)],
          ["dF/dt = ∇f · γ′", ML.fmt(dF, 3)],
          ["verdict", par ? `<span class="ok">∇f ∥ ∇g, λ ≈ ${ML.fmt(lam)}: extremum of F</span>` : `<span class="no">not parallel</span>`],
        ], par ? "Here dF/dt = 0: the point is a constrained critical point, and ∇f = λ∇g." : "Not parallel, so ∇f has a component along the tangent and F still changes: moving along the curve makes f bigger or smaller.");
      };
      ML.drag(st, () => { const p = gam(S.t); return [{ x: p[0], y: p[1] }]; },
        (i, x, y) => { let t = Math.atan2(y, x); if (t < 0) t += TAU; S.t = t; tSl.set(Math.round(ML.deg(t)) % 360); }, { r: 26 });
      rebuild();
    },

    idea: String.raw`Both \(\nabla g\) and \(\nabla f\) are perpendicular to the tangent of the constraint curve at \(p\): \(\nabla g\) because the curve lies in a level set, \(\nabla f\) because \(f\) is stationary along the curve. In the plane, only one line is perpendicular to a nonzero tangent.`,
    steps: [
      { t: String.raw`Parametrize the constraint near \(p\).`, d: String.raw`Since \(\nabla g(p)\ne0\), the Implicit Function Theorem gives a \(C^1\) curve \(\gamma:(-\varepsilon,\varepsilon)\to\{g=c\}\) with \(\gamma(0)=p\) and \(\gamma'(0)\ne0\) (e.g. if \(g_y(p)\ne0\), take \(\gamma(t)=(a+t,h(a+t))\)).` },
      { t: String.raw`\(\nabla g\perp\gamma'\).`, d: String.raw`\(g(\gamma(t))=c\) for all \(t\). Differentiating with the chain rule: \(\nabla g(\gamma(t))\cdot\gamma'(t)=0\). At \(t=0\): \(\nabla g(p)\cdot\gamma'(0)=0\).` },
      { t: String.raw`\(f\) restricted to the curve has an extremum at \(t=0\).`, d: String.raw`\(\varphi(t)=f(\gamma(t))\) is differentiable (chain rule, \(C^1\)) and has a local extremum at \(t=0\) because \(p\) is a constrained extremum. By the one-variable Fermat theorem \(\varphi'(0)=0\).` },
      { t: String.raw`\(\nabla f\perp\gamma'\).`, d: String.raw`Chain rule again: \(0=\varphi'(0)=\nabla f(p)\cdot\gamma'(0)\).` },
      { t: String.raw`Conclude in \(\mathbb R^2\).`, d: String.raw`The vectors orthogonal to the nonzero vector \(\gamma'(0)\) form a <b>line</b>. Both \(\nabla f(p)\) and \(\nabla g(p)\ne0\) lie on it, so \(\nabla f(p)=\lambda\nabla g(p)\) for some \(\lambda\).` },
      { t: String.raw`General case in \(\mathbb R^n\) (one constraint).`, d: String.raw`Every curve in the level set has velocity in \(T=\nabla g(p)^\perp\), a space of dimension \(n-1\). The argument shows \(\nabla f(p)\perp T\), and \(T^\perp=\operatorname{span}\{\nabla g(p)\}\). With several constraints \(g_1,\dots,g_m\) with independent gradients: \(\nabla f\in\operatorname{span}\{\nabla g_i\}\).` },
    ],
    memorize: {
      formula: String.raw`\nabla f(p)=\lambda\nabla g(p),\qquad g(p)=c\quad(\nabla g(p)\ne0)`,
      bullets: [
        String.raw`Recipe: solve \(\nabla f=\lambda\nabla g\) and \(g=c\) together (\(n+1\) equations, \(n+1\) unknowns \(x_1..x_n,\lambda\)), then compare values of \(f\).`,
        String.raw`Geometric meaning: level curves of \(f\) are tangent to the constraint curve at the extremum.`,
        String.raw`\(\lambda\) is the rate of change of the optimal value with respect to \(c\) (shadow price).`,
        String.raw`Same as stationary points of the Lagrangian \(\mathcal L=f-\lambda(g-c)\).`,
      ],
      pitfalls: [
        String.raw`The hypothesis \(\nabla g(p)\ne0\) is essential: at a singular point of the constraint (cusp, \(g=x^2-y^3\) at the origin) the conclusion can fail.`,
        String.raw`The equations give <i>candidates</i> only: compare \(f\) at all of them (and use compactness) to decide which is max or min.`,
        String.raw`Don't forget the case \(\nabla f(p)=0\) (then \(\lambda=0\)) and, for non-compact constraints, that extrema may not exist.`,
      ],
    },
  });
})(window.ML);
