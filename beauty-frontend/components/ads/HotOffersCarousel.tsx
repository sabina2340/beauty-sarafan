import { getActiveAds } from "@/lib/ads-api";
import { AdCard } from "@/components/ads/AdCard";

export async function HotOffersCarousel() {
  const ads = await getActiveAds(8).catch(() => []);
  if (!ads.length) return null;

  return (
    <section className="card">
      <h2 className="h2">Горячие предложения</h2>
      <div className="adsCarousel">
        {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
      </div>
    </section>
  );
}
