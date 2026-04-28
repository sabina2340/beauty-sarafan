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
  work_images?: {
    id: number;
    media_type: "image" | "video";
    image_url: string;
    video_url: string;
    sort_order: number;
  }[];
};

export type MyStory = {
  id: number;
  media_type: "image" | "video";
  media_url: string;
  created_at: string;
  expires_at: string;
};

const API_URL = "/api";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function authMe(options?: { silent?: boolean }): Promise<AuthMe | null> {
  const response = await fetch(`${API_URL}/auth/me`, {
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401 && options?.silent !== false) {
    return null;
  }

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

export async function logout() {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  return parseJson<{ message: string }>(response);
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

export async function changePassword(payload: { new_password: string; confirm_new_password: string }) {
  const response = await fetch(`${API_URL}/me/password`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<{ message: string }>(response);
}

export async function getMyProfile(): Promise<MyMasterProfile | null> {
  const response = await fetch(`${API_URL}/me/profile`, {
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 404) return null;
  return parseJson<MyMasterProfile>(response);
}

export async function acceptPersonalDataConsent() {
  const response = await fetch(`${API_URL}/me/consents/personal-data`, {
    method: "POST",
    credentials: "include",
  });
  return parseJson<{ message: string; accepted_at?: string }>(response);
}

export async function getPersonalDataConsent() {
  const response = await fetch(`${API_URL}/me/consents/personal-data`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson<{ accepted: boolean; accepted_at?: string }>(response);
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
  work_videos?: File[];
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
  for (const file of payload.work_videos || []) {
    formData.append("work_videos[]", file);
  }

  const response = await fetch(`${API_URL}/me/profile`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });
  return parseJson<MyMasterProfile>(response);
}

export async function getMyStories() {
  const response = await fetch(`${API_URL}/me/stories`, {
    credentials: "include",
    cache: "no-store",
  });
  const payload = await parseJson<{ items: MyStory[] }>(response);
  return Array.isArray(payload.items) ? payload.items : [];
}

export async function createMyStory(media: File) {
  const formData = new FormData();
  formData.append("media", media);
  const response = await fetch(`${API_URL}/me/stories`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return parseJson<MyStory>(response);
}

export async function deleteMyStory(id: number) {
  const response = await fetch(`${API_URL}/me/stories/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return parseJson<{ message: string }>(response);
}
