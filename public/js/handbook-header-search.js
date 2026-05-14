(function () {
  var MAX = 10;
  var rowsCache = null;
  var pop;
  var input;
  var wrap;

  function rowMatches(q, row) {
    var needle = q.trim().toLowerCase();
    if (!needle) return true;
    var hay = (
      row.title +
      " " +
      row.categoryLabel +
      " " +
      (row.subcategoryLabel || "") +
      " " +
      (row.description || "") +
      " " +
      row.bodyPlain
    ).toLowerCase();
    var parts = needle.split(/\s+/).filter(Boolean);
    for (var i = 0; i < parts.length; i++) {
      if (hay.indexOf(parts[i]) === -1) return false;
    }
    return true;
  }

  function debounce(fn, ms) {
    var t = 0;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function loadRows() {
    if (rowsCache) return Promise.resolve(rowsCache);
    return fetch("/api/handbook-search-index.json", { credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) return [];
        return r.json();
      })
      .then(function (rows) {
        rowsCache = Array.isArray(rows) ? rows : [];
        return rowsCache;
      })
      .catch(function () {
        rowsCache = [];
        return rowsCache;
      });
  }

  function hidePopover() {
    if (!pop) return;
    pop.hidden = true;
    pop.innerHTML = "";
  }

  function showPopover(hits, q) {
    if (!pop || !wrap) return;
    if (q.trim().length < 2) {
      hidePopover();
      return;
    }
    pop.replaceChildren();
    if (!hits.length) {
      var empty = document.createElement("p");
      empty.className = "header-search-popover__empty";
      empty.textContent = "No matches.";
      pop.appendChild(empty);
      pop.hidden = false;
      return;
    }
    var ul = document.createElement("ul");
    ul.className = "header-search-popover__list";
    ul.setAttribute("role", "listbox");
    for (var i = 0; i < hits.length && i < MAX; i++) {
      var row = hits[i];
      var li = document.createElement("li");
      li.className = "header-search-popover__item";
      var a = document.createElement("a");
      a.href = "/p/" + row.slug;
      a.className = "header-search-popover__link";
      a.setAttribute("role", "option");
      var spanT = document.createElement("span");
      spanT.className = "header-search-popover__title";
      spanT.textContent = row.title;
      var spanC = document.createElement("span");
      spanC.className = "header-search-popover__cat";
      spanC.textContent =
        row.categoryLabel + (row.subcategoryLabel ? " · " + row.subcategoryLabel : "");
      a.appendChild(spanT);
      a.appendChild(spanC);
      li.appendChild(a);
      ul.appendChild(li);
    }
    var foot = document.createElement("div");
    foot.className = "header-search-popover__foot";
    var all = document.createElement("a");
    all.href = "/search?q=" + encodeURIComponent(q.trim());
    all.className = "header-search-popover__all";
    all.textContent = "View all in search →";
    foot.appendChild(all);
    pop.appendChild(ul);
    pop.appendChild(foot);
    pop.hidden = false;
  }

  function onSearchPage() {
    return location.pathname.replace(/\/$/, "") === "/search";
  }

  function apply() {
    if (onSearchPage()) {
      hidePopover();
      return;
    }
    var q = input && "value" in input ? String(input.value || "") : "";
    var qt = q.trim();
    if (qt.length < 2) {
      hidePopover();
      return;
    }
    loadRows().then(function (rows) {
      var hits = [];
      for (var j = 0; j < rows.length; j++) {
        if (rowMatches(q, rows[j])) hits.push(rows[j]);
      }
      hits.sort(function (a, b) {
        return a.title.localeCompare(b.title);
      });
      showPopover(hits, q);
    });
  }

  function init() {
    input = document.getElementById("global-search");
    pop = document.getElementById("header-search-popover");
    wrap = document.querySelector(".shell__search-wrap");
    if (!input || !pop) return;

    var debounced = debounce(apply, 160);
    input.addEventListener("input", debounced);
    input.addEventListener("focus", function () {
      if (input.value.trim().length >= 2) debounced();
    });

    document.addEventListener("mousedown", function (ev) {
      if (!wrap || !pop || pop.hidden) return;
      var t = ev.target;
      if (t && wrap.contains(t)) return;
      hidePopover();
    });

    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") hidePopover();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
