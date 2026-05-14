/**
 * Brand swatch for handbook homepage tiles and inner `main` background tint.
 * Add an entry when introducing a new top-level category under `content/pages`.
 */
const CATEGORY_CHROME_SWATCH: Record<string, string> = {
  welcome: "var(--accent)",
  "client-care": "#f9c846",
  "client-workflow": "#785964",
  communication: "#44ccff",
  employment: "#f2542d",
  general: "#f7d6e0",
  operations: "#d138bf",
  "privacy-compliance": "#7494ea",
  resources: "#b4654a",
};

/** Text color on solid `categoryChromeSwatch` fills (breadcrumb category pill, etc.). */
const CATEGORY_CHROME_ON_BRAND: Record<string, string> = {
  welcome: "#ffffff",
  "client-care": "#141414",
  "client-workflow": "#ffffff",
  communication: "#0d1a1f",
  employment: "#ffffff",
  general: "#1a1416",
  operations: "#ffffff",
  "privacy-compliance": "#ffffff",
  resources: "#ffffff",
};

export function categoryChromeSwatch(categoryId: string): string | undefined {
  return CATEGORY_CHROME_SWATCH[categoryId];
}

export function categoryChromeOnBrand(categoryId: string): string | undefined {
  return CATEGORY_CHROME_ON_BRAND[categoryId];
}

/** Optional fields to merge into search / bookmark JSON for pill styling. */
export function categoryChromeFieldsForRow(categoryId: string): {
  chromeBrand?: string;
  chromeOnBrand?: string;
} {
  const chromeBrand = categoryChromeSwatch(categoryId);
  if (!chromeBrand) return {};
  const chromeOnBrand = categoryChromeOnBrand(categoryId);
  return chromeOnBrand ? { chromeBrand, chromeOnBrand } : { chromeBrand };
}
