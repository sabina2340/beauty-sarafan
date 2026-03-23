import { getActiveAds } from "@/lib/ads-api";
import { AdCard } from "@/components/ads/AdCard";
import Link from "next/link";

export async function HotOffersCarousel() {
  const ads = await getActiveAds(8).catch(() => []);
  const items = Array.isArray(ads) ? ads : [];

  return (
    <section className="card">
      <div className="sarafanFindsHeader">
        <div>
          <h2 className="h2">Сарафанные находки</h2>
          <p className="muted sarafanFindsSubtitle">Проверенные акции</p>
        </div>
        <div className="sarafanFindsActions">
          <Link href="/hot-offers" className="btn btnSecondary">Найти горячие предложения</Link>
          <Link href="/account/ads" className="btn btnPrimary">Разместить горячее предложение (платно)</Link>
        </div>
      </div>
      {items.length > 0 ? (
        <div className="adsCarousel">
          {items.map((ad) => <AdCard key={ad.id} ad={ad} />)}
        </div>
      ) : (
        <p className="muted">Пока нет активных сарафанных находок.</p>
      )}
    </section>
  );
}
