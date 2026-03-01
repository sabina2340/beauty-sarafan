import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Вход | Beauty Sarafan",
  description: "Вход в аккаунт Beauty Sarafan",
};

export default function LoginPage() {
  return (
    <section className="card authCard">
      <h1 className="h1">Вход</h1>
      <p className="muted">Введите данные аккаунта, чтобы продолжить.</p>

      <form className="authForm">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" className="input" placeholder="you@example.com" />

        <label className="label" htmlFor="password">
          Пароль
        </label>
        <input id="password" name="password" type="password" className="input" placeholder="••••••••" />

        <button type="submit" className="btn btnPrimary authSubmit">
          Войти
        </button>
      </form>

      <p className="muted authHint">
        Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
      </p>
    </section>
  );
}
