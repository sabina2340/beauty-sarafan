"use client";

import { PaymentPayload, getAdPayment, getPaymentStatus } from "@/lib/ads-api";
import { useEffect, useMemo, useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  created: "Ожидает оплаты",
  processing: "Платёж обрабатывается",
  paid: "Оплачено",
  failed: "Оплата не прошла",
  expired: "Срок оплаты истёк",
  refunded: "Платёж возвращён",
};

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
  const isFinalStatus = FINAL_STATUSES.has(paymentStatus);
  const statusLabel = STATUS_LABELS[paymentStatus] ?? paymentStatus;

  useEffect(() => {
    if (!paymentId || isFinalStatus) {
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
  }, [isFinalStatus, paymentId, paymentStatus]);

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
        Статус оплаты: <strong>{statusLabel}</strong>
      </p>
      <p>
        Статус банка: <strong>{bankStatus}</strong>
      </p>
      {paymentUrl && !isFinalStatus ? (
        <a className="btn btnPrimary" href={paymentUrl} target="_blank" rel="noreferrer">
          Перейти к оплате
        </a>
      ) : null}
      {paymentStatus === "paid" ? (
        <p className="adminOk">Оплата прошла успешно. Объявление активировано.</p>
      ) : paymentStatus === "failed" ? (
        <p className="adminError">Банк отклонил платёж. Попробуйте создать новый платёж.</p>
      ) : paymentStatus === "expired" ? (
        <p className="adminError">Срок действия ссылки на оплату истёк. Создайте новый платёж.</p>
      ) : paymentStatus === "refunded" ? (
        <p className="adminError">Платёж был возвращён.</p>
      ) : (
        <p className="muted">
          Мы автоматически проверяем статус оплаты. После подтверждения банком объявление активируется без ручного подтверждения.
        </p>
      )}
      {paidAt ? <p className="muted">Оплачено: {new Date(paidAt).toLocaleString("ru-RU")}</p> : null}
      {readValue(data?.advertisement?.expires_at, data?.advertisement?.ExpiresAt) ? (
        <p className="muted">Размещение активно до: {new Date(readValue(data?.advertisement?.expires_at, data?.advertisement?.ExpiresAt) as string).toLocaleString("ru-RU")}</p>
      ) : null}
      {expiresAt ? <p className="muted">Ссылка действует до: {new Date(expiresAt).toLocaleString("ru-RU")}</p> : null}
      {error ? <p className="adminError">{error}</p> : null}
    </section>
  );
}
