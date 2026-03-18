"use client";

import { FormEvent, useMemo, useState } from "react";
import { createSupportRequest } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9()\-\s]{7,20}$/;
const MESSAGE_MIN_LENGTH = 10;

function validateContact(contact: string) {
  if (contact.includes("@")) {
    return EMAIL_RE.test(contact);
  }
  return PHONE_RE.test(contact);
}

export function SupportForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingHint = useMemo(() => {
    const missing = MESSAGE_MIN_LENGTH - message.trim().length;
    return missing > 0
      ? `Ещё ${missing} симв. до минимальной длины`
      : "Сообщение выглядит хорошо";
  }, [message]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedContact = contact.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedContact || !trimmedMessage) {
      setSuccess("");
      setError("Пожалуйста, заполните все поля.");
      return;
    }
    if (!validateContact(trimmedContact)) {
      setSuccess("");
      setError("Укажите корректный email или телефон.");
      return;
    }
    if (trimmedMessage.length < MESSAGE_MIN_LENGTH) {
      setSuccess("");
      setError("Сообщение должно содержать не менее 10 символов.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await createSupportRequest({
        name: trimmedName,
        contact: trimmedContact,
        message: trimmedMessage,
      });
      setSuccess(response.message || "Ваше сообщение отправлено");
      setName("");
      setContact("");
      setMessage("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось отправить сообщение. Попробуйте ещё раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="support" className="supportSection card">
      <div className="supportIntro">
        <span className="supportIcon" aria-hidden="true">
          💬
        </span>
        <div>
          <p className="supportEyebrow">Поддержка</p>
          <h2 className="supportTitle">
            Напишите нам, если нужна помощь или ответ на вопрос
          </h2>
          <p className="supportSubtitle">
            Оставьте короткое сообщение — команда поддержки увидит обращение в
            админке и сможет быстро взять его в работу.
          </p>
        </div>
      </div>

      <form className="supportForm" onSubmit={onSubmit}>
        <label className="label" htmlFor="support-name">
          Имя
        </label>
        <input
          id="support-name"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Как к вам обращаться"
          autoComplete="name"
          required
        />

        <label className="label" htmlFor="support-contact">
          Телефон или email
        </label>
        <input
          id="support-contact"
          className="input"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          placeholder="+7 (999) 123-45-67 или email@example.com"
          required
        />

        <label className="label" htmlFor="support-message">
          Сообщение
        </label>
        <textarea
          id="support-message"
          className="textarea supportTextarea"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Кратко опишите вопрос или ситуацию"
          required
        />

        <div className="supportFormFooter">
          <p className="supportConsentText">
            Нажимая «Отправить», вы соглашаетесь на обработку персональных
            данных согласно <a href="/privacy">политике конфиденциальности</a>.
          </p>
          <p className="supportHint">{remainingHint}</p>
        </div>

        <button
          type="submit"
          className="btn btnPrimary supportSubmit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Отправляем..." : "Отправить"}
        </button>

        {success ? <p className="noticeBox noticeOk">{success}</p> : null}
        {error ? <p className="noticeBox noticeDanger">{error}</p> : null}
      </form>
    </section>
  );
}
