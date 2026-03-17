"use client";

import { FormEvent, useState } from "react";
import { createMasterReview } from "@/lib/api";
import { ReviewItem } from "@/lib/types";
import { FileUploadField } from "@/components/FileUploadField";

type Props = {
  masterId: string;
  initialReviews: ReviewItem[];
};

export function MasterReviewsSection({ masterId, initialReviews }: Props) {
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setOk("");
    setError("");

    if (!phone.trim()) return setError("Введите номер телефона");
    if (text.trim().length < 10 || text.trim().length > 1000) return setError("Текст должен быть от 10 до 1000 символов");
    if (!photo) return setError("Добавьте фото услуги");
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) return setError("Допустимы форматы: jpg, jpeg, png, webp");
    if (photo.size > 5 * 1024 * 1024) return setError("Размер фото — до 5 МБ");
    if (!consent) return setError("Необходимо согласие на обработку персональных данных");

    try {
      setLoading(true);
      const res = await createMasterReview(masterId, {
        phone: phone.trim(),
        text: text.trim(),
        photo,
        is_personal_data_consent: consent,
      });
      setOk(res.message);
      setPhone("");
      setText("");
      setPhoto(null);
      setConsent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить отзыв");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="card reviewsSection">
      <h2>Отзывы</h2>
      <div className="reviewsList">
        {initialReviews.length === 0 ? <p className="muted">Пока нет опубликованных отзывов.</p> : null}
        {initialReviews.map((review) => (
          <article key={review.id} className="reviewCard">
            {review.photo_url ? (
              <a href={review.photo_url} target="_blank" rel="noreferrer">
                <img src={review.photo_url} alt="Фото услуги" className="reviewPhoto" loading="lazy" />
              </a>
            ) : null}
            <p>{review.text}</p>
            <p className="meta">{new Date(review.published_at || review.created_at).toLocaleDateString("ru-RU")} · {review.author_name || "Анонимный клиент"}</p>
          </article>
        ))}
      </div>

      <div className="divider" />
      <h3>Оставить отзыв</h3>
      <form className="authForm" onSubmit={onSubmit}>
        <input className="input" placeholder="Номер телефона" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} required />
        <textarea className="textarea" placeholder="Опишите ваш опыт (10–1000 символов)" value={text} onChange={(e) => setText(e.target.value)} minLength={10} maxLength={1000} required />
        <FileUploadField
          id="review-photo"
          label="Фото услуги"
          buttonText="Выбрать фото"
          accept="image/jpeg,image/png,image/webp"
          required
          selectedFiles={photo ? [photo] : []}
          onFilesChange={(files) => setPhoto(files[0] ?? null)}
        />
        <label className="consentRow">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          <span>
            Я даю согласие на обработку персональных данных. <a href="/legal/privacy-policy.html" target="_blank" rel="noreferrer">Политика обработки персональных данных</a>
          </span>
        </label>
        {ok ? <p className="adminOk">{ok}</p> : null}
        {error ? <p className="adminError">{error}</p> : null}
        <button className="btn btnPrimary" type="submit" disabled={loading}>{loading ? "Отправка..." : "Отправить отзыв"}</button>
      </form>
    </article>
  );
}
