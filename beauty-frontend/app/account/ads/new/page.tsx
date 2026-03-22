"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createAd } from "@/lib/ads-api";
import { FileUploadField } from "@/components/FileUploadField";

type Category = { ID: number; Name: string };

export default function NewAdPage() {
  const [type, setType] = useState("service");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories?audience=master", { cache: "no-store" })
      .then((r) => r.json() as Promise<Category[]>)
      .then((items) => setCategories(Array.isArray(items) ? items : []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  const previews = useMemo(() => imageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })), [imageFiles]);

  useEffect(() => () => previews.forEach((item) => URL.revokeObjectURL(item.url)), [previews]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await createAd({
        type,
        title,
        description,
        city,
        category_id: categoryId ? Number(categoryId) : undefined,
        images: imageFiles,
      });
      setMessage(res.message);
      setTitle("");
      setDescription("");
      setCity("");
      setCategoryId("");
      setImageFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания объявления");
    }
  };

  return (
    <section className="card authCard">
      <h1 className="h1">Новое объявление</h1>
      <form className="authForm" onSubmit={onSubmit}>
        <select className="select" value={type} onChange={(e) => setType(e.target.value)} required>
          <option value="service">Услуга</option>
          <option value="cabinet">Кабинет</option>
          <option value="salon">Салон</option>
        </select>
        <input className="input" placeholder="Заголовок" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="textarea" placeholder="Описание" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <input className="input" placeholder="Город" value={city} onChange={(e) => setCity(e.target.value)} required />
        <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required disabled={loadingCategories}>
          <option value="">{loadingCategories ? "Загрузка категорий..." : "Выберите категорию"}</option>
          {categories.map((category) => (
            <option key={category.ID} value={category.ID}>{category.Name || "Без названия"}</option>
          ))}
        </select>
        <FileUploadField
          id="new-ad-images"
          label="Фото объявления"
          buttonText="Выбрать файлы"
          accept="image/*"
          multiple
          selectedFiles={imageFiles}
          showFileList
          emptyText="Файлы не выбраны"
          onFilesChange={setImageFiles}
        />
        {imageFiles.length ? (
          <>
            <p className="muted">Выбрано файлов: {imageFiles.length}</p>
            <div className="uploadPreviewGrid">
              {previews.map((item) => (
                <img key={`${item.file.name}-${item.file.lastModified}`} src={item.url} alt={item.file.name} className="uploadPreviewImg" />
              ))}
            </div>
          </>
        ) : null}
        <button className="btn btnPrimary" type="submit">Опубликовать объявление</button>
      </form>
      {message ? <p className="adminOk">{message}</p> : null}
      {error ? <p className="adminError">{error}</p> : null}
    </section>
  );
}
