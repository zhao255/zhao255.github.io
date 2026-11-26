(()=>{
  "use strict";

  const channel = new BroadcastChannel("jack-presentation");
  const $ = selector => document.querySelector(selector);
  const clock = seconds => Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
  let state;
  let startedAt = Date.now();
  let pausedAt = null;

  function el(tag, className, value) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (value) item.textContent = value;
    return item;
  }

  function elapsedSeconds() {
    return ((pausedAt ?? Date.now()) - startedAt) / 1000;
  }

  // Green while on the plan, amber once the talk runs past this slide's slot.
  function drawClock() {
    const elapsed = elapsedSeconds();
    $("#elapsed").textContent = clock(elapsed);
    if (!state) return;
    $("#plan").textContent = "Plan " + clock(state.start) + "–" + clock(state.end) + " of " + clock(state.totalSeconds);
    const pace = elapsed > state.end ? "behind" : elapsed < state.start - 60 ? "ahead" : "on";
    document.body.dataset.pace = pace;
  }

  // Likely questions sent by your own presentation: grouped, each answer folded under its question.
  let questionsKey = "";
  function drawQuestions(groups) {
    const panel = $("#tech");
    const search = el("input", "pv-q-search");
    search.type = "search";
    search.placeholder = "Filter questions";
    search.setAttribute("aria-label", "Filter the likely questions");
    const items = [];
    const body = groups.flatMap(group => {
      const head = el("h3", "pv-q-group", group.title);
      const list = group.items.map(({ q, a }) => {
        const item = el("details", "pv-q");
        item.append(el("summary", "", q), el("p", "", a));
        items.push({ item, head, text: (q + " " + a).toLowerCase() });
        return item;
      });
      return [head, ...list];
    });
    search.addEventListener("input", () => {
      const words = search.value.toLowerCase().split(/\s+/u).filter(Boolean);
      for (const entry of items) entry.item.hidden = !words.every(word => entry.text.includes(word));
      for (const head of new Set(items.map(entry => entry.head))) head.hidden = items.every(entry => entry.head !== head || entry.item.hidden);
    });
    const count = groups.reduce((sum, group) => sum + group.items.length, 0);
    panel.replaceChildren(el("h2", "pv-q-title", "Likely questions"), el("p", "pv-q-intro", count + " questions with answers. Only you see these."), search, ...body);
  }

  function render(next) {
    next.questions = Array.isArray(next.questions) ? next.questions : [];
    const nextQuestionsKey = JSON.stringify(next.questions);
    const changed = !state || state.index !== next.index || state.tech.join() !== next.tech.join() || questionsKey !== nextQuestionsKey;
    state = next;
    $("#waiting").hidden = true;
    $("#main").hidden = false;
    $("#count").textContent = "Slide " + (state.index + 1) + " / " + state.total;
    $("#chapter").textContent = state.chapter;
    $("#section").textContent = state.section;
    $("#title").textContent = state.title;
    $("#timing").textContent = state.timing;
    $("#previous").disabled = state.index === 0;
    $("#next").disabled = !state.next;
    $("#next-slide").replaceChildren(...(state.next
      ? [el("span", "pv-label", "Next"), el("strong", "", state.next.title), el("span", "pv-next-section", state.next.section)]
      : [el("span", "pv-label", "Last slide")]));
    const notes = $("#notes");
    notes.replaceChildren(...(state.cue ? [el("p", "pv-cue", state.cue)] : []), ...state.notes.map(paragraph => el("p", "", paragraph)));
    if (state.sources) {
      const sources = el("details");
      sources.append(el("summary", "", "Source material"), el("p", "", state.sources));
      notes.append(sources);
    }
    if (changed) {
      questionsKey = nextQuestionsKey;
      const body = state.questions.length ? null : window.techDetail.build(state.tech, { sources: true });
      if (body) $("#tech").replaceChildren(...body);
      else drawQuestions(state.questions);
      const filled = !body || body.length > 0;
      $("#tech").hidden = !filled;
      $("#tech-empty").hidden = filled;
      $("#tech").scrollTop = 0;
      $(".pv-left").scrollTop = 0;
    }
    document.title = (state.index + 1) + "/" + state.total + " · " + state.title + " | Presenter view";
    drawClock();
  }

  // Project order: the deck sends its chapters; applying here reorders the deck.
  let projects = null;
  let projectsEditor = null;
  const projectsButton = $("#projects-button");
  const projectsDialog = $("#projects-dialog");
  // `order` keeps unapplied changes when the list is redrawn for a project added or removed.
  function openProjects(order = projects.order) {
    projectsEditor = window.projectOrder.editor($("#projects-editor"), {
      ...projects,
      order,
      onApply: next => {
        projectsDialog.close();
        channel.postMessage({ type: "order", order: next });
      }
    });
    if (!projectsDialog.open) projectsDialog.showModal();
  }
  projectsButton.addEventListener("click", () => { if (projects) openProjects(); });

  channel.addEventListener("message", ({ data }) => {
    if (data?.type === "state") render(data);
    if (data?.type === "projects") {
      projects = data;
      if (projectsDialog.open) openProjects(projectsEditor?.pending());
      projectsButton.disabled = false;
      projectsButton.title = "Choose which projects to show and in what order";
    }
  });

  const go = to => channel.postMessage({ type: "go", to });
  $("#previous").addEventListener("click", () => go("previous"));
  $("#next").addEventListener("click", () => go("next"));
  window.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || document.querySelector("dialog[open]")) return;
    if (event.target.closest?.("button, summary, input, label, select") && [" ", "Enter"].includes(event.key)) return;
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(event.key)) go("next");
    else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(event.key)) go("previous");
    else if (event.key === "Home") go(0);
    else if (event.key === "End" && state) go(state.total - 1);
    else return;
    event.preventDefault();
  });

  $("#timer-toggle").addEventListener("click", event => {
    if (pausedAt === null) {
      pausedAt = Date.now();
      event.currentTarget.textContent = "Resume";
    } else {
      startedAt += Date.now() - pausedAt;
      pausedAt = null;
      event.currentTarget.textContent = "Pause";
    }
    drawClock();
  });
  $("#timer-reset").addEventListener("click", () => {
    startedAt = Date.now();
    if (pausedAt !== null) pausedAt = startedAt;
    drawClock();
  });

  // Presence: the deck hides its Engineering drawer while this window is open.
  channel.postMessage({ type: "hello" });
  setInterval(() => channel.postMessage({ type: "ping" }), 2000);
  setInterval(drawClock, 500);
  window.addEventListener("pagehide", () => channel.postMessage({ type: "bye" }));
  drawClock();
})();
