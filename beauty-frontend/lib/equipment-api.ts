import { EquipmentItem } from "@/lib/types";

const API_URL =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080")
    : "/api";

type ApiError = { error?: string };

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ error: "Request failed" }))) as ApiError;
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function getEquipmentCatalog(): Promise<EquipmentItem[]> {
  const response = await fetch(`${API_URL}/equipment`, { cache: "no-store" });
  return parseResponse<EquipmentItem[]>(response);
}
