"use client";

import { PaymentPayload, getAdPayment, getPaymentStatus } from "@/lib/ads-api";
import { useEffect, useMemo, useState } from "react";

const FINAL_STATUSES = new Set(["paid", "failed", "expired", "refunded"]);

function readValue<T>(primary?: T, secondary?: T) {
  return primary ?? secondary;
}

export default function PaymentPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<PaymentPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    getAdPayment(Number(params.id))
      .then((payload) => setData(payload))
      .catch((e) => setError(e.message));
  }, [params.id]);

  const paymentId = useMemo(
    () => Number(readValue(data?.payment?.id, data?.payment?.ID) ?? 0),
    [data],
  );
  const adTitle = readValue(data?.advertisement?.title, data?.advertisement?.Title) ?? "Объявление";
  const tariffName = readValue(data?.tariff?.name, data?.tariff?.Name) ?? "Тариф";
  const paymentAmount = Number(readValue(data?.payment?.amount, data?.payment?.Amount) ?? readValue(data?.tariff?.price, data?.tariff?.Price) ?? 0);
  const paymentStatus = data?.status ?? readValue(data?.payment?.status, data?.payment?.Status) ?? "created";
  const bankStatus = data?.bank_status ?? readValue(data?.payment?.bank_status, data?.payment?.BankStatus) ?? "CREATED";
  const paymentUrl = data?.payment_url ?? readValue(data?.payment?.payment_link, data?.payment?.PaymentLink) ?? "";
  const paidAt = readValue(data?.payment?.paid_at, data?.payment?.PaidAt);
  const expiresAt = readValue(data?.payment?.expires_at, data?.payment?.ExpiresAt);
  const operationId = data?.operation_id ?? readValue(data?.payment?.operation_id, data?.payment?.OperationID) ?? "";

  useEffect(() => {
    if (!paymentId || FINAL_STATUSES.has(paymentStatus)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      getPaymentStatus(paymentId)
        .then((payload) => {
          setData(payload);
          setError("");
        })
        .catch((e) => setError(e.message));
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [paymentId, paymentStatus]);

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
      <p>
        Статус оплаты: <strong>{paymentStatus}</strong>
      </p>
      <p>
        Статус банка: <strong>{bankStatus}</strong>
      </p>
      {operationId ? <p className="muted">Операция Точки: {operationId}</p> : null}
      {paymentUrl && paymentStatus !== "paid" ? (
        <a className="btn btnPrimary" href={paymentUrl} target="_blank" rel="noreferrer">
          Перейти к оплате
        </a>
      ) : null}
      {paymentStatus !== "paid" ? (
        <p className="muted">
          Мы автоматически проверяем статус оплаты. После подтверждения банком объявление активируется без ручного подтверждения.
        </p>
      ) : (
        <p className="adminOk">Оплата прошла успешно. Объявление активировано.</p>
      )}
      {paidAt ? <p className="muted">Оплачено: {new Date(paidAt).toLocaleString("ru-RU")}</p> : null}
      {expiresAt ? <p className="muted">Ссылка действует до: {new Date(expiresAt).toLocaleString("ru-RU")}</p> : null}
      {error ? <p className="adminError">{error}</p> : null}
    </section>
  );
}
