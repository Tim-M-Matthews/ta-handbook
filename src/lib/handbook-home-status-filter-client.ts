import { blurbForHandbookCard } from "./handbook-card-blurb";
import {
  createSearchHitListItem,
  type HandbookSearchHitRow,
} from "./handbook-search-hit-dom";
import {
  pageStatusLabel,
  type PageStatus,
  type PageStatusFilterValue,
} from "./page-status";

type HomeStatusPageRow = {
  slug: string;
  title: string;
  categoryLabel: string;
  subcategoryLabel: string | null;
  categoryId: string;
  description: string | null;
  bodyPlain: string;
  status: PageStatus;
  chromeBrand?: string;
  chromeOnBrand?: string;
};

const STORAGE_KEY = "triangle-act-handbook:home-status-filter";
const PAGE_SIZE = 10;

function b64ToUtf8(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function readRows(): HomeStatusPageRow[] {
  const ta = document.getElementById("home-status-pages-b64");
  if (!ta) return [];
  const b64 = (ta.textContent || ta.innerHTML || "").trim().replace(/\s+/g, "");
  if (!b64) return [];
  try {
    return JSON.parse(b64ToUtf8(b64)) as HomeStatusPageRow[];
  } catch {
    return [];
  }
}

function toHitRow(row: HomeStatusPageRow): HandbookSearchHitRow {
  return {
    slug: row.slug,
    title: row.title,
    categoryLabel: row.categoryLabel,
    subcategoryLabel: row.subcategoryLabel,
    categoryId: row.categoryId,
    status: row.status,
    snippet: blurbForHandbookCard(row),
    chromeBrand: row.chromeBrand,
    chromeOnBrand: row.chromeOnBrand,
  };
}

function filterRows(rows: HomeStatusPageRow[], status: PageStatusFilterValue): HomeStatusPageRow[] {
  if (status === "all") return [];
  return rows.filter((r) => r.status === status);
}

function sortedFiltered(rows: HomeStatusPageRow[], status: PageStatusFilterValue): HomeStatusPageRow[] {
  return [...filterRows(rows, status)].sort((a, b) => a.title.localeCompare(b.title));
}

function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(1, page), totalPages);
}

function updateMeta(
  meta: HTMLElement | null,
  total: number,
  status: PageStatusFilterValue,
  page: number,
  totalPages: number,
): void {
  if (!meta) return;
  if (status === "all") {
    meta.hidden = true;
    meta.textContent = "";
    return;
  }
  meta.hidden = false;
  const label = pageStatusLabel(status);
  if (totalPages <= 1) {
    meta.textContent = `${total} page${total === 1 ? "" : "s"} · ${label}`;
    return;
  }
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  meta.textContent = `Showing ${from}–${to} of ${total} page${total === 1 ? "" : "s"} · ${label} (page ${page} of ${totalPages})`;
}

function renderPagination(
  nav: HTMLElement | null,
  total: number,
  totalPages: number,
  page: number,
): void {
  if (!nav) return;
  if (totalPages <= 1) {
    nav.hidden = true;
    nav.replaceChildren();
    return;
  }
  nav.hidden = false;
  nav.replaceChildren();

  if (page > 1) {
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "search-pagination__link search-pagination__link--prev";
    prev.textContent = "Previous";
    prev.setAttribute("data-home-status-page", String(page - 1));
    nav.appendChild(prev);
  } else {
    const prev = document.createElement("span");
    prev.className = "search-pagination__link search-pagination__link--prev is-disabled";
    prev.textContent = "Previous";
    nav.appendChild(prev);
  }

  const statusEl = document.createElement("span");
  statusEl.className = "search-pagination__status";
  statusEl.textContent = `Page ${page} of ${totalPages}`;
  nav.appendChild(statusEl);

  if (page < totalPages) {
    const next = document.createElement("button");
    next.type = "button";
    next.className = "search-pagination__link search-pagination__link--next";
    next.textContent = "Next";
    next.setAttribute("data-home-status-page", String(page + 1));
    nav.appendChild(next);
  } else {
    const next = document.createElement("span");
    next.className = "search-pagination__link search-pagination__link--next is-disabled";
    next.textContent = "Next";
    nav.appendChild(next);
  }
}

export function mountHandbookHomeStatusFilter(): void {
  const select = document.getElementById("home-status-filter") as HTMLSelectElement | null;
  const results = document.getElementById("home-status-results");
  const pagination = document.getElementById("home-status-pagination");
  const grid = document.getElementById("home-cat-grid");
  const catEmpty = document.getElementById("home-cat-empty");
  const meta = document.getElementById("home-status-filter-meta");
  const empty = document.getElementById("home-status-filter-empty");
  if (!select || !results) return;

  const allRows = readRows();
  let currentPage = 1;

  function applyFilter(status: PageStatusFilterValue, page = 1): void {
    try {
      localStorage.setItem(STORAGE_KEY, status);
    } catch {
      /* ignore */
    }

    const filtered = sortedFiltered(allRows, status);
    const showResults = status !== "all";
    const total = filtered.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / PAGE_SIZE);
    currentPage = clampPage(page, totalPages);

    if (showResults) {
      document.documentElement.setAttribute("data-home-status-filter", status);
    } else {
      document.documentElement.removeAttribute("data-home-status-filter");
    }

    if (grid) grid.hidden = showResults;
    if (catEmpty) catEmpty.hidden = showResults;
    results.hidden = !showResults;
    if (pagination) pagination.hidden = !showResults || totalPages <= 1;
    if (empty) empty.hidden = !showResults || total > 0;

    updateMeta(meta, total, status, currentPage, totalPages);
    renderPagination(pagination, total, totalPages, currentPage);

    results.replaceChildren();
    if (!showResults) return;

    const slice = filtered.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );
    for (const row of slice) {
      results.appendChild(createSearchHitListItem(toHitRow(row)));
    }
  }

  pagination?.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const btn = t.closest("[data-home-status-page]");
    if (!btn || !(btn instanceof HTMLElement)) return;
    const page = Number.parseInt(btn.getAttribute("data-home-status-page") ?? "1", 10);
    if (!Number.isFinite(page)) return;
    applyFilter(select.value as PageStatusFilterValue, page);
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  try {
    const saved = localStorage.getItem(STORAGE_KEY) as PageStatusFilterValue | null;
    if (saved && [...select.options].some((o) => o.value === saved)) {
      select.value = saved;
    }
  } catch {
    /* ignore */
  }

  applyFilter(select.value as PageStatusFilterValue, 1);
  select.addEventListener("change", () => {
    applyFilter(select.value as PageStatusFilterValue, 1);
  });
}
