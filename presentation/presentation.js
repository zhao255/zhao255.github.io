(()=>{
  "use strict";

  const stairio = window.stairioPresentation;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const embedded = parent !== window && new URLSearchParams(location.search).has("embedded");
  const allSlides = prepare(stairio.orderedSlides());
  let projectOrderState = window.projectOrder.read(allSlides);
  let slides = prepare(window.projectOrder.arrange(allSlides, projectOrderState));
  let heroPlayback;
  let sceneFrame;
  const touchControls = document.querySelector("#touch-controls");
  const presentation = document.querySelector("#presentation");
  const stage = document.querySelector(".stage");
  let slide = document.querySelector("#slide");
  const previous = document.querySelector("#previous");
  const next = document.querySelector("#next");
  const count = document.querySelector("#slide-count");
  const progressBar = document.querySelector("#progress");
  const progress = document.querySelector("#progress-fill");
  const notes = document.querySelector("#notes");
  const notesContent = document.querySelector("#notes-content");
  const keys = document.querySelector("#keys");
  const notice = document.querySelector("#notice");
  const fullscreen = document.querySelector("#fullscreen");
  const announcement = document.querySelector("#announcement");
  const chapterNav = document.querySelector("#chapters");
  const wipe = document.querySelector("#wipe");
  const wipeCopy = wipe.querySelector(".wipe-copy");
  const wipePart = wipe.querySelector(".wipe-part");
  const wipeTitle = wipe.querySelector(".wipe-title");
  const nextKeys = new Set(["ArrowDown", "ArrowRight", "PageDown", " ", "Enter"]);
  const prevKeys = new Set(["ArrowUp", "ArrowLeft", "PageUp", "Backspace"]);
  let current = -1;
  let activeDemo;
  let noticeTimer;
  let transitionToken = 0;
  let transitioning = false;

  const orderDialog = document.querySelector("#ranking");
  const orderHost = document.querySelector("#project-editor");

  function projectSummary() {
    return { ...window.projectOrder.summary(allSlides), order: projectOrderState };
  }

  // Rebuild the talk from the chosen projects, staying on the current slide when it is still shown.
  function applyProjectOrder(order) {
    projectOrderState = window.projectOrder.normalise(order, window.projectOrder.summary(allSlides).ids);
    window.projectOrder.save(projectOrderState);
    const currentSlide = slides[current];
    slides = prepare(window.projectOrder.arrange(allSlides, projectOrderState));
    buildChapters();
    const kept = slides.indexOf(currentSlide);
    const position = kept >= 0 ? kept : Math.min(current, slides.length - 1);
    current = -1;
    changeSlide(position);
    publishProjects();
    message("Project order updated: " + slides.filter(item => item.nav).map(item => item.nav).join(", ") + ".");
  }

  const rank = {
    dialog: orderDialog,
    open() {
      window.projectOrder.editor(orderHost, {
        ...projectSummary(),
        onApply: order => {
          orderDialog.close();
          applyProjectOrder(order);
        }
      });
      orderDialog.showModal();
    }
  };

  // Durations live on each slide, so the clock times in the notes and the
  // outline stay right when sections are added or the designs are reordered.
  function prepare(list) {
    let chapter = null;
    let part = 0;
    for (const item of list) {
      if (item.seconds === undefined) {
        const match = /^(\d+):(\d{2})–(\d+):(\d{2})[^\n]*\n\n/u.exec(item.notes || "");
        item.seconds = match ? (Number(match[3]) * 60 + Number(match[4])) - (Number(match[1]) * 60 + Number(match[2])) : 60;
        if (match) item.notes = item.notes.slice(match[0].length);
      }
      // "PART n" follows the chosen project order.
      item.baseSection ??= item.section;
      if (item.nav) {
        chapter = item.nav;
        if (/^PART /u.test(item.baseSection || "")) {
          part += 1;
          item.part = part;
          item.section = item.baseSection.replace(/^PART [0-9]+/u, "PART " + part);
        } else {
          item.part = undefined;
        }
      }
      item.chapter = chapter;
    }
    return list;
  }

  const clock = seconds => Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  const minutes = seconds => String(Math.round(seconds / 6) / 10);
  function spoken(seconds) {
    const whole = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return [whole ? whole + (whole === 1 ? " minute" : " minutes") : "", rest ? rest + " seconds" : ""].filter(Boolean).join(" ");
  }
  function timing(index) {
    const start = slides.slice(0, index).reduce((sum, item) => sum + item.seconds, 0);
    return clock(start) + "–" + clock(start + slides[index].seconds) + "  |  " + spoken(slides[index].seconds);
  }
  const chapterSeconds = name => slides.filter(item => item.chapter === name).reduce((sum, item) => sum + item.seconds, 0);

  function el(tag, className, value) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (value) item.textContent = value;
    return item;
  }

  function message(text) {
    window.clearTimeout(noticeTimer);
    notice.textContent = text;
    notice.hidden = false;
    noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 4200);
  }

  /* ---------- Video, 3D models and comparisons ---------- */

  function playVideo(video) {
    return video.play().catch(error => {
      if (error.name !== "AbortError") message("This video couldn’t play. Try opening the deck in Chrome or Edge.");
    });
  }

  // Every video starts by itself, with the sound off. Narrated films keep
  // their controls, so the presenter can still unmute one by hand.
  function autoplay(frame) {
    const video = frame.querySelector("video");
    if (!video || frame.dataset.userPaused) return;
    video.play().catch(() => { /* The poster stays up; clicking still plays. */ });
  }

  function toggleVideo(frame) {
    const video = frame.querySelector("video");
    if (!video) return;
    if (video.paused) {
      delete frame.dataset.userPaused;
      playVideo(video);
    } else {
      frame.dataset.userPaused = "true";
      video.pause();
    }
  }

  function videoFrame(spec) {
    const demo = spec.demo;
    const ambient = Boolean(demo.muted);
    const frame = el("div", "media-frame " + (ambient ? "ambient" : "narrated") + (spec.fit === "contain" ? " contain" : ""));
    frame.dataset.state = "paused";
    const video = el("video");
    video.poster = spec.src;
    video.playsInline = true;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = ambient;
    video.controls = !ambient;
    video.preload = "auto";
    if (demo.rate) video.defaultPlaybackRate = demo.rate;
    video.src = demo.src;
    video.setAttribute("aria-label", demo.label);
    if (demo.captions) {
      const track = el("track");
      track.kind = "captions";
      track.src = demo.captions;
      track.srclang = "en";
      track.label = "English";
      video.append(track);
    }
    video.addEventListener("play", () => {
      frame.dataset.state = "playing";
      if (!ambient) {
        activeDemo = video;
        slide.querySelectorAll("video").forEach(other => {
          if (other !== video) other.pause();
        });
      }
    });
    video.addEventListener("pause", () => { frame.dataset.state = "paused"; });
    video.addEventListener("timeupdate", () => {
      if (video.duration) frame.style.setProperty("--played", String(video.currentTime / video.duration));
    });
    frame.append(video);

    if (ambient) {
      const badge = el("span", "live-badge");
      badge.append(el("i"), demo.badge || "Clip");
      badge.setAttribute("aria-hidden", "true");
      const toggle = el("button", "ambient-toggle");
      toggle.type = "button";
      toggle.setAttribute("aria-label", "Play or pause " + demo.label);
      toggle.append(el("span", "ambient-icon"));
      toggle.addEventListener("click", () => toggleVideo(frame));
      frame.append(badge, toggle, el("span", "video-progress"));
    }
    return frame;
  }

  function modelFrame(spec) {
    const frame = el("div", "model-frame");
    const poster = el("img", "model-poster");
    if (spec.src) poster.src = spec.src;
    else poster.hidden = true;
    poster.alt = "";
    const canvasHost = el("div", "model-canvas");
    canvasHost.setAttribute("role", "img");
    canvasHost.setAttribute("aria-label", spec.alt);
    const hint = el("span", "live-badge model-hint");
    hint.setAttribute("aria-hidden", "true");
    hint.append(el("i"), "Drag to rotate");
    frame.append(poster, canvasHost, hint);
    import("./model-viewer.js")
      .then(viewer => viewer.mountModel(canvasHost, {
        ...spec.model,
        autoRotate: !reducedMotion.matches,
        onReady: () => { frame.dataset.ready = "true"; }
      }))
      .catch(() => { frame.dataset.failed = "true"; });
    return frame;
  }

  function compareFrame(spec) {
    const [left, right] = spec.compare;
    const frame = el("div", "compare-frame");
    frame.style.setProperty("--split", "50%");
    frame.setAttribute("role", "img");
    frame.setAttribute("aria-label", spec.alt);
    const base = el("img");
    base.src = right.src;
    base.alt = "";
    const top = el("img", "compare-top");
    top.src = left.src;
    top.alt = "";
    const hint = el("span", "live-badge compare-hint");
    hint.setAttribute("aria-hidden", "true");
    hint.append(el("i"), "Drag to compare");
    frame.append(base, top, el("span", "compare-handle"), el("span", "compare-tag left", left.label), el("span", "compare-tag right", right.label), hint);
    const follow = event => {
      const box = frame.getBoundingClientRect();
      frame.style.setProperty("--split", Math.max(0, Math.min(100, (event.clientX - box.left) / box.width * 100)) + "%");
    };
    frame.addEventListener("pointerdown", event => {
      frame.dataset.touched = "true";
      frame.setPointerCapture(event.pointerId);
      follow(event);
    });
    frame.addEventListener("pointermove", event => {
      if (event.pointerType === "mouse" || frame.hasPointerCapture(event.pointerId)) {
        frame.dataset.touched = "true";
        follow(event);
      }
    });
    return frame;
  }

  // A one-off sweep shows the audience that the divider moves.
  function sweep(frame) {
    if (frame.dataset.touched || reducedMotion.matches) return;
    let start;
    const step = now => {
      if (!frame.isConnected || frame.dataset.touched) return;
      start ??= now + 700;
      const t = Math.min(1, Math.max(0, (now - start) / 2800));
      frame.style.setProperty("--split", (50 + Math.sin(t * Math.PI * 2) * 32) + "%");
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function galleryFrame(spec) {
    const frame = el("div", "gallery-frame");
    frame.setAttribute("role", "group");
    frame.setAttribute("aria-label", spec.alt);
    const dots = el("div", "gallery-dots");
    const slides = spec.gallery.map((item, index) => {
      const shot = el("div", "gallery-shot" + (index ? "" : " is-active"));
      const image = el("img");
      image.src = item.src;
      image.alt = item.alt || item.label;
      image.decoding = "async";
      shot.append(image, el("span", "gallery-label", item.label));
      frame.append(shot);
      const dot = el("button", index ? "" : "is-active");
      dot.type = "button";
      dot.setAttribute("aria-label", "Show " + item.label);
      dot.addEventListener("click", () => { show(index); restart(); });
      dots.append(dot);
      return { shot, dot };
    });
    frame.append(dots);
    let currentShot = 0;
    let timer;
    function show(index) {
      slides[currentShot].shot.classList.remove("is-active");
      slides[currentShot].dot.classList.remove("is-active");
      currentShot = index;
      slides[currentShot].shot.classList.add("is-active");
      slides[currentShot].dot.classList.add("is-active");
    }
    function restart() {
      clearInterval(timer);
      if (reducedMotion.matches) return;
      timer = setInterval(() => {
        if (!frame.isConnected) { clearInterval(timer); return; }
        show((currentShot + 1) % slides.length);
      }, 3800);
    }
    restart();
    return frame;
  }

  function figure(spec, extraClass = "") {
    const block = el("figure", extraClass);
    if (spec.gallery) {
      block.append(galleryFrame(spec));
    } else if (spec.model) {
      block.append(modelFrame(spec));
    } else if (spec.compare) {
      block.append(compareFrame(spec));
    } else if (spec.demo) {
      block.append(videoFrame(spec));
    } else {
      const image = el("img");
      image.src = spec.src;
      image.alt = spec.alt;
      image.decoding = "async";
      const frame = el("div", "visual-frame" + (spec.fit === "contain" ? " contain" : ""));
      frame.append(image);
      block.append(frame);
    }
    if (spec.caption) block.append(el("figcaption", "", spec.caption));
    return block;
  }

  /* ---------- Building blocks ---------- */

  function details(rows) {
    const group = el("div", "details");
    for (const [head, copy] of rows) {
      const detail = el("section", "detail");
      detail.append(el("h2", "", head), el("p", "", copy));
      group.append(detail);
    }
    return group;
  }

  function titleBlock(data, includeLead = false) {
    const block = el("header", "title-block");
    block.append(el("p", "eyebrow", data.section), el("h1", "", data.title));
    if (includeLead && data.lead) block.append(el("p", "lead", data.lead));
    return block;
  }

  function counter(className, text) {
    const value = el("p", className, text);
    if (/\d/u.test(text)) value.dataset.count = text;
    return value;
  }

  function metrics(rows, extraClass = "") {
    const numbers = el("div", "numbers count-" + rows.length + (extraClass ? " " + extraClass : ""));
    for (const [label, value, copy] of rows) {
      const metric = el("section", "metric");
      metric.append(el("h2", "", label), counter("value", value), el("p", "copy", copy));
      numbers.append(metric);
    }
    return numbers;
  }

  function flow(nodes) {
    const row = el("div", "flow");
    row.setAttribute("role", "list");
    nodes.forEach((node, index) => {
      const item = el("div", "flow-node" + (node.tone ? " tone-" + node.tone : ""));
      item.setAttribute("role", "listitem");
      item.style.setProperty("--i", String(index));
      item.append(el("span", "flow-index", String(index + 1).padStart(2, "0")), el("strong", "", node.label), el("span", "flow-detail", node.detail));
      row.append(item);
      if (index < nodes.length - 1) {
        const link = el("div", "flow-link");
        link.setAttribute("aria-hidden", "true");
        link.style.setProperty("--i", String(index));
        link.append(el("span", "flow-pulse"));
        row.append(link);
      }
    });
    return row;
  }

  function bars(rows) {
    const chart = el("div", "bars");
    const best = Math.max(...rows.map(row => row[2]));
    chart.append(el("p", "bars-axis", "Baskets made, 512 held-out shots"));
    rows.forEach(([label, detail, value], index) => {
      const row = el("div", "bar-row" + (value === best ? " best" : ""));
      row.style.setProperty("--v", String(value / 100));
      row.style.setProperty("--i", String(index));
      const name = el("div", "bar-label");
      name.append(el("strong", "", label), el("span", "", detail));
      const track = el("div", "bar-track");
      track.append(el("span", "bar-fill"));
      row.append(name, track, counter("bar-value", value.toFixed(1) + "%"));
      chart.append(row);
    });
    return chart;
  }

  function cards(list) {
    const grid = el("div", "solution-cards");
    list.forEach((card, index) => {
      const item = el("section", "solution-card" + (index ? " dark" : ""));
      const top = el("div", "card-top");
      top.append(el("span", "card-tag", card.tag), el("span", "card-status", card.status));
      const items = el("ul");
      card.items.forEach(text => items.append(el("li", "", text)));
      item.append(top, el("h2", "", card.title), el("p", "card-audience", card.audience), items);
      grid.append(item);
    });
    return grid;
  }

  // Site photo beside its interactive 3D reconstruction, with the recorded
  // dimensions; arrows step through the surveyed stairwells.
  function reconstruction(data) {
    const panel = el("div", "recon");
    const bar = el("div", "recon-bar");
    const previousSite = el("button", "recon-step", "‹");
    const nextSite = el("button", "recon-step", "›");
    previousSite.type = nextSite.type = "button";
    previousSite.setAttribute("aria-label", "Previous stairwell");
    nextSite.setAttribute("aria-label", "Next stairwell");
    const label = el("p", "recon-label");
    bar.append(previousSite, label, nextSite);
    const compare = el("div", "recon-compare");
    const photoFigure = el("figure", "recon-photo");
    const photo = el("img");
    photo.decoding = "async";
    photoFigure.append(photo, el("figcaption", "", "Site photograph"));
    const modelFigure = el("figure", "recon-model");
    compare.append(photoFigure, modelFigure);
    const dims = el("dl", "recon-dims");
    panel.append(bar, compare, dims);
    let index = Math.max(0, data.sites.findIndex(site => site.id === data.start));

    function show(next) {
      index = (next + data.sites.length) % data.sites.length;
      const site = data.sites[index];
      label.replaceChildren(el("strong", "", site.name), el("span", "", (index + 1) + " / " + data.sites.length));
      photo.src = site.photo;
      photo.alt = site.name + ": site photograph of the stairwell";
      const model = modelFrame({ alt: "Interactive 3D reconstruction of " + site.name, model: { src: site.model, mirrorX: site.mirrorX, direction: [site.mirrorX ? 1.4 : -1.4, 0.8, -1.8] } });
      model.append(el("span", "recon-tag", "Reconstructed model"));
      modelFigure.replaceChildren(model, el("figcaption", "", "Drag to rotate"));
      dims.replaceChildren(...[
        ["Rail diameter", site.diameter + " mm"],
        ["Rail height", site.height + " cm"],
        ["Flight length", site.length + " cm"],
        ["Slope", site.slope + "°"]
      ].map(([name, value]) => {
        const row = el("div");
        row.append(el("dt", "", name), counter("", value));
        return row;
      }));
      if (panel.isConnected) dims.querySelectorAll("[data-count]").forEach(countUp);
    }
    previousSite.addEventListener("click", () => show(index - 1));
    nextSite.addEventListener("click", () => show(index + 1));
    show(index);
    return panel;
  }

  // The cover names the projects actually shown, in the chosen order.
  function coverLead(data) {
    if (!data.autoLead) return data.lead;
    const names = slides
      .filter(item => item.nav && !data.autoLead.exclude.includes(item.nav))
      .map((item, index) => index && data.autoLead.names?.[item.nav] ? data.autoLead.names[item.nav] : item.nav);
    if (!names.length) return data.lead;
    return names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  }

  function outlineRows(data) {
    return slides.filter(item => item.nav).map(item => [
      item.nav.toUpperCase(),
      minutes(chapterSeconds(item.nav)) + " min",
      data.outlineCopy?.[item.nav] || ""
    ]);
  }

  /* ---------- Slides ---------- */

  function renderSlide(data) {
    slide.className = "slide slide-" + data.type;
    slide.dataset.slideId = data.id || "";
    slide.setAttribute("aria-label", data.title);
    if (data.type === "stairio-intro") {
      heroPlayback = stairio.renderIntro(data, slide, message);
      return;
    }
    if (data.type === "stairio-scene") {
      sceneFrame = stairio.renderScene(slide);
      return;
    }
    if (data.type === "cover" || data.type === "chapter") {
      const cover = data.type === "cover";
      const layout = el("div", cover ? "cover-layout" : "chapter-layout");
      const text = el("div", "chapter-text");
      text.append(el("p", "eyebrow", data.section), el("h1", "", data.title), el("p", "lead", coverLead(data)));
      if (data.sub) text.append(el("p", "affiliation", data.sub));
      const art = cover ? el("div", "cover-images") : figure(data.images[0], "kb");
      if (cover) art.append(...data.images.map(image => figure(image, "kb")));
      if (!cover && data.part) {
        const numeral = el("span", "chapter-numeral", String(data.part).padStart(2, "0"));
        numeral.setAttribute("aria-hidden", "true");
        layout.append(numeral);
      }
      layout.append(text, art);
      slide.append(layout);
      return;
    }

    const withLead = !["split", "bars", "reconstruction"].includes(data.type);
    slide.append(titleBlock(data, withLead));
    if (data.type === "split" || data.type === "bars") {
      const layout = el("div", "split");
      const text = el("div");
      if (data.lead) text.append(el("p", "lead", data.lead));
      text.append(data.type === "bars" ? bars(data.bars) : data.numbers ? metrics(data.numbers, "stacked split-metrics") : details(data.rows));
      layout.append(text, figure(data.images[0]));
      slide.append(layout);
    } else if (data.type === "columns") {
      const portrait = data.images.some(image => image.orientation === "portrait");
      const columns = el("div", "columns" + (data.rows.length === 3 ? " three" : "") + (portrait ? " has-portrait" : ""));
      data.rows.forEach(([head, copy], index) => {
        const panel = el("section", "panel" + (data.images[index].orientation === "portrait" ? " portrait" : ""));
        panel.append(figure(data.images[index]), el("h2", "", head), el("p", "copy", copy));
        columns.append(panel);
      });
      slide.append(columns);
    } else if (data.type === "numbers") {
      if (data.outline) {
        const total = slides.reduce((sum, item) => sum + item.seconds, 0);
        const opening = slides.filter(item => !item.chapter).reduce((sum, item) => sum + item.seconds, 0);
        slide.querySelector(".eyebrow").textContent = minutes(total) + "-MINUTE PRESENTATION";
        slide.append(metrics(outlineRows(data), "outline"));
        slide.append(el("p", "slide-note", minutes(opening) + " minutes for the opening and technical background. Role discussion follows the presentation."));
        return;
      }
      slide.append(metrics(data.numbers));
    } else if (data.type === "flow") {
      slide.append(flow(data.nodes));
      const single = data.images?.length === 1;
      const extra = el("div", "flow-extra" + (data.images ? " with-images" : "") + (single ? " single" : ""));
      (data.images || []).forEach(image => extra.append(figure(image)));
      if (data.numbers) extra.append(metrics(data.numbers, data.images && !single ? "stacked" : ""));
      slide.append(extra);
    } else if (data.type === "reconstruction") {
      const layout = el("div", "split recon-layout");
      const text = el("div");
      if (data.lead) text.append(el("p", "lead", data.lead));
      text.append(details(data.rows));
      layout.append(text, reconstruction(data));
      slide.append(layout);
    } else if (data.type === "cards") {
      slide.append(cards(data.cards));
    } else {
      slide.append(details(data.rows));
    }
    if (data.sub) slide.append(el("p", "slide-note", data.sub));
  }

  // Elements that rise in one after another when a slide arrives.
  const revealSelector = [
    ".eyebrow", "h1", ".lead", ".affiliation", ".detail", "figure", ".panel", ".metric",
    ".flow-node", ".bar-row", ".bars-axis", ".solution-card", ".slide-note", ".recon"
  ].join(",");

  function stagger(article) {
    if (article.classList.contains("slide-stairio-intro") || article.classList.contains("slide-stairio-scene")) return;
    const parts = [...article.querySelectorAll(revealSelector)];
    parts.filter(part => !parts.some(other => other !== part && other.contains(part)))
      .forEach((part, index) => {
        part.classList.add("rv");
        part.style.setProperty("--rv", String(Math.min(index, 12)));
      });
  }

  function countUp(node) {
    const final = node.dataset.count;
    const match = /^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/su.exec(final);
    if (!match || reducedMotion.matches) return;
    const target = Number(match[2].replace(/,/gu, ""));
    const decimals = (match[2].split(".")[1] || "").length;
    const grouped = match[2].includes(",");
    const format = value => match[1] + value.toLocaleString("en-US", {
      minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouped
    }) + match[3];
    const delay = 260 + (Number(node.closest(".rv")?.style.getPropertyValue("--rv")) || 0) * 55;
    const length = 1200;
    let start;
    node.textContent = format(0);
    const step = time => {
      if (!node.isConnected) return;
      start ??= time + delay;
      const t = Math.min(1, Math.max(0, (time - start) / length));
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = t >= 1 ? final : format(target * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function activate(article) {
    if (article !== slide) return;
    article.classList.add("is-live");
    article.querySelectorAll("[data-count]").forEach(countUp);
    if (reducedMotion.matches || document.hidden) return;
    article.querySelectorAll(".media-frame").forEach(autoplay);
    article.querySelectorAll(".compare-frame").forEach(sweep);
    if (heroPlayback && !heroPlayback.started()) heroPlayback.play();
  }

  function preloadAfter(index) {
    const upcoming = slides[index + 1];
    (upcoming?.images || []).forEach(image => { new Image().src = image.src; });
  }

  /* ---------- Transitions ---------- */

  function settle(article, focus) {
    stage.querySelectorAll(".slide").forEach(other => { if (other !== article) other.remove(); });
    if (!article.isConnected) stage.append(article);
    if (focus) article.focus({ preventScroll: true });
  }

  function enter(article) {
    article.classList.add("is-entering");
    activate(article);
  }

  function retire(article) {
    article.querySelectorAll("video").forEach(video => video.pause());
    article.classList.add("is-leaving");
    article.removeAttribute("id");
    article.setAttribute("aria-hidden", "true");
    article.inert = true;
  }

  function wipeLabel(data) {
    const start = slides.find(item => item.nav && item.nav === data.chapter);
    if (!start) return ["Introduction", "Jack Zhao"];
    const [part] = start.section.split("/");
    return [part.trim(), start.nav];
  }

  async function swap(leaving, entering, kind, direction, data, focus) {
    const token = ++transitionToken;
    wipe.getAnimations().forEach(animation => animation.cancel());
    wipeCopy.getAnimations().forEach(animation => animation.cancel());
    wipe.hidden = true;
    entering.id = "slide";
    entering.style.setProperty("--dir", String(direction));
    retire(leaving);

    if (kind === "instant" || transitioning) {
      transitioning = false;
      settle(entering, focus);
      enter(entering);
      return;
    }

    transitioning = true;
    if (kind === "push") {
      stage.append(entering);
      if (focus) entering.focus({ preventScroll: true });
      entering.style.setProperty("--rv-base", "170ms");
      entering.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, delay: 170, easing: "ease-out", fill: "backwards" });
      enter(entering);
      try {
        await leaving.animate(
          [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translate3d(${-direction * 3}%, 0, 0) scale(.98)` }],
          { duration: 240, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" }
        ).finished;
      } catch { /* Cancelled by a newer change. */ }
      if (token !== transitionToken) return;
      leaving.remove();
      transitioning = false;
      return;
    }

    // Chapter wipe: a panel sweeps across, names the new part, then reveals it.
    const [part, title] = wipeLabel(data);
    wipePart.textContent = part;
    wipeTitle.textContent = title;
    wipe.hidden = false;
    const hiddenEdge = direction > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
    const exitEdge = direction > 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
    const ease = "cubic-bezier(.76,0,.24,1)";
    wipeCopy.animate(
      [{ opacity: 0, transform: `translate3d(${direction * 40}px, 0, 0)` }, { opacity: 1, transform: "none" }],
      { duration: 460, delay: 220, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" }
    );
    try {
      await wipe.animate([{ clipPath: hiddenEdge }, { clipPath: "inset(0 0 0 0)" }], { duration: 520, easing: ease, fill: "forwards" }).finished;
      if (token !== transitionToken) return;
      settle(entering, focus);
      entering.style.setProperty("--rv-base", "320ms");
      await new Promise(resolve => setTimeout(resolve, 300));
      if (token !== transitionToken) return;
      enter(entering);
      wipeCopy.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-in", fill: "forwards" });
      await wipe.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: exitEdge }], { duration: 640, easing: ease, fill: "forwards" }).finished;
    } catch { /* Cancelled by a newer change. */ }
    if (token !== transitionToken) return;
    wipe.hidden = true;
    transitioning = false;
  }

  /* ---------- Engineering drawer ---------- */

  const techData = window.presentationTech || {};
  const tech = document.querySelector("#tech");
  const techTab = document.querySelector("#tech-tab");
  const techPanel = document.querySelector("#tech-panel");
  const chapterTech = {
    "Vandi": ["vandi"],
    "Stairio": ["stairio", "stairio-simulator"],
    "Robot basketball": ["basketball"],
    "Stairio HR": ["stairio-hr"]
  };
  let techPinned = false;

  // Which projects a slide draws on: set per slide, otherwise by chapter.
  // Stairio slides about Isaac Sim or Unreal lead with the simulator.
  function techFor(data) {
    if (data.tech) return data.tech;
    const keys = chapterTech[data.chapter] || [];
    if (data.chapter === "Stairio" && /ISAAC|UNREAL|HARDWARE ITERATION|RECONSTRUCTION|ANSYS/u.test(data.section || "")) return ["stairio-simulator", "stairio"];
    return keys;
  }

  function setTechOpen(open) {
    tech.dataset.open = String(open);
    techTab.setAttribute("aria-expanded", String(open));
  }

  function renderTech(data) {
    const keys = techFor(data).filter(key => techData[key]);
    tech.hidden = !keys.length || presenterActive();
    if (tech.hidden) {
      techPinned = false;
      setTechOpen(false);
      return;
    }
    const body = window.techDetail.build(keys);
    techPanel.replaceChildren(...body);
    techPanel.scrollTop = 0;
    setTechOpen(techPinned);
  }

  function toggleTech() {
    if (tech.hidden) return;
    techPinned = tech.dataset.open !== "true";
    setTechOpen(techPinned);
    if (techPinned) techPanel.focus({ preventScroll: true });
  }

  tech.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") setTechOpen(true); });
  tech.addEventListener("pointerleave", event => { if (event.pointerType === "mouse" && !techPinned) setTechOpen(false); });
  techTab.addEventListener("click", toggleTech);
  tech.addEventListener("focusout", event => {
    if (!techPinned && !tech.contains(event.relatedTarget) && !tech.matches(":hover")) setTechOpen(false);
  });

  /* ---------- Presenter window ---------- */

  // A second window for the presenter: notes, timing and engineering detail.
  // Share only the deck's tab or window; while the presenter window is open
  // the in-deck Engineering drawer hides so nothing private reaches the share.
  const channel = "BroadcastChannel" in window ? new BroadcastChannel("jack-presentation") : null;
  let presenterSeen = 0;

  function presenterActive() {
    return Date.now() - presenterSeen < 6000;
  }

  function presenterState() {
    const data = slides[current];
    const [main, sources] = (data.notes || "").split("\n\nSource material\n");
    const start = slides.slice(0, current).reduce((sum, item) => sum + item.seconds, 0);
    const upcoming = slides[current + 1];
    return {
      type: "state",
      index: current,
      total: slides.length,
      title: data.title,
      section: data.section || "",
      chapter: data.chapter || "Introduction",
      timing: timing(current),
      start,
      end: start + data.seconds,
      totalSeconds: slides.reduce((sum, item) => sum + item.seconds, 0),
      notes: main.split(/\n\n+/u),
      sources: sources || "",
      tech: techFor(data),
      next: upcoming ? { title: upcoming.title, section: upcoming.section || "" } : null
    };
  }

  function publish() {
    if (channel && current >= 0) channel.postMessage(presenterState());
  }

  function publishProjects() {
    channel?.postMessage({ type: "projects", ...projectSummary() });
  }

  function setPresenter(seen) {
    const was = presenterActive();
    presenterSeen = seen;
    if (was !== presenterActive() && current >= 0) {
      if (presenterActive()) {
        techPinned = false;
        setTechOpen(false);
      }
      renderTech(slides[current]);
    }
  }

  channel?.addEventListener("message", ({ data }) => {
    if (data?.type === "hello" || data?.type === "ping") {
      const wasConnected = presenterActive();
      setPresenter(Date.now());
      if (data.type === "hello" || !wasConnected) {
        publish();
        publishProjects();
      }
    } else if (data?.type === "order" && Array.isArray(data.order)) {
      applyProjectOrder(data.order);
    } else if (data?.type === "bye") {
      setPresenter(0);
    } else if (data?.type === "go") {
      if (data.to === "next") advance();
      else if (data.to === "previous") changeSlide(current - 1);
      else if (Number.isInteger(data.to)) changeSlide(data.to);
    }
  });
  setInterval(() => { if (presenterSeen && !presenterActive()) setPresenter(0); }, 2000);

  function openPresenter() {
    const popup = window.open(new URL("presenter.html", location.href).href, "jack-presenter", "popup,width=1180,height=780");
    if (!popup) message("Allow pop-ups for this site to open the presenter view.");
    else if (!channel) message("This browser can’t link the presenter view to the deck.");
  }
  document.querySelector("#presenter-button").addEventListener("click", openPresenter);

  /* ---------- Navigation ---------- */

  function playCurrentDemo() {
    if (heroPlayback) {
      heroPlayback.play();
      return;
    }
    const focused = document.activeElement?.closest(".media-frame");
    const frame = focused || activeDemo?.closest(".media-frame") || slide.querySelector(".media-frame.narrated") || slide.querySelector(".media-frame");
    if (frame) toggleVideo(frame);
  }

  function fromHash() {
    const match = /^#slide-(\d+)$/u.exec(window.location.hash);
    return match ? Number(match[1]) - 1 : 0;
  }

  function buildChapters() {
    chapterNav.replaceChildren(...slides.filter(item => item.nav).map(item => {
      const button = el("button", "", item.nav);
      button.type = "button";
      button.dataset.chapter = item.nav;
      button.addEventListener("click", () => changeSlide(slides.findIndex(other => other.nav === item.nav)));
      return button;
    }));
    progressBar.querySelectorAll(".tick").forEach(tick => tick.remove());
    slides.forEach((item, index) => {
      if (!item.nav) return;
      const tick = el("span", "tick");
      tick.style.left = (index / slides.length * 100) + "%";
      progressBar.append(tick);
    });
  }

  function changeSlide(index, { focus = true, updateHash = true } = {}) {
    const position = Math.max(0, Math.min(index, slides.length - 1));
    if (position === current) return;

    const from = current;
    const leaving = slide;
    activeDemo = undefined;
    heroPlayback = undefined;
    sceneFrame = undefined;
    current = position;
    presentation.dataset.touchMenu = "false";
    touchControls.setAttribute("aria-expanded", "false");
    const data = slides[current];
    slide = el("article", "slide");
    slide.tabIndex = -1;
    renderSlide(data);
    stagger(slide);

    const direction = from < 0 || position > from ? 1 : -1;
    let kind = "push";
    if (from < 0 || reducedMotion.matches) kind = "instant";
    else if (slides[from].chapter !== data.chapter) kind = "wipe";
    void swap(leaving, slide, kind, direction, data, focus);

    notes.close();
    keys.close();
    rank.dialog.close();
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    count.textContent = (current + 1) + " / " + slides.length;
    progress.style.width = ((current + 1) / slides.length * 100) + "%";
    chapterNav.querySelectorAll("button").forEach(button => {
      if (button.dataset.chapter === data.chapter) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    renderTech(data);
    publish();
    announcement.textContent = "Slide " + (current + 1) + " of " + slides.length + ". " + data.title;
    document.title = data.title + " | Jack Zhao";
    if (updateHash) {
      const hash = "#slide-" + String(current + 1).padStart(2, "0");
      window.history.replaceState(null, "", hash);
    }
    window.scrollTo(0, 0);
    preloadAfter(current);
  }

  function toggleDialog(dialog) {
    if (dialog.open) {
      dialog.close();
      return;
    }
    if (notes.open) notes.close();
    if (keys.open) keys.close();
    if (dialog === notes) {
      const data = slides[current];
      const [main, sources] = data.notes.split("\n\nSource material\n");
      const paragraphs = main.split(/\n\n+/u);
      notesContent.replaceChildren(el("h3", "", data.title), el("p", "timing", timing(current)));
      notesContent.append(...paragraphs.map(p => el("p", "", p)));
      if (sources) {
        const sourceDetails = el("details");
        sourceDetails.append(el("summary", "", "Source material"), el("p", "", sources));
        notesContent.append(sourceDetails);
      }
    }
    dialog.showModal();
  }

  async function toggleFullscreen(enterOnly = false) {
    try {
      if (document.fullscreenElement) {
        if (!enterOnly) await document.exitFullscreen();
      } else if (presentation.requestFullscreen) {
        await presentation.requestFullscreen();
      } else {
        message("Use your browser’s fullscreen control.");
      }
    } catch {
      message("Use your browser’s fullscreen control.");
    }
  }

  previous.addEventListener("click", () => changeSlide(current - 1));
  function advance() {
    if (heroPlayback && !heroPlayback.started()) {
      heroPlayback.play();
      return;
    }
    changeSlide(current + 1);
  }
  next.addEventListener("click", advance);
  document.querySelectorAll("[data-jump]").forEach(button => {
    button.addEventListener("click", () => changeSlide(Number(button.dataset.jump) - 1));
  });
  document.querySelector("#notes-button").addEventListener("click", () => toggleDialog(notes));
  document.querySelector("#keys-button").addEventListener("click", () => toggleDialog(keys));
  fullscreen.addEventListener("click", () => void toggleFullscreen());
  document.addEventListener("fullscreenchange", () => {
    fullscreen.textContent = document.fullscreenElement ? "Exit fullscreen" : "Fullscreen";
  });
  window.addEventListener("hashchange", () => changeSlide(fromHash(), { updateHash: false }));

  const exitButton = document.querySelector("#exit");
  exitButton.hidden = !embedded;
  function exitDeck() {
    if (embedded) parent.postMessage({type:"portfolio:presentation-exit"}, location.origin);
  }
  exitButton.addEventListener("click", exitDeck);
  // The name in the top bar always leads back to the website: it closes the
  // deck when it is open over the site, or opens the site's home page otherwise.
  document.querySelector("#wordmark").addEventListener("click", () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    if (embedded) exitDeck();
    else location.href = new URL("../", location.href).href;
  });

  function updateEdges(y) {
    presentation.dataset.topEdge = String(y >= 0 && y < 76);
    presentation.dataset.bottomEdge = String(window.innerHeight - y < 82 && y <= window.innerHeight);
  }
  window.addEventListener("pointermove", event => updateEdges(event.clientY), { passive:true });
  window.addEventListener("pointerdown", event => {
    if (event.pointerType === "touch") updateEdges(event.clientY);
  }, { passive:true });
  document.addEventListener("pointerout", event => {
    if (event.pointerType === "mouse" && event.relatedTarget === null) updateEdges(-1);
  });
  touchControls.addEventListener("click", () => {
    const reveal = presentation.dataset.touchMenu !== "true";
    presentation.dataset.touchMenu = String(reveal);
    touchControls.setAttribute("aria-expanded", String(reveal));
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      slide.querySelectorAll("video").forEach(video => video.pause());
      return;
    }
    if (reducedMotion.matches) return;
    slide.querySelectorAll(".media-frame.ambient").forEach(autoplay);
  });
  document.querySelector("#rank-button").addEventListener("click", toggleRanking);

  function toggleRanking() {
    if (rank.dialog.open) {
      rank.dialog.close();
    } else {
      notes.close();
      keys.close();
      rank.open();
    }
  }

  function handleKey(key) {
    const character = key.toLowerCase();
    if (character === "r") {
      toggleRanking();
      return true;
    }
    if (character === "n" || key === "?") {
      rank.dialog.close();
      toggleDialog(character === "n" ? notes : keys);
      return true;
    }
    if (notes.open || keys.open || rank.dialog.open) return false;
    if (character === "e") {
      toggleTech();
      return true;
    }
    if (character === "v") {
      openPresenter();
      return true;
    }
    if (key === "Escape" && tech.dataset.open === "true") {
      techPinned = false;
      setTechOpen(false);
      return true;
    }
    if (key === "Escape" && embedded && !document.fullscreenElement) {
      exitDeck();
      return true;
    }
    if (key === "F5" || character === "f" || character === "p") {
      if (character === "p") playCurrentDemo();
      else void toggleFullscreen(key === "F5");
      return true;
    }
    if (nextKeys.has(key)) advance();
    else if (prevKeys.has(key)) changeSlide(current - 1);
    else if (key === "Home") changeSlide(0);
    else if (key === "End") changeSlide(slides.length - 1);
    else return false;
    return true;
  }

  window.addEventListener("keydown", event => {
    if (event.defaultPrevented || event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    const key = event.key;
    if (event.shiftKey && key !== "?") return;
    if (target.closest?.("input, select, textarea, [contenteditable]:not([contenteditable=false])")) return;
    if (target.closest?.("video, audio") && ["ArrowLeft","ArrowUp","ArrowRight","ArrowDown"," ","Enter","Home","End"].includes(key)) return;
    if ((key === " " || key === "Enter") && target.closest?.("a[href], button, summary, [role=button]")) return;
    if (handleKey(key)) event.preventDefault();
  });

  window.addEventListener("message", event => {
    if (event.origin !== location.origin || event.source !== sceneFrame?.contentWindow || event.data?.type !== "stairio:presentation") return;
    if (typeof event.data.pointerY === "number" && Number.isFinite(event.data.pointerY)) {
      updateEdges(sceneFrame.getBoundingClientRect().top + event.data.pointerY);
    }
    if (typeof event.data.key === "string") handleKey(event.data.key);
  });

  buildChapters();
  changeSlide(fromHash(), { focus: false, updateHash: false });
  publishProjects();
})();
