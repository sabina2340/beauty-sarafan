export type ApiError = { error?: string };

export type AdminMaster = {
  user_id: number;
  login: string;
  role: "admin" | "moderator" | "user";
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  profile_id: number;
  full_name: string;
  city: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  avatar_url?: string;
  description?: string;
};

export type AdminAd = {
  id: number;
  user_id: number;
  type: "service" | "cabinet" | "salon";
  title: string;
  description?: string;
  city?: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  login?: string;
  full_name?: string;
  category_name?: string;
  category_slug?: string;
};

const API_URL = "/api";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ error: "Request failed" }))) as ApiError;
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function adminPing() {
  const response = await fetch(`${API_URL}/admin/ping`, { credentials: "include", cache: "no-store" });
  return parseResponse<{ message: string }>(response);
}

export async function getAdminMasters(status: "pending" | "approved" | "rejected") {
  const response = await fetch(`${API_URL}/admin/masters?status=${status}`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<AdminMaster[]>(response);
}

export async function moderateUser(userId: number, payload: { role: "admin" | "moderator" | "user"; status: "pending" | "approved" | "rejected" }) {
  const response = await fetch(`${API_URL}/admin/users/${userId}/moderate`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function approveUser(userId: number) {
  const response = await fetch(`${API_URL}/admin/masters/${userId}/approve`, {
    method: "PATCH",
    credentials: "include",
  });
  return parseResponse(response);
}

export async function rejectUser(userId: number, reason: string) {
  const response = await fetch(`${API_URL}/admin/masters/${userId}/reject`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reason.trim() ? { reason } : {}),
  });
  return parseResponse(response);
}

export async function createCategory(payload: { name: string; slug: string; group_name: string; group_title: string; audience: "master" | "client" | "both"; is_business?: boolean }) {
  const response = await fetch(`${API_URL}/admin/categories`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function getAdminAds(status: "pending" | "approved" | "rejected") {
  const response = await fetch(`${API_URL}/admin/ads?status=${status}`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<AdminAd[]>(response);
}

export async function approveAd(adId: number) {
  const response = await fetch(`${API_URL}/admin/ads/${adId}/approve`, {
    method: "PATCH",
    credentials: "include",
  });
  return parseResponse(response);
}

export async function rejectAd(adId: number, reason: string) {
  const response = await fetch(`${API_URL}/admin/ads/${adId}/reject`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reason.trim() ? { reason } : {}),
  });
  return parseResponse(response);
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
