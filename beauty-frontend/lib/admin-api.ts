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



export type AdminEquipmentItem = {
  id: number;
  name: string;
  description?: string;
  contact?: string;
  image_url?: string;
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
  image_url?: string;
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

export async function updateAdByAdmin(adId: number, payload: {
  type?: "service" | "cabinet" | "salon";
  title?: string;
  description?: string;
  city?: string;
  category_id?: number;
  status?: "pending" | "approved" | "rejected" | "active" | "expired";
  append_images?: boolean;
  image_urls?: string[];
  images?: File[];
}) {
  const formData = new FormData();
  if (payload.type) formData.append("type", payload.type);
  if (payload.title) formData.append("title", payload.title);
  if (payload.description) formData.append("description", payload.description);
  if (payload.city) formData.append("city", payload.city);
  if (payload.category_id) formData.append("category_id", String(payload.category_id));
  if (payload.status) formData.append("status", payload.status);
  formData.append("append_images", String(payload.append_images ?? true));
  for (const url of payload.image_urls || []) formData.append("image_urls[]", url);
  for (const file of payload.images || []) formData.append("images[]", file);

  const response = await fetch(`${API_URL}/admin/ads/${adId}`, {
    method: "PUT",
    credentials: "include",
    body: formData,
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


export async function getAdminEquipment() {
  const response = await fetch(`${API_URL}/admin/equipment`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<AdminEquipmentItem[]>(response);
}

export async function createEquipment(payload: {
  name: string;
  description: string;
  contact: string;
  image: File;
}) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("contact", payload.contact);
  formData.append("image", payload.image);

  const response = await fetch(`${API_URL}/admin/equipment`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return parseResponse<AdminEquipmentItem>(response);
}

export async function deleteEquipment(id: number) {
  const response = await fetch(`${API_URL}/admin/equipment/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return parseResponse<void>(response);
}
