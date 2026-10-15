"use strict";
/* Linear Algebra 2 · Linear maps: rank–nullity, similar matrices. */
(function (ML) {
  const C = ML.C;

  /* ---------- helpers (local) ---------- */
  /** nice fraction string for small rational numbers */
  function frac(x) {
    if (Math.abs(x) < 1e-9) return "0";
    for (let d = 1; d <= 12; d++) {
      const n = x * d;
      if (Math.abs(n - Math.round(n)) < 1e-7) return d === 1 ? String(Math.round(n)) : `${Math.round(n)}/${d}`;
    }
    return ML.fmt(x);
  }
  const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
  const sup = (n) => String(n).split("").map((d) => SUP[+d]).join("");
  const vecStr = (v) => "(" + v.map(frac).join(", ") + ")ᵀ";

  /** Gauss–Jordan elimination with partial pivoting. Returns {R, piv} (piv = pivot column indices). */
  function rref(M) {
    const A = M.map((r) => r.slice()), m = A.length, n = A[0].length, piv = [];
    let r = 0;
    for (let c = 0; c < n && r < m; c++) {
      let best = r;
      for (let i = r + 1; i < m; i++) if (Math.abs(A[i][c]) > Math.abs(A[best][c])) best = i;
      if (Math.abs(A[best][c]) < 1e-9) continue;
      [A[r], A[best]] = [A[best], A[r]];
      const pv = A[r][c];
      A[r] = A[r].map((x) => x / pv);
      for (let i = 0; i < m; i++) {
        if (i === r) continue;
        const f = A[i][c];
        if (Math.abs(f) > 0) A[i] = A[i].map((x, j) => x - f * A[r][j]);
      }
      piv.push(c); r++;
    }
    return { R: A, piv };
  }

  /* ------------------------------------------------------------------ */
  ML.register({
    id: "rank-nullity",
    course: "linalg2",
    topic: "maps",
    title: "Rank–nullity theorem",
    blurb: "dim V = dim ker T + dim im T: extend a basis of the kernel, and what is left maps onto the image.",
    statement: String.raw`Let \(T:V\to W\) be a linear map with \(V\) finite-dimensional. Then \(\;\dim V=\dim\ker T+\dim\operatorname{im}T.\)`,
    shows: String.raw`The statement for \(T(x)=Mx\) on \(\mathbb R^4\): the four columns of \(M\) are split by row reduction into pivot columns (green, they give the image) and free columns (pink, they give the kernel). The bottom line checks \(n=\text{rank}+\text{nullity}\).`,
    vizIntro: String.raw`<b>Edit the 3×4 matrix</b> (or press a preset). It defines \(T:\mathbb R^4\to\mathbb R^3\), \(x\mapsto Mx\). Row reduction splits the 4 columns into <span style="color:#4fd1a5">pivot columns</span> (they give a basis of the image) and <span style="color:#ff6b8b">free columns</span> (each one produces a kernel vector). Watch \(n = \text{rank}+\text{nullity}\) hold every time.`,

    viz(box) {
      const m = 3, n = 4;
      const st = ML.stage(box, { x: [0, 100], y: [0, 100], equal: false, aspect: "1 / 1" });
      const inputs = [];
      const grid = ML.h("div", { style: "display:grid;grid-template-columns:repeat(4,1fr);gap:5px" });
      const init = [[1, 2, 0, 1], [2, 4, 1, 0], [3, 6, 1, 1]];
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        const inp = ML.h("input", { type: "number", step: "1", value: String(init[i][j]), "aria-label": `M ${i + 1},${j + 1}`, style: "text-align:center;padding:6px 4px" });
        inp.addEventListener("input", () => st.redraw());
        inputs.push(inp); grid.append(inp);
      }
      st.panel.append(ML.h("div", { class: "caption" }, "Matrix M (3 rows × 4 columns)"), grid);
      const setM = (A) => { A.flat().forEach((v, k) => { inputs[k].value = String(v); }); st.redraw(); };
      const row = ML.h("div", { class: "btn-row" }); st.panel.append(row);
      ML.button(row, "Rank 3", () => setM([[1, 0, 2, 1], [0, 1, 1, 1], [0, 0, 1, 2]]));
      ML.button(row, "Rank 2", () => setM(init));
      ML.button(row, "Rank 1", () => setM([[1, 2, 3, 4], [2, 4, 6, 8], [-1, -2, -3, -4]]));
      ML.button(row, "Zero map", () => setM([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]));
      ML.button(row, "Random", () => setM(Array.from({ length: m }, () => Array.from({ length: n }, () => Math.floor(Math.random() * 5) - 2))));
      const out = ML.readout(st.panel);

      const S = { focus: -1 };
      let cur = null;
      const analyse = () => {
        const M = []; for (let i = 0; i < m; i++) { M.push([]); for (let j = 0; j < n; j++) { const x = parseFloat(inputs[i * n + j].value); M[i].push(Number.isFinite(x) ? x : 0); } }
        const { R, piv } = rref(M);
        const free = [...Array(n).keys()].filter((j) => !piv.includes(j));
        const ker = free.map((f) => { const v = Array(n).fill(0); v[f] = 1; piv.forEach((pc, k) => { v[pc] = -R[k][f]; }); return v; });
        const img = piv.map((pc) => M.map((row2) => row2[pc]));
        cur = { M, R, piv, free, ker, img, r: piv.length, k: free.length };
      };

      st.draw((v) => {
        analyse();
        const { piv, r, k } = cur, G = "rgba(79,209,165,", P = "rgba(255,107,139,", f = S.focus, g = v.ctx;
        // which group is in the spotlight for each proof step (K = kernel side, R = image side)
        const W = { 0: "K", 1: "both", 2: "R", 3: "R", 4: "R", 5: "both", 6: "cols" }[f] || "both";
        const al = (grp, isCol) => (f < 0 || W === "both" ? 1 : W === "cols" ? (isCol ? 1 : 0.18) : W === grp ? 1 : 0.18);
        const box2 = (x0, y0, x1, y1, col, label) => {
          v.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], col + ".28)", col + "1)", 2);
          if (label) v.text(label, (x0 + x1) / 2, (y0 + y1) / 2, C.text, 0, 4, "600 12px system-ui", "center");
        };
        const head = [
          `V = ℝ${sup(n)}  (one box per column)`,
          `Step 1: a basis u₁…u_k of ker T (pink): one vector per free column`,
          `Step 2: extend by w₁…w_r (green) to a basis of V:  n = k + r`,
          `Step 3: T w₁…T w_r span im T (green, bottom)`,
          `Steps 4–5: T w₁…T w_r are independent: T is 1–1 on the green part`,
          `Steps 4–5: T w₁…T w_r are independent: T is 1–1 on the green part`,
          `Step 6: dim im T = r, so n = k + r`,
          `Step 7: columns of M: pivot (green) + free (pink) = n`,
        ][f + 1] || "";
        v.text(head, 50, 96, f < 0 ? C.dim : C.text, 0, 0, "700 12px system-ui", "center");
        const bw = (90 - (n - 1) * 3) / n;
        for (let j = 0; j < n; j++) {
          const x0 = 5 + j * (bw + 3), isP = piv.includes(j);
          g.globalAlpha = al(isP ? "R" : "K", true);
          box2(x0, 76, x0 + bw, 89, isP ? G : P, `c${j + 1}`);
          v.text(isP ? "pivot" : "free", x0 + bw / 2, 76, isP ? C.green : C.pink, 0, 16, "600 11px system-ui", "center");
        }
        g.globalAlpha = 1;
        // regrouped bar: kernel | complement
        const Wd = 90, kw = Wd * k / n, rw = Wd * r / n;
        v.text("regroup:  V = ker T ⊕ complement", 50, 63, C.dim, 0, 0, "600 12px system-ui", "center");
        g.globalAlpha = al("K"); if (k) box2(5, 48, 5 + kw, 59, P, kw > 20 ? `ker T · ${k}` : `${k}`);
        g.globalAlpha = al("R"); if (r) box2(5 + kw, 48, 5 + kw + rw, 59, G, rw > 20 ? `compl. · ${r}` : `${r}`);
        // arrows to codomain
        g.globalAlpha = al("R"); if (r) { const cx = 5 + kw + rw / 2; v.arrow(cx, 47, cx, 33, C.green, 3); v.text("T is 1–1 here", cx, 40, C.green, 8, 4, "600 11px system-ui"); }
        g.globalAlpha = al("K"); if (k) { const cx = 5 + kw / 2; v.arrow(cx, 47, cx, 33, C.pink, 3); v.text("↦ 0", cx, 40, C.pink, 8, 4, "600 11px system-ui"); }
        if (k) box2(5 + kw / 2 - 5, 19, 5 + kw / 2 + 5, 31, P, "0");
        g.globalAlpha = al("R"); if (r) box2(5 + kw, 19, 5 + kw + rw, 31, G, rw > 24 ? `im T · ${r}` : `${r}`);
        g.globalAlpha = 1;
        v.text(`im T ⊂ ℝ${sup(m)}`, 50, 12, C.dim, 0, 0, "600 12px system-ui", "center");
        v.text(`n = rank + nullity :  ${n} = ${r} + ${k}`, 50, 3, C.gold, 0, 0, "700 14px system-ui", "center");
      });

      st.after = () => {
        if (!cur) return;
        const { R, ker, img, r, k } = cur;
        const mono = (s) => `<span style="font-family:ui-monospace,monospace;white-space:pre">${s}</span>`;
        out([
          ["rank (pivots)", `<b class="ok">${r}</b>`],
          ["nullity (free)", `<b style="color:#ff6b8b">${k}</b>`],
          ["n = r + k", `${n} = ${r} + ${k} <span class="ok">✓</span>`],
          ["RREF", mono(R.map((rw) => rw.map((x) => frac(x).padStart(4)).join(" ")).join("\n"))],
          ["ker T basis", k ? ker.map((x) => mono(vecStr(x))).join("<br>") : "{0}  (only the zero vector)"],
          ["im T basis", r ? img.map((x) => mono(vecStr(x))).join("<br>") : "{0}"],
        ], "Image basis = the <i>original</i> columns at pivot positions (not the columns of the RREF).");
      };
      st.redraw();
      return { showStep(i) { S.focus = i; st.redraw(); } };
    },

    idea: String.raw`Start with a basis of the kernel, extend it to a basis of \(V\). The kernel part is sent to \(0\); the added vectors are sent to a basis of the image, so they count \(\dim\operatorname{im}T\).`,
    steps: [
      { fig: String.raw`Step 1: the kernel. Each free column (pink) yields one basis vector of \(\ker T\), so the pink part has \(k=\text{nullity}\) boxes. All of these vectors are sent to \(0\) (pink arrow). The green side is dimmed.`, t: String.raw`Choose a basis of the kernel.`, d: String.raw`\(\ker T\) is a subspace of \(V\), hence finite-dimensional. Let \(u_1,\dots,u_k\) be a basis (\(k=\dim\ker T\); if \(\ker T=\{0\}\) the list is empty and \(k=0\)).` },
      { fig: String.raw`Step 2: the regrouped bar shows \(V\) as the kernel basis (pink, \(k\) boxes) plus the added vectors \(w_1,\dots,w_r\) (green, \(r\) boxes): \(k+r=n\) vectors in total.`, t: String.raw`Extend it to a basis of the whole space.`, d: String.raw`By the basis extension theorem there are \(w_1,\dots,w_r\) such that \(u_1,\dots,u_k,w_1,\dots,w_r\) is a basis of \(V\). So \(\dim V=k+r\), and the goal becomes \(r=\dim\operatorname{im}T\).` },
      { fig: String.raw`Step 3: the green boxes are sent by \(T\) onto the image: every vector of \(\operatorname{im}T\) is a combination of \(Tw_1,\dots,Tw_r\) (green box \(\operatorname{im}T\) at the bottom). The kernel part contributes nothing.`, t: String.raw`Claim 1: \(Tw_1,\dots,Tw_r\) span \(\operatorname{im}T\).`, d: String.raw`Let \(y=Tv\) be in the image. Write \(v=\sum a_iu_i+\sum b_jw_j\). Since \(Tu_i=0\), we get \(y=\sum b_j\,Tw_j\).` },
      { fig: String.raw`Step 4: \(T\) is one-to-one on the green part (arrow “T is 1–1 here”): a relation among the \(Tw_j\) would put a combination of the \(w_j\) into the kernel.`, t: String.raw`Claim 2: \(Tw_1,\dots,Tw_r\) are linearly independent.`, d: String.raw`Suppose \(\sum b_jTw_j=0\). Then \(T\big(\sum b_jw_j\big)=0\), so \(\sum b_jw_j\in\ker T\) and equals some \(\sum a_iu_i\).` },
      { fig: String.raw`Step 5: the kernel boxes and the green boxes together are a basis of \(V\), so the relation must be trivial. Hence the green image boxes are independent: \(r\) independent vectors in the image.`, t: String.raw`Finish Claim 2 with independence of the big basis.`, d: String.raw`\(\sum a_iu_i-\sum b_jw_j=0\) is a linear relation among the vectors of a basis of \(V\), so all \(a_i\) and all \(b_j\) are \(0\). Hence the \(Tw_j\) are independent.` },
      { fig: String.raw`Step 6: the conclusion. The image has \(r\) boxes, the kernel \(k\): the gold line at the bottom reads \(n=\text{rank}+\text{nullity}\) for the current matrix.`, t: String.raw`Conclude.`, d: String.raw`\(Tw_1,\dots,Tw_r\) is a basis of \(\operatorname{im}T\), so \(\dim\operatorname{im}T=r\) and \(\dim V=k+r=\dim\ker T+\dim\operatorname{im}T\). \(\blacksquare\)` },
      { fig: String.raw`Step 7: the same count with the columns of \(M\): the top row of boxes has pivot columns (green, the rank) and free columns (pink, the nullity), and together they are all \(n\) columns.`, t: String.raw`Matrix reading (what the figure shows).`, d: String.raw`For \(T(x)=Mx\) on \(\mathbb R^n\): number of columns \(n\) = (pivot columns) + (free columns) = rank + nullity.` },
    ],
    memorize: {
      formula: String.raw`\dim V=\dim\ker T+\dim\operatorname{im}T\qquad (n=\text{nullity}+\text{rank})`,
      bullets: [
        String.raw`Proof recipe: <b>basis of ker → extend to basis of V → the new vectors map to a basis of im.</b>`,
        String.raw`In matrices: free columns \(\leftrightarrow\) kernel, pivot columns \(\leftrightarrow\) image.`,
        String.raw`Consequences: \(T\) injective \(\iff \ker T=0\); for \(\dim V=\dim W\), injective \(\iff\) surjective \(\iff\) bijective.`,
      ],
      pitfalls: [
        String.raw`Only \(V\) must be finite-dimensional, but \(\operatorname{im}T\) lives in \(W\): never write \(V=\ker T\oplus\operatorname{im}T\) (they are in different spaces).`,
        String.raw`Start from the kernel and extend; do not take a basis of the image first.`,
        String.raw`A basis of the image is given by the <i>original</i> columns at the pivot positions, not by the columns of the row-reduced matrix.`,
      ],
    },
  });

  /* ------------------------------------------------------------------ */
  ML.register({
    id: "similar-same-eigenvalues",
    course: "linalg2",
    topic: "maps",
    title: "Similar matrices have the same eigenvalues",
    blurb: "B = P⁻¹AP has the same characteristic polynomial: a change of basis does not change the map.",
    statement: String.raw`If \(B=P^{-1}AP\) for an invertible \(P\), then \(p_B(\lambda)=p_A(\lambda)\). Hence \(A\) and \(B\) have the same eigenvalues (with multiplicities), the same trace and the same determinant.`,
    shows: String.raw`The statement: one linear map drawn in two coordinate systems. Big picture: standard coordinates (matrix \(A\)). Small picture: coordinates in the basis \(p_1,p_2\) (matrix \(B=P^{-1}AP\)). The readout shows that tr, det and the eigenvalues agree although the matrices differ.`,
    vizIntro: String.raw`<b>Drag the tips</b> of <span style="color:#ff6b8b">Ae₁</span>, <span style="color:#4fd1a5">Ae₂</span> (they define \(A\)), of <span style="color:#ffcc4d">p₁</span>, <span style="color:#b78cff">p₂</span> (the columns of \(P\)) and the <span style="color:#5ad7ff">test vector x</span>. The big picture is the map \(A\) in standard coordinates. The small picture is <b>the same map written in the basis \(p_1,p_2\)</b> (matrix \(B\)). The matrices look different; tr, det and eigenvalues never change.`,

    viz(box) {
      const st = ML.stage(box, { x: [-4, 4], y: [-4, 4] });
      const S = { a1: { x: 2, y: 0.5 }, a2: { x: 1, y: 1.5 }, p1: { x: 1, y: 1 }, p2: { x: -0.5, y: 1 }, x: { x: 1.5, y: 1 }, focus: -1 };
      const A = () => [[S.a1.x, S.a2.x], [S.a1.y, S.a2.y]];
      const P = () => [[S.p1.x, S.p2.x], [S.p1.y, S.p2.y]];
      const ok = () => Math.abs(ML.la.det(P())) > 0.05;
      const Bm = () => ML.la.mul(ML.la.inv(P()), ML.la.mul(A(), P()));
      const mulV = ML.la.mulV;
      const circ = (M) => (t) => mulV(M, [Math.cos(t), Math.sin(t)]);
      const eigLines = (v, M, col) => {
        ML.la.eig(M).vals.forEach(({ v: e }) => v.line(-e[0] * 12, -e[1] * 12, e[0] * 12, e[1] * 12, col, 2, [8, 6]));
      };

      const graph = st.extra({ x: [-4, 4], y: [-4, 4], equal: true, height: 230 });
      const out = ML.readout(st.panel);

      st.draw((v) => {
        v.grid(1); v.axes();
        const p1 = S.p1, p2 = S.p2;
        if (ok()) {
          for (let i = -9; i <= 9; i++) {
            v.line(i * p1.x - 9 * p2.x, i * p1.y - 9 * p2.y, i * p1.x + 9 * p2.x, i * p1.y + 9 * p2.y, "rgba(255,204,77,.17)", 1);
            v.line(i * p2.x - 9 * p1.x, i * p2.y - 9 * p1.y, i * p2.x + 9 * p1.x, i * p2.y + 9 * p1.y, "rgba(183,140,255,.17)", 1);
          }
        }
        v.circle(0, 0, 1, "rgba(255,255,255,.55)", null, 1.5, [4, 4]);
        v.path(circ(A()), 0, 2 * Math.PI, C.pink, 2.5, 120);
        eigLines(v, A(), C.gold);
        v.arrow(0, 0, S.p1.x, S.p1.y, C.gold, 3); v.arrow(0, 0, S.p2.x, S.p2.y, C.purple, 3);
        const x = [S.x.x, S.x.y], Ax = mulV(A(), x);
        v.arrow(x[0], x[1], Ax[0], Ax[1], C.cyan, 2);
        v.dot(Ax[0], Ax[1], C.cyan, 4); v.text("Ax", Ax[0], Ax[1], C.cyan, 8, -6);
        v.handle(S.a1.x, S.a1.y, C.pink, "Ae₁"); v.handle(S.a2.x, S.a2.y, C.green, "Ae₂");
        v.handle(S.p1.x, S.p1.y, C.gold, "p₁"); v.handle(S.p2.x, S.p2.y, C.purple, "p₂");
        v.handle(S.x.x, S.x.y, C.cyan, "x");
        v.text("standard coordinates: matrix A", -3.9, 3.7, C.dim, 0, 0, "600 12px system-ui");
        const f = S.focus, tx = (str, col) => v.text(str, 0, -3.65, col, 0, 0, "700 13px system-ui", "center");
        if (f === 0 && ok()) { // step 1: the unit cell of the p-basis
          v.poly([[0, 0], [p1.x, p1.y], [p1.x + p2.x, p1.y + p2.y], [p2.x, p2.y]], "rgba(255,204,77,.2)", C.gold, 3);
          tx("gold cell = unit square of the basis p₁, p₂", C.gold);
        }
        if (f === 3) tx("det(B − λI) = det(P⁻¹) · det(A − λI) · det(P)", C.text);
        if (f === 4 && ok()) tx(`det P = ${ML.fmt(ML.la.det(P()), 3)},  det P⁻¹ = ${ML.fmt(1 / ML.la.det(P()), 3)},  product = 1`, C.gold);
        if (f === 5) tx("same curve ⇒ same roots, same −tr, same det", C.text);
        if (f === 6 && ok()) { // step 7: an eigenvector of A and its coordinates in the p-basis
          const E = ML.la.eig(A());
          if (E.vals.length) { const e = E.vals[0]; v.arrow(0, 0, e.v[0] * 2.4, e.v[1] * 2.4, C.gold, 5); v.text("v", e.v[0] * 2.4, e.v[1] * 2.4, C.gold, 8, -8, "700 14px system-ui"); tx(`v: eigenvector of A with λ = ${ML.fmt(e.l)}`, C.gold); }
          else tx("A has no real eigenvector (complex λ)", C.dim);
        }
      });

      // steps 4-6: the small graph plots the two characteristic polynomials against each other
      const polyDraw = (g) => {
        const EA = ML.la.eig(A()), EB = ok() ? ML.la.eig(Bm()) : EA, f = S.focus;
        const pA = (l) => l * l - EA.tr * l + EA.det, pB = (l) => l * l - EB.tr * l + EB.det;
        const top = ML.clamp(Math.max(Math.abs(pA(-4)), Math.abs(pA(4)), Math.abs(EA.det), 3), 3, 40);
        g.o.equal = false; g.o.x = [-4, 4]; g.o.y = [-top * 0.45, top]; g.begin();
        g.line(-4, 0, 4, 0, C.axis, 1.5); g.line(0, -top * 0.45, 0, top, C.axis, 1.5);
        g.plot(pA, -4, 4, C.pink, 3.5, 240);
        g.plot(pB, -4, 4, C.cyan, 2, 120, [6, 5]);
        g.text("p_A(λ) pink,  p_B(λ) cyan dashes", -3.9, top * 0.92, C.text, 0, 0, "600 11px system-ui");
        if (f >= 4) EA.vals.forEach((e) => { g.dot(e.l, 0, C.gold, 6); g.text(`λ=${ML.fmt(e.l)}`, e.l, 0, C.gold, 0, -10, "700 11px system-ui", "center"); });
        if (f === 5) { g.dot(0, EA.det, C.green, 6); g.text(`p(0) = det = ${ML.fmt(EA.det)}`, 0, EA.det, C.green, 8, -8, "700 11px system-ui"); }
        g.o.equal = true; g.o.x = [-4, 4]; g.o.y = [-4, 4];
      };
      graph.draw((g) => {
        if (S.focus >= 3 && S.focus <= 5) { polyDraw(g); return; }
        g.grid(1); g.axes();
        g.text("p-coordinates: matrix B = P⁻¹AP", -3.9, 3.65, C.dim, 0, 0, "600 12px system-ui");
        if (!ok()) { g.text("P is singular: not a basis", 0, 0, C.pink, 0, 0, "600 13px system-ui", "center"); return; }
        const B = Bm(), Pi = ML.la.inv(P());
        g.circle(0, 0, 1, "rgba(255,255,255,.55)", null, 1.5, [4, 4]);
        g.path(circ(B), 0, 2 * Math.PI, C.pink, 2.5, 120);
        eigLines(g, B, C.gold);
        const x = [S.x.x, S.x.y], y = mulV(Pi, x), By = mulV(B, y);
        g.arrow(y[0], y[1], By[0], By[1], C.cyan, 2);
        g.dot(y[0], y[1], C.cyan, 5); g.dot(By[0], By[1], C.cyan, 4);
        g.text("y", y[0], y[1], C.cyan, 8, -6); g.text("By", By[0], By[1], C.cyan, 8, -6);
        if (S.focus === 0) { // step 1: the same unit circle, now measured in p-coordinates
          g.text("same map, new coordinates", 0, -3.65, C.gold, 0, 0, "700 12px system-ui", "center");
        }
        if (S.focus === 6) { // step 7: P⁻¹v is an eigenvector of B with the same eigenvalue
          const E = ML.la.eig(A());
          if (E.vals.length) { const e = E.vals[0], c = mulV(Pi, [e.v[0] * 2.4, e.v[1] * 2.4]); g.arrow(0, 0, c[0], c[1], C.gold, 5); g.text("P⁻¹v", c[0], c[1], C.gold, 8, -8, "700 13px system-ui"); g.text(`eigenvector of B, same λ = ${ML.fmt(e.l)}`, 0, -3.65, C.gold, 0, 0, "700 12px system-ui", "center"); }
        }
      });

      const mtx = (M) => `[[${M[0].map((x) => ML.fmt(x)).join(", ")}], [${M[1].map((x) => ML.fmt(x)).join(", ")}]]`;
      const eigStr = (E) => E.complex ? `${ML.fmt(E.re)} ± ${ML.fmt(E.im)}i` : (E.scalar || E.repeated ? `${ML.fmt(E.tr / 2)} (twice)` : E.vals.map((e) => ML.fmt(e.l)).join(",  "));
      st.after = () => {
        const EA = ML.la.eig(A());
        if (!ok()) { out([["A", mtx(A())], ["P", mtx(P())]], "P is (almost) singular. Move p₁, p₂ so they are not on one line."); return; }
        const B = Bm(), EB = ML.la.eig(B);
        const same = Math.abs(EA.tr - EB.tr) < 1e-6 && Math.abs(EA.det - EB.det) < 1e-6;
        out([
          ["A", mtx(A())], ["P", mtx(P())], ["B = P⁻¹AP", mtx(B)],
          ["tr A, tr B", `${ML.fmt(EA.tr)}, ${ML.fmt(EB.tr)} <span class="${same ? "ok" : "no"}">✓</span>`],
          ["det A, det B", `${ML.fmt(EA.det)}, ${ML.fmt(EB.det)} <span class="${same ? "ok" : "no"}">✓</span>`],
          ["λ of A", eigStr(EA)], ["λ of B", eigStr(EB)],
        ], "Entries of B change with P, but λ² − tr·λ + det is identical.");
      };
      ML.drag(st, () => [S.a1, S.a2, S.p1, S.p2, S.x], (i, x, y) => { const pt = [S.a1, S.a2, S.p1, S.p2, S.x][i]; pt.x = x; pt.y = y; },
        { snap: 0.05, clamp: [-3.9, 3.9, -3.9, 3.9] });
      st.redraw();
      return { showStep(i) { S.focus = i; st.redraw(); } };
    },

    idea: String.raw`Slip \(P^{-1}\) and \(P\) around \(\lambda I\): \(B-\lambda I=P^{-1}(A-\lambda I)P\). Then multiplicativity of \(\det\) cancels \(\det P^{-1}\det P=1\).`,
    steps: [
      { fig: String.raw`Step 1: one linear map in two coordinate systems. Big picture: standard coordinates, matrix \(A\) (pink = image of the unit circle). Small picture: coordinates with respect to \(p_1,p_2\), matrix \(B=P^{-1}AP\). The gold parallelogram is the unit cell of the \(p\)-basis.`, t: String.raw`Setup.`, d: String.raw`Let \(B=P^{-1}AP\) with \(P\) invertible. The characteristic polynomial of \(B\) is \(p_B(\lambda)=\det(B-\lambda I)\).` },
      { t: String.raw`Write \(\lambda I\) in the same shape as \(B\).`, d: String.raw`Because \(\lambda I\) commutes with every matrix, \(\lambda I=P^{-1}(\lambda I)P\).` },
      { t: String.raw`Factor.`, d: String.raw`\(B-\lambda I=P^{-1}AP-P^{-1}(\lambda I)P=P^{-1}(A-\lambda I)P.\)` },
      { fig: String.raw`Step 4: taking determinants gives \(\det(B-\lambda I)=\det(P^{-1})\det(A-\lambda I)\det(P)\). The small graph now plots both characteristic polynomials as functions of \(\lambda\): \(p_A\) (pink) and \(p_B\) (cyan, dashed).`, t: String.raw`Take determinants (multiplicativity).`, d: String.raw`\(p_B(\lambda)=\det(P^{-1})\,\det(A-\lambda I)\,\det(P).\)` },
      { fig: String.raw`Step 5: \(\det(P^{-1})\det(P)=1\) cancels, so \(p_B\) and \(p_A\) are the same curve: the cyan dashes lie exactly on the pink curve. Move \(p_1,p_2\): the matrix \(B\) changes, the curve does not.`, t: String.raw`Cancel.`, d: String.raw`\(\det(P^{-1})\det(P)=\det(P^{-1}P)=\det I=1\), so \(p_B(\lambda)=\det(A-\lambda I)=p_A(\lambda)\). \(\blacksquare\)` },
      { fig: String.raw`Step 6: one curve means one set of roots (the eigenvalues: gold dots on the \(\lambda\)-axis), the same coefficient of \(\lambda\) (\(-\operatorname{tr}\)) and the same value at \(\lambda=0\) (green dot: the determinant).`, t: String.raw`Read off the consequences.`, d: String.raw`Equal polynomials have equal roots with equal multiplicities (eigenvalues), the same coefficient of \(\lambda^{n-1}\) (the trace) and the same constant term (the determinant).` },
      { fig: String.raw`Step 7: an eigenvector \(v\) of \(A\) (gold arrow, big picture) corresponds to the eigenvector \(P^{-1}v\) of \(B\) (gold arrow, small picture): different coordinates, the same eigenvalue \(\lambda\).`, t: String.raw`Eigenvectors correspond.`, d: String.raw`If \(Av=\lambda v\) then \(B(P^{-1}v)=P^{-1}AP\,P^{-1}v=P^{-1}Av=\lambda\,(P^{-1}v)\): same \(\lambda\), with coordinates \(P^{-1}v\).` },
    ],
    memorize: {
      formula: String.raw`B-\lambda I=P^{-1}(A-\lambda I)P\;\Rightarrow\;p_B=p_A,\quad \operatorname{tr}B=\operatorname{tr}A,\quad\det B=\det A`,
      bullets: [
        String.raw`Key trick: \(\lambda I=P^{-1}(\lambda I)P\), then \(\det(XY)=\det X\det Y\).`,
        String.raw`Similar matrices represent the <b>same linear map in different bases</b>, so every basis-free quantity agrees: eigenvalues, trace, determinant, rank.`,
        String.raw`Eigenvectors are not equal but are related: \(v\mapsto P^{-1}v\).`,
      ],
      pitfalls: [
        String.raw`The converse is false: \(\begin{pmatrix}1&1\\0&1\end{pmatrix}\) and \(I\) have the same characteristic polynomial but are not similar.`,
        String.raw`Do not write \(\det(B-\lambda I)=\det(B)-\lambda\): expand properly or use the factorisation above.`,
        String.raw`The order matters: it is \(P^{-1}AP\) (or \(PAP^{-1}\)), not \(PAP\) or \(P^{T}AP\) (that one is <i>congruence</i>, which changes eigenvalues).`,
      ],
    },
  });
})(window.ML);
