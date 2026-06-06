import type { AstroCookies } from "astro";
import {
  defaultHandbookViewOptions,
  type HandbookViewOptions,
} from "./handbook-view-options";
import {
  defaultViewPreferences,
  viewPreferencesForUser,
  type HandbookViewPreferences,
} from "./handbook-view-preferences";
import type { PageStatus } from "./page-status";
import { userIsAdmin } from "./roles";

export function viewPreferencesFromRequest(
  cookies: AstroCookies,
  email: string | undefined,
  userRoles: string[],
): HandbookViewPreferences {
  if (!userIsAdmin(userRoles)) return defaultViewPreferences();
  return viewPreferencesForUser(cookies, email);
}

export function handbookViewOptionsFromRequest(
  cookies: AstroCookies,
  email: string | undefined,
  userRoles: string[],
): HandbookViewOptions {
  if (!userIsAdmin(userRoles)) return defaultHandbookViewOptions();
  const prefs = viewPreferencesForUser(cookies, email);
  if (prefs.viewMode === "staff") {
    return { hiddenStatuses: [], previewAsStaff: true };
  }
  return { hiddenStatuses: prefs.hiddenStatuses, previewAsStaff: false };
}

/** @deprecated Use handbookViewOptionsFromRequest */
export function hiddenStatusesFromRequest(
  cookies: AstroCookies,
  email: string | undefined,
  userRoles: string[],
): PageStatus[] {
  return handbookViewOptionsFromRequest(cookies, email, userRoles).hiddenStatuses;
}

/** Whether to show homepage status filter and status dots (admins only). */
export function showStatusUiFromRequest(
  cookies: AstroCookies,
  email: string | undefined,
  userRoles: string[],
): boolean {
  const prefs = viewPreferencesFromRequest(cookies, email, userRoles);
  if (!userIsAdmin(userRoles)) return false;
  if (prefs.viewMode === "staff") return false;
  return prefs.showStatusUi;
}
