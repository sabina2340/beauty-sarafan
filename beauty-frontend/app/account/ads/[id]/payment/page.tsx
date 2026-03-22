"use client";

import { checkPaymentStatus, getAdPayment, markPaid } from "@/lib/ads-api";
import { useEffect, useMemo, useState } from "react";

type PaymentPayload = {
  advertisement?: { id?: number; ID?: number; title?: string; Title?: string };
  payment?: {
    id?: number;
    ID?: number;
    amount?: number;
    Amount?: number;
    provider_payment_link?: string;
    ProviderPaymentLink?: string;
    provider_operation_id?: string;
    ProviderOperationID?: string;
    provider_status?: string;
    ProviderStatus?: string;
    status?: string;
    Status?: string;
  };
  tariff?: { Name?: string; name?: string };
  payment_link?: string;
  operation_id?: string;
  current_status?: string;
  is_paid?: boolean;
};

export default function PaymentPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<PaymentPayload | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState<"check" | "mark" | null>(null);

  const loadPayment = async () => {
    setError("");
    const payload = await getAdPayment(Number(params.id));
    setData(payload);
    return payload;
  };

  useEffect(() => {
    loadPayment().catch((e) => setError(e.message));
  }, [params.id]);

  const paymentId = useMemo(() => Number(data?.payment?.id ?? data?.payment?.ID ?? 0), [data]);
  const adTitle = data?.advertisement?.title ?? data?.advertisement?.Title ?? "Объявление";
  const tariffName = data?.tariff?.Name ?? data?.tariff?.name ?? "Тариф";
  const paymentAmount = data?.payment?.amount ?? data?.payment?.Amount ?? 0;
  const paymentLink =
    data?.payment_link ??
    data?.payment?.provider_payment_link ??
    data?.payment?.ProviderPaymentLink ??
    "";
  const operationId =
    data?.operation_id ??
    data?.payment?.provider_operation_id ??
    data?.payment?.ProviderOperationID ??
    "";
  const currentStatus =
    data?.current_status ??
    data?.payment?.provider_status ??
    data?.payment?.ProviderStatus ??
    data?.payment?.status ??
    data?.payment?.Status ??
    "pending";
  const isPaid = Boolean(data?.is_paid);

  const runCheck = async (mode: "check" | "mark") => {
    if (!paymentId) {
      setError("Не найден номер платежа. Обновите страницу.");
      return;
    }

    try {
      setLoadingAction(mode);
      setError("");
      setMessage("");
      const res = mode === "mark" ? await markPaid(paymentId, "") : await checkPaymentStatus(paymentId);
      setMessage(res.message || "Статус оплаты обновлен");
      await loadPayment();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoadingAction(null);
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
      <p className="muted">Статус: {isPaid ? "confirmed" : currentStatus}</p>
      {operationId ? <p className="muted">Operation ID: {operationId}</p> : null}
      {paymentLink ? (
        <a
          className="btn btnPrimary"
          href={paymentLink}
          target="_blank"
          rel="noreferrer"
        >
          Перейти к оплате
        </a>
      ) : (
        <p className="adminError">Ссылка на оплату пока недоступна.</p>
      )}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          className="btn btnPrimary"
          onClick={() => runCheck("check")}
          disabled={loadingAction !== null}
        >
          {loadingAction === "check" ? "Проверяем..." : "Проверить оплату"}
        </button>
        <button
          className="btn"
          onClick={() => runCheck("mark")}
          disabled={loadingAction !== null}
        >
          {loadingAction === "mark" ? "Проверяем..." : "Я оплатил"}
        </button>
      </div>
      <p className="muted">
        После оплаты вернитесь на эту страницу и нажмите кнопку проверки статуса.
      </p>
      {message ? <p className="adminOk">{message}</p> : null}
      {error ? <p className="adminError">{error}</p> : null}
    </section>
  );
}
