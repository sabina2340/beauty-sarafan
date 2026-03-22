"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyAds, getTariffs, type MyAdItem, type Tariff } from "@/lib/ads-api";
import { authMe, getMyProfile, type MyMasterProfile } from "@/lib/auth-api";
import { adTypeLabel, moderationStatusLabel, readableApiError } from "@/lib/labels";

export default function MyAdsPage() {
  const [ads, setAds] = useState<MyAdItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [profile, setProfile] = useState<MyMasterProfile | null>(null);
  const [adsAccessBlocked, setAdsAccessBlocked] = useState(false);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);

  const loadAds = async () => {
    const items = await getMyAds();
    setAds(items);
  };

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

        const currentProfilePromise = getMyProfile().catch(() => null);
        const tariffsPromise = getTariffs().catch(() => []);

        try {
          await loadAds();
          if (!active) return;
          setAdsAccessBlocked(false);
        } catch (e) {
          if (!active) return;
          setAdsAccessBlocked(true);
          setError(readableApiError(e instanceof Error ? e.message : "Ошибка загрузки"));
        }

        const currentProfile = await currentProfilePromise;
        const tariffsData = await tariffsPromise;
        if (!active) return;
        setProfile(currentProfile);
        setTariffs(Array.isArray(tariffsData) ? tariffsData : []);
      } finally {
        if (active) setLoading(false);
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

  if (adsAccessBlocked) {
    return (
      <section className="card">
        <h1 className="h1">Мои объявления</h1>
        <div className="noticeBox noticeDanger">
          <strong>Раздел объявлений временно недоступен</strong>
          <p>{error || "Чтобы работать с объявлениями, профиль мастера должен быть заполнен и сохранён."}</p>
        </div>
        <p>
          <Link className="btn btnPrimary" href="/profile">
            Перейти в профиль
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="card">
      <h1 className="h1">Мои объявления</h1>
      {profile && profile.status !== "approved" ? (
        <p className="muted">
          Статус профиля: {profile.status === "pending" ? "активируется" : "требует исправлений"}. Если объявления уже доступны,
          значит профиль в системе уже активен и статус скоро синхронизируется.
        </p>
      ) : null}
      <p>
        <Link className="btn btnPrimary" href="/account/ads/new">
          + Создать объявление
        </Link>
      </p>
      {ads.map((ad) => (
        <article key={ad.id} className="adminItem">
          {(() => {
            const selectedTariff = tariffs.find((t) => String(t.id ?? t.ID ?? "") === String(ad.tariff_id ?? ""));
            const tariffPrice = selectedTariff ? (selectedTariff.price ?? selectedTariff.Price) : null;
            const tariffName = selectedTariff ? (selectedTariff.name ?? selectedTariff.Name) : null;
            return (
              <>
          <strong>{ad.title}</strong>
          <p className="muted">
            {adTypeLabel(ad.type)} · {moderationStatusLabel(ad.status)} · {new Date(ad.created_at || Date.now()).toLocaleDateString()}
          </p>
          {tariffName ? <p className="muted">Тариф: {tariffName}</p> : null}
          {tariffPrice ? <p><strong>Стоимость:</strong> {tariffPrice} ₽</p> : <p className="muted">Стоимость: не выбрана</p>}
          {ad.expires_at ? <p>До: {new Date(ad.expires_at).toLocaleDateString()}</p> : null}
          {ad.rejection_reason ? <div className="noticeBox noticeDanger"><strong>Причина отклонения</strong><p>{ad.rejection_reason}</p></div> : null}
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
          </div>
              </>
            );
          })()}
        </article>
      ))}
      {!ads.length ? <p className="muted">Объявлений пока нет.</p> : null}
      {error ? <div className="noticeBox noticeDanger"><p>{error}</p></div> : null}
    </section>
  );
}
