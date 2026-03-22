"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getMasters } from "@/lib/api";
import { MasterCard as Master } from "@/lib/types";
import { MasterCard } from "@/components/MasterCard";
import { buildApiUrl } from "@/lib/api-base";

type CategoryItem = {
  id: number;
  name: string;
  slug: string;
};

type CategoryGroup = {
  group_name: string;
  group_title: string;
  is_business: boolean;
  items: CategoryItem[];
};

export function MastersCatalogClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [masters, setMasters] = useState<Master[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = searchParams.get("slug") || "";
  const city = searchParams.get("city") || "";
  const q = searchParams.get("q") || "";
  const backQuery = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    fetch(buildApiUrl("/category-groups"))
      .then((res) => res.json())
      .then((data: CategoryGroup[]) => {
        if (cancelled) return;
        const items = Array.isArray(data)
          ? data.flatMap((group) => Array.isArray(group.items) ? group.items : [])
          : [];
        setCategories(items);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMasters({ category: slug, city, q })
      .then((data) => !cancelled && setMasters(Array.isArray(data) ? data : []))
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [slug, city, q]);

  const updateFilters = (next: { slug?: string; city?: string; q?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    ["slug", "city", "q"].forEach((key) => {
      const value = next[key as keyof typeof next];
      if (typeof value === "string") {
        value.trim() ? params.set(key, value.trim()) : params.delete(key);
      }
    });

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <section>
      <h1 className="h1">Каталог мастеров</h1>
      <p className="lead">Выберите мастера и свяжитесь с ним в 1 клик.</p>

      <form className="filters" onSubmit={(e) => e.preventDefault()}>

        <div className="filterSelectWrapper">
          <select
            className="filterSelect"
            value={slug}
            onChange={(e) => updateFilters({ slug: e.target.value })}
          >
            <option value="">Выберите категорию</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <input
          value={city}
          onChange={(e) => updateFilters({ city: e.target.value })}
          placeholder="Город"
        />

        <input
          value={q}
          onChange={(e) => updateFilters({ q: e.target.value })}
          placeholder="Имя мастера"
        />

        <button type="button" className="btn btnGhost" onClick={() => router.replace(pathname)}>
          Сбросить
        </button>
      </form>

      {loading ? <p className="muted">Загрузка...</p> : null}
      {error ? <p className="adminError">{error}</p> : null}
      {!loading && !error && masters.length === 0 ? <p className="muted">Ничего не найдено.</p> : null}

      <div className="grid" aria-live="polite">
        {masters.map((master) => (
          <MasterCard key={master.user_id} master={master} backQuery={backQuery} />
        ))}
      </div>
    </section>
  );
}
