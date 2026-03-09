export type AuthMe = {
  user_id: number;
  login: string;
  role: "admin" | "moderator" | "user";
};

export type MyMasterProfile = {
  id: number;
  user_id: number;
  category_id: number;
  full_name: string;
  description: string;
  services: string;
  phone: string;
  city: string;
  social_links: string;
  avatar_url: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  work_images?: { image_url: string; sort_order: number }[];
};

const API_URL = "/api";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function authMe(): Promise<AuthMe> {
  const response = await fetch(`${API_URL}/auth/me`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson<AuthMe>(response);
}

export async function login(payload: { login: string; password: string }) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<{ message: string; role: string; status: string }>(response);
}

export async function register(payload: { login: string; password: string }) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<{ message: string; user_id: number; status: string }>(response);
}

export async function getMyProfile() {
  const response = await fetch(`${API_URL}/me/profile`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson<MyMasterProfile>(response);
}

export async function acceptPersonalDataConsent() {
  const response = await fetch(`${API_URL}/me/consents/personal-data`, {
    method: "POST",
    credentials: "include",
  });
  return parseJson<{ message: string }>(response);
}

export async function upsertMyProfile(payload: {
  category_id: number;
  full_name: string;
  description: string;
  services: string;
  phone: string;
  city: string;
  social_links: string;
  avatar?: File | null;
  works?: File[];
}) {
  const formData = new FormData();
  formData.append("category_id", String(payload.category_id));
  formData.append("full_name", payload.full_name);
  formData.append("description", payload.description);
  formData.append("services", payload.services);
  formData.append("phone", payload.phone);
  formData.append("city", payload.city);
  formData.append("social_links", payload.social_links);

  if (payload.avatar) {
    formData.append("avatar", payload.avatar);
  }
  for (const file of payload.works || []) {
    formData.append("works[]", file);
  }

  const response = await fetch(`${API_URL}/me/profile`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });
  return parseJson<MyMasterProfile>(response);
}
