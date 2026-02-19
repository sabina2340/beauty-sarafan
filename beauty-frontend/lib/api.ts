import { mockMasters } from '@/lib/mockData';
import { Master, MastersQuery } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const categoryLabels: Record<string, string> = {
  hair: 'Парикмахер',
  nails: 'Ногтевой сервис',
  brows: 'Бровист',
  massage: 'Массаж',
  cosmetology: 'Косметолог',
  makeup: 'Визажист'
};

function applyFilters(items: Master[], query: MastersQuery): Master[] {
  return items.filter((master) => {
    const categoryMatch = query.category ? master.category === query.category : true;
    const cityMatch = query.city ? master.city.toLowerCase().includes(query.city.toLowerCase()) : true;
    const q = query.q?.toLowerCase().trim();
    const queryMatch = q
      ? [master.name, master.city, master.shortDescription, master.categoryLabel]
          .join(' ')
          .toLowerCase()
          .includes(q)
      : true;

    return categoryMatch && cityMatch && queryMatch;
  });
}

function normalizeMaster(dto: Partial<Master> & { id: string; name: string }): Master {
  return {
    id: String(dto.id),
    name: dto.name,
    category: (dto.category as Master['category']) ?? 'hair',
    categoryLabel: dto.categoryLabel ?? categoryLabels[dto.category ?? ''] ?? 'Мастер',
    city: dto.city ?? 'Не указан',
    shortDescription: dto.shortDescription ?? 'Описание отсутствует.',
    description: dto.description ?? 'Подробное описание пока не добавлено.',
    services: dto.services ?? [],
    contacts: {
      phone: dto.contacts?.phone ?? 'Контакты не указаны',
      telegram: dto.contacts?.telegram,
      instagram: dto.contacts?.instagram
    }
  };
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new ApiError(`Ошибка загрузки: ${response.statusText}`, response.status);
  }
  return (await response.json()) as T;
}

export async function getMasters(query: MastersQuery): Promise<Master[]> {
  await sleep(350);
  try {
    const params = new URLSearchParams();
    if (query.category) params.set('category', query.category);
    if (query.city) params.set('city', query.city);
    if (query.q) params.set('q', query.q);

    const endpoint = `/masters${params.toString() ? `?${params.toString()}` : ''}`;
    const data = await request<Array<Partial<Master> & { id: string; name: string }>>(endpoint);

    return data.map(normalizeMaster);
  } catch {
    return applyFilters(mockMasters, query);
  }
}

export async function getMasterById(id: string): Promise<Master> {
  await sleep(350);
  try {
    const data = await request<Partial<Master> & { id: string; name: string }>(`/masters/${id}`);
    return normalizeMaster(data);
  } catch {
    const local = mockMasters.find((master) => master.id === id);
    if (!local) {
      throw new ApiError('Мастер не найден', 404);
    }
    return local;
  }
}

export async function getMasterAds(id: string): Promise<string[]> {
  await sleep(200);
  try {
    return await request<string[]>(`/masters/${id}/ads`);
  } catch {
    return [];
  }
}

export { ApiError };
