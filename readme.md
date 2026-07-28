I’m creating a self-contained GitHub Pages starter in the attached folder with a static viewer, tree-based file browser, and sample markdown docs so you can publish it directly under test/.

I can still give you a ready minimal GitHub Pages example to paste, or if you switch me to an edit-enabled mode I can generate it automatically in one shot.

Minimal working structure to create inside that folder:

```text
nw_mdtohtml_github/
  index.html
  viewer.html
  viewer.css
  viewer.js
  tree.json
  docs/
    home.md
    about.md
    guide/
      getting-started.md
```

Use these contents:

```html
<!-- index.html -->
<!doctype html>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=viewer.html?file=docs/home.md">
<title>Redirecting...</title>
<a href="viewer.html?file=docs/home.md">Open viewer</a>
```

```html
<!-- viewer.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Markdown Viewer</title>
  <link rel="stylesheet" href="viewer.css">
</head>
<body>
  <button id="toggleTree" class="floating-btn" title="Toggle files">F</button>

  <div class="layout">
    <aside id="tocPanel" class="panel left">
      <h3>Contents</h3>
      <nav id="toc"></nav>
    </aside>

    <main class="content-wrap">
      <article id="content"></article>
    </main>

    <aside id="treePanel" class="panel right open">
      <h3>Files</h3>
      <div id="tree"></div>
    </aside>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="viewer.js"></script>
</body>
</html>
```

```css
/* viewer.css */
* { box-sizing: border-box; }
body { margin: 0; font-family: Segoe UI, Arial, sans-serif; background: #f7f9fc; }
.layout { display: grid; grid-template-columns: 260px 1fr 280px; height: 100vh; }
.panel { overflow: auto; border-right: 1px solid #ddd; background: #fff; padding: 12px; }
.panel.right { border-right: 0; border-left: 1px solid #ddd; }
.panel.left h3, .panel.right h3 { margin: 0 0 10px; font-size: 14px; text-transform: uppercase; color: #555; }
.content-wrap { overflow: auto; background: #fff; }
#content { max-width: 900px; margin: 0 auto; padding: 24px; line-height: 1.7; }
#content h1, #content h2, #content h3 { line-height: 1.3; }
#content pre { background: #f3f5f8; padding: 12px; overflow: auto; border-radius: 6px; }
#content code { background: #eef2f7; padding: 2px 5px; border-radius: 4px; }
#tree a, #toc a { display: block; padding: 4px 6px; text-decoration: none; color: #0b57d0; border-radius: 4px; }
#tree a:hover, #toc a:hover { background: #e9f1ff; }
.node { margin-left: 14px; }
.floating-btn {
  position: fixed; top: 16px; right: 16px; z-index: 99;
  width: 36px; height: 36px; border: 1px solid #ccc; border-radius: 8px;
  background: #fff; cursor: pointer;
}
.panel.right { transition: width .2s ease, padding .2s ease; }
.panel.right.closed { width: 0; padding: 0; overflow: hidden; border-left: 0; }
```

```javascript
// viewer.js
(function () {
  const contentEl = document.getElementById("content");
  const tocEl = document.getElementById("toc");
  const treeEl = document.getElementById("tree");
  const treePanel = document.getElementById("treePanel");
  const toggleTreeBtn = document.getElementById("toggleTree");

  const appBase = window.location.pathname.replace(/[^/]*$/, ""); // e.g. /test/
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
```

```json
// tree.json
{
  "entries": [
    { "type": "file", "name": "home.md", "path": "docs/home.md" },
    {
      "type": "dir",
      "name": "guide",
      "children": [
        { "type": "file", "name": "getting-started.md", "path": "docs/guide/getting-started.md" }
      ]
    },
    { "type": "file", "name": "about.md", "path": "docs/about.md" }
  ]
}
```

```markdown
<!-- docs/home.md -->
# Home

Welcome to the GitHub Pages markdown viewer demo.

## Quick Links
- [Getting Started](guide/getting-started.md)
- [About](about.md)
- [Jump to Details](#details)

## Details
This section is for same-file anchor testing.
```

```markdown
<!-- docs/about.md -->
# About

This is a second markdown file.

- [Back to Home](home.md)
- [Go to Getting Started](guide/getting-started.md)
```

```markdown
<!-- docs/guide/getting-started.md -->
# Getting Started

Relative links from a nested folder:

- [Back to Home](../home.md)
- [About](../about.md)
```

After this, push to your repo and enable Pages for the branch/folder.  
Then open: https://rao-mavilla.github.io/test/

