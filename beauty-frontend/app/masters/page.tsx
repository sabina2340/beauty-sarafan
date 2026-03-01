import Link from "next/link";

type MasterCard = {
  user_id: number;
  login: string;
  full_name: string;
  description: string;
  services: string;
  phone: string;
  city: string;
  social_links: string;
  category_id: number;
  category_name: string;
  category_slug: string;
};

async function getMasters(params: { slug?: string; city?: string; q?: string }) {
  const qs = new URLSearchParams();
  if (params.slug) qs.set("slug", params.slug);
  if (params.city) qs.set("city", params.city);
  if (params.q) qs.set("q", params.q);

  const url = `http://localhost:8080/masters${qs.toString() ? `?${qs.toString()}` : ""}`;

  const res = await fetch(url, { cache: "no-store" });

  // если бэк вернул ошибку — покажем пустой список, а не упадём
  if (!res.ok) {
    console.error("Failed to load masters:", res.status, await res.text());
    return [];
  }

  const data = await res.json().catch(() => []);

  // защита: если вдруг пришёл не массив
  return Array.isArray(data) ? (data as MasterCard[]) : [];
}

export default async function MastersPage({
                                            searchParams,
                                          }: {
  searchParams: { slug?: string; city?: string; q?: string };
}) {
  const masters = await getMasters({
    slug: searchParams.slug,
    city: searchParams.city,
    q: searchParams.q,
  });

  return (
      <main className="page">
        <section className="card">
          <h1 className="h1">Мастера</h1>

          {searchParams.slug && (
              <p className="muted" style={{ marginTop: 8 }}>
                Категория: <b>{searchParams.slug}</b>
              </p>
          )}

          {masters.length === 0 ? (
              <p className="muted" style={{ marginTop: 14 }}>
                По выбранной категории мастеров пока нет (или сервер вернул пустой ответ).
              </p>
          ) : (
              <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                {masters.map((m) => (
                    <Link key={m.user_id} href={`/masters/${m.user_id}`} className="listItem">
                      <div className="listItemTop">
                        <div>
                          <div className="listTitle">{m.full_name}</div>
                          <div className="muted">
                            {m.city} • {m.category_name}
                          </div>
                        </div>
                        <span className="chev">›</span>
                      </div>

                      {m.services ? (
                          <div className="muted" style={{ marginTop: 6 }}>
                            {m.services}
                          </div>
                      ) : null}
                    </Link>
                ))}
              </div>
          )}

          <div style={{ marginTop: 14 }}>
            <Link href="/" className="btn btnGhost" style={{ width: "100%" }}>
              ← На главную
            </Link>
          </div>
        </section>
      </main>
  );
}
