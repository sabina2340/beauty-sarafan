import {
  Advertisement,
  MasterCard,
  MasterDetail,
  ReviewItem,
} from "@/lib/types";
import { buildApiUrl } from "@/lib/api-base";

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
  category_id?: string;
  city_id?: string;
  q?: string;
}): Promise<MasterCard[]> {
  const query = new URLSearchParams();
  if (params?.category_id) query.set("category_id", params.category_id);
  if (params?.city_id) query.set("city_id", params.city_id);
  if (params?.q) query.set("q", params.q);

  const url = `${buildApiUrl("/masters")}${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url, { cache: "no-store" });
  return parseResponse<MasterCard[]>(response);
}

export async function getMasterById(id: string): Promise<MasterDetail> {
  const response = await fetch(buildApiUrl(`/masters/${id}`), {
    cache: "no-store",
  });
  return parseResponse<MasterDetail>(response);
}

export async function getMasterAds(id: string): Promise<Advertisement[]> {
  const response = await fetch(buildApiUrl(`/masters/${id}/ads`), {
    cache: "no-store",
  });
  return parseResponse<Advertisement[]>(response);
}

export async function getMasterReviews(id: string): Promise<ReviewItem[]> {
  const response = await fetch(buildApiUrl(`/masters/${id}/reviews`), {
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

  const response = await fetch(buildApiUrl(`/masters/${id}/reviews`), {
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
  const response = await fetch(buildApiUrl(`/support-requests`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ id: number; status: string; message: string }>(
    response,
  );
}
