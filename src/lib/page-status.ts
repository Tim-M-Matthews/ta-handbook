import { userIsAdmin } from "./roles";

/** Editorial / publish status for handbook pages (frontmatter `status`). */
export type PageStatus = "todo" | "draft" | "complete";

/** Default for new pages in GitCMS; also used when `status` is set to an unknown value. */
export const DEFAULT_PAGE_STATUS: PageStatus = "todo";

/** Pages with no `status` in frontmatter (existing handbook content). */
export const PAGE_STATUS_WHEN_OMITTED: PageStatus = "complete";

export const PAGE_STATUSES: PageStatus[] = ["todo", "draft", "complete"];

export type PageStatusFilterValue = PageStatus | "all";

/** Statuses hidden from non-admin viewers (lists, search, direct URL). */
const ADMIN_ONLY_STATUSES = new Set<PageStatus>(["todo", "draft"]);

export function parsePageStatus(raw: unknown): PageStatus {
  if (raw === undefined || raw === null) return PAGE_STATUS_WHEN_OMITTED;
  if (typeof raw !== "string") return PAGE_STATUS_WHEN_OMITTED;
  if (!raw.trim()) return PAGE_STATUS_WHEN_OMITTED;
  const key = raw.trim().toLowerCase().replace(/\s+/g, "-");
  const aliases: Record<string, PageStatus> = {
    todo: "todo",
    "to-do": "todo",
    draft: "draft",
    complete: "complete",
    done: "complete",
    stub: "complete",
    "in-progress": "draft",
    inprogress: "draft",
  };
  const mapped = aliases[key];
  if (mapped) return mapped;
  if ((PAGE_STATUSES as string[]).includes(key)) return key as PageStatus;
  return DEFAULT_PAGE_STATUS;
}

export function userWantsToSeeStatus(
  status: PageStatus,
  hiddenStatuses?: PageStatus[],
): boolean {
  return !(hiddenStatuses ?? []).includes(status);
}

export function userCanViewPageByStatus(
  userRoles: string[],
  status: PageStatus,
  hiddenStatuses?: PageStatus[],
): boolean {
  if (!userWantsToSeeStatus(status, hiddenStatuses)) return false;
  if (userIsAdmin(userRoles)) return true;
  return !ADMIN_ONLY_STATUSES.has(status);
}

export function pageStatusLabel(status: PageStatus): string {
  switch (status) {
    case "todo":
      return "To-do";
    case "draft":
      return "Draft";
    case "complete":
      return "Complete";
  }
}

export const PAGE_STATUS_FILTER_OPTIONS: {
  value: PageStatusFilterValue;
  label: string;
}[] = [
  { value: "all", label: "All statuses" },
  ...PAGE_STATUSES.map((status) => ({
    value: status,
    label: pageStatusLabel(status),
  })),
];
