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
        chapter = slide.nav;
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
      projects: [...chapters].map(([id, list]) => ({ id, slides: list.length, seconds: seconds(list), lead: list[0].lead || list[0].title })),
      fixedSeconds: seconds(opening) + (close ? close.seconds || 0 : 0),
      ids: [...chapters.keys()]
    };
  }

  const minutes = seconds => String(Math.round(seconds / 6) / 10);

  // Builds the tick-box list into `host`. Rows drag to reorder; the arrow
  // buttons do the same from the keyboard.
  function editor(host, { projects, fixedSeconds, ids, order, onApply }) {
    const byId = new Map(projects.map(project => [project.id, project]));
    let pending = normalise(order, ids);
    host.replaceChildren();
    const list = el("ol", "project-order");
    const total = el("p", "project-total");
    const actions = el("div", "ranking-actions");
    const reset = el("button", "", "Reset to default");
    const apply = el("button", "primary", "Apply");
    reset.type = apply.type = "button";
    actions.append(reset, apply);
    host.append(list, total, actions);
    let dragging = null;

    function sync() {
      pending = [...list.children].map(row => ({ id: row.dataset.id, show: row.querySelector("input").checked }));
      [...list.children].forEach((row, index) => {
        row.querySelector(".project-position").textContent = row.querySelector("input").checked ? String(pending.filter((entry, i) => entry.show && i <= index).length) : "–";
        row.classList.toggle("is-hidden", !row.querySelector("input").checked);
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

    function draw() {
      list.replaceChildren(...pending.map(entry => {
        const project = byId.get(entry.id);
        const row = el("li", "project-option");
        row.dataset.id = entry.id;
        row.draggable = true;
        const handle = el("span", "project-handle");
        handle.setAttribute("aria-hidden", "true");
        handle.title = "Drag to reorder";
        const position = el("span", "project-position");
        const label = el("label", "project-label");
        const box = el("input");
        box.type = "checkbox";
        box.checked = entry.show;
        box.addEventListener("change", sync);
        const text = el("span", "project-text");
        text.append(el("strong", "", project.id), el("span", "", project.slides + (project.slides === 1 ? " slide · " : " slides · ") + minutes(project.seconds) + " min"));
        label.append(box, text);
        const controls = el("span", "project-moves");
        const up = el("button", "project-up", "↑");
        const down = el("button", "project-down", "↓");
        up.type = down.type = "button";
        up.setAttribute("aria-label", "Move " + project.id + " earlier");
        down.setAttribute("aria-label", "Move " + project.id + " later");
        up.addEventListener("click", () => move(row, -1));
        down.addEventListener("click", () => move(row, 1));
        controls.append(up, down);
        row.append(handle, position, label, controls);
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
  }

  window.projectOrder = { arrange, read, save, summary, editor, normalise };
})();
