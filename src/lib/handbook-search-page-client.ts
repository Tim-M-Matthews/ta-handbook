import { highlightQueryTermsInPlainText } from "./search-query-highlight";
import { searchSnippetForHit } from "./search-snippet";

const PAGE_SIZE = 10;

type SearchHitRow = {
  slug: string;
  title: string;
  categoryLabel: string;
  subcategoryLabel: string | null;
  categoryId: string;
  description: string | null;
  bodyPlain: string;
  chromeBrand?: string;
  chromeOnBrand?: string;
};

function b64ToUtf8(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function readRowsFromPage(): SearchHitRow[] {
  const ta = document.getElementById("handbook-search-b64");
  if (!ta) return [];
  const b64 = (ta.textContent || ta.innerHTML || "").trim().replace(/\s+/g, "");
  if (!b64) return [];
  try {
    return JSON.parse(b64ToUtf8(b64)) as SearchHitRow[];
  } catch {
    return [];
  }
}

function rowMatches(q: string, row: SearchHitRow): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = (
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
  const parts = needle.split(/\s+/).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    if (hay.indexOf(parts[i]) === -1) return false;
  }
  return true;
}

function computeHits(qt: string, rows: SearchHitRow[]): SearchHitRow[] {
  const t = qt.trim();
  if (t.length < 2) return [];
  const hits: SearchHitRow[] = [];
  for (let j = 0; j < rows.length; j++) {
    if (rowMatches(qt, rows[j])) hits.push(rows[j]);
  }
  hits.sort((a, b) => a.title.localeCompare(b.title));
  return hits;
}

function debounce(fn: () => void, ms: number): () => void {
  let t = 0;
  return () => {
    window.clearTimeout(t);
    t = window.setTimeout(fn, ms);
  };
}

function getMainInput(): HTMLInputElement | null {
  return document.getElementById("search-q") as HTMLInputElement | null;
}

function getGlobalInput(): HTMLInputElement | null {
  return document.getElementById("global-search") as HTMLInputElement | null;
}

function syncQueryInputs(source: EventTarget | null): void {
  const qv =
    source && "value" in (source as HTMLInputElement)
      ? String((source as HTMLInputElement).value || "")
      : "";
  const main = getMainInput();
  const g = getGlobalInput();
  if (source !== main && main && "value" in main) main.value = qv;
  if (source !== g && g && "value" in g) g.value = qv;
}

function getQuery(): string {
  const main = getMainInput();
  const g = getGlobalInput();
  const a = main && "value" in main ? String(main.value || "").trim() : "";
  if (a) return a;
  return g && "value" in g ? String(g.value || "").trim() : "";
}

function getPage(): number {
  const u = new URL(window.location.href);
  const n = Number.parseInt(u.searchParams.get("page") || "1", 10);
  return !Number.isFinite(n) || n < 1 ? 1 : n;
}

function searchHref(pageNum: number, qv: string): string {
  const p = new URLSearchParams();
  if (qv) p.set("q", qv);
  if (pageNum > 1) p.set("page", String(pageNum));
  const s = p.toString();
  return s ? `/search?${s}` : "/search";
}

function syncUrl(qt: string, page: number): void {
  const u = new URL(window.location.href);
  if (qt) u.searchParams.set("q", qt);
  else u.searchParams.delete("q");
  if (page > 1) u.searchParams.set("page", String(page));
  else u.searchParams.delete("page");
  const next = u.pathname + u.search;
  if (next !== window.location.pathname + window.location.search) {
    history.replaceState(null, "", next);
  }
}

function renderHits(hitsSlice: SearchHitRow[], qt: string, allRows: SearchHitRow[]): void {
  const list = document.getElementById("search-results");
  const emptyEl = document.getElementById("search-empty");
  if (!list) return;
  list.replaceChildren();
  for (let i = 0; i < hitsSlice.length; i++) {
    const hit = hitsSlice[i];
    const li = document.createElement("li");
    li.className = "search-hit";
    const card = document.createElement("a");
    card.className = "search-hit__card";
    card.href = `/p/${hit.slug}`;
    const head = document.createElement("div");
    head.className = "search-hit__head";
    const h2 = document.createElement("h2");
    h2.className = "search-hit__title";
    const titleSpan = document.createElement("span");
    titleSpan.className = "search-hit__title-text";
    titleSpan.innerHTML = highlightQueryTermsInPlainText(hit.title, qt);
    h2.appendChild(titleSpan);
    head.appendChild(h2);
    const badges = document.createElement("div");
    badges.className = "search-hit__badges";
    if (hit.chromeBrand) {
      badges.classList.add("search-hit__badges--cat-chrome");
      badges.style.setProperty("--cat-chrome-brand", hit.chromeBrand);
      if (hit.chromeOnBrand) badges.style.setProperty("--cat-chrome-on-brand", hit.chromeOnBrand);
    }
    badges.setAttribute("role", "group");
    badges.setAttribute("aria-label", "Category");
    const catBadge = document.createElement("span");
    catBadge.className = "search-hit__badge search-hit__badge--category";
    catBadge.textContent = hit.categoryLabel;
    badges.appendChild(catBadge);
    if (hit.subcategoryLabel) {
      const arrow = document.createElement("span");
      arrow.className = "search-hit__badge-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "/";
      badges.appendChild(arrow);
      const subBadge = document.createElement("span");
      subBadge.className = "search-hit__badge search-hit__badge--subcategory";
      subBadge.textContent = hit.subcategoryLabel;
      badges.appendChild(subBadge);
    }
    head.appendChild(badges);
    card.appendChild(head);
    const snippet = searchSnippetForHit(hit, qt);
    if (snippet) {
      const sn = document.createElement("p");
      sn.className = "search-hit__snippet";
      sn.innerHTML = highlightQueryTermsInPlainText(snippet, qt);
      card.appendChild(sn);
    }
    li.appendChild(card);
    list.appendChild(li);
  }
  if (emptyEl) {
    const allForEmpty = computeHits(qt, allRows);
    emptyEl.hidden = !(qt.trim().length >= 2 && allForEmpty.length === 0);
  }
}

