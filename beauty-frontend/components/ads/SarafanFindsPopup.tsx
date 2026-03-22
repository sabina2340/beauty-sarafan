"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  title?: string;
  delayMs?: number;
};

const DEFAULT_TITLE = "🎁 При покупке 2 недель в Сарафанных акциях — 1 неделя в подарок";

export function SarafanFindsPopup({ title = DEFAULT_TITLE, delayMs = 12000 }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem("sarafan-finds-popup-closed") === "1") return;

    const timer = window.setTimeout(() => setOpen(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  const onClose = () => {
    setOpen(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("sarafan-finds-popup-closed", "1");
    }
  };

  if (!open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Акция Сарафанных находок">
      <div className="modalCard sarafanPopupCard">
        <button type="button" className="modalClose" aria-label="Закрыть" onClick={onClose}>
          ×
        </button>
        <p className="sarafanPopupEyebrow">Сарафанные находки</p>
        <h3 className="h2 sarafanPopupTitle">{title}</h3>
        <p className="muted">Проверенные акции и платное размещение доступны в текущем разделе без изменения существующих тарифов.</p>
        <div className="sarafanPopupActions">
          <Link href="/hot-offers" className="btn btnSecondary" onClick={onClose}>
            Найти горячие предложения
          </Link>
          <Link href="/account/ads" className="btn btnPrimary" onClick={onClose}>
            Разместить горячее предложение (платно)
          </Link>
        </div>
      </div>
    </div>
  );
}
