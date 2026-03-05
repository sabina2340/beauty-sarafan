"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/auth-api";

export default function RegisterPage() {
  const router = useRouter();
  const [userLogin, setUserLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const reg = await register({ login: userLogin, password });
      setSuccess(reg.message);
      await login({ login: userLogin, password });
      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card authCard">
      <h1 className="h1">Регистрация</h1>
      <p className="muted">Создайте аккаунт, чтобы пользоваться сервисом.</p>

      <form className="authForm" onSubmit={onSubmit}>
        <label className="label" htmlFor="login">
          Логин
        </label>
        <input id="login" name="login" type="text" className="input" value={userLogin} onChange={(e) => setUserLogin(e.target.value)} required minLength={3} />

        <label className="label" htmlFor="password">
          Пароль
        </label>
        <input id="password" name="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

        <button type="submit" className="btn btnPrimary authSubmit" disabled={loading}>
          {loading ? "Регистрируем..." : "Зарегистрироваться"}
        </button>
      </form>

      {success ? <p className="adminOk authHint">{success}</p> : null}
      {error ? <p className="adminError authHint">{error}</p> : null}

      <p className="muted authHint">
        Уже есть аккаунт? <Link href="/login">Войти</Link>
      </p>
    </section>
  );
}
