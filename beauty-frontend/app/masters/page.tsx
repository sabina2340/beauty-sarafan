import { Suspense } from 'react';
import type { Metadata } from 'next';
import { MastersCatalogClient } from '@/components/masters-catalog-client';

export const metadata: Metadata = {
  title: 'Каталог мастеров | Beauty Sarafan',
  description: 'Подбор бьюти-мастеров по направлению, городу и ключевым словам.'
};

export default function MastersPage() {
  return (
    <>
      <section className="page-header">
        <h1>Каталог мастеров</h1>
        <p>Используйте фильтры для быстрого поиска подходящего специалиста.</p>
      </section>
      <Suspense fallback={<p>Загружаем каталог...</p>}>
        <MastersCatalogClient />
      </Suspense>
    </>
  );
}
