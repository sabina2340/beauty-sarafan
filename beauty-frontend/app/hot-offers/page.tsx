import Link from "next/link";
import { AdCard } from "@/components/ads/AdCard";
import { getHotOffers } from "@/lib/ads-api";

export default async function HotOffersPage() {
  const ads = await getHotOffers().catch(() => []);

  return (
    <section className="grid">
      <div style={{ gridColumn: "1/-1" }} className="sarafanFindsHeader">
        <div>
          <h1 className="h1">Сарафанные находки</h1>
          <p className="muted sarafanFindsSubtitle">Проверенные акции</p>
        </div>
        <div className="sarafanFindsActions">
          <Link href="/hot-offers" className="btn btnSecondary">Найти горячие предложения</Link>
          <Link href="/account/ads" className="btn btnPrimary">Разместить горячее предложение (платно)</Link>
        </div>
      </div>
      {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
      {!ads.length ? <p className="muted" style={{ gridColumn: "1/-1" }}>Пока активных предложений нет.</p> : null}
    </section>
  );
}
