"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  adminPing,
  approveAd,
  approveUser,
  createCategory,
  getAdminAds,
  getAdminMasters,
  rejectAd,
  rejectUser,
  type AdminAd,
  type AdminMaster,
} from "@/lib/admin-api";

type ModerationStatus = "pending" | "approved" | "rejected";

export default function AdminPage() {
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [masterStatus, setMasterStatus] = useState<ModerationStatus>("pending");
  const [masters, setMasters] = useState<AdminMaster[]>([]);

  const [adsStatus, setAdsStatus] = useState<ModerationStatus>("pending");
  const [ads, setAds] = useState<AdminAd[]>([]);

  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryAudience, setCategoryAudience] = useState<"master" | "client" | "both">("both");

  const statusOptions = useMemo(() => ["pending", "approved", "rejected"] as const, []);

  const setOk = (text: string) => {
    setMessage(text);
    setError("");
  };

  const setFail = (e: unknown) => {
    setMessage("");
    setError(e instanceof Error ? e.message : "Неизвестная ошибка");
  };

  const checkAccess = async () => {
    try {
      const res = await adminPing();
      setOk(res.message);
    } catch (e) {
      setFail(e);
    }
  };

  const loadMasters = async () => {
    try {
      const res = await getAdminMasters(masterStatus);
      const safeList = Array.isArray(res) ? res : [];
      setMasters(safeList);
      setOk(`Загружено мастеров: ${safeList.length}`);
    } catch (e) {
      setFail(e);
    }
  };

  const loadAds = async () => {
    try {
      const res = await getAdminAds(adsStatus);
      const safeList = Array.isArray(res) ? res : [];
      setAds(safeList);
      setOk(`Загружено объявлений: ${safeList.length}`);
    } catch (e) {
      setFail(e);
    }
  };

  const onCreateCategory = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createCategory({ name: categoryName, slug: categorySlug, audience: categoryAudience });
      setOk("Категория создана");
      setCategoryName("");
      setCategorySlug("");
      setCategoryAudience("both");
    } catch (err) {
      setFail(err);
    }
  };

  const quickRejectReason = (label: string) => window.prompt(`Причина отклонения (${label})`, "") || "";

  return (
    <section className="adminPage">
      <h1 className="h1">Админ-панель</h1>
      <p className="muted">Минимальная панель для endpoint-ов /admin из backend.</p>

      {message ? <p className="adminOk">✅ {message}</p> : null}
      {error ? <p className="adminError">❌ {error}</p> : null}

      <div className="adminGrid">
        <article className="card adminCard">
          <h2 className="h3">Доступ</h2>
          <button className="btn btnSecondary" onClick={checkAccess}>
            Проверить /admin/ping
          </button>
        </article>

        <article className="card adminCard">
          <h2 className="h3">Категории</h2>
          <form className="authForm" onSubmit={onCreateCategory}>
            <label className="label" htmlFor="category-name">Название</label>
            <input id="category-name" className="input" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />

            <label className="label" htmlFor="category-slug">Slug</label>
            <input id="category-slug" className="input" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} required />

            <label className="label" htmlFor="category-audience">Аудитория</label>
            <select
              id="category-audience"
              className="select"
              value={categoryAudience}
              onChange={(e) => setCategoryAudience(e.target.value as "master" | "client" | "both")}
            >
              <option value="master">master</option>
              <option value="client">client</option>
              <option value="both">both</option>
            </select>

            <button className="btn btnPrimary" type="submit">Создать категорию</button>
          </form>
        </article>
      </div>

      <article className="card adminCard adminSection">
        <div className="adminSectionHeader">
          <h2 className="h3">Модерация мастеров</h2>
          <div className="adminControls">
            <select className="select" value={masterStatus} onChange={(e) => setMasterStatus(e.target.value as ModerationStatus)}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button className="btn btnSecondary" onClick={loadMasters}>Загрузить</button>
          </div>
        </div>

        <div className="adminList">
          {masters.map((master) => (
            <div key={master.user_id} className="adminItem">
              <div>
                <strong>{master.full_name || master.login}</strong> · {master.city || "—"}
                <p className="muted">ID: {master.user_id} · role: {master.role} · status: {master.status}</p>
              </div>
              <div className="adminActions">
                <button className="btn btnPrimary" onClick={async () => { try { await approveUser(master.user_id); await loadMasters(); setOk("Пользователь одобрен"); } catch (e) { setFail(e); } }}>Одобрить</button>
                <button className="btn btnGhost" onClick={async () => { try { await rejectUser(master.user_id, quickRejectReason("пользователь")); await loadMasters(); setOk("Пользователь отклонён"); } catch (e) { setFail(e); } }}>Отклонить</button>
              </div>
            </div>
          ))}
          {masters.length === 0 ? <p className="muted">Список пуст. Выберите статус и нажмите «Загрузить».</p> : null}
        </div>
      </article>

      <article className="card adminCard adminSection">
        <div className="adminSectionHeader">
          <h2 className="h3">Модерация объявлений</h2>
          <div className="adminControls">
            <select className="select" value={adsStatus} onChange={(e) => setAdsStatus(e.target.value as ModerationStatus)}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button className="btn btnSecondary" onClick={loadAds}>Загрузить</button>
          </div>
        </div>

        <div className="adminList">
          {ads.map((ad) => (
            <div key={ad.id} className="adminItem">
              <div>
                <strong>{ad.title}</strong> · {ad.city || "—"}
                <p className="muted">ID: {ad.id} · type: {ad.type} · status: {ad.status} · login: {ad.login || "—"}</p>
              </div>
              <div className="adminActions">
                <button className="btn btnPrimary" onClick={async () => { try { await approveAd(ad.id); await loadAds(); setOk("Объявление одобрено"); } catch (e) { setFail(e); } }}>Одобрить</button>
                <button className="btn btnGhost" onClick={async () => { try { await rejectAd(ad.id, quickRejectReason("объявление")); await loadAds(); setOk("Объявление отклонено"); } catch (e) { setFail(e); } }}>Отклонить</button>
              </div>
            </div>
          ))}
          {ads.length === 0 ? <p className="muted">Список пуст. Выберите статус и нажмите «Загрузить».</p> : null}
        </div>
      </article>
    </section>
  );
}
