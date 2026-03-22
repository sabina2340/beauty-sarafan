import { getActiveAds } from "@/lib/ads-api";
import { AdCard } from "@/components/ads/AdCard";

export default async function HotOffersPage() {
  const adsRaw = await getActiveAds(50).catch(() => []);
  const ads = Array.isArray(adsRaw) ? adsRaw : [];

  return (
    <section>
      <h1 className="h1">Горячие предложения</h1>

      {!ads.length ? (
        <p className="muted">Нет объявлений.</p>
      ) : (
        <div className="grid">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </section>
  );
}
