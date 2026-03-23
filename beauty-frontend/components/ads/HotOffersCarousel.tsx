import { getActiveAds } from "@/lib/ads-api";
import { AdCard } from "@/components/ads/AdCard";

export async function HotOffersCarousel() {
  const ads = await getActiveAds(8).catch(() => []);
  const items = Array.isArray(ads) ? ads : [];

  return (
    <section className="card">
      <div className="sarafanFindsHeader sarafanFindsHeaderCompact">
        <div>
          <h2 className="h2">Сарафанные находки</h2>
          <p className="muted sarafanFindsSubtitle">Проверенные акции и предложения, которые уже активны и доступны для показа.</p>
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
