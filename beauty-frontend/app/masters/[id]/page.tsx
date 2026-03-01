import type { Metadata } from "next";
import Link from "next/link";
import { getMasterAds, getMasterById } from "@/lib/api";

type Props = {
  params: { id: string };
  searchParams: { back?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const master = await getMasterById(params.id);
    const title = `${master.full_name || master.login} — мастер`;
    const description = master.description || "Карточка мастера в Beauty Sarafan";

    return {
      title,
      description,
      openGraph: { title, description, type: "profile" },
    };
  } catch {
    return {
      title: "Мастер не найден",
      description: "Карточка мастера в Beauty Sarafan",
    };
  }
}

export default async function MasterDetailPage({ params, searchParams }: Props) {
  const back = searchParams.back || "";
  const backHref = `/masters${back ? `?${back}` : ""}`;

  try {
    const master = await getMasterById(params.id);
    const ads = await getMasterAds(params.id).catch(() => []);

    return (
      <section>
        <Link href={backHref} className="backLink">
          ← Назад к каталогу
        </Link>
        <h1>{master.full_name || master.login}</h1>
        <p className="meta">{master.category_name || "Категория не указана"}</p>
        <p className="meta">{master.city || "Город не указан"}</p>

        <h2>Описание</h2>
        <p>{master.description || "Описание отсутствует"}</p>

        <h2>Услуги</h2>
        <p>{master.services || "Список услуг пока не добавлен"}</p>

        <h2>Контакты</h2>
        <p>Телефон: {master.phone || "не указан"}</p>
        <p>Соцсети: {master.social_links || "не указаны"}</p>

        <h2>Объявления мастера</h2>
        {ads.length === 0 ? (
          <p className="state stateEmpty">У мастера пока нет опубликованных объявлений.</p>
        ) : (
          <ul className="adsList">
            {ads.map((ad) => (
              <li key={ad.id} className="card">
                <h3>{ad.title}</h3>
                <p className="meta">
                  {ad.type} · {ad.city || "город не указан"}
                </p>
                <p>{ad.description || "Описание отсутствует"}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  } catch {
    return (
      <section>
        <Link href={backHref} className="backLink">
          ← Назад к каталогу
        </Link>
        <h1>Мастер не найден</h1>
        <p className="state stateError">Не удалось загрузить карточку мастера.</p>
      </section>
    );
  }
}
