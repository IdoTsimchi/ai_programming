"use strict";
/* Infi 2 · Multiple integrals: Fubini, polar coordinates, the Gaussian integral. */
(function (ML) {
  const C = ML.C, TAU = 2 * Math.PI;
  const STOPS = [[28, 40, 120], [40, 140, 170], [110, 200, 130], [250, 228, 110]];
  const colorAt = (t) => {                         // viridis-like ramp, t in [0,1]
    t = ML.clamp(t, 0, 1);
    const s = Math.min(STOPS.length - 1 - 1e-9, t * (STOPS.length - 1)), i = Math.floor(s), u = s - i;
    return "rgb(" + [0, 1, 2].map((k) => Math.round(STOPS[i][k] + (STOPS[i + 1][k] - STOPS[i][k]) * u)).join(",") + ")";
  };

  /* ================================================================== */
  /* 1 · Fubini / Cavalieri on a rectangle                               */
  /* ================================================================== */
  const FUB_FN = [
    { name: "1 + x·y / 2", f: (x, y) => 1 + x * y / 2 },
    { name: "2 + sin(2x)·cos(1.5y)", f: (x, y) => 2 + Math.sin(2 * x) * Math.cos(1.5 * y) },
    { name: "3·exp(−((x−1.5)² + (y−1)²))", f: (x, y) => 3 * Math.exp(-((x - 1.5) ** 2 + (y - 1) ** 2)) },
  ];
  const FA = 0, FB = 3, FC = 0, FD = 2;               // the rectangle [0,3] × [0,2]

  ML.register({
    id: "fubini-cavalieri",
    course: "infi2",
    topic: "integrals",
    title: "Fubini's theorem (iterated integrals)",
    blurb: "The double integral equals the iterated integral in either order: slice, integrate the slice, integrate the areas.",
    statement: String.raw`If \(f\) is continuous on the rectangle \(R=[a,b]\times[c,d]\), then \(\displaystyle\iint_R f\,dA=\int_c^d\!\Big(\int_a^b f(x,y)\,dx\Big)dy=\int_a^b\!\Big(\int_c^d f(x,y)\,dy\Big)dx.\)`,
    vizIntro: String.raw`The rectangle is cut into an \(n\)-by-\(n'\) grid, each box is colored by its height \(f\) and contributes \(f\,\Delta x\,\Delta y\) to the volume. <b>Pink bars on the right</b> are the row sums, <b>green bars below</b> the column sums. Adding the rows or adding the columns gives the same number, and that rearrangement is the heart of the proof. Move the slice \(y_0\): the cross-section area \(A(y_0)\) is a point on the graph whose area is the volume (Cavalieri).`,

    viz(box) {
      const st = ML.stage(box, { x: [-0.7, 4.7], y: [-1.6, 2.5], aspect: "54 / 41" });
      const S = { fi: 0, n: 6, y0: 0.9, A: [], I: 0, Amax: 1 };
      const f = () => FUB_FN[S.fi].f;
      const NY = 120;

      ML.select(st.panel, { label: "Function f on [0,3]×[0,2]", options: FUB_FN.map((q, i) => [i, q.name]), onChange: (v) => { S.fi = +v; prep(); st.redraw(); } });
      ML.slider(st.panel, { label: "Grid size n (boxes: 1.5n × n)", min: 2, max: 30, step: 1, value: S.n, fmt: (v) => v, onInput: (v) => { S.n = v; st.redraw(); } });
      ML.slider(st.panel, { label: "Slice position y₀", min: 0, max: 2, step: 0.01, value: S.y0, onInput: (v) => { S.y0 = v; st.redraw(); } });
      const gr = st.extra({ x: [FC, FD], y: [0, 1], height: 140 });
      const out = ML.readout(st.panel);

      function sliceArea(y) {                           // ∫_0^3 f(x,y) dx by midpoint rule
        let s = 0; const m = 300, dx = (FB - FA) / m;
        for (let i = 0; i < m; i++) s += f()(FA + (i + 0.5) * dx, y) * dx;
        return s;
      }
      function prep() {
        S.A = []; let tot = 0, mx = 0;
        for (let k = 0; k < NY; k++) { const a = sliceArea(FC + (k + 0.5) * (FD - FC) / NY); S.A.push(a); tot += a * (FD - FC) / NY; mx = Math.max(mx, a); }
        S.I = tot; S.Amax = mx; gr.view.o.y = [-mx * 0.08, mx * 1.2];
      }
      const grid = () => {
        const ny = S.n, nx = Math.round(1.5 * S.n), dx = (FB - FA) / nx, dy = (FD - FC) / ny, F = f();
        const val = []; let mn = Infinity, mxv = -Infinity;
        for (let j = 0; j < ny; j++) { val.push([]); for (let i = 0; i < nx; i++) { const z = F(FA + (i + 0.5) * dx, FC + (j + 0.5) * dy); val[j].push(z); mn = Math.min(mn, z); mxv = Math.max(mxv, z); } }
        const row = val.map((r) => r.reduce((a, b) => a + b, 0) * dx);
        const col = []; for (let i = 0; i < nx; i++) { let s = 0; for (let j = 0; j < ny; j++) s += val[j][i]; col.push(s * dy); }
        return { nx, ny, dx, dy, val, mn, mxv, row, col };
      };

      st.draw((v) => {
        const G = grid(), rmax = Math.max(...G.row), cmax = Math.max(...G.col);
        // boxes
        for (let j = 0; j < G.ny; j++) for (let i = 0; i < G.nx; i++) {
          const x0 = FA + i * G.dx, y0 = FC + j * G.dy;
          v.poly([[x0, y0], [x0 + G.dx, y0], [x0 + G.dx, y0 + G.dy], [x0, y0 + G.dy]], colorAt((G.val[j][i] - G.mn) / ((G.mxv - G.mn) || 1)), S.n <= 16 ? "rgba(0,0,0,.35)" : null, 1);
        }
        v.poly([[FA, FC], [FB, FC], [FB, FD], [FA, FD]], null, C.white, 2);
        // row sums (pink, right) and column sums (green, below)
        for (let j = 0; j < G.ny; j++) {
          const y = FC + j * G.dy, L = 1.35 * G.row[j] / rmax;
          v.poly([[FB + 0.08, y + G.dy * 0.12], [FB + 0.08 + L, y + G.dy * 0.12], [FB + 0.08 + L, y + G.dy * 0.88], [FB + 0.08, y + G.dy * 0.88]], "rgba(255,107,139,.85)");
        }
        for (let i = 0; i < G.nx; i++) {
          const x = FA + i * G.dx, L = 1.2 * G.col[i] / cmax;
          v.poly([[x + G.dx * 0.12, FC - 0.1], [x + G.dx * 0.88, FC - 0.1], [x + G.dx * 0.88, FC - 0.1 - L], [x + G.dx * 0.12, FC - 0.1 - L]], "rgba(79,209,165,.85)");
        }
        v.text("row sums Σᵢ f·Δx", FB + 0.1, FD + 0.25, C.pink, 0, 0, "600 12px system-ui");
        v.text("column sums Σⱼ f·Δy", FA, FC - 1.4, C.green, 0, 0, "600 12px system-ui");
        // slice
        v.line(FA - 0.1, S.y0, FB + 0.1, S.y0, C.white, 3);
        v.text("y = y₀", FA - 0.1, S.y0, C.white, -4, -6, "600 12px system-ui", "right");
      });

      gr.draw((g) => {
        const G = grid();
        g.axes(); g.grid(1, "#1d2342");
        // Riemann steps for the rows: height = row sum (≈ A(y_j)), width = Δy
        for (let j = 0; j < G.ny; j++) {
          const y = FC + j * G.dy;
          g.poly([[y, 0], [y + G.dy, 0], [y + G.dy, G.row[j]], [y, G.row[j]]], "rgba(255,107,139,.35)", "rgba(255,107,139,.7)", 1);
        }
        g.plot((y) => S.A[Math.min(NY - 1, Math.max(0, Math.floor((y - FC) / (FD - FC) * NY)))], FC, FD - 1e-6, C.white, 2.5, 240);
        const a0 = sliceArea(S.y0); g.dot(S.y0, a0, C.gold, 6);
        g.text("A(y) = ∫ f(x,y) dx", FD - 0.05, g.o.y[1], C.text, 0, 13, "600 11px system-ui", "right");
      });

      st.after = () => {
        const G = grid();
        const byRows = G.row.reduce((a, b) => a + b, 0) * G.dy, byCols = G.col.reduce((a, b) => a + b, 0) * G.dx;
        out([
          ["rows first: Σⱼ(Σᵢ f Δx) Δy", ML.fmt(byRows, 5)],
          ["columns first: Σᵢ(Σⱼ f Δy) Δx", ML.fmt(byCols, 5)],
          ["difference", `<span class="ok">${(byRows - byCols).toExponential(1)}</span> (floating-point noise only)`],
          ["exact iterated integral", ML.fmt(S.I, 5)],
          ["Riemann error", ML.fmt(Math.abs(byRows - S.I), 5) + "  → 0 as n grows"],
          ["slice area A(y₀)", ML.fmt(sliceArea(S.y0), 4)],
        ], "Finite sums can be regrouped freely. Fubini = pass to the limit on both groupings.");
      };
      prep(); st.redraw();
    },

    idea: String.raw`A Riemann sum is a finite double sum, and a finite double sum can be added row by row or column by column. Each row sum is itself a Riemann sum of the slice area \(A(y)\), so in the limit you get \(\int A(y)\,dy\).`,
    steps: [
      { t: String.raw`Preparation: continuity buys everything.`, d: String.raw`\(f\) is continuous on the compact \(R\), hence bounded and <b>uniformly continuous</b>, hence integrable. \(\iint_R f\) is the limit of Riemann sums as the mesh \(\to0\).` },
      { t: String.raw`The slice function.`, d: String.raw`For each \(y\), \(x\mapsto f(x,y)\) is continuous, so \(A(y)=\int_a^b f(x,y)\,dx\) exists. By uniform continuity, \(|y-y'|<\delta\Rightarrow|f(x,y)-f(x,y')|<\varepsilon\) for all \(x\), so \(|A(y)-A(y')|\le\varepsilon(b-a)\): \(A\) is continuous, hence \(\int_c^dA\) exists.` },
      { t: String.raw`Write a Riemann sum on a uniform grid (midpoints \(\xi_i,\eta_j\)).`, d: String.raw`\(S_n=\sum_{j}\sum_{i}f(\xi_i,\eta_j)\,\Delta x\,\Delta y\). It is a <b>finite</b> sum, so \(S_n=\sum_j\Big[\sum_i f(\xi_i,\eta_j)\Delta x\Big]\Delta y=\sum_i\Big[\sum_j f(\xi_i,\eta_j)\Delta y\Big]\Delta x.\)` },
      { t: String.raw`Each bracket approximates a slice area, uniformly.`, d: String.raw`Given \(\varepsilon\), uniform continuity gives \(\delta\) such that for mesh \(<\delta\): \(\Big|\sum_i f(\xi_i,\eta_j)\Delta x-A(\eta_j)\Big|\le\sum_i\int_{\text{cell}}|f(\xi_i,\eta_j)-f(x,\eta_j)|dx\le\varepsilon(b-a)\), for <i>every</i> \(j\).` },
      { t: String.raw`Sum the errors.`, d: String.raw`\(\Big|S_n-\sum_jA(\eta_j)\Delta y\Big|\le\varepsilon(b-a)\sum_j\Delta y=\varepsilon(b-a)(d-c)\).` },
      { t: String.raw`Pass to the limit.`, d: String.raw`\(S_n\to\iint_Rf\) and \(\sum_jA(\eta_j)\Delta y\to\int_c^dA(y)dy\) (\(A\) continuous). Hence \(\iint_Rf=\int_c^d\int_a^bf\,dx\,dy\). Swapping roles of \(x\) and \(y\) (the column grouping) gives the other order.` },
      { t: String.raw`Cavalieri's picture.`, d: String.raw`\(A(y)\) is the area of the cross-section at height \(y\). The volume under the graph is the integral of the cross-section areas.` },
    ],
    memorize: {
      formula: String.raw`\iint_R f\,dA=\int_c^d\Big(\int_a^b f\,dx\Big)dy=\int_a^b\Big(\int_c^d f\,dy\Big)dx`,
      bullets: [
        String.raw`Core of the proof: a finite double sum can be summed in either order. Then uniform continuity controls the limit.`,
        String.raw`Inner integral = cross-section area \(A(y)\); outer integral adds the slices (Cavalieri).`,
        String.raw`Tonelli: for \(f\ge0\) measurable the iterated integrals always equal the double integral (possibly \(+\infty\)). Fubini: needs \(\iint|f|<\infty\).`,
        String.raw`For non-rectangular regions: bounds of the inner integral may depend on the outer variable (type I/II regions).`,
      ],
      pitfalls: [
        String.raw`Without absolute integrability the orders can differ: \(f=\frac{x^2-y^2}{(x^2+y^2)^2}\) on \((0,1)^2\) gives \(+\frac\pi4\) in one order and \(-\frac\pi4\) in the other.`,
        String.raw`When switching order on a non-rectangular region, redraw the region and re-derive both limits. Do not just swap the symbols.`,
        String.raw`Don't claim "uniformly continuous" without naming the reason (continuous on a <i>compact</i> set).`,
      ],
    },
  });

  /* ================================================================== */
  /* 2 · Polar coordinates: dA = r dr dθ                                 */
  /* ================================================================== */
  ML.register({
    id: "polar-jacobian",
    course: "infi2",
    topic: "integrals",
    title: "Polar coordinates: why dA = r dr dθ",
    blurb: "A polar rectangle is not a rectangle: its area is r·Δr·Δθ (exactly at the mid-radius). That r is the Jacobian.",
    statement: String.raw`With \(\Phi(r,\theta)=(r\cos\theta,\,r\sin\theta)\) and a region \(D=\Phi(R)\) (\(R\) in the \((r,\theta)\)-plane, \(r\ge0\), \(\theta\) ranging over an interval of length \(\le2\pi\)): \(\displaystyle\iint_D f(x,y)\,dx\,dy=\iint_R f(r\cos\theta,\,r\sin\theta)\;r\,dr\,d\theta.\)`,
    vizIntro: String.raw`The <b>gold patch</b> is the image of the small rectangle \([r,r+\Delta r]\times[\theta,\theta+\Delta\theta]\) (shown in the little \((r,\theta)\)-plane). Its true area is \(\tfrac12[(r+\Delta r)^2-r^2]\Delta\theta=(r+\tfrac{\Delta r}2)\Delta r\,\Delta\theta\), <i>not</i> \(\Delta r\,\Delta\theta\). The dashed parallelogram is the linearization \(D\Phi\) applied to the rectangle: its area is exactly \(|\det D\Phi|\,\Delta r\Delta\theta=r\,\Delta r\Delta\theta\).`,

    viz(box) {
      const st = ML.stage(box, { x: [-4.4, 4.4], y: [-4.4, 4.4] });
      const S = { r: 2, dr: 0.8, dth: 30, th: 40 };
      const pr = st.extra({ x: [0, 4.6], y: [0, TAU], height: 130 });
      ML.slider(st.panel, { label: "radius r", min: 0.3, max: 3.5, step: 0.05, value: S.r, onInput: (v) => { S.r = v; st.redraw(); } });
      ML.slider(st.panel, { label: "Δr", min: 0.05, max: 1.5, step: 0.05, value: S.dr, onInput: (v) => { S.dr = v; st.redraw(); } });
      ML.slider(st.panel, { label: "angle θ", min: 0, max: 300, step: 1, value: S.th, fmt: (v) => v + "°", onInput: (v) => { S.th = v; st.redraw(); } });
      ML.slider(st.panel, { label: "Δθ", min: 3, max: 60, step: 1, value: S.dth, fmt: (v) => v + "°", onInput: (v) => { S.dth = v; st.redraw(); } });
      const out = ML.readout(st.panel);
      const P = (r, th) => [r * Math.cos(th), r * Math.sin(th)];

      st.draw((v) => {
        const th = ML.rad(S.th), dth = ML.rad(S.dth), { r, dr } = S;
        for (let k = 1; k <= 4; k++) v.circle(0, 0, k, "#26305f", null, 1);
        for (let a = 0; a < 360; a += 15) { const p = P(4.3, ML.rad(a)); v.line(0, 0, p[0], p[1], "#1d2342", 1); }
        v.axes();
        // exact image: an annular sector
        const pts = [];
        for (let k = 0; k <= 40; k++) pts.push(P(r + dr, th + dth * k / 40));
        for (let k = 40; k >= 0; k--) pts.push(P(r, th + dth * k / 40));
        v.poly(pts, "rgba(255,204,77,.55)", C.gold, 2.5);
        // linearization: parallelogram spanned by Δr·Φ_r and Δθ·Φ_θ at the corner (r,θ)
        const c = P(r, th), a = [dr * Math.cos(th), dr * Math.sin(th)], b = [-dth * r * Math.sin(th), dth * r * Math.cos(th)];
        v.poly([c, [c[0] + a[0], c[1] + a[1]], [c[0] + a[0] + b[0], c[1] + a[1] + b[1]], [c[0] + b[0], c[1] + b[1]]], null, C.white, 2);
        v.arrow(c[0], c[1], c[0] + a[0], c[1] + a[1], C.pink, 3);
        v.arrow(c[0], c[1], c[0] + b[0], c[1] + b[1], C.green, 3);
        v.text("Δr·Φ_r", c[0] + a[0], c[1] + a[1], C.pink, 6, 14);
        v.text("Δθ·Φ_θ", c[0] + b[0], c[1] + b[1], C.green, 6, -6);
        v.dot(c[0], c[1], C.white, 4);
      });
      pr.draw((g) => {
        const th = ML.rad(S.th), dth = ML.rad(S.dth);
        g.grid(1); g.axes();
        g.poly([[S.r, th], [S.r + S.dr, th], [S.r + S.dr, th + dth], [S.r, th + dth]], "rgba(255,204,77,.55)", C.gold, 2);
        g.text("(r, θ) plane: the rectangle", 4.5, TAU, C.text, 0, 13, "600 11px system-ui", "right");
      });
      st.after = () => {
        const th = ML.rad(S.th), dth = ML.rad(S.dth), { r, dr } = S;
        const exact = 0.5 * ((r + dr) ** 2 - r * r) * dth, jac = r * dr * dth, naive = dr * dth, rm = r + dr / 2;
        const J = [[Math.cos(th), -r * Math.sin(th)], [Math.sin(th), r * Math.cos(th)]];
        out([
          ["true area of the patch", ML.fmt(exact, 4)],
          ["= (r + Δr/2)·Δr·Δθ", ML.fmt(rm * dr * dth, 4)],
          ["Jacobian estimate r·Δr·Δθ", ML.fmt(jac, 4) + `  (error ${ML.fmt(100 * (jac - exact) / exact, 1)}%)`],
          ["naive Δr·Δθ (forgetting r)", `<span class="no">${ML.fmt(naive, 4)}</span>  (off by factor ${ML.fmt(exact / naive, 2)})`],
          ["det DΦ = r cos²θ + r sin²θ", `<span class="ok">${ML.fmt(ML.la.det(J), 3)} = r</span>`],
        ], "As Δr → 0 the dashed parallelogram and the gold patch agree to first order: area ≈ r·Δr·Δθ.");
      };
      st.redraw();
    },

    idea: String.raw`Chop the \((r,\theta)\) rectangle into small rectangles. Each one maps to an annular sector of area \((r^*)\,\Delta r\,\Delta\theta\), where \(r^*\) is the midpoint radius, so the Riemann sums of \(f\circ\Phi\cdot r\) are exactly Riemann sums for \(\iint_D f\).`,
    steps: [
      { t: String.raw`Cut the parameter region.`, d: String.raw`Partition \(R\) into rectangles \(R_{ij}=[r_i,r_i+\Delta r]\times[\theta_j,\theta_j+\Delta\theta]\). Their images \(S_{ij}=\Phi(R_{ij})\) are annular sectors that tile \(D\) (overlapping only along curves, which have zero area).` },
      { t: String.raw`Area of an annular sector.`, d: String.raw`A sector of radius \(\rho\) and angle \(\Delta\theta\) has area \(\tfrac12\rho^2\Delta\theta\). Therefore \(\operatorname{area}(S_{ij})=\tfrac12[(r_i+\Delta r)^2-r_i^2]\Delta\theta=\big(r_i+\tfrac{\Delta r}{2}\big)\Delta r\,\Delta\theta=r_i^*\,\Delta r\,\Delta\theta\), with \(r_i^*\) the midpoint radius.` },
      { t: String.raw`Riemann sum for \(\iint_D f\).`, d: String.raw`Choose the sample point \(\Phi(r_i^*,\theta_j)\in S_{ij}\). Then \(\sum_{ij}f(\Phi(r_i^*,\theta_j))\operatorname{area}(S_{ij})=\sum_{ij}f(\Phi(r_i^*,\theta_j))\,r_i^*\,\Delta r\,\Delta\theta.\)` },
      { t: String.raw`Recognize the second sum.`, d: String.raw`It is a Riemann sum of the continuous function \((r,\theta)\mapsto f(\Phi(r,\theta))\,r\) over \(R\).` },
      { t: String.raw`Let the mesh go to \(0\).`, d: String.raw`The left side tends to \(\iint_Df\,dA\) (a Riemann sum of \(f\) over a partition of \(D\) into small pieces), the right side to \(\iint_R f(\Phi)\,r\,dr\,d\theta\). The two limits coincide.` },
      { t: String.raw`The same fact via the Jacobian.`, d: String.raw`\(D\Phi=\begin{pmatrix}\cos\theta&-r\sin\theta\\ \sin\theta&r\cos\theta\end{pmatrix}\), \(\det D\Phi=r\cos^2\theta+r\sin^2\theta=r\). A differentiable map scales small areas by \(|\det D\Phi|\): this is the general change-of-variables theorem.` },
    ],
    memorize: {
      formula: String.raw`dA=r\,dr\,d\theta,\qquad \det\frac{\partial(x,y)}{\partial(r,\theta)}=r`,
      bullets: [
        String.raw`Disc of radius \(a\): \(0\le r\le a,\ 0\le\theta\le2\pi\). Example: \(\iint_{D}(x^2+y^2)\,dA=\int_0^{2\pi}\!\!\int_0^a r^2\cdot r\,dr\,d\theta=\tfrac{\pi a^4}{2}\).`,
        String.raw`Area of an annular sector: \(\tfrac12(R^2-\rho^2)\Delta\theta\). That is where the \(r\) comes from.`,
        String.raw`Use polar coordinates when the region or the integrand involves \(x^2+y^2\).`,
        String.raw`General rule: multiply by \(|\det J|\), never by \(\det J\) without absolute value.`,
      ],
      pitfalls: [
        String.raw`Forgetting the factor \(r\) (the single most common mistake): \(dx\,dy\ne dr\,d\theta\).`,
        String.raw`Wrong limits for \(\theta\) when the region is not a full disc (e.g. a half-disc is \(0\le\theta\le\pi\)); sketch it first.`,
        String.raw`\(\Phi\) is not injective at \(r=0\) and at \(\theta=0,2\pi\): harmless (measure zero) but mention it in a rigorous proof.`,
      ],
    },
  });

  /* ================================================================== */
  /* 3 · The Gaussian integral                                           */
  /* ================================================================== */
  // G(R) = ∫_0^R e^{-x²} dx tabulated by the trapezoid rule on step 0.001 (R up to 3.2)
  const GN = 3200, GH = 0.001, GT = new Float64Array(GN + 1);
  for (let i = 1; i <= GN; i++) GT[i] = GT[i - 1] + 0.5 * GH * (Math.exp(-(((i - 1) * GH) ** 2)) + Math.exp(-((i * GH) ** 2)));
  const Gauss = (R) => { const x = ML.clamp(R, 0, GN * GH) / GH, i = Math.min(GN - 1, Math.floor(x)); return GT[i] + (GT[i + 1] - GT[i]) * (x - i); };
  const sqArea = (R) => (2 * Gauss(R)) ** 2;                         // (∫_{-R}^{R} e^{-x²}dx)²
  const discArea = (R) => Math.PI * (1 - Math.exp(-R * R));           // ∬ over the disc of radius R

  ML.register({
    id: "gaussian-integral",
    course: "infi2",
    topic: "integrals",
    title: "The Gaussian integral ∫e^(−x²)dx = √π",
    blurb: "Square the integral, switch to polar coordinates, and squeeze between discs and squares.",
    statement: String.raw`\(\displaystyle\int_{-\infty}^{\infty}e^{-x^2}\,dx=\sqrt{\pi}.\)`,
    vizIntro: String.raw`Slide \(R\). The <b style="color:#6c8cff">blue disc</b> and the <b style="color:#4fd1a5">green square</b> are the integration regions for \(e^{-(x^2+y^2)}\). The disc integral has the closed form \(\pi(1-e^{-R^2})\) (we also compute it numerically in polar coordinates). The square integral is \(\big(\int_{-R}^{R}e^{-x^2}dx\big)^2\). The square is squeezed between the discs of radius \(R\) and \(\sqrt2R\), and both tend to \(\pi\).`,

    viz(box) {
      const st = ML.stage(box, { x: [-3.2, 3.2], y: [-3.2, 3.2] });
      const S = { R: 1.2 };
      const hm = ML.heatmap((x, y) => Math.exp(-(x * x + y * y)), [-3.2, 3.2], [-3.2, 3.2], { n: 200, min: 0, max: 1 });
      ML.slider(st.panel, { label: "R", min: 0.1, max: 3, step: 0.05, value: S.R, onInput: (v) => { S.R = v; st.redraw(); } });
      const gr = st.extra({ x: [0, 3], y: [0, 3.6], height: 150 });
      const out = ML.readout(st.panel);

      const polarSum = (R) => {                         // numeric ∬_disc e^{-r²} r dr dθ on a polar grid
        const nr = 120, nt = 48, dr = R / nr, dt = TAU / nt; let s = 0;
        for (let i = 0; i < nr; i++) { const r = (i + 0.5) * dr; for (let j = 0; j < nt; j++) { const t = (j + 0.5) * dt; s += Math.exp(-((r * Math.cos(t)) ** 2 + (r * Math.sin(t)) ** 2)) * r * dr * dt; } }
        return s;
      };

      st.draw((v) => {
        const R = S.R;
        v.image(hm.canvas, -3.2, 3.2, -3.2, 3.2);
        v.axes("rgba(255,255,255,.2)");
        v.poly([[-R, -R], [R, -R], [R, R], [-R, R]], "rgba(79,209,165,.18)", C.green, 3);
        v.circle(0, 0, R, C.blue, "rgba(108,140,255,.22)", 3);
        v.circle(0, 0, R * Math.SQRT2, C.orange, null, 2, [6, 5]);
        v.text("disc radius R", 0, R, C.blue, 6, -6);
        v.text("disc radius √2·R", R * 0.7, R * 0.7 * Math.SQRT2 + 0.15, C.orange, 10, -4);
      });
      gr.draw((g) => {
        g.axes(); g.grid(1);
        g.line(0, Math.PI, 3, Math.PI, "rgba(255,255,255,.6)", 1.5, [6, 5]);
        g.plot(discArea, 0, 3, C.blue, 2.2);
        g.plot((R) => discArea(R * Math.SQRT2), 0, 3, C.orange, 2.2);
        g.plot(sqArea, 0, 3, C.green, 3);
        g.dot(S.R, sqArea(S.R), C.white, 5);
        g.text("π", 0.04, Math.PI, C.text, 0, -4, "700 12px system-ui");
        g.text("disc(R) ≤ square(R) ≤ disc(√2R) → π", 2.95, 3.6, C.text, 0, 13, "600 11px system-ui", "right");
      });
      st.after = () => {
        const R = S.R, disc = discArea(R), sq = sqArea(R), big = discArea(R * Math.SQRT2), num = polarSum(R);
        const ok = disc <= sq + 1e-12 && sq <= big + 1e-12;
        out([
          ["disc, closed form π(1−e<sup>−R²</sup>)", ML.fmt(disc, 5)],
          ["disc, numeric polar sum", ML.fmt(num, 5) + `  <span class="ok">(matches)</span>`],
          ["square (∫₋ᴿᴿ e<sup>−x²</sup>dx)²", ML.fmt(sq, 5)],
          ["disc(√2·R)", ML.fmt(big, 5)],
          ["squeeze holds?", `<span class="${ok ? "ok" : "no"}">${ML.fmt(disc, 3)} ≤ ${ML.fmt(sq, 3)} ≤ ${ML.fmt(big, 3)}</span>`],
          ["√(square) → √π ≈ 1.77245", ML.fmt(Math.sqrt(sq), 5)],
        ], "Let R → ∞: both bounds tend to π, so (∫e<sup>−x²</sup>dx)² = π.");
      };
      st.redraw();
    },

    idea: String.raw`Nobody can integrate \(e^{-x^2}\) in closed form, but its <i>square</i> is a double integral of \(e^{-(x^2+y^2)}\), which is perfect for polar coordinates, where the extra factor \(r\) makes \(re^{-r^2}\) integrable.`,
    steps: [
      { t: String.raw`The integral converges.`, d: String.raw`For \(|x|\ge1\), \(x^2\ge|x|\), so \(e^{-x^2}\le e^{-|x|}\), which is integrable. Hence \(I=\int_{-\infty}^\infty e^{-x^2}dx\) is finite and \(I>0\).` },
      { t: String.raw`Square it as a double integral.`, d: String.raw`\(I^2=\Big(\int e^{-x^2}dx\Big)\Big(\int e^{-y^2}dy\Big)=\iint_{\mathbb R^2}e^{-(x^2+y^2)}dx\,dy\) (Tonelli/Fubini; the integrand is positive). Equivalently \(I^2=\lim_{R\to\infty}\Big(\int_{-R}^{R}e^{-x^2}dx\Big)^2\).` },
      { t: String.raw`Squeeze the square between discs.`, d: String.raw`With \(D_\rho\) the disc of radius \(\rho\) and \(Q_R=[-R,R]^2\): \(D_R\subset Q_R\subset D_{\sqrt2R}\). The integrand is positive, so \(\iint_{D_R}\le\iint_{Q_R}\le\iint_{D_{\sqrt2R}}\), where \(\iint_{Q_R}=\big(\int_{-R}^Re^{-x^2}dx\big)^2\).` },
      { t: String.raw`Integrate over a disc in polar coordinates.`, d: String.raw`\(\iint_{D_\rho}e^{-(x^2+y^2)}dA=\int_0^{2\pi}\!\!\int_0^\rho e^{-r^2}\,r\,dr\,d\theta\) (that factor \(r\) is the Jacobian).` },
      { t: String.raw`Compute the radial integral.`, d: String.raw`\(\int_0^\rho re^{-r^2}dr=\big[-\tfrac12e^{-r^2}\big]_0^\rho=\tfrac12(1-e^{-\rho^2})\). So \(\iint_{D_\rho}=2\pi\cdot\tfrac12(1-e^{-\rho^2})=\pi(1-e^{-\rho^2})\).` },
      { t: String.raw`Take the limit.`, d: String.raw`\(\pi(1-e^{-R^2})\le\Big(\int_{-R}^Re^{-x^2}dx\Big)^2\le\pi(1-e^{-2R^2})\). Let \(R\to\infty\): both sides \(\to\pi\), so \(I^2=\pi\) by the squeeze theorem.` },
      { t: String.raw`Finish.`, d: String.raw`\(I>0\) and \(I^2=\pi\) give \(I=\sqrt\pi\). Consequences: \(\int_0^\infty e^{-x^2}dx=\tfrac{\sqrt\pi}2\), \(\Gamma(\tfrac12)=\sqrt\pi\), and the normal density \(\frac1{\sqrt{2\pi}}e^{-x^2/2}\) has total mass \(1\).` },
    ],
    memorize: {
      formula: String.raw`I^2=\iint_{\mathbb R^2}e^{-(x^2+y^2)}dA=\int_0^{2\pi}\!\!\int_0^\infty e^{-r^2}r\,dr\,d\theta=\pi\ \Rightarrow\ I=\sqrt\pi`,
      bullets: [
        String.raw`Three moves: <b>square it</b>, <b>polar coordinates</b>, <b>\(\int_0^\infty re^{-r^2}dr=\tfrac12\)</b>.`,
        String.raw`Rigorous version = squeeze: \(D_R\subset Q_R\subset D_{\sqrt2R}\).`,
        String.raw`Scaling: \(\int e^{-ax^2}dx=\sqrt{\pi/a}\).`,
        String.raw`Equivalent: \(\Gamma(1/2)=\sqrt\pi\); normal distribution is normalized by \(\sqrt{2\pi}\sigma\).`,
      ],
      pitfalls: [
        String.raw`Forgetting the Jacobian \(r\): without it \(\int_0^\infty e^{-r^2}dr\) is the thing you were trying to compute.`,
        String.raw`Writing \(\iint_{\mathbb R^2}\) as a limit needs justification: use the exhaustion by discs/squares (positive integrand), not a hand-wave.`,
        String.raw`Concluding \(I=\pm\sqrt\pi\): you must say \(I>0\) because the integrand is positive.`,
      ],
    },
  });
})(window.ML);
