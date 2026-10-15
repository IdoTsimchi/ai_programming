"use strict";
/* Linear Algebra 2 · Eigenvalues & diagonalization. */
(function (ML) {
  const C = ML.C, la = ML.la, dot = la.dot, norm = la.norm;
  const TAU = 2 * Math.PI;

  /* ------------------------------------------------------------------ */
  ML.register({
    id: "eig-distinct-independent",
    course: "linalg2",
    topic: "eigen",
    title: "Eigenvectors of distinct eigenvalues are independent",
    blurb: "A single line cannot carry two different eigenvalues, so v₂ can never fall onto the line of v₁.",
    statement: String.raw`Let \(T\) be a linear operator and \(v_1,\dots,v_k\) eigenvectors with <b>pairwise distinct</b> eigenvalues \(\lambda_1,\dots,\lambda_k\). Then \(v_1,\dots,v_k\) are linearly independent.`,
    vizIntro: String.raw`<b>Drag the tips of <span style="color:#ff6b8b">v₁</span> and <span style="color:#4fd1a5">v₂</span></b> and set \(\lambda_1\ne\lambda_2\). The unique matrix with \(Av_1=\lambda_1v_1,\ Av_2=\lambda_2v_2\) turns the unit circle into the <span style="color:#ffcc4d">gold ellipse</span>. Push \(v_2\) toward the line of \(v_1\): the ellipse explodes, and exactly on that line <i>no such matrix exists</i>. Set \(\lambda_1=\lambda_2\) and the problem disappears (\(A=\lambda I\)).`,

    viz(box) {
      const st = ML.stage(box, { x: [-4, 4], y: [-4, 4] });
      const S = { v1: { x: 2, y: 0.5 }, v2: { x: 0.7, y: 2.2 }, l1: 2, l2: -1 };
      const s1 = ML.slider(st.panel, { label: "λ₁", min: -3, max: 3, step: 0.1, value: S.l1, onInput: (v) => { S.l1 = v; st.redraw(); } });
      const s2 = ML.slider(st.panel, { label: "λ₂", min: -3, max: 3, step: 0.1, value: S.l2, onInput: (v) => { S.l2 = v; st.redraw(); } });
      const row = ML.h("div", { class: "btn-row" }); st.panel.append(row);
      ML.button(row, "Make v₂ ∥ v₁", () => { S.v2 = { x: S.v1.x * 0.5, y: S.v1.y * 0.5 }; st.redraw(); });
      ML.button(row, "λ₁ = λ₂", () => { S.l2 = S.l1; s2.set(S.l1); st.redraw(); });
      const out = ML.readout(st.panel);

      function calc() {
        const a = [S.v1.x, S.v1.y], b = [S.v2.x, S.v2.y], n1 = norm(a), n2 = norm(b);
        const same = Math.abs(S.l1 - S.l2) < 1e-9;
        if (n1 < 1e-6 || n2 < 1e-6) return { zero: true };
        const det = a[0] * b[1] - a[1] * b[0], sin = Math.abs(det) / (n1 * n2);
        if (sin < 1e-6) return { sin, same, A: same ? [[S.l1, 0], [0, S.l1]] : null };
        const P = [[a[0], b[0]], [a[1], b[1]]];
        const A = la.mul(la.mul(P, [[S.l1, 0], [0, S.l2]]), la.inv(P));
        return { sin, same, A };
      }

      st.draw((v) => {
        v.grid(1); v.axes();
        const a = [S.v1.x, S.v1.y], b = [S.v2.x, S.v2.y], r = calc();
        if (!r.zero) {
          if (norm(a) > 1e-6) v.line(-a[0] * 12, -a[1] * 12, a[0] * 12, a[1] * 12, "rgba(255,107,139,.28)", 1.5, [6, 6]);
          if (norm(b) > 1e-6) v.line(-b[0] * 12, -b[1] * 12, b[0] * 12, b[1] * 12, "rgba(79,209,165,.28)", 1.5, [6, 6]);
        }
        v.circle(0, 0, 1, C.dim, "rgba(255,255,255,.05)", 1.5, [4, 4]);
        if (r.A) {
          v.path((t) => la.mulV(r.A, [Math.cos(t), Math.sin(t)]), 0, TAU, C.gold, 2.5, 360);
          v.dot(S.l1 * a[0], S.l1 * a[1], C.pink, 4); v.dot(S.l2 * b[0], S.l2 * b[1], C.green, 4);
        }
        v.arrow(0, 0, a[0], a[1], C.pink, 3.5); v.arrow(0, 0, b[0], b[1], C.green, 3.5);
        v.handle(a[0], a[1], C.pink, "v₁"); v.handle(b[0], b[1], C.green, "v₂");
        if (r.A === null && !r.zero) v.text("no such matrix exists", 0, 3.5, C.red, 0, 0, "700 15px system-ui", "center");
      });

      st.after = () => {
        const r = calc(), rows = [];
        if (r.zero) return out([["status", `<span class="no">An eigenvector must be nonzero.</span>`]]);
        rows.push(["sin(angle between lines)", ML.fmt(r.sin, 3)]);
        if (r.A) {
          rows.push(["A", `[${ML.fmt(r.A[0][0])}, ${ML.fmt(r.A[0][1])}; ${ML.fmt(r.A[1][0])}, ${ML.fmt(r.A[1][1])}]`]);
          const fro = Math.hypot(r.A[0][0], r.A[0][1], r.A[1][0], r.A[1][1]);
          rows.push(["‖A‖ (Frobenius)", ML.fmt(fro)]);
        }
        const lim = Math.abs(S.l2 - S.l1) / Math.max(r.sin, 1e-12);
        rows.push(["‖A − λ₁I‖₂ = |λ₂−λ₁| / sin", r.sin < 1e-6 && !r.same ? "∞" : ML.fmt(lim)]);
        let note;
        if (r.same) note = "λ₁ = λ₂: A = λI works for every v₁, v₂. Independence is <b>not</b> claimed here, because the eigenvalues are not distinct.";
        else if (r.A === null) note = "v₂ on the line of v₁ means v₂ = c·v₁. Then Av₂ = λ₂c·v₁ but also c·Av₁ = λ₁c·v₁, so (λ₂−λ₁)c·v₁ = 0, which is impossible. No matrix can do this.";
        else note = "As v₂ approaches the line of v₁ the entries of A grow like 1/sin. Independence is exactly what keeps A finite.";
        out(rows, note);
      };

      ML.drag(st, () => [S.v1, S.v2], (i, x, y) => { (i === 0 ? S.v1 : S.v2).x = x; (i === 0 ? S.v1 : S.v2).y = y; }, { snap: 0.05, clamp: [-3.9, 3.9, -3.9, 3.9] });
      st.redraw();
    },

    idea: String.raw`If a combination \(\sum c_iv_i=0\) existed, apply \(A\) and subtract \(\lambda_k\) times the original: this kills the last vector and leaves a shorter relation with nonzero coefficients \((\lambda_i-\lambda_k)c_i\). Induction finishes it.`,
    steps: [
      { t: String.raw`Induct on \(k\). Base case \(k=1\).`, d: String.raw`An eigenvector is nonzero by definition, so \(\{v_1\}\) is independent.` },
      { t: String.raw`Induction hypothesis.`, d: String.raw`Any \(k-1\) eigenvectors with pairwise distinct eigenvalues are independent. Let \(v_1,\dots,v_k\) have distinct \(\lambda_i\), and suppose \(c_1v_1+\dots+c_kv_k=0\;\;(\ast)\).` },
      { t: String.raw`Apply \(A\) to \((\ast)\).`, d: String.raw`Since \(Av_i=\lambda_iv_i\): \(\;c_1\lambda_1v_1+\dots+c_k\lambda_kv_k=0\;\;(\ast\ast)\).` },
      { t: String.raw`Multiply \((\ast)\) by \(\lambda_k\) and subtract from \((\ast\ast)\).`, d: String.raw`The \(v_k\)-terms cancel: \(\;c_1(\lambda_1-\lambda_k)v_1+\dots+c_{k-1}(\lambda_{k-1}-\lambda_k)v_{k-1}=0.\)` },
      { t: String.raw`Use the induction hypothesis.`, d: String.raw`\(v_1,\dots,v_{k-1}\) are independent, so \(c_i(\lambda_i-\lambda_k)=0\) for all \(i\lt k\). The eigenvalues are distinct, so \(\lambda_i-\lambda_k\ne0\), hence \(c_i=0\) for \(i\lt k\).` },
      { t: String.raw`Finish.`, d: String.raw`Now \((\ast)\) reads \(c_kv_k=0\). Since \(v_k\ne0\), \(c_k=0\). All coefficients vanish, so \(v_1,\dots,v_k\) are independent. \(\blacksquare\)` },
      { t: String.raw`The picture for \(k=2\).`, d: String.raw`If \(v_2=cv_1\) then \(Av_2=\lambda_2cv_1\) and \(Av_2=cAv_1=\lambda_1cv_1\), forcing \(\lambda_1=\lambda_2\). Two distinct eigenvalues cannot live on the same line.` },
    ],
    memorize: {
      formula: String.raw`\lambda_i\ne\lambda_j\ (i\ne j)\ \Longrightarrow\ v_1,\dots,v_k\ \text{independent}`,
      bullets: [
        String.raw`Proof pattern: assume \(\sum c_iv_i=0\), apply \(A\), subtract \(\lambda_k\cdot(\text{original})\), use induction.`,
        String.raw`Corollary: if \(A\) is \(n\times n\) with \(n\) <b>distinct</b> eigenvalues, it is diagonalizable.`,
        String.raw`Corollary: eigenspaces of distinct eigenvalues form a direct sum \(V_{\lambda_1}\oplus\dots\oplus V_{\lambda_k}\).`,
      ],
      pitfalls: [
        String.raw`The converse is false: the identity matrix has independent eigenvectors with the <i>same</i> eigenvalue.`,
        String.raw`Distinctness is needed at the step \(\lambda_i-\lambda_k\ne0\); say that explicitly.`,
        String.raw`Do not forget the base case: eigenvectors are nonzero <i>by definition</i>.`,
      ],
    },
  });

  /* ------------------------------------------------------------------ */
  ML.register({
    id: "symmetric-real-orthogonal",
    course: "linalg2",
    topic: "eigen",
    title: "Symmetric matrices: real eigenvalues, orthogonal eigenvectors",
    blurb: "For A = Aᵀ the discriminant is a sum of squares, and (λ−μ)⟨v,w⟩ = 0 forces orthogonality.",
    statement: String.raw`Let \(A\) be a real symmetric matrix. Then (a) every eigenvalue of \(A\) is real, and (b) eigenvectors belonging to distinct eigenvalues are orthogonal.`,
    vizIntro: String.raw`<b>Change \(a,b,d\)</b> in \(A=\begin{pmatrix}a&b\\b&d\end{pmatrix}\). The eigenvectors always meet at a right angle, and the discriminant \((a-d)^2+4b^2\) is the squared hypotenuse of the right triangle below, so it can never be negative.`,

    viz(box) {
      const st = ML.stage(box, { x: [-4, 4], y: [-4, 4] });
      const S = { a: 2, b: 1.2, d: -0.5 };
      const sl = (k, label) => ML.slider(st.panel, { label, min: -2.5, max: 2.5, step: 0.1, value: S[k], onInput: (v) => { S[k] = v; st.redraw(); } });
      const sa = sl("a", "a"), sb = sl("b", "b"), sd = sl("d", "d");
      const row = ML.h("div", { class: "btn-row" }); st.panel.append(row);
      ML.button(row, "Random symmetric", () => {
        const r = () => Math.round((Math.random() * 5 - 2.5) * 10) / 10;
        S.a = r(); S.b = r(); S.d = r(); sa.set(S.a); sb.set(S.b); sd.set(S.d); st.redraw();
      });
      const tri = st.extra({ x: [-5.6, 5.6], y: [-5, 5], equal: true, height: 170 });
      const out = ML.readout(st.panel);
      const mat = () => [[S.a, S.b], [S.b, S.d]];

      st.draw((v) => {
        v.grid(1); v.axes();
        const A = mat(), E = la.eig(A);
        v.circle(0, 0, 1, C.dim, "rgba(255,255,255,.05)", 1.5, [4, 4]);
        v.path((t) => la.mulV(A, [Math.cos(t), Math.sin(t)]), 0, TAU, C.gold, 2.5, 300);
        if (E.vals.length === 2) {
          const [p, q] = E.vals;
          v.line(-p.v[0] * 8, -p.v[1] * 8, p.v[0] * 8, p.v[1] * 8, "rgba(255,107,139,.3)", 1.5, [6, 6]);
          v.line(-q.v[0] * 8, -q.v[1] * 8, q.v[0] * 8, q.v[1] * 8, "rgba(79,209,165,.3)", 1.5, [6, 6]);
          // right angle marker
          const k = 0.35, m = [(p.v[0] + q.v[0]) * k, (p.v[1] + q.v[1]) * k];
          v.line(p.v[0] * k, p.v[1] * k, m[0], m[1], C.white, 1.5); v.line(q.v[0] * k, q.v[1] * k, m[0], m[1], C.white, 1.5);
          v.arrow(0, 0, p.v[0], p.v[1], C.pink, 3.5); v.arrow(0, 0, q.v[0], q.v[1], C.green, 3.5);
          v.text("v₁ (λ₁=" + ML.fmt(p.l) + ")", p.v[0], p.v[1], C.pink, 8, -8);
          v.text("v₂ (λ₂=" + ML.fmt(q.l) + ")", q.v[0], q.v[1], C.green, 8, -8);
        }
      });

      tri.draw((g) => {
        const L = S.a - S.d, H = 2 * S.b;
        g.axes("#262c52");
        g.poly([[0, 0], [L, 0], [L, H]], "rgba(108,140,255,.18)", C.blue, 2);
        const k = 0.35, sx = Math.sign(L) || 1, sy = Math.sign(H) || 1;
        g.poly([[L, 0], [L - sx * k, 0], [L - sx * k, sy * k], [L, sy * k]], null, C.white, 1);
        g.text("a−d = " + ML.fmt(L), L / 2, 0, C.gold, 0, 16, "600 11px system-ui", "center");
        g.text("2b = " + ML.fmt(H), L, H / 2, C.green, L >= 0 ? 6 : -6, 0, "600 11px system-ui", L >= 0 ? "left" : "right");
        g.text("λ₁−λ₂ = " + ML.fmt(Math.hypot(L, H)), L / 2, H / 2, C.pink, -4, -6, "700 11px system-ui", "right");
      });

      st.after = () => {
        const A = mat(), E = la.eig(A), L = S.a - S.d, H = 2 * S.b, disc = L * L + H * H;
        const rows = [["discriminant (a−d)² + (2b)²", `${ML.fmt(L * L)} + ${ML.fmt(H * H)} = <b>${ML.fmt(disc)}</b> ≥ 0`]];
        if (E.vals.length === 2) {
          const [p, q] = E.vals, Ap = la.mulV(A, p.v), Aq = la.mulV(A, q.v), ip = dot(p.v, q.v);
          rows.push(["λ₁, λ₂ (real)", `${ML.fmt(p.l)}, ${ML.fmt(q.l)}`]);
          rows.push(["⟨v₁, v₂⟩", `<span class="ok">${ML.fmt(ip, 4)}</span>`]);
          rows.push(["⟨Av₁, v₂⟩", ML.fmt(dot(Ap, q.v), 4)]);
          rows.push(["⟨v₁, Av₂⟩", ML.fmt(dot(p.v, Aq), 4)]);
          rows.push(["(λ₁−λ₂)·⟨v₁,v₂⟩", ML.fmt((p.l - q.l) * ip, 4)]);
          out(rows, "Both inner products ⟨Av₁,v₂⟩ and ⟨v₁,Av₂⟩ coincide because A is symmetric. They equal λ₁⟨v₁,v₂⟩ and λ₂⟨v₁,v₂⟩, so (λ₁−λ₂)⟨v₁,v₂⟩ = 0.");
        } else {
          out(rows, "a = d and b = 0: A = aI has a single eigenvalue and <b>every</b> vector is an eigenvector. Orthogonality is then a free choice: pick any orthogonal pair.");
        }
      };
      st.redraw();
    },

    idea: String.raw`Symmetry means \(\langle Av,w\rangle=\langle v,Aw\rangle\). Evaluate it on eigenvectors: \(\lambda\|v\|^2=\bar\lambda\|v\|^2\) shows \(\lambda\) is real, and \(\lambda\langle v,w\rangle=\mu\langle v,w\rangle\) forces \(\langle v,w\rangle=0\).`,
    steps: [
      { t: String.raw`Symmetry in terms of the inner product.`, d: String.raw`On \(\mathbb C^n\) use \(\langle x,y\rangle=x^{T}\bar y\). For real \(A=A^{T}\): \(\langle Av,w\rangle=v^{T}A^{T}\bar w=v^{T}A\bar w=v^{T}\overline{Aw}=\langle v,Aw\rangle\).` },
      { t: String.raw`(a) Eigenvalues are real.`, d: String.raw`Let \(Av=\lambda v\), \(v\ne0\) in \(\mathbb C^n\). Then \(\lambda\|v\|^2=\langle Av,v\rangle=\langle v,Av\rangle=\langle v,\lambda v\rangle=\bar\lambda\|v\|^2\).` },
      { t: String.raw`Cancel \(\|v\|^2\ne0\).`, d: String.raw`\(\lambda=\bar\lambda\), so \(\lambda\in\mathbb R\). For real \(\lambda\), the real matrix \(A-\lambda I\) is singular, so a <i>real</i> eigenvector exists.` },
      { t: String.raw`(b) Orthogonality.`, d: String.raw`Let \(Av=\lambda v\), \(Aw=\mu w\) with \(\lambda\ne\mu\) (both real by (a)). Then \(\lambda\langle v,w\rangle=\langle Av,w\rangle=\langle v,Aw\rangle=\bar\mu\langle v,w\rangle=\mu\langle v,w\rangle\).` },
      { t: String.raw`Conclude.`, d: String.raw`\((\lambda-\mu)\langle v,w\rangle=0\) and \(\lambda-\mu\ne0\), so \(\langle v,w\rangle=0\). \(\blacksquare\)` },
      { t: String.raw`Sanity check in \(2\times2\).`, d: String.raw`The characteristic polynomial \(\lambda^2-(a+d)\lambda+(ad-b^2)\) has discriminant \((a+d)^2-4(ad-b^2)=(a-d)^2+4b^2\ge0\): real roots, and \(\lambda_1-\lambda_2\) is the hypotenuse of the triangle with legs \(a-d\) and \(2b\).` },
    ],
    memorize: {
      formula: String.raw`A=A^{T}\ \Rightarrow\ \lambda\in\mathbb R,\qquad (\lambda-\mu)\langle v,w\rangle=0\ \Rightarrow\ v\perp w`,
      bullets: [
        String.raw`Key identity: \(\langle Av,w\rangle=\langle v,Aw\rangle\). Everything follows from it.`,
        String.raw`\(2\times2\): discriminant \(=(a-d)^2+4b^2\), a sum of squares.`,
        String.raw`This is the first half of the spectral theorem: symmetric \(\Rightarrow\) orthogonally diagonalizable.`,
      ],
      pitfalls: [
        String.raw`The real-eigenvalue proof must happen over \(\mathbb C\) (or Hermitian): a real eigenvector is not given in advance.`,
        String.raw`Orthogonality holds for <b>distinct</b> eigenvalues only; inside one eigenspace you still have to orthogonalize (Gram–Schmidt).`,
        String.raw`Real symmetric is essential: a rotation matrix has no real eigenvalues, and a nonsymmetric matrix has non-orthogonal eigenvectors.`,
      ],
    },
  });

  /* ------------------------------------------------------------------ */
  ML.register({
    id: "cayley-hamilton-diag",
    course: "linalg2",
    topic: "eigen",
    title: "Cayley–Hamilton (diagonalizable case)",
    blurb: "p(A) vanishes on every eigenvector because p(λ) = 0, so it vanishes on a whole basis.",
    statement: String.raw`Let \(p(\lambda)=\det(\lambda I-A)\) be the characteristic polynomial of \(A\). Then \(p(A)=0\). For \(2\times2\): \(\;A^2-\operatorname{tr}(A)\,A+\det(A)\,I=0\). Here we prove it when \(A\) is diagonalizable.`,
    vizIntro: String.raw`<b>Edit the entries of \(A\).</b> The chain of three arrows is \(p(A)v=\lambda^2v-\operatorname{tr}(A)\lambda v+\det(A)v\) for an eigenvector \(v\). Because \(\lambda\) is a root of \(p\), the chain always closes up at the origin.`,

    viz(box) {
      const st = ML.stage(box, { x: [-4.2, 4.2], y: [-4.2, 4.2] });
      const S = { a: 2, b: 1, c: 1, d: 3, which: 0 };
      ["a", "b", "c", "d"].forEach((k) => ML.slider(st.panel, { label: k, min: -3, max: 3, step: 0.1, value: S[k], onInput: (v) => { S[k] = v; st.redraw(); } }));
      ML.select(st.panel, { label: "Eigenvector to follow", options: [["0", "v₁ (λ₁)"], ["1", "v₂ (λ₂)"]], onChange: (v) => { S.which = +v; st.redraw(); } });
      const out = ML.readout(st.panel);
      const mat = () => [[S.a, S.b], [S.c, S.d]];

      function pairs() {
        const E = la.eig(mat());
        if (E.complex) return { E, list: [] };
        if (E.scalar) return { E, list: [{ l: E.tr / 2, v: [1, 0] }, { l: E.tr / 2, v: [0, 1] }] };
        return { E, list: E.vals };
      }

      st.draw((v) => {
        v.grid(1); v.axes();
        const { E, list } = pairs();
        if (!list.length) { v.text("complex eigenvalues: no real arrows", 0, 0, C.dim, 0, -20, "600 14px system-ui", "center"); return; }
        const pr = list[Math.min(S.which, list.length - 1)], l = pr.l, tr = E.tr, det = E.det;
        const c = [l * l, -tr * l, det], pos = [0, c[0], c[0] + c[1], c[0] + c[1] + c[2]];
        const m = Math.max(Math.abs(pos[1]), Math.abs(pos[2]), Math.abs(c[0]), Math.abs(c[1]), Math.abs(c[2]), 1e-6);
        const s = Math.min(3, 3.4 / m), vv = pr.v, nn = [-vv[1], vv[0]];
        const colors = [C.orange, C.purple, C.cyan], names = ["λ²v", "−tr·λ·v", "det·v"], off = [0, 0.45, 0.9];
        v.line(-vv[0] * 8, -vv[1] * 8, vv[0] * 8, vv[1] * 8, "rgba(255,255,255,.12)", 1.5, [6, 6]);
        for (let k = 0; k < 3; k++) {
          const from = [vv[0] * s * pos[k] + nn[0] * off[k], vv[1] * s * pos[k] + nn[1] * off[k]];
          const to = [vv[0] * s * pos[k + 1] + nn[0] * off[k], vv[1] * s * pos[k + 1] + nn[1] * off[k]];
          v.arrow(from[0], from[1], to[0], to[1], colors[k], 3.5);
          v.text(names[k], (from[0] + to[0]) / 2, (from[1] + to[1]) / 2, colors[k], 8 * Math.sign(nn[0] || 1), -6, "600 12px system-ui");
          if (k < 2) v.line(to[0], to[1], vv[0] * s * pos[k + 1] + nn[0] * off[k + 1], vv[1] * s * pos[k + 1] + nn[1] * off[k + 1], "rgba(255,255,255,.35)", 1, [3, 3]);
        }
        const last = [vv[0] * s * pos[3] + nn[0] * off[2], vv[1] * s * pos[3] + nn[1] * off[2]];
        v.line(last[0], last[1], 0, 0, "rgba(255,255,255,.35)", 1, [3, 3]);
        v.dot(0, 0, C.white, 6, C.bg);
        v.text("back at 0 ✓", 0, 0, C.white, 10, 20);
        v.text(s < 0.999 ? `drawn at scale ${ML.fmt(s, 2)}` : "", -4.0, 3.9, C.dim, 0, 0, "11px system-ui");
      });

      st.after = () => {
        const A = mat(), { E, list } = pairs(), tr = E.tr, det = E.det;
        const A2 = la.mul(A, A);
        const Z = [[A2[0][0] - tr * A[0][0] + det, A2[0][1] - tr * A[0][1]], [A2[1][0] - tr * A[1][0], A2[1][1] - tr * A[1][1] + det]];
        const zero = Math.max(Math.abs(Z[0][0]), Math.abs(Z[0][1]), Math.abs(Z[1][0]), Math.abs(Z[1][1])) < 1e-8;
        const f = ML.fmt, rows = [
          ["p(λ)", `λ² − (${f(tr)})λ + (${f(det)})`],
          ["A² − tr·A + det·I", `[${f(Z[0][0])}, ${f(Z[0][1])}; ${f(Z[1][0])}, ${f(Z[1][1])}] <span class="${zero ? "ok" : "no"}">${zero ? "= 0 ✓" : "≠ 0"}</span>`],
        ];
        if (list.length) {
          const pr = list[Math.min(S.which, list.length - 1)];
          rows.push(["λ, v", `${f(pr.l)}, (${f(pr.v[0])}, ${f(pr.v[1])})`]);
          rows.push(["p(λ)", f(pr.l * pr.l - tr * pr.l + det, 6)]);
        }
        let note;
        if (E.complex) note = "Complex eigenvalues: A is diagonalizable over ℂ, so the same proof works there (the arrows live in ℂ²). Numerically p(A) = 0 still.";
        else if (!E.scalar && E.repeated) note = "Repeated eigenvalue with one eigendirection: A is <b>not</b> diagonalizable, so this proof does not apply, yet p(A) = 0 holds. The general theorem needs another argument (density of diagonalizable matrices or the adjugate).";
        else note = "A is diagonalizable: p(A) kills both eigenvectors, hence the whole plane.";
        out(rows, note);
      };
      st.redraw();
    },

    idea: String.raw`On an eigenvector \(A^kv=\lambda^kv\), so \(p(A)v=p(\lambda)v=0\). A linear map that is zero on a basis of eigenvectors is the zero map.`,
    steps: [
      { t: String.raw`Setup.`, d: String.raw`Let \(A\) be diagonalizable: there is a basis \(v_1,\dots,v_n\) of eigenvectors, \(Av_i=\lambda_iv_i\). Write \(p(x)=\sum_{k}a_kx^k\).` },
      { t: String.raw`Powers on an eigenvector.`, d: String.raw`By induction \(A^kv_i=\lambda_i^kv_i\): indeed \(A^{k+1}v_i=A(\lambda_i^kv_i)=\lambda_i^k\,Av_i=\lambda_i^{k+1}v_i\).` },
      { t: String.raw`Apply the polynomial.`, d: String.raw`By linearity \(p(A)v_i=\sum_ka_kA^kv_i=\Big(\sum_ka_k\lambda_i^k\Big)v_i=p(\lambda_i)\,v_i.\)` },
      { t: String.raw`Each \(\lambda_i\) is a root of \(p\).`, d: String.raw`The eigenvalues are by definition the roots of the characteristic polynomial, so \(p(\lambda_i)=0\) and \(p(A)v_i=0\) for every \(i\).` },
      { t: String.raw`A basis determines a linear map.`, d: String.raw`\(p(A)\) is linear and vanishes on a basis, so \(p(A)x=0\) for all \(x\). Hence \(p(A)=0\). \(\blacksquare\)` },
      { t: String.raw`What about non-diagonalizable \(A\)?`, d: String.raw`The theorem is still true (for example via the adjugate identity \((\lambda I-A)\operatorname{adj}(\lambda I-A)=p(\lambda)I\), or because diagonalizable matrices are dense and \(p_A(A)\) is continuous in \(A\)). The proof above covers only the diagonalizable case; do not claim more on an exam.` },
    ],
    memorize: {
      formula: String.raw`p(A)v_i=p(\lambda_i)v_i=0\ \Rightarrow\ p(A)=0,\qquad 2\times2:\ A^2-\operatorname{tr}(A)A+\det(A)I=0`,
      bullets: [
        String.raw`Three facts: \(A^kv=\lambda^kv\); \(p(A)v=p(\lambda)v\); \(p(\lambda)=0\).`,
        String.raw`A linear map that is 0 on a basis is 0.`,
        String.raw`Use: \(A^{-1}=\dfrac{\operatorname{tr}(A)I-A}{\det A}\) for \(2\times2\), and reduction of high powers of \(A\).`,
      ],
      pitfalls: [
        String.raw`Never substitute \(A\) into \(\det(A-\lambda I)\) directly: \(\det(A-AI)=\det0=0\) is a meaningless “proof”. Evaluate the <i>polynomial</i> at \(A\).`,
        String.raw`The constant term becomes \(\det(A)\cdot I\), not the scalar \(\det A\).`,
        String.raw`State clearly that this proof assumes diagonalizability.`,
      ],
    },
  });
})(window.ML);
