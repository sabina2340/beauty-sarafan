import { Advertisement, MasterCard } from "@/lib/types";

// В DEV ходим через Next proxy, чтобы не было CORS в браузере
const API_URL = "/api";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function getMasters(params?: {
  category?: string; // <-- было slug, делаем понятное имя под UI
  city?: string;
  q?: string;
}): Promise<MasterCard[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.city) query.set("city", params.city);
  if (params?.q) query.set("q", params.q);

  const url = `${API_URL}/masters${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url, { cache: "no-store" });
  return parseResponse<MasterCard[]>(response);
}

export async function getMasterById(id: string): Promise<MasterCard> {
  const response = await fetch(`${API_URL}/masters/${id}`, { cache: "no-store" });
  return parseResponse<MasterCard>(response);
}

export async function getMasterAds(id: string): Promise<Advertisement[]> {
  const response = await fetch(`${API_URL}/masters/${id}/ads`, { cache: "no-store" });
  return parseResponse<Advertisement[]>(response);
}
