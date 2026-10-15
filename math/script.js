"use strict";

/* ---------- shared helpers ---------- */
const C = { e1: "#ff6b8b", e2: "#4fd1a5", gold: "#ffcc4d", accent: "#6c8cff", grid: "#1d2342", text: "#c9d0f5" };
const $ = (id) => document.getElementById(id);
const fmt = (x, d = 2) => {
  const v = Math.abs(x) < 5e-10 ? 0 : x;
  return String(parseFloat(v.toFixed(d)));
};

/** Size a canvas to its CSS box (crisp on retina) and return a 2D context in CSS pixels. */
function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function arrow(ctx, x0, y0, x1, y1, color, width = 3) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len, uy = dy / len, head = Math.min(12, len * 0.5);
  ctx.strokeStyle = ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - ux * head * 0.6, y1 - uy * head * 0.6); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head - uy * head * 0.5, y1 - uy * head + ux * head * 0.5);
  ctx.lineTo(x1 - ux * head + uy * head * 0.5, y1 - uy * head - ux * head * 0.5);
  ctx.closePath(); ctx.fill();
}

/** Pointer dragging helper: calls onDown(x,y) -> bool (start drag?), onMove(x,y). Coordinates in CSS px. */
function makeDraggable(canvas, onDown, onMove) {
  let dragging = false;
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  canvas.addEventListener("pointerdown", (e) => {
    const [x, y] = pos(e);
    if (onDown(x, y)) { dragging = true; canvas.setPointerCapture(e.pointerId); e.preventDefault(); }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) { const [x, y] = pos(e); onMove(x, y); }
  });
  const stop = () => { dragging = false; };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
}

/* =====================================================
   LINEAR ALGEBRA: matrix as a transformation
   ===================================================== */
const la = {
  canvas: $("laCanvas"),
  R: 5,                           // visible half-range in math units
  A: { a: 1, b: 1, c: 0, d: 1 }, // columns: A·e1 = (a,c), A·e2 = (b,d)
  shown: null,                    // matrix actually drawn (differs from A while morphing)
  morphing: false,
};
la.shown = { ...la.A };

const PRESETS = {
  "Identity": { a: 1, b: 0, c: 0, d: 1 },
  "Stretch": { a: 2, b: 0, c: 0, d: 0.5 },
  "Shear": { a: 1, b: 1, c: 0, d: 1 },
  "Rotate 45°": { a: 0.71, b: -0.71, c: 0.71, d: 0.71 },
  "Reflect": { a: 1, b: 0, c: 0, d: -1 },
  "Symmetric": { a: 2, b: 1, c: 1, d: 2 },
  "Singular": { a: 1, b: 1, c: 1, d: 1 },
};

function eigen2(M) {
  const { a, b, c, d } = M;
  const tr = a + d, det = a * d - b * c, disc = tr * tr / 4 - det;
  if (disc < -1e-9) return { tr, det, complex: true, re: tr / 2, im: Math.sqrt(-disc), vals: [] };
  const s = Math.sqrt(Math.max(disc, 0));
  const lams = s < 1e-9 ? [tr / 2] : [tr / 2 + s, tr / 2 - s];
  const vals = lams.map((l) => {
    let v;
    if (Math.abs(b) > 1e-9) v = [b, l - a];
    else if (Math.abs(c) > 1e-9) v = [l - d, c];
    else v = Math.abs(l - a) < 1e-9 ? [1, 0] : [0, 1]; // diagonal matrix
    const n = Math.hypot(v[0], v[1]);
    return { l, v: [v[0] / n, v[1] / n] };
  });
  const scalar = s < 1e-9 && Math.abs(b) < 1e-9 && Math.abs(c) < 1e-9; // λI: every direction is an eigenvector
  return { tr, det, complex: false, vals: scalar ? [] : vals, scalar, repeated: s < 1e-9 };
}

