"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  acceptPersonalDataConsent,
  authMe,
  getMyProfile,
  getPersonalDataConsent,
  upsertMyProfile,
  type AuthMe,
  type MyMasterProfile,
} from "@/lib/auth-api";
import { readableApiError } from "@/lib/labels";
import { FileUploadField } from "@/components/FileUploadField";
import { CityField } from "@/components/CityField";
import {
  categoryIdOf,
  categoryNameOf,
  getCategories,
  getCities,
  type CategoryItem,
  type CityItem,
} from "@/lib/reference-api";

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

function mergeWorkFiles(previous: File[], incoming: File[]) {
  const map = new Map(
    previous.map((file) => [
      `${file.name}-${file.size}-${file.lastModified}`,
      file,
    ]),
  );
  for (const file of incoming) {
    map.set(`${file.name}-${file.size}-${file.lastModified}`, file);
  }
  return Array.from(map.values());
}

export default function ProfilePage() {
  const [me, setMe] = useState<AuthMe | null>(null);
  const [profile, setProfile] = useState<MyMasterProfile | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState("");
  const [phone, setPhone] = useState("");
  const [cityId, setCityId] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [works, setWorks] = useState<File[]>([]);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentAcceptedAt, setConsentAcceptedAt] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    Promise.all([authMe(), getCategories({ audience: "master" }), getCities()])
      .then(async ([meData, categoryItems, cityItems]) => {
        if (!active) return;

        setMe(meData);
        setCategories(Array.isArray(categoryItems) ? categoryItems : []);
        setCities(Array.isArray(cityItems) ? cityItems : []);

        if (!meData) return;

        const [p, consent] = await Promise.all([
          getMyProfile(),
          getPersonalDataConsent(),
        ]);
        if (!active) return;

        setProfile(p);
        setConsentChecked(Boolean(consent.accepted));
        setConsentAcceptedAt(consent.accepted_at ?? null);
        const presetCategory =
          new URLSearchParams(window.location.search).get("category_id") || "";

        if (p) {
          setCategoryId(String(p.category_id ?? presetCategory));
          setFullName(p.full_name ?? "");
          setDescription(p.description ?? "");
          setServices(p.services ?? "");
          setPhone(p.phone ?? "");
          setCityId(p.city_id ? String(p.city_id) : "");
          setCustomCity(p.city_id ? "" : (p.city ?? ""));
          setSocialLinks(p.social_links ?? "");
        } else {
          if (presetCategory) setCategoryId(presetCategory);
          setEditMode(true);
        }
      })
      .catch((err) => {
        if (active)
          setError(
            readableApiError(
              err instanceof Error ? err.message : "Ошибка загрузки профиля",
            ),
          );
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
    const found = categories.find((c) => String(categoryIdOf(c)) === target);
    return found ? categoryNameOf(found) : "Категория не выбрана";
  }, [categories, profile?.category_id, categoryId]);

  const currentCityName = useMemo(() => {
    if (profile?.city) return profile.city;
    if (cityId)
      return (
        cities.find((item) => String(item.id) === cityId)?.name || "Не указан"
      );
    return customCity.trim() || "Не указан";
  }, [cities, cityId, customCity, profile?.city]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!phone.trim() && !socialLinks.trim()) {
      setError("Укажите телефон или ссылку на мессенджер");
      return;
    }

    if (!cityId && !customCity.trim()) {
      setError("Выберите город из списка или добавьте новый.");
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
        city_id: cityId ? Number(cityId) : undefined,
        city_name: customCity.trim(),
        full_name: fullName.trim(),
        description: description.trim(),
        services: services.trim(),
        phone: phone.trim(),
        social_links: socialLinks.trim(),
        avatar,
        works,
      });

      setProfile(saved);
      setAvatar(null);
      setWorks([]);
      setCityId(saved.city_id ? String(saved.city_id) : "");
      setCustomCity(saved.city_id ? "" : (saved.city ?? ""));
      setEditMode(false);
      setSuccess("Профиль сохранён и отправлен на модерацию");

      const refreshedCities = await getCities().catch(() => null);
      if (refreshedCities) setCities(refreshedCities);
    } catch (err) {
      setError(
        readableApiError(
          err instanceof Error ? err.message : "Ошибка сохранения профиля",
        ),
      );
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
        <div className="noticeBox noticeDanger">
          <p>{error || "Вы не авторизованы"}</p>
        </div>
        <p className="muted authHint">
          <Link href="/login">Войти</Link> или{" "}
          <Link href="/register">зарегистрироваться</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="card authCard">
      <h1 className="h1">Профиль мастера</h1>
      <p className="muted">
        Аккаунт: {me.login} · Роль: {roleMap[me.role]}
      </p>

      <div className="profileStatus">
        <strong>Статус: {profileStatusLabel(profile?.status)}</strong>
      </div>

      {profile?.status === "rejected" ? (
        <div className="noticeBox noticeDanger">
          <strong>Профиль отклонён</strong>
          <p>
            {profile.rejection_reason ?? "Причина не указана"}. Исправьте данные
            и отправьте снова.
          </p>
        </div>
      ) : null}

      {!editMode ? (
        <div className="authForm">
          <article className="card masterHeroCard">
            <div className="masterTop">
              <img
                src={profile?.avatar_url || "/logo-placeholder.svg"}
                alt={profile?.full_name || me.login}
                className="masterAvatar"
              />
              <div className="masterHeadInfo">
                <h2>{profile?.full_name || me.login}</h2>
                <div className="badgeRow">
                  <span className="badge badgeBlue">{categoryName}</span>
                </div>
                <p className="meta">📍 г. {currentCityName}</p>
              </div>
            </div>
            <div className="divider" />
            <p>{profile?.description || "Описание пока не добавлено"}</p>
            <p>
              <strong>Услуги:</strong> {profile?.services || "не указаны"}
            </p>
            <p>
              <strong>Телефон:</strong> {profile?.phone || "не указан"}
            </p>
            <p>
              <strong>Мессенджер/соцсеть:</strong>{" "}
              {profile?.social_links || "не указан"}
            </p>
            {profile?.work_images && profile.work_images.length > 0 ? (
              <>
                <div className="divider" />
                <h3>Примеры работ</h3>
                <div className="uploadPreviewGrid">
                  {profile.work_images.map((item, index) => (
                    <a
                      key={`${item.image_url}-${index}`}
                      href={item.image_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={item.image_url}
                        alt={`Работа ${index + 1}`}
                        className="uploadPreviewImg"
                      />
                    </a>
                  ))}
                </div>
              </>
            ) : null}
          </article>

          <button
            type="button"
            className="btn btnPrimary"
            onClick={() => setEditMode(true)}
          >
            Редактировать профиль
          </button>
        </div>
      ) : (
        <form className="authForm" onSubmit={onSubmit}>
          <label className="label" htmlFor="category">
            Ваше направление
          </label>
          <select
            id="category"
            className="select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Выберите направление</option>
            {categories.map((category) => {
              const id = categoryIdOf(category);
              return (
                <option key={id} value={id}>
                  {categoryNameOf(category)}
                </option>
              );
            })}
          </select>

          <label className="label" htmlFor="full-name">
            Как к вам обращаться
          </label>
          <input
            id="full-name"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Например: Анна Петрова"
            required
          />

          <CityField
            cities={cities}
            cityId={cityId}
            customCity={customCity}
            onCityIdChange={setCityId}
            onCustomCityChange={setCustomCity}
            label="Город работы"
            required
            selectId="city"
            inputId="custom-city"
          />

          <label className="label" htmlFor="description">
            О себе
          </label>
          <textarea
            id="description"
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Коротко расскажите о вашем опыте и преимуществах"
            required
          />

          <label className="label" htmlFor="services">
            Какие услуги оказываете
          </label>
          <textarea
            id="services"
            className="textarea"
            value={services}
            onChange={(e) => setServices(e.target.value)}
            placeholder="Например: окрашивание, стрижка, укладка"
            required
          />

          <label className="label" htmlFor="phone">
            Телефон для записи
          </label>
          <input
            id="phone"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Можно не заполнять, если есть ссылка ниже"
          />

          <label className="label" htmlFor="social">
            Ссылка на мессенджер или соцсеть
          </label>
          <input
            id="social"
            className="input"
            value={socialLinks}
            onChange={(e) => setSocialLinks(e.target.value)}
            placeholder="Можно не заполнять, если указан телефон"
          />

          <FileUploadField
            id="avatar"
            label="Ваше фото (аватар)"
            buttonText="Выбрать фото"
            accept="image/*"
            selectedFiles={avatar ? [avatar] : []}
            emptyText="Файл не выбран"
            onFilesChange={(files) => setAvatar(files[0] ?? null)}
          />

          <FileUploadField
            id="works"
            label="Примеры ваших работ"
            buttonText="Выбрать фото работ"
            accept="image/*"
            multiple
            selectedFiles={works}
            showFileList
            emptyText="Файлы не выбраны"
            onFilesChange={(files) =>
              setWorks((prev) => mergeWorkFiles(prev, files))
            }
          />

          <label className="consentRow">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
            />
            <span>Подтверждаю согласие на обработку персональных данных.</span>
          </label>

          <div className="actionRow">
            <button className="btn btnPrimary" type="submit">
              Сохранить
            </button>
            {profile ? (
              <button
                type="button"
                className="btn btnGhost"
                onClick={() => setEditMode(false)}
              >
                Отмена
              </button>
            ) : null}
          </div>
        </form>
      )}

      {success ? <p className="adminOk authHint">{success}</p> : null}
      {error ? <p className="adminError authHint">{error}</p> : null}

      {me.role === "admin" || me.role === "moderator" ? (
        <p>
          <Link className="btn btnGhost" href="/admin">
            Перейти в админ-панель
          </Link>
        </p>
      ) : null}
    </section>
  );
}
