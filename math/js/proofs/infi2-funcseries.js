"use strict";
/* Infinitesimal Calculus 2 · Function series & uniform convergence.
   Proofs: pointwise-vs-uniform-xn, uniform-limit-continuous, weierstrass-m-test, power-series-radius. */
(function (ML) {
  const C = ML.C, fmt = ML.fmt;
  const okSpan = (b, t) => `<span class="${b ? "ok" : "no"}">${t}</span>`;
  /** small caption drawn inside a canvas (top-left) so the picture says what it is showing */
  const caption = (v, str, color) => {
    const c = v.ctx; c.font = "600 12px system-ui, sans-serif"; c.fillStyle = color || C.text; c.textAlign = "left";
    c.fillText(str, 10, 18);
  };
  const frame = (g, color) => { g.ctx.strokeStyle = color || C.gold; g.ctx.lineWidth = 3; g.ctx.strokeRect(1.5, 1.5, g.w - 3, g.h - 3); };

  /* ================================================================== */
  /* 1) f_n(x) = x^n : pointwise but not uniform                          */
  /* ================================================================== */
  ML.register({
    id: "pointwise-vs-uniform-xn",
    course: "infi2",
    topic: "funcseries",
    title: "Pointwise vs. uniform convergence: fₙ(x) = xⁿ",
    blurb: "The same sequence converges pointwise on [0,1], but uniformly only on [0,a] with a < 1.",
    statement: String.raw`Let \(f_n(x)=x^n\) on \([0,1]\). Then (a) \(f_n\to f\) pointwise, where \(f(x)=0\) for \(0\le x\lt1\) and \(f(1)=1\). (b) The convergence is <b>not</b> uniform on \([0,1]\) (nor on \([0,1)\)): \(\|f_n-f\|_\infty=1\) for every \(n\). (c) For every \(0\lt a\lt1\) the convergence <b>is</b> uniform on \([0,a]\), since \(\|f_n-f\|_{\infty,[0,a]}=a^n\to0\).`,
    shows: String.raw`The statement itself: the graphs of \(f_n(x)=x^n\) (blue), the limit function \(f\) (gold), the \(\varepsilon\)-tube \(f\pm\varepsilon\) (green) and the interval \([0,a]\) (teal bar on the axis). Choose 2D graphs or the 3D surface \((x,n,f_n(x))\).`,
    vizIntro: String.raw`<b>Slide \(n\)</b> (or press Play) and watch the blue graph \(f_n\) sink toward the x-axis, while the point \((1,1)\) never moves. Then shrink \(a\) below 1: on \([0,a]\) the whole graph fits inside the green tube once \(n\) is large. <b>Drag the orange handle \(x_0\)</b> along the axis to follow a single point.`,

    viz(box) {
      const st = ML.stage(box, { x: [-0.08, 1.12], y: [-0.62, 1.32], equal: false, aspect: "4 / 3" });
      const sc = ML.scene3d(st, { R: 1.3, zR: 1.3, az: -0.95, el: 0.55 });
      sc.rotatable();
      const NM = 40;
      const S = { mode: "2d", n: 8, eps: 0.25, a: 1, x0: 0.8, focus: -1 };
      const Nx = (x, e) => (x <= 0 || x >= 1 || e >= 1 ? 1 : Math.floor(Math.log(e) / Math.log(x)) + 1);
      const dom = () => (S.a >= 0.995 ? 1 : S.a);
      const HB = -0.56; // y-position of the x0 handle

      ML.select(st.panel, { label: "View", options: [["2d", "2D graphs of fₙ"], ["3d", "3D surface (x, n, fₙ(x))"]], onChange: (m) => { S.mode = m; st.redraw(); } });
      const nS = ML.slider(st.panel, { label: "n", min: 1, max: NM, step: 1, value: S.n, fmt: (v) => String(v), onInput: (v) => { S.n = v; st.redraw(); } });
      let acc = S.n;
      let playBtn;
      const anim = ML.loop(st, (dt) => {
        acc += dt * 5; S.n = Math.min(NM, Math.floor(acc)); nS.set(S.n);
        if (S.n >= NM) { playBtn.textContent = "▶ Play n"; return false; }
        return true;
      });
      playBtn = ML.button(st.panel, "▶ Play n", () => {
        if (anim.running) { anim.stop(); playBtn.textContent = "▶ Play n"; return; }
        if (S.n >= NM) S.n = 1;
        acc = S.n; nS.set(S.n); playBtn.textContent = "⏸ Pause"; anim.start();
      });
      const eS = ML.slider(st.panel, { label: "ε (tube half-width)", min: 0.05, max: 0.4, step: 0.01, value: S.eps, onInput: (v) => { S.eps = v; st.redraw(); } });
      const aS = ML.slider(st.panel, { label: "a (interval [0,a]; 1 means [0,1])", min: 0.2, max: 1, step: 0.01, value: S.a, onInput: (v) => { S.a = v; st.redraw(); } });
      const ex = st.extra({ x: [0, 1], y: [0, 50], height: 140 });
      const out = ML.readout(st.panel);

      /* ---------- 2D ---------- */
      function draw2d(v) {
        const A = dom(), n = S.n, e = S.eps, f = S.focus;
        v.grid(0.25); v.axes();
        for (let k = 1; k < n; k++) v.plot((x) => Math.pow(x, k), 0, 1, "rgba(108,140,255,.12)", 1, 50);
        // tube around the limit
        v.poly([[0, -e], [A, -e], [A, e], [0, e]], "rgba(79,209,165,.14)");
        v.line(0, e, A, e, C.green, 1.5, [6, 4]); v.line(0, -e, A, -e, C.green, 1.5, [6, 4]);
        v.text("f + ε", 0, e, C.green, 6, -5); v.text("f − ε", 0, -e, C.green, 6, 14);
        v.line(1, 1 - e, 1, 1 + e, C.green, 5);
        // limit function
        const thick = f === 1 || f === 5;
        v.line(0, 0, 1, 0, C.gold, thick ? 6 : 3);
        v.dot(1, 0, C.bg, 6, C.gold); v.dot(1, 1, C.gold, thick ? 8 : 6);
        v.text("limit f = 0 on [0,1)", 0.5, 0, C.gold, 0, 17, "600 12px system-ui", "center");
        v.text("f(1) = 1", 1, 1, C.gold, -12, -4, "600 12px system-ui", "right");
        // f_n
        if (A < 1) v.plot((x) => Math.pow(x, n), A, 1, "rgba(108,140,255,.4)", 2, 60, [4, 4]);
        v.plot((x) => Math.pow(x, n), 0, A, C.blue, 3.5, 160);
        v.text(`fₙ,  n = ${n}`, 0.3, 1.08, C.blue, 0, 0, "700 13px system-ui");
        // domain bar
        v.line(0, -0.46, A, -0.46, C.cyan, 6); v.text(A < 1 ? `[0, a]` : `[0, 1]`, A / 2, -0.46, C.cyan, 0, -9, "600 12px system-ui", "center");
        // focus-specific layers
        if (f === 0 || f === 4) {
          const xs = f === 0 ? [S.x0] : [S.x0, (1 + S.x0) / 2];
          xs.forEach((x, i) => {
            v.line(x, 0, x, 1, "rgba(255,159,90,.55)", 1.5, [5, 4]);
            for (let k = 1; k <= n; k++) v.dot(x, Math.pow(x, k), C.orange, 3.5);
            v.text(f === 0 ? "x₀ᵏ, k = 1…n  →  0" : `x = ${fmt(x, 2)}:  N(x) = ${Nx(x, e)}`, x, 0.5 + 0.14 * i, C.orange, -10, 0, "600 12px system-ui", "right");
          });
        }
        if (f === 2) {
          const xs = Math.pow(e, 1 / n);
          if (xs < A) {
            v.plot((x) => Math.pow(x, n), xs, A, C.red, 5, 80);
            v.dot(xs, e, C.red, 6); v.line(xs, 0, xs, e, C.red, 1.5, [4, 4]);
            v.text(`x* = ε^(1/n) = ${fmt(xs, 3)}`, xs, e, C.red, 8, -10, "700 12px system-ui");
          }
        }
        if (f === 3 && A < 1) {
          const s = Math.pow(A, n), good = s < e;
          v.line(0, s, A, s, good ? C.green : C.orange, 2.5, [7, 4]);
          v.text(`aⁿ = ${fmt(s, 3)}`, A, s, good ? C.green : C.orange, 8, -6, "700 12px system-ui");
        }
        // x0 handle
        v.handle(S.x0, HB, C.orange, "x₀");
        const msgs = {
          0: "Fix one point x₀: its heights x₀ᵏ shrink to 0 (pointwise).",
          1: "Every fₙ is continuous, but the limit f jumps at x = 1.",
          2: "Red: the part of fₙ that sticks out of the ε-tube. It exists for every n.",
          3: "On [0, a] the whole graph lies below aⁿ.",
          4: "Pointwise: each x has its own N(x), and N(x) → ∞ as x → 1.",
          5: "The jump of f at x = 1 is the footprint of non-uniform convergence.",
        };
        caption(v, msgs[f] || "Graphs fₙ(x) = xⁿ, limit f and the ε-tube.", f >= 0 ? C.gold : C.dim);
      }

      /* ---------- 3D ---------- */
      const X3 = (x) => 2 * x - 1, Y3 = (n) => 2 * (n - 1) / (NM - 1) - 1, Z3 = (z) => 2 * z - 1;
      function draw3d(v) {
        sc.begin(v);
        const f = S.focus, A = dom(), n = S.n, e = S.eps;
        const c = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]];
        for (let i = 0; i < 4; i++) sc.line3(c[i], c[(i + 1) % 4], C.axis, 1.5);
        sc.surface((X, Y) => Z3(Math.pow(Math.max((X + 1) / 2, 0), 1 + (Y + 1) / 2 * (NM - 1))), { n: 34, zmin: -1, zmax: 1 });
        sc.line3([-1, -1, -1], [-1, -1, 1], C.dim, 1.5);
        sc.text3("1", [-1, -1, 1], C.dim, -12, 4); sc.text3("0", [-1, -1, -1], C.dim, -12, 4);
        sc.text3("x: 0 → 1", [0, -1, -1], C.dim, -20, 18); sc.text3("n: 1 → " + NM, [1, 0, -1], C.dim, 10, 6);
        // slice at current n and the epsilon level
        sc.curve3((x) => [X3(x), Y3(n), Z3(Math.pow(x, n))], 0, 1, C.gold, 3.5, 80);
        sc.line3([-1, Y3(n), Z3(e)], [X3(A), Y3(n), Z3(e)], C.green, 2, [6, 4]);
        sc.text3("ε", [-1, Y3(n), Z3(e)], C.green, -14, 4);
        // the edge x = 1 (f_n(1) = 1 for all n) and the last slice (≈ limit)
        sc.line3([1, -1, 1], [1, 1, 1], C.red, f === 1 || f === 2 || f === 5 ? 5 : 3);
        sc.text3("fₙ(1) = 1 for all n", [1, 1, 1], C.red, 6, -6);
        sc.curve3((x) => [X3(x), 1, Z3(Math.pow(x, NM))], 0, 1, C.gold, f === 1 || f === 5 ? 5 : 2.5, 80);
        if (A < 1) {
          sc.curve3((t) => [X3(A), Y3(t), Z3(Math.pow(A, t))], 1, NM, C.cyan, f === 3 ? 5 : 3, 60);
          sc.text3("x = a:  aⁿ → 0", [X3(A), 1, Z3(Math.pow(A, NM))], C.cyan, 6, -8);
        }
        if (f === 0 || f === 4) {
          sc.curve3((t) => [X3(S.x0), Y3(t), Z3(Math.pow(S.x0, t))], 1, NM, C.orange, 4, 60);
          sc.dot3([X3(S.x0), Y3(n), Z3(Math.pow(S.x0, n))], C.orange, 6);
          sc.text3("x = x₀: height x₀ⁿ → 0", [X3(S.x0), Y3(NM / 2), Z3(Math.pow(S.x0, NM / 2))], C.orange, 8, -8);
        }
        if (f === 2) {
          const xs = Math.pow(e, 1 / n);
          if (xs < A) { sc.dot3([X3(xs), Y3(n), Z3(e)], C.red, 7); sc.text3("x* (leaves the tube)", [X3(xs), Y3(n), Z3(e)], C.red, 8, -8); }
        }
        sc.hint(v);
        const msgs = {
          0: "Orange curve: the height of fₙ at the fixed point x₀ as n grows (→ 0).",
          1: "Red ridge x = 1 (height 1 for all n) next to the surface sinking to 0: the limit jumps.",
          2: "Red dot: where the slice fₙ leaves the green ε-level.",
          3: "Teal curve: height at x = a, which tends to 0. The red ridge at x = 1 does not.",
          4: "Pointwise: look at one x at a time (orange curve).",
          5: "Gold: ≈ limit f. Red: fₙ(1) = 1 for all n.",
        };
        caption(v, msgs[f] || "Surface z = xⁿ over (x, n). Gold slice = current n.", f >= 0 ? C.gold : C.dim);
      }
      st.draw((v) => (S.mode === "3d" ? draw3d(v) : draw2d(v)));

      /* ---------- graph of N(x) ---------- */
      ex.draw((g) => {
        const e = S.eps, A = dom();
        g.axes(); g.grid(0.25);
        g.path((x) => [x, Math.min(50, Nx(x, e))], 0, 0.9995, C.orange, S.focus === 4 ? 4 : 2.5, 400);
        if (A < 1) {
          const na = Nx(A, e);
          g.poly([[0, 0], [A, 0], [A, na], [0, na]], "rgba(86,215,255,.12)");
          g.line(A, 0, A, na, C.cyan, 2); g.line(0, na, A, na, C.cyan, 2, [5, 4]);
          g.text(`N(a) = ${na} works for all x ≤ a`, 0.02, 45, C.cyan, 0, 0, "600 11px system-ui");
        } else g.text("N(x) → ∞ as x → 1: no single N", 0.02, 44, C.red, 0, 0, "600 11px system-ui");
        g.dot(Math.min(S.x0, 0.9995), Math.min(50, Nx(S.x0, e)), C.orange, 5, C.white);
        g.text("x", 0.98, 0, C.dim, 0, -4); g.text("N(x): first N with xⁿ < ε for all n ≥ N", 0.02, 3, C.text, 0, -4, "600 11px system-ui");
        if (S.focus === 4) frame(g);
      });

      st.after = () => {
        const A = dom(), n = S.n, e = S.eps;
        const sup = A < 1 ? Math.pow(A, n) : 1;
        const inTube = A < 1 && sup < e;
        out([
          ["n", String(n)],
          ["domain", A < 1 ? `[0, ${fmt(A)}]` : "[0, 1]"],
          ["‖fₙ − f‖∞ on domain", A < 1 ? `aⁿ = ${fmt(sup, 4)}` : "1  (for every n)"],
          ["graph inside ε-tube?", inTube ? okSpan(true, "yes") : okSpan(false, "no")],
          ["uniform N for this ε", A < 1 ? `N = ${Nx(A, e)} (works for every x ≤ a)` : okSpan(false, "none exists")],
          ["pointwise N(x₀)", `x₀ = ${fmt(S.x0)}:  N(x₀) = ${Nx(S.x0, e)}`],
        ], A < 1 ? "On [0, a] one N serves all x: uniform convergence." : "On [0, 1) the sup stays 1: for every n some x has fₙ(x) far above ε.");
      };

      ML.drag(st, () => (S.mode === "2d" ? [{ x: S.x0, y: HB }] : []), (i, x) => { S.x0 = ML.clamp(x, 0.02, 0.995); }, { snap: 0.01, r: 24 });

      return {
        showStep(i) {
          S.focus = i;
          if (i === 0 || i === 4) { S.n = Math.max(S.n, 10); nS.set(S.n); }
          if (i === 2 || i === 1 || i === 5) { S.a = 1; aS.set(1); }
          if (i === 3) { if (S.a >= 0.995) { S.a = 0.8; aS.set(0.8); } S.n = Math.max(S.n, 12); nS.set(S.n); }
          if (i === 4) { S.a = 1; aS.set(1); }
          st.redraw();
        },
      };
    },

    idea: String.raw`Pointwise: \(N\) may depend on \(x\). Uniform: one \(N\) for all \(x\) at once, i.e. the whole graph fits in the \(\varepsilon\)-tube. For \(x^n\) the needed \(N(x)\) blows up near \(x=1\).`,
    steps: [
      { fig: String.raw`The orange handle \(x_0\) (drag it) and the heights \(x_0^{\,k}\), \(k=1,\dots,n\) (orange dots on the dashed vertical line). In the 3D view the orange curve is the height of \(f_n\) at \(x=x_0\) as \(n\) grows. They tend to \(0\).`, t: String.raw`Pointwise limit.`, d: String.raw`Fix \(x\in[0,1]\). If \(0\le x\lt1\) then \(x^n\to0\); if \(x=1\) then \(1^n=1\). So \(f_n\to f\) pointwise: \(\forall x\ \forall\varepsilon\ \exists N\ \forall n\ge N:\ |f_n(x)-f(x)|\lt\varepsilon\). Here \(N\) may depend on \(x\) (and on \(\varepsilon\)): \(N(x,\varepsilon)=\lfloor\ln\varepsilon/\ln x\rfloor+1\).` },
      { fig: String.raw`The limit function \(f\) in thick gold: \(0\) on \([0,1)\), with an open circle at \((1,0)\) and a filled dot at \((1,1)\). Every blue graph \(f_n\) is continuous, but \(f\) jumps. (3D: the red ridge \(x=1\) stays at height \(1\) while the rest of the surface sinks.)`, t: String.raw`The limit is discontinuous although every \(f_n\) is continuous.`, d: String.raw`\(\lim_{x\to1^-}f(x)=0\ne1=f(1)\). Pointwise limits of continuous functions need not be continuous, so pointwise convergence preserves too little structure.` },
      { fig: String.raw`The red part of the graph of \(f_n\) lies outside the green \(\varepsilon\)-tube; it starts at \(x^*=\varepsilon^{1/n}\). Slide \(n\): such an \(x^*\) exists for <b>every</b> \(n\) and moves toward \(1\), so no \(n\) puts the whole graph inside the tube.`, t: String.raw`Not uniform on \([0,1)\).`, d: String.raw`Uniform convergence means \(\forall\varepsilon\ \exists N\ \forall n\ge N\ \forall x:\ |f_n(x)-f(x)|\lt\varepsilon\), equivalently \(\|f_n-f\|_\infty\to0\). Take \(\varepsilon_0=\tfrac12\) and for each \(n\) the point \(x_n=2^{-1/n}\in[0,1)\): \(|f_n(x_n)-f(x_n)|=\tfrac12\ge\varepsilon_0\). This is the negation of uniform convergence. In fact \(\sup_{[0,1)}x^n=1\), so \(\|f_n-f\|_\infty=1\not\to0\).` },
      { fig: String.raw`The interval \([0,a]\) (teal bar). The dashed horizontal line at height \(a^n\) bounds the whole graph of \(f_n\) on \([0,a]\); it turns green as soon as \(a^n\lt\varepsilon\), and then the entire graph is inside the tube. (3D: the teal curve \(x=a\) tends to \(0\).)`, t: String.raw`Uniform on \([0,a]\), \(0\lt a\lt1\).`, d: String.raw`For \(x\in[0,a]\): \(|f_n(x)-f(x)|=x^n\le a^n\), and this bound is attained at \(x=a\). So \(\|f_n-f\|_{\infty,[0,a]}=a^n\to0\). Given \(\varepsilon\), choose \(N\gt\ln\varepsilon/\ln a\): then for all \(n\ge N\) and <b>all</b> \(x\in[0,a]\): \(|f_n(x)-f(x)|\le a^n\lt\varepsilon\).` },
      { fig: String.raw`The small graph shows \(N(x)\), the first index from which \(x^n\lt\varepsilon\) for all later \(n\) (also drawn as orange dots at two points). It shoots to infinity as \(x\to1\) (no uniform \(N\)); on \([0,a]\) it is bounded by \(N(a)\) (teal box).`, t: String.raw`Where the two notions differ.`, d: String.raw`Pointwise: \(N=N(x,\varepsilon)\). Uniform: \(N=N(\varepsilon)\) must work for all \(x\), i.e. \(\sup_xN(x,\varepsilon)\lt\infty\). Here \(\sup_{x\in[0,1)}N(x,\varepsilon)=\infty\), while on \([0,a]\) the function \(N(\cdot,\varepsilon)\) is increasing, hence \(\le N(a,\varepsilon)\).` },
      { fig: String.raw`The jump of the limit \(f\) at \(x=1\) (thick gold): by the theorem of the next proof, a uniform limit of continuous functions is continuous, so this jump proves again that the convergence cannot be uniform.`, t: String.raw`Moral.`, d: String.raw`Uniform convergence is the notion that transfers properties (continuity, integrability, ...) from \(f_n\) to \(f\). Since each \(x^n\) is continuous and the pointwise limit is not, the convergence on \([0,1]\) cannot be uniform. \(\blacksquare\)` },
    ],
    memorize: {
      formula: String.raw`f_n\to f\text{ uniformly}\iff\|f_n-f\|_\infty\to0\iff\forall\varepsilon\ \exists N\ \forall n\ge N\ \forall x:\ |f_n(x)-f(x)|\lt\varepsilon`,
      bullets: [
        String.raw`Pointwise: \(\forall x\ \forall\varepsilon\ \exists N\) (N depends on \(x\)). Uniform: \(\forall\varepsilon\ \exists N\ \forall x\) (one N for everything).`,
        String.raw`Uniform \(\Rightarrow\) pointwise, never the converse. Picture: the whole graph of \(f_n\) lies in the tube \(f\pm\varepsilon\).`,
        String.raw`\(x^n\): \(\|f_n-f\|_\infty=1\) on \([0,1)\), but \(=a^n\to0\) on \([0,a]\), \(a\lt1\).`,
      ],
      pitfalls: [
        String.raw`To disprove uniform convergence give \(\varepsilon_0\) and points \(x_n\) (depending on \(n\)) with \(|f_n(x_n)-f(x_n)|\ge\varepsilon_0\); or show \(\sup|f_n-f|\not\to0\).`,
        String.raw`Removing the endpoint does not help: on \([0,1)\) the sup is still \(1\).`,
        String.raw`Compute the sup against the <i>limit function</i> \(f\), including its value at \(x=1\).`,
      ],
    },
  });

  /* ================================================================== */
  /* 2) uniform limit of continuous functions is continuous (ε/3 proof)  */
  /* ================================================================== */
  ML.register({
    id: "uniform-limit-continuous",
    course: "infi2",
    topic: "funcseries",
    title: "A uniform limit of continuous functions is continuous",
    blurb: "The ε/3 argument: one N for all x, then continuity of fₙ at x₀.",
    statement: String.raw`Let \(f_n:I\to\mathbb R\) be continuous for every \(n\), and suppose \(f_n\to f\) <b>uniformly</b> on \(I\). Then \(f\) is continuous on \(I\).`,
    shows: String.raw`The statement itself, with the \(\varepsilon/3\) proof drawn on a concrete example: the limit \(f\) (gold), the tube \(f\pm\varepsilon/3\) (shaded), the continuous function \(f_N\) (blue), and the three gaps at the points \(x_0\) and \(x\). Switch to the example \(x^n\) to see where the argument breaks without uniformity.`,
    vizIntro: String.raw`<b>Drag the gold handle \(x_0\) and the white handle \(x\)</b> along the axis. The three bars at the bottom are the three gaps of the triangle inequality, each to be kept below \(\varepsilon/3\); the fourth bar is \(|f(x)-f(x_0)|\), which must stay below \(\varepsilon\). Change \(N\) and \(\varepsilon\), or switch example.`,

    viz(box) {
      const EX = {
        A: { name: "fₙ(x) = √(x² + 1/n)  →  |x|   on [−1.5, 1.5]  (uniform)", I: [-1.5, 1.5], X: [-1.7, 1.7], Y: [-0.45, 2.1], fn: (n, x) => Math.sqrt(x * x + 1 / n), f: (x) => Math.abs(x), sup: (n) => 1 / Math.sqrt(n), eps: 0.9, x0: 0.3, x: 0.5, N: 15, uni: true },
        B: { name: "fₙ(x) = xⁿ  →  f on [0, 1]  (NOT uniform; f jumps)", I: [0, 1], X: [-0.1, 1.1], Y: [-0.3, 1.3], fn: (n, x) => Math.pow(x, n), f: (x) => (x >= 1 ? 1 : 0), sup: () => 1, eps: 0.6, x0: 0.97, x: 0.9, N: 10, uni: false },
        C: { name: "fₙ(x) = x/(1 + n x²)  →  0   on [−2, 2]  (uniform)", I: [-2, 2], X: [-2.2, 2.2], Y: [-0.8, 0.8], fn: (n, x) => x / (1 + n * x * x), f: () => 0, sup: (n) => 1 / (2 * Math.sqrt(n)), eps: 0.6, x0: 0.5, x: 0.7, N: 8, uni: true },
      };
      const S = { ex: "A", N: EX.A.N, eps: EX.A.eps, x0: EX.A.x0, x: EX.A.x, focus: -1 };
      const E = () => EX[S.ex];
      const st = ML.stage(box, { x: EX.A.X, y: EX.A.Y, equal: false, aspect: "4 / 3" });
      const yb = () => E().Y[0] + 0.07 * (E().Y[1] - E().Y[0]);

      const sel = ML.select(st.panel, {
        label: "Example", options: Object.entries(EX).map(([k, e]) => [k, e.name]),
        onChange: (k) => { setExample(k); st.redraw(); },
      });
      const nS = ML.slider(st.panel, { label: "N (index chosen in step 2)", min: 1, max: 40, step: 1, value: S.N, fmt: (v) => String(v), onInput: (v) => { S.N = v; st.redraw(); } });
      const eS = ML.slider(st.panel, { label: "ε", min: 0.1, max: 1.5, step: 0.01, value: S.eps, onInput: (v) => { S.eps = v; st.redraw(); } });
      const bars = st.extra({ x: [0, 4], y: [0, 1], height: 150 });
      st.note(String.raw`Bars: <span style="color:#ff6b8b">①</span> |f(x)−f_N(x)|, <span style="color:#ffcc4d">②</span> |f_N(x)−f_N(x₀)|, <span style="color:#4fd1a5">③</span> |f_N(x₀)−f(x₀)|, ④ |f(x)−f(x₀)|. Thresholds: ε/3 for ①②③, ε for ④.`);
      const out = ML.readout(st.panel);

      function setExample(k) {
        S.ex = k; const e = EX[k]; S.N = e.N; S.eps = e.eps; S.x0 = e.x0; S.x = e.x;
        nS.set(S.N); eS.set(S.eps); sel.value = k;
        st.view.o.x = e.X; st.view.o.y = e.Y;
      }
      /** largest δ (scanned) with |f_N(x) − f_N(x0)| < ε/3 on |x − x0| < δ, inside the domain */
      function delta() {
        const e = E(), w = e.I[1] - e.I[0], step = w / 1000, e3 = S.eps / 3, base = e.fn(S.N, S.x0);
        let d = step;
        for (; d <= w; d += step) {
          const l = S.x0 - d, r = S.x0 + d;
          if ((l >= e.I[0] && Math.abs(e.fn(S.N, l) - base) >= e3) || (r <= e.I[1] && Math.abs(e.fn(S.N, r) - base) >= e3)) break;
        }
        return Math.max(step, d - step);
      }
      const gaps = () => {
        const e = E(), x = S.x, x0 = S.x0, N = S.N;
        const g1 = Math.abs(e.f(x) - e.fn(N, x)), g2 = Math.abs(e.fn(N, x) - e.fn(N, x0)), g3 = Math.abs(e.fn(N, x0) - e.f(x0));
        return { g1, g2, g3, tot: Math.abs(e.f(x) - e.f(x0)) };
      };
      const Nmin = () => { const e = E(); for (let n = 1; n <= 400; n++) if (e.sup(n) < S.eps / 3) return n; return null; };

      st.draw((v) => {
        const e = E(), f = S.focus, e3 = S.eps / 3, N = S.N, [a, b] = e.I, K = 220;
        const xs = Array.from({ length: K + 1 }, (_, i) => a + (b - a) * i / K);
        v.grid(e.X[1] - e.X[0] > 3 ? 0.5 : 0.25); v.axes();
        const showTube = f === -1 || f === 1 || f === 3 || f === 4 || f === 5;
        const showDelta = f === -1 || f === 2 || f === 3 || f === 4;
        const showGaps = f === -1 || f === 3 || f === 4 || f === 5;
        // tube f ± ε/3
        if (showTube) {
          const up = xs.map((x) => [x, e.f(x) + e3]), lo = xs.map((x) => [x, e.f(x) - e3]).reverse();
          v.poly(up.concat(lo), "rgba(79,209,165,.15)");
          v.path((x) => [x, e.f(x) + e3], a, b, C.green, 1.2, K, [5, 4]); v.path((x) => [x, e.f(x) - e3], a, b, C.green, 1.2, K, [5, 4]);
          v.text("f ± ε/3", a, e.f(a) + e3, C.green, 4, -6, "600 12px system-ui");
        }
        // target band around f(x0)
        if (f === 0 || f === -1) {
          const y0 = e.f(S.x0);
          v.poly([[a, y0 - S.eps], [b, y0 - S.eps], [b, y0 + S.eps], [a, y0 + S.eps]], "rgba(255,204,77,.08)");
          v.line(a, y0 + S.eps, b, y0 + S.eps, C.gold, 1.5, [6, 4]); v.line(a, y0 - S.eps, b, y0 - S.eps, C.gold, 1.5, [6, 4]);
          v.text("f(x₀) + ε", a, y0 + S.eps, C.gold, 4, -5, "600 12px system-ui"); v.text("f(x₀) − ε", a, y0 - S.eps, C.gold, 4, 14, "600 12px system-ui");
        }
        // δ window
        if (showDelta) {
          const d = delta(), l = Math.max(a, S.x0 - d), r = Math.min(b, S.x0 + d), y0 = e.fn(N, S.x0);
          v.poly([[l, e.Y[0]], [r, e.Y[0]], [r, e.Y[1]], [l, e.Y[1]]], "rgba(255,204,77,.09)");
          v.line(l, e.Y[0], l, e.Y[1], C.gold, 1, [4, 4]); v.line(r, e.Y[0], r, e.Y[1], C.gold, 1, [4, 4]);
          v.line(a, y0 + e3, b, y0 + e3, "rgba(108,140,255,.6)", 1.2, [3, 4]); v.line(a, y0 - e3, b, y0 - e3, "rgba(108,140,255,.6)", 1.2, [3, 4]);
          v.text("δ-window", (l + r) / 2, e.Y[1], C.gold, 0, 36, "600 12px system-ui", "center");
        }
        // f (limit) and f_N
        if (e.uni) v.plot(e.f, a, b, C.gold, 3, K);
        else { v.plot((x) => 0, a, 1 - 1e-9, C.gold, 3, 2); v.dot(1, 0, C.bg, 6, C.gold); v.dot(1, 1, C.gold, 6); }
        v.plot((x) => e.fn(N, x), a, b, C.blue, 3, K);
        v.text("f", b, e.f(b), C.gold, -6, -8, "700 13px system-ui", "right"); v.text(`f_N  (N = ${N})`, b, e.fn(N, b), C.blue, -6, 34, "700 13px system-ui", "right");
        // gaps
        if (showGaps) {
          const x = S.x, x0 = S.x0, fx = e.f(x), fnx = e.fn(N, x), fn0 = e.fn(N, x0), f0 = e.f(x0), off = (b - a) * 0.012;
          v.line(x, fnx, x, fx, C.pink, 5);                       // ① at x
          v.line(x0, fn0, x0, f0, C.green, 5);                    // ③ at x0
          v.line(x0, fn0, x + off, fn0, "rgba(255,204,77,.8)", 1.5, [4, 3]);
          v.line(x + off, fn0, x + off, fnx, C.gold, 5);          // ② change of f_N
          v.dot(x, fx, C.gold, 4); v.dot(x, fnx, C.blue, 4); v.dot(x0, f0, C.gold, 4); v.dot(x0, fn0, C.blue, 4);
        }
        // handles
        v.handle(S.x0, yb(), C.gold, "x₀"); v.handle(S.x, yb(), C.white, "x");
        const msgs = {
          0: "Goal: keep f(x) inside the gold band of half-width ε around f(x₀).",
          1: "Tube f ± ε/3 around the limit; blue fₙ for the chosen N lies inside it.",
          2: "Yellow strip = δ-window; in it f_N varies by less than ε/3 (thin blue band).",
          3: "Three gaps at x₀ and x: red ①, yellow ②, green ③ (each should be below ε/3).",
          4: "Move x inside the δ-window: bar ④ stays under ε.",
          5: "Without uniformity (xⁿ): the red gap ① near x = 1 exceeds ε/3 for every N.",
        };
        caption(v, msgs[f] || "Example, limit f, the tube, and the ε/3 gaps.", f >= 0 ? C.gold : C.dim);
      });

      bars.draw((g) => {
        const { g1, g2, g3, tot } = gaps(), e3 = S.eps / 3, top = Math.max(S.eps * 1.15, tot * 1.1, g1 * 1.1, g2 * 1.1, g3 * 1.1, 0.05);
        g.o.y = [0, top]; g.begin(); g.axes();
        const cols = [C.pink, C.gold, C.green, C.white], vals = [g1, g2, g3, tot];
        vals.forEach((val, k) => g.poly([[k + 0.15, 0], [k + 0.85, 0], [k + 0.85, val], [k + 0.15, val]], cols[k] + (k === 3 ? "" : ""), null));
        ["①", "②", "③", "④"].forEach((s, k) => g.text(s, k + 0.5, 0, C.bg, 0, -4, "700 14px system-ui", "center"));
        g.line(0, e3, 3, e3, C.white, 1.5, [5, 4]); g.text("ε/3", 3, e3, C.white, 3, 4, "600 11px system-ui");
        g.line(3, S.eps, 4, S.eps, C.red, 1.5, [5, 4]); g.text("ε", 4, S.eps, C.red, -12, -4, "600 11px system-ui");
        if (S.focus === 3 || S.focus === 4 || S.focus === 5) frame(g);
      });

      st.after = () => {
        const e = E(), d = delta(), G = gaps(), e3 = S.eps / 3, inW = Math.abs(S.x - S.x0) < d, sup = e.sup(S.N), nm = Nmin();
        out([
          ["‖f_N − f‖∞", `${fmt(sup, 3)}  ${okSpan(sup < e3, sup < e3 ? "< ε/3 ✓" : "≥ ε/3 ✗")}`],
          ["smallest good N", nm ? `N = ${nm}` : okSpan(false, "none: no N puts all of f_N in the tube")],
          ["δ (continuity of f_N at x₀)", fmt(d, 3)],
          ["x inside δ-window?", inW ? okSpan(true, "yes") : okSpan(false, "no")],
          ["① ② ③", `${fmt(G.g1, 3)}, ${fmt(G.g2, 3)}, ${fmt(G.g3, 3)}  (sum ${fmt(G.g1 + G.g2 + G.g3, 3)})`],
          ["④ |f(x)−f(x₀)|", `${fmt(G.tot, 3)}  ${okSpan(G.tot < S.eps, G.tot < S.eps ? "< ε ✓" : "≥ ε ✗")}`],
        ], e.uni ? "With a good N, whenever x is in the δ-window the sum ①+②+③ is below ε, so ④ is too." : "For xⁿ no N makes ① small near x = 1: the proof needs uniform convergence.");
      };

      ML.drag(st, () => [{ x: S.x0, y: yb() }, { x: S.x, y: yb() }], (i, x) => {
        const e = E(), cx = ML.clamp(x, e.I[0], e.I[1]);
        if (i === 0) S.x0 = cx; else S.x = cx;
      }, { snap: 0.01, r: 26 });

      return {
        showStep(i) {
          S.focus = i;
          if (i === 5) { setExample("B"); S.N = 10; nS.set(10); }
          else if (S.ex === "B") setExample("A");
          st.redraw();
        },
      };
    },

    idea: String.raw`Split \(|f(x)-f(x_0)|\) into three pieces: \(f\) vs \(f_N\) at \(x\) (small, by uniform convergence), \(f_N\) at \(x\) vs \(x_0\) (small, by continuity of the single function \(f_N\)), and \(f_N\) vs \(f\) at \(x_0\) (small, uniform again). Each piece \(\lt\varepsilon/3\).`,
    steps: [
      { fig: String.raw`The gold handle \(x_0\) and the gold band of half-width \(\varepsilon\) around \(f(x_0)\): the target is to keep \(f(x)\) inside this band for all \(x\) near \(x_0\).`, t: String.raw`Set up: fix \(x_0\in I\) and \(\varepsilon\gt0\).`, d: String.raw`We must find \(\delta\gt0\) such that \(x\in I,\ |x-x_0|\lt\delta\ \Rightarrow\ |f(x)-f(x_0)|\lt\varepsilon\).` },
      { fig: String.raw`The shaded tube \(f\pm\varepsilon/3\) around the limit and the graph of \(f_N\) (blue). Move the \(N\) slider: from some \(N\) on, the <b>whole</b> graph of \(f_N\) is inside the tube. The readout shows \(\|f_N-f\|_\infty\) against \(\varepsilon/3\).`, t: String.raw`Use uniform convergence with \(\varepsilon/3\).`, d: String.raw`Since \(f_n\to f\) uniformly there is \(N\) such that \(\forall x\in I:\ |f_N(x)-f(x)|\lt\varepsilon/3\). (Uniformity: this single \(N\) works at every point, in particular at both \(x\) and \(x_0\).)` },
      { fig: String.raw`The yellow vertical strip is the \(\delta\)-window around \(x_0\). Inside it the graph of \(f_N\) stays within the thin dashed blue band \(f_N(x_0)\pm\varepsilon/3\).`, t: String.raw`Use continuity of the single function \(f_N\) at \(x_0\).`, d: String.raw`\(f_N\) is continuous, so there is \(\delta\gt0\) with \(|x-x_0|\lt\delta\Rightarrow|f_N(x)-f_N(x_0)|\lt\varepsilon/3\).` },
      { fig: String.raw`The three gaps at the white handle \(x\): red ① \(|f(x)-f_N(x)|\) (vertical at \(x\)), yellow ② \(|f_N(x)-f_N(x_0)|\) (the change of \(f_N\) between \(x_0\) and \(x\)), green ③ \(|f_N(x_0)-f(x_0)|\) (vertical at \(x_0\)). The first three bars show them next to the \(\varepsilon/3\) line.`, t: String.raw`Triangle inequality.`, d: String.raw`For \(|x-x_0|\lt\delta\): \(|f(x)-f(x_0)|\le|f(x)-f_N(x)|+|f_N(x)-f_N(x_0)|+|f_N(x_0)-f(x_0)|\).` },
      { fig: String.raw`Drag \(x\) through the \(\delta\)-window: the fourth bar \(|f(x)-f(x_0)|\) always stays below \(\varepsilon\) (red line), because it is at most the sum of the three small bars.`, t: String.raw`Conclusion.`, d: String.raw`The three terms are \(\lt\varepsilon/3\) by steps 2, 3 and 2 again, so \(|f(x)-f(x_0)|\lt\varepsilon\). Since \(x_0\in I\) and \(\varepsilon\gt0\) were arbitrary, \(f\) is continuous on \(I\). \(\blacksquare\)` },
      { fig: String.raw`Example \(x^n\) on \([0,1]\) (selected automatically): near \(x=1\) the red gap ① \(|f(x)-f_N(x)|\) is about \(1\), far above \(\varepsilon/3\), for every \(N\). The tube \(f\pm\varepsilon/3\) cannot contain \(f_N\), the argument breaks, and indeed the limit \(f\) jumps.`, t: String.raw`Where uniformity was used, and what fails without it.`, d: String.raw`Terms ① and ③ need <b>one</b> \(N\) good at all points simultaneously. For \(f_n=x^n\) on \([0,1]\) the convergence is only pointwise: for every \(N\) there are points \(x\lt1\) near \(1\) with \(f(x)-f_N(x)\) about \(-1\), and the limit \(f\) is discontinuous at \(1\).` },
    ],
    memorize: {
      formula: String.raw`|f(x)-f(x_0)|\le\underbrace{|f(x)-f_N(x)|}_{\lt\varepsilon/3}+\underbrace{|f_N(x)-f_N(x_0)|}_{\lt\varepsilon/3}+\underbrace{|f_N(x_0)-f(x_0)|}_{\lt\varepsilon/3}`,
      bullets: [
        String.raw`Order of choices: \(\varepsilon\) \(\to\) \(N\) (uniform convergence) \(\to\) \(\delta\) (continuity of \(f_N\) at \(x_0\)). Note that \(\delta\) depends on \(N\), \(x_0\), \(\varepsilon\).`,
        String.raw`Same proof: uniform limit of <i>uniformly continuous</i> functions is uniformly continuous; and for series: a uniformly convergent series of continuous functions has a continuous sum.`,
        String.raw`Contrapositive use: if the limit is discontinuous, the convergence is not uniform.`,
      ],
      pitfalls: [
        String.raw`Pointwise convergence is not enough: \(x^n\to f\) with \(f\) discontinuous.`,
        String.raw`The converse is false: \(f_n\to f\) with \(f\) continuous does not imply uniform convergence (e.g. \(f_n(x)=nxe^{-nx}\to0\) on \([0,\infty)\) has sup \(1/e\)).`,
        String.raw`Do not choose \(\delta\) before \(N\): \(\delta\) is the continuity modulus of \(f_N\), which exists only once \(N\) is fixed.`,
      ],
    },
  });

  /* ================================================================== */
  /* 3) Weierstrass M-test                                                */
  /* ================================================================== */
  ML.register({
    id: "weierstrass-m-test",
    course: "infi2",
    topic: "funcseries",
    title: "Weierstrass M-test",
    blurb: "If |fₙ| ≤ Mₙ with ΣMₙ convergent, then Σfₙ converges uniformly (and absolutely).",
    statement: String.raw`Let \(f_n:E\to\mathbb R\) and suppose there are constants \(M_n\ge0\) with \(|f_n(x)|\le M_n\) for all \(x\in E\) and all \(n\), and \(\sum_{n}M_n\lt\infty\). Then \(\sum_nf_n\) converges <b>absolutely</b> and <b>uniformly</b> on \(E\). Moreover \(\sup_{x\in E}|S(x)-S_N(x)|\le\sum_{n\gt N}M_n\), where \(S_N=\sum_{n\le N}f_n\).`,
    shows: String.raw`The statement on the example \(\sum\sin(nx)/n^2\) over \([-\pi,\pi]\): partial sums \(S_N\) (blue) inside the green tube \(S\pm\sum_{n\gt N}M_n\) around the sum \(S\) (gold); the small graph compares the terms \(|f_n(x)|\) with \(M_n\). The second example \(\sum\sin(nx)/n\), where no summable \(M_n\) exists, shows what goes wrong.`,
    vizIntro: String.raw`<b>Slide \(N\)</b> or press Play: the tube shrinks to the graph of the sum \(S\), and every partial sum stays inside it. <b>Drag the white handle \(x\)</b> to see that the terms \(|f_n(x)|\) at that point sit under the curve \(M_n\). Then switch to \(\sum\sin(nx)/n\).`,

    viz(box) {
      const NG = 721, NMAX = 60, PI = Math.PI;
      const XS = Array.from({ length: NG }, (_, i) => -PI + 2 * PI * i / (NG - 1));
      const cache = {};
      function tables(kind) {
        if (cache[kind]) return cache[kind];
        const pw = kind === "A" ? 2 : 1, tabs = [new Float64Array(NG)];
        for (let n = 1; n <= NMAX; n++) {
          const prev = tabs[n - 1], cur = new Float64Array(NG), inv = 1 / Math.pow(n, pw);
          for (let i = 0; i < NG; i++) cur[i] = prev[i] + Math.sin(n * XS[i]) * inv;
          tabs.push(cur);
        }
        let ref;
        if (kind === "A") {
          ref = new Float64Array(NG);
          for (let n = 1; n <= 400; n++) { const inv = 1 / (n * n); for (let i = 0; i < NG; i++) ref[i] += Math.sin(n * XS[i]) * inv; }
        } else ref = Float64Array.from(XS, (x) => (Math.abs(x) < 1e-9 ? 0 : x > 0 ? (PI - x) / 2 : (-PI - x) / 2));
        const supErr = [], tail = [], peak = [];
        let cum = 0;
        for (let N = 0; N <= NMAX; N++) {
          if (N > 0 && kind === "A") cum += 1 / (N * N);
          let m = 0; for (let i = 0; i < NG; i++) m = Math.max(m, Math.abs(ref[i] - tabs[N][i]));
          supErr.push(m); tail.push(kind === "A" ? PI * PI / 6 - cum : Infinity);
          let pv = -Infinity, px = 0; for (let i = NG / 2 | 0; i < NG; i++) if (tabs[N][i] > pv) { pv = tabs[N][i]; px = XS[i]; }
          peak.push([px, pv]);
        }
        return (cache[kind] = { tabs, ref, supErr, tail, peak, pw });
      }

      const S = { ex: "A", N: 8, eps: 0.1, x: 1.2, focus: -1 };
      const Yr = { A: [-2.1, 2.1], B: [-2.3, 2.3] };
      const st = ML.stage(box, { x: [-PI - 0.25, PI + 0.25], y: Yr.A, equal: false, aspect: "4 / 3" });
      const yb = () => st.view.o.y[0] + 0.08 * (st.view.o.y[1] - st.view.o.y[0]);

      const sel = ML.select(st.panel, {
        label: "Series", options: [["A", "Σ sin(nx)/n²    (M-test applies: Mₙ = 1/n²)"], ["B", "Σ sin(nx)/n    (no summable Mₙ)"]],
        onChange: (k) => { setEx(k); st.redraw(); },
      });
      const nS = ML.slider(st.panel, { label: "N (partial sum S_N)", min: 1, max: NMAX, step: 1, value: S.N, fmt: (v) => String(v), onInput: (v) => { S.N = v; st.redraw(); } });
      let acc = S.N, playBtn;
      const anim = ML.loop(st, (dt) => {
        acc += dt * 6; S.N = Math.min(NMAX, Math.floor(acc)); nS.set(S.N);
        if (S.N >= NMAX) { playBtn.textContent = "▶ Play N"; return false; }
        return true;
      });
      playBtn = ML.button(st.panel, "▶ Play N", () => {
        if (anim.running) { anim.stop(); playBtn.textContent = "▶ Play N"; return; }
        if (S.N >= NMAX) S.N = 1;
        acc = S.N; nS.set(S.N); playBtn.textContent = "⏸ Pause"; anim.start();
      });
      const eS = ML.slider(st.panel, { label: "ε", min: 0.05, max: 1, step: 0.01, value: S.eps, onInput: (v) => { S.eps = v; st.redraw(); } });
      const terms = st.extra({ x: [0, 31], y: [0, 1.1], height: 140 });
      const out = ML.readout(st.panel);

      function setEx(k) {
        S.ex = k; sel.value = k; st.view.o.y = Yr[k];
        if (k === "B") { S.eps = 0.4; eS.set(0.4); } else { S.eps = 0.1; eS.set(0.1); }
      }
      const idx = (x) => ML.clamp(Math.round((x + PI) / (2 * PI) * (NG - 1)), 0, NG - 1);
      const nearest = (N, x) => tables(S.ex).tabs[N][idx(x)];
      const fOf = (k, n, x) => Math.sin(n * x) / Math.pow(n, k === "A" ? 2 : 1);

      st.draw((v) => {
        const T = tables(S.ex), f = S.focus, N = S.N, A = S.ex === "A", tn = T.tail[N];
        const [ya, yb2] = v.o.y;
        v.grid(0.5 * PI); v.axes();
        ["−π", "0", "π"].forEach((s, k) => v.text(s, (k - 1) * PI, 0, C.dim, 0, 14, "11px system-ui", "center"));
        const pts = (arr) => XS.map((x, i) => [x, arr[i]]);
        if (A) {
          if (f === -1 || f === 2 || f === 3) {
            const hi = XS.map((x, i) => [x, T.ref[i] + tn]), lo = XS.map((x, i) => [x, T.ref[i] - tn]).reverse();
            v.poly(hi.concat(lo), "rgba(79,209,165,.16)");
            v.path((x) => [x, T.ref[idx(x)] + tn], -PI, PI, C.green, 1.3, 240, [5, 4]); v.path((x) => [x, T.ref[idx(x)] - tn], -PI, PI, C.green, 1.3, 240, [5, 4]);
            v.text("S ± Σ_{n>N} Mₙ", PI * 0.2, T.ref[idx(PI * 0.2)] + tn, C.green, 6, -8, "600 12px system-ui");
          }
          v.path((x) => [x, T.ref[idx(x)]], -PI, PI, C.gold, 2.5, 360);
          v.text("sum S", -PI + 0.1, T.ref[idx(-PI + 0.1)], C.gold, 0, -8, "700 13px system-ui");
        } else {
          const e = S.eps, piece = (a, b) => {
            const up = [], lo = [];
            for (let k = 0; k <= 40; k++) { const x = a + (b - a) * k / 40; const y = x > 0 ? (PI - x) / 2 : (-PI - x) / 2; up.push([x, y + e]); lo.push([x, y - e]); }
            v.poly(up.concat(lo.reverse()), "rgba(79,209,165,.14)");
            v.path((x) => [x, (x > 0 ? (PI - x) / 2 : (-PI - x) / 2) + e], a, b, C.green, 1.2, 40, [5, 4]);
            v.path((x) => [x, (x > 0 ? (PI - x) / 2 : (-PI - x) / 2) - e], a, b, C.green, 1.2, 40, [5, 4]);
            v.path((x) => [x, x > 0 ? (PI - x) / 2 : (-PI - x) / 2], a, b, C.gold, 2.5, 40);
          };
          piece(-PI, -1e-4); piece(1e-4, PI);
          v.dot(0, PI / 2, C.bg, 5, C.gold); v.dot(0, -PI / 2, C.bg, 5, C.gold); v.dot(0, 0, C.gold, 5);
          v.text("limit S jumps at 0", 0.12, PI / 2, C.gold, 6, -8, "700 12px system-ui");
          v.text("S ± ε", -PI + 0.1, -PI / 2 + 0.05, C.green, 0, -8, "600 12px system-ui");
        }
        // S_{2N} and the gap (Cauchy criterion, step 2)
        if (f === 1 && A) {
          const N2 = Math.min(NMAX, 2 * N);
          v.path((x) => [x, T.tabs[N2][idx(x)]], -PI, PI, C.orange, 2.5, 360, [6, 4]);
          const a = nearest(N, S.x), b = nearest(N2, S.x);
          v.line(S.x, a, S.x, b, C.red, 7);
          v.text(`S_${N2}`, PI - 0.1, T.tabs[N2][idx(PI - 0.1)], C.orange, 0, -8, "700 12px system-ui", "right");
        }
        v.path((x) => [x, T.tabs[N][idx(x)]], -PI, PI, C.blue, 3, 480);
        v.text(`S_${N}`, 0.7 * PI, T.tabs[N][idx(0.7 * PI)], C.blue, 0, 18, "700 13px system-ui", "center");
        if (!A) { // Gibbs peak
          const [px, pv] = T.peak[N];
          v.line(-PI, PI / 2, PI, PI / 2, "rgba(255,204,77,.5)", 1, [4, 4]);
          v.dot(px, pv, C.red, 6); v.text(`peak ${fmt(pv, 2)}`, px, pv, C.red, 10, -6, "700 12px system-ui");
          v.text("π/2", PI, PI / 2, C.gold, -4, -5, "600 11px system-ui", "right");
        }
        if (f === 0) v.line(S.x, ya, S.x, yb2, "rgba(255,255,255,.4)", 1.2, [5, 4]);
        v.handle(S.x, yb(), C.white, "x");
        const msgs = A
          ? { 0: "The dashed line marks x; below, the terms |fₙ(x)| sit under Mₙ.", 1: "Blue S_N and orange S_2N: their gap at x (red) is at most Σ_{N<n≤2N} Mₙ.", 2: "S_N lies inside the tube S ± tail, for every x at once.", 3: "As N grows the tube shrinks to the graph of S (press Play)." }
          : { 4: "No summable Mₙ: Σ sin(nx)/n converges pointwise, but…", 5: "S_N is continuous, S jumps at 0: the peak never drops below the green tube." };
        caption(v, msgs[f] || (A ? "Partial sums S_N, sum S, and the tube S ± Σ_{n>N} Mₙ." : "Partial sums S_N of Σ sin(nx)/n and the limit S ± ε."), f >= 0 ? C.gold : C.dim);
      });

      terms.draw((g) => {
        const k = S.ex, T = tables(k);
        g.axes(); g.grid(5);
        for (let n = 1; n <= 30; n++) {
          const h = Math.abs(fOf(k, n, S.x));
          g.poly([[n - 0.35, 0], [n + 0.35, 0], [n + 0.35, h], [n - 0.35, h]], C.white);
        }
        g.path((t) => [t, 1 / Math.pow(t, T.pw)], 1, 30, C.gold, 2.2, 120);
        g.text(k === "A" ? "Mₙ = 1/n²" : "Mₙ = 1/n  (ΣMₙ = ∞)", 30.5, 1.0, C.gold, 0, 4, "600 11px system-ui", "right");
        g.text(`bars: |fₙ(x)| at x = ${fmt(S.x)},  n = 1…30`, 30.5, 0.78, C.text, 0, 0, "600 11px system-ui", "right");
        if (S.focus === 0) frame(g);
      });

      st.after = () => {
        const T = tables(S.ex), N = S.N, A = S.ex === "A", sup = T.supErr[N], tn = T.tail[N];
        let Neps = null; if (A) for (let n = 1; n <= NMAX; n++) if (T.tail[n] < S.eps) { Neps = n; break; }
        out(A ? [
          ["N", String(N)],
          ["tail bound Σ_{n>N} 1/n²", fmt(tn, 4)],
          ["actual sup |S − S_N|", `${fmt(sup, 4)}  ${okSpan(sup <= tn + 1e-9, "≤ bound ✓")}`],
          ["N with tail < ε", Neps ? `N = ${Neps}  (works for all x)` : "> 60"],
        ] : [
          ["N", String(N)],
          ["Σ Mₙ", okSpan(false, "Σ 1/n = ∞: M-test does not apply")],
          ["sup |S − S_N| (x ≠ 0)", `${fmt(sup, 3)}  ${okSpan(false, "≥ π/2 ≈ 1.571 for every N")}`],
          ["peak of S_N near 0", `${fmt(T.peak[N][1], 3)}  (→ 1.852 as N → ∞; above π/2 from N = 5 on)`],
        ], A ? "The tail bound does not depend on x, and tends to 0: uniform convergence." : "S_N(0) = 0 for all N but S(0+) = π/2: the sup error cannot shrink.");
      };
      ML.drag(st, () => [{ x: S.x, y: yb() }], (i, x) => { S.x = ML.clamp(x, -PI, PI); }, { snap: 0.02, r: 26 });

      return {
        showStep(i) {
          S.focus = i;
          if (i === 4 || i === 5) { setEx("B"); S.N = 30; nS.set(30); }
          else if (S.ex === "B") { setEx("A"); }
          if (i === 3) { S.N = 1; acc = 1; nS.set(1); playBtn.textContent = "⏸ Pause"; anim.start(); }
          else if (anim.running) { anim.stop(); playBtn.textContent = "▶ Play N"; }
          if (i === 1) { S.N = 3; nS.set(3); }
          st.redraw();
        },
      };
    },

    idea: String.raw`The tail \(\sum_{n\gt N}M_n\) bounds the distance between the partial sums and the sum <b>at every point at once</b>, and it tends to 0 because \(\sum M_n\) converges.`,
    steps: [
      { fig: String.raw`Drag the white handle \(x\): the bars below the main graph are \(|f_n(x)|\) for \(n=1,\dots,30\), and the gold curve is \(M_n=1/n^2\). Every bar sits under its \(M_n\), so \(\sum|f_n(x)|\) is dominated by \(\sum M_n\).`, t: String.raw`Absolute convergence at each point.`, d: String.raw`For fixed \(x\in E\): \(\sum|f_n(x)|\le\sum M_n\lt\infty\) by the comparison test. So \(S(x)=\sum f_n(x)\) exists, and the series converges absolutely.` },
      { fig: String.raw`The partial sums \(S_N\) (blue) and \(S_{2N}\) (orange dashed). The red segment at \(x\) is \(|S_{2N}(x)-S_N(x)|\); it is at most \(\sum_{N\lt n\le2N}M_n\), a number that does not depend on \(x\).`, t: String.raw`Estimate the increments uniformly (Cauchy criterion).`, d: String.raw`For \(m\gt N\) and every \(x\in E\): \(|S_m(x)-S_N(x)|=\big|\sum_{n=N+1}^mf_n(x)\big|\le\sum_{n=N+1}^mM_n\le\sum_{n\gt N}M_n=:T_N\). The right side is independent of \(x\).` },
      { fig: String.raw`The green tube \(S\pm T_N\) around the sum \(S\) (gold). The blue graph of \(S_N\) lies inside it at every \(x\) simultaneously.`, t: String.raw`Let \(m\to\infty\) with \(x\) fixed.`, d: String.raw`\(S_m(x)\to S(x)\), so \(|S(x)-S_N(x)|\le T_N\) for all \(x\in E\). That is \(\sup_E|S-S_N|\le T_N\).` },
      { fig: String.raw`Press Play (started automatically): as \(N\) increases the tube \(S\pm T_N\) narrows onto the graph of \(S\); once \(T_N\lt\varepsilon\) (readout) the whole partial sum is inside any given \(\varepsilon\)-tube.`, t: String.raw`The tail tends to 0.`, d: String.raw`\(T_N\) is the tail of a convergent series, hence \(T_N\to0\). Given \(\varepsilon\gt0\) choose \(N_0\) with \(T_{N_0}\lt\varepsilon\); for \(N\ge N_0\) and all \(x\in E\): \(|S(x)-S_N(x)|\le T_N\lt\varepsilon\). Hence \(S_N\to S\) uniformly on \(E\). \(\blacksquare\)` },
      { fig: String.raw`The second series \(\sum\sin(nx)/n\) (selected automatically): the terms satisfy \(|f_n|\le1/n\) but \(\sum1/n=\infty\), so no summable \(M_n\) works. The bars in the small graph are under \(1/n\), whose sum is infinite.`, t: String.raw`Why summability of \(M_n\) is needed.`, d: String.raw`\(\sum\sin(nx)/n\) converges pointwise on \(\mathbb R\) (Dirichlet test), to \((\pi-x)/2\) on \((0,2\pi)\). The best bound \(\sup_x|f_n(x)|=1/n\) is not summable, so the M-test says nothing.` },
      { fig: String.raw`Each partial sum \(S_N\) is continuous and \(S_N(0)=0\), but the limit \(S\) jumps from \(-\pi/2\) to \(\pi/2\) at \(0\): the graph of \(S_N\) leaves the green \(\varepsilon\)-tube near \(0\) for every \(N\), and the red peak rises toward \(\approx1.85\gt\pi/2\) and never shrinks back (Gibbs phenomenon).`, t: String.raw`And it really fails to be uniform.`, d: String.raw`If \(\sum\sin(nx)/n\) converged uniformly, the sum would be continuous (previous proof). It is not: \(S\) jumps at \(0\). Concretely \(\sup_{x\ne0}|S(x)-S_N(x)|\ge\pi/2\) for every \(N\): let \(x\to0^+\) where \(S_N(x)\to0\) but \(S(x)\to\pi/2\).` },
    ],
    memorize: {
      formula: String.raw`|f_n(x)|\le M_n\ \ \forall x\in E,\ \ \sum M_n\lt\infty\ \Longrightarrow\ \sup_E\Big|\sum_{n}f_n-\sum_{n\le N}f_n\Big|\le\sum_{n\gt N}M_n\to0`,
      bullets: [
        String.raw`\(M_n\) must be <b>independent of \(x\)</b>: take \(M_n=\sup_E|f_n|\) (the best choice) and check \(\sum M_n\lt\infty\).`,
        String.raw`It gives uniform <i>and</i> absolute convergence, so by the previous theorem the sum of continuous \(f_n\) is continuous.`,
        String.raw`Only a sufficient condition: \(\sum(-1)^nx^n/n\) converges uniformly on \([0,1]\) (Leibniz bound \(1/(N+1)\)) although \(\sup|f_n|=1/n\) is not summable.`,
      ],
      pitfalls: [
        String.raw`\(\sum M_n\) must <b>converge</b>; \(M_n\to0\) is not enough (\(M_n=1/n\) fails: \(\sum\sin(nx)/n\) is not uniformly convergent on \([0,2\pi]\)).`,
        String.raw`Computing \(\sup_E|f_n|\) over the wrong set: the same series can satisfy the M-test on \([-\rho,\rho]\) and fail on a bigger set.`,
        String.raw`If the M-test fails you cannot conclude non-uniformity; show it with the definition or via a discontinuous limit.`,
      ],
    },
  });

  /* ================================================================== */
  /* 4) Abel's lemma and the radius of convergence                        */
  /* ================================================================== */
  ML.register({
    id: "power-series-radius",
    course: "infi2",
    topic: "funcseries",
    title: "Radius of convergence of a power series (Abel's lemma)",
    blurb: "Convergence at x₀ gives absolute convergence for |x| < |x₀|; hence an interval (−R, R).",
    statement: String.raw`For a power series \(\sum_{n\ge0}a_nx^n\) let \(R=\dfrac{1}{\limsup_{n}\sqrt[n]{|a_n|}}\in[0,\infty]\). Then the series converges absolutely for \(|x|\lt R\), diverges for \(|x|\gt R\), and converges uniformly on \([-\rho,\rho]\) for every \(0\le\rho\lt R\). (Abel's lemma: if \(\sum a_nx_0^n\) converges, it converges absolutely for all \(|x|\lt|x_0|\).)`,
    shows: String.raw`The statement for five series: partial sums \(S_N(x)\) (blue) over the \(x\)-axis, the convergence zone \((-R,R)\) in green and the divergence zone in red, the number line with the endpoints \(\pm R\), and a small graph of the terms \(|a_nx^n|\) (log scale) under the geometric majorant \(Mq^n\) of Abel's lemma.`,
    vizIntro: String.raw`<b>Pick a series</b>, then move <b>x</b> (the point we test) and <b>x₀</b> (a point where the series converges). Inside the green zone the partial sums settle; outside they run away. The small graph shows why: the terms at \(x\) are squeezed under a geometric sequence built from \(x_0\).`,

    viz(box) {
      const lnF = [0]; for (let n = 1; n <= 400; n++) lnF.push(lnF[n - 1] + Math.log(n));
      const NEG = -Infinity;
      const SER = {
        geo: { name: "Σ xⁿ", la: () => 0, R: 1, ends: { m: [false, "diverges (terms do not tend to 0)"], p: [false, "diverges (terms do not tend to 0)"] }, S: (x) => (Math.abs(x) < 1 ? 1 / (1 - x) : null), lab: "1/(1−x)" },
        log: { name: "Σ xⁿ/n", la: (n) => (n === 0 ? NEG : -Math.log(n)), R: 1, ends: { m: [true, "converges (conditionally, alternating harmonic)"], p: [false, "diverges (harmonic series)"] }, S: (x) => (x > -1 && x < 1 ? -Math.log(1 - x) : null), lab: "−ln(1−x)" },
        sq: { name: "Σ xⁿ/n²", la: (n) => (n === 0 ? NEG : -2 * Math.log(n)), R: 1, ends: { m: [true, "converges absolutely"], p: [true, "converges absolutely"] }, S: null, lab: "numeric sum" },
        exp: { name: "Σ xⁿ/n!", la: (n) => -lnF[n], R: Infinity, ends: null, S: (x) => Math.exp(x), lab: "eˣ" },
        fact: { name: "Σ n!·xⁿ", la: (n) => lnF[n], R: 0, ends: null, S: null, lab: "" },
      };
      const defaults = { geo: [0.9, 0.5], log: [0.9, 0.5], sq: [1, 0.5], exp: [1.5, 0.9], fact: [0.3, 0.1] };
      const S = { k: "geo", N: 20, x: 0.5, x0: 0.9, focus: -1 };
      const R = () => SER[S.k].R;
      const st = ML.stage(box, { x: [-2.4, 2.4], y: [-5, 9], equal: false, aspect: "4 / 3" });
      const YB = -4.3; // handle baseline

      const term = (k, n, x) => {
        const la = SER[k].la(n);
        if (la === NEG) return 0;
        if (x === 0) return n === 0 ? Math.exp(la) : 0;
        return (x < 0 && n % 2 ? -1 : 1) * Math.exp(la + n * Math.log(Math.abs(x)));
      };
      const partial = (k, N, x) => { let s = 0; for (let n = 0; n <= N; n++) s += term(k, n, x); return s; };
      const clampY = (y) => (Number.isFinite(y) ? ML.clamp(y, -30, 30) : y > 0 ? 30 : -30);
      const sref = (k, x) => {
        const s = SER[k];
        if (s.S) return s.S(x);
        if (k === "sq" && Math.abs(x) <= 1) return partial("sq", 400, x);
        return null;
      };
      const convergesAt = (x) => {
        const r = R(), a = Math.abs(x);
        if (a < r - 1e-9) return true;
        if (Math.abs(a - r) < 1e-9 && SER[S.k].ends) return SER[S.k].ends[x < 0 ? "m" : "p"][0];
        return r === 0 && a === 0;
      };
      const logM = (x0) => { let m = NEG; for (let n = 0; n <= 200; n++) { const la = SER[S.k].la(n); if (la === NEG) continue; m = Math.max(m, la + n * Math.log(x0)); } return m; };

      const sel = ML.select(st.panel, { label: "Series", options: Object.entries(SER).map(([k, s]) => [k, s.name]), onChange: (k) => { setK(k); st.redraw(); } });
      const nS = ML.slider(st.panel, { label: "N (partial sum S_N)", min: 1, max: 60, step: 1, value: S.N, fmt: (v) => String(v), onInput: (v) => { S.N = v; st.redraw(); } });
      const xS = ML.slider(st.panel, { label: "x (the point we test)", min: -2.2, max: 2.2, step: 0.01, value: S.x, onInput: (v) => { S.x = v; st.redraw(); } });
      const x0S = ML.slider(st.panel, { label: "x₀ (Abel's point, also ρ)", min: 0.05, max: 2.2, step: 0.01, value: S.x0, onInput: (v) => { S.x0 = v; st.redraw(); } });
      const g = st.extra({ x: [0, 40], y: [-12, 3], height: 150 });
      const out = ML.readout(st.panel);

      function setK(k) {
        S.k = k; sel.value = k; [S.x0, S.x] = defaults[k]; xS.set(S.x); x0S.set(S.x0);
      }

      st.draw((v) => {
        const f = S.focus, r = R(), k = S.k, N = S.N, [ya, yb] = v.o.y, xa = -2.4, xb = 2.4;
        // zones: convergence (green) and divergence (red)
        const lo = Math.max(xa, -r), hi = Math.min(xb, r);
        if (r === 0) v.poly([[xa, ya], [xb, ya], [xb, yb], [xa, yb]], "rgba(255,90,122,.07)");
        else {
          if (hi > lo) v.poly([[lo, ya], [hi, ya], [hi, yb], [lo, yb]], "rgba(79,209,165,.10)");
          if (lo > xa) v.poly([[xa, ya], [lo, ya], [lo, yb], [xa, yb]], "rgba(255,90,122,.07)");
          if (hi < xb) v.poly([[hi, ya], [xb, ya], [xb, yb], [hi, yb]], "rgba(255,90,122,.07)");
        }
        v.grid(1); v.axes();
        for (let t = -2; t <= 2; t++) if (t) v.text(String(t), t, 0, C.dim, 0, 13, "11px system-ui", "center");
        if (r > 0 && r < 2.4) { v.line(-r, ya, -r, yb, C.green, 1.5, [6, 4]); v.line(r, ya, r, yb, C.green, 1.5, [6, 4]); v.text("−R", -r, -2.4, C.green, -6, 0, "700 12px system-ui", "right"); v.text("R", r, -2.4, C.green, 6, 0, "700 12px system-ui"); }
        // tube for uniform convergence on [−ρ, ρ] (step 5)
        const rho = S.x0;
        if (f === 4 && rho < r) {
          let T = 0; for (let n = N + 1; n <= 400; n++) { const la = SER[k].la(n); if (la !== NEG) T += Math.exp(la + n * Math.log(rho)); }
          const xs = Array.from({ length: 81 }, (_, i) => -rho + 2 * rho * i / 80), ok = xs.every((x) => sref(k, x) != null);
          v.poly([[-rho, ya], [rho, ya], [rho, yb], [-rho, yb]], "rgba(255,204,77,.08)");
          v.line(-rho, ya, -rho, yb, C.gold, 1.5, [4, 4]); v.line(rho, ya, rho, yb, C.gold, 1.5, [4, 4]); v.text("ρ", rho, yb, C.gold, 4, 28, "700 12px system-ui");
          if (ok) {
            v.poly(xs.map((x) => [x, sref(k, x) + T]).concat(xs.map((x) => [x, sref(k, x) - T]).reverse()), "rgba(255,204,77,.22)");
            v.text(`tube S ± T_N, T_N = ${fmt(T, 3)}`, 0, yb, C.gold, 0, 44, "600 12px system-ui", "center");
          }
        }
        // limit function
        const lim = (x) => sref(k, x);
        if (SER[k].lab && r > 0) {
          v.path((x) => (Math.abs(x) < r ? [x, clampY(lim(x))] : null), Math.max(xa, -Math.min(r, 3)), Math.min(xb, Math.min(r, 3)), C.gold, 2, 400);
          v.text(`sum = ${SER[k].lab}`, -2.3, 7.8, C.gold, 0, 0, "700 12px system-ui");
        }
        // partial sums
        const Nh = Math.max(1, Math.ceil(N / 2));
        v.path((x) => [x, clampY(partial(k, Nh, x))], xa, xb, "rgba(108,140,255,.4)", 1.5, 480, [4, 4]);
        v.path((x) => [x, clampY(partial(k, N, x))], xa, xb, C.blue, 3, 480);
        v.text(`S_${N}`, 2.35, clampY(partial(k, N, 2.35)), C.blue, 0, -6, "700 12px system-ui", "right");
        // number line at the bottom
        const ny = -3.4, xl = Math.max(xa, -r), xr = Math.min(xb, r);
        v.line(xa, ny, xb, ny, C.axis, 2);
        if (r === 0) v.dot(0, ny, C.green, 6);
        else { v.line(xl, ny, xr, ny, C.green, 7); }
        if (r > 0 && r < 2.4 && SER[k].ends) {
          [[-r, "m"], [r, "p"]].forEach(([e, key]) => { const [good] = SER[k].ends[key]; v.dot(e, ny, good ? C.green : C.bg, 7, good ? C.white : C.red); });
        }
        v.text("convergence", 0, ny, C.green, 0, 20, "600 11px system-ui", "center");
        // markers
        v.dot(S.x0, ny, C.gold, 5); v.dot(-S.x0, ny, C.gold, 5);
        v.handle(S.x, YB, C.white, "x");
        v.line(S.x, -3.5, S.x, YB, "rgba(255,255,255,.35)", 1);
        const msgs = {
          0: "Gold dots on the number line: x₀ and −x₀ (series convergent there).",
          1: "Terms at x are squeezed under the geometric sequence made from x₀.",
          2: "Green: |x| < R (partial sums settle). Red: |x| > R (they run away).",
          3: "R is read off from the root numbers ⁿ√|aₙ| (small graph).",
          4: "On |x| ≤ ρ (yellow strip) the partial sums stay inside the tube S ± T_N.",
          5: "Endpoints ±R: filled dot = converges, open red dot = diverges.",
        };
        caption(v, msgs[f] || `Partial sums S_N(x) = Σ_{n≤N} aₙxⁿ for ${SER[k].name}.`, f >= 0 ? C.gold : C.dim);
      });

      g.draw((gv) => {
        const f = S.focus, k = S.k, r = R(), x0 = S.x0, x = S.x;
        if (f === 3) {
          gv.o.y = [0, 3]; gv.begin(); gv.axes(); gv.grid(10);
          for (let n = 1; n <= 40; n++) { const rt = Math.exp(SER[k].la(n) / n); if (SER[k].la(n) !== NEG) gv.dot(n, Math.min(rt, 2.95), C.cyan, 3.5); }
          if (r > 0 && r < 3) gv.line(0, 1 / r, 40, 1 / r, C.gold, 2, [6, 4]);
          gv.text(r === Infinity ? "limsup = 0 → R = ∞" : r === 0 ? "ⁿ√|aₙ| → ∞ → R = 0" : `limsup = 1/R = ${fmt(1 / r)}`, 39, Math.min(2.4, r > 0 && r < 3 ? 1 / r + 0.3 : 1.2), C.gold, 0, 0, "700 11px system-ui", "right");
          gv.text("dots: ⁿ√|aₙ|", 1, 2.6, C.cyan, 0, 0, "600 11px system-ui");
          frame(gv); return;
        }
        gv.o.y = [-12, 3]; gv.begin(); gv.axes(); gv.grid(10);
        const pt = f === 0 || f === 4 ? x0 : f === 5 && Number.isFinite(r) && r > 0 ? r : x;
        const ax = Math.abs(pt);
        for (let n = 0; n <= 40; n++) {
          const la = SER[k].la(n); if (la === NEG || ax === 0) continue;
          const y = (la + n * Math.log(ax)) / Math.LN10;
          if (y > -12) gv.dot(n, Math.min(y, 2.9), f === 5 ? C.orange : C.white, 3.5);
        }
        gv.text(`dots: log₁₀|aₙ xⁿ| at |x| = ${fmt(ax)}`, 1, 2.2, C.text, 0, 0, "600 11px system-ui");
        const conv0 = convergesAt(x0);
        if ((f === 0 || f === 1 || f === -1) && x0 > 0) {
          if (conv0 && Math.abs(x) < x0) {
            const lm = logM(x0) / Math.LN10, q = Math.abs(x) / x0;
            if (f === 0) { gv.line(0, lm, 40, lm, C.gold, 2, [6, 4]); gv.text("log₁₀ M", 40, lm, C.gold, 0, -4, "700 11px system-ui", "right"); }
            else if (q > 0) { gv.path((n) => [n, lm + n * Math.log10(q)], 0, 40, C.gold, 2.2, 40); gv.text("M·qⁿ,  q = |x|/x₀", 2, Math.min(2.2, lm + 1.2), C.gold, 0, 14, "700 11px system-ui"); }
          } else gv.text(!conv0 ? "no convergence at x₀: no bound M" : "choose |x| < x₀", 20, -1, C.red, 0, 0, "700 11px system-ui", "center");
        }
        if (f === 4) gv.text("terms at ρ: Mₙ = |aₙ|ρⁿ", 39, -10.5, C.gold, 0, 0, "600 11px system-ui", "right");
        if (f === 0) frame(gv);
        if (f === 1 || f === 5) frame(gv);
      });

      st.after = () => {
        const r = R(), x = S.x, a = Math.abs(x), x0 = S.x0, conv0 = convergesAt(x0), s = SER[S.k];
        let status;
        if (a < r - 1e-9) status = okSpan(true, "converges absolutely (|x| < R)");
        else if (s.ends && Math.abs(a - r) < 1e-9) { const e = s.ends[x < 0 ? "m" : "p"]; status = okSpan(e[0], `endpoint: ${e[1]}`); }
        else status = okSpan(false, a === 0 ? "converges (x = 0)" : "diverges (|x| > R: terms unbounded)");
        const q = Math.abs(x) / x0, M = conv0 ? Math.exp(logM(x0)) : null;
        out([
          ["series", s.name],
          ["R = 1/limsup ⁿ√|aₙ|", r === Infinity ? "∞" : fmt(r)],
          ["at x = " + fmt(x), status],
          ["endpoints ±R", s.ends ? `−R: ${s.ends.m[1]};  +R: ${s.ends.p[1]}` : (r === 0 ? "only x = 0" : "none (R = ∞)")],
          ["at x₀ = " + fmt(x0), conv0 ? okSpan(true, "converges: terms bounded by M = " + (M < 1e6 ? fmt(M, 3) : "…")) : okSpan(false, "diverges: Abel's lemma does not apply")],
          ["q = |x|/x₀", conv0 && Math.abs(x) < x0 ? okSpan(true, fmt(q, 3) + " < 1: terms ≤ M qⁿ") : okSpan(false, fmt(q, 3) + (q >= 1 ? " ≥ 1: need |x| < x₀" : ""))],
        ]);
      };
      ML.drag(st, () => [{ x: S.x, y: YB }], (i, x) => { S.x = ML.clamp(x, -2.2, 2.2); xS.set(S.x); }, { snap: 0.01, r: 26 });

      return {
        showStep(i) {
          S.focus = i;
          if (i === 5 && S.k === "geo") setK("log");
          if (i === 4) { S.N = Math.max(S.N, 10); nS.set(S.N); }
          st.redraw();
        },
      };
    },

    idea: String.raw`If the terms at \(x_0\) are bounded, the terms at any smaller \(|x|\) are dominated by the geometric sequence \(M|x/x_0|^n\). So the set of convergence is an interval around \(0\), and its half-length \(R\) is read from \(\sqrt[n]{|a_n|}\).`,
    steps: [
      { fig: String.raw`The point \(x_0\) (gold dots on the number line, slider \(x_0\)). In the small graph the dots are \(\log_{10}|a_nx_0^n|\): they tend to \(-\infty\), so they stay below the dashed gold level \(\log_{10}M\).`, t: String.raw`Abel's lemma, part 1: boundedness.`, d: String.raw`Suppose \(\sum a_nx_0^n\) converges, \(x_0\ne0\). Then \(a_nx_0^n\to0\), so the sequence is bounded: \(|a_nx_0^n|\le M\) for all \(n\).` },
      { fig: String.raw`The dots now sit at the smaller point \(x\) (white handle, \(|x|\lt x_0\)). On a log scale the geometric majorant \(Mq^n\) with \(q=|x|/x_0\lt1\) is the straight gold line, sloping down; all dots lie below it.`, t: String.raw`Abel's lemma, part 2: geometric domination.`, d: String.raw`Let \(|x|\lt|x_0|\) and \(q=|x/x_0|\lt1\). Then \(|a_nx^n|=|a_nx_0^n|\,q^n\le Mq^n\). The geometric series \(\sum Mq^n\) converges, so \(\sum a_nx^n\) converges absolutely by comparison.` },
      { fig: String.raw`The number line below the graph: green segment \((-R,R)\). For \(x\) in the green zone the partial sums \(S_N\) settle (blue graph close to gold sum); in the red zone they run away. The dots at \(\pm R\) show the endpoint behaviour.`, t: String.raw`Define the radius \(R\).`, d: String.raw`Let \(R=\sup\{|x|:\sum a_nx^n\ \text{converges}\}\in[0,\infty]\). If \(|x|\lt R\) there is a point \(x_1\) of convergence with \(|x|\lt|x_1|\), and Abel's lemma gives absolute convergence at \(x\). If \(|x|\gt R\) the series diverges by definition of the supremum.` },
      { fig: String.raw`The small graph switches to the root numbers \(\sqrt[n]{|a_n|}\) (cyan dots) and the dashed gold level \(1/R\) that they approach (their limsup).`, t: String.raw`Cauchy–Hadamard: compute \(R\).`, d: String.raw`Root test: \(\sqrt[n]{|a_nx^n|}=|x|\sqrt[n]{|a_n|}\) has \(\limsup=|x|/R\) with \(R=1/\limsup\sqrt[n]{|a_n|}\). If \(|x|/R\lt1\) the series converges absolutely; if \(\gt1\) infinitely many terms satisfy \(|a_nx^n|\gt1\), so the terms do not tend to \(0\) and the series diverges.` },
      { fig: String.raw`The yellow strip \(|x|\le\rho\) (\(\rho=x_0\)) and the tube \(S\pm T_N\) with \(T_N=\sum_{n\gt N}|a_n|\rho^n\): inside the strip every partial sum stays within the tube, so the convergence is uniform there. Outside the strip, nothing is guaranteed.`, t: String.raw`Uniform convergence on \([-\rho,\rho]\), \(\rho\lt R\).`, d: String.raw`Choose \(x_1\) with \(\rho\lt|x_1|\lt R\). By Abel's lemma \(\sum|a_n|\rho^n\lt\infty\). For \(|x|\le\rho\): \(|a_nx^n|\le|a_n|\rho^n=:M_n\) with \(\sum M_n\lt\infty\). The Weierstrass M-test gives uniform convergence on \([-\rho,\rho]\). It can fail on all of \((-R,R)\): for \(\sum x^n\), \(\sup_{(-1,1)}|S-S_N|=\infty\).` },
      { fig: String.raw`The endpoints \(\pm R\) on the number line: filled green dot = the series converges there, open red dot = it diverges. The small graph shows the terms at \(x=R\) (orange): for \(\sum x^n/n\) they tend to \(0\) slowly, for \(\sum x^n\) they stay at \(1\).`, t: String.raw`What happens at the endpoints?`, d: String.raw`At \(|x|=R\) anything can happen, and the theorem says nothing: \(\sum x^n\) diverges at both \(\pm1\); \(\sum x^n/n\) converges at \(-1\) and diverges at \(+1\); \(\sum x^n/n^2\) converges at both. Endpoints must be checked separately (Leibniz, comparison, ...).` },
    ],
    memorize: {
      formula: String.raw`R=\frac{1}{\limsup_{n\to\infty}\sqrt[n]{|a_n|}}\,,\qquad R=\lim\left|\frac{a_n}{a_{n+1}}\right|\ \text{(if the limit exists)}`,
      bullets: [
        String.raw`Abel's lemma: convergence at \(x_0\) \(\Rightarrow\) absolute convergence for \(|x|\lt|x_0|\) (terms bounded by \(Mq^n\), \(q=|x/x_0|\)).`,
        String.raw`Inside \((-R,R)\): absolute convergence, and uniform on every \([-\rho,\rho]\), \(\rho\lt R\). Outside: divergence. At \(\pm R\): check by hand.`,
        String.raw`Examples: \(\sum x^n\): \(R=1\); \(\sum x^n/n!\): \(R=\infty\); \(\sum n!x^n\): \(R=0\).`,
      ],
      pitfalls: [
        String.raw`Uniform convergence on \((-R,R)\) itself is <b>not</b> guaranteed (\(\sum x^n\)); only on compact subintervals \([-\rho,\rho]\).`,
        String.raw`The ratio formula needs the limit to exist; the root formula with limsup always works. Also: for \(\sum a_nx^{2n}\) or lacunary series, substitute \(y=x^2\) or use the root test directly.`,
        String.raw`Do not forget the endpoints, and do not assume they behave like the interior (different for \(\sum x^n/n\) at \(\pm1\)).`,
      ],
    },
  });

})(window.ML);
