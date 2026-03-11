import type { Metadata } from "next";
import { getMasterAds, getMasterById } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

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
        <ButtonLink href={backHref} variant="ghost">Назад к каталогу</ButtonLink>

        <Card className="masterHeroCard">
          <div className="masterTop">
            <img src={master.avatar_url || "/logo-placeholder.svg"} alt={master.full_name || "Мастер"} className="masterAvatar" />
            <div className="masterHeadInfo">
              <h1>{master.full_name || master.login}</h1>
              <div className="badgeRow">
                <Badge className="badgeBlue">{master.category_name || "Категория"}</Badge>
                <Badge className="badgeGreen">Проверен</Badge>
              </div>
              <p className="meta">г. {master.city || "Не указан"}</p>
            </div>
          </div>

          <div className="divider" />
          <h2 className="sectionTitle">О мастере</h2>
          <p>{master.description || "Описание пока не добавлено"}</p>

          {services.length > 0 ? (
            <div className="servicesChips">
              {services.map((service) => <span key={service} className="serviceChip">{service}</span>)}
            </div>
          ) : null}

          <div className="divider" />
          <h2 className="sectionTitle">Контакты</h2>
          <p>Телефон: {master.phone || "не указан"}</p>
          <p>Соцсети: {master.social_links || "не указаны"}</p>

          <div className="divider" />
          <h2 className="sectionTitle">Примеры работ</h2>
          {master.work_images && master.work_images.length > 0 ? (
            <div className="workGrid">
              {master.work_images.map((imageUrl) => (
                <a key={imageUrl} href={imageUrl} target="_blank">
                  <img src={imageUrl} alt="Пример работы" />
                </a>
              ))}
            </div>
          ) : <p>Примеры работ пока не загружены</p>}
        </Card>

        {ads.length > 0 ? (
          <Card>
            <h2 className="sectionTitle">Объявления мастера</h2>
            <ul className="adsList">
              {ads.map((ad) => (
                <li key={ad.id}>
                  <strong>{ad.title}</strong>
                  <p className="muted">{ad.description}</p>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </section>
    );
  } catch {
    return <p className="state stateError">Мастер не найден</p>;
  }
}
