import type { Metadata } from 'next';
import Link from 'next/link';
import { getMasterAds, getMasterById } from '@/lib/api';

interface MasterPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: MasterPageProps): Promise<Metadata> {
  try {
    const master = await getMasterById(params.id);
    return {
      title: `${master.name} | Beauty Sarafan`,
      description: master.shortDescription,
      openGraph: {
        title: `${master.name} — мастер в ${master.city}`,
        description: master.shortDescription,
        type: 'profile'
      }
    };
  } catch {
    return {
      title: 'Мастер не найден | Beauty Sarafan',
      description: 'Запрошенный мастер не найден.'
    };
  }
}

export default async function MasterPage({ params, searchParams }: MasterPageProps) {
  const master = await getMasterById(params.id);
  const ads = await getMasterAds(params.id);
  const backParams = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => backParams.append(key, v));
    } else {
      backParams.set(key, value);
    }
  }

  return (
    <article className="master-detail">
      <Link href={`/masters${backParams.toString() ? `?${backParams.toString()}` : ''}`} className="secondary-btn">
        ← Назад к каталогу
      </Link>

      <h1>{master.name}</h1>
      <p className="chip">{master.categoryLabel}</p>
      <p className="muted">📍 {master.city}</p>

      <section>
        <h2>Описание мастера</h2>
        <p>{master.description}</p>
      </section>

      <section>
        <h2>Услуги</h2>
        <ul>
          {master.services.map((service) => (
            <li key={service}>{service}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Контакты</h2>
        <ul>
          <li>Телефон: {master.contacts.phone}</li>
          {master.contacts.telegram && <li>Telegram: {master.contacts.telegram}</li>}
          {master.contacts.instagram && <li>Instagram: {master.contacts.instagram}</li>}
        </ul>
      </section>

      {ads.length > 0 && (
        <section>
          <h2>Объявления</h2>
          <ul>
            {ads.map((ad) => (
              <li key={ad}>{ad}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
