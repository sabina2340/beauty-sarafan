import Link from 'next/link';
import { Master } from '@/lib/types';

interface MasterCardProps {
  master: Master;
  currentQuery?: string;
}

export function MasterCard({ master, currentQuery }: MasterCardProps) {
  const detailHref = `/masters/${master.id}${currentQuery ? `?${currentQuery}` : ''}`;

  return (
    <article className="master-card">
      <div>
        <h3>{master.name}</h3>
        <p className="chip">{master.categoryLabel}</p>
      </div>
      <p className="muted">📍 {master.city}</p>
      <p>{master.shortDescription}</p>
      <Link href={detailHref} className="secondary-btn" aria-label={`Подробнее о мастере ${master.name}`}>
        Подробнее
      </Link>
    </article>
  );
}
