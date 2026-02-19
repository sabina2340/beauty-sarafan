import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Beauty Sarafan — Найти мастера",
  description: "Публичная витрина мастеров: ищите по городу и категории.",
  openGraph: {
    title: "Beauty Sarafan — Найти мастера",
    description: "Откройте каталог мастеров и выберите подходящего специалиста.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <section className="hero">
      <h1>Найдите мастера красоты рядом с вами</h1>
      <p>
        Удобный каталог мастеров с фильтрами по категории и городу. Без регистрации для клиентов.
      </p>
      <Link href="/masters" className="btnPrimary">
        Найти мастера
      </Link>
    </section>
  );
}
