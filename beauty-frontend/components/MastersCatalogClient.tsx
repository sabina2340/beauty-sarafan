"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getMasters } from "@/lib/api";
import { MasterCard as Master } from "@/lib/types";
import { MasterCard } from "@/components/MasterCard";
import {
  categoryIdOf,
  categoryNameOf,
  getCategories,
  getCities,
  type CategoryItem,
  type CityItem,
} from "@/lib/reference-api";

export function MastersCatalogClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [masters, setMasters] = useState<Master[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryId = searchParams.get("category_id") || "";
  const cityId = searchParams.get("city_id") || "";
  const q = searchParams.get("q") || "";
  const backQuery = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getCategories({ audience: "master" }), getCities()])
      .then(([categoryItems, cityItems]) => {
        if (cancelled) return;
        setCategories(Array.isArray(categoryItems) ? categoryItems : []);
        setCities(Array.isArray(cityItems) ? cityItems : []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingFilters(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMasters({ category_id: categoryId, city_id: cityId, q })
      .then((data) => !cancelled && setMasters(Array.isArray(data) ? data : []))
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [categoryId, cityId, q]);

  const updateFilters = (next: {
    category_id?: string;
    city_id?: string;
    q?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    ["category_id", "city_id", "q"].forEach((key) => {
      const value = next[key as keyof typeof next];
      if (typeof value === "string")
        value.trim() ? params.set(key, value.trim()) : params.delete(key);
    });
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <section>
      <h1 className="h1">Каталог мастеров</h1>
      <p className="lead">Выберите мастера и свяжитесь с ним в 1 клик.</p>

      <form className="filters" onSubmit={(e) => e.preventDefault()}>
        <select
          className="select"
          value={categoryId}
          onChange={(e) => updateFilters({ category_id: e.target.value })}
          disabled={loadingFilters}
        >
          <option value="">
            {loadingFilters ? "Загрузка категорий..." : "Все направления"}
          </option>
          {categories.map((category) => (
            <option key={categoryIdOf(category)} value={categoryIdOf(category)}>
              {categoryNameOf(category)}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={cityId}
          onChange={(e) => updateFilters({ city_id: e.target.value })}
          disabled={loadingFilters}
        >
          <option value="">
            {loadingFilters ? "Загрузка городов..." : "Все города"}
          </option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => updateFilters({ q: e.target.value })}
          placeholder="Имя мастера"
        />
        <button
          type="button"
          className="btn btnGhost"
          onClick={() => router.replace(pathname)}
        >
          Сбросить
        </button>
      </form>

      {loading ? <p className="muted">Загрузка...</p> : null}
      {error ? <p className="adminError">{error}</p> : null}
      {!loading && !error && masters.length === 0 ? (
        <p className="muted">Ничего не найдено.</p>
      ) : null}

      <div className="grid" aria-live="polite">
        {masters.map((master) => (
          <MasterCard
            key={master.user_id}
            master={master}
            backQuery={backQuery}
          />
        ))}
      </div>
    </section>
  );
}
