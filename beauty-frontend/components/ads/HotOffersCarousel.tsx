import { getActiveAds } from "@/lib/ads-api";
import { AdCard } from "@/components/ads/AdCard";
import Link from "next/link";
import { SarafanFindsPopup } from "./SarafanFindsPopup";

export async function HotOffersCarousel() {
  const ads = await getActiveAds(8).catch(() => []);
  if (!ads.length) return null;

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
      <div className="adsCarousel">
        {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
      </div>
      <SarafanFindsPopup />
    </section>
  );
}
