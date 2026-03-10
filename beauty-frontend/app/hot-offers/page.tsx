import { AdCard } from "@/components/ads/AdCard";
import { getHotOffers } from "@/lib/ads-api";

export default async function HotOffersPage() {
  const ads = await getHotOffers().catch(() => []);

  return (
    <section className="grid">
      <h1 className="h1" style={{ gridColumn: "1/-1" }}>Горячие предложения</h1>
      {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
      {!ads.length ? <p className="muted" style={{ gridColumn: "1/-1" }}>Пока активных предложений нет.</p> : null}
    </section>
  );
}
