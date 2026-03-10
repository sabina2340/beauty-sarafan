import { Suspense } from "react";
import { MastersCatalogClient } from "@/components/MastersCatalogClient";
import { HotOffersCarousel } from "@/components/ads/HotOffersCarousel";

export default function MastersPage() {
  return (
    <>
      <Suspense fallback={<p className="muted">Загрузка каталога...</p>}>
        <MastersCatalogClient />
      </Suspense>
      <HotOffersCarousel />
    </>
  );
}
