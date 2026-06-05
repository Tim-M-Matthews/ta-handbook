import {
  defaultViewPreferences,
  HANDBOOK_VIEW_PREFS_COOKIE,
  localStorageKeyForViewPrefs,
  readViewPreferencesFromDocumentCookie,
  type HandbookViewPreferences,
} from "./handbook-view-preferences";
import { PAGE_STATUSES, type PageStatus } from "./page-status";

function normalizePrefs(raw: Partial<HandbookViewPreferences>): HandbookViewPreferences {
  return {
    hiddenStatuses: (raw.hiddenStatuses ?? []).filter((s): s is PageStatus =>
      (PAGE_STATUSES as string[]).includes(s),
    ),
    showStatusUi: raw.showStatusUi !== false,
  };
}

function hasViewPrefsCookie(): boolean {
  const prefix = `${HANDBOOK_VIEW_PREFS_COOKIE}=`;
  return document.cookie.split("; ").some((c) => c.startsWith(prefix));
}

function loadPrefs(email: string): HandbookViewPreferences {
  if (hasViewPrefsCookie()) {
    return readViewPreferencesFromDocumentCookie(email);
  }

  const key = localStorageKeyForViewPrefs(email);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as HandbookViewPreferences;
      return normalizePrefs(parsed);
    }
  } catch {
    /* ignore */
  }
  return defaultViewPreferences();
}

async function savePrefs(email: string, prefs: HandbookViewPreferences): Promise<void> {
  const normalized = normalizePrefs(prefs);
  const key = localStorageKeyForViewPrefs(email);
  try {
    localStorage.setItem(key, JSON.stringify(normalized));
  } catch {
    /* ignore */
  }

  const res = await fetch("/api/handbook-view-preferences", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalized),
  });

  if (!res.ok) {
    throw new Error(`Failed to save settings (${res.status})`);
  }
}

function isStatusVisible(prefs: HandbookViewPreferences, status: PageStatus): boolean {
  return !prefs.hiddenStatuses.includes(status);
}

function setStatusVisible(
  prefs: HandbookViewPreferences,
  status: PageStatus,
  visible: boolean,
): HandbookViewPreferences {
  const hidden = new Set(prefs.hiddenStatuses);
  if (visible) hidden.delete(status);
  else hidden.add(status);
  return { ...prefs, hiddenStatuses: PAGE_STATUSES.filter((s) => hidden.has(s)) };
}

export function mountHandbookSettingsPage(): void {
  const form = document.getElementById("handbook-settings-form");
  if (!form) return;

  const resolvedEmail = form.getAttribute("data-user-email")?.trim() || "";
  if (!resolvedEmail) return;

  let prefs = loadPrefs(resolvedEmail);
  const statusEl = document.getElementById("handbook-settings-status");

  function syncUi(): void {
    const showUiInput = form.querySelector<HTMLInputElement>("#handbook-show-status-ui");
    if (showUiInput) showUiInput.checked = prefs.showStatusUi;

    for (const status of PAGE_STATUSES) {
      const input = form.querySelector<HTMLInputElement>(
        `input[data-status="${status}"]`,
      );
      if (input) input.checked = isStatusVisible(prefs, status);
    }
  }

  syncUi();

  async function persistAndReload(): Promise<void> {
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent = "Saving…";
    }
    try {
      await savePrefs(resolvedEmail, prefs);
      window.location.reload();
    } catch (err) {
      if (statusEl) {
        statusEl.textContent =
          err instanceof Error ? err.message : "Could not save settings.";
      }
      syncUi();
    }
  }

  form.addEventListener("change", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || t.type !== "checkbox") return;

    if (t.id === "handbook-show-status-ui") {
      prefs = { ...prefs, showStatusUi: t.checked };
      void persistAndReload();
      return;
    }

    const status = t.getAttribute("data-status");
    if (!status || !(PAGE_STATUSES as string[]).includes(status)) return;
    prefs = setStatusVisible(prefs, status as PageStatus, t.checked);
    void persistAndReload();
  });

  const reset = document.getElementById("handbook-settings-reset");
  reset?.addEventListener("click", () => {
    prefs = { ...prefs, hiddenStatuses: [] };
    void persistAndReload();
  });
}
