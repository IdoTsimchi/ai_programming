"use strict";
/* Linear Algebra 2 · Inner product spaces.
   This file is also the TEMPLATE for every other proof file: copy its structure. */
(function (ML) {
  const C = ML.C, dot = ML.la.dot, norm = ML.la.norm;

  /* ------------------------------------------------------------------ */
  ML.register({
    id: "cauchy-schwarz",
    course: "linalg2",
    topic: "inner",
    title: "Cauchy–Schwarz inequality",
    blurb: "|⟨u,v⟩| ≤ ‖u‖‖v‖, proved with a parabola that can never dip below zero.",
    statement: String.raw`For all vectors \(u, v\) in a real inner product space: \(\;|\langle u,v\rangle|\le \|u\|\,\|v\|\), with equality if and only if \(u\) and \(v\) are linearly dependent.`,
    shows: String.raw`The statement itself: the two vectors \(u,v\), the inequality \(|\langle u,v\rangle|\le\|u\|\|v\|\) checked live, and the parabola \(q(t)=\|u-tv\|^2\) used in the proof. Use the buttons under each step to see that step alone.`,
    vizIntro: String.raw`<b>Drag the tips of <span style="color:#ff6b8b">u</span> and <span style="color:#4fd1a5">v</span>.</b> The curve on the right is \(q(t)=\|u-tv\|^2\). It is a parabola that never goes below the axis, so it can have at most one root. That is the whole proof.`,

    viz(box) {
      const st = ML.stage(box, { x: [-4, 4], y: [-4, 4] });
      const S = { u: { x: 2.4, y: 1.4 }, v: { x: 2.2, y: -0.6 }, t: 0.5, focus: -1 };
      const U = () => [S.u.x, S.u.y], V = () => [S.v.x, S.v.y];
      const ip = () => dot(U(), V()), nu = () => norm(U()), nv = () => norm(V());
      const tStar = () => (nv() < 1e-6 ? 0 : ip() / (nv() * nv()));
      const qf = (t) => nu() ** 2 - 2 * t * ip() + t * t * nv() ** 2;

      const tSlider = ML.slider(st.panel, { label: "t", min: -3, max: 3, step: 0.01, value: S.t, onInput: (v) => { S.t = v; st.redraw(); } });
      ML.button(st.panel, "Jump to the minimum  t = ⟨u,v⟩/‖v‖²", () => { S.t = ML.clamp(tStar(), -3, 3); tSlider.set(S.t); st.redraw(); });
      const graph = st.extra({ x: [-3, 3], y: [-1, 10], height: 150 });
      const out = ML.readout(st.panel);

      st.draw((v) => {
        v.grid(1); v.axes();
        const u = U(), w = V(), t = S.t;
        // line spanned by v
        if (nv() > 1e-6) v.line(-w[0] * 10, -w[1] * 10, w[0] * 10, w[1] * 10, "rgba(79,209,165,.25)", 1.5, [6, 6]);
        // point t·v and the residual u − t·v
        v.line(t * w[0], t * w[1], u[0], u[1], C.white, 2.5, [5, 4]);
        v.arrow(0, 0, u[0], u[1], C.pink, 3.5);
        v.arrow(0, 0, w[0], w[1], C.green, 3.5);
        v.dot(t * w[0], t * w[1], C.gold, 6);
        v.text("t·v", t * w[0], t * w[1], C.gold, 8, 18);
        v.handle(u[0], u[1], C.pink, "u"); v.handle(w[0], w[1], C.green, "v");
        const mid = [(t * w[0] + u[0]) / 2, (t * w[1] + u[1]) / 2];
        v.text("u − t·v", mid[0], mid[1], C.white, 8, -4);
        if (S.focus === 1 || S.focus === 2) {        // steps 2-3: the vector u − t·v and its squared length q(t) ≥ 0
          v.line(t * w[0], t * w[1], u[0], u[1], C.white, 5);
          v.text(`‖u − t·v‖² = q(t) = ${ML.fmt(qf(t))}  ≥ 0`, 0, 3.55, C.white, 0, 0, "700 14px system-ui", "center");
        }
        if (S.focus === 5) v.text("equality: u = c·v  (dependent)", 0, 3.55, C.gold, 0, 0, "700 14px system-ui", "center");
      });

      graph.draw((g) => {
        const ymax = Math.max(2, Math.min(40, Math.max(qf(-3), qf(3))));
        g.o.y = [-ymax * 0.12, ymax]; g.begin(); // re-begin with adaptive range
        g.axes(); g.grid(Math.max(1, Math.round(ymax / 5)));
        g.plot(qf, -3, 3, C.blue, 2.5);
        const ts = tStar();
        if (Math.abs(ts) <= 3) { g.dot(ts, qf(ts), C.gold, 6); g.text("min", ts, qf(ts), C.gold, 8, -8); }
        g.dot(S.t, qf(S.t), C.white, 5);
        g.text("q(t) = ‖u − t·v‖²", 2.9, ymax * 0.93, C.text, 0, 0, "600 12px system-ui", "right");
        if (S.focus === 3 || S.focus === 4) {          // steps 4-5: a never-negative parabola has no two roots, so discriminant ≤ 0
          g.ctx.fillStyle = "rgba(255,90,122,.16)"; const a = g.P(-3, 0), b = g.P(3, -ymax * 0.12); g.ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
          g.text("q never goes below 0", 0, -ymax * 0.07, C.red, 0, 4, "700 11px system-ui", "center");
        }
      });

      st.after = () => out(rows());
      function rows() {
        const I = ip(), a = nu() * nv(), disc = 4 * (I * I - a * a), cos = a > 1e-9 ? I / a : NaN;
        return [
          ["⟨u,v⟩", ML.fmt(I)],
          ["‖u‖·‖v‖", ML.fmt(a)],
          ["|⟨u,v⟩| ≤ ‖u‖‖v‖", `<span class="${Math.abs(I) <= a + 1e-9 ? "ok" : "no"}">${ML.fmt(Math.abs(I))} ≤ ${ML.fmt(a)} ✓</span>`],
          ["cos θ", Number.isFinite(cos) ? ML.fmt(cos) + "  (always in [−1, 1])" : "–"],
          ["Discriminant of q", `${ML.fmt(disc)}  <span class="${disc > -1e-9 ? "warn" : "ok"}">${disc > -1e-9 ? "= 0: u ∥ v, q touches the axis" : "< 0: no real root"}</span>`],
          ["q(t) now", ML.fmt(qf(S.t)) + `  (min = ${ML.fmt(qf(tStar()))})`],
        ];
      }
      let saved = null;
      const api = {
        showStep(i) {
          if (i === 5) { saved = saved || { u: { ...S.u }, t: S.t }; S.u = { x: S.v.x * 1.5, y: S.v.y * 1.5 }; S.t = ML.clamp(tStar(), -3, 3); tSlider.set(S.t); }
          else if (saved) { S.u = saved.u; S.t = saved.t; tSlider.set(S.t); saved = null; }
          S.focus = i; st.redraw();
        },
      };
      ML.drag(st, () => [S.u, S.v], (i, x, y) => { (i === 0 ? S.u : S.v).x = x; (i === 0 ? S.u : S.v).y = y; }, { snap: 0.05, clamp: [-3.9, 3.9, -3.9, 3.9] });
      st.redraw();
      return api;
    },

    idea: String.raw`Look at \(\|u-tv\|^2\ge 0\) as a quadratic in \(t\). A parabola that is never negative has discriminant \(\le 0\), and that is exactly Cauchy–Schwarz.`,
    steps: [
      { t: String.raw`Dispose of \(v=0\).`, d: String.raw`Then \(\langle u,0\rangle = 0\) and \(\|u\|\|0\| = 0\), so both sides are \(0\). From now on assume \(v\ne 0\).` },
      { fig: String.raw`The vector \(u-tv\) (white dashed) for the current \(t\), and its squared length \(q(t)\), which is always \(\ge 0\). Move the \(t\) slider.`, t: String.raw`Take the vector \(u - tv\) for any real \(t\) and use positivity.`, d: String.raw`In an inner product space \(\langle w,w\rangle\ge 0\) for every \(w\). So \(q(t) := \langle u-tv,\,u-tv\rangle \ge 0\) for <b>all</b> \(t\in\mathbb R\).` },
      { t: String.raw`Expand with bilinearity and symmetry.`, d: String.raw`\(q(t) = \langle u,u\rangle - 2t\langle u,v\rangle + t^2\langle v,v\rangle = \|v\|^2 t^2 - 2\langle u,v\rangle\, t + \|u\|^2.\)` },
      { fig: String.raw`The graph of \(q(t)\): the shaded band below the axis is forbidden, so the parabola touches the axis at most once.`, t: String.raw`A never-negative parabola has discriminant \(\le 0\).`, d: String.raw`The leading coefficient \(\|v\|^2\) is positive. If the discriminant were positive, \(q\) would have two distinct roots and be negative between them: contradiction. So \(\;(2\langle u,v\rangle)^2 - 4\|v\|^2\|u\|^2 \le 0.\)` },
      { t: String.raw`Rearrange and take square roots.`, d: String.raw`\(\langle u,v\rangle^2 \le \|u\|^2\|v\|^2\), hence \(|\langle u,v\rangle|\le\|u\|\|v\|\).` },
      { fig: String.raw`Equality: \(u\) is moved onto the line of \(v\). The parabola now touches the axis (discriminant \(=0\)) and both sides of the inequality agree.`, t: String.raw`Equality case.`, d: String.raw`If equality holds the discriminant is \(0\), so \(q\) has a real root \(t_0\): \(\|u-t_0v\|^2=0\Rightarrow u = t_0 v\) (dependent). Conversely if \(u=cv\) both sides equal \(|c|\,\|v\|^2\).` },
    ],
    memorize: {
      formula: String.raw`|\langle u,v\rangle|\le\|u\|\,\|v\|\qquad\text{(trick: } \|u-tv\|^2\ge0\text{)}`,
      bullets: [
        String.raw`The best \(t\) is \(t^\ast=\dfrac{\langle u,v\rangle}{\|v\|^2}\): the coefficient of the projection of \(u\) on \(v\).`,
        String.raw`Consequences: the triangle inequality \(\|u+v\|\le\|u\|+\|v\|\), and \(\cos\theta=\frac{\langle u,v\rangle}{\|u\|\|v\|}\in[-1,1]\) makes angles well defined.`,
        String.raw`Equality \(\iff\) \(u,v\) linearly dependent.`,
      ],
      pitfalls: [
        String.raw`Do not forget the case \(v=0\) (you divide by \(\|v\|\) otherwise).`,
        String.raw`Over \(\mathbb C\) the same idea works with \(t=\langle u,v\rangle/\|v\|^2\) plugged in directly. A discriminant argument needs real \(t\).`,
        String.raw`Write \(\|v\|^2\) as the <i>leading coefficient</i> and say it is \(>0\); that is why the parabola opens upward.`,
      ],
    },
  });

  /* ------------------------------------------------------------------ */
  ML.register({
    id: "best-approximation",
    course: "linalg2",
    topic: "inner",
    title: "Orthogonal projection is the best approximation",
    blurb: "Among all points w of a subspace W, the projection Pv is the closest to v, by Pythagoras.",
    statement: String.raw`Let \(W\) be a subspace of an inner product space \(V\), \(v\in V\), and \(Pv\in W\) the orthogonal projection (\(v-Pv\perp W\)). Then for every \(w\in W\): \(\;\|v-Pv\|\le\|v-w\|\), with equality if and only if \(w=Pv\).`,
    shows: String.raw`The statement in the plane: the subspace \(W=\operatorname{span}(a)\) (green line), the point \(b\), its projection \(Pb\), and any other point \(w\in W\). The right triangle \(b,\,Pb,\,w\) shows why \(Pb\) is the closest point; the graph shows \(\|b-w\|^2\) as \(w\) slides.`,
    vizIntro: String.raw`<b>Drag \(b\) and the tip of <span style="color:#4fd1a5">a</span></b> (the line \(W=\operatorname{span}(a)\)), then slide the point \(w\) along \(W\). The right angle at \(Pb\) makes \(\|b-w\|^2=\|b-Pb\|^2+\|Pb-w\|^2\) hold exactly, so any \(w\ne Pb\) is strictly farther away. The parabola shows the squared distance as \(w\) moves.`,

    viz(box) {
      const st = ML.stage(box, { x: [-4, 4], y: [-4, 4] });
      const S = { a: { x: 3, y: 1 }, b: { x: 1, y: 2.9 }, s: -1.5, focus: -1 };
      const geom = () => {
        const n = norm([S.a.x, S.a.y]), deg = n < 1e-6;
        const e = deg ? [1, 0] : [S.a.x / n, S.a.y / n];
        const b = [S.b.x, S.b.y], c = deg ? 0 : dot(b, e);
        const p = [c * e[0], c * e[1]], w = deg ? [0, 0] : [S.s * e[0], S.s * e[1]];
        return { deg, e, b, c, p, w };
      };
      const sl = ML.slider(st.panel, { label: "position of w on W", min: -4, max: 4, step: 0.01, value: S.s, onInput: (v) => { S.s = v; st.redraw(); } });
      ML.button(st.panel, "Put w = Pb", () => { S.s = ML.clamp(geom().c, -4, 4); sl.set(S.s); st.redraw(); });
      const graph = st.extra({ x: [-4, 4], y: [-1, 10], height: 140 });
      const out = ML.readout(st.panel);
      const d2 = (g, s) => { const q = [g.b[0] - s * g.e[0], g.b[1] - s * g.e[1]]; return q[0] * q[0] + q[1] * q[1]; };

      st.draw((v) => {
        v.grid(1); v.axes();
        const g = geom();
        if (!g.deg) v.line(-g.e[0] * 12, -g.e[1] * 12, g.e[0] * 12, g.e[1] * 12, "rgba(79,209,165,.45)", 2, [7, 5]);
        else v.text("W = {0}", 0, 0, C.green, 10, 22);
        // Pythagoras triangle b, Pb, w
        const f = S.focus, tx = (str, col) => v.text(str, 0, 3.55, col, 0, 0, "700 13px system-ui", "center");
        if (f !== 0) {
          v.poly([g.b, g.p, g.w], f === 1 || f === 2 ? "rgba(108,140,255,.25)" : "rgba(108,140,255,.12)", null);
          v.line(g.b[0], g.b[1], g.w[0], g.w[1], C.pink, 2.5, [6, 4]);
          v.line(g.p[0], g.p[1], g.w[0], g.w[1], C.gold, f === 2 ? 5 : 3.5);
        }
        v.line(g.b[0], g.b[1], g.p[0], g.p[1], C.white, f === 0 || f === 2 ? 5 : 3);
        if (f === 1) { // step 2: the split b − w = (b − Pb) + (Pb − w)
          v.text("b − Pb", (g.b[0] + g.p[0]) / 2, (g.b[1] + g.p[1]) / 2, C.white, 8, 0, "700 12px system-ui");
          v.text("Pb − w", (g.p[0] + g.w[0]) / 2, (g.p[1] + g.w[1]) / 2, C.gold, 0, 20, "700 12px system-ui", "center");
          v.text("b − w", (g.b[0] + g.w[0]) / 2, (g.b[1] + g.w[1]) / 2, C.pink, -8, 0, "700 12px system-ui", "right");
          tx("b − w  =  (b − Pb)  +  (Pb − w)", C.text);
        }
        if (f === 3 && !g.deg) { // step 4: Pythagoras as areas of squares
          const sq = (p, q, r, fill, stroke, label) => {
            const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy);
            if (len < 0.05) return;
            let nx = -dy, ny = dx;
            if (nx * ((p[0] + q[0]) / 2 - r[0]) + ny * ((p[1] + q[1]) / 2 - r[1]) < 0) { nx = -nx; ny = -ny; }
            v.poly([p, q, [q[0] + nx, q[1] + ny], [p[0] + nx, p[1] + ny]], fill, stroke, 2);
            v.text(label, (p[0] + q[0]) / 2 + nx / 2, (p[1] + q[1]) / 2 + ny / 2, stroke, 0, 4, "700 11px system-ui", "center");
          };
          const l1 = Math.hypot(g.b[0] - g.p[0], g.b[1] - g.p[1]), l2 = Math.hypot(g.p[0] - g.w[0], g.p[1] - g.w[1]), l3 = Math.hypot(g.b[0] - g.w[0], g.b[1] - g.w[1]);
          sq(g.b, g.p, g.w, "rgba(255,255,255,.15)", C.white, `‖b−Pb‖² = ${ML.fmt(l1 * l1)}`);
          sq(g.p, g.w, g.b, "rgba(255,204,77,.2)", C.gold, `‖Pb−w‖² = ${ML.fmt(l2 * l2)}`);
          sq(g.b, g.w, g.p, "rgba(255,107,139,.12)", C.pink, `‖b−w‖² = ${ML.fmt(l3 * l3)}`);
          tx("area of the two small squares = area of the big square", C.text);
        }
        if (!g.deg) { // right-angle marker at Pb
          const r = [g.b[0] - g.p[0], g.b[1] - g.p[1]], rn = norm(r);
          if (rn > 0.25) {
            const k = f === 0 || f === 2 ? 0.55 : 0.3, u = [r[0] / rn * k, r[1] / rn * k], d = [g.e[0] * k, g.e[1] * k];
            v.line(g.p[0] + u[0], g.p[1] + u[1], g.p[0] + u[0] + d[0], g.p[1] + u[1] + d[1], C.white, 1.5);
            v.line(g.p[0] + d[0], g.p[1] + d[1], g.p[0] + u[0] + d[0], g.p[1] + u[1] + d[1], C.white, 1.5);
          }
        }
        v.arrow(0, 0, g.b[0], g.b[1], C.pink, 2.5);
        v.dot(g.p[0], g.p[1], C.gold, 6); v.text("Pb", g.p[0], g.p[1], C.gold, -22, 18);
        v.dot(g.w[0], g.w[1], C.white, 6); v.text("w", g.w[0], g.w[1], C.white, 8, 18);
        v.handle(g.b[0], g.b[1], C.pink, "b"); v.handle(S.a.x, S.a.y, C.green, "a");
        if (f === 0) tx("b − Pb ⟂ W: the white segment meets the line W at a right angle", C.white);
        if (f === 2) tx("⟨b − Pb, Pb − w⟩ = 0: right angle at Pb, and Pb − w lies inside W", C.gold);
        if (f === 5) tx("w = Pb: the extra term is 0, the distance is minimal", C.gold);
      });

      graph.draw((q) => {
        const g = geom(), top = Math.max(2, Math.min(60, Math.max(d2(g, -4), d2(g, 4))));
        q.o.y = [-top * 0.12, top]; q.begin();
        q.axes(); q.grid(Math.max(1, Math.round(top / 5)));
        q.plot((s) => d2(g, s), -4, 4, C.blue, 2.5);
        if ((S.focus === 4 || S.focus === 5) && !g.deg) { // steps 5-6: the curve never goes below the gold floor
          const m = d2(g, g.c);
          q.line(-4, m, 4, m, C.gold, 1.5, [6, 5]); q.text("floor ‖b−Pb‖²", 3.9, m, C.gold, 0, -6, "600 11px system-ui", "right");
          q.line(g.c, 0, g.c, top, C.gold, 1, [3, 3]);
        }
        if (!g.deg) { q.dot(g.c, d2(g, g.c), C.gold, 6); q.text("Pb", g.c, d2(g, g.c), C.gold, 8, -8); }
        q.dot(S.s, d2(g, S.s), C.white, 5);
        q.text("‖b − w‖² as w moves along W", -3.9, top * 0.9, C.text, 0, 0, "600 12px system-ui", "left");
      });

      st.after = () => {
        const g = geom(), r1 = Math.hypot(g.b[0] - g.p[0], g.b[1] - g.p[1]), r2 = Math.hypot(g.p[0] - g.w[0], g.p[1] - g.w[1]), r3 = Math.hypot(g.b[0] - g.w[0], g.b[1] - g.w[1]);
        const ok = Math.abs(r1 * r1 + r2 * r2 - r3 * r3) < 1e-8;
        out([
          ["‖b − Pb‖² (shortest)", ML.fmt(r1 * r1)],
          ["‖Pb − w‖²", ML.fmt(r2 * r2)],
          ["sum", `<span class="${ok ? "ok" : "no"}">${ML.fmt(r1 * r1 + r2 * r2)}</span>`],
          ["‖b − w‖²", ML.fmt(r3 * r3)],
          ["‖b − Pb‖ ≤ ‖b − w‖", `<span class="ok">${ML.fmt(r1)} ≤ ${ML.fmt(r3)} ✓</span>`],
        ], r2 < 1e-6 ? "w = Pb: the extra term vanishes, so the distance is minimal." : "The extra term ‖Pb − w‖² is strictly positive, so w is strictly farther than Pb.");
      };
      ML.drag(st, () => [S.a, S.b], (i, x, y) => { const t = i === 0 ? S.a : S.b; t.x = x; t.y = y; }, { snap: 0.05, clamp: [-3.9, 3.9, -3.9, 3.9] });
      let savedS = null;
      st.redraw();
      return {
        showStep(i) {
          if (i === 5) { if (savedS === null) savedS = S.s; S.s = ML.clamp(geom().c, -4, 4); sl.set(S.s); }
          else if (savedS !== null) { S.s = savedS; sl.set(S.s); savedS = null; }
          S.focus = i; st.redraw();
        },
      };
    },

    idea: String.raw`Split \(v-w=(v-Pv)+(Pv-w)\). The first piece is orthogonal to \(W\), the second lies in \(W\), so Pythagoras gives \(\|v-w\|^2=\|v-Pv\|^2+\|Pv-w\|^2\ge\|v-Pv\|^2\).`,
    steps: [
      { fig: String.raw`Step 1: the subspace \(W=\operatorname{span}(a)\) (green dashed line), the point \(b\) and its orthogonal projection \(Pb\). The white segment \(b-Pb\) meets \(W\) at a right angle.`, t: String.raw`Recall what \(Pv\) is.`, d: String.raw`\(Pv\in W\) and \(v-Pv\in W^{\perp}\). (In finite dimensions, with an orthonormal basis \(e_1,\dots,e_m\) of \(W\): \(Pv=\sum\langle v,e_i\rangle e_i\).)` },
      { fig: String.raw`Step 2: for the chosen \(w\in W\), the pink dashed vector \(b-w\) is split into \(b-Pb\) (white) plus \(Pb-w\) (gold). Slide \(w\) along \(W\) to see both pieces change.`, t: String.raw`Fix any \(w\in W\) and split \(v-w\).`, d: String.raw`\(v-w=(v-Pv)+(Pv-w)\).` },
      { fig: String.raw`Step 3: the two pieces meet at a right angle at \(Pb\) (big square mark): \(b-Pb\perp W\), while \(Pb-w\) lies inside \(W\), along the green line.`, t: String.raw`The two pieces are orthogonal.`, d: String.raw`\(Pv\in W\) and \(w\in W\), so \(Pv-w\in W\) because \(W\) is a subspace. And \(v-Pv\perp W\). Hence \(\langle v-Pv,\,Pv-w\rangle=0\).` },
      { fig: String.raw`Step 4: Pythagoras drawn as areas. The squares on the two legs \(b-Pb\) and \(Pb-w\) together have exactly the area of the square on the hypotenuse \(b-w\) (values on the squares).`, t: String.raw`Pythagoras.`, d: String.raw`\(\|v-w\|^2=\|v-Pv\|^2+\|Pv-w\|^2\) (the cross term \(2\langle v-Pv,Pv-w\rangle\) vanishes).` },
      { fig: String.raw`Step 5: the graph shows \(\|b-w\|^2\) as \(w\) slides along \(W\). It never goes below the gold floor \(\|b-Pb\|^2\), because the dropped term \(\|Pb-w\|^2\) is \(\ge0\).`, t: String.raw`Drop a nonnegative term.`, d: String.raw`\(\|Pv-w\|^2\ge0\), so \(\|v-w\|^2\ge\|v-Pv\|^2\); take square roots.` },
      { fig: String.raw`Step 6: \(w\) has been moved to \(Pb\): the extra term is \(0\) and the distance equals its minimum. Move \(w\) away: every other point is strictly farther.`, t: String.raw`Equality and uniqueness.`, d: String.raw`Equality iff \(\|Pv-w\|=0\) iff \(w=Pv\). So \(Pv\) is the <b>unique</b> closest point of \(W\) to \(v\). \(\blacksquare\)` },
    ],
    memorize: {
      formula: String.raw`\|v-w\|^2=\|v-Pv\|^2+\|Pv-w\|^2\ \ge\ \|v-Pv\|^2\quad(w\in W)`,
      bullets: [
        String.raw`Shortest distance from a point to a subspace is along the perpendicular.`,
        String.raw`Formula: \(Pv=\sum\langle v,e_i\rangle e_i\) for an <i>orthonormal</i> basis of \(W\).`,
        String.raw`This is the theory behind least squares: \(A^TA\hat x=A^Tb\) projects \(b\) onto the column space.`,
      ],
      pitfalls: [
        String.raw`You must justify \(Pv-w\in W\): it uses that \(W\) is a <i>subspace</i> (closed under subtraction).`,
        String.raw`The projection formula needs an orthonormal (or orthogonal, with division by \(\langle e_i,e_i\rangle\)) basis, not any basis.`,
        String.raw`Pythagoras requires the cross term to vanish: say \(\langle v-Pv,\,Pv-w\rangle=0\) explicitly.`,
      ],
    },
  });

  /* ------------------------------------------------------------------ */
  ML.register({
    id: "gram-schmidt",
    course: "linalg2",
    topic: "inner",
    title: "Gram–Schmidt orthonormalization",
    blurb: "Subtract the components along earlier vectors, normalize, repeat: an orthonormal basis of the same spans.",
    statement: String.raw`Let \(v_1,\dots,v_n\) be linearly independent. Define \(u_k=v_k-\sum_{j\lt k}\langle v_k,e_j\rangle e_j\) and \(e_k=u_k/\|u_k\|\). Then \(e_1,\dots,e_n\) is orthonormal and \(\operatorname{span}(e_1,\dots,e_k)=\operatorname{span}(v_1,\dots,v_k)\) for every \(k\).`,
    shows: String.raw`The construction for two vectors: \(v_1\) is normalised to \(e_1\), the shadow of \(v_2\) on \(e_1\) is subtracted to get \(u_2\), and \(u_2\) is normalised to \(e_2\). The Step slider reveals the construction one move at a time.`,
    vizIntro: String.raw`<b>Drag \(v_1\) and \(v_2\), then move the Step slider.</b> Step by step: normalize \(v_1\) to \(e_1\), subtract the shadow of \(v_2\) on \(e_1\) to get \(u_2\), normalize to \(e_2\). Try making \(v_2\) parallel to \(v_1\): then \(u_2=0\) and the process (correctly) breaks down.`,

    viz(box) {
      const st = ML.stage(box, { x: [-4, 4], y: [-4, 4] });
      const S = { v1: { x: 2.6, y: 0.8 }, v2: { x: 1.0, y: 2.4 }, step: 3, focus: -1 };
      const names = ["start", "e₁", "u₂", "e₂"];
      const stepSl = ML.slider(st.panel, { label: "Step", min: 0, max: 3, step: 1, value: S.step, fmt: (v) => `${v}: ${names[v]}`, onInput: (v) => { S.step = v; S.focus = -1; st.redraw(); } });
      ML.button(st.panel, "Make v₂ ∥ v₁ (dependent)", () => { S.v2 = { x: S.v1.x * 0.6, y: S.v1.y * 0.6 }; st.redraw(); });
      const out = ML.readout(st.panel);
      const calc = () => {
        const a = [S.v1.x, S.v1.y], b = [S.v2.x, S.v2.y], n1 = norm(a);
        if (n1 < 1e-6) return { zero1: true, a, b };
        const e1 = [a[0] / n1, a[1] / n1], c = dot(b, e1), pr = [c * e1[0], c * e1[1]], u2 = [b[0] - pr[0], b[1] - pr[1]], n2 = norm(u2);
        const dep = n2 < 1e-6;
        return { a, b, e1, c, pr, u2, n2, dep, e2: dep ? null : [u2[0] / n2, u2[1] / n2] };
      };

      st.draw((v) => {
        v.grid(1); v.axes();
        const r = calc();
        v.circle(0, 0, 1, C.dim, null, 1, [4, 4]);
        if (r.zero1) { v.text("v₁ = 0: nothing to normalize", 0, 3, C.red, 0, 0, "700 14px system-ui", "center"); }
        else {
          if (S.step >= 2) {
            v.line(r.pr[0], r.pr[1], r.b[0], r.b[1], C.white, 2, [5, 4]);
            v.arrow(0, 0, r.pr[0], r.pr[1], C.gold, 3);
            v.text("⟨v₂,e₁⟩e₁", r.pr[0], r.pr[1], C.gold, -6, 20, "600 12px system-ui", "center");
            if (!r.dep) {
              v.arrow(0, 0, r.u2[0], r.u2[1], C.white, 3);
              v.text("u₂", r.u2[0], r.u2[1], C.white, -14, -6);
              const k = 0.3, d = [r.e1[0] * k, r.e1[1] * k], f = r.e2 ? [r.e2[0] * k, r.e2[1] * k] : [0, 0];
              v.poly([[d[0], d[1]], [d[0] + f[0], d[1] + f[1]], [f[0], f[1]]], null, C.white, 1.2);
            }
          }
          if (S.step >= 1) { v.arrow(0, 0, r.e1[0], r.e1[1], C.cyan, 4); v.text("e₁", r.e1[0], r.e1[1], C.cyan, 8, 16); }
          if (S.step >= 3 && r.e2) { v.arrow(0, 0, r.e2[0], r.e2[1], C.purple, 4); v.text("e₂", r.e2[0], r.e2[1], C.purple, 8, 16); }
          if (S.step >= 3 && r.dep) v.text("u₂ = 0: v₂ is dependent on v₁", 0, -3.4, C.red, 0, 0, "700 14px system-ui", "center");
        }
        v.arrow(0, 0, r.b[0], r.b[1], "rgba(79,209,165,.9)", 2.5);
        v.arrow(0, 0, r.a[0], r.a[1], "rgba(255,107,139,.9)", 2.5);
        v.handle(S.v1.x, S.v1.y, C.pink, "v₁"); v.handle(S.v2.x, S.v2.y, C.green, "v₂");
        const f = S.focus, tx = (str, col) => v.text(str, 0, 3.55, col, 0, 0, "700 13px system-ui", "center");
        if (!r.zero1) {
          if (f === 0) tx("e₁ = v₁/‖v₁‖: a unit vector on the same line as v₁", C.cyan);
          if (f === 2) tx(r.dep ? "u₂ = 0: v₂ lies on the line of v₁ (dependent input)" : "u₂ = v₂ − ⟨v₂,e₁⟩e₁ ≠ 0: v₂ is not on the line of v₁", r.dep ? C.red : C.white);
          if (f === 3 && !r.dep) {
            const k = 0.6, d = [r.e1[0] * k, r.e1[1] * k], h = [r.e2[0] * k, r.e2[1] * k];
            v.poly([[d[0], d[1]], [d[0] + h[0], d[1] + h[1]], [h[0], h[1]]], null, C.gold, 3.5);
            tx(`e₂ ⟂ e₁:  ⟨e₁,e₂⟩ = ${ML.fmt(dot(r.e1, r.e2), 3)}`, C.gold);
          }
          if (f === 4 && !r.dep) { // the orthonormal grid covers the same plane as v₁, v₂
            for (let i = -8; i <= 8; i++) {
              v.line(i * r.e1[0] - 8 * r.e2[0], i * r.e1[1] - 8 * r.e2[1], i * r.e1[0] + 8 * r.e2[0], i * r.e1[1] + 8 * r.e2[1], "rgba(90,215,255,.28)", 1);
              v.line(i * r.e2[0] - 8 * r.e1[0], i * r.e2[1] - 8 * r.e1[1], i * r.e2[0] + 8 * r.e1[0], i * r.e2[1] + 8 * r.e1[1], "rgba(183,140,255,.28)", 1);
            }
            tx("span(e₁, e₂) = span(v₁, v₂) = the whole plane", C.text);
          }
        }
      });

      st.after = () => {
        const r = calc(), rows = [];
        if (r.zero1) return out([["status", `<span class="no">v₁ = 0 is dependent.</span>`]]);
        const f = ML.fmt, tag = ["Original vectors.", "e₁ = v₁/‖v₁‖ has length 1 and spans the same line as v₁.", "u₂ = v₂ − ⟨v₂,e₁⟩e₁: remove the part of v₂ along e₁.", "e₂ = u₂/‖u₂‖: normalize the leftover."][S.step];
        if (S.step >= 1) rows.push(["e₁", `(${f(r.e1[0])}, ${f(r.e1[1])})`]);
        if (S.step >= 2) { rows.push(["⟨v₂, e₁⟩", f(r.c)]); rows.push(["u₂", `(${f(r.u2[0])}, ${f(r.u2[1])})  ‖u₂‖ = ${f(r.n2)}`]); rows.push(["⟨u₂, e₁⟩", `<span class="ok">${f(dot(r.u2, r.e1), 4)}</span>`]); }
        if (S.step >= 3 && r.e2) { rows.push(["e₂", `(${f(r.e2[0])}, ${f(r.e2[1])})`]); rows.push(["⟨e₁, e₂⟩", `<span class="ok">${f(dot(r.e1, r.e2), 4)}</span>`]); }
        out(rows, S.step >= 2 && r.dep ? "u₂ = 0 means v₂ ∈ span(v₁): the input was dependent. For an independent list, u_k ≠ 0 always." : tag);
      };
      ML.drag(st, () => [S.v1, S.v2], (i, x, y) => { const t = i === 0 ? S.v1 : S.v2; t.x = x; t.y = y; }, { snap: 0.05, clamp: [-3.9, 3.9, -3.9, 3.9] });
      st.redraw();
      const stepFor = { 0: 1, 2: 2, 3: 3, 4: 3 };
      return {
        showStep(i) { S.step = stepFor[i] != null ? stepFor[i] : 3; stepSl.set(S.step); S.focus = i; st.redraw(); },
      };
    },

    idea: String.raw`Subtracting from \(v_k\) its projection onto the span of the earlier \(e_j\) leaves something orthogonal to all of them, and nonzero exactly because \(v_k\) is independent of the earlier vectors. Induction on \(k\).`,
    steps: [
      { fig: String.raw`Step 1: \(v_1\) is normalised to the unit vector \(e_1\) (cyan), on the same line as \(v_1\). Nothing else is used yet.`, t: String.raw`Start (\(k=1\)).`, d: String.raw`\(v_1\ne0\) (independent lists contain no zero vector), so \(e_1=v_1/\|v_1\|\) is a unit vector with \(\operatorname{span}(e_1)=\operatorname{span}(v_1)\).` },
      { t: String.raw`Induction hypothesis.`, d: String.raw`\(e_1,\dots,e_{k-1}\) are orthonormal and \(\operatorname{span}(e_1,\dots,e_{k-1})=\operatorname{span}(v_1,\dots,v_{k-1})=:U\).` },
      { fig: String.raw`Step 3: \(u_2=v_2-\langle v_2,e_1\rangle e_1\) (white) is what is left of \(v_2\) after removing its shadow along \(e_1\) (gold). It is nonzero exactly because \(v_2\) is not on the line of \(v_1\): drag \(v_2\) onto that line and \(u_2\) vanishes.`, t: String.raw`\(u_k\ne0\).`, d: String.raw`\(u_k=v_k-(\text{element of }U)\). If \(u_k=0\) then \(v_k\in U=\operatorname{span}(v_1,\dots,v_{k-1})\), contradicting independence. So \(e_k=u_k/\|u_k\|\) is defined and has norm \(1\).` },
      { fig: String.raw`Step 4: dividing by \(\|u_2\|\) gives \(e_2\) (purple). The gold right-angle mark shows \(e_2\perp e_1\), and the readout lists \(\langle e_1,e_2\rangle=0\).`, t: String.raw`\(e_k\perp e_i\) for \(i\lt k\).`, d: String.raw`\(\langle u_k,e_i\rangle=\langle v_k,e_i\rangle-\sum_{j\lt k}\langle v_k,e_j\rangle\langle e_j,e_i\rangle=\langle v_k,e_i\rangle-\langle v_k,e_i\rangle=0\), using \(\langle e_j,e_i\rangle=\delta_{ji}\). Dividing by \(\|u_k\|\) keeps orthogonality.` },
      { fig: String.raw`Step 5: the faint cyan and purple grid is built from \(e_1,e_2\). It covers the same plane as \(v_1,v_2\): every point is reachable from either basis, so the spans agree.`, t: String.raw`The spans agree.`, d: String.raw`\(e_k\in\operatorname{span}(e_1,\dots,e_{k-1},v_k)\subseteq\operatorname{span}(v_1,\dots,v_k)\), and conversely \(v_k=\|u_k\|e_k+\sum_{j\lt k}\langle v_k,e_j\rangle e_j\in\operatorname{span}(e_1,\dots,e_k)\). Both spans have dimension \(k\) (orthonormal \(\Rightarrow\) independent), so they are equal. \(\blacksquare\)` },
    ],
    memorize: {
      formula: String.raw`u_k=v_k-\sum_{j\lt k}\langle v_k,e_j\rangle e_j,\qquad e_k=\frac{u_k}{\|u_k\|}`,
      bullets: [
        String.raw`Geometric meaning: \(u_k\) is \(v_k\) minus its projection onto \(\operatorname{span}(e_1,\dots,e_{k-1})\).`,
        String.raw`Every finite-dimensional inner product space has an orthonormal basis, and any orthonormal list extends to one.`,
        String.raw`Matrix form: \(A=QR\), with \(Q\) orthonormal columns and \(R\) upper triangular with positive diagonal \(\|u_k\|\).`,
      ],
      pitfalls: [
        String.raw`Project onto the <i>normalized</i> \(e_j\). With unnormalized \(u_j\) you must divide by \(\langle u_j,u_j\rangle\).`,
        String.raw`Independence of the input is what guarantees \(u_k\ne0\); on dependent input the algorithm produces a zero vector.`,
        String.raw`The result depends on the order of the \(v_i\), though the flag of spans does not.`,
      ],
    },
  });
})(window.ML);
