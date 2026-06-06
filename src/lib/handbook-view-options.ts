import type { PageStatus } from "./page-status";
import { userIsAdmin } from "./roles";

/** Resolved visibility options for lists, search, and page access. */
export type HandbookViewOptions = {
  hiddenStatuses: PageStatus[];
  /** When true, admin preview uses staff role gates only (status filters ignored). */
  previewAsStaff: boolean;
};

export function defaultHandbookViewOptions(): HandbookViewOptions {
  return { hiddenStatuses: [], previewAsStaff: false };
}

/** Roles used for category/page gates when an admin previews staff view. */
export function rolesForHandbookView(
  userRoles: string[],
  view: HandbookViewOptions,
): string[] {
  if (view.previewAsStaff && userIsAdmin(userRoles)) return ["staff"];
  return userRoles;
}
