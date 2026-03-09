import { Suspense } from "react";
import { MastersCatalogClient } from "@/components/MastersCatalogClient";

export default function MastersPage() {
  return (
    <Suspense fallback={<p className="muted">Загрузка каталога...</p>}>
      <MastersCatalogClient />
    </Suspense>
  );
}
