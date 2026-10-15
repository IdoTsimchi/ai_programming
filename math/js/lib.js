"use strict";
/* =====================================================================
   MathLab shared library: DOM helpers, canvas views, controls, math utils.
   Plain script (no modules) so the site also works when opened from disk.
   ===================================================================== */
window.ML = window.ML || {};
(function (ML) {
  ML.courses = [];
  ML.proofs = [];
  ML.registerCourse = (c) => ML.courses.push(c);
  ML.register = (p) => ML.proofs.push(p);

  /* ---------- colors (canvases are always dark) ---------- */
  ML.C = {
    bg: "#0b0e1b", grid: "#1d2342", axis: "#3a4275", text: "#c9d0f5", dim: "#7e87b5",
    pink: "#ff6b8b", green: "#4fd1a5", gold: "#ffcc4d", blue: "#6c8cff", red: "#ff5a7a",
    yellow: "#fff36b", white: "#ffffff", purple: "#b78cff", orange: "#ff9f5a", cyan: "#5ad7ff",
  };

  /* ---------- tiny utils ---------- */
  ML.$ = (sel, root) => (root || document).querySelector(sel);
  ML.fmt = (x, d = 2) => {
    if (!Number.isFinite(x)) return String(x);
    const v = Math.abs(x) < 5 * Math.pow(10, -d - 1) ? 0 : x;
    return String(parseFloat(v.toFixed(d)));
  };
  ML.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  ML.rad = (deg) => deg * Math.PI / 180;
  ML.deg = (rad) => rad * 180 / Math.PI;

  /** DOM builder: h("div", {class:"x", onclick:fn}, "text", childNode, ...) */
  ML.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(kid));
    return el;
  };

  /* ---------- KaTeX ---------- */
  ML.tex = (s, display) => {
    try { return window.katex.renderToString(s, { throwOnError: false, displayMode: !!display }); }
    catch (_) { return s; }
  };
  ML.typeset = (el) => {
    if (!window.renderMathInElement) return;
    window.renderMathInElement(el, {
      delimiters: [{ left: "\\[", right: "\\]", display: true }, { left: "\\(", right: "\\)", display: false }],
      throwOnError: false,
    });
  };

  /* ---------- 2×2 / vector helpers ---------- */
  ML.la = {
    dot: (u, v) => u[0] * v[0] + u[1] * v[1],
    norm: (u) => Math.hypot(u[0], u[1]),
    mulV: (A, v) => [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]],
    mul: (A, B) => [
      [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
      [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
    ],
    det: (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0],
    tr: (A) => A[0][0] + A[1][1],
    inv: (A) => {
      const d = A[0][0] * A[1][1] - A[0][1] * A[1][0];
      return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]];
    },
    /** Eigen-data of a real 2×2. vals: [{l, v:[unit]}]; complex => {complex:true,re,im}. scalar => λI. */
    eig: (A) => {
      const a = A[0][0], b = A[0][1], c = A[1][0], d = A[1][1];
      const tr = a + d, det = a * d - b * c, disc = tr * tr / 4 - det;
      if (disc < -1e-9) return { tr, det, complex: true, re: tr / 2, im: Math.sqrt(-disc), vals: [] };
      const s = Math.sqrt(Math.max(disc, 0));
      const ls = s < 1e-9 ? [tr / 2] : [tr / 2 + s, tr / 2 - s];
      const scalar = s < 1e-9 && Math.abs(b) < 1e-9 && Math.abs(c) < 1e-9;
      const vals = ls.map((l) => {
        let v;
        if (Math.abs(b) > 1e-9) v = [b, l - a];
        else if (Math.abs(c) > 1e-9) v = [l - d, c];
        else v = Math.abs(l - a) < 1e-9 ? [1, 0] : [0, 1];
        const n = Math.hypot(v[0], v[1]);
        return { l, v: [v[0] / n, v[1] / n] };
      });
      return { tr, det, complex: false, scalar, repeated: s < 1e-9, vals: scalar ? [] : vals };
    },
  };

  /** numeric partial derivatives of f(x,y) */
  ML.num = {
    fx: (f, x, y, h = 1e-5) => (f(x + h, y) - f(x - h, y)) / (2 * h),
    fy: (f, x, y, h = 1e-5) => (f(x, y + h) - f(x, y - h)) / (2 * h),
    grad: (f, x, y) => [ML.num.fx(f, x, y), ML.num.fy(f, x, y)],
  };

  /* ---------- canvas view with math coordinates ---------- */
  ML.view = function (canvas, opt) {
    const o = Object.assign({ x: [-5, 5], y: [-5, 5], equal: true }, opt || {});
    const v = { canvas, ctx: null, w: 0, h: 0, Sx: 1, Sy: 1, o };
    v.begin = function () {
      const dpr = window.devicePixelRatio || 1;
      v.w = canvas.clientWidth; v.h = canvas.clientHeight;
      if (!v.w || !v.h) return null;
      canvas.width = Math.round(v.w * dpr); canvas.height = Math.round(v.h * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const xr = v.o.x[1] - v.o.x[0], yr = v.o.y[1] - v.o.y[0];
      if (v.o.equal) v.Sx = v.Sy = Math.min(v.w / xr, v.h / yr);
      else { v.Sx = v.w / xr; v.Sy = v.h / yr; }
      v.cx = (v.o.x[0] + v.o.x[1]) / 2; v.cy = (v.o.y[0] + v.o.y[1]) / 2;
      ctx.clearRect(0, 0, v.w, v.h);
      v.ctx = ctx;
      return ctx;
    };
    v.P = (x, y) => [v.w / 2 + (x - v.cx) * v.Sx, v.h / 2 - (y - v.cy) * v.Sy];
    v.inv = (px, py) => [(px - v.w / 2) / v.Sx + v.cx, (v.h / 2 - py) / v.Sy + v.cy];
    v.visible = () => [v.inv(0, v.h), v.inv(v.w, 0)]; // [[xmin,ymin],[xmax,ymax]]

    v.line = (x0, y0, x1, y1, color = ML.C.text, width = 1.5, dash) => {
      const c = v.ctx; c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round";
      c.setLineDash(dash || []);
      c.beginPath(); c.moveTo(...v.P(x0, y0)); c.lineTo(...v.P(x1, y1)); c.stroke(); c.setLineDash([]);
    };
    v.arrow = (x0, y0, x1, y1, color = ML.C.text, width = 3) => {
      const c = v.ctx, [a, b] = v.P(x0, y0), [p, q] = v.P(x1, y1);
      const dx = p - a, dy = q - b, len = Math.hypot(dx, dy);
      if (len < 2) return;
      const ux = dx / len, uy = dy / len, hd = Math.min(12, len * 0.5);
      c.strokeStyle = c.fillStyle = color; c.lineWidth = width; c.lineCap = "round"; c.setLineDash([]);
      c.beginPath(); c.moveTo(a, b); c.lineTo(p - ux * hd * 0.6, q - uy * hd * 0.6); c.stroke();
      c.beginPath(); c.moveTo(p, q);
      c.lineTo(p - ux * hd - uy * hd * 0.5, q - uy * hd + ux * hd * 0.5);
      c.lineTo(p - ux * hd + uy * hd * 0.5, q - uy * hd - ux * hd * 0.5);
      c.closePath(); c.fill();
    };
    v.dot = (x, y, color = ML.C.white, r = 5, stroke) => {
      const c = v.ctx; c.fillStyle = color; c.beginPath(); c.arc(...v.P(x, y), r, 0, 7); c.fill();
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
    };
    /** draggable-looking handle */
    v.handle = (x, y, color = ML.C.white, label) => {
      const c = v.ctx, [px, py] = v.P(x, y);
      c.fillStyle = ML.C.bg; c.strokeStyle = color; c.lineWidth = 3;
      c.beginPath(); c.arc(px, py, 8, 0, 7); c.fill(); c.stroke();
      if (label) v.text(label, x, y, color, 12, -10);
    };
    v.text = (str, x, y, color = ML.C.text, dx = 0, dy = 0, font = "600 13px system-ui, sans-serif", align = "left") => {
      const c = v.ctx; c.fillStyle = color; c.font = font; c.textAlign = align;
      const [px, py] = v.P(x, y); c.fillText(str, px + dx, py + dy); c.textAlign = "left";
    };
    v.poly = (pts, fill, stroke, width = 2) => {
      const c = v.ctx; c.beginPath();
      pts.forEach(([x, y], i) => { const p = v.P(x, y); i ? c.lineTo(...p) : c.moveTo(...p); });
      c.closePath();
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.setLineDash([]); c.stroke(); }
    };
    v.path = (fn, t0, t1, color = ML.C.blue, width = 2, n = 240, dash) => {
      const c = v.ctx; c.strokeStyle = color; c.lineWidth = width; c.setLineDash(dash || []);
      c.beginPath(); let started = false;
      for (let i = 0; i <= n; i++) {
        const pt = fn(t0 + (t1 - t0) * i / n);
        if (!pt || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) { started = false; continue; }
        const p = v.P(pt[0], pt[1]);
        started ? c.lineTo(...p) : c.moveTo(...p); started = true;
      }
      c.stroke(); c.setLineDash([]);
    };
    v.plot = (f, x0, x1, color, width, n = 300, dash) => v.path((x) => [x, f(x)], x0, x1, color, width, n, dash);
    v.circle = (x, y, r, stroke = ML.C.blue, fill, width = 2, dash) => {
      const c = v.ctx; c.beginPath(); c.ellipse(...v.P(x, y), r * v.Sx, r * v.Sy, 0, 0, 7);
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]); }
    };
    v.grid = (step = 1, color = ML.C.grid) => {
      const [[xa, ya], [xb, yb]] = v.visible();
      for (let x = Math.ceil(xa / step) * step; x <= xb; x += step) v.line(x, ya, x, yb, color, 1);
      for (let y = Math.ceil(ya / step) * step; y <= yb; y += step) v.line(xa, y, xb, y, color, 1);
    };
    v.axes = (color = ML.C.axis) => {
      const [[xa, ya], [xb, yb]] = v.visible();
      v.line(xa, 0, xb, 0, color, 1.5); v.line(0, ya, 0, yb, color, 1.5);
    };
    /** draw an offscreen canvas stretched over the math rectangle [x0,x1]×[y0,y1] */
    v.image = (img, x0, x1, y0, y1) => {
      const [ax, ay] = v.P(x0, y1), [bx, by] = v.P(x1, y0);
      v.ctx.imageSmoothingEnabled = true; v.ctx.drawImage(img, ax, ay, bx - ax, by - ay);
    };
    return v;
  };

  /** Render f(x,y) into an offscreen heat-map. Returns {canvas,min,max}. */
  ML.heatmap = function (f, rx, ry, opt) {
    const o = Object.assign({ n: 200, bands: 0, stops: [[28, 40, 120], [40, 140, 170], [110, 200, 130], [250, 228, 110]], min: null, max: null }, opt || {});
    const n = o.n, vals = new Float32Array(n * n);
    let mn = Infinity, mx = -Infinity;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const val = f(rx[0] + (i + 0.5) / n * (rx[1] - rx[0]), ry[1] - (j + 0.5) / n * (ry[1] - ry[0]));
      vals[j * n + i] = val; if (val < mn) mn = val; if (val > mx) mx = val;
    }
    if (o.min != null) mn = o.min; if (o.max != null) mx = o.max;
    const cv = document.createElement("canvas"); cv.width = cv.height = n;
    const cx = cv.getContext("2d"), img = cx.createImageData(n, n), st = o.stops, k = st.length - 1;
    for (let p = 0; p < n * n; p++) {
      const t = ML.clamp((vals[p] - mn) / (mx - mn || 1), 0, 1), s = Math.min(k - 1e-9, t * k), i0 = Math.floor(s), u = s - i0;
      const shade = o.bands && ((t * o.bands) % 1) < 0.07 ? 0.55 : 1;
      for (let ch = 0; ch < 3; ch++) img.data[p * 4 + ch] = (st[i0][ch] + (st[i0 + 1][ch] - st[i0][ch]) * u) * shade;
      img.data[p * 4 + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    return { canvas: cv, min: mn, max: mx };
  };
  /** diverging stops for signed values (negative blue, zero dark, positive orange) */
  ML.DIVERGING = [[40, 90, 220], [22, 26, 52], [255, 150, 60]];

  /* ---------- controls ---------- */
  ML.slider = function (parent, { label, min, max, step = 0.01, value, fmt, onInput }) {
    const out = ML.h("b", {});
    const input = ML.h("input", { type: "range", min, max, step, value });
    const show = () => { out.textContent = fmt ? fmt(+input.value) : ML.fmt(+input.value); };
    input.addEventListener("input", () => { show(); onInput && onInput(+input.value); });
    show();
    parent.append(ML.h("label", { class: "field" }, ML.h("span", { html: label + ": " }), out, input));
    return { get: () => +input.value, set: (v) => { input.value = v; show(); }, input };
  };
  ML.button = (parent, text, onClick, cls) => {
    const b = ML.h("button", { class: cls || "", onclick: onClick }, text); parent.append(b); return b;
  };
  ML.select = function (parent, { label, options, onChange }) {
    const s = ML.h("select", {}, options.map(([v, t]) => ML.h("option", { value: v }, t)));
    s.addEventListener("change", () => onChange(s.value));
    parent.append(ML.h("label", { class: "field" }, label, s));
    return s;
  };
  /** returns setter: set(rows=[[key, valueHtml]...], noteHtml?) */
  ML.readout = function (parent) {
    const dl = ML.h("dl", { class: "readout" }); parent.append(dl);
    return (rows, note) => {
      dl.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("") + (note ? `<dd class="note">${note}</dd>` : "");
    };
  };

  /* ---------- stage: canvas + side panel, redraws on resize ---------- */
  ML.stage = function (container, opt) {
    const o = Object.assign({ x: [-5, 5], y: [-5, 5], equal: true, aspect: "1 / 1", wide: false }, opt || {});
    const canvas = ML.h("canvas", { class: "stage-canvas" });
    const wrap = ML.h("div", { class: "canvas-wrap", style: `aspect-ratio:${o.aspect}` }, canvas);
    const panel = ML.h("div", { class: "panel" });
    const root = ML.h("div", { class: "widget" + (o.wide ? " wide" : "") }, wrap, panel);
    container.append(root);
    const st = { canvas, panel, root, view: ML.view(canvas, o), extras: [], drawFn: null };
    st.draw = (fn) => { st.drawFn = fn; st.redraw(); };
    st.redraw = () => {
      if (st.drawFn && st.view.begin()) st.drawFn(st.view);
      st.extras.forEach((e) => { if (e.fn && e.view.begin()) e.fn(e.view); });
      if (st.after) st.after();
    };
    /** secondary canvas inside the panel (e.g. a graph) */
    st.extra = (eo) => {
      const cv = ML.h("canvas", { class: "extra-canvas", style: `height:${(eo && eo.height) || 130}px` });
      panel.append(cv);
      const e = { canvas: cv, view: ML.view(cv, Object.assign({ equal: false }, eo || {})), fn: null };
      e.draw = (fn) => { e.fn = fn; st.redraw(); };
      st.extras.push(e);
      return e;
    };
    st.note = (html) => panel.append(ML.h("div", { class: "caption", html }));
    if (window.ResizeObserver) new ResizeObserver(() => st.redraw()).observe(canvas);
    window.addEventListener("resize", st.redraw);
    return st;
  };

  /**
   * Make points on a stage draggable.
   * getPts() -> [{x,y}], onMove(i, x, y). opt: {r:hit radius px, snap:step, clamp:[x0,x1,y0,y1]}
   */
  ML.drag = function (stage, getPts, onMove, opt) {
    const o = Object.assign({ r: 22, snap: 0, clamp: null }, opt || {});
    const cv = stage.canvas; let active = -1;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const hit = (px, py) => {
      let best = -1, bd = o.r;
      getPts().forEach((p, i) => { const d = Math.hypot(...stage.view.P(p.x, p.y).map((c, k) => c - [px, py][k])); if (d < bd) { bd = d; best = i; } });
      return best;
    };
    cv.addEventListener("pointerdown", (e) => {
      const [px, py] = pos(e); active = hit(px, py);
      if (active >= 0) { cv.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    cv.addEventListener("pointermove", (e) => {
      const [px, py] = pos(e);
      if (active < 0) { cv.style.cursor = hit(px, py) >= 0 ? "grab" : "default"; return; }
      let [x, y] = stage.view.inv(px, py);
      if (o.snap) { x = Math.round(x / o.snap) * o.snap; y = Math.round(y / o.snap) * o.snap; }
      if (o.clamp) { x = ML.clamp(x, o.clamp[0], o.clamp[1]); y = ML.clamp(y, o.clamp[2], o.clamp[3]); }
      onMove(active, x, y); stage.redraw();
    });
    const stop = () => { active = -1; };
    cv.addEventListener("pointerup", stop); cv.addEventListener("pointercancel", stop);
  };

  /* ---------- progress (localStorage, safe) ---------- */
  ML.store = {
    get(key, dflt) { try { const v = localStorage.getItem(key); return v == null ? dflt : JSON.parse(v); } catch (_) { return dflt; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) { /* ignore */ } },
  };
  ML.learned = {
    all: () => ML.store.get("ml_learned", {}),
    has: (id) => !!ML.learned.all()[id],
    toggle: (id) => { const a = ML.learned.all(); a[id] ? delete a[id] : (a[id] = 1); ML.store.set("ml_learned", a); return !!a[id]; },
  };
})(window.ML);