function laDraw() {
  const { ctx, w, h } = setupCanvas(la.canvas);
  const S = w / (2 * la.R), cx = w / 2, cy = h / 2;
  const P = (x, y) => [cx + x * S, cy - y * S];
  const M = la.shown;
  const T = (x, y) => [M.a * x + M.b * y, M.c * x + M.d * y];
  const line = (p, q) => { ctx.beginPath(); ctx.moveTo(...P(...p)); ctx.lineTo(...P(...q)); ctx.stroke(); };

  ctx.clearRect(0, 0, w, h);
  // original grid
  ctx.lineWidth = 1; ctx.strokeStyle = C.grid;
  for (let i = -la.R; i <= la.R; i++) { line([i, -la.R], [i, la.R]); line([-la.R, i], [la.R, i]); }
  ctx.strokeStyle = "#3a4275"; ctx.lineWidth = 1.5;
  line([-la.R, 0], [la.R, 0]); line([0, -la.R], [0, la.R]);

  // transformed grid
  const N = 12;
  ctx.strokeStyle = "rgba(108,140,255,.45)"; ctx.lineWidth = 1;
  for (let i = -N; i <= N; i++) { line(T(i, -N), T(i, N)); line(T(-N, i), T(N, i)); }

  // transformed unit square
  ctx.fillStyle = "rgba(108,140,255,.22)"; ctx.strokeStyle = C.accent; ctx.lineWidth = 2;
  ctx.beginPath();
  [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([x, y], i) => { const p = P(...T(x, y)); i ? ctx.lineTo(...p) : ctx.moveTo(...p); });
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // "F" shape shows orientation (flips under reflections)
  const F = [[0.15, 0.1], [0.35, 0.1], [0.35, 0.45], [0.6, 0.45], [0.6, 0.6], [0.35, 0.6], [0.35, 0.8], [0.7, 0.8], [0.7, 0.92], [0.15, 0.92]];
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.beginPath(); F.forEach(([x, y], i) => { const p = P(...T(x, y)); i ? ctx.lineTo(...p) : ctx.moveTo(...p); });
  ctx.closePath(); ctx.fill();

  // eigen-directions
  const E = eigen2(M);
  ctx.setLineDash([8, 6]); ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
  E.vals.forEach(({ v }) => { line([-v[0] * 20, -v[1] * 20], [v[0] * 20, v[1] * 20]); });
  ctx.setLineDash([]);
  ctx.font = "600 13px system-ui"; ctx.fillStyle = C.gold;
  E.vals.forEach(({ l, v }) => {
    const p = P(v[0] * 3.6, v[1] * 3.6);
    ctx.fillText(`λ=${fmt(l)}`, p[0] + 6, p[1] - 6);
  });

  // images of e1, e2 (draggable tips)
  const [x1, y1] = P(M.a, M.c), [x2, y2] = P(M.b, M.d), [ox, oy] = P(0, 0);
  arrow(ctx, ox, oy, x1, y1, C.e1, 3.5);
  arrow(ctx, ox, oy, x2, y2, C.e2, 3.5);
  [[x1, y1, C.e1, "Ae₁"], [x2, y2, C.e2, "Ae₂"]].forEach(([x, y, col, label]) => {
    ctx.fillStyle = "#0b0e1b"; ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.font = "600 13px system-ui"; ctx.fillText(label, x + 12, y - 10);
  });

  la.geom = { S, cx, cy, tips: [[x1, y1], [x2, y2]] };
}

function laReadout() {
  const E = eigen2(la.A);
  const rows = [];
  rows.push(["trace", fmt(E.tr)]);
  rows.push(["det", fmt(E.det)]);
  if (E.complex) rows.push(["eigenvalues", `${fmt(E.re)} ± ${fmt(E.im)}i`]);
  else if (E.scalar) rows.push(["eigenvalues", `${fmt(E.tr / 2)} (every direction)`]);
  else E.vals.forEach(({ l, v }, i) => rows.push([`λ${i + 1}`, `${fmt(l)}  ·  v = (${fmt(v[0])}, ${fmt(v[1])})`]));
  let note;
  if (Math.abs(E.det) < 1e-9) note = "det = 0: the plane collapses onto a line, so the matrix is not invertible.";
  else if (E.complex) note = "No real eigen-directions: every vector is rotated, so the matrix is not diagonalizable over ℝ.";
  else if (E.repeated && !E.scalar) note = "A repeated eigenvalue with only one direction: the matrix is not diagonalizable (a Jordan block).";
  else if (E.det < 0) note = "det < 0: the orientation is flipped (look at the F). Area scales by |det|.";
  else note = `det > 0: the orientation is preserved. Area scales by ${fmt(E.det)}.`;
  $("laReadout").innerHTML =
    rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("") + `<dd class="note">${note}</dd>`;
}

function laSyncInputs() {
  for (const k of ["a", "b", "c", "d"]) $("m-" + k).value = fmt(la.A[k]);
}
function laUpdate() { if (!la.morphing) la.shown = { ...la.A }; laDraw(); laReadout(); }

function laSet(M) { la.A = { ...M }; laSyncInputs(); laUpdate(); }

