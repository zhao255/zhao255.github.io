// Which projects the talk shows, and in what order. The opening slides stay
// first and the closing slide stays last; each project chapter can be ticked
// on or off and dragged into place. Shared by the deck and the presenter view.
(()=>{
  "use strict";

  const storageKey = "jack-presentation-project-order-v1";

  function el(tag, className, value) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (value) item.textContent = value;
    return item;
  }

  // Opening slides, then each chapter (from its nav slide), then the close.
  // A chapter is keyed by its name, or by orderKey for projects added in the
  // app, so renaming one of those keeps its place.
  function split(all) {
    const opening = [];
    const chapters = new Map();
    let close = null;
    let chapter = null;
    for (const slide of all) {
      if (slide.id === "close") {
        close = slide;
        continue;
      }
      if (slide.nav) {
        chapter = slide.orderKey || slide.nav;
        chapters.set(chapter, []);
      }
      if (chapter) chapters.get(chapter).push(slide);
      else opening.push(slide);
    }
    return { opening, chapters, close };
  }

  function defaults(ids) {
    return ids.map(id => ({ id, show: true }));
  }

  // Keep a saved order for the chapters that still exist; new chapters join at the end.
  function normalise(order, ids) {
    const known = Array.isArray(order) ? order.filter(entry => entry && ids.includes(entry.id)) : [];
    const seen = new Set(known.map(entry => entry.id));
    return [...known.map(entry => ({ id: entry.id, show: entry.show !== false })), ...ids.filter(id => !seen.has(id)).map(id => ({ id, show: true }))];
  }

  function read(all) {
    const ids = [...split(all).chapters.keys()];
    try {
      return normalise(JSON.parse(localStorage.getItem(storageKey)), ids);
    } catch {
      return defaults(ids);
    }
  }

  function save(order) {
    try { localStorage.setItem(storageKey, JSON.stringify(order)); } catch { /* Keep the order for this session. */ }
  }

  function arrange(all, order) {
    const { opening, chapters, close } = split(all);
    const ids = [...chapters.keys()];
    const chosen = normalise(order, ids).filter(entry => entry.show).flatMap(entry => chapters.get(entry.id));
    return [...opening, ...chosen, ...(close ? [close] : [])];
  }

  // What the editor needs: each chapter's size and length, plus the fixed slides.
  function summary(all) {
    const { opening, chapters, close } = split(all);
    const seconds = list => list.reduce((sum, slide) => sum + (slide.seconds || 0), 0);
    return {
      projects: [...chapters].map(([id, list]) => ({
        id,
        name: list[0].nav,
        slides: list.length,
        seconds: seconds(list),
        lead: list[0].lead || list[0].title,
        custom: list[0].customId ? { id: list[0].customId, minutes: list[0].seconds / 60, missing: Boolean(list[0].missing), choices: list[0].choices || [] } : null
      })),
      fixedSeconds: seconds(opening) + (close ? close.seconds || 0 : 0),
      ids: [...chapters.keys()]
    };
  }

  const minutes = seconds => String(Math.round(seconds / 6) / 10);
  const minutesLabel = value => String(Math.round(Number(value) * 10) / 10) + " min";
  // Projects whose presentation list is open, kept while the editor is redrawn.
  const openLists = new Set();

  // Builds the tick-box list into `host`. Rows drag to reorder; the arrow
  // buttons do the same from the keyboard. In the Windows presentation app the
  // list also takes presentations of your own: add an HTML page, then name it
  // and set its length here. Returns the unapplied order, so the list can be
  // redrawn when projects are added or removed without losing your changes.
  function editor(host, { projects, fixedSeconds, ids, order, onApply }) {
    const app = window.presentationApp?.projects || null;
    const byId = new Map(projects.map(project => [project.id, project]));
    let pending = normalise(order, ids);
    // The list scrolls on its own; a redraw (after a change) keeps its place.
    const scrolled = host.querySelector(".project-order")?.scrollTop || 0;
    host.replaceChildren();
    const list = el("ol", "project-order");
    const total = el("p", "project-total");
    const actions = el("div", "ranking-actions");
    const reset = el("button", "", "Reset to default");
    const apply = el("button", "primary", "Apply");
    reset.type = apply.type = "button";
    if (app) {
      const add = el("button", "project-add", "Add presentation…");
      add.type = "button";
      add.title = "Add an HTML presentation of your own as a project";
      add.addEventListener("click", () => run(add, app.add()));
      actions.append(add);
    }
    actions.append(reset, apply);
    const status = el("p", "project-status");
    status.setAttribute("role", "status");
    // Total, messages and buttons sit below the list and stay in view.
    const footer = el("div", "project-footer");
    footer.append(total, status, actions);
    host.append(list, footer);
    let dragging = null;

    // The app saves the change and sends the new list to the deck, which redraws this editor.
    function run(control, request) {
      control.disabled = true;
      status.textContent = "";
      Promise.resolve(request)
        .catch(error => { status.textContent = "That didn’t work: " + (error?.message || error); })
        .finally(() => { if (control.isConnected) control.disabled = false; });
    }

    const checkbox = row => row.querySelector(".project-show");

    function sync() {
      pending = [...list.children].map(row => ({ id: row.dataset.id, show: checkbox(row).checked }));
      [...list.children].forEach((row, index) => {
        row.querySelector(".project-position").textContent = checkbox(row).checked ? String(pending.filter((entry, i) => entry.show && i <= index).length) : "–";
        row.classList.toggle("is-hidden", !checkbox(row).checked);
        row.querySelector(".project-up").disabled = index === 0;
        row.querySelector(".project-down").disabled = index === list.children.length - 1;
      });
      const shown = pending.filter(entry => entry.show);
      const seconds = fixedSeconds + shown.reduce((sum, entry) => sum + byId.get(entry.id).seconds, 0);
      total.replaceChildren(el("b", "", minutes(seconds) + " min"), " talk · " + shown.length + " of " + pending.length + " projects shown");
    }

    function move(row, offset) {
      const target = offset < 0 ? row.previousElementSibling : row.nextElementSibling?.nextElementSibling ?? null;
      if (offset < 0 && !target) return;
      list.insertBefore(row, target);
      sync();
      row.querySelector(offset < 0 ? ".project-up" : ".project-down").focus();
    }

    // A project of your own: its name and length can be edited, and it can be removed.
    function customFields(project, box) {
      const fields = el("span", "project-text project-custom");
      const name = el("input", "project-name");
      name.type = "text";
      name.value = project.name;
      name.maxLength = 60;
      name.setAttribute("aria-label", "Project name");
      name.addEventListener("change", () => {
        if (name.value.trim()) run(name, app.update(project.custom.id, { name: name.value }));
        else name.value = project.name;
      });
      box.setAttribute("aria-label", "Show " + project.name);
      const meta = el("span", "project-meta");
      const length = el("input", "project-minutes");
      length.type = "number";
      length.min = "0.5";
      length.max = "120";
      length.step = "0.5";
      length.value = String(project.custom.minutes);
      length.setAttribute("aria-label", "Minutes for " + project.name);
      length.addEventListener("change", () => run(length, app.update(project.custom.id, { minutes: Number(length.value) })));
      meta.append(el("span", "project-badge", "Your presentation"), length, " min");
      if (project.custom.missing) meta.append(el("span", "project-missing", "File not found"));
      fields.append(name, meta);
      // An app built before presentation lists existed has no swap call.
      if (typeof app.swap === "function") fields.append(presentationList(project));
      // Typing in a field must not start a row drag.
      for (const input of [name, length]) {
        input.addEventListener("pointerdown", () => { input.closest(".project-option").draggable = false; });
        input.addEventListener("blur", () => { const row = input.closest(".project-option"); if (row) row.draggable = true; });
      }
      return fields;
    }

    // The presentations this project can show, in a list that opens from the
    // row: choose one to show it in this place of the talk, add another, or take
    // one off the list. The project keeps its name and position whichever is shown.
    function presentationList(project) {
      const id = project.custom.id;
      const choices = project.custom.choices.length ? project.custom.choices : [{ file: "", title: project.name, current: true, missing: project.custom.missing }];
      const shown = choices.find(choice => choice.current) || choices[0];
      const box = el("details", "project-decks");
      box.open = openLists.has(id);
      box.addEventListener("toggle", () => { if (box.open) openLists.add(id); else openLists.delete(id); });
      const summary = el("summary", "project-decks-summary");
      summary.append(el("span", "project-decks-label", "Showing"), el("b", "", shown.title),
        el("span", "project-decks-count", choices.length + (choices.length === 1 ? " presentation" : " presentations")));
      const items = el("ul", "project-deck-list");
      items.setAttribute("role", "radiogroup");
      items.setAttribute("aria-label", "Presentations for " + project.name);
      for (const choice of choices) {
        const item = el("li", "project-deck" + (choice.current ? " is-current" : "") + (choice.missing ? " is-missing" : ""));
        const pick = el("label", "project-deck-pick");
        const radio = el("input");
        radio.type = "radio";
        radio.name = "deck-" + id;
        radio.checked = choice.current;
        radio.disabled = choice.missing && !choice.current;
        radio.addEventListener("change", () => {
          if (!radio.checked || choice.current) return;
          run(radio, app.swap(id, choice.file).catch(error => {
            radio.checked = false;
            const current = items.querySelector(".is-current input");
            if (current) current.checked = true;
            throw error;
          }));
        });
        const text = el("span", "project-deck-text");
        const file = choice.file.split(/[\\/]/).pop();
        const details = [file, choice.minutes ? minutesLabel(choice.minutes) : "", choice.missing ? "file not found" : ""].filter(Boolean).join(" · ");
        text.append(el("strong", "", choice.title), el("small", "", details));
        if (choice.file) text.title = choice.file;
        pick.append(radio, text);
        item.append(pick);
        if (!choice.current && typeof app.forget === "function") {
          const forget = el("button", "project-deck-forget", "×");
          forget.type = "button";
          forget.title = "Take " + choice.title + " off this list (the file is kept)";
          forget.setAttribute("aria-label", forget.title);
          forget.addEventListener("click", () => run(forget, app.forget(id, choice.file)));
          item.append(forget);
        }
        items.append(item);
      }
      const add = el("button", "project-deck-add", "Add a presentation…");
      add.type = "button";
      add.title = "Pick an HTML presentation to add to this list and show";
      add.addEventListener("click", () => run(add, app.swap(id)));
      box.append(summary, items, add);
      // Clicking in the list must not start a row drag.
      box.addEventListener("pointerdown", () => { const row = box.closest(".project-option"); if (row) row.draggable = false; });
      box.addEventListener("pointerup", () => { const row = box.closest(".project-option"); if (row) row.draggable = true; });
      return box;
    }

    function draw() {
      list.replaceChildren(...pending.map(entry => {
        const project = byId.get(entry.id);
        const label = project.name || project.id;
        const custom = Boolean(project.custom && app);
        const row = el("li", "project-option" + (project.custom ? " is-custom" : ""));
        row.dataset.id = entry.id;
        row.draggable = true;
        const handle = el("span", "project-handle");
        handle.setAttribute("aria-hidden", "true");
        handle.title = "Drag to reorder";
        const position = el("span", "project-position");
        const box = el("input", "project-show");
        box.type = "checkbox";
        box.checked = entry.show;
        box.addEventListener("change", sync);
        let choice;
        if (custom) {
          choice = el("div", "project-label");
          choice.append(box, customFields(project, box));
        } else {
          choice = el("label", "project-label");
          const text = el("span", "project-text");
          text.append(el("strong", "", label), el("span", "", project.slides + (project.slides === 1 ? " slide · " : " slides · ") + minutes(project.seconds) + " min"));
          choice.append(box, text);
        }
        const controls = el("span", "project-moves");
        const up = el("button", "project-up", "↑");
        const down = el("button", "project-down", "↓");
        up.type = down.type = "button";
        up.setAttribute("aria-label", "Move " + label + " earlier");
        down.setAttribute("aria-label", "Move " + label + " later");
        up.addEventListener("click", () => move(row, -1));
        down.addEventListener("click", () => move(row, 1));
        controls.append(up, down);
        if (custom) {
          const remove = el("button", "project-remove", "×");
          remove.type = "button";
          remove.title = "Remove " + label + " from the deck (the file is kept)";
          remove.setAttribute("aria-label", remove.title);
          remove.addEventListener("click", () => run(remove, app.remove(project.custom.id)));
          controls.append(remove);
        }
        row.append(handle, position, choice, controls);
        row.addEventListener("dragstart", event => {
          dragging = row;
          row.classList.add("is-dragging");
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", entry.id);
        });
        row.addEventListener("dragend", () => {
          row.classList.remove("is-dragging");
          dragging = null;
          sync();
        });
        return row;
      }));
      sync();
    }

    list.addEventListener("dragover", event => {
      if (!dragging) return;
      event.preventDefault();
      const after = [...list.children].find(row => row !== dragging && event.clientY < row.getBoundingClientRect().top + row.offsetHeight / 2);
      if (after !== dragging.nextElementSibling) list.insertBefore(dragging, after || null);
    });
    list.addEventListener("drop", event => event.preventDefault());
    reset.addEventListener("click", () => { pending = defaults(ids); draw(); });
    apply.addEventListener("click", () => onApply(pending.map(entry => ({ ...entry }))));
    draw();
    list.scrollTop = scrolled;
    return { pending: () => pending.map(entry => ({ ...entry })) };
  }

  window.projectOrder = { arrange, read, save, summary, editor, normalise };
})();
