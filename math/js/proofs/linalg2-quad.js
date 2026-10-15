"use strict";
/* Linear Algebra 2 · Symmetric matrices & quadratic forms: Rayleigh extrema, positive definiteness. */
(function (ML) {
  const C = ML.C;

  /** eigen-data of the symmetric matrix [[a,b],[b,c]]: l1 ≥ l2, phi = angle of the eigenvector for l1 */
  function symEig(a, b, c) {
    const m = (a + c) / 2, r = Math.hypot((a - c) / 2, b);
    return { m, r, l1: m + r, l2: m - r, phi: r < 1e-9 ? 0 : 0.5 * Math.atan2(2 * b, a - c), scalar: r < 1e-9 };
  }
  const mix = (c0, c1, u) => `rgb(${c0.map((x, i) => Math.round(x + (c1[i] - x) * u)).join(",")})`;

  /* ------------------------------------------------------------------ */
  ML.register({
    id: "rayleigh-extrema",
    course: "linalg2",
    topic: "quad",
    title: "Extreme values of a quadratic form (Rayleigh)",
    blurb: "On the unit circle, xᵀAx ranges exactly between the smallest and largest eigenvalue.",
    statement: String.raw`Let \(A\) be a real symmetric matrix with eigenvalues \(\lambda_{\min}\le\dots\le\lambda_{\max}\). Then for all \(x\) with \(\|x\|=1\): \(\;\lambda_{\min}\le x^{T}Ax\le\lambda_{\max}\), and both bounds are attained, at the corresponding eigenvectors.`,
    shows: String.raw`The statement for a symmetric \(2\times2\) matrix: the unit circle coloured by \(Q(x)=x^TAx\), the two gold eigen-axes where the extremes sit, and below it the graph of \(Q\) against the angle of \(x\), always trapped between \(\lambda_{\min}\) and \(\lambda_{\max}\).`,
    vizIntro: String.raw`<b>Edit the symmetric matrix</b> \(A=\begin{pmatrix}a&b\\b&c\end{pmatrix}\) and <b>drag the point on the circle</b> (or use the angle slider). The circle is coloured by the value \(Q(x)=x^TAx\): <span style="color:#6c8cff">blue = small</span>, <span style="color:#ff9f5a">orange = large</span>. The extremes sit exactly on the gold eigen-axes.`,

    viz(box) {
      const st = ML.stage(box, { x: [-1.7, 1.7], y: [-1.7, 1.7] });
      const S = { a: 2, b: 1, c: -0.5, th: ML.rad(30), focus: -1 };
      const Q = (th) => S.a * Math.cos(th) ** 2 + 2 * S.b * Math.cos(th) * Math.sin(th) + S.c * Math.sin(th) ** 2;
      const redraw = () => st.redraw();
      ML.slider(st.panel, { label: "a", min: -3, max: 3, step: 0.05, value: S.a, onInput: (v) => { S.a = v; redraw(); } });
      ML.slider(st.panel, { label: "b", min: -3, max: 3, step: 0.05, value: S.b, onInput: (v) => { S.b = v; redraw(); } });
      ML.slider(st.panel, { label: "c", min: -3, max: 3, step: 0.05, value: S.c, onInput: (v) => { S.c = v; redraw(); } });
      const thS = ML.slider(st.panel, { label: "angle θ of x", min: 0, max: 360, step: 1, value: 30, fmt: (v) => v + "°", onInput: (v) => { S.th = ML.rad(v); redraw(); } });
      const graph = st.extra({ x: [0, 360], y: [-3, 3], equal: false, height: 150 });
      const out = ML.readout(st.panel);
      const V1 = (E) => [Math.cos(E.phi), Math.sin(E.phi)], V2 = (E) => [-Math.sin(E.phi), Math.cos(E.phi)];

      st.draw((v) => {
        const E = symEig(S.a, S.b, S.c), span = E.l1 - E.l2 || 1;
        v.grid(0.5); v.axes();
        const [e1, e2] = [V1(E), V2(E)];
        if (!E.scalar) {
          v.line(-e1[0] * 1.65, -e1[1] * 1.65, e1[0] * 1.65, e1[1] * 1.65, C.gold, 1.5, [8, 6]);
          v.line(-e2[0] * 1.65, -e2[1] * 1.65, e2[0] * 1.65, e2[1] * 1.65, C.gold, 1.5, [8, 6]);
        }
        // circle coloured by Q
        const N = 180;
        for (let i = 0; i < N; i++) {
          const t0 = 2 * Math.PI * i / N, t1 = 2 * Math.PI * (i + 1) / N, u = E.scalar ? 0.5 : (Q((t0 + t1) / 2) - E.l2) / span;
          v.line(Math.cos(t0), Math.sin(t0), Math.cos(t1), Math.sin(t1), mix([80, 120, 255], [255, 159, 90], ML.clamp(u, 0, 1)), 7);
        }
        if (!E.scalar) {
          v.text(`λ₁ = ${ML.fmt(E.l1)} (max)`, e1[0], e1[1], C.orange, 10, -10);
          v.text(`λ₂ = ${ML.fmt(E.l2)} (min)`, e2[0], e2[1], C.cyan, 10, -10);
          v.dot(e1[0], e1[1], C.gold, 5); v.dot(-e1[0], -e1[1], C.gold, 5); v.dot(e2[0], e2[1], C.gold, 5); v.dot(-e2[0], -e2[1], C.gold, 5);
        }
        // x and its coordinates c1, c2 in the eigenbasis
        const x = [Math.cos(S.th), Math.sin(S.th)], c1 = x[0] * e1[0] + x[1] * e1[1], c2 = x[0] * e2[0] + x[1] * e2[1];
        v.line(x[0], x[1], c1 * e1[0], c1 * e1[1], "rgba(255,255,255,.6)", 1.5, [4, 4]);
        v.line(x[0], x[1], c2 * e2[0], c2 * e2[1], "rgba(255,255,255,.6)", 1.5, [4, 4]);
        v.arrow(0, 0, x[0], x[1], C.white, 3);
        v.handle(x[0], x[1], C.white, "x");
        const f = S.focus, tx = (str, col) => v.text(str, 0, 1.5, col, 0, 0, "700 13px system-ui", "center");
        if (!E.scalar) {
          if (f === 0) { // step 1: orthonormal eigenbasis
            v.arrow(0, 0, e1[0], e1[1], C.gold, 5); v.arrow(0, 0, e2[0], e2[1], C.gold, 5);
            v.text("e₁", e1[0], e1[1], C.gold, 10, 14, "700 14px system-ui"); v.text("e₂", e2[0], e2[1], C.gold, 10, 14, "700 14px system-ui");
            const k = 0.28, m = [(e1[0] + e2[0]) * k, (e1[1] + e2[1]) * k];
            v.line(e1[0] * k, e1[1] * k, m[0], m[1], C.gold, 2.5); v.line(e2[0] * k, e2[1] * k, m[0], m[1], C.gold, 2.5);
            tx("e₁, e₂: perpendicular unit eigenvectors", C.gold);
          }
          if (f === 1) { // step 2: x = c₁e₁ + c₂e₂, c₁² + c₂² = 1
            v.arrow(0, 0, c1 * e1[0], c1 * e1[1], C.pink, 5); v.arrow(0, 0, c2 * e2[0], c2 * e2[1], C.green, 5);
            v.text("c₁e₁", c1 * e1[0], c1 * e1[1], C.pink, 8, 16, "700 12px system-ui"); v.text("c₂e₂", c2 * e2[0], c2 * e2[1], C.green, 8, 16, "700 12px system-ui");
            tx(`x = c₁e₁ + c₂e₂,   c₁² + c₂² = ${ML.fmt(c1 * c1 + c2 * c2)}`, C.white);
          }
          if (f === 2) tx(`Q = λ₁c₁² + λ₂c₂² = ${ML.fmt(E.l1)}·${ML.fmt(c1 * c1)} + ${ML.fmt(E.l2)}·${ML.fmt(c2 * c2)} = ${ML.fmt(E.l1 * c1 * c1 + E.l2 * c2 * c2)}`, C.white);
          if (f === 3) tx(`weights c₁² = ${ML.fmt(c1 * c1)}, c₂² = ${ML.fmt(c2 * c2)} add up to 1`, C.gold);
          if (f === 4 || f === 5) tx(f === 4 ? `x = e₁:  Q = λ_max = ${ML.fmt(E.l1)}` : `x = e₂:  Q = λ_min = ${ML.fmt(E.l2)}`, f === 4 ? C.orange : C.cyan);
        } else if (f >= 0) tx("A = λI: every unit vector is an eigenvector, Q is constant", C.gold);
      });

      graph.draw((g) => {
        const E = symEig(S.a, S.b, S.c), pad = 0.35 * Math.max(0.6, E.l1 - E.l2);
        g.o.y = [E.l2 - pad, E.l1 + pad]; g.begin();
        const y0 = g.o.y[0], y1 = g.o.y[1];
        [0, 90, 180, 270, 360].forEach((d) => g.line(d, y0, d, y1, C.grid, 1));
        g.line(0, 0, 360, 0, C.axis, 1.5);
        g.line(0, E.l1, 360, E.l1, C.orange, 1.5, [6, 5]); g.line(0, E.l2, 360, E.l2, C.cyan, 1.5, [6, 5]);
        if (S.focus === 3) { // step 4: Q is trapped in the band [λ_min, λ_max]
          const a = g.P(0, E.l1), b = g.P(360, E.l2);
          g.ctx.fillStyle = "rgba(255,204,77,.16)"; g.ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
          g.text("Q stays inside [λ_min, λ_max]", 180, (E.l1 + E.l2) / 2, C.gold, 0, 4, "700 11px system-ui", "center");
        }
        g.plot((d) => Q(ML.rad(d)), 0, 360, C.blue, 2.5, 240);
        if (!E.scalar) {
          const dm = ML.deg(E.phi);
          [dm, dm + 180].forEach((d) => g.dot(((d % 360) + 360) % 360, E.l1, C.orange, 5));
          [dm + 90, dm + 270].forEach((d) => g.dot(((d % 360) + 360) % 360, E.l2, C.cyan, 5));
        }
        const cur = ((ML.deg(S.th) % 360) + 360) % 360;
        g.dot(cur, Q(S.th), C.white, 6);
        g.text("Q(θ) = xᵀAx", 355, y1, C.text, 0, 14, "600 12px system-ui", "right");
        g.text("0°", 0, y0, C.dim, 3, -3, "11px system-ui"); g.text("360°", 360, y0, C.dim, -3, -3, "11px system-ui", "right");
      });

      st.after = () => {
        const E = symEig(S.a, S.b, S.c), x = [Math.cos(S.th), Math.sin(S.th)], q = Q(S.th);
        const e1 = V1(E), e2 = V2(E), c1 = x[0] * e1[0] + x[1] * e1[1], c2 = x[0] * e2[0] + x[1] * e2[1];
        const rec = E.l1 * c1 * c1 + E.l2 * c2 * c2;
        const inside = q >= E.l2 - 1e-9 && q <= E.l1 + 1e-9;
        out([
          ["Q(x) = xᵀAx", `<b>${ML.fmt(q)}</b>`],
          ["λ_min ≤ Q ≤ λ_max", `<span class="${inside ? "ok" : "no"}">${ML.fmt(E.l2)} ≤ ${ML.fmt(q)} ≤ ${ML.fmt(E.l1)}</span>`],
          ["c₁, c₂  (x in eigenbasis)", `${ML.fmt(c1)}, ${ML.fmt(c2)}   (c₁²+c₂² = ${ML.fmt(c1 * c1 + c2 * c2)})`],
          ["λ₁c₁² + λ₂c₂²", `${ML.fmt(rec)} <span class="ok">= Q ✓</span>`],
        ], E.scalar ? "A = λI: every unit vector is an eigenvector and Q is constant." : `Maximum at angle ${ML.fmt(((ML.deg(E.phi) % 180) + 180) % 180, 1)}° (and +180°); minimum 90° away.`);
      };

      ML.drag(st, () => [{ x: Math.cos(S.th), y: Math.sin(S.th) }], (i, x, y) => {
        S.th = Math.atan2(y, x); thS.set(Math.round(((ML.deg(S.th) % 360) + 360) % 360));
      }, { r: 26 });
      let savedTh = null;
      st.redraw();
      return {
        showStep(i) {
          const E = symEig(S.a, S.b, S.c);
          if (i === 4 || i === 5) { // move x onto an eigen-axis
            if (savedTh === null) savedTh = S.th;
            S.th = i === 4 ? E.phi : E.phi + Math.PI / 2;
            thS.set(Math.round(((ML.deg(S.th) % 360) + 360) % 360));
          } else if (savedTh !== null) { S.th = savedTh; thS.set(Math.round(((ML.deg(S.th) % 360) + 360) % 360)); savedTh = null; }
          S.focus = i; st.redraw();
        },
      };
    },

    idea: String.raw`In an orthonormal eigenbasis, \(x^TAx\) becomes the weighted average \(\sum\lambda_ic_i^2\) with weights \(c_i^2\) that add up to \(1\). An average lies between the smallest and largest value.`,
    steps: [
      { fig: String.raw`Step 1: the orthonormal eigenbasis. The two gold arrows \(e_1,e_2\) are perpendicular unit vectors along the dashed eigen-axes (right-angle mark at the origin).`, t: String.raw`Use the spectral theorem.`, d: String.raw`\(A\) real symmetric \(\Rightarrow\) there is an <b>orthonormal</b> basis \(v_1,\dots,v_n\) of eigenvectors, \(Av_i=\lambda_iv_i\). Order them \(\lambda_{\min}=\lambda_n\le\dots\le\lambda_1=\lambda_{\max}\).` },
      { fig: String.raw`Step 2: the unit vector \(x\) splits as \(x=c_1e_1+c_2e_2\) (pink and green arrows along the eigen-axes). Because \(e_1\perp e_2\), \(c_1^2+c_2^2=1\): drag \(x\) around the circle and the sum stays \(1\).`, t: String.raw`Expand \(x\) in this basis.`, d: String.raw`\(x=\sum c_iv_i\) with \(c_i=\langle x,v_i\rangle\). Orthonormality gives \(\|x\|^2=\sum c_i^2\), so \(\|x\|=1\iff\sum c_i^2=1\).` },
      { fig: String.raw`Step 3: in the eigenbasis the form is \(Q(x)=\lambda_1c_1^2+\lambda_2c_2^2\) with no cross terms. The text on the circle evaluates the right-hand side for the current \(x\); the readout shows it equals \(x^TAx\).`, t: String.raw`Compute the form.`, d: String.raw`\(x^TAx=\langle x,Ax\rangle=\big\langle\sum c_iv_i,\sum c_j\lambda_jv_j\big\rangle=\sum_{i,j}c_ic_j\lambda_j\langle v_i,v_j\rangle=\sum\lambda_ic_i^2\) (cross terms vanish because \(\langle v_i,v_j\rangle=\delta_{ij}\)).` },
      { fig: String.raw`Step 4: \(Q(x)\) is a weighted average of \(\lambda_1,\lambda_2\) with weights \(c_1^2,c_2^2\ge0\) summing to \(1\). In the graph the shaded band is \([\lambda_{\min},\lambda_{\max}]\): the white dot can never leave it.`, t: String.raw`Bound it.`, d: String.raw`Since \(c_i^2\ge0\): \(\lambda_{\min}=\lambda_{\min}\sum c_i^2\le\sum\lambda_ic_i^2\le\lambda_{\max}\sum c_i^2=\lambda_{\max}\).` },
      { fig: String.raw`Step 5: \(x\) has been moved to \(e_1\): all the weight sits on \(\lambda_1\), so \(Q=\lambda_{\max}\) and the white dot touches the top line of the graph.`, t: String.raw`The bounds are attained.`, d: String.raw`\(x=v_1\) has \(c=(1,0,\dots,0)\) and gives \(x^TAx=\lambda_{\max}\). \(x=v_n\) gives \(\lambda_{\min}\). \(\blacksquare\)` },
      { fig: String.raw`Step 6: \(x\) has been moved onto the other eigen-axis, \(e_2\): \(Q=\lambda_{\min}\). The extremes occur exactly on the gold eigen-axes, 90° apart, as in the graph.`, t: String.raw`Where the extreme occurs (optional).`, d: String.raw`Equality at the top needs \(c_i=0\) whenever \(\lambda_i<\lambda_{\max}\), i.e. \(x\) lies in the \(\lambda_{\max}\)-eigenspace. That is the gold-axis picture in the figure.` },
    ],
    memorize: {
      formula: String.raw`\lambda_{\min}=\min_{\|x\|=1}x^TAx,\qquad \lambda_{\max}=\max_{\|x\|=1}x^TAx,\qquad x^TAx=\sum\lambda_ic_i^2`,
      bullets: [
        String.raw`Equivalent form (Rayleigh quotient): \(\lambda_{\min}\le\dfrac{x^TAx}{x^Tx}\le\lambda_{\max}\) for every \(x\ne0\).`,
        String.raw`Mechanism: <b>weighted average</b> of eigenvalues with weights \(c_i^2\ge0\) summing to \(1\).`,
        String.raw`Link to Infi 2: this is a constrained extremum (Lagrange: \(Ax=\lambda x\)), and it explains the principal axes of the ellipse \(x^TAx=1\).`,
      ],
      pitfalls: [
        String.raw`Symmetry is essential: for non-symmetric \(A\), \(x^TAx\) only sees the symmetric part \(\frac12(A+A^T)\), and its extremes are not eigenvalues of \(A\).`,
        String.raw`You need an <i>orthonormal</i> eigenbasis (step 3 uses \(\langle v_i,v_j\rangle=\delta_{ij}\)); mere independence would leave cross terms.`,
        String.raw`The unit-sphere constraint matters: without \(\|x\|=1\) the form is unbounded (scale \(x\)).`,
      ],
    },
  });

  /* ------------------------------------------------------------------ */
  ML.register({
    id: "pos-def-2x2",
    course: "linalg2",
    topic: "quad",
    title: "Positive definiteness of a 2×2 matrix",
    blurb: "[[a,b],[b,c]] is positive definite ⇔ a > 0 and ac − b² > 0 ⇔ both eigenvalues > 0.",
    statement: String.raw`For a real symmetric \(A=\begin{pmatrix}a&b\\b&c\end{pmatrix}\), the form \(Q(x,y)=ax^2+2bxy+cy^2\) is positive definite (\(Q>0\) for all \((x,y)\ne0\)) if and only if \(a>0\) and \(\Delta:=ac-b^2>0\). Equivalently, both eigenvalues are positive.`,
    shows: String.raw`The statement as a 3D surface: \(z=Q(x,y)=ax^2+2bxy+cy^2\) over the \((x,y)\)-plane. Positive definite means a bowl above the plane \(z=0\); the gold and cyan curves are its cross-sections along the two principal axes (eigen-directions), and the readout checks both criteria \(a>0,\ \Delta>0\) and \(\lambda_1,\lambda_2>0\).`,
    vizIntro: String.raw`<b>Move a, b, c and drag the picture to rotate it.</b> The surface is \(z=Q(x,y)\): <span style="color:#ff9f5a">orange = above</span> the plane \(z=0\), <span style="color:#6c8cff">blue = below</span>. Positive definite is a bowl; try the presets for a dome, a saddle and a trough.`,

    viz(box) {
      const st = ML.stage(box, { x: [-2, 2], y: [-2, 2] });
      const sc = ML.scene3d(st, { R: 2, zR: 4, az: -0.75, el: 0.55, zoom: 0.8 });
      sc.rotatable();
      const S = { a: 2, b: 0.5, c: 1.5, focus: -1 };
      const sl = {};
      for (const k of ["a", "b", "c"]) sl[k] = ML.slider(st.panel, { label: k, min: -3, max: 3, step: 0.05, value: S[k], onInput: (v) => { S[k] = v; st.redraw(); } });
      const row = ML.h("div", { class: "btn-row" }); st.panel.append(row);
      const set = (a, b, c) => { S.a = a; S.b = b; S.c = c; sl.a.set(a); sl.b.set(b); sl.c.set(c); st.redraw(); };
      ML.button(row, "Positive def.", () => set(2, 0.5, 1.5));
      ML.button(row, "Negative def.", () => set(-2, 0.5, -1.5));
      ML.button(row, "Indefinite", () => set(1, 2, 1));
      ML.button(row, "Semidefinite", () => set(1, 1, 1));
      const out = ML.readout(st.panel);
      const Qf = (x, y) => S.a * x * x + 2 * S.b * x * y + S.c * y * y;
      const STOPS = [[50, 100, 235], [64, 66, 104], [255, 150, 60]];
      const classify = () => {
        const D = S.a * S.c - S.b * S.b, tr = S.a + S.c;
        if (D > 1e-9) return S.a > 0 ? { k: "pos", t: "positive definite", shape: "a bowl" } : { k: "neg", t: "negative definite", shape: "a dome" };
        if (D < -1e-9) return { k: "ind", t: "indefinite", shape: "a saddle" };
        if (Math.abs(tr) < 1e-9) return { k: "semi", t: "zero form", shape: "the flat plane" };
        return { k: "semi", t: tr > 0 ? "positive semidefinite (degenerate)" : "negative semidefinite (degenerate)", shape: "a trough with a flat valley" };
      };

      st.draw((v) => {
        sc.begin(v);
        let zmax = 1.5; // auto-scale the height so the whole surface always fits
        for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) zmax = Math.max(zmax, Math.abs(Qf(i / 2, j / 2)));
        sc.o.zR = zmax;
        const E = symEig(S.a, S.b, S.c), f = S.focus, cl = classify(), g = v.ctx;
        const tx = (str, col) => { g.fillStyle = col; g.font = "700 13px system-ui, sans-serif"; g.textAlign = "center"; g.fillText(str, v.w / 2, 22); g.textAlign = "left"; };
        sc.box(["x", "y", "z"]);
        const sq = [[-2, -2], [2, -2], [2, 2], [-2, 2]];  // reference plane z = 0
        sq.forEach((p, i) => sc.line3([p[0], p[1], 0], [sq[(i + 1) % 4][0], sq[(i + 1) % 4][1], 0], f === 0 ? C.white : "rgba(255,255,255,.35)", f === 0 ? 2.5 : 1.2, [5, 4]));
        sc.surface(Qf, { n: 30, zmin: -zmax, zmax: zmax, stops: STOPS });
        const sec = (d, col, w) => sc.curve3((t) => [t * d[0], t * d[1], Qf(t * d[0], t * d[1])], -2, 2, col, w, 80);
        const e1 = [Math.cos(E.phi), Math.sin(E.phi)], e2 = [-Math.sin(E.phi), Math.cos(E.phi)];
        const wl = Math.hypot(S.b, S.a), w = wl > 1e-9 ? [-S.b / wl, S.a / wl] : null;
        if (f === 1 || f === 3) { // cross-section along the x-axis: Q(1,0) = a
          sec([1, 0], C.green, 4); sc.line3([1, 0, 0], [1, 0, S.a], C.green, 1.5, [3, 3]); sc.dot3([1, 0, S.a], C.green, 6);
          sc.text3(`Q(1,0) = a = ${ML.fmt(S.a)}`, [1, 0, S.a], C.green, 10, -8);
        }
        if ((f === 2 || f === 3) && w) { // cross-section along (−b, a)
          sec(w, C.gold, 4); sc.arrow3([0, 0, 0], [w[0] * 1.7, w[1] * 1.7, 0], C.gold, 3); sc.text3("(−b, a)", [w[0] * 1.7, w[1] * 1.7, 0], C.gold, 8, 16);
          sc.text3("Q(−b,a) = aΔ", [w[0] * 1.5, w[1] * 1.5, Qf(w[0] * 1.5, w[1] * 1.5)], C.gold, 8, -8);
        }
        if (f === -1 || f === 5) { // principal axes
          sec(e1, C.gold, 4); sec(e2, C.cyan, 4);
          sc.text3(`λ₁ = ${ML.fmt(E.l1)}`, [e1[0] * 1.9, e1[1] * 1.9, Qf(e1[0] * 1.9, e1[1] * 1.9)], C.gold, 8, -8);
          sc.text3(`λ₂ = ${ML.fmt(E.l2)}`, [e2[0] * 1.9, e2[1] * 1.9, Qf(e2[0] * 1.9, e2[1] * 1.9)], C.cyan, 8, -8);
        }
        if (f === 4) { sc.dot3([0, 0, 0], C.white, 7); sc.text3("Q = 0 only here", [0, 0, 0], C.white, 10, 18); }
        if (f === -1) tx(`${cl.t}: the surface is ${cl.shape}`, C.text);
        if (f === 0) tx(cl.k === "pos" ? "positive definite: the whole surface is above z = 0 (dashed)" : `not positive definite: the surface is ${cl.shape}`, C.text);
        if (f === 1) tx("cross-section along the x-axis: z = a·x²", C.green);
        if (f === 2) tx("cross-section along (−b, a): the sign of aΔ decides", C.gold);
        if (f === 3) tx("aQ = (ax + by)² + Δy²: the two curves are where one square vanishes", C.text);
        if (f === 4) tx(cl.k === "pos" ? "a > 0, Δ > 0: every cross-section opens upward" : "criteria fail: some cross-section does not open upward", cl.k === "pos" ? C.green : C.red);
        if (f === 5) tx("principal axes: z = λ₁t² (gold) and z = λ₂t² (cyan)", C.text);
        sc.hint(v);
      });

      st.after = () => {
        const { a, b, c } = S, D = a * c - b * b, E = symEig(a, b, c), cl = classify();
        const cls = (good) => (good ? "ok" : "no");
        const rows = [
          ["Q(1,0) = a", `<span class="${cls(a > 1e-9)}">${ML.fmt(a)}</span> ${a > 1e-9 ? "> 0 ✓" : "not > 0"}`],
          ["Δ = ac − b²", `<span class="${cls(D > 1e-9)}">${ML.fmt(D)}</span> ${D > 1e-9 ? "> 0 ✓" : "not > 0"}`],
          ["Q(−b,a) = aΔ", ML.fmt(a * D)],
          ["λ₁, λ₂", `<span class="${cls(E.l2 > 1e-9)}">${ML.fmt(E.l1)}, ${ML.fmt(E.l2)}</span>`],
        ];
        if (Math.abs(a) > 1e-9) rows.push(["completing the square", `Q = ${ML.fmt(a)}·(x + ${ML.fmt(b / a)}·y)² + ${ML.fmt(D / a)}·y²`]);
        rows.push(["verdict", `<b class="${cl.k === "pos" ? "ok" : cl.k === "neg" || cl.k === "ind" ? "no" : "warn"}">${cl.t}</b>`]);
        out(rows, "Positive definite ⇔ <b>both</b> criteria hold: a > 0 and Δ > 0 (equivalently λ₂ > 0).");
      };
      st.redraw();
      return { showStep(i) { S.focus = i; st.redraw(); } };
    },

    idea: String.raw`Complete the square: \(a\,Q=(ax+by)^2+\Delta y^2\). Both squares are non-negative exactly when \(a>0,\Delta>0\); the two test vectors \((1,0)\) and \((-b,a)\) show the conditions are necessary.`,
    steps: [
      { fig: String.raw`Step 1: the surface \(z=Q(x,y)\). Positive definite means the whole surface lies above the dashed plane \(z=0\) and touches it only at the origin. Drag the picture to rotate it.`, t: String.raw`Definition and plan.`, d: String.raw`Positive definite means \(Q(x,y)>0\) for every \((x,y)\ne(0,0)\). We prove both directions of \(\;Q\succ0\iff a>0\text{ and }\Delta>0\).` },
      { fig: String.raw`Step 2: the cross-section along the \(x\)-axis (green curve) is the parabola \(z=a\,x^2\). The green dot at \(x=1\) has height \(Q(1,0)=a\), so \(a\) has to be positive.`, t: String.raw`Necessity of \(a>0\).`, d: String.raw`Test \((1,0)\ne0\): \(Q(1,0)=a\). It must be \(>0\).` },
      { fig: String.raw`Step 3: the cross-section along the direction \((-b,a)\) (gold curve) has height proportional to \(a\Delta\) there, so with \(a>0\) it only opens upward if \(\Delta>0\).`, t: String.raw`Necessity of \(\Delta>0\).`, d: String.raw`Test \((-b,a)\), nonzero because \(a\ne0\): \(Q(-b,a)=ab^2-2ab^2+ca^2=a(ac-b^2)=a\Delta\). It must be \(>0\), and since \(a>0\) we get \(\Delta>0\).` },
      { fig: String.raw`Step 4: completing the square writes \(aQ\) as two squares. The green curve (\(y=0\)) is the line where the second square vanishes, the gold curve (\(ax+by=0\)) where the first one vanishes. Both open upward when \(a>0\) and \(\Delta>0\).`, t: String.raw`Sufficiency: complete the square.`, d: String.raw`Let \(a>0,\ \Delta>0\). Then \(a\,Q=a^2x^2+2abxy+acy^2=(ax+by)^2+(ac-b^2)y^2=(ax+by)^2+\Delta y^2.\)` },
      { fig: String.raw`Step 5: with \(a>0\) and \(\Delta>0\) both squares are \(\ge0\) and vanish together only at the origin: the surface is a bowl above the plane \(z=0\) (white dot at the origin). Try the other presets to see it fail.`, t: String.raw`Conclude positivity.`, d: String.raw`So \(Q=\dfrac{(ax+by)^2+\Delta y^2}{a}\ge0\), with equality only if \(ax+by=0\) and \(y=0\), i.e. \(x=y=0\) (as \(a\ne0\)). Hence \(Q>0\) for \((x,y)\ne0\). \(\blacksquare\)` },
      { fig: String.raw`Step 6: the principal axes. The gold and cyan curves are the cross-sections along the two eigen-directions, \(z=\lambda_1t^2\) and \(z=\lambda_2t^2\). Both open upward exactly when both eigenvalues are positive.`, t: String.raw`Eigenvalue form.`, d: String.raw`\(\lambda_1+\lambda_2=a+c\) and \(\lambda_1\lambda_2=\Delta\). If \(a>0,\Delta>0\): \(ac>b^2\ge0\Rightarrow c>0\), so sum and product are positive, hence both eigenvalues are positive. Conversely, both \(\lambda_i>0\Rightarrow\Delta>0\), and \(a=Q(1,0)\ge\lambda_{\min}>0\) (Rayleigh).` },
    ],
    memorize: {
      formula: String.raw`Q\succ0\iff a>0,\ ac-b^2>0\iff\lambda_1,\lambda_2>0,\qquad aQ=(ax+by)^2+\Delta y^2`,
      bullets: [
        String.raw`Test vectors: \(Q(1,0)=a\), \(Q(-b,a)=a\Delta\). Completing the square gives the converse.`,
        String.raw`Negative definite \(\iff a<0,\Delta>0\). \(\Delta<0\Rightarrow\) indefinite (saddle). \(\Delta=0\Rightarrow\) degenerate (semidefinite).`,
        String.raw`This is Sylvester's criterion for \(n=2\): all leading principal minors positive. It is the engine of the Hessian test in Infi 2.`,
      ],
      pitfalls: [
        String.raw`\(\Delta>0\) alone is not enough: \(a<0\) gives <i>negative</i> definite. You must also check the sign of \(a\) (or the trace).`,
        String.raw`\(a>0\) and \(c>0\) is not enough either: \(a=c=1,\ b=2\) has \(\Delta=-3<0\), indefinite.`,
        String.raw`For <i>semi</i>definite you need all principal minors \(\ge0\) (including \(c\)), not just the leading ones: \(\operatorname{diag}(0,-1)\) has \(a=0,\Delta=0\) but is not PSD.`,
      ],
    },
  });
})(window.ML);
