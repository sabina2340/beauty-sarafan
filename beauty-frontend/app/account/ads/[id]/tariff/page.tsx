"use client";

import { getTariffs, selectTariff } from "@/lib/ads-api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TariffPage({ params }: { params: { id: string } }) {
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    getTariffs().then(setTariffs).catch((e) => setError(e.message));
  }, []);

  return (
    <section className="card">
      <h1 className="h1">Выбор тарифа</h1>
      {tariffs.map((t, i) => {
        const id = t.id ?? t.ID;
        const name = t.name ?? t.Name;
        const description = t.description;
        const price = t.price ?? t.Price;
        const days = t.duration_days ?? t.DurationDays;
        const isSubmitting = submittingId === Number(id);
        return (
          <article key={id ?? i} className="adminItem">
            <strong>{name}</strong>
            {description ? <p className="muted">{description}</p> : null}
            <p>
              {price} ₽ · {days} дней
            </p>
            <button
              className="btn btnPrimary"
              disabled={isSubmitting}
              onClick={async () => {
                try {
                  setError("");
                  setSubmittingId(Number(id));
                  const res = await selectTariff(Number(params.id), Number(id));
                  router.push(
                    `${res.redirect}?payment_id=${res.payment_id}`,
                  );
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Ошибка оплаты");
                } finally {
                  setSubmittingId(null);
                }
              }}
            >
              {isSubmitting ? "Создаем платеж..." : "Выбрать"}
            </button>
          </article>
        );
      })}
      {error ? <p className="adminError">{error}</p> : null}
    </section>
  );
}
