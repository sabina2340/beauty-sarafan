import { buildApiUrl } from "@/lib/api-base";

export type CityItem = {
  id: number;
  name: string;
};

export type CategoryItem = {
  ID?: number;
  Name?: string;
  Slug?: string;
  id?: number;
  name?: string;
  slug?: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function getCities(): Promise<CityItem[]> {
  const response = await fetch(buildApiUrl("/cities"), { cache: "no-store" });
  return parseResponse<CityItem[]>(response);
}

export async function getCategories(params?: {
  audience?: "master" | "client" | "both";
}) {
  const query = new URLSearchParams();
  if (params?.audience) query.set("audience", params.audience);
  const response = await fetch(
    `${buildApiUrl("/categories")}${query.toString() ? `?${query.toString()}` : ""}`,
    { cache: "no-store" },
  );
  return parseResponse<CategoryItem[]>(response);
}

export function categoryIdOf(item: CategoryItem) {
  return item.ID ?? item.id ?? 0;
}

export function categoryNameOf(item: CategoryItem) {
  return item.Name ?? item.name ?? "Без названия";
}
