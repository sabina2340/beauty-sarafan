"use client";

import { useEffect, useState } from "react";

export function SarafanFindsInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem("sarafan-install-hint-closed") === "1") return;

    const ua = window.navigator.userAgent || "";
    const mobile = /Android|iPhone|iPad|iPod/i.test(ua);
    if (!mobile) return;

    setVisible(true);
  }, []);

  const onClose = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("sarafan-install-hint-closed", "1");
    }
  };

  if (!visible) return null;

  return (
    <div className="noticeBox sarafanInstallHint">
      <div>
        <strong>Добавить на главный экран</strong>
        <p><strong>iPhone (Safari):</strong> Откройте меню «Поделиться» и выберите «На экран Домой».</p>
        <p><strong>Android:</strong> Откройте меню браузера (три точки) и выберите «Добавить на главный экран» или «Установить приложение», если такая кнопка доступна.</p>
      </div>
      <button type="button" className="btn btnGhost" onClick={onClose}>
        Закрыть
      </button>
    </div>
  );
}
