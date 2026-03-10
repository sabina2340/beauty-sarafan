"use client";

import { getAdPayment, markPaid } from "@/lib/ads-api";
import { useEffect, useState } from "react";

export default function PaymentPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getAdPayment(Number(params.id)).then(setData).catch((e) => setError(e.message));
  }, [params.id]);

  const onMarkPaid = async () => {
    try {
      const res = await markPaid(data.payment.id, comment);
      setMessage(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  if (!data) return <section className="card"><p className="muted">Загрузка...</p>{error ? <p className="adminError">{error}</p> : null}</section>;

  return (
    <section className="card authCard">
      <h1 className="h1">Оплата</h1>
      <p><strong>{data.advertisement.title}</strong></p>
      <p>Тариф: {data.tariff.Name} · {data.payment.amount} ₽</p>
      <img src={data.qr_url} alt="QR для оплаты" width={240} height={240} />
      <p className="muted">Отсканируйте QR и оплатите. После оплаты нажмите кнопку ниже.</p>
      <textarea className="textarea" placeholder="Комментарий к платежу" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn btnPrimary" onClick={onMarkPaid}>Я оплатил</button>
      {message ? <p className="adminOk">{message}</p> : null}
      {error ? <p className="adminError">{error}</p> : null}
    </section>
  );
}
