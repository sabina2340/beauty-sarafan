'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MasterCard } from '@/components/master-card';
import { UiState } from '@/components/ui-state';
import { getMasters } from '@/lib/api';
import { Master, MastersQuery } from '@/lib/types';

const CATEGORIES = [
  { value: '', label: 'Все категории' },
  { value: 'hair', label: 'Парикмахер' },
  { value: 'nails', label: 'Ногтевой сервис' },
  { value: 'brows', label: 'Бровист' },
  { value: 'massage', label: 'Массаж' },
  { value: 'cosmetology', label: 'Косметолог' },
  { value: 'makeup', label: 'Визажист' }
];

export function MastersCatalogClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [masters, setMasters] = useState<Master[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      category: searchParams.get('category') ?? '',
      city: searchParams.get('city') ?? '',
      q: searchParams.get('q') ?? ''
    }),
    [searchParams]
  );

  useEffect(() => {
    const query: MastersQuery = {
      ...(filters.category && { category: filters.category }),
      ...(filters.city && { city: filters.city }),
      ...(filters.q && { q: filters.q })
    };

    setLoading(true);
    setError(null);

    getMasters(query)
      .then((data) => setMasters(data))
      .catch((e: Error) => setError(e.message || 'Не удалось загрузить список мастеров.'))
      .finally(() => setLoading(false));
  }, [filters]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function resetFilters() {
    router.replace(pathname);
  }

  const currentQuery = searchParams.toString();

  return (
    <section>
      <div className="filters" aria-label="Фильтры мастеров">
        <label>
          Категория
          <select
            value={filters.category}
            onChange={(event) => updateParam('category', event.target.value)}
            aria-label="Фильтр по категории"
          >
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Город
          <input
            value={filters.city}
            onChange={(event) => updateParam('city', event.target.value)}
            placeholder="Например, Москва"
            aria-label="Фильтр по городу"
          />
        </label>

        <label>
          Поиск
          <input
            value={filters.q}
            onChange={(event) => updateParam('q', event.target.value)}
            placeholder="Имя, категория или ключевое слово"
            aria-label="Поиск мастера"
          />
        </label>
      </div>

      {isLoading && <UiState title="Загружаем мастеров..." description="Подбираем подходящие варианты" />}

      {error && !isLoading && (
        <UiState
          title="Ошибка при загрузке"
          description={error}
          action={
            <button className="secondary-btn" onClick={() => window.location.reload()}>
              Повторить
            </button>
          }
        />
      )}

      {!isLoading && !error && masters.length === 0 && (
        <UiState
          title="Ничего не найдено"
          description="Попробуйте изменить параметры поиска или сбросить фильтры."
          action={
            <button className="secondary-btn" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          }
        />
      )}

      {!isLoading && !error && masters.length > 0 && (
        <div className="masters-grid">
          {masters.map((master) => (
            <MasterCard key={master.id} master={master} currentQuery={currentQuery} />
          ))}
        </div>
      )}
    </section>
  );
}
