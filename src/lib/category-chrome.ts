/**
 * Brand swatch for handbook homepage tiles and inner `main` background tint.
 * Add an entry when introducing a new top-level category under `content/pages`.
 */
const CATEGORY_CHROME_SWATCH: Record<string, string> = {
  welcome: "var(--accent)",
  hr: "#785964",
  financial: "#2d8f6f",
  legal: "#4a5568",
  responsibilities: "#f2542d",
  referrals: "#7494ea",
  policies: "#d138bf",
  insurance: "#44ccff",
  "client-lifecycle": "#f9c846",
  "clinical-resources": "#b4654a",
  theranest: "#5a9580",
  testing: "#7e57c2",
  technology: "#2980b9",
  office: "#f7d6e0",
  administrative: "#e67e22",
};

/** Text color on solid `categoryChromeSwatch` fills (breadcrumb category pill, etc.). */
const CATEGORY_CHROME_ON_BRAND: Record<string, string> = {
  welcome: "#ffffff",
  hr: "#ffffff",
  financial: "#ffffff",
  legal: "#ffffff",
  responsibilities: "#ffffff",
  referrals: "#ffffff",
  policies: "#ffffff",
  insurance: "#0d1a1f",
  "client-lifecycle": "#141414",
  "clinical-resources": "#ffffff",
  theranest: "#ffffff",
  testing: "#ffffff",
  technology: "#ffffff",
  office: "#1a1416",
  administrative: "#ffffff",
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
