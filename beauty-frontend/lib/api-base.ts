const DEFAULT_PUBLIC_API_URL = "/api";
const DEFAULT_INTERNAL_API_URL = "http://backend:8080";
const DEFAULT_DEV_INTERNAL_API_URL = "http://localhost:8080";

function normalizeBaseUrl(value: string) {
  if (!value) return value;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeApiPath(path: string) {
  if (!path) return "";
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  return withLeadingSlash.replace(/^\/api(?=\/|$)/, "");
}

export function getApiBaseUrl() {
  if (typeof window === "undefined") {
    const fallback =
      process.env.NODE_ENV === "production"
        ? DEFAULT_INTERNAL_API_URL
        : DEFAULT_DEV_INTERNAL_API_URL;

    return normalizeBaseUrl(process.env.INTERNAL_API_URL || fallback);
  }

  return normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_URL || DEFAULT_PUBLIC_API_URL,
  );
}

export function buildApiUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = normalizeApiPath(path);

  if (!normalizedPath) return baseUrl;
  return `${baseUrl}${normalizedPath}`;
}