function updateMeta(hits: SearchHitRow[], qt: string, page: number, totalPages: number): void {
  const meta = document.getElementById("search-meta");
  if (!meta) return;
  const total = hits.length;
  if (!qt || qt.length < 2) {
    meta.textContent = "Start typing to see results.";
    return;
  }
  if (total === 0) {
    meta.textContent = "0 results";
    return;
  }
  if (totalPages <= 1) {
    meta.textContent = `${total} result${total === 1 ? "" : "s"}`;
    return;
  }
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  meta.textContent = `Showing ${from}–${to} of ${total} result${total === 1 ? "" : "s"} (page ${page} of ${totalPages})`;
}

function renderPagination(total: number, totalPages: number, page: number, qt: string): void {
  const nav = document.getElementById("search-pagination");
  if (!nav) return;
  if (totalPages <= 1) {
    nav.hidden = true;
    while (nav.firstChild) nav.removeChild(nav.firstChild);
    return;
  }
  nav.hidden = false;
  while (nav.firstChild) nav.removeChild(nav.firstChild);

  if (page > 1) {
    const pa = document.createElement("a");
    pa.className = "search-pagination__link search-pagination__link--prev";
    pa.href = searchHref(page - 1, qt);
    pa.setAttribute("data-search-page", String(page - 1));
    pa.textContent = "Previous";
    nav.appendChild(pa);
  } else {
    const ps = document.createElement("span");
    ps.className = "search-pagination__link search-pagination__link--prev is-disabled";
    ps.textContent = "Previous";
    nav.appendChild(ps);
  }

  const st = document.createElement("span");
  st.className = "search-pagination__status";
  st.id = "search-pagination-status";
  st.textContent = `Page ${page} of ${totalPages}`;
  nav.appendChild(st);

  if (page < totalPages) {
    const na = document.createElement("a");
    na.className = "search-pagination__link search-pagination__link--next";
    na.href = searchHref(page + 1, qt);
    na.setAttribute("data-search-page", String(page + 1));
    na.textContent = "Next";
    nav.appendChild(na);
  } else {
    const ns = document.createElement("span");
    ns.className = "search-pagination__link search-pagination__link--next is-disabled";
    ns.textContent = "Next";
    nav.appendChild(ns);
  }
}

function mount(rows: SearchHitRow[]): void {
  const mainInput = getMainInput();
  const globalInput = getGlobalInput();
  const form = document.getElementById("search-form");
  const pagNav = document.getElementById("search-pagination");
  let init = true;
  let prevQt: string | null = null;

  if (pagNav && !pagNav.dataset.paginationBound) {
    pagNav.dataset.paginationBound = "1";
    pagNav.addEventListener("click", (e) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[data-search-page]") as
        | HTMLAnchorElement
        | null;
      if (!a) return;
      e.preventDefault();
      const p = Number.parseInt(a.getAttribute("data-search-page") || "", 10);
      if (!Number.isFinite(p) || p < 1) return;
      const u = new URL(window.location.href);
      const qt = getQuery();
      if (qt) u.searchParams.set("q", qt);
      else u.searchParams.delete("q");
      if (p > 1) u.searchParams.set("page", String(p));
      else u.searchParams.delete("page");
      history.replaceState(null, "", u.pathname + u.search);
      apply();
    });
  }

  function apply(): void {
    let qt = getQuery();
    let page = getPage();
    if (!init && prevQt !== qt) page = 1;
    init = false;
    prevQt = qt;

    const hits = computeHits(qt, rows);
    const totalPages = hits.length === 0 ? 0 : Math.ceil(hits.length / PAGE_SIZE);
    if (totalPages > 0 && page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    if (totalPages === 0) page = 1;

    const slice = hits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    renderHits(slice, qt, rows);
    updateMeta(hits, qt, page, totalPages);
    renderPagination(hits.length, totalPages, page, qt);
    syncUrl(qt, page);
  }

  function onType(ev: Event): void {
    syncQueryInputs(ev.target);
    debounced();
  }

  const debounced = debounce(apply, 120);

  if (mainInput) mainInput.addEventListener("input", onType);
  if (globalInput) globalInput.addEventListener("input", onType);

  if (form)
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      syncQueryInputs(mainInput || globalInput);
      apply();
    });

  if (mainInput && globalInput && "value" in mainInput && "value" in globalInput) {
    globalInput.value = mainInput.value;
  }

  apply();
}

export function mountHandbookSearchPage(): void {
  const fromPage = readRowsFromPage();
  if (fromPage.length) {
    mount(fromPage);
    return;
  }

  fetch("/api/handbook-search-index.json", { credentials: "same-origin" })
    .then((r) => {
      if (!r.ok) return [];
      return r.json() as Promise<SearchHitRow[]>;
    })
    .then(mount)
    .catch(() => {
      mount([]);
    });
}
