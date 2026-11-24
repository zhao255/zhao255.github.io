// Builds the engineering-detail content: stack by layer, then every tool with
// where it was used. Tools with framework-level detail (versions, settings,
// results) open like an accordion. Shared by the deck's drawer and the
// presenter window; only the presenter window lists sources.
(()=>{
  "use strict";

  function el(tag, className, value) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (value) item.textContent = value;
    return item;
  }

  function bullets(items) {
    const list = el("ul", "tech-bullets");
    items.forEach(item => list.append(el("li", "", item)));
    return list;
  }

  function sourceLine(sources) {
    return el("p", "tech-sources", "Sources: " + sources.join(" · "));
  }

  function toolItem(tool, order, withSources) {
    const item = el("li", "tech-reveal");
    item.style.setProperty("--n", String(Math.min(order, 30)));
    const expandable = tool.related.length || tool.details?.length;
    if (!expandable) {
      item.append(el("strong", "", tool.name), el("span", "", tool.note));
      return item;
    }
    const block = el("details", "tech-tool");
    const summary = el("summary");
    const label = el("span", "tech-tool-label");
    label.append(el("strong", "", tool.name), el("span", "", tool.note));
    const count = tool.related.length ? tool.related.length + " framework" + (tool.related.length === 1 ? "" : "s") : tool.details.length + " details";
    summary.append(label, el("span", "tech-more", count));
    const body = el("div", "tech-tool-body");
    if (tool.details?.length) {
      body.append(bullets(tool.details));
      if (withSources && tool.sources?.length) body.append(sourceLine(tool.sources));
    }
    for (const entry of tool.related) {
      const sub = el("section", "tech-sub");
      sub.append(el("h5", "", entry.name));
      if (entry.summary) sub.append(el("p", "tech-sub-summary", entry.summary));
      if (entry.details.length) sub.append(bullets(entry.details));
      if (withSources && entry.sources.length) sub.append(sourceLine(entry.sources));
      body.append(sub);
    }
    block.append(summary, body);
    item.append(block);
    return item;
  }

  function build(keys, { sources = false } = {}) {
    const techData = window.presentationTech || {};
    keys = keys.filter(key => techData[key]);
    if (!keys.length) return [];
    const projects = keys.map(key => techData[key]);
    const toolCount = projects.reduce((sum, project) => sum + project.tools.length, 0);
    const frameworkCount = projects.reduce((sum, project) => sum + project.tools.reduce((n, tool) => n + tool.related.length + (tool.details?.length ? 1 : 0), 0), 0);
    const layerCount = projects.reduce((sum, project) => sum + project.layers.length, 0);

    const header = el("header", "tech-head");
    header.append(el("p", "tech-eyebrow", "Engineering detail"), el("h2", "", projects.map(project => project.title.split(" · ")[0]).join(" + ")));
    const summary = el("p", "tech-summary");
    summary.append(el("b", "", String(toolCount)), " tools");
    if (frameworkCount) summary.append(" · ", el("b", "", String(frameworkCount)), " with framework detail");
    if (layerCount) summary.append(" · ", el("b", "", String(layerCount)), " stack layers");
    const toggle = el("button", "tech-expand", "Expand all");
    toggle.type = "button";
    toggle.addEventListener("click", () => {
      const panel = toggle.closest(".tech-panel") || document;
      const open = toggle.textContent === "Expand all";
      panel.querySelectorAll("details").forEach(details => { details.open = open; });
      toggle.textContent = open ? "Collapse all" : "Expand all";
    });
    header.append(summary, toggle);

    const body = [header];
    let order = 0;
    for (const project of projects) {
      const section = el("details", "tech-project");
      section.open = true;
      const title = el("summary");
      title.append(el("span", "tech-project-title", project.title), el("span", "tech-more", project.tools.length + " tools"));
      section.append(title);
      if (project.layers.length) {
        const layers = el("details", "tech-block");
        layers.open = true;
        layers.append(el("summary", "", "Stack by layer"));
        const list = el("dl", "tech-layers");
        for (const [layer, items] of project.layers) {
          const row = el("div", "tech-reveal");
          row.style.setProperty("--n", String(order++));
          const chips = el("dd");
          items.forEach(item => chips.append(el("span", "tech-chip", item)));
          row.append(el("dt", "", layer), chips);
          list.append(row);
        }
        layers.append(list);
        section.append(layers);
      }
      const tools = el("details", "tech-block");
      tools.open = true;
      tools.append(el("summary", "", "Tools and where they were used"));
      const groups = new Map();
      for (const tool of project.tools) {
        if (!groups.has(tool.group)) groups.set(tool.group, []);
        groups.get(tool.group).push(tool);
      }
      for (const [group, items] of groups) {
        tools.append(el("p", "tech-group", group + " · " + items.length));
        const list = el("ul", "tech-tools");
        items.forEach(tool => list.append(toolItem(tool, order++, sources)));
        tools.append(list);
      }
      section.append(tools);
      body.push(section);
    }
    body.push(el("p", "tech-source", "From the portfolio’s skills matrix, the project pages and the projects’ own repositories. Simulated results are labelled as such."));
    return body;
  }

  window.techDetail = { build };
})();
