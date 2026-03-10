"use client";

import { getTariffs, selectTariff } from "@/lib/ads-api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TariffPage({ params }: { params: { id: string } }) {
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    getTariffs().then(setTariffs).catch((e) => setError(e.message));
  }, []);

  return (
    <section className="card">
      <h1 className="h1">Выбор тарифа</h1>
      {tariffs.map((t) => (
        <article key={t.ID} className="adminItem">
          <strong>{t.Name}</strong>
          <p>{t.Price} ₽ · {t.DurationDays} дней</p>
          <button className="btn btnPrimary" onClick={async () => {
            const res = await selectTariff(Number(params.id), t.ID);
            router.push(`/account/ads/${params.id}/payment?payment_id=${res.payment_id}`);
          }}>Выбрать</button>
        </article>
      ))}
      {error ? <p className="adminError">{error}</p> : null}
    </section>
  );
}
