export type AuthMe = {
  user_id: number;
  login: string;
  role: "admin" | "moderator" | "user";
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
