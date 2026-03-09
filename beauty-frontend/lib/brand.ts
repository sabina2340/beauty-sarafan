export const BRAND_LOGO_STORAGE_KEY = "sarafan_brand_logo_data_url";

export function readBrandLogo(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(BRAND_LOGO_STORAGE_KEY);
}

export function saveBrandLogo(dataUrl: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BRAND_LOGO_STORAGE_KEY, dataUrl);
}

export function clearBrandLogo() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(BRAND_LOGO_STORAGE_KEY);
}
