"use strict";
/* Infi 2 · Limits & continuity (single variable). Template: js/proofs/linalg2-inner.js (cauchy-schwarz). */
(function (ML) {
  const C = ML.C, fmt = ML.fmt;
  const rect = (v, x0, y0, x1, y1, fill, stroke, w) => v.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], fill, stroke, w || 1.5);
  /** text label on a dark pill so it stays readable on top of the drawing */
  const tag = (v, str, x, y, color, dx = 0, dy = 0, align = "left") => {
    const c = v.ctx; c.font = "700 13px system-ui"; const w = c.measureText(str).width, [px, py] = v.P(x, y);
    const x0 = align === "center" ? px + dx - w / 2 : align === "right" ? px + dx - w : px + dx;
    c.fillStyle = "rgba(11,14,27,.82)"; c.fillRect(x0 - 4, py + dy - 13, w + 8, 18);
    v.text(str, x, y, color, dx, dy, "700 13px system-ui", align);
  };
  const ok = (s) => `<span class="ok">${s}</span>`, bad = (s) => `<span class="no">${s}</span>`;

  /* ====================================================================
     1. lim sin x / x = 1
     ==================================================================== */
  ML.register({
    id: "sinx-over-x-limit",
    course: "infi2",
    topic: "limits",
    title: "The limit sin x / x → 1",
    blurb: "Three nested areas on the unit circle squeeze sin x / x between cos x and 1.",
    statement: String.raw`\(\displaystyle \lim_{x\to 0}\frac{\sin x}{x}=1\) (with \(x\) in radians).`,
    shows: String.raw`The statement itself: on the unit circle the triangle \(OAB\), the sector \(OAB\) and the triangle \(OAT\) are nested, and the graph on the right shows \(\sin x/x\) trapped between \(\cos x\) and \(1\) as \(x\to 0\).`,
    vizIntro: String.raw`<b>Move the slider for the angle \(x\)</b> (the slider stops at \(1\) so that \(T\) stays on screen; the proof works for every \(0\lt x\lt\pi/2\)). Or press <b>Slide x → 0</b> and watch the three curves on the right pinch together at height \(1\).`,

    viz(box) {
      const st = ML.stage(box, { x: [-0.35, 1.6], y: [-0.3, 1.75], aspect: "1 / 1" });
      const S = { x: 0.9, focus: -1, hold: 0 };
      const sl = ML.slider(st.panel, { label: "angle x (radians)", min: 0.03, max: 1, step: 0.01, value: S.x, onInput: (v) => { S.x = v; st.redraw(); } });
      const anim = ML.loop(st, (dt) => {
        if (S.hold > 0) { S.hold -= dt; if (S.hold <= 0) S.x = 1.0; sl.set(S.x); return; }
        S.x *= Math.exp(-0.9 * dt);
        if (S.x <= 0.03) { S.x = 0.03; S.hold = 0.9; }
        sl.set(S.x);
      });
      const playBtn = ML.button(st.panel, "▶ Slide x → 0", () => { anim.running ? anim.stop() : start(); setPlay(); });
      const setPlay = () => { playBtn.textContent = anim.running ? "⏸ Pause" : "▶ Slide x → 0"; };
      const start = () => { if (S.x < 0.08) S.x = 1.0; sl.set(S.x); anim.start(); };
      const graph = st.extra({ x: [-1.6, 1.6], y: [0, 1.15], height: 200 });
      const out = ML.readout(st.panel);

      st.draw((v) => {
        const x = S.x, c = Math.cos(x), s = Math.sin(x), t = Math.tan(x);
        v.grid(0.5); v.axes();
        v.circle(0, 0, 1, "rgba(201,208,245,.4)", null, 1.5);
        const arc = []; for (let i = 0; i <= 40; i++) arc.push([Math.cos(x * i / 40), Math.sin(x * i / 40)]);
        v.poly([[0, 0], [1, 0], [1, t]], "rgba(255,204,77,.16)", C.gold, 2);          // triangle OAT
        v.poly([[0, 0], ...arc], "rgba(108,140,255,.38)", C.blue, 2);                  // sector OAB
        v.poly([[0, 0], [1, 0], [c, s]], "rgba(79,209,165,.55)", C.green, 2);          // triangle OAB
        v.line(0, 0, 1, t, "rgba(255,204,77,.6)", 1.5, [4, 4]);
        v.path((u) => [0.22 * Math.cos(u), 0.22 * Math.sin(u)], 0, x, C.white, 2, 30);
        v.text("x", 0.3 * Math.cos(x / 2), 0.3 * Math.sin(x / 2), C.white, -4, 5);
        v.text("O", 0, 0, C.text, -14, 16); v.text("A", 1, 0, C.text, 6, 16);
        v.text("B", c, s, C.green, -18, -8); v.text("T", 1, t, C.gold, 8, 4);
        v.dot(c, s, C.green, 4); v.dot(1, 0, C.text, 3.5); v.dot(1, t, C.gold, 4);
        v.text("■ triangle OAB", -0.32, 1.7, C.green, 0, 0); v.text("■ sector OAB", -0.32, 1.58, C.blue, 0, 0); v.text("■ triangle OAT", -0.32, 1.46, C.gold, 0, 0);
        if (S.focus === 1) v.text("triangle OAB  ⊂  sector OAB  ⊂  triangle OAT", 0.62, -0.2, C.white, 0, 0, "700 13px system-ui", "center");
        if (S.focus === 2) {
          v.line(c, 0, c, s, C.green, 5); tag(v, "sin x", c, s / 2, C.green, -50, 4);
          v.line(1, 0, 1, t, C.gold, 5); tag(v, "tan x", 1, t / 2, C.gold, 10, 4);
          v.path((u) => [Math.cos(u), Math.sin(u)], 0, x, C.cyan, 5, 40); tag(v, "arc length x", Math.cos(x / 2), Math.sin(x / 2), C.cyan, 34, 0);
        }
      });

      graph.draw((g) => {
        const x = S.x, f = (u) => (Math.abs(u) < 1e-9 ? 1 : Math.sin(u) / u);
        g.grid(0.25); g.axes();
        const dn = [], up = [];
        for (let i = 0; i <= 80; i++) { const u = -1.6 + 3.2 * i / 80; dn.push([u, Math.cos(u)]); up.push([u, 1]); }
        g.poly([...dn, ...up.reverse()], "rgba(108,140,255,.12)", null);
        g.plot(Math.cos, -1.6, 1.6, C.pink, 2);
        g.line(-1.6, 1, 1.6, 1, C.blue, 2);
        g.plot(f, -1.6, 1.6, C.white, 2.5, 400);
        g.dot(0, 1, C.bg, 5, C.white);
        g.text("1", 1.58, 1, C.blue, 0, -6, "700 12px system-ui", "right");
        g.text("cos x", 1.58, Math.cos(1.5), C.pink, 0, -6, "700 12px system-ui", "right");
        g.text("sin x / x", 1.1, f(1.1), C.white, 0, -9, "700 12px system-ui", "center");
        const marks = S.focus === 5 ? [x, -x] : [x];
        marks.forEach((u) => {
          g.line(u, 0, u, 1, C.gold, 1.5, [4, 4]);
          g.dot(u, Math.cos(u), C.pink, 4); g.dot(u, f(u), C.white, 5); g.dot(u, 1, C.blue, 4);
        });
        if (S.focus === 3 || S.focus === 4) g.text("cos x < sin x / x < 1", 0, 0.08, C.gold, 0, 0, "700 12px system-ui", "center");
        if (S.focus === 5) g.text("even function: the left half mirrors the right", 0, 0.08, C.gold, 0, 0, "700 12px system-ui", "center");
      });

      st.after = () => {
        const x = S.x, c = Math.cos(x), s = Math.sin(x), t = Math.tan(x);
        out([
          ["sin x  <  x  <  tan x", `${fmt(s, 4)} < ${fmt(x, 4)} < ${fmt(t, 4)} ` + ok("✓")],
          ["areas  ½ sin x, ½ x, ½ tan x", `${fmt(s / 2, 4)}, ${fmt(x / 2, 4)}, ${fmt(t / 2, 4)}`],
          ["cos x  <  sin x / x  <  1", `${fmt(c, 5)} < ${fmt(s / x, 5)} < 1 ` + ok("✓")],
          ["1 − sin x / x", fmt(1 - s / x, 6)],
        ], "As x shrinks, cos x → 1, so the middle term has no room: it is squeezed to 1.");
      };

      st.redraw();
      return {
        showStep(i) {
          S.focus = i;
          if (i === 4) { if (!anim.running) start(); } else anim.stop();
          setPlay(); st.redraw();
        },
      };
    },

    idea: String.raw`Compare three areas on the unit circle: \(\triangle OAB\subset\) sector \(\subset\triangle OAT\). That gives \(\sin x\lt x\lt\tan x\), i.e. \(\cos x\lt\frac{\sin x}{x}\lt 1\), and the squeeze theorem finishes the job.`,
    steps: [
      { fig: String.raw`The unit circle with the angle \(x\), the points \(A=(1,0)\), \(B=(\cos x,\sin x)\) and \(T=(1,\tan x)\) on the tangent line at \(A\).`,
        t: String.raw`Setup: take \(0\lt x\lt \pi/2\).`,
        d: String.raw`Let \(A=(1,0)\), \(B=(\cos x,\sin x)\) on the unit circle, and let \(T=(1,\tan x)\) be the point where the ray \(OB\) meets the tangent line \(\{x=1\}\) at \(A\).` },
      { fig: String.raw`The three regions drawn nested: the green triangle \(OAB\) sits inside the blue sector \(OAB\), which sits inside the gold triangle \(OAT\).`,
        t: String.raw`The three regions are nested: \(\triangle OAB\ \subset\ \text{sector }OAB\ \subset\ \triangle OAT\).`,
        d: String.raw`The chord \(AB\) lies inside the disc, so the triangle is inside the sector. The disc lies in \(\{x\le 1\}\) (left of the tangent line) and between the rays \(OA\), \(OT\), so the sector is inside the triangle \(OAT\).` },
      { fig: String.raw`The three lengths that give the areas: \(\sin x\) (green segment, height of \(B\)), the arc length \(x\) (cyan) and \(\tan x\) (gold segment \(AT\)).`,
        t: String.raw`Compute the areas.`,
        d: String.raw`\(\operatorname{area}(OAB)=\tfrac12\cdot 1\cdot\sin x\); \(\operatorname{area}(\text{sector})=\tfrac12 x\) (the fraction \(\frac{x}{2\pi}\) of the disc of area \(\pi\)); \(\operatorname{area}(OAT)=\tfrac12\cdot1\cdot\tan x\). Area is monotone under inclusion, hence \(\ \tfrac12\sin x\lt\tfrac12 x\lt\tfrac12\tan x\).` },
      { fig: String.raw`The graph on the right: at the gold vertical line, \(\cos x\) (pink), \(\sin x/x\) (white) and \(1\) (blue) appear in this order from bottom to top.`,
        t: String.raw`Divide by \(\sin x\gt0\) and invert.`,
        d: String.raw`\(\sin x\lt x\lt\tan x\ \Rightarrow\ 1\lt\dfrac{x}{\sin x}\lt\dfrac1{\cos x}\ \Rightarrow\ \cos x\lt\dfrac{\sin x}{x}\lt 1\) for all \(0\lt x\lt\pi/2\).` },
      { fig: String.raw`Animation: \(x\) slides to \(0\); the pink and blue curves close in on the white one, which is forced to height \(1\).`,
        t: String.raw`Squeeze theorem (right-hand limit).`,
        d: String.raw`\(\cos\) is continuous at \(0\), so \(\lim_{x\to0^+}\cos x=\cos0=1\), and \(\lim_{x\to0^+}1=1\). The middle function lies between them, hence \(\lim_{x\to0^+}\frac{\sin x}{x}=1\).` },
      { fig: String.raw`The graph of \(\sin x/x\) is symmetric about the \(y\)-axis: the gold marker at \(x\) is mirrored at \(-x\) with the same height.`,
        t: String.raw`Left-hand limit by evenness.`,
        d: String.raw`\(\dfrac{\sin(-x)}{-x}=\dfrac{\sin x}{x}\), so the left-hand limit at \(0\) equals the right-hand limit. Both one-sided limits are \(1\), therefore \(\lim_{x\to0}\frac{\sin x}{x}=1\). \(\blacksquare\)` },
    ],
    memorize: {
      formula: String.raw`\lim_{x\to0}\frac{\sin x}{x}=1\qquad \cos x\lt\frac{\sin x}{x}\lt 1\ \ (0\lt x\lt\tfrac\pi2)`,
      bullets: [
        String.raw`Picture to remember: <b>triangle \(OAB\) &lt; sector &lt; triangle \(OAT\)</b>, with areas \(\frac12\sin x,\ \frac12x,\ \frac12\tan x\).`,
        String.raw`Then divide by \(\sin x\) and squeeze with \(\cos x\to1\).`,
        String.raw`Consequences: \(\frac{\tan x}{x}\to1\), \(\frac{1-\cos x}{x^2}\to\frac12\), and \((\sin x)'=\cos x\).`,
      ],
      pitfalls: [
        String.raw`Radians only: the sector area \(\frac12x\) needs \(x\) in radians (in degrees the limit is \(\pi/180\)).`,
        String.raw`Do not prove it with L'Hôpital: that uses \((\sin x)'=\cos x\), whose proof already needs this limit (circular).`,
        String.raw`Do the case \(x\lt0\) too (evenness) before concluding a two-sided limit.`,
      ],
    },
  });

  /* ====================================================================
     2. epsilon-delta for x^2
     ==================================================================== */
  ML.register({
    id: "epsilon-delta-x-squared",
    course: "infi2",
    topic: "limits",
    title: "ε–δ proof that lim x² = a²",
    blurb: "Find δ = min(1, ε / (2|a|+1)) by controlling the factor |x + a|.",
    statement: String.raw`For every \(a\in\mathbb R\): \(\displaystyle\lim_{x\to a}x^2=a^2\), i.e. \(\forall\varepsilon\gt0\ \exists\delta\gt0\ \forall x\ \big(|x-a|\lt\delta\Rightarrow|x^2-a^2|\lt\varepsilon\big)\).`,
    shows: String.raw`The definition of the limit for \(f(x)=x^2\): the gold band \(L\pm\varepsilon\) around \(L=a^2\), and the green window \(a\pm\delta\) whose part of the graph must stay inside the band.`,
    vizIntro: String.raw`<b>Choose \(a\) and \(\varepsilon\).</b> The window \(\delta\) is computed by the formula from the proof. The graph above the window is green when it stays inside the band and red when it escapes. Try <b>naive δ = ε</b> to see why the formula needs the extra pieces.`,

    viz(box) {
      const st = ML.stage(box, { x: [-4.5, 4.5], y: [-1.5, 13], equal: false, aspect: "1 / 1" });
      const S = { a: 1.0, eps: 1.0, s: 0.7, bad: false, focus: -1 };
      const dGood = () => Math.min(1, S.eps / (2 * Math.abs(S.a) + 1));
      const delta = () => (S.bad ? S.eps : dGood());
      // steps 2-5 zoom in around (a, L) so the small gaps become visible
      const zoomed = () => S.focus >= 1 && S.focus <= 4;
      const setView = () => {
        const L = S.a * S.a;
        if (zoomed()) { const H = Math.max(1.6, 1.5 * S.eps); st.view.o.x = [S.a - 1.7, S.a + 1.7]; st.view.o.y = [L - H, L + H]; }
        else { st.view.o.x = [-4.5, 4.5]; st.view.o.y = [-1.5, 13]; }
      };
      const redraw = () => { setView(); st.redraw(); };
      ML.slider(st.panel, { label: "a (the point)", min: -3, max: 3, step: 0.1, value: S.a, onInput: (v) => { S.a = v; redraw(); } });
      ML.slider(st.panel, { label: "ε (the tolerance)", min: 0.1, max: 3, step: 0.05, value: S.eps, onInput: (v) => { S.eps = v; redraw(); } });
      ML.slider(st.panel, { label: "test point: x = a + s·δ,  s", min: -1, max: 1, step: 0.05, value: S.s, onInput: (v) => { S.s = v; redraw(); } });
      const badBtn = ML.button(st.panel, "Use naive δ = ε", () => { S.bad = !S.bad; setBad(); redraw(); });
      const setBad = () => { badBtn.textContent = S.bad ? "Use the correct δ" : "Use naive δ = ε"; };
      const out = ML.readout(st.panel);

      st.draw((v) => {
        const { a, eps } = S, L = a * a, d = delta(), [[xa, ya], [xb, yb]] = v.visible();
        const f = (x) => x * x, big = "700 12px system-ui";
        v.grid(zoomed() ? 0.5 : 1); v.axes();
        rect(v, xa, L - eps, xb, L + eps, "rgba(255,204,77,.14)");
        v.line(xa, L + eps, xb, L + eps, C.gold, 1.5, [6, 4]); v.line(xa, L - eps, xb, L - eps, C.gold, 1.5, [6, 4]); v.line(xa, L, xb, L, C.gold, 1, [2, 4]);
        v.text("L + ε", xb, L + eps, C.gold, -4, -5, big, "right"); v.text("L − ε", xb, L - eps, C.gold, -4, 14, big, "right"); v.text("L = a²", xb, L, C.gold, -4, -5, big, "right");
        rect(v, a - d, ya, a + d, yb, "rgba(79,209,165,.13)");
        v.line(a - d, ya, a - d, yb, C.green, 1.5, [6, 4]); v.line(a + d, ya, a + d, yb, C.green, 1.5, [6, 4]);
        v.text("a − δ", a - d, ya, C.green, -3, -8, big, "right"); v.text("a + δ", a + d, ya, C.green, 3, -8, big);
        v.plot(f, xa, xb, C.blue, 2.5);
        // the part of the graph over the window: green inside the band, red outside
        const N = 160;
        for (let i = 0; i < N; i++) {
          const x0 = a - d + 2 * d * i / N, x1 = a - d + 2 * d * (i + 1) / N, inside = Math.abs(f((x0 + x1) / 2) - L) < eps;
          v.line(x0, f(x0), x1, f(x1), inside ? C.green : C.red, 5);
        }
        v.dot(a, L, C.white, 5); if (S.focus !== 1) v.text("(a, L)", a, L, C.white, 8, -10, big);
        if (zoomed()) v.text("zoomed in around (a, L)", xa, ya, C.dim, 6, -8, "600 11px system-ui");
        // test point
        const xt = a + S.s * d, yt = f(xt);
        v.dot(xt, yt, C.white, 5, C.bg);
        if (S.focus === 0) {
          v.arrow(xb - 0.6, L, xb - 0.6, L + eps, C.gold, 3); v.arrow(xb - 0.6, L, xb - 0.6, L - eps, C.gold, 3);
          v.text("ε", xb - 0.6, L + eps / 2, C.gold, -14, 4, "700 14px system-ui"); v.text("ε", xb - 0.6, L - eps / 2, C.gold, -14, 4, "700 14px system-ui");
          v.text("goal: every graph point over the green window lies in the gold band", 0, yb, C.text, 0, 18, big, "center");
        }
        if (S.focus === 1) {
          v.line(a, 0, xt, 0, C.green, 5); tag(v, "|x − a|", (a + xt) / 2, 0, C.green, 0, 24, "center");
          v.line(xt, L, xt, yt, C.white, 5); tag(v, "|x² − a²|", xt, (L + yt) / 2, C.white, 12, 4);
          tag(v, "|x² − a²| = |x − a| · |x + a|", a, yb, C.text, 0, 20, "center");
        }
        if (S.focus === 2) {
          v.line(a - 1, ya, a - 1, yb, C.cyan, 1.5, [3, 5]); v.line(a + 1, ya, a + 1, yb, C.cyan, 1.5, [3, 5]);
          v.text("a − 1", a - 1, yb, C.cyan, -3, 16, big, "right"); v.text("a + 1", a + 1, yb, C.cyan, 3, 16, big);
          tag(v, `inside |x − a| < 1:  |x + a| < 2|a| + 1 = ${fmt(2 * Math.abs(a) + 1)}`, a, yb, C.cyan, 0, 40, "center");
        }
        if (S.focus === 3) v.text(`δ = min(1, ε/(2|a|+1)) = ${fmt(dGood(), 3)}`, a, ya, C.green, 0, -26, "700 13px system-ui", "center");
        if (S.focus === 4) {
          [[a - d, "a − δ"], [a + d, "a + δ"]].forEach(([x]) => {
            v.line(xa, f(x), x, f(x), "rgba(255,255,255,.55)", 1.5, [3, 4]); v.dot(x, f(x), C.white, 5, C.green);
            v.text(`f = ${fmt(f(x))}`, xa, f(x), C.white, 4, -5, big);
          });
        }
        if (S.focus === 5) v.text(S.bad ? "naive δ = ε: the red part of the graph escapes the band" : "correct δ: no red", 0, yb, C.red, 0, 18, "700 13px system-ui", "center");
      });

      st.after = () => {
        const { a, eps } = S, L = a * a, d = delta(), xt = a + S.s * d;
        let mx = 0; for (let i = 1; i < 400; i++) { const x = a - d + 2 * d * i / 400; mx = Math.max(mx, Math.abs(x * x - L)); }
        const good = mx < eps;
        out([
          ["L = a²", fmt(L, 3)],
          ["δ from the proof", `min(1, ${fmt(eps, 2)}/${fmt(2 * Math.abs(a) + 1, 2)}) = ${fmt(dGood(), 4)}`],
          ["δ used", fmt(d, 4) + (S.bad ? "  (naive δ = ε)" : "")],
          ["test point x", fmt(xt, 3)],
          ["|x − a| · |x + a|", `${fmt(Math.abs(xt - a), 3)} · ${fmt(Math.abs(xt + a), 3)} = ${fmt(Math.abs(xt * xt - L), 3)}`],
          ["bound on |x + a|", `${fmt(Math.abs(xt + a), 3)} < 2|a|+1 = ${fmt(2 * Math.abs(a) + 1, 3)}` + (d <= 1 ? "" : "  (needs δ ≤ 1)")],
          ["max |x² − a²| over the open window", `${fmt(mx, 3)}  ` + (good ? ok(`< ε = ${fmt(eps, 2)} ✓`) : bad(`≥ ε = ${fmt(eps, 2)} ✗`))],
        ]);
      };

      st.redraw();
      return {
        showStep(i) {
          S.focus = i; S.bad = i === 5; setBad(); redraw();
        },
      };
    },

    idea: String.raw`Factor \(|x^2-a^2|=|x-a|\,|x+a|\). Force \(|x-a|\lt1\) so that \(|x+a|\lt2|a|+1\) is bounded, then make \(|x-a|\) small enough to beat that bound: \(\delta=\min\{1,\varepsilon/(2|a|+1)\}\).`,
    steps: [
      { fig: String.raw`The target: the gold band \(L\pm\varepsilon\) is given; you must find the green window \(a\pm\delta\) so that the graph above it stays inside the band. Change \(\varepsilon\) and \(a\).`,
        t: String.raw`Fix \(\varepsilon\gt0\). We must find \(\delta\gt0\) with \(|x-a|\lt\delta\Rightarrow|x^2-a^2|\lt\varepsilon\).`,
        d: String.raw`The order of quantifiers matters: \(\delta\) may depend on \(\varepsilon\) and on \(a\), never on \(x\).` },
      { fig: String.raw`At the white test point: the horizontal gap \(|x-a|\) (green, on the axis) and the vertical gap \(|x^2-a^2|\) (white). The second is the product of two factors.`,
        t: String.raw`Scratch work: factor the difference.`,
        d: String.raw`\(|x^2-a^2|=|x-a|\cdot|x+a|\). We control \(|x-a|\) through \(\delta\), but \(|x+a|\) is not small, so we must bound it.` },
      { fig: String.raw`The cyan lines \(a\pm1\): if the window is no wider than \(1\), every \(x\) in it satisfies \(|x+a|\lt2|a|+1\). The readout compares \(|x+a|\) with this bound at the test point.`,
        t: String.raw`Bound the second factor by asking \(\delta\le 1\).`,
        d: String.raw`If \(|x-a|\lt1\) then \(|x+a|=|(x-a)+2a|\le|x-a|+2|a|\lt 1+2|a|\).` },
      { fig: String.raw`The green window now has half-width exactly \(\delta=\min\{1,\varepsilon/(2|a|+1)\}\); all of the graph over it is green (inside the band).`,
        t: String.raw`Choose \(\delta=\min\Big\{1,\ \dfrac{\varepsilon}{2|a|+1}\Big\}\gt0\).`,
        d: String.raw`The first entry guarantees step 3, the second makes the product small.` },
      { fig: String.raw`The two extreme heights of the graph over the window, \(f(a-\delta)\) and \(f(a+\delta)\), drawn with dotted lines to the \(y\)-axis: both lie between \(L-\varepsilon\) and \(L+\varepsilon\).`,
        t: String.raw`Verify. Let \(|x-a|\lt\delta\).`,
        d: String.raw`Then \(|x-a|\lt1\), so \(|x+a|\lt2|a|+1\), and \(|x^2-a^2|=|x-a||x+a|\lt\delta\,(2|a|+1)\le\dfrac{\varepsilon}{2|a|+1}(2|a|+1)=\varepsilon\).` },
      { fig: String.raw`Naive choice \(\delta=\varepsilon\): the window is too wide and the red part of the graph leaves the band. This is why the formula needs the factor \(2|a|+1\).`,
        t: String.raw`Conclusion, and why the naive \(\delta=\varepsilon\) fails.`,
        d: String.raw`Since \(\varepsilon\gt0\) was arbitrary, \(\lim_{x\to a}x^2=a^2\). \(\blacksquare\) With \(\delta=\varepsilon\) one gets \(|x-a||x+a|\lt\varepsilon\,(2|a|+\varepsilon)\), which can exceed \(\varepsilon\) (e.g. \(a=1,\ \varepsilon=1,\ x=1.9\)).` },
    ],
    memorize: {
      formula: String.raw`\forall\varepsilon\gt0\ \exists\delta\gt0:\ |x-a|\lt\delta\Rightarrow|x^2-a^2|\lt\varepsilon,\qquad \delta=\min\Big\{1,\frac{\varepsilon}{2|a|+1}\Big\}`,
      bullets: [
        String.raw`<b>Recipe:</b> (1) factor, (2) bound the extra factor by restricting to \(|x-a|\lt1\), (3) choose \(\delta\) as the minimum of the restrictions.`,
        String.raw`Do the scratch work <i>backwards</i> from \(|f(x)-L|\lt\varepsilon\), then write the proof <i>forwards</i> from \(|x-a|\lt\delta\).`,
        String.raw`\(\delta\) depends on \(a\): as \(|a|\) grows, \(\delta\) shrinks (this is why \(x^2\) is not uniformly continuous on \(\mathbb R\)).`,
      ],
      pitfalls: [
        String.raw`Forgetting the \(\min\{1,\dots\}\): without \(\delta\le1\) the factor \(|x+a|\) is not bounded.`,
        String.raw`Letting \(\delta\) depend on \(x\): the quantifier is \(\exists\delta\,\forall x\), never the other way round.`,
        String.raw`Writing only the scratch work: the exam wants the final forward verification.`,
      ],
    },
  });

  /* ====================================================================
     3. Intermediate Value Theorem
     ==================================================================== */
  ML.register({
    id: "intermediate-value-theorem",
    course: "infi2",
    topic: "limits",
    title: "Intermediate Value Theorem",
    blurb: "Bisect [a,b] keeping a sign change; the nested intervals trap a point c with f(c) = y₀.",
    statement: String.raw`Let \(f:[a,b]\to\mathbb R\) be continuous and \(f(a)\lt y_0\lt f(b)\). Then there is \(c\in(a,b)\) with \(f(c)=y_0\).`,
    shows: String.raw`The proof by bisection: the graph of \(f\), the level \(y_0\) (gold), and the nested intervals \([a_n,b_n]\) with \(f(a_n)\lt y_0\lt f(b_n)\) shrinking to a point \(c\). Choose the discontinuous example to see the theorem fail.`,
    vizIntro: String.raw`<b>Pick a function, then move the slider \(n\)</b> (or press Play) to bisect. The pink point is \((a_n,f(a_n))\) below the gold level, the green point is \((b_n,f(b_n))\) above it. The lower graph stacks the intervals: each row is half as long as the row above.`,

    viz(box) {
      const f1 = (x) => x * x * x - 3 * x, f2 = (x) => Math.sin(3 * x) + x / 2, f3 = (x) => x * x - 2, f4 = (x) => (x < 1 ? x : x + 2);
      const EX = [
        { name: "x³ − 3x on [−2.5, 2.5], y₀ = 1", f: f1, pieces: [[-2.5, 2.5, f1]], a: -2.5, b: 2.5, y0: 1, y: [-10, 10], grid: 2 },
        { name: "sin 3x + x/2 on [0, 4], y₀ = 1", f: f2, pieces: [[0, 4, f2]], a: 0, b: 4, y0: 1, y: [-1.4, 2.8], grid: 1 },
        { name: "x² − 2 on [0, 3], y₀ = 0  (finds √2)", f: f3, pieces: [[0, 3, f3]], a: 0, b: 3, y0: 0, y: [-3, 8], grid: 1 },
        { name: "DISCONTINUOUS: jump over y₀ = 1.5", f: f4, pieces: [[0, 1, (x) => x], [1, 2, (x) => x + 2]], a: 0, b: 2, y0: 1.5, y: [-0.5, 4.5], grid: 0.5, jump: [1, 1, 3] },
      ];
      const st = ML.stage(box, { x: [-1, 1], y: [-1, 1], equal: false, aspect: "4 / 3" });
      const S = { ex: 0, userEx: 0, n: 5, nf: 5, focus: -1, seq: [] };
      const MAXN = 25;

      function build() {
        const e = EX[S.ex]; let a = e.a, b = e.b, hit = false; const seq = [{ a, b }];
        for (let n = 0; n < 40; n++) {
          if (!hit) {
            const m = (a + b) / 2, fm = e.f(m);
            if (Math.abs(fm - e.y0) < 1e-12) { a = b = m; hit = true; } else if (fm < e.y0) a = m; else b = m;
          }
          seq.push({ a, b });
        }
        S.seq = seq; const w = e.b - e.a;
        st.view.o.x = [e.a - 0.08 * w, e.b + 0.08 * w]; st.view.o.y = e.y;
      }
      const sel = ML.select(st.panel, { label: "Function", options: EX.map((e, i) => [i, e.name]), onChange: (v) => { S.userEx = S.ex = +v; build(); st.redraw(); } });
      const setEx = (i) => { S.ex = i; sel.value = String(i); build(); };
      const sl = ML.slider(st.panel, { label: "bisection step n", min: 0, max: MAXN, step: 1, value: S.n, fmt: (v) => String(v), onInput: (v) => { S.n = S.nf = v; st.redraw(); } });
      const anim = ML.loop(st, (dt) => {
        S.nf += 3 * dt; S.n = Math.min(MAXN, Math.floor(S.nf)); sl.set(S.n);
        if (S.n >= MAXN) { setPlay(); return false; }
      });
      const playBtn = ML.button(st.panel, "▶ Bisect", () => { if (anim.running) anim.stop(); else { if (S.n >= MAXN) S.n = S.nf = 0; sl.set(S.n); anim.start(); } setPlay(); });
      const setPlay = () => { playBtn.textContent = anim.running ? "⏸ Pause" : "▶ Bisect"; };
      const ribbon = st.extra({ x: [0, 1], y: [-6, 1], height: 190 });
      const out = ML.readout(st.panel);
      build();

      st.draw((v) => {
        const e = EX[S.ex], n = S.n, q = S.seq[n], [[xa, ya], [xb, yb]] = v.visible();
        v.grid(e.grid); v.axes();
        v.line(xa, e.y0, xb, e.y0, C.gold, 2, [8, 5]); v.text(`level y₀ = ${e.y0}`, xb, e.y0, C.gold, -6, -7, "700 12px system-ui", "right");
        rect(v, q.a, ya, q.b, yb, "rgba(108,140,255,.13)", C.blue, 1.2);
        e.pieces.forEach(([x0, x1, fn]) => v.plot(fn, x0, x1, C.cyan, 2.5, 300));
        if (e.jump) { v.dot(e.jump[0], e.jump[1], C.bg, 5, C.cyan); v.dot(e.jump[0], e.jump[2], C.cyan, 5); }
        for (let k = 0; k <= n; k++) { v.dot(S.seq[k].a, e.f(S.seq[k].a), "rgba(255,107,139,.55)", 3); v.dot(S.seq[k].b, e.f(S.seq[k].b), "rgba(79,209,165,.55)", 3); }
        const fa = e.f(q.a), fb = e.f(q.b), c = (q.a + q.b) / 2;
        v.dot(q.a, fa, C.pink, 6); v.dot(q.b, fb, C.green, 6);
        v.text(`a${sub(n)}`, q.a, fa, C.pink, -4, 20, "700 13px system-ui", "center"); v.text(`b${sub(n)}`, q.b, fb, C.green, 4, -12, "700 13px system-ui", "center");
        if (S.focus === 0) { v.text("f(a) < y₀ < f(b)", xa, yb, C.text, 6, 18, "700 13px system-ui"); }
        if (S.focus === 1 || S.focus === 2) {
          const m = c, fm = e.f(m);
          v.line(m, ya, m, yb, "rgba(255,255,255,.7)", 1.5, [4, 4]); v.dot(m, fm, C.white, 5, C.bg);
          v.text("m = midpoint", m, ya, C.white, 4, -8, "700 12px system-ui");
          v.text(fm < e.y0 ? "f(m) < y₀" : "f(m) > y₀", m, fm, C.white, 8, fm < e.y0 ? 18 : -10, "700 12px system-ui");
          const nx = S.seq[Math.min(n + 1, 40)];
          if (S.focus === 1) { rect(v, nx.a, ya, nx.b, yb, "rgba(79,209,165,.16)", C.green, 2); v.text("keep this half (sign change survives)", (nx.a + nx.b) / 2, yb, C.green, 0, 18, "700 12px system-ui", "center"); }
        }
        if (S.focus >= 3 || n >= 20) {
          v.line(c, ya, c, yb, C.gold, 2, [3, 4]); v.dot(c, e.f(c), C.gold, 5); v.text("c", c, ya, C.gold, 6, -8, "700 14px system-ui");
        }
        if (S.focus === 4) {
          v.line(xa, fa, q.a, fa, C.pink, 1.5, [3, 4]); v.line(xa, fb, q.b, fb, C.green, 1.5, [3, 4]);
          v.text("f(aₙ) < y₀ ≤ f(bₙ), both → f(c)", xa, yb, C.gold, 6, 18, "700 13px system-ui");
        }
        if (S.focus === 5) v.text("jump at c: f(aₙ) → 1 but f(bₙ) = 3, no point has f = y₀", xa, yb, C.red, 6, 18, "700 13px system-ui");
      });
      function sub(n) { return "ₙ"; }

      ribbon.draw((g) => {
        const e = EX[S.ex], n = S.n, rows = Math.max(n, 6);
        g.o.x = st.view.o.x; g.o.y = [-(rows + 0.9), 0.9]; g.begin();
        for (let k = 0; k <= n; k++) {
          const r = S.seq[k], y = -k;
          rect(g, r.a, y - 0.32, r.b, y + 0.32, k === n ? "rgba(255,204,77,.55)" : "rgba(108,140,255,.35)");
          g.dot(r.a, y, C.pink, 2.5); g.dot(r.b, y, C.green, 2.5);
        }
        g.text("n = 0:  [a, b]", st.view.o.x[0], 0, C.dim, 4, 12, "600 11px system-ui");
        if (n > 0) g.text(`n = ${n}`, st.view.o.x[0], -n, C.gold, 4, -5, "600 11px system-ui");
      });

      st.after = () => {
        const e = EX[S.ex], n = S.n, q = S.seq[n], c = (q.a + q.b) / 2, w = q.b - q.a, fc = e.f(c), done = w < 1e-4 * (e.b - e.a);
        out([
          ["n", String(n)],
          ["aₙ,  f(aₙ)", `${fmt(q.a, 6)},  ${fmt(e.f(q.a), 4)}  ${e.f(q.a) < e.y0 ? ok("< y₀ ✓") : bad("")}`],
          ["bₙ,  f(bₙ)", `${fmt(q.b, 6)},  ${fmt(e.f(q.b), 4)}  ${e.f(q.b) >= e.y0 ? ok("≥ y₀ ✓") : bad("")}`],
          ["length bₙ − aₙ", `${fmt(w, 8)} = ${fmt(e.b - e.a, 1)} / 2^${n}`],
          ["c ≈ (aₙ + bₙ)/2", fmt(c, 6)],
          ["f(c)", done ? (Math.abs(fc - e.y0) < 1e-3 ? ok(`${fmt(fc, 5)} ≈ y₀ ✓`) : bad(e.jump ? `f jumps at c: f(aₙ) → ${fmt(e.jump[1])} but f(bₙ) = ${fmt(e.jump[2])}; no point has f = y₀` : `${fmt(fc, 4)} ≠ y₀ = ${e.y0}`)) : `${fmt(fc, 4)}  (keep bisecting)`],
        ]);
      };

      st.redraw();
      return {
        showStep(i) {
          anim.stop(); setPlay(); S.focus = i;
          if (i === 5) setEx(3); else setEx(S.userEx);
          if (i === -1) { /* keep n */ } else if (i === 0) S.n = S.nf = 0;
          else if (i === 1) S.n = S.nf = 0;
          else if (i === 2) { S.n = S.nf = 0; anim.start(); setPlay(); }
          else S.n = S.nf = MAXN;
          sl.set(S.n); st.redraw();
        },
      };
    },

    idea: String.raw`Bisect \([a,b]\) again and again, always keeping the half where \(f\) is below \(y_0\) on the left end and above on the right end. The nested intervals shrink to one point \(c\), and continuity forces \(f(c)\le y_0\) and \(f(c)\ge y_0\).`,
    steps: [
      { fig: String.raw`The graph on \([a,b]\), the gold level \(y_0\), the left end below it (pink point) and the right end above it (green point).`,
        t: String.raw`Set \(a_0=a,\ b_0=b\), so \(f(a_0)\lt y_0\lt f(b_0)\).`,
        d: String.raw`Invariant to maintain: \(f(a_n)\lt y_0\le f(b_n)\) and \(b_n-a_n=\dfrac{b-a}{2^n}\).` },
      { fig: String.raw`One bisection: the midpoint \(m\) is tested against the level; the shaded green half-interval is the one that keeps a pink point below and a green point above \(y_0\).`,
        t: String.raw`Bisect. Let \(m=\frac{a_n+b_n}2\).`,
        d: String.raw`If \(f(m)\lt y_0\) put \(a_{n+1}=m,\ b_{n+1}=b_n\). Otherwise put \(a_{n+1}=a_n,\ b_{n+1}=m\) (if \(f(m)=y_0\) we are already done). The invariant is preserved.` },
      { fig: String.raw`Animation: the stack of nested intervals on the lower graph. Each row is the half of the row above, so the lengths are \((b-a)/2^n\).`,
        t: String.raw`Nested intervals: \([a_{n+1},b_{n+1}]\subset[a_n,b_n]\), with length \((b-a)/2^n\to0\).`,
        d: String.raw`Repeating step 2 gives a sequence of nested closed intervals whose lengths tend to \(0\).` },
      { fig: String.raw`The pink left endpoints climb, the green right endpoints descend, and both converge to the gold line at \(c\).`,
        t: String.raw`The endpoints converge to a common point \(c\in[a,b]\).`,
        d: String.raw`\((a_n)\) is increasing and bounded above by \(b\), \((b_n)\) is decreasing and bounded below by \(a\); both converge, and \(b_n-a_n\to0\) forces the same limit \(c\).` },
      { fig: String.raw`The heights \(f(a_n)\) (pink dots, always below the gold level) and \(f(b_n)\) (green dots, always at or above it) both converge to \(f(c)\), so \(f(c)\) is squeezed onto the level \(y_0\).`,
        t: String.raw`Use continuity at \(c\).`,
        d: String.raw`\(f(a_n)\to f(c)\) and \(f(a_n)\lt y_0\) give \(f(c)\le y_0\). Also \(f(b_n)\to f(c)\) and \(f(b_n)\ge y_0\) give \(f(c)\ge y_0\). Hence \(f(c)=y_0\), and \(c\ne a,b\) because \(f(a)\lt y_0\lt f(b)\). \(\blacksquare\)` },
      { fig: String.raw`The discontinuous example: the intervals still shrink to \(c=1\), but \(f(a_n)\to1\) while \(f(b_n)=3\). The jump skips the level \(1.5\) and no point has \(f=y_0\).`,
        t: String.raw`Why continuity is needed.`,
        d: String.raw`The argument breaks exactly at step 5: without continuity \(f(a_n)\) and \(f(b_n)\) need not converge to the same value, so nothing forces \(f(c)=y_0\).` },
    ],
    memorize: {
      formula: String.raw`f\in C[a,b],\ f(a)\lt y_0\lt f(b)\ \Longrightarrow\ \exists c\in(a,b):\ f(c)=y_0`,
      bullets: [
        String.raw`<b>Bisection:</b> keep the half with \(f(a_n)\lt y_0\le f(b_n)\); the intervals have length \((b-a)/2^n\).`,
        String.raw`Continuity at \(c\): the two sequences \(f(a_n)\lt y_0\) and \(f(b_n)\ge y_0\) have the same limit \(f(c)\), so \(f(c)=y_0\).`,
        String.raw`Corollary: a continuous function maps an interval onto an interval; every odd-degree polynomial has a real root.`,
      ],
      pitfalls: [
        String.raw`\(c\) need not be unique (see \(x^3-3x\)); bisection finds <i>one</i> of them.`,
        String.raw`The theorem fails on \(\mathbb Q\) or without continuity: you must name the step where continuity is used.`,
        String.raw`The interval must be closed and connected: \(f(x)=1/x\) on \([-1,1]\setminus\{0\}\) changes sign without a root.`,
      ],
    },
  });

  /* ====================================================================
     4. Extreme Value Theorem
     ==================================================================== */
  ML.register({
    id: "extreme-value-theorem",
    course: "infi2",
    topic: "limits",
    title: "Extreme Value Theorem (Weierstrass)",
    blurb: "A continuous function on a closed interval is bounded and attains its max and min, via Bolzano–Weierstrass.",
    statement: String.raw`If \(f:[a,b]\to\mathbb R\) is continuous, then \(f\) is bounded and there are \(x_{\min},x_{\max}\in[a,b]\) with \(f(x_{\min})\le f(x)\le f(x_{\max})\) for all \(x\in[a,b]\).`,
    shows: String.raw`The proof for the maximum: a sequence \(x_n\) whose heights approach the supremum \(M\) (gold line), a convergent subsequence found by bisecting the interval, and its limit \(x^*\) where \(f(x^*)=M\). Four counterexamples show that each hypothesis is needed.`,
    vizIntro: String.raw`<b>Pick a function</b>, then raise the <b>bisection level k</b> (or press Play). The pink dots are \((x_n,f(x_n))\); at each level the half of the interval holding more terms is kept (lower graph) and the ringed points form the subsequence that squeezes to \(x^*\).`,

    viz(box) {
      const N = 60, K = 10;
      const mulberry = (seed) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      // maximizer of x sin x on [0,4] by Newton
      let x0 = 2.0; for (let i = 0; i < 30; i++) x0 -= (Math.sin(x0) + x0 * Math.cos(x0)) / (2 * Math.cos(x0) - x0 * Math.sin(x0));
      const EX = [
        { name: "x·sin x on [0, 4]  (continuous)", dom: [0, 4], f: (x) => x * Math.sin(x), y: [-3.6, 2.6], pieces: [[0, 4, (x) => x * Math.sin(x)]], M: x0 * Math.sin(x0), star: [x0], cont: true },
        { name: "cos 3x on [0, 4]  (two maximizers)", dom: [0, 4], f: (x) => Math.cos(3 * x), y: [-1.4, 1.6], pieces: [[0, 4, (x) => Math.cos(3 * x)]], M: 1, star: [0, 2 * Math.PI / 3], cont: true },
        { name: "COUNTER: 1/x on (0, 1]  (not closed)", dom: [0, 1], xr: [-0.08, 1.08], f: (x) => 1 / x, y: [0, 12.5], pieces: [[0.08, 1, (x) => 1 / x]], M: Infinity, star: [0], seq: (n) => 1 / n, openL: true, kind: "inv" },
        { name: "COUNTER: x on (0, 1)  (open interval)", dom: [0, 1], xr: [-0.1, 1.1], f: (x) => x, y: [-0.1, 1.25], pieces: [[0, 1, (x) => x]], M: 1, star: [1], seq: (n) => 1 - 1 / (n + 1), openL: true, openR: true, kind: "open" },
        { name: "COUNTER: jump at 1  (not continuous)", dom: [0, 2], xr: [-0.15, 2.15], f: (x) => (x < 1 ? x : 0), y: [-0.3, 1.4], pieces: [[0, 1, (x) => x], [1, 2, () => 0]], M: 1, star: [1], seq: (n) => 1 - 1 / (n + 1), jump: [1, 1, 0], kind: "jump" },
      ];

      function prep(e, idx) {
        if (e.ready) return;
        const xs = [null];
        if (e.seq) { for (let n = 1; n <= N; n++) xs.push(e.seq(n)); }
        else {
          const G = 2001, gx = [], gf = [], rnd = mulberry(11 + idx);
          for (let i = 0; i < G; i++) { gx.push(e.dom[0] + (e.dom[1] - e.dom[0]) * i / (G - 1)); gf.push(e.f(gx[i])); }
          for (let n = 1; n <= N; n++) {
            const cand = []; for (let i = 0; i < G; i++) if (gf[i] >= e.M - 1 / n) cand.push(i);
            xs.push(gx[cand[Math.floor(rnd() * cand.length)]]);
          }
        }
        e.xs = xs;
        let l = e.dom[0], r = e.dom[1], idxs = []; for (let n = 1; n <= N; n++) idxs.push(n);
        e.lv = [{ l, r, idx: idxs }];
        for (let k = 1; k <= K; k++) {
          const mid = (l + r) / 2, L = idxs.filter((n) => xs[n] <= mid), R = idxs.filter((n) => xs[n] > mid);
          if (L.length >= R.length) { idxs = L; r = mid; } else { idxs = R; l = mid; }
          e.lv.push({ l, r, idx: idxs });
        }
        e.sub = []; let prev = 0;
        for (let k = 0; k <= K; k++) { const nk = e.lv[k].idx.find((n) => n > prev); if (nk === undefined) e.sub.push(null); else { e.sub.push(nk); prev = nk; } }
        e.ready = true;
      }
      const starOf = (e, k) => { const c = (e.lv[k].l + e.lv[k].r) / 2; return e.star.reduce((b, s) => (Math.abs(s - c) < Math.abs(b - c) ? s : b), e.star[0]); };

      const st = ML.stage(box, { x: [-0.2, 4.2], y: [-3.6, 2.6], equal: false, aspect: "4 / 3" });
      const S = { ex: 0, userEx: 0, k: 0, kf: 0, focus: -1 };
      const apply = () => { const e = EX[S.ex]; prep(e, S.ex); st.view.o.x = e.xr || [e.dom[0] - 0.05 * (e.dom[1] - e.dom[0]), e.dom[1] + 0.05 * (e.dom[1] - e.dom[0])]; st.view.o.y = e.y; };
      const sel = ML.select(st.panel, { label: "Function", options: EX.map((e, i) => [i, e.name]), onChange: (v) => { S.userEx = S.ex = +v; apply(); st.redraw(); } });
      const setEx = (i) => { S.ex = i; sel.value = String(i); apply(); };
      const sl = ML.slider(st.panel, { label: "bisection level k", min: 0, max: K, step: 1, value: S.k, fmt: (v) => String(v), onInput: (v) => { S.k = S.kf = v; st.redraw(); } });
      const anim = ML.loop(st, (dt) => {
        S.kf += 1.1 * dt; S.k = Math.min(K, Math.floor(S.kf)); sl.set(S.k);
        if (S.k >= K) { setPlay(); return false; }
      });
      const playBtn = ML.button(st.panel, "▶ Bisect", () => { if (anim.running) anim.stop(); else { if (S.k >= K) S.k = S.kf = 0; sl.set(S.k); anim.start(); } setPlay(); });
      const setPlay = () => { playBtn.textContent = anim.running ? "⏸ Pause" : "▶ Bisect"; };
      const ribbon = st.extra({ x: [0, 1], y: [-6, 1], height: 170 });
      const out = ML.readout(st.panel);
      apply();

      st.draw((v) => {
        const e = EX[S.ex], k = S.k, [[xa, ya], [xb, yb]] = v.visible(), small = "700 12px system-ui";
        v.grid(e.kind === "inv" ? 2 : e.dom[1] <= 2 ? 0.5 : 1); v.axes();
        // closed endpoints
        rect(v, e.dom[0], ya, e.dom[1], yb, "rgba(108,140,255,.06)");
        if (Number.isFinite(e.M)) { v.line(xa, e.M, xb, e.M, C.gold, 1.8, [8, 5]); v.text(`M = sup f = ${fmt(e.M, 3)}`, xb, e.M, C.gold, -6, -7, small, "right"); }
        else v.text("sup f = +∞", xb, yb, C.gold, -6, 16, small, "right");
        e.pieces.forEach(([p0, p1, fn]) => v.plot(fn, p0, p1, C.cyan, 2.5, 300));
        if (e.jump) { v.dot(e.jump[0], e.jump[1], C.bg, 5, C.cyan); v.dot(e.jump[0], e.jump[2], C.cyan, 5); }
        if (e.kind === "open") { v.dot(0, 0, C.bg, 5, C.cyan); v.dot(1, 1, C.bg, 5, C.cyan); }
        if (e.kind === "inv") tag(v, "x = 0 is not in the domain", 0.12, 6, C.dim, 0, 0);
        // the sequence
        for (let n = 1; n <= N; n++) {
          const x = e.xs[n], y = e.f(x), al = 0.25 + 0.6 * (n / N);
          v.dot(x, y, `rgba(255,107,139,${al})`, 3);
          v.line(x, ya, x, ya + 0.04 * (yb - ya), C.pink, 1.5);
        }
        // the subsequence so far
        for (let j = 0; j <= k; j++) { const n = e.sub[j]; if (n != null) v.dot(e.xs[n], e.f(e.xs[n]), C.pink, 5, C.white); }
        // limit point x*
        const showStar = S.focus === 2 || S.focus === 4 || S.focus === 5 || (S.focus === -1 && k >= 3);
        if (showStar) {
          const xs = starOf(e, k);
          v.line(xs, ya, xs, yb, C.gold, 1.8, [3, 4]); v.text("x*", xs, ya, C.gold, 6, -8, "700 14px system-ui");
          if (e.kind === "inv") v.text("x* = 0 ∉ domain", xs, yb, C.red, 6, 34, small);
          else if (e.kind === "open") { v.dot(xs, e.f(xs), C.bg, 6, C.gold); v.text("x* = 1 ∉ (0,1)", xs, yb, C.red, -6, 16, small, "right"); }
          else { v.dot(xs, e.f(xs), C.gold, 6); v.text(`f(x*) = ${fmt(e.f(xs), 3)}`, xs, e.f(xs), C.gold, 8, e.kind === "jump" ? -10 : 18, small); }
          if (e.kind === "jump") v.text("f(x*) = 0 ≠ M = 1", 1, yb, C.red, 8, 18, small);
        }
        if (S.focus === 0) v.text("heights f(xₙ) run off to +∞", 0.4, yb, C.red, 0, 38, small);
        if (S.focus === 3) v.text("heights f(xₙ) → M", xa, yb, C.gold, 6, 18, small);
      });

      ribbon.draw((g) => {
        const e = EX[S.ex], k = S.k, rows = Math.max(k, 5);
        g.o.x = st.view.o.x; g.o.y = [-(rows + 0.9), 0.9]; g.begin();
        for (let j = 0; j <= k; j++) {
          const r = e.lv[j], y = -j;
          rect(g, r.l, y - 0.32, r.r, y + 0.32, j === k ? "rgba(255,204,77,.5)" : "rgba(108,140,255,.35)");
          const n = e.sub[j]; if (n != null) g.dot(e.xs[n], y, C.pink, 3.5, C.white);
        }
        g.text("k = 0:  [a, b]", st.view.o.x[0], 0, C.dim, 4, 12, "600 11px system-ui");
        if (k > 0) g.text(`k = ${k}: half with more terms`, st.view.o.x[0], -k, C.gold, 4, 12, "600 11px system-ui");
      });

      st.after = () => {
        const e = EX[S.ex], k = S.k, n = e.sub[k], xs = starOf(e, k), fx = e.f(xs);
        const rows = [["k", String(k)], ["sup f = M", Number.isFinite(e.M) ? fmt(e.M, 4) : "+∞"]];
        rows.push(["subsequence term", n == null ? "(no more terms)" : `x<sub>n<sub>k</sub></sub> = ${fmt(e.xs[n], 5)},  f = ${fmt(e.f(e.xs[n]), 4)}`]);
        rows.push(["limit x*", fmt(xs, 4)]);
        let note;
        if (e.cont) { rows.push(["f(x*) vs M", ok(`${fmt(fx, 4)} = ${fmt(e.M, 4)} ✓  attained`)]); note = "Continuity at x* gives f(x*) = lim f(x<sub>n<sub>k</sub></sub>) = M."; }
        else if (e.kind === "inv") { rows.push(["f(x*)", bad("x* = 0 is not in the domain ✗")]); note = "The sequence 1/n has a limit, but outside the domain: f is unbounded and has no maximum."; }
        else if (e.kind === "open") { rows.push(["f(x*)", bad("x* = 1 ∉ (0,1) ✗")]); note = "f is bounded, but sup f = 1 is never attained: the open interval is missing its endpoint."; }
        else { rows.push(["f(x*) vs lim f(x<sub>n<sub>k</sub></sub>)", bad(`${fmt(fx, 3)} ≠ 1 ✗`)]); note = "x* is in the interval, but f jumps there: continuity at x* fails, so f(x*) ≠ M."; }
        out(rows, note);
      };

      st.redraw();
      return {
        showStep(i) {
          anim.stop(); setPlay(); S.focus = i;
          const cont = EX[S.userEx].cont ? S.userEx : 0;
          if (i === -1) setEx(S.userEx);
          else if (i === 0) { setEx(2); S.k = 0; }
          else if (i === 1) { setEx(cont); S.k = 8; }
          else if (i === 2) { setEx(2); S.k = 6; }
          else if (i === 3) { setEx(cont); S.k = 0; }
          else if (i === 4) { setEx(cont); S.k = K; }
          else if (i === 5) { setEx(4); S.k = K; }
          S.kf = S.k; sl.set(S.k); st.redraw();
        },
      };
    },

    idea: String.raw`Pick points \(x_n\) whose heights approach the supremum \(M\). Bolzano–Weierstrass gives a subsequence converging to some \(x^*\) in the closed interval, and continuity at \(x^*\) puts \(f(x^*)\) exactly at \(M\).`,
    steps: [
      { fig: String.raw`The scenario that the contradiction must rule out, shown with the counterexample \(1/x\) on \((0,1]\): the points \(x_n=1/n\) have heights \(f(x_n)=n\) running off to \(+\infty\).`,
        t: String.raw`Claim 1: \(f\) is bounded above. Suppose not.`,
        d: String.raw`Then for every \(n\) there is \(x_n\in[a,b]\) with \(f(x_n)\gt n\).` },
      { fig: String.raw`Bisection of the interval: each row keeps the half containing more terms of the sequence; the ringed pink points \(x_{n_k}\) form a subsequence closing in on \(x^*\).`,
        t: String.raw`Bolzano–Weierstrass: a subsequence \(x_{n_k}\to x^*\in[a,b]\).`,
        d: String.raw`The sequence lies in the bounded interval \([a,b]\); bisect, always keeping a half that contains infinitely many terms, and pick one term from each half. The limit \(x^*\) lies in \([a,b]\) because the interval is <b>closed</b>.` },
      { fig: String.raw`For \(1/x\) on \((0,1]\) the same limit \(x^*=0\) is not in the domain, so continuity at \(x^*\) cannot be used. This is exactly where "closed" matters.`,
        t: String.raw`Contradiction.`,
        d: String.raw`By continuity at \(x^*\), \(f(x_{n_k})\to f(x^*)\in\mathbb R\), a convergent sequence. But \(f(x_{n_k})\gt n_k\to\infty\). Hence \(f\) is bounded above, and \(M=\sup f\) is a real number.` },
      { fig: String.raw`A maximizing sequence: the pink dots \((x_n,f(x_n))\) creep up toward the gold line \(M=\sup f\), although the points \(x_n\) themselves jump around.`,
        t: String.raw`Choose \(x_n\in[a,b]\) with \(M-\tfrac1n\lt f(x_n)\le M\).`,
        d: String.raw`Possible by the definition of the supremum. Then \(f(x_n)\to M\). (The \(x_n\) need not converge: in \(\cos3x\) they hop between two maximizers.)` },
      { fig: String.raw`The ringed subsequence converges to \(x^*\); the gold dot \((x^*,f(x^*))\) sits exactly on the gold line \(M\).`,
        t: String.raw`Extract \(x_{n_k}\to x^*\in[a,b]\) and use continuity: \(f(x^*)=M\).`,
        d: String.raw`\(f(x^*)=\lim f(x_{n_k})\) by continuity, and \(\lim f(x_{n_k})=M\) because it is a subsequence of \(f(x_n)\to M\). So \(x_{\max}:=x^*\) attains the maximum.` },
      { fig: String.raw`Counterexample with a jump: \(x_n\to x^*=1\) inside the interval, but \(f(x^*)=0\ne M=1\). Continuity at \(x^*\) is really used; so are closedness (open interval) and boundedness.`,
        t: String.raw`The minimum, and why each hypothesis is needed.`,
        d: String.raw`Apply the maximum case to \(-f\) to get \(x_{\min}\). \(\blacksquare\) Remove "closed": \(x\) on \((0,1)\) has no max. Remove "bounded interval": \(x\) on \([0,\infty)\) is unbounded. Remove continuity: the jump function has no max.` },
    ],
    memorize: {
      formula: String.raw`f\in C[a,b]\ \Rightarrow\ \exists x_{\min},x_{\max}\in[a,b]:\ f(x_{\min})\le f(x)\le f(x_{\max})`,
      bullets: [
        String.raw`<b>Recipe:</b> maximizing sequence \(f(x_n)\to\sup f\) \(\to\) Bolzano–Weierstrass subsequence \(x_{n_k}\to x^*\) \(\to\) continuity gives \(f(x^*)=\sup f\).`,
        String.raw`Boundedness comes first (assume unbounded, take \(f(x_n)\gt n\), contradiction with convergence of \(f(x_{n_k})\)).`,
        String.raw`The minimum is the maximum of \(-f\).`,
      ],
      pitfalls: [
        String.raw`The sequence \(x_n\) itself need not converge: take a <i>sub</i>sequence first (Bolzano–Weierstrass).`,
        String.raw`Say where each hypothesis enters: closed \(\Rightarrow x^*\in[a,b]\); bounded \(\Rightarrow\) B–W; continuous \(\Rightarrow f(x^*)=\lim f(x_{n_k})\).`,
        String.raw`Do not write \(M=f(x^*)\) before proving \(M\) is finite.`,
      ],
    },
  });
})(window.ML);