// editing via inputs
for (const k of ["a", "b", "c", "d"]) {
  $("m-" + k).addEventListener("input", (e) => {
    const v = parseFloat(e.target.value);
    if (Number.isFinite(v)) { la.A[k] = v; laUpdate(); }
  });
}
// presets
for (const [name, M] of Object.entries(PRESETS)) {
  const btn = document.createElement("button");
  btn.textContent = name;
  btn.onclick = () => laSet(M);
  $("laPresets").appendChild(btn);
}
// dragging the arrow tips
let laDrag = -1;
makeDraggable(
  la.canvas,
  (x, y) => {
    const { tips } = la.geom;
    laDrag = tips.findIndex(([tx, ty]) => Math.hypot(tx - x, ty - y) < 18);
    return laDrag >= 0;
  },
  (x, y) => {
    const { S, cx, cy } = la.geom;
    const snap = (v) => Math.round(Math.max(-la.R, Math.min(la.R, v)) * 20) / 20;
    const mx = snap((x - cx) / S), my = snap((cy - y) / S);
    if (laDrag === 0) { la.A.a = mx; la.A.c = my; } else { la.A.b = mx; la.A.d = my; }
    laSyncInputs(); laUpdate();
  }
);
// morph animation I -> A
$("morphBtn").onclick = () => {
  if (la.morphing) return;
  la.morphing = true;
  const t0 = performance.now(), dur = 1400;
  const step = (now) => {
    let t = Math.min(1, (now - t0) / dur);
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    la.shown = {
      a: 1 + e * (la.A.a - 1), b: e * la.A.b,
      c: e * la.A.c, d: 1 + e * (la.A.d - 1),
    };
    laDraw();
    if (t < 1) requestAnimationFrame(step);
    else { la.morphing = false; laUpdate(); }
  };
  requestAnimationFrame(step);
};

/* =====================================================
   INFI 2: gradient & directional derivative
   ===================================================== */
const FUNCS = [
  { name: "Hill and valley: sin x · cos y", f: (x, y) => Math.sin(x) * Math.cos(y), label: "sin(x)cos(y)" },
  { name: "Saddle: x² − y²", f: (x, y) => (x * x - y * y) / 3, label: "(x²−y²)/3" },
  { name: "Bowl: x² + y²", f: (x, y) => (x * x + y * y) / 3, label: "(x²+y²)/3" },
  { name: "Two bumps (Gaussians)", f: (x, y) => Math.exp(-(x * x + y * y) / 2) + 0.7 * Math.exp(-((x - 1.6) ** 2 + (y + 1.2) ** 2)), label: "e^(−r²/2) + 0.7·e^(−|p−q|²)" },
  { name: "Ripple: sin(r) / r", f: (x, y) => { const r = Math.hypot(x, y); return r < 1e-6 ? 1 : 1.8 * Math.sin(2 * r) / (2 * r); }, label: "sinc ripple" },
];
const sf = {
  canvas: $("surfCanvas"), slope: $("slopeCanvas"), R: 3,
  p: { x: 0.9, y: 0.6 }, theta: 45 * Math.PI / 180, fi: 0, cache: null,
};

function sfBuildHeatmap() {
  const N = 220, f = FUNCS[sf.fi].f, R = sf.R;
  const vals = new Float32Array(N * N);
  let mn = Infinity, mx = -Infinity;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const v = f(-R + (i + 0.5) / N * 2 * R, R - (j + 0.5) / N * 2 * R);
    vals[j * N + i] = v; if (v < mn) mn = v; if (v > mx) mx = v;
  }
  const off = document.createElement("canvas"); off.width = off.height = N;
  const octx = off.getContext("2d"), img = octx.createImageData(N, N);
  const stops = [[28, 40, 120], [40, 140, 170], [110, 200, 130], [250, 228, 110]];
  for (let k = 0; k < N * N; k++) {
    const t = (vals[k] - mn) / (mx - mn || 1);
    const s = Math.min(2.999, t * 3), i0 = Math.floor(s), u = s - i0;
    const c0 = stops[i0], c1 = stops[i0 + 1];
    let shade = 1;
    const band = (t * 14) % 1;
    if (band < 0.07) shade = 0.55;                 // level curves
    for (let ch = 0; ch < 3; ch++) img.data[k * 4 + ch] = (c0[ch] + (c1[ch] - c0[ch]) * u) * shade;
    img.data[k * 4 + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  sf.cache = off;
}

function grad(x, y) {
  const f = FUNCS[sf.fi].f, h = 1e-4;
  return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)];
}

