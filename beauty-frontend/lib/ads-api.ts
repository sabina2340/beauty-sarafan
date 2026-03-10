import { Advertisement } from "@/lib/types";

const API_URL = "/api";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export type Tariff = {
  ID: number;
  Name: string;
  Price: number;
  DurationDays: number;
  IsActive: boolean;
};

export type ActiveAdCard = {
  id: number;
  type: string;
  title: string;
  description: string;
  city: string;
  image_url: string;
};

export type MyAdItem = Advertisement & {
  tariff_id?: number;
  expires_at?: string;
  has_pending_payment?: boolean;
  last_payment_id?: number;
};

export async function createAd(payload: {
  type: string;
  title: string;
  description: string;
  city: string;
  category_id?: number;
  image_urls?: string[];
  images?: File[];
}) {
  const formData = new FormData();
  formData.append("type", payload.type);
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("city", payload.city);
  if (payload.category_id) formData.append("category_id", String(payload.category_id));
  for (const imageUrl of payload.image_urls || []) {
    formData.append("image_urls[]", imageUrl);
  }
  for (const file of payload.images || []) {
    formData.append("images[]", file);
  }

  const response = await fetch(`${API_URL}/advertisements`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return parseResponse<{ message: string; advertisement: Advertisement }>(response);
}

export async function getMyAds() {
  const response = await fetch(`${API_URL}/advertisements/my`, { credentials: "include", cache: "no-store" });
  return parseResponse<MyAdItem[]>(response);
}

export async function getTariffs() {
  const response = await fetch(`${API_URL}/tariffs`, { cache: "no-store" });
  return parseResponse<Tariff[]>(response);
}

export async function selectTariff(adId: number, tariffId: number) {
  const response = await fetch(`${API_URL}/advertisements/${adId}/select-tariff`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tariff_id: tariffId }),
  });
  return parseResponse<{ payment_id: number; redirect: string }>(response);
}

export async function getAdPayment(adId: number) {
  const response = await fetch(`${API_URL}/advertisements/${adId}/payment`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<any>(response);
}

export async function markPaid(paymentId: number, comment: string) {
  const response = await fetch(`${API_URL}/payments/${paymentId}/mark-paid`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
  return parseResponse<{ message: string }>(response);
}

export async function getHotOffers() {
  const response = await fetch(`${API_URL}/hot-offers`, { cache: "no-store" });
  return parseResponse<ActiveAdCard[]>(response);
}

export async function getActiveAds(limit = 10) {
  const response = await fetch(`${API_URL}/ads/active?limit=${limit}`, { cache: "no-store" });
  return parseResponse<ActiveAdCard[]>(response);
}

export async function getAdminPendingPayments() {
  const response = await fetch(`${API_URL}/admin/payments/pending`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<any[]>(response);
}

export async function confirmPayment(paymentId: number) {
  const response = await fetch(`${API_URL}/admin/payments/${paymentId}/confirm`, {
    method: "POST",
    credentials: "include",
  });
  return parseResponse<{ message: string }>(response);
}

export async function rejectPayment(paymentId: number) {
  const response = await fetch(`${API_URL}/admin/payments/${paymentId}/reject`, {
    method: "POST",
    credentials: "include",
  });
  return parseResponse<{ message: string }>(response);
}
