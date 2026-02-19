import type { Metadata } from "next";
import { MastersCatalogClient } from "@/components/MastersCatalogClient";

export const metadata: Metadata = {
  title: "Каталог мастеров — Beauty Sarafan",
  description: "Поиск мастеров по категории, городу и имени.",
};

export default function MastersPage() {
  return <MastersCatalogClient />;
}
