"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authMe, type AuthMe } from "@/lib/auth-api";

export default function ProfilePage() {
  const [me, setMe] = useState<AuthMe | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    authMe()
      .then((data) => {
        if (active) {
          setMe(data);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setMe(null);
          setError(err instanceof Error ? err.message : "Ошибка загрузки профиля");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="card authCard">
        <h1 className="h1">Профиль</h1>
        <p className="muted">Загрузка...</p>
      </section>
    );
  }

  if (!me) {
    return (
      <section className="card authCard">
        <h1 className="h1">Профиль</h1>
        <p className="adminError">{error || "Вы не авторизованы"}</p>
        <p className="muted authHint">
          <Link href="/login">Войти</Link> или <Link href="/register">зарегистрироваться</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="card authCard">
      <h1 className="h1">Профиль</h1>
      <p className="muted">Данные авторизованного пользователя:</p>

      <div className="profileGrid">
        <div className="profileRow"><span>ID:</span><strong>{me.user_id}</strong></div>
        <div className="profileRow"><span>Логин:</span><strong>{me.login}</strong></div>
        <div className="profileRow"><span>Роль:</span><strong>{me.role}</strong></div>
      </div>

      {(me.role === "admin" || me.role === "moderator") ? (
        <p className="authHint"><Link href="/admin">Перейти в админ-панель</Link></p>
      ) : null}
    </section>
  );
}
