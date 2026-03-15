"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyAds, markPaid } from "@/lib/ads-api";
import { authMe, getMyProfile, type MyMasterProfile } from "@/lib/auth-api";

export default function MyAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [profile, setProfile] = useState<MyMasterProfile | null>(null);

  const loadAds = () =>
    getMyAds()
      .then(setAds)
      .catch((e) => setError(e.message));

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const me = await authMe();
        if (!active) return;

        if (!me) {
          setAuthorized(false);
          return;
        }

        setAuthorized(true);

        const currentProfile = await getMyProfile();
        if (!active) return;

        setProfile(currentProfile);

        if (!currentProfile || currentProfile.status !== "approved") {
          return;
        }

        await loadAds();
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Ошибка загрузки");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="card">
        <h1 className="h1">Мои объявления</h1>
        <p className="muted">Загрузка...</p>
      </section>
    );
  }

  if (!authorized) {
    return (
      <section className="card">
        <h1 className="h1">Мои объявления</h1>
        <p className="adminError">Нужно войти в аккаунт.</p>
        <p>
          <Link className="btn btnPrimary" href="/login">
            Войти
          </Link>
        </p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="card">
        <h1 className="h1">Мои объявления</h1>
        <p className="adminError">Сначала заполните профиль мастера.</p>
        <p>
          <Link className="btn btnPrimary" href="/profile">
            Перейти в профиль
          </Link>
        </p>
      </section>
    );
  }

  if (profile.status !== "approved") {
    return (
      <section className="card">
        <h1 className="h1">Мои объявления</h1>
        <p className="adminError">
          {profile.status === "pending"
            ? "Профиль мастера на модерации. После одобрения можно создавать объявления."
            : `Профиль отклонён. ${profile.rejection_reason ?? "Исправьте данные и отправьте снова."}`}
        </p>
        <p>
          <Link className="btn btnPrimary" href="/profile">
            Исправить профиль
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="card">
      <h1 className="h1">Мои объявления</h1>
      <p>
        <Link className="btn btnPrimary" href="/account/ads/new">
          + Создать объявление
        </Link>
      </p>
      {ads.map((ad) => (
        <article key={ad.id} className="adminItem">
          <strong>{ad.title}</strong>
          <p className="muted">
            {ad.type} · {ad.status} · {new Date(ad.created_at).toLocaleDateString()}
          </p>
          {ad.expires_at ? <p>До: {new Date(ad.expires_at).toLocaleDateString()}</p> : null}
          {ad.rejection_reason ? <p className="adminError">Причина: {ad.rejection_reason}</p> : null}
          <div className="adminActions">
            {ad.status === "approved" ? (
              <Link className="btn btnPrimary" href={`/account/ads/${ad.id}/tariff`}>
                Выбрать тариф
              </Link>
            ) : null}
            {ad.has_pending_payment ? (
              <Link className="btn btnSecondary" href={`/account/ads/${ad.id}/payment`}>
                Перейти к оплате
              </Link>
            ) : null}
            {ad.last_payment_id ? (
              <button
                className="btn btnGhost"
                onClick={() => markPaid(ad.last_payment_id, "Оплатил, проверьте пожалуйста").then(loadAds)}
              >
                Я оплатил
              </button>
            ) : null}
          </div>
        </article>
      ))}
      {!ads.length ? <p className="muted">Объявлений пока нет.</p> : null}
      {error ? <p className="adminError">{error}</p> : null}
    </section>
  );
}
