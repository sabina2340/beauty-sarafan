import { EquipmentItem } from "@/lib/types";
import { buildApiUrl } from "@/lib/api-base";

type ApiError = { error?: string };

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response
      .json()
      .catch(() => ({ error: "Request failed" }))) as ApiError;
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function getEquipmentCatalog(): Promise<EquipmentItem[]> {
  const response = await fetch(buildApiUrl("/equipment"), {
    cache: "no-store",
  });
  return parseResponse<EquipmentItem[]>(response);
}
