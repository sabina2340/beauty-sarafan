"use client";

import { getAdPayment, markPaid } from "@/lib/ads-api";
import { useEffect, useMemo, useState } from "react";

type PaymentPayload = {
  advertisement?: { id?: number; ID?: number; title?: string; Title?: string };
  payment?: { id?: number; ID?: number; amount?: number; Amount?: number };
  tariff?: { Name?: string; name?: string };
  qr_url?: string;
};

export default function PaymentPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<PaymentPayload | null>(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    getAdPayment(Number(params.id))
      .then((payload) => setData(payload))
      .catch((e) => setError(e.message));
  }, [params.id]);

  const paymentId = useMemo(() => Number(data?.payment?.id ?? data?.payment?.ID ?? 0), [data]);
  const adTitle = data?.advertisement?.title ?? data?.advertisement?.Title ?? "Объявление";
  const tariffName = data?.tariff?.Name ?? data?.tariff?.name ?? "Тариф";
  const paymentAmount = data?.payment?.amount ?? data?.payment?.Amount ?? 0;

  const onMarkPaid = async () => {
    if (!paymentId) {
      setError("Не найден id платежа. Обновите страницу.");
      return;
    }

    try {
      const res = await markPaid(paymentId, comment.trim());
      setError("");
      setMessage(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  if (!data) {
    return (
      <section className="card">
        <p className="muted">Загрузка...</p>
        {error ? <p className="adminError">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="card authCard">
      <h1 className="h1">Оплата</h1>
      <p>
        <strong>{adTitle}</strong>
      </p>
      <p>
        Тариф: {tariffName} · {paymentAmount} ₽
      </p>
      <img src={data.qr_url} alt="QR для оплаты" width={240} height={240} />
      <p className="muted">Отсканируйте QR и оплатите. После оплаты нажмите кнопку ниже.</p>
      <textarea
        className="textarea"
        placeholder="Комментарий к платежу"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button className="btn btnPrimary" onClick={onMarkPaid}>
        Я оплатил
      </button>
      {message ? <p className="adminOk">{message}</p> : null}
      {error ? <p className="adminError">{error}</p> : null}
    </section>
  );
}
