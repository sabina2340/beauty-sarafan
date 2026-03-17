"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { changePassword } from "@/lib/auth-api";
import { readableApiError } from "@/lib/labels";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword || !confirmPassword) {
      setError("Заполните все поля");
      return;
    }
    if (newPassword.length < 8) {
      setError("Новый пароль должен быть не короче 8 символов");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Новый пароль и подтверждение не совпадают");
      return;
    }

    try {
      setLoading(true);
      const res = await changePassword({
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      setSuccess(res.message || "Пароль успешно изменён");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(readableApiError(err instanceof Error ? err.message : "Ошибка смены пароля"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card authCard">
      <h1 className="h1">Смена пароля</h1>
      <form className="authForm" onSubmit={onSubmit}>
        <label className="label" htmlFor="new-password">Новый пароль</label>
        <input id="new-password" type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />

        <label className="label" htmlFor="confirm-password">Подтверждение нового пароля</label>
        <input id="confirm-password" type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />

        <button className="btn btnPrimary" type="submit" disabled={loading}>{loading ? "Сохраняем..." : "Изменить пароль"}</button>
      </form>

      {success ? <div className="noticeBox noticeOk"><p>{success}</p></div> : null}
      {error ? <div className="noticeBox noticeDanger"><p>{error}</p></div> : null}

      <p><Link href="/profile" className="btn btnGhost">Назад в профиль</Link></p>
    </section>
  );
}
