import {
  Advertisement,
  MasterCard,
  MasterDetail,
  ReviewItem,
} from "@/lib/types";

const API_URL = "/api";
const SERVER_API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function apiUrl(path: string) {
  if (typeof window !== "undefined") {
    return `${API_URL}${path}`;
  }
  return `${SERVER_API_URL}${path}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
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

  const url = `${apiUrl("/masters")}${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url, { cache: "no-store" });
  return parseResponse<MasterCard[]>(response);
}

export async function getMasterById(id: string): Promise<MasterDetail> {
  const response = await fetch(apiUrl(`/masters/${id}`), { cache: "no-store" });
  return parseResponse<MasterDetail>(response);
}

export async function getMasterAds(id: string): Promise<Advertisement[]> {
  const response = await fetch(apiUrl(`/masters/${id}/ads`), {
    cache: "no-store",
  });
  return parseResponse<Advertisement[]>(response);
}

export async function getMasterReviews(id: string): Promise<ReviewItem[]> {
  const response = await fetch(apiUrl(`/masters/${id}/reviews`), {
    cache: "no-store",
  });
  return parseResponse<ReviewItem[]>(response);
}

export async function createMasterReview(
  id: string,
  payload: {
    phone: string;
    text: string;
    photo: File;
    is_personal_data_consent: boolean;
    personal_data_consent_type?: string;
  },
) {
  const formData = new FormData();
  formData.append("phone", payload.phone);
  formData.append("text", payload.text);
  formData.append("photo", payload.photo);
  formData.append(
    "is_personal_data_consent",
    String(payload.is_personal_data_consent),
  );
  formData.append(
    "personal_data_consent_type",
    payload.personal_data_consent_type || "privacy_policy_v1",
  );

  const response = await fetch(apiUrl(`/masters/${id}/reviews`), {
    method: "POST",
    body: formData,
  });
  return parseResponse<{ id: number; status: string; message: string }>(
    response,
  );
}

export async function createSupportRequest(payload: {
  name: string;
  contact: string;
  message: string;
}) {
  const response = await fetch(apiUrl(`/support-requests`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ id: number; status: string; message: string }>(
    response,
  );
}
