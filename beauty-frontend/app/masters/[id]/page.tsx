import type { Metadata } from "next";
import Link from "next/link";
import { getMasterAds, getMasterById } from "@/lib/api";

type Props = {
  params: { id: string };
  searchParams: { back?: string };
};

function splitServices(services?: string) {
  if (!services) return [];
  return services.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const master = await getMasterById(params.id);
    return { title: `${master.full_name || "Мастер"} · Сарафан` };
  } catch {
    return { title: "Мастер не найден · Сарафан" };
  }
}

export default async function MasterDetailPage({ params, searchParams }: Props) {
  const backHref = `/masters${searchParams.back ? `?${searchParams.back}` : ""}`;

  try {
    const master = await getMasterById(params.id);
    const adsResponse = await getMasterAds(params.id).catch(() => []);
    const ads = Array.isArray(adsResponse) ? adsResponse : [];
    const services = splitServices(master.services);

    return (
      <section className="masterPage">
        <Link href={backHref} className="btn btnGhost">← Назад к каталогу</Link>

        <article className="card masterHeroCard">
          <div className="masterTop">
            <img src={master.avatar_url || "/logo-placeholder.svg"} alt={master.full_name || "Мастер"} className="masterAvatar" />
            <div className="masterHeadInfo">
              <h1>{master.full_name || master.login}</h1>
              <div className="badgeRow">
                <span className="badge badgeBlue">{master.category_name || "Категория"}</span>
                <span className="badge badgeGreen">✓ Проверен</span>
              </div>
              <p className="meta">📍 г. {master.city || "Не указан"}</p>
              <div className="actionRow">
                <a className="btn btnPrimary" href={`tel:${master.phone || ""}`}>📞 Позвонить</a>
                <a className="btn btnSecondary" href={master.social_links || "#"}>✈ Написать</a>
              </div>
            </div>
          </div>

          <div className="divider" />
          <h2>О мастере</h2>
          <p>{master.description || "Описание пока не добавлено"}</p>

          {services.length > 0 ? (
            <div className="servicesChips">
              {services.map((service) => <span key={service} className="serviceChip">{service}</span>)}
            </div>
          ) : null}

          <div className="divider" />
          <h2>Контакты</h2>
          <p>📞 {master.phone || "не указан"}</p>
          <p>🔗 {master.social_links || "соцсети не указаны"}</p>

          <div className="divider" />
          <h2>Галерея работ</h2>
          {master.work_images && master.work_images.length > 0 ? (
            <div className="workGrid">
              {master.work_images.map((imageUrl) => (
                <a key={imageUrl} href={imageUrl} target="_blank">
                  <img src={imageUrl} alt="Пример работы" />
                </a>
              ))}
            </div>
          ) : <p>Примеры работ пока не загружены</p>}

          <div className="ctaRow" style={{ marginTop: 20 }}>
            <button type="button" className="btn btnPrimary">Записаться</button>
          </div>
        </article>

        {ads.length > 0 ? (
          <article className="card">
            <h2>Объявления мастера</h2>
            <ul className="adsList">
              {ads.map((ad) => (
                <li key={ad.id}>
                  <strong>{ad.title}</strong>
                  <p className="muted">{ad.description}</p>
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </section>
    );
  } catch {
    return <p className="state stateError">Мастер не найден</p>;
  }
}
