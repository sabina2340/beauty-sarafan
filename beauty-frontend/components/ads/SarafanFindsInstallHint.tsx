"use client";

import { useEffect, useMemo, useState } from "react";

export function SarafanFindsInstallHint() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem("sarafan-install-hint-closed") === "1") return;

    const ua = window.navigator.userAgent || "";
    const mobile = /Android|iPhone|iPad|iPod/i.test(ua);
    if (!mobile) return;

    setIsIos(/iPhone|iPad|iPod/i.test(ua));
    setVisible(true);
  }, []);

  const hintText = useMemo(() => {
    if (isIos) {
      return "Откройте меню «Поделиться» в Safari и выберите «На экран Домой», чтобы закрепить сайт.";
    }
    return "Откройте меню браузера и выберите «Добавить на главный экран», чтобы закрепить сайт на телефоне.";
  }, [isIos]);

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
        <p>{hintText}</p>
      </div>
      <button type="button" className="btn btnGhost" onClick={onClose}>
        Закрыть
      </button>
    </div>
  );
}
