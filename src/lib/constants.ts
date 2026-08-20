// Brand color — single source of truth for all Ascend UI accent color
export const BRAND_COLOR = "#0da2b3";
export const BRAND_COLOR_HOVER = "#0c8a99";

// Helper: inject brand color as a CSS variable on the root element
// Call this once at app initialization (e.g., in root layout or app entry)
export function initBrandColor() {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--brand-color", BRAND_COLOR);
  document.documentElement.style.setProperty("--brand-color-hover", BRAND_COLOR_HOVER);
}

// Usage in Tailwind: use template literal `` bg-[${BRAND_COLOR}] ``
// or use the CSS variable: bg-[var(--brand-color)]
