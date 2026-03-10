"use client";

import { FormEvent, useState } from "react";
import { createAd } from "@/lib/ads-api";

export default function NewAdPage() {
  const [type, setType] = useState("service");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const image_urls = images.split("\n").map((s) => s.trim()).filter(Boolean);
      const res = await createAd({ type, title, description, city, category_id: categoryId ? Number(categoryId) : undefined, image_urls, images: imageFiles });
      setMessage(res.message);
      setTitle("");
      setDescription("");
      setImages("");
      setImageFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания объявления");
    }
  };

  return (
    <section className="card authCard">
      <h1 className="h1">Новое объявление</h1>
      <form className="authForm" onSubmit={onSubmit}>
        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="service">service</option>
          <option value="cabinet">cabinet</option>
          <option value="salon">salon</option>
        </select>
        <input className="input" placeholder="Заголовок" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="textarea" placeholder="Описание" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <input className="input" placeholder="Город" value={city} onChange={(e) => setCity(e.target.value)} />
        <input className="input" placeholder="Category ID" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
        <textarea className="textarea" placeholder="Ссылки на изображения, по одной в строке" value={images} onChange={(e) => setImages(e.target.value)} />
        <input className="input" type="file" accept="image/*" multiple onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))} />
        {imageFiles.length ? <p className="muted">Выбрано файлов: {imageFiles.length}</p> : null}
        <button className="btn btnPrimary" type="submit">Отправить на модерацию</button>
      </form>
      {message ? <p className="adminOk">{message}</p> : null}
      {error ? <p className="adminError">{error}</p> : null}
    </section>
  );
}
