"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { acceptPersonalDataConsent, authMe, getMyProfile, getPersonalDataConsent, upsertMyProfile, type AuthMe, type MyMasterProfile } from "@/lib/auth-api";
import { readableApiError } from "@/lib/labels";

type Category = { ID?: number; Name?: string; id?: number; name?: string };

const roleMap: Record<NonNullable<AuthMe>["role"], string> = {
  admin: "Администратор",
  moderator: "Модератор",
  user: "Пользователь",
};

function profileStatusLabel(status?: string) {
  if (status === "pending") return "На модерации";
  if (status === "approved") return "Одобрен";
  if (status === "rejected") return "Отклонён";
  return "Заполняется";
}

export default function ProfilePage() {
  const [me, setMe] = useState<AuthMe | null>(null);
  const [profile, setProfile] = useState<MyMasterProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [works, setWorks] = useState<File[]>([]);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentAcceptedAt, setConsentAcceptedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      authMe(),
      fetch("/api/categories?audience=master", { cache: "no-store" }).then((r) => r.json() as Promise<Category[]>),
    ])
      .then(async ([meData, categoryItems]) => {
        if (!active) return;

        setMe(meData);
        setCategories(Array.isArray(categoryItems) ? categoryItems : []);

        if (!meData) return;

        const [p, consent] = await Promise.all([getMyProfile(), getPersonalDataConsent()]);
        if (!active) return;

        setProfile(p);
        setConsentChecked(Boolean(consent.accepted));
        setConsentAcceptedAt(consent.accepted_at ?? null);
        const presetCategory = new URLSearchParams(window.location.search).get("category_id") || "";

        if (p) {
          setCategoryId(String(p.category_id ?? presetCategory));
          setFullName(p.full_name ?? "");
          setDescription(p.description ?? "");
          setServices(p.services ?? "");
          setPhone(p.phone ?? "");
          setCity(p.city ?? "");
          setSocialLinks(p.social_links ?? "");
        } else {
          if (presetCategory) setCategoryId(presetCategory);
          setEditMode(true);
        }
      })
      .catch((err) => {
        if (active) setError(readableApiError(err instanceof Error ? err.message : "Ошибка загрузки профиля"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const categoryName = useMemo(() => {
    const target = String(profile?.category_id ?? categoryId);
    const found = categories.find((c) => String(c.ID ?? c.id ?? "") === target);
    return found?.Name ?? found?.name ?? "Категория не выбрана";
  }, [categories, profile?.category_id, categoryId]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!phone.trim() && !socialLinks.trim()) {
      setError("Укажите телефон или ссылку на мессенджер");
      return;
    }

    if (!consentChecked) {
      setError("Подтвердите согласие на обработку персональных данных");
      return;
    }

    try {
      if (!consentAcceptedAt) {
        const consent = await acceptPersonalDataConsent();
        setConsentAcceptedAt(consent.accepted_at ?? new Date().toISOString());
      }

      const saved = await upsertMyProfile({
        category_id: Number(categoryId),
        full_name: fullName.trim(),
        description: description.trim(),
        services: services.trim(),
        phone: phone.trim(),
        city: city.trim(),
        social_links: socialLinks.trim(),
        avatar,
        works,
      });

      setProfile(saved);
      setAvatar(null);
      setWorks([]);
      setEditMode(false);
      setSuccess("Профиль сохранён и отправлен на модерацию");
    } catch (err) {
      setError(readableApiError(err instanceof Error ? err.message : "Ошибка сохранения профиля"));
    }
  };

  if (loading) {
    return (
      <section className="card authCard">
        <h1 className="h1">Профиль мастера</h1>
        <p className="muted">Загрузка...</p>
      </section>
    );
  }

  if (!me) {
    return (
      <section className="card authCard">
        <h1 className="h1">Профиль мастера</h1>
        <div className="noticeBox noticeDanger"><p>{error || "Вы не авторизованы"}</p></div>
        <p className="muted authHint">
          <Link href="/login">Войти</Link> или <Link href="/register">зарегистрироваться</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="card authCard">
      <h1 className="h1">Профиль мастера</h1>
      <p className="muted">Аккаунт: {me.login} · Роль: {roleMap[me.role]}</p>

      <div className="profileStatus">
        <strong>Статус: {profileStatusLabel(profile?.status)}</strong>
      </div>

      {profile?.status === "rejected" ? (
        <div className="noticeBox noticeDanger">
          <strong>Профиль отклонён</strong>
          <p>{profile.rejection_reason ?? "Причина не указана"}. Исправьте данные и отправьте снова.</p>
        </div>
      ) : null}

      {!editMode ? (
        <div className="authForm">
          <article className="card masterHeroCard">
            <div className="masterTop">
              <img src={profile?.avatar_url || "/logo-placeholder.svg"} alt={profile?.full_name || me.login} className="masterAvatar" />
              <div className="masterHeadInfo">
                <h2>{profile?.full_name || me.login}</h2>
                <div className="badgeRow">
                  <span className="badge badgeBlue">{categoryName}</span>
                </div>
                <p className="meta">📍 г. {profile?.city || "Не указан"}</p>
              </div>
            </div>
            <div className="divider" />
            <p>{profile?.description || "Описание пока не добавлено"}</p>
            <p><strong>Услуги:</strong> {profile?.services || "не указаны"}</p>
            <p><strong>Телефон:</strong> {profile?.phone || "не указан"}</p>
            <p><strong>Мессенджер/соцсеть:</strong> {profile?.social_links || "не указан"}</p>
          </article>

          <button type="button" className="btn btnPrimary" onClick={() => setEditMode(true)}>
            Редактировать профиль
          </button>
        </div>
      ) : (
        <form className="authForm" onSubmit={onSubmit}>
          <label className="label" htmlFor="category">Ваше направление</label>
          <select id="category" className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Выберите направление</option>
            {categories.map((c, index) => {
              const id = c.ID ?? c.id ?? index;
              const name = c.Name ?? c.name ?? "Без названия";
              return <option key={id} value={id}>{name}</option>;
            })}
          </select>

          <label className="label" htmlFor="full-name">Как к вам обращаться</label>
          <input id="full-name" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Например: Анна Петрова" required />

          <label className="label" htmlFor="city">Город работы</label>
          <input id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Например: Краснодар" required />

          <label className="label" htmlFor="description">О себе</label>
          <textarea id="description" className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Коротко расскажите о вашем опыте и преимуществах" required />

          <label className="label" htmlFor="services">Какие услуги оказываете</label>
          <textarea id="services" className="textarea" value={services} onChange={(e) => setServices(e.target.value)} placeholder="Например: окрашивание, стрижка, укладка" required />

          <label className="label" htmlFor="phone">Телефон для записи</label>
          <input id="phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Можно не заполнять, если есть ссылка ниже" />

          <label className="label" htmlFor="social">Ссылка на мессенджер или соцсеть</label>
          <input id="social" className="input" value={socialLinks} onChange={(e) => setSocialLinks(e.target.value)} placeholder="Можно не заполнять, если указан телефон" />

          <label className="label">Ваше фото (аватар)</label>
          <label className="btn btnGhost fileBtn" htmlFor="avatar">Выбрать фото</label>
          <input id="avatar" type="file" className="hiddenFileInput" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] ?? null)} />
          <p className="fileHint">{avatar ? avatar.name : "Файл не выбран"}</p>

          <label className="label">Примеры работ</label>
          <label className="btn btnGhost fileBtn" htmlFor="works">Выбрать файлы</label>
          <input id="works" type="file" className="hiddenFileInput" accept="image/*" multiple onChange={(e) => setWorks(Array.from(e.target.files ?? []))} />
          <p className="fileHint">{works.length ? `Выбрано файлов: ${works.length}` : "Файлы не выбраны"}</p>

          <label className="label consentRow" htmlFor="consent">
            <input
              id="consent"
              type="checkbox"
              checked={consentChecked}
              disabled={Boolean(consentAcceptedAt)}
              onChange={(e) => setConsentChecked(e.target.checked)}
            />
            <span>
              Я даю согласие на обработку персональных данных.
              {consentAcceptedAt ? ` Согласие уже сохранено (${new Date(consentAcceptedAt).toLocaleDateString()}).` : ""}
            </span>
          </label>

          <button type="submit" className="btn btnPrimary">Сохранить и отправить на проверку</button>
          {profile ? <button type="button" className="btn btnGhost" onClick={() => setEditMode(false)}>Отменить редактирование</button> : null}
        </form>
      )}

      {success ? <div className="noticeBox noticeOk"><p>{success}</p></div> : null}
      {error ? <div className="noticeBox noticeDanger"><p>{error}</p></div> : null}

      {(me.role === "admin" || me.role === "moderator") ? (
        <p><Link className="btn btnGhost" href="/admin">Перейти в админ-панель</Link></p>
      ) : null}
      <p><Link className="btn btnSecondary" href="/account/ads">Перейти в мои объявления</Link></p>
      <p><Link className="btn btnGhost" href="/account/password">Сменить пароль</Link></p>
    </section>
  );
}
