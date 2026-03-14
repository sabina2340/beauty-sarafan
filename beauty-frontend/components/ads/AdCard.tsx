import Link from "next/link";
import { ActiveAdCard } from "@/lib/ads-api";

export function AdCard({ ad }: { ad: ActiveAdCard }) {
  return (
    <article className="adCard">
      <img src={ad.image_url || "/logo-placeholder.png"} alt={ad.title} className="adCardImg" />
      <h3 className="adCardTitle">{ad.title}</h3>
      <p className="muted">{ad.city || "Город не указан"} · {ad.type}</p>
      <p className="adCardDesc">{ad.description?.slice(0, 110) || "Описание добавляется"}</p>
      <Link href={`/masters?q=${encodeURIComponent(ad.title)}`} className="btn btnSecondary">Подробнее</Link>
    </article>
  );
}
