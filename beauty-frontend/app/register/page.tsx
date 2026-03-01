import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Регистрация | Beauty Sarafan",
  description: "Создание аккаунта Beauty Sarafan",
};

export default function RegisterPage() {
  return (
    <section className="card authCard">
      <h1 className="h1">Регистрация</h1>
      <p className="muted">Создайте аккаунт, чтобы пользоваться сервисом.</p>

      <form className="authForm">
        <label className="label" htmlFor="name">
          Имя
        </label>
        <input id="name" name="name" type="text" className="input" placeholder="Анна" />

        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" className="input" placeholder="you@example.com" />

        <label className="label" htmlFor="password">
          Пароль
        </label>
        <input id="password" name="password" type="password" className="input" placeholder="Минимум 8 символов" />

        <button type="submit" className="btn btnPrimary authSubmit">
          Зарегистрироваться
        </button>
      </form>

      <p className="muted authHint">
        Уже есть аккаунт? <Link href="/login">Войти</Link>
      </p>
    </section>
  );
}
