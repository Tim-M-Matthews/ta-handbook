import { pageStatusLabel, type PageStatus } from "./page-status";
import { highlightQueryTermsInPlainText } from "./search-query-highlight";

export type HandbookSearchHitRow = {
  slug: string;
  title: string;
  categoryLabel: string;
  subcategoryLabel: string | null;
  categoryId: string;
  snippet: string | null;
  status?: PageStatus;
  chromeBrand?: string;
  chromeOnBrand?: string;
};

export function prependPageStatusIcon(parent: HTMLElement, status: PageStatus): void {
  const label = pageStatusLabel(status);
  const span = document.createElement("span");
  span.className = `page-status-icon page-status-icon--${status}`;
  span.title = label;
  span.setAttribute("aria-label", `Status: ${label}`);
  const dot = document.createElement("span");
  dot.className = "page-status-icon__dot";
  dot.setAttribute("aria-hidden", "true");
  span.appendChild(dot);
  parent.insertBefore(span, parent.firstChild);
}

type CreateSearchHitOptions = {
  highlightQuery?: string;
};

/** Build a `.search-hit` list item matching `/search` result cards. */
export function createSearchHitListItem(
  hit: HandbookSearchHitRow,
  options?: CreateSearchHitOptions,
): HTMLLIElement {
  const q = options?.highlightQuery?.trim() ?? "";
  const li = document.createElement("li");
  li.className = "search-hit";

  const card = document.createElement("a");
  card.className = "search-hit__card";
  card.href = `/p/${hit.slug}`;

  const head = document.createElement("div");
  head.className = "search-hit__head";

  const h2 = document.createElement("h2");
  h2.className = "search-hit__title";
  if (hit.status) prependPageStatusIcon(h2, hit.status);
  const titleSpan = document.createElement("span");
  titleSpan.className = "search-hit__title-text";
  if (q) {
    titleSpan.innerHTML = highlightQueryTermsInPlainText(hit.title, q);
  } else {
    titleSpan.textContent = hit.title;
  }
  h2.appendChild(titleSpan);
  head.appendChild(h2);

  const badges = document.createElement("div");
  badges.className = "search-hit__badges";
  if (hit.chromeBrand) {
    badges.classList.add("search-hit__badges--cat-chrome");
    badges.style.setProperty("--cat-chrome-brand", hit.chromeBrand);
    if (hit.chromeOnBrand) {
      badges.style.setProperty("--cat-chrome-on-brand", hit.chromeOnBrand);
    }
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

  if (hit.snippet) {
    const sn = document.createElement("p");
    sn.className = "search-hit__snippet";
    if (q) {
      sn.innerHTML = highlightQueryTermsInPlainText(hit.snippet, q);
    } else {
      sn.textContent = hit.snippet;
    }
    card.appendChild(sn);
  }

  li.appendChild(card);
  return li;
}
