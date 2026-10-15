"use strict";
/* Hash router and page renderers: home → course → proof, plus flashcard review. */
(function (ML) {
  const h = ML.h, root = document.getElementById("app");

  const course = (id) => ML.courses.find((c) => c.id === id);
  const proofsOf = (cid, tid) => ML.proofs.filter((p) => p.course === cid && (!tid || p.topic === tid));
  const progress = (cid) => {
    const ps = proofsOf(cid);
    return { done: ps.filter((p) => ML.learned.has(p.id)).length, total: ps.length };
  };
  const crumbs = (...parts) => h("nav", { class: "crumbs" }, parts.flatMap((p, i) => [
    i ? h("span", { class: "sep" }, "›") : null,
    p.href ? h("a", { href: p.href }, p.text) : h("span", {}, p.text),
  ]));
  const bar = (done, total) => h("div", { class: "bar", title: `${done} of ${total} proofs learned` },
    h("div", { style: `width:${total ? (100 * done / total) : 0}%` }));

  /* ---------------- home ---------------- */
  function home() {
    document.title = "MathLab";
    const cards = ML.courses.map((c) => {
      const { done, total } = progress(c.id);
      return h("a", { class: "course-card", href: `#/course/${c.id}`, style: `--cc:${c.color}` },
        h("div", { class: "cc-icon" }, c.icon),
        h("h3", {}, c.title),
        h("p", {}, c.blurb),
        h("div", { class: "cc-meta" }, `${c.topics.length} topics · ${total} proofs`),
        bar(done, total),
        h("div", { class: "cc-meta" }, `${done} / ${total} learned`));
    });
    return h("div", {},
      h("section", { class: "hero" },
        h("h1", {}, "Understand the proofs. Don’t just memorize them."),
        h("p", {}, "Pick a course. Every important proof comes with an interactive picture, a step-by-step explanation, and a one-screen summary for the night before the exam.")),
      h("div", { class: "course-grid" }, cards),
      h("section", { class: "how" },
        h("div", {}, h("b", {}, "1 · Play"), h("p", {}, "Drag, slide and break the statement in the interactive figure.")),
        h("div", {}, h("b", {}, "2 · Prove"), h("p", {}, "Follow the proof step by step, then hide it and test yourself.")),
        h("div", {}, h("b", {}, "3 · Memorize"), h("p", {}, "A short card with the formula, the key idea and the usual exam traps."))));
  }

  /* ---------------- course ---------------- */
  function coursePage(cid) {
    const c = course(cid);
    if (!c) return notFound();
    document.title = c.title + " · MathLab";
    const { done, total } = progress(cid);
    const sections = c.topics.map((t, ti) => {
      const ps = proofsOf(cid, t.id);
      return h("section", { class: "topic" },
        h("div", { class: "topic-head" }, h("span", { class: "tnum" }, ti + 1), h("div", {}, h("h2", {}, t.title), h("p", {}, t.blurb))),
        ps.length ? h("div", { class: "proof-list" }, ps.map((p, i) =>
          h("a", { class: "proof-row", href: `#/proof/${p.id}` },
            h("span", { class: "check" + (ML.learned.has(p.id) ? " on" : "") }, ML.learned.has(p.id) ? "✓" : String(i + 1)),
            h("div", {}, h("b", {}, p.title), h("span", {}, p.blurb || "")),
            h("span", { class: "go" }, "→")))) : h("p", { class: "soon" }, "Coming soon."));
    });
    return h("div", { style: `--cc:${c.color}` },
      crumbs({ text: "Courses", href: "#/" }, { text: c.title }),
      h("div", { class: "course-head" },
        h("div", {}, h("h1", {}, c.title), h("p", {}, c.blurb)),
        h("div", { class: "course-actions" },
          h("div", { class: "cc-meta" }, `${done} / ${total} proofs learned`), bar(done, total),
          h("a", { class: "btn primary", href: `#/review/${cid}` }, "⚡ Quick review mode"))),
      sections);
  }

  /* ---------------- proof ---------------- */
  function proofPage(pid) {
    const p = ML.proofs.find((x) => x.id === pid);
    if (!p) return notFound();
    const c = course(p.course), t = c.topics.find((x) => x.id === p.topic);
    document.title = p.title + " · MathLab";
    const list = proofsOf(c.id), idx = list.indexOf(p);
    const prev = list[idx - 1], next = list[idx + 1];

    /* viz */
    const vizBox = h("div", { class: "viz-box" });
    try { p.viz(vizBox); } catch (e) { vizBox.append(h("p", { class: "error" }, "Visualization failed: " + e.message)); console.error(e); }

    /* steps with recall mode */
    const steps = h("ol", { class: "steps" }, p.steps.map((s) =>
      h("li", {}, h("div", { class: "step-title", html: s.t }), s.d ? h("div", { class: "step-body", html: s.d }) : null)));
    steps.querySelectorAll("li").forEach((li) => li.addEventListener("click", () => li.classList.remove("hidden")));
    const recallBtn = h("button", { class: "btn" }, "🙈 Test myself");
    let recall = false;
    recallBtn.onclick = () => {
      recall = !recall;
      steps.querySelectorAll("li").forEach((li) => li.classList.toggle("hidden", recall));
      recallBtn.textContent = recall ? "👁 Show all" : "🙈 Test myself";
      hint.textContent = recall ? "Try to say each step out loud, then click it to check." : "";
    };
    const hint = h("span", { class: "hint" });

    /* memorize card */
    const m = p.memorize || {};
    const memo = h("section", { class: "memo" },
      h("h3", {}, "📌 Memorize"),
      m.formula ? h("div", { class: "memo-formula", html: "\\[" + m.formula + "\\]" }) : null,
      h("div", { class: "memo-idea", html: "<b>Key idea:</b> " + p.idea }),
      m.bullets ? h("ul", {}, m.bullets.map((b) => h("li", { html: b }))) : null,
      m.pitfalls ? h("div", { class: "pitfalls" }, h("b", {}, "⚠ Exam traps"), h("ul", {}, m.pitfalls.map((b) => h("li", { html: b })))) : null);

    /* learned toggle */
    const learnBtn = h("button", { class: "btn" });
    const syncLearn = () => { const on = ML.learned.has(p.id); learnBtn.textContent = on ? "✓ Marked as learned" : "Mark as learned"; learnBtn.classList.toggle("primary", !on); learnBtn.classList.toggle("done", on); };
    learnBtn.onclick = () => { ML.learned.toggle(p.id); syncLearn(); };
    syncLearn();

    const page = h("div", { style: `--cc:${c.color}` },
      crumbs({ text: "Courses", href: "#/" }, { text: c.title, href: `#/course/${c.id}` }, { text: t.title }),
      h("div", { class: "tag" }, `${c.title} · ${t.title}`),
      h("h1", { class: "proof-title" }, p.title),
      h("div", { class: "statement" }, h("b", {}, "Statement. "), h("span", { html: p.statement })),
      h("h2", { class: "sec" }, "1 · Play with it"),
      p.vizIntro ? h("p", { class: "viz-intro", html: p.vizIntro }) : null,
      vizBox,
      p.vizNote ? h("p", { class: "viz-note", html: p.vizNote }) : null,
      h("h2", { class: "sec" }, "2 · The proof, step by step"),
      h("div", { class: "recall-bar" }, recallBtn, hint),
      steps,
      h("h2", { class: "sec" }, "3 · Quick summary"),
      memo,
      h("div", { class: "proof-foot" },
        learnBtn,
        h("div", { class: "pn" },
          prev ? h("a", { class: "btn", href: `#/proof/${prev.id}` }, "← " + prev.title) : null,
          next ? h("a", { class: "btn", href: `#/proof/${next.id}` }, next.title + " →") : null)));
    ML.typeset(page);
    return page;
  }

  /* ---------------- flashcard review ---------------- */
  function reviewPage(cid) {
    const c = course(cid);
    if (!c) return notFound();
    document.title = "Review · " + c.title;
    const deck = proofsOf(cid);
    if (!deck.length) return h("p", {}, "No cards yet.");
    let i = 0, flipped = false, order = deck.slice();
    const card = h("div", { class: "flash", tabindex: 0 });
    const counter = h("div", { class: "cc-meta" });
    const render = () => {
      const p = order[i], m = p.memorize || {};
      counter.textContent = `Card ${i + 1} / ${order.length}`;
      card.className = "flash" + (flipped ? " back" : "");
      card.innerHTML = flipped
        ? `<div class="tag">Answer</div><h3>${p.title}</h3><p><b>Key idea:</b> ${p.idea}</p>` +
          (m.formula ? `<div class="memo-formula">\\[${m.formula}\\]</div>` : "") +
          (m.bullets ? "<ul>" + m.bullets.map((b) => `<li>${b}</li>`).join("") + "</ul>" : "") +
          `<a href="#/proof/${p.id}">Open full proof →</a>`
        : `<div class="tag">${c.topics.find((t) => t.id === p.topic).title}</div><h3>${p.title}</h3><p>${p.statement}</p><div class="flip-hint">Click, or press Space, to flip: try to recall the proof idea first.</div>`;
      ML.typeset(card);
    };
    const go = (d) => { i = (i + d + order.length) % order.length; flipped = false; render(); };
    card.onclick = (e) => { if (e.target.tagName === "A") return; flipped = !flipped; render(); };
    const key = (e) => {
      if (!document.body.contains(card)) { window.removeEventListener("keydown", key); return; }
      if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") { e.preventDefault(); flipped = !flipped; render(); }
    };
    window.addEventListener("keydown", key);
    const shuffle = h("button", { class: "btn", onclick: () => { order.sort(() => Math.random() - 0.5); i = 0; flipped = false; render(); } }, "🔀 Shuffle");
    render();
    return h("div", { style: `--cc:${c.color}` },
      crumbs({ text: "Courses", href: "#/" }, { text: c.title, href: `#/course/${c.id}` }, { text: "Quick review" }),
      h("h1", {}, "Quick review"),
      h("p", { class: "lead" }, "Read the statement, recall the proof idea, then flip. Use ← → and Space."),
      counter, card,
      h("div", { class: "row" }, h("button", { class: "btn", onclick: () => go(-1) }, "← Prev"), shuffle, h("button", { class: "btn primary", onclick: () => go(1) }, "Next →")));
  }

  function notFound() { return h("div", { class: "hero" }, h("h1", {}, "Page not found"), h("a", { class: "btn primary", href: "#/" }, "Back to courses")); }

  /* ---------------- router ---------------- */
  function route() {
    const [, kind, id] = (location.hash || "#/").split("/");
    const page = kind === "course" ? coursePage(id) : kind === "proof" ? proofPage(id) : kind === "review" ? reviewPage(id) : home();
    root.replaceChildren(page);
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})(window.ML);
