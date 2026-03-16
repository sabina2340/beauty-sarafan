import { Advertisement, MasterCard, MasterDetail, ReviewItem } from "@/lib/types";

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

export async function getMasterById(id: string): Promise<MasterDetail> {
  const response = await fetch(`http://localhost:8080/masters/${id}`, { cache: "no-store" });
  return parseResponse<MasterDetail>(response);
}

export async function getMasterAds(id: string): Promise<Advertisement[]> {
  const response = await fetch(`${API_URL}/masters/${id}/ads`, { cache: "no-store" });
  return parseResponse<Advertisement[]>(response);
}


export async function getMasterReviews(id: string): Promise<ReviewItem[]> {
  const response = await fetch(`${API_URL}/masters/${id}/reviews`, { cache: "no-store" });
  return parseResponse<ReviewItem[]>(response);
}

export async function createMasterReview(id: string, payload: {
  phone: string;
  text: string;
  photo: File;
  is_personal_data_consent: boolean;
  personal_data_consent_type?: string;
}) {
  const formData = new FormData();
  formData.append("phone", payload.phone);
  formData.append("text", payload.text);
  formData.append("photo", payload.photo);
  formData.append("is_personal_data_consent", String(payload.is_personal_data_consent));
  formData.append("personal_data_consent_type", payload.personal_data_consent_type || "privacy_policy_v1");

  const response = await fetch(`${API_URL}/masters/${id}/reviews`, {
    method: "POST",
    body: formData,
  });
  return parseResponse<{ id: number; status: string; message: string }>(response);
}
