"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth-api";

export default function LoginPage() {
  const router = useRouter();
  const [userLogin, setUserLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ login: userLogin, password });
      const categoryID = new URLSearchParams(window.location.search).get("category_id");
      router.push(categoryID ? `/profile?category_id=${categoryID}` : "/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card authCard">
      <h1 className="h1">Вход</h1>
      <p className="muted">Введите логин и пароль, чтобы продолжить.</p>

      <form className="authForm" onSubmit={onSubmit}>
        <label className="label" htmlFor="login">
          Логин
        </label>
        <input id="login" name="login" type="text" className="input" value={userLogin} onChange={(e) => setUserLogin(e.target.value)} required />

        <label className="label" htmlFor="password">
          Пароль
        </label>
        <input id="password" name="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button type="submit" className="btn btnPrimary authSubmit" disabled={loading}>
          {loading ? "Входим..." : "Войти"}
        </button>
      </form>

      {error ? <p className="adminError authHint">{error}</p> : null}

      <p className="muted authHint">
        Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
      </p>
    </section>
  );
}
