import type { AstroCookies } from "astro";
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

export function hiddenStatusesFromRequest(
  cookies: AstroCookies,
  email: string | undefined,
  userRoles: string[],
): PageStatus[] {
  return viewPreferencesFromRequest(cookies, email, userRoles).hiddenStatuses;
}

/** Whether to show homepage status filter and status dots (admins only). */
export function showStatusUiFromRequest(
  cookies: AstroCookies,
  email: string | undefined,
  userRoles: string[],
): boolean {
  const prefs = viewPreferencesFromRequest(cookies, email, userRoles);
  return userIsAdmin(userRoles) && prefs.showStatusUi;
}
