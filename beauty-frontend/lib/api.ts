import { Advertisement, MasterCard } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getMasters(params?: {
  slug?: string;
  city?: string;
  q?: string;
}): Promise<MasterCard[]> {
  const query = new URLSearchParams();
  if (params?.slug) query.set("slug", params.slug);
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
