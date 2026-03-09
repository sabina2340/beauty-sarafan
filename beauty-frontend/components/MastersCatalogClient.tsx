"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getMasters } from "@/lib/api";
import { MasterCard as Master } from "@/lib/types";
import { MasterCard } from "@/components/MasterCard";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

export function MastersCatalogClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = searchParams.get("slug") || "";
  const city = searchParams.get("city") || "";
  const q = searchParams.get("q") || "";

  const backQuery = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMasters({ category: slug, city, q })
      .then((data) => {
        if (!cancelled) setMasters(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, city, q]);

  const updateFilters = (next: { slug?: string; city?: string; q?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    ["slug", "city", "q"].forEach((key) => {
      const value = next[key as keyof typeof next];
      if (typeof value === "string") {
        if (value.trim()) params.set(key, value.trim());
        else params.delete(key);
      }
    });

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const onReset = () => router.replace(pathname);

  return (
    <section>
      <h1>Каталог мастеров</h1>
      <form className="filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          Категория (slug)
          <input value={slug} onChange={(e) => updateFilters({ slug: e.target.value })} placeholder="nails" />
        </label>

        <label>
          Город
          <input value={city} onChange={(e) => updateFilters({ city: e.target.value })} placeholder="Москва" />
        </label>

        <label>
          Поиск
          <input value={q} onChange={(e) => updateFilters({ q: e.target.value })} placeholder="Имя мастера" />
        </label>

        <button type="button" className="btnSecondary" onClick={onReset}>
          Сбросить фильтры
        </button>
      </form>

      {loading && <LoadingState text="Загружаем мастеров..." />}
      {error && <ErrorState text={error} />}
      {!loading && !error && masters.length === 0 && (
        <EmptyState text="Ничего не найдено. Измените фильтры или сбросьте их." />
      )}

      <div className="grid" aria-live="polite">
        {masters.map((master) => (
          <MasterCard key={master.user_id} master={master} backQuery={backQuery} />
        ))}
      </div>
    </section>
  );
}
