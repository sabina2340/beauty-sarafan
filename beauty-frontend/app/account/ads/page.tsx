"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyAds, markPaid } from "@/lib/ads-api";

export default function MyAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [error, setError] = useState("");

  const load = () => getMyAds().then(setAds).catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  return (
    <section className="card">
      <h1 className="h1">Мои объявления</h1>
      <p><Link className="btn btnPrimary" href="/account/ads/new">+ Создать объявление</Link></p>
      {ads.map((ad) => (
        <article key={ad.id} className="adminItem">
          <strong>{ad.title}</strong>
          <p className="muted">{ad.type} · {ad.status} · {new Date(ad.created_at).toLocaleDateString()}</p>
          {ad.expires_at ? <p>До: {new Date(ad.expires_at).toLocaleDateString()}</p> : null}
          {ad.rejection_reason ? <p className="adminError">Причина: {ad.rejection_reason}</p> : null}
          <div className="adminActions">
            {ad.status === "approved" ? <Link className="btn btnPrimary" href={`/account/ads/${ad.id}/tariff`}>Выбрать тариф</Link> : null}
            {ad.has_pending_payment ? <Link className="btn btnSecondary" href={`/account/ads/${ad.id}/payment`}>Перейти к оплате</Link> : null}
            {ad.last_payment_id ? <button className="btn btnGhost" onClick={() => markPaid(ad.last_payment_id, "Оплатил, проверьте пожалуйста").then(load)}>Я оплатил</button> : null}
          </div>
        </article>
      ))}
      {!ads.length ? <p className="muted">Объявлений пока нет.</p> : null}
      {error ? <p className="adminError">{error}</p> : null}
    </section>
  );
}