function sfDraw() {
  const { ctx, w, h } = setupCanvas(sf.canvas);
  const S = w / (2 * sf.R), P = (x, y) => [w / 2 + x * S, h / 2 - y * S];
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(sf.cache, 0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();

  const { x, y } = sf.p, [gx, gy] = grad(x, y), gn = Math.hypot(gx, gy);
  const [px, py] = P(x, y);
  // gradient arrow
  if (gn > 1e-6) {
    const len = Math.min(110, 34 * gn);
    arrow(ctx, px, py, px + gx / gn * len, py - gy / gn * len, "#ff5a7a", 4);
  }
  // direction u arrow
  const ux = Math.cos(sf.theta), uy = Math.sin(sf.theta);
  arrow(ctx, px, py, px + ux * 70, py - uy * 70, "#fff36b", 4);
  // point
  ctx.fillStyle = "#fff"; ctx.strokeStyle = "#0b0e1b"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(px, py, 8, 0, 7); ctx.stroke(); ctx.fill();
  // legend
  ctx.font = "600 12px system-ui";
  ctx.fillStyle = "#ff5a7a"; ctx.fillText("∇f", 12, 20);
  ctx.fillStyle = "#fff36b"; ctx.fillText("u", 42, 20);

  sf.geom = { S, w, h, px, py };
  sfReadout(gn, gx, gy, ux, uy);
  sfSlopePlot(gn, Math.atan2(gy, gx));
}

function sfReadout(gn, gx, gy, ux, uy) {
  const { x, y } = sf.p, z = FUNCS[sf.fi].f(x, y), du = gx * ux + gy * uy;
  const sign = (v) => (v < 0 ? "− " : "+ ") + fmt(Math.abs(v));
  const rows = [
    ["f(x, y)", FUNCS[sf.fi].label],
    ["point", `(${fmt(x)}, ${fmt(y)})  →  z = ${fmt(z)}`],
    ["∇f", `(${fmt(gx)}, ${fmt(gy)})`],
    ["|∇f|", fmt(gn)],
    ["D<sub>u</sub>f", `<b>${fmt(du)}</b>  ${du > 0.01 ? "(going up)" : du < -0.01 ? "(going down)" : "(along a level curve)"}`],
    ["tangent plane", `z = ${fmt(z)} ${sign(gx)}(x − ${fmt(x)}) ${sign(gy)}(y − ${fmt(y)})`],
  ];
  $("surfReadout").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
}

function sfSlopePlot(gn, phi) {
  const { ctx, w, h } = setupCanvas(sf.slope);
  const pad = 14, yMax = Math.max(gn, 0.5) * 1.15;
  const X = (deg) => pad + deg / 360 * (w - 2 * pad), Y = (v) => h / 2 - v / yMax * (h / 2 - pad);
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#3a4275"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, h / 2); ctx.lineTo(w - pad, h / 2); ctx.stroke();
  ctx.strokeStyle = "#6c8cff"; ctx.lineWidth = 2; ctx.beginPath();
  for (let d = 0; d <= 360; d += 3) {
    const v = gn * Math.cos(d * Math.PI / 180 - phi);
    d ? ctx.lineTo(X(d), Y(v)) : ctx.moveTo(X(d), Y(v));
  }
  ctx.stroke();
  const cur = ((sf.theta * 180 / Math.PI) % 360 + 360) % 360, vv = gn * Math.cos(sf.theta - phi);
  ctx.fillStyle = "#fff36b"; ctx.beginPath(); ctx.arc(X(cur), Y(vv), 6, 0, 7); ctx.fill();
  ctx.fillStyle = "#9aa3c7"; ctx.font = "11px system-ui";
  ctx.fillText("0°", pad, h - 3); ctx.fillText("360°", w - pad - 24, h - 3);
}

// controls
FUNCS.forEach((fn, i) => {
  const o = document.createElement("option"); o.value = i; o.textContent = fn.name; $("fnSelect").appendChild(o);
});
$("fnSelect").onchange = (e) => { sf.fi = +e.target.value; sfBuildHeatmap(); sfDraw(); };
$("theta").oninput = (e) => {
  sf.theta = e.target.value * Math.PI / 180;
  $("thetaLabel").textContent = e.target.value + "°";
  sfDraw();
};
$("alignBtn").onclick = () => {
  const [gx, gy] = grad(sf.p.x, sf.p.y);
  if (Math.hypot(gx, gy) < 1e-6) return;
  let deg = Math.round(Math.atan2(gy, gx) * 180 / Math.PI);
  deg = ((deg % 360) + 360) % 360;
  $("theta").value = deg; $("thetaLabel").textContent = deg + "°";
  sf.theta = deg * Math.PI / 180;
  sfDraw();
};
makeDraggable(
  sf.canvas,
  (x, y) => Math.hypot(sf.geom.px - x, sf.geom.py - y) < 24,
  (x, y) => {
    const { S, w, h } = sf.geom, R = sf.R;
    sf.p.x = Math.max(-R, Math.min(R, (x - w / 2) / S));
    sf.p.y = Math.max(-R, Math.min(R, (h / 2 - y) / S));
    sfDraw();
  }
);

/* =====================================================
   PRACTICE: eigenvalues of a random integer 2×2 matrix
   ===================================================== */
const prob = { M: null, eig: [], solved: 0, streak: 0, done: false };
try {
  prob.solved = +localStorage.getItem("ml_solved") || 0;
  prob.streak = +localStorage.getItem("ml_streak") || 0;
} catch (_) { /* storage unavailable: just don't persist */ }

function saveScore() {
  try { localStorage.setItem("ml_solved", prob.solved); localStorage.setItem("ml_streak", prob.streak); } catch (_) {}
  $("solvedCount").textContent = prob.solved; $("streakCount").textContent = prob.streak;
}

function newProblem() {
  const r = () => Math.floor(Math.random() * 9) - 4; // -4..4
  for (;;) {
    const a = r(), b = r(), c = r(), d = r();
    const disc = (a - d) ** 2 + 4 * b * c, s = Math.round(Math.sqrt(Math.max(disc, 0)));
    if (disc <= 0 || s * s !== disc || (a + d + s) % 2 !== 0) continue; // want two distinct integer eigenvalues
    if (b === 0 && c === 0) continue;                                    // skip trivial diagonal matrices
    prob.M = { a, b, c, d };
    prob.eig = [(a + d + s) / 2, (a + d - s) / 2].sort((p, q) => p - q);
    break;
  }
  prob.done = false;
  const { a, b, c, d } = prob.M;
  $("probMatrix").innerHTML = `<span>A =</span><span class="bracket" style="font-size:3.6rem">[</span>
    <table><tr><td>${a}</td><td>${b}</td></tr><tr><td>${c}</td><td>${d}</td></tr></table>
    <span class="bracket" style="font-size:3.6rem">]</span>`;
  $("probAnswer").value = "";
  setFeedback("", "");
  saveScore();
}
function setFeedback(msg, cls) { const f = $("probFeedback"); f.textContent = msg; f.className = "feedback " + cls; }

$("checkBtn").onclick = () => {
  const nums = $("probAnswer").value.split(/[,;\s]+/).filter(Boolean).map(Number);
  if (nums.length !== 2 || nums.some((n) => !Number.isFinite(n))) { setFeedback("Enter two numbers, e.g. 2, -1.", "bad"); return; }
  nums.sort((p, q) => p - q);
  if (nums.every((n, i) => Math.abs(n - prob.eig[i]) < 1e-6)) {
    if (!prob.done) { prob.solved++; prob.streak++; prob.done = true; saveScore(); }
    const { a, b, c, d } = prob.M;
    setFeedback(`Correct! tr = ${a + d}, det = ${a * d - b * c}, so λ² − ${a + d}λ + ${a * d - b * c} = 0 gives λ = ${prob.eig.join(" and ")}.`, "good");
  } else {
    prob.streak = 0; saveScore();
    setFeedback("Not quite. Try λ² − tr(A)·λ + det(A) = 0.", "bad");
  }
};
$("hintBtn").onclick = () => {
  const { a, b, c, d } = prob.M;
  setFeedback(`Hint: tr(A) = ${a + d} and det(A) = ${a}·${d} − ${b}·${c} = ${a * d - b * c}. The eigenvalues add up to the trace and multiply to the determinant.`, "");
};
$("showBtn").onclick = () => { laSet(prob.M); $("linalg").scrollIntoView(); };
$("nextBtn").onclick = newProblem;
$("probAnswer").addEventListener("keydown", (e) => { if (e.key === "Enter") $("checkBtn").click(); });

/* ---------- boot ---------- */
function drawAll() { laDraw(); sfDraw(); }
laSyncInputs(); laReadout();
sfBuildHeatmap();
newProblem();
drawAll();
window.addEventListener("resize", drawAll);
