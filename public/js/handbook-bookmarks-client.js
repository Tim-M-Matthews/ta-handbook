/**
 * Handbook bookmarks: sessionStorage when `window.__HANDBOOK_BOOKMARKS_DEV__` is true,
 * else GET/PUT `/api/handbook-bookmarks.json` (Cloudflare KV on the server).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "triangle-act-handbook:bookmarks";

  function isDev() {
    return window.__HANDBOOK_BOOKMARKS_DEV__ === true;
  }

  function readLocal() {
    try {
      var t = sessionStorage.getItem(STORAGE_KEY);
      return t ? JSON.parse(t) : [];
    } catch (_) {
      return [];
    }
  }

  function writeLocal(items) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function isSafeBookmarkHref(href) {
    if (!href || typeof href !== "string" || href.length > 280 || href.indexOf("..") >= 0) {
      return false;
    }
    var article = /^\/p\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/i;
    var category = /^\/c\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/i;
    return article.test(href) || category.test(href);
  }

  function normalize(raw) {
    if (!Array.isArray(raw)) return [];
    var out = [];
    var seen = {};
    for (var i = 0; i < raw.length; i++) {
      if (out.length >= 200) break;
      var row = raw[i];
      if (!row || typeof row !== "object") continue;
      var slug = typeof row.slug === "string" ? row.slug.trim() : "";
      if (!slug || seen[slug]) continue;
      seen[slug] = true;
      var title =
        typeof row.title === "string" ? row.title.trim().slice(0, 500) : slug;
      var savedAt =
        typeof row.savedAt === "number" && isFinite(row.savedAt)
          ? row.savedAt
          : Date.now();
      var hrefRaw = typeof row.href === "string" ? row.href.trim() : "";
      var href = hrefRaw && isSafeBookmarkHref(hrefRaw) ? hrefRaw : undefined;
      var item = { slug: slug, title: title, savedAt: savedAt };
      if (href) item.href = href;
      out.push(item);
    }
    out.sort(function (a, b) {
      return b.savedAt - a.savedAt;
    });
    return out;
  }

  function load() {
    if (isDev()) {
      return Promise.resolve(normalize(readLocal()));
    }
    return fetch("/api/handbook-bookmarks.json", { credentials: "same-origin" }).then(
      function (r) {
        if (!r.ok) throw new Error("load_failed");
        return r.json();
      },
    ).then(normalize);
  }

  function save(items) {
    var list = normalize(items);
    if (isDev()) {
      writeLocal(list);
      try {
        document.dispatchEvent(new CustomEvent("handbook-bookmarks-changed"));
      } catch (_) {}
      return Promise.resolve(list);
    }
    return fetch("/api/handbook-bookmarks.json", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list),
    }).then(function (r) {
      if (!r.ok) throw new Error("save_failed");
      return r.json();
    }).then(normalize).then(function (out) {
      try {
        document.dispatchEvent(new CustomEvent("handbook-bookmarks-changed"));
      } catch (_) {}
      return out;
    });
  }

  function toggle(slug, title, href) {
    return load().then(function (cur) {
      var next = cur.slice();
      var idx = -1;
      for (var j = 0; j < next.length; j++) {
        if (next[j].slug === slug) {
          idx = j;
          break;
        }
      }
      if (idx >= 0) next.splice(idx, 1);
      else {
        var row = { slug: slug, title: title || slug, savedAt: Date.now() };
        if (href && isSafeBookmarkHref(href)) row.href = href;
        next.unshift(row);
      }
      return save(next);
    });
  }

  window.HandbookBookmarks = { load: load, save: save, toggle: toggle };

  function setBookmarkBtnState(btn, on) {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      on ? "Bookmarked. Click to remove from bookmarks." : "Add to bookmarks",
    );
    var label = btn.querySelector(".handbook-bookmark-btn__label");
    if (label) {
      label.textContent = on ? "Bookmarked" : "Add to bookmarks";
    }
    btn.classList.toggle("handbook-bookmark-btn--on", on);
  }

  function refreshArticleBtn(btn, slug, title) {
    return load()
      .then(function (list) {
        var on = list.some(function (b) {
          return b.slug === slug;
        });
        setBookmarkBtnState(btn, on);
      })
      .catch(function () {
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("aria-label", "Add to bookmarks");
        var label = btn.querySelector(".handbook-bookmark-btn__label");
        if (label) label.textContent = "Add to bookmarks";
        btn.classList.remove("handbook-bookmark-btn--on");
        btn.disabled = true;
      });
  }

  function createBookmarkListIcon(wrapperClass) {
    var wrap = document.createElement("span");
    wrap.className = wrapperClass;
    wrap.setAttribute("aria-hidden", "true");
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    var path = document.createElementNS(ns, "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z");
    svg.appendChild(path);
    wrap.appendChild(svg);
    return wrap;
  }

  function clearCategoryVisualBookmarks() {
    var markedLinks = document.querySelectorAll("a.cat__link--bookmarked");
    for (var i = 0; i < markedLinks.length; i++) {
      var a = markedLinks[i];
      a.classList.remove("cat__link--bookmarked");
      var liIcon = a.querySelector(".cat__link-bookmark-icon");
      if (liIcon) liIcon.remove();
    }
    var subLinks = document.querySelectorAll("a.cat__subtitle-link--bookmarked");
    for (var s = 0; s < subLinks.length; s++) {
      var subA = subLinks[s];
      subA.classList.remove("cat__subtitle-link--bookmarked");
      var subIcon = subA.querySelector(".cat__subtitle-bookmark-icon");
      if (subIcon) subIcon.remove();
    }
  }

  function applyCategoryVisualBookmarks() {
    return load()
      .then(function (list) {
        clearCategoryVisualBookmarks();
        var slugs = {};
        for (var i = 0; i < list.length; i++) slugs[list[i].slug] = true;

        var pageLinks = document.querySelectorAll("a.cat__link[data-handbook-page-slug]");
        for (var j = 0; j < pageLinks.length; j++) {
          var pl = pageLinks[j];
          var pSlug = pl.getAttribute("data-handbook-page-slug");
          if (!pSlug || !slugs[pSlug]) continue;
          var heading = pl.querySelector(".cat__link-heading");
          if (!heading) continue;
          heading.insertBefore(createBookmarkListIcon("cat__link-bookmark-icon"), heading.firstChild);
          pl.classList.add("cat__link--bookmarked");
        }

        var subtitleLinks = document.querySelectorAll("a.cat__subtitle-link[data-handbook-bookmark-slug]");
        for (var k = 0; k < subtitleLinks.length; k++) {
          var st = subtitleLinks[k];
          var stSlug = st.getAttribute("data-handbook-bookmark-slug");
          if (!stSlug || !slugs[stSlug]) continue;
          st.insertBefore(createBookmarkListIcon("cat__subtitle-bookmark-icon"), st.firstChild);
          st.classList.add("cat__subtitle-link--bookmarked");
        }

      })
      .catch(function () {});
  }

  function initCategoryBookmarkMarks() {
    function maybeApply() {
      if (
        !document.querySelector("a.cat__link[data-handbook-page-slug]") &&
        !document.querySelector("a.cat__subtitle-link[data-handbook-bookmark-slug]")
      ) {
        return;
      }
      applyCategoryVisualBookmarks();
    }
    maybeApply();
    document.addEventListener("handbook-bookmarks-changed", maybeApply);
  }

  function initArticleBookmark() {
    var bar = document.querySelector("[data-handbook-bookmark-bar]");
    if (!bar) return;
    var slug = bar.getAttribute("data-bookmark-slug");
    var title = bar.getAttribute("data-bookmark-title") || "";
    var hrefAttr = bar.getAttribute("data-bookmark-href");
    var href = hrefAttr && hrefAttr.trim() ? hrefAttr.trim() : undefined;
    if (!slug) return;
    var btn = bar.querySelector(".handbook-bookmark-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      btn.disabled = true;
      toggle(slug, title, href)
        .then(function () {
          return refreshArticleBtn(btn, slug, title);
        })
        .finally(function () {
          btn.disabled = false;
        });
    });
    refreshArticleBtn(btn, slug, title);
  }

  function ensureBookmarkCrumbsLoaded() {
    if (window.__HANDBOOK_BOOKMARK_CRUMBS__) return;
    var modal = document.getElementById("handbook-bookmarks-modal");
    var b64 = modal && modal.getAttribute("data-handbook-bookmark-crumbs-b64");
    if (!b64 || typeof b64 !== "string") return;
    try {
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) & 0xff;
      var json = new TextDecoder("utf-8").decode(bytes);
      window.__HANDBOOK_BOOKMARK_CRUMBS__ = JSON.parse(json);
    } catch (_) {
      window.__HANDBOOK_BOOKMARK_CRUMBS__ = {};
    }
  }

  function lookupBookmarkCrumbs(slug) {
    ensureBookmarkCrumbsLoaded();
    try {
      var M = window.__HANDBOOK_BOOKMARK_CRUMBS__;
      if (!M || typeof M !== "object" || !slug) return null;
      var s = String(slug).trim();
      var row = M[s];
      if (!row) row = M[s.toLowerCase()];
      if (!row && s.includes("/")) {
        var canon = s
          .split("/")
          .map(function (p) {
            return p.toLowerCase();
          })
          .join("/");
        row = M[canon];
      }
      if (!row || typeof row !== "object") return null;
      var c = typeof row.categoryLabel === "string" ? row.categoryLabel.trim() : "";
      if (!c) return null;
      var sub = typeof row.subcategoryLabel === "string" ? row.subcategoryLabel.trim() : "";
      var out = { categoryLabel: c };
      if (sub) out.subcategoryLabel = sub;
      if (typeof row.chromeBrand === "string" && row.chromeBrand) {
        out.chromeBrand = row.chromeBrand;
      }
      if (typeof row.chromeOnBrand === "string" && row.chromeOnBrand) {
        out.chromeOnBrand = row.chromeOnBrand;
      }
      return out;
    } catch (_) {
      return null;
    }
  }

  function bookmarkItemHref(b) {
    if (b.href && isSafeBookmarkHref(b.href)) return b.href;
    return (
      "/p/" +
      b.slug
        .split("/")
        .map(function (seg) {
          return encodeURIComponent(seg);
        })
        .join("/")
    );
  }

  function assignSavedAtForOrder(items) {
    var base = Date.now();
    for (var i = 0; i < items.length; i++) {
      items[i].savedAt = base - i;
    }
  }

  function reorderBookmarkSlice(items, from, to) {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
      return items.slice();
    }
    var next = items.slice();
    var row = next.splice(from, 1)[0];
    next.splice(to, 0, row);
    return next;
  }

  function createDragGripIcon() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("class", "handbook-bookmarks__drag-grip-svg");
    svg.setAttribute("aria-hidden", "true");
    for (var r = 0; r < 3; r++) {
      var line = document.createElementNS(ns, "rect");
      line.setAttribute("x", "2");
      line.setAttribute("y", String(3 + r * 6));
      line.setAttribute("width", "16");
      line.setAttribute("height", "2.5");
      line.setAttribute("rx", "1.25");
      line.setAttribute("fill", "currentColor");
      svg.appendChild(line);
    }
    return svg;
  }

  function createRemoveCircleIcon() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "handbook-bookmarks__remove-x-svg");
    svg.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(ns, "path");
    p.setAttribute(
      "d",
      "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    );
    p.setAttribute("fill", "currentColor");
    svg.appendChild(p);
    return svg;
  }

  function renderModalList(listRoot, list, editMode) {
    listRoot.replaceChildren();
    if (!list.length) {
      var empty = document.createElement("p");
      empty.className = "handbook-bookmarks-empty";
      empty.textContent =
        "No bookmarks yet. Open a handbook page or subcategory and add it from there.";
      listRoot.appendChild(empty);
      return;
    }
    var ul = document.createElement("ul");
    ul.className = editMode
      ? "handbook-bookmarks__list handbook-bookmarks-modal__ul"
      : "search-list handbook-bookmarks-modal__ul";
    ul.setAttribute("role", "list");
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      var li = document.createElement("li");
      li.setAttribute("role", "listitem");
      if (editMode) {
        li.className = "handbook-bookmarks__item handbook-bookmarks__item--editing";
        li.setAttribute("data-handbook-bookmarks-index", String(i));
        var row = document.createElement("div");
        row.className = "handbook-bookmarks__edit-row";
        var handle = document.createElement("div");
        handle.className = "handbook-bookmarks__drag-handle";
        handle.setAttribute("draggable", "true");
        handle.setAttribute("role", "button");
        handle.setAttribute("tabindex", "0");
        handle.setAttribute(
          "aria-label",
          "Drag to reorder: " + (b.title || b.slug).replace(/"/g, "'"),
        );
        handle.setAttribute("data-handbook-bookmarks-drag-index", String(i));
        handle.appendChild(createDragGripIcon());
        var main = document.createElement("div");
        main.className = "handbook-bookmarks__edit-main";
        var titleSpan = document.createElement("span");
        titleSpan.className = "handbook-bookmarks__item-title--editing";
        titleSpan.textContent = b.title;
        main.appendChild(titleSpan);
        var crEdit = lookupBookmarkCrumbs(b.slug);
        if (crEdit && crEdit.categoryLabel) {
          var crp = document.createElement("p");
          crp.className = "handbook-bookmarks__item-crumbs";
          crp.textContent = crEdit.subcategoryLabel
            ? crEdit.categoryLabel + " / " + crEdit.subcategoryLabel
            : crEdit.categoryLabel;
          main.appendChild(crp);
        }
        var rm = document.createElement("button");
        rm.type = "button";
        rm.className = "handbook-bookmarks__remove-btn";
        rm.setAttribute("data-handbook-bookmarks-remove", b.slug);
        rm.setAttribute(
          "aria-label",
          "Remove " + (b.title || b.slug).replace(/"/g, "'") + " from bookmarks",
        );
        rm.appendChild(createRemoveCircleIcon());
        row.appendChild(handle);
        row.appendChild(main);
        row.appendChild(rm);
        li.appendChild(row);
      } else {
        li.className = "search-hit";
        var card = document.createElement("a");
        card.className = "search-hit__card";
        card.href = bookmarkItemHref(b);
        var head = document.createElement("div");
        head.className = "search-hit__head";
        var h2 = document.createElement("h2");
        h2.className = "search-hit__title";
        var titleSpan = document.createElement("span");
        titleSpan.className = "search-hit__title-text";
        titleSpan.textContent = b.title;
        h2.appendChild(titleSpan);
        head.appendChild(h2);
        var crView = lookupBookmarkCrumbs(b.slug);
        if (crView && crView.categoryLabel) {
          var badges = document.createElement("div");
          badges.className = "search-hit__badges";
          if (crView.chromeBrand) {
            badges.classList.add("search-hit__badges--cat-chrome");
            badges.style.setProperty("--cat-chrome-brand", crView.chromeBrand);
            if (crView.chromeOnBrand) {
              badges.style.setProperty("--cat-chrome-on-brand", crView.chromeOnBrand);
            }
          }
          badges.setAttribute("role", "group");
          badges.setAttribute("aria-label", "Category");
          var catBadge = document.createElement("span");
          catBadge.className = "search-hit__badge search-hit__badge--category";
          catBadge.textContent = crView.categoryLabel;
          badges.appendChild(catBadge);
          if (crView.subcategoryLabel) {
            var arrow = document.createElement("span");
            arrow.className = "search-hit__badge-arrow";
            arrow.setAttribute("aria-hidden", "true");
            arrow.textContent = "/";
            badges.appendChild(arrow);
            var subBadge = document.createElement("span");
            subBadge.className = "search-hit__badge search-hit__badge--subcategory";
            subBadge.textContent = crView.subcategoryLabel;
            badges.appendChild(subBadge);
          }
          head.appendChild(badges);
        }
        card.appendChild(head);
        li.appendChild(card);
      }
      ul.appendChild(li);
    }
    listRoot.appendChild(ul);
  }

  function initBookmarksModal() {
    var openBtn = document.getElementById("handbook-bookmarks-open");
    var modal = document.getElementById("handbook-bookmarks-modal");
    var listRoot = document.getElementById("handbook-bookmarks-modal-list");
    var closeBtn = document.getElementById("handbook-bookmarks-modal-close");
    var editBtn = document.getElementById("handbook-bookmarks-edit");
    if (!openBtn || !modal || !listRoot || !closeBtn) return;

    var editMode = false;

    function syncModalTop() {
      var header = document.querySelector(".shell__header");
      var h = header ? header.offsetHeight : 60;
      modal.style.setProperty("--bookmarks-modal-top", h + "px");
    }

    function updateEditBtn() {
      if (!editBtn) return;
      editBtn.textContent = editMode ? "Done editing" : "Edit bookmarks";
      editBtn.setAttribute("aria-pressed", editMode ? "true" : "false");
    }

    function refreshModalList() {
      return load()
        .then(function (list) {
          renderModalList(listRoot, list, editMode);
        })
        .catch(function () {
          listRoot.replaceChildren();
          var err = document.createElement("p");
          err.className = "empty";
          err.textContent = "Could not load bookmarks.";
          listRoot.appendChild(err);
        });
    }

    function openModal() {
      modal.hidden = false;
      syncModalTop();
      editMode = false;
      updateEditBtn();
      return refreshModalList().then(function () {
        closeBtn.focus();
      });
    }

    function closeModal() {
      modal.hidden = true;
      editMode = false;
      updateEditBtn();
      openBtn.focus();
    }

    openBtn.addEventListener("click", function () {
      void openModal();
    });

    closeBtn.addEventListener("click", function () {
      closeModal();
    });

    if (editBtn) {
      editBtn.addEventListener("click", function () {
        editMode = !editMode;
        updateEditBtn();
        void refreshModalList();
      });
    }

    listRoot.addEventListener("click", function (e) {
      var t = e.target;
      if (!(t instanceof HTMLElement)) return;
      var rm = t.closest("button[data-handbook-bookmarks-remove]");
      if (rm) {
        var slugRm = rm.getAttribute("data-handbook-bookmarks-remove");
        if (!slugRm || rm.disabled) return;
        rm.disabled = true;
        load()
          .then(function (list) {
            var next = list.filter(function (x) {
              return x.slug !== slugRm;
            });
            assignSavedAtForOrder(next);
            return save(next);
          })
          .then(function () {
            return refreshModalList();
          })
          .finally(function () {
            rm.disabled = false;
          });
      }
    });

    function clearBookmarkDragClasses() {
      var nodes = listRoot.querySelectorAll(
        ".handbook-bookmarks__item--dragging, .handbook-bookmarks__item--drop-over",
      );
      for (var c = 0; c < nodes.length; c++) {
        nodes[c].classList.remove("handbook-bookmarks__item--dragging");
        nodes[c].classList.remove("handbook-bookmarks__item--drop-over");
      }
    }

    listRoot.addEventListener("dragstart", function (e) {
      var h = e.target && e.target.closest && e.target.closest(".handbook-bookmarks__drag-handle");
      if (!h || !listRoot.contains(h)) return;
      var idx = parseInt(h.getAttribute("data-handbook-bookmarks-drag-index") || "-1", 10);
      if (idx < 0 || !e.dataTransfer) return;
      e.dataTransfer.setData("application/x-handbook-bookmark-index", String(idx));
      e.dataTransfer.setData("text/plain", String(idx));
      e.dataTransfer.effectAllowed = "move";
      var li = h.closest("li[data-handbook-bookmarks-index]");
      if (li) li.classList.add("handbook-bookmarks__item--dragging");
    });

    listRoot.addEventListener("dragend", function () {
      clearBookmarkDragClasses();
    });

    listRoot.addEventListener("dragover", function (e) {
      var li = e.target && e.target.closest && e.target.closest("li[data-handbook-bookmarks-index]");
      if (!li || !listRoot.contains(li)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      var marked = listRoot.querySelectorAll(".handbook-bookmarks__item--drop-over");
      for (var m = 0; m < marked.length; m++) marked[m].classList.remove("handbook-bookmarks__item--drop-over");
      li.classList.add("handbook-bookmarks__item--drop-over");
    });

    listRoot.addEventListener("drop", function (e) {
      var li = e.target && e.target.closest && e.target.closest("li[data-handbook-bookmarks-index]");
      if (!li || !listRoot.contains(li)) return;
      e.preventDefault();
      clearBookmarkDragClasses();
      var from = parseInt(
        (e.dataTransfer && e.dataTransfer.getData("application/x-handbook-bookmark-index")) ||
          (e.dataTransfer && e.dataTransfer.getData("text/plain")) ||
          "-1",
        10,
      );
      var to = parseInt(li.getAttribute("data-handbook-bookmarks-index") || "-1", 10);
      if (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to < 0 || from === to) {
        return;
      }
      load()
        .then(function (list) {
          if (from >= list.length || to >= list.length) return null;
          var next = reorderBookmarkSlice(list, from, to);
          assignSavedAtForOrder(next);
          return save(next);
        })
        .then(function (result) {
          if (result == null) return;
          return refreshModalList();
        });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || modal.hidden) return;
      closeModal();
    });

    document.addEventListener("handbook-bookmarks-changed", function () {
      if (modal.hidden) return;
      void refreshModalList();
    });

    window.addEventListener("resize", function () {
      if (!modal.hidden) syncModalTop();
    });

    try {
      var u = new URL(window.location.href);
      if (u.searchParams.get("bookmarks") === "1") {
        u.searchParams.delete("bookmarks");
        var q = u.searchParams.toString();
        window.history.replaceState({}, "", u.pathname + (q ? "?" + q : "") + u.hash);
        void openModal();
      }
    } catch (_) {}
  }

  function boot() {
    initArticleBookmark();
    initBookmarksModal();
    initCategoryBookmarkMarks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
