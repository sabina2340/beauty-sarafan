import Link from 'next/link';
import { mockMasters } from '@/lib/mockData';

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>Найдите проверенного бьюти-мастера рядом с вами</h1>
        <p>Каталог специалистов по волосам, ногтям, бровям и другим направлениям.</p>
        <Link href="/masters" className="primary-btn">
          Найти мастера
        </Link>
      </section>

      <section className="popular">
        <h2>Популярные мастера</h2>
        <div className="masters-grid">
          {mockMasters.slice(0, 4).map((master) => (
            <article className="master-card" key={master.id}>
              <h3>{master.name}</h3>
              <p className="chip">{master.categoryLabel}</p>
              <p className="muted">📍 {master.city}</p>
              <Link href={`/masters?category=${master.category}`} className="secondary-btn">
                Смотреть похожих
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
