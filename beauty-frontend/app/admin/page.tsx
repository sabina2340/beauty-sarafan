"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  confirmPayment,
  getAdminPendingPayments,
  rejectPayment,
  adminPing,
  approveAd,
  approveUser,
  createCategory,
  createEquipment,
  deleteEquipment,
  getAdminAds,
  getAdminEquipment,
  getAdminMasters,
  rejectAd,
  updateAdByAdmin,
  rejectUser,
  type AdminAd,
  type AdminEquipmentItem,
  type AdminMaster,
} from "@/lib/admin-api";

type ModerationStatus = "pending" | "approved" | "rejected";
type AdStatus = "pending" | "approved" | "rejected" | "active" | "expired";

export default function AdminPage() {
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [masterStatus, setMasterStatus] = useState<ModerationStatus>("pending");
  const [masters, setMasters] = useState<AdminMaster[]>([]);

  const [adsStatus, setAdsStatus] = useState<ModerationStatus>("pending");
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [editAdId, setEditAdId] = useState<number | null>(null);
  const [editAdTitle, setEditAdTitle] = useState("");
  const [editAdDescription, setEditAdDescription] = useState("");
  const [editAdCity, setEditAdCity] = useState("");
  const [editAdStatus, setEditAdStatus] = useState<AdStatus>("pending");
  const [editAdImages, setEditAdImages] = useState<File[]>([]);

  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryAudience, setCategoryAudience] = useState<"master" | "client" | "both">("both");
  const [categoryGroupName, setCategoryGroupName] = useState("");
  const [categoryGroupTitle, setCategoryGroupTitle] = useState("");
  const [categoryBusiness, setCategoryBusiness] = useState(false);

  const [equipment, setEquipment] = useState<AdminEquipmentItem[]>([]);
  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentDescription, setEquipmentDescription] = useState("");
  const [equipmentContact, setEquipmentContact] = useState("");
  const [equipmentImage, setEquipmentImage] = useState<File | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejectTarget, setRejectTarget] = useState<{ kind: "ad" | "user"; id: number } | null>(null);

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
      await createCategory({ name: categoryName, slug: categorySlug, group_name: categoryGroupName, group_title: categoryGroupTitle, audience: categoryAudience, is_business: categoryBusiness });
      setOk("Категория создана");
      setCategoryName("");
      setCategorySlug("");
      setCategoryAudience("both");
      setCategoryGroupName("");
      setCategoryGroupTitle("");
      setCategoryBusiness(false);
    } catch (err) {
      setFail(err);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await getAdminPendingPayments();
      setPayments(Array.isArray(res) ? res : []);
      setOk(`Платежей на проверке: ${Array.isArray(res) ? res.length : 0}`);
    } catch (e) {
      setFail(e);
    }
  };

  const openRejectModal = (kind: "ad" | "user", id: number) => {
    setRejectTarget({ kind, id });
    setRejectReason("");
    setRejectError("");
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setRejectReason("");
    setRejectError("");
    setRejectTarget(null);
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      setRejectError("Укажите причину не короче 3 символов");
      return;
    }

    try {
      if (rejectTarget.kind === "user") {
        await rejectUser(rejectTarget.id, reason);
        await loadMasters();
        setOk("Пользователь отклонён");
      } else {
        await rejectAd(rejectTarget.id, reason);
        await loadAds();
        setOk("Объявление отклонено");
      }
      closeRejectModal();
    } catch (e) {
      setFail(e);
    }
  };


  const loadEquipment = async () => {
    try {
      const res = await getAdminEquipment();
      setEquipment(Array.isArray(res) ? res : []);
      setOk(`Позиций оборудования: ${Array.isArray(res) ? res.length : 0}`);
    } catch (e) {
      setFail(e);
    }
  };

  const onCreateEquipment = async (e: FormEvent) => {
    e.preventDefault();
    if (!equipmentImage) {
      setError("Выберите фото оборудования");
      return;
    }
    try {
      await createEquipment({
        name: equipmentName,
        description: equipmentDescription,
        contact: equipmentContact,
        image: equipmentImage,
      });
      setEquipmentName("");
      setEquipmentDescription("");
      setEquipmentContact("");
      setEquipmentImage(null);
      setOk("Оборудование добавлено");
      await loadEquipment();
    } catch (e) {
      setFail(e);
    }
  };

  const startEditAd = (ad: AdminAd) => {
    setEditAdId(ad.id);
    setEditAdTitle(ad.title || "");
    setEditAdDescription(ad.description || "");
    setEditAdCity(ad.city || "");
    setEditAdStatus(ad.status || "pending");
    setEditAdImages([]);
  };

  const saveEditedAd = async () => {
    if (!editAdId) return;
    try {
      await updateAdByAdmin(editAdId, {
        title: editAdTitle,
        description: editAdDescription,
        city: editAdCity,
        status: editAdStatus,
        images: editAdImages,
        append_images: true,
      });
      setOk("Объявление обновлено");
      setEditAdId(null);
      await loadAds();
    } catch (e) {
      setFail(e);
    }
  };

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



            <label className="label" htmlFor="category-group-name">Group name</label>
            <input id="category-group-name" className="input" value={categoryGroupName} onChange={(e) => setCategoryGroupName(e.target.value)} required />

            <label className="label" htmlFor="category-group-title">Group title</label>
            <input id="category-group-title" className="input" value={categoryGroupTitle} onChange={(e) => setCategoryGroupTitle(e.target.value)} required />

            <label className="label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={categoryBusiness} onChange={(e) => setCategoryBusiness(e.target.checked)} />
              Бизнес-категория
            </label>
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
                {master.avatar_url ? <img src={master.avatar_url} alt={master.full_name || master.login} style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", marginBottom: 8 }} /> : null}
                <strong>{master.full_name || master.login}</strong> · {master.city || "—"}
                <p className="muted">ID: {master.user_id} · role: {master.role} · status: {master.status}</p>
                <p className="muted">{master.description || "Описание не заполнено"}</p>
                <div className="adminActions">
                  <a className="btn btnGhost" href="/profile">Открыть профиль в ЛК</a>
                  {master.status === "approved" ? <a className="btn btnGhost" href={`/masters/${master.user_id}`}>Открыть публичную карточку</a> : <span className="muted">Публичная карточка недоступна</span>}
                </div>
              </div>
              <div className="adminActions">
                <button className="btn btnPrimary" onClick={async () => { try { await approveUser(master.user_id); await loadMasters(); setOk("Пользователь одобрен"); } catch (e) { setFail(e); } }}>Одобрить</button>
                <button className="btn btnGhost" onClick={() => openRejectModal("user", master.user_id)}>Отклонить</button>
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
                {ad.image_url ? <img src={ad.image_url} alt={ad.title} style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 8 }} /> : null}
              </div>
              <div className="adminActions">
                <button className="btn btnSecondary" onClick={() => startEditAd(ad)}>Редактировать</button>
                <button className="btn btnPrimary" onClick={async () => { try { await approveAd(ad.id); await loadAds(); setOk("Объявление одобрено"); } catch (e) { setFail(e); } }}>Одобрить</button>
                <button className="btn btnGhost" onClick={() => openRejectModal("ad", ad.id)}>Отклонить</button>
              </div>
            </div>
          ))}
          {ads.length === 0 ? <p className="muted">Список пуст. Выберите статус и нажмите «Загрузить».</p> : null}
        </div>

        {editAdId ? (
          <div className="adminItem">
            <h3>Редактирование объявления #{editAdId}</h3>
            <input className="input" value={editAdTitle} onChange={(e) => setEditAdTitle(e.target.value)} placeholder="Заголовок" />
            <textarea className="textarea" value={editAdDescription} onChange={(e) => setEditAdDescription(e.target.value)} placeholder="Описание" />
            <input className="input" value={editAdCity} onChange={(e) => setEditAdCity(e.target.value)} placeholder="Город" />
            <select className="select" value={editAdStatus} onChange={(e) => setEditAdStatus(e.target.value as AdStatus)}>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="active">active</option>
              <option value="expired">expired</option>
            </select>
            <input className="input" type="file" accept="image/*" multiple onChange={(e) => setEditAdImages(Array.from(e.target.files ?? []))} />
            <div className="adminActions">
              <button className="btn btnPrimary" onClick={saveEditedAd}>Сохранить</button>
              <button className="btn btnGhost" onClick={() => setEditAdId(null)}>Отмена</button>
            </div>
          </div>
        ) : null}
      </article>


      <article className="card adminCard adminSection">
        <div className="adminSectionHeader">
          <h2 className="h3">Каталог оборудования</h2>
          <button className="btn btnSecondary" onClick={loadEquipment}>Загрузить</button>
        </div>

        <form className="authForm" onSubmit={onCreateEquipment}>
          <label className="label" htmlFor="equipment-name">Название</label>
          <input id="equipment-name" className="input" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} placeholder="Например, Лазер диодный" />

          <label className="label" htmlFor="equipment-description">Описание</label>
          <textarea id="equipment-description" className="textarea" value={equipmentDescription} onChange={(e) => setEquipmentDescription(e.target.value)} required />

          <label className="label" htmlFor="equipment-contact">Контакт для связи</label>
          <input id="equipment-contact" className="input" value={equipmentContact} onChange={(e) => setEquipmentContact(e.target.value)} required />

          <label className="label" htmlFor="equipment-image">Фото</label>
          <input id="equipment-image" className="input" type="file" accept="image/*" onChange={(e) => setEquipmentImage(e.target.files?.[0] || null)} required />

          <button className="btn btnPrimary" type="submit">Добавить в каталог</button>
        </form>

        <div className="adminList">
          {equipment.map((item) => (
            <div key={item.id} className="adminItem">
              <div>
                <strong>{item.name || "Оборудование"}</strong>
                <p className="muted">{item.description}</p>
                <p className="muted">Контакт: {item.contact || "—"}</p>
                {item.image_url ? <img src={item.image_url} alt={item.name || "equipment"} style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 8 }} /> : null}
              </div>
              <div className="adminActions">
                <button className="btn btnGhost" onClick={async () => { try { await deleteEquipment(item.id); await loadEquipment(); setOk("Позиция удалена"); } catch (e) { setFail(e); } }}>Удалить</button>
              </div>
            </div>
          ))}
          {equipment.length === 0 ? <p className="muted">Список пуст. Добавьте первую позицию.</p> : null}
        </div>
      </article>


      <article className="card adminCard adminSection">
        <div className="adminSectionHeader">
          <h2 className="h3">Проверка оплат</h2>
          <button className="btn btnSecondary" onClick={loadPayments}>Загрузить</button>
        </div>
        <div className="adminList">
          {payments.map((p) => (
            <div key={p.id} className="adminItem">
              <div>
                <strong>{p.advertisement_title}</strong>
                <p className="muted">Пользователь: {p.login} · Тариф: {p.tariff_name} · Сумма: {p.amount} ₽</p>
                <p className="muted">Комментарий: {p.comment || "—"}</p>
              </div>
              <div className="adminActions">
                <button className="btn btnPrimary" onClick={async () => { await confirmPayment(p.id); await loadPayments(); }}>Подтвердить оплату</button>
                <button className="btn btnGhost" onClick={async () => { await rejectPayment(p.id); await loadPayments(); }}>Отклонить оплату</button>
              </div>
            </div>
          ))}
          {payments.length === 0 ? <p className="muted">Список пуст.</p> : null}
        </div>
      </article>

      {rejectModalOpen ? (
        <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Отклонить объявление">
          <div className="modalCard">
            <button type="button" className="modalClose" onClick={closeRejectModal} aria-label="Закрыть">✕</button>
            <h3>Отклонить объявление</h3>
            <p className="muted">Укажите причину отклонения</p>
            <textarea
              className="textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Причина отклонения"
              rows={5}
            />
            {rejectError ? <p className="adminError">{rejectError}</p> : null}
            <div className="actionRow">
              <button type="button" className="btn btnGhost" onClick={closeRejectModal}>Отмена</button>
              <button type="button" className="btn btnPrimary" onClick={submitReject}>Отклонить</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
