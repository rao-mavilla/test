(function () {
  const contentEl = document.getElementById("content");
  const tocEl = document.getElementById("toc");
  const treeEl = document.getElementById("tree");
  const treePanel = document.getElementById("treePanel");
  const toggleTreeBtn = document.getElementById("toggleTree");

  const appBase = window.location.pathname.replace(/[^/]*$/, "");
  let currentFile = null;

  function isMarkdown(p) {
    return /\.(md|markdown|mdown|mkdn|mkd|mdwn|mdtxt|mdtext)$/i.test(p || "");
  }

  function toAppRelative(pathname) {
    if (pathname.startsWith(appBase)) return pathname.slice(appBase.length);
    return pathname.replace(/^\//, "");
  }

  function slugify(text) {
    return (text || "")
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function buildViewerUrl(file, hash) {
    const h = hash || "";
    return `viewer.html?file=${encodeURIComponent(file)}${h}`;
  }

  async function loadMarkdown(file, hashToScroll) {
    currentFile = file;
    const res = await fetch(file);
    if (!res.ok) throw new Error(`Failed to load ${file}`);
    const md = await res.text();
    renderMarkdown(md, file, hashToScroll || window.location.hash);
    history.replaceState({}, "", buildViewerUrl(file, hashToScroll));
  }

  function renderMarkdown(md, filePath, hashToScroll) {
    contentEl.innerHTML = marked.parse(md);

    const headings = contentEl.querySelectorAll("h1,h2,h3,h4,h5,h6");
    headings.forEach(h => {
      if (!h.id) h.id = slugify(h.textContent);
    });

    buildToc();
    rewriteLinks(filePath);

    if (hashToScroll) {
      const id = hashToScroll.replace(/^#/, "");
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }

  function rewriteLinks(filePath) {
    const base = new URL(filePath, window.location.href);
    contentEl.querySelectorAll("a[href]").forEach(a => {
      const href = (a.getAttribute("href") || "").trim();
      if (!href) return;

      if (href.startsWith("#")) {
        a.addEventListener("click", (e) => {
          e.preventDefault();
          const id = href.slice(1);
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return;
      }

      let resolved;
      try { resolved = new URL(href, base); } catch { return; }

      if (resolved.origin !== window.location.origin) return;

      const rel = toAppRelative(resolved.pathname) + resolved.search;
      if (isMarkdown(rel)) {
        a.href = buildViewerUrl(rel, resolved.hash);
        a.addEventListener("click", (e) => {
          e.preventDefault();
          loadMarkdown(rel, resolved.hash).catch(err => {
            contentEl.innerHTML = `<p style="color:red">${err.message}</p>`;
          });
        });
      } else {
        a.href = resolved.href;
      }
    });
  }

  function buildToc() {
    tocEl.innerHTML = "";
    contentEl.querySelectorAll("h2,h3").forEach(h => {
      const link = document.createElement("a");
      link.href = `#${h.id}`;
      link.textContent = h.textContent || h.id;
      link.style.paddingLeft = h.tagName === "H3" ? "18px" : "6px";
      link.addEventListener("click", (e) => {
        e.preventDefault();
        h.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      tocEl.appendChild(link);
    });
  }

  function renderTreeNode(node, container) {
    if (node.type === "dir") {
      const title = document.createElement("div");
      title.textContent = node.name + "/";
      title.style.fontWeight = "600";
      container.appendChild(title);

      const childWrap = document.createElement("div");
      childWrap.className = "node";
      container.appendChild(childWrap);

      (node.children || []).forEach(child => renderTreeNode(child, childWrap));
      return;
    }

    const link = document.createElement("a");
    link.href = buildViewerUrl(node.path, "");
    link.textContent = node.name;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      loadMarkdown(node.path, "").catch(err => {
        contentEl.innerHTML = `<p style="color:red">${err.message}</p>`;
      });
    });
    container.appendChild(link);
  }

  async function initTreeAndLoad() {
    const tree = await fetch("tree.json").then(r => r.json());
    treeEl.innerHTML = "";
    (tree.entries || []).forEach(node => renderTreeNode(node, treeEl));

    const params = new URLSearchParams(window.location.search);
    const file = params.get("file") || "docs/home.md";
    await loadMarkdown(file, window.location.hash);
  }

  toggleTreeBtn.addEventListener("click", () => {
    treePanel.classList.toggle("closed");
  });

  initTreeAndLoad().catch(err => {
    contentEl.innerHTML = `<p style="color:red">${err.message}</p>`;
  });
})();
