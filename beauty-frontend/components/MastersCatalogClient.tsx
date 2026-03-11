"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getMasters } from "@/lib/api";
import { MasterCard as Master } from "@/lib/types";
import { MasterCard } from "@/components/MasterCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
      .then((data) => !cancelled && setMasters(Array.isArray(data) ? data : []))
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [slug, city, q]);

  const updateFilters = (next: { slug?: string; city?: string; q?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    ["slug", "city", "q"].forEach((key) => {
      const value = next[key as keyof typeof next];
      if (typeof value === "string") value.trim() ? params.set(key, value.trim()) : params.delete(key);
    });
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <section>
      <h1 className="h1">Каталог мастеров</h1>
      <p className="lead">Выберите специалиста и откройте подробный профиль.</p>

      <form className="filters" onSubmit={(e) => e.preventDefault()}>
        <Input value={slug} onChange={(e) => updateFilters({ slug: e.target.value })} placeholder="Категория (slug)" />
        <Input value={city} onChange={(e) => updateFilters({ city: e.target.value })} placeholder="Город" />
        <Input value={q} onChange={(e) => updateFilters({ q: e.target.value })} placeholder="Имя мастера" />
        <Button type="button" variant="secondary" onClick={() => router.replace(pathname)}>Сбросить фильтры</Button>
      </form>

      {loading ? <p className="muted">Загрузка...</p> : null}
      {error ? <p className="adminError">{error}</p> : null}
      {!loading && !error && masters.length === 0 ? <p className="muted">Ничего не найдено.</p> : null}

      <div className="grid" aria-live="polite">
        {masters.map((master) => <MasterCard key={master.user_id} master={master} backQuery={backQuery} />)}
      </div>
    </section>
  );
}
