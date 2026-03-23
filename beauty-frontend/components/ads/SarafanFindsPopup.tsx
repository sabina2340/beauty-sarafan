"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPopupAds, type PopupAdCard } from "@/lib/ads-api";

type Props = {
  delayMs?: number;
  reopenCooldownMs?: number;
};

const POPUP_DELAY_MS = 5000;
const POPUP_REOPEN_COOLDOWN_MS = 15000;

function pickRandomItem(items: PopupAdCard[]): PopupAdCard | null {
  const safeItems = Array.isArray(items) ? items : [];
  if (safeItems.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * safeItems.length);
  return safeItems[index] ?? safeItems[0] ?? null;
}

export function SarafanFindsPopup({
  delayMs = POPUP_DELAY_MS,
  reopenCooldownMs = POPUP_REOPEN_COOLDOWN_MS,
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PopupAdCard[]>([]);
  const [loading, setLoading] = useState(true);
  const closedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    getPopupAds()
      .then((data) => {
        if (!active) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedAd = useMemo(() => pickRandomItem(items), [items]);

  useEffect(() => {
    if (loading) return;
    if (!selectedAd) return;

    const now = Date.now();
    if (closedAtRef.current && now - closedAtRef.current < reopenCooldownMs) {
      return;
    }

    const timer = window.setTimeout(() => setOpen(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, loading, reopenCooldownMs, selectedAd]);

  const onClose = () => {
    setOpen(false);
    closedAtRef.current = Date.now();
  };

  if (!open || !selectedAd) return null;

  const description = selectedAd.short_description || selectedAd.description || "Описание добавляется";
  const imageUrl = selectedAd.image_url || "/logo-placeholder.png";
  const targetHref = selectedAd.route || "/hot-offers";

  return (
    <div className="modalOverlay sarafanPopupOverlay" role="dialog" aria-modal="true" aria-label="Реклама Сарафанных находок">
      <div className="modalCard sarafanPopupCard">
        <button type="button" className="modalClose sarafanPopupClose" aria-label="Закрыть" onClick={onClose}>
          ×
        </button>
        <div className="sarafanPopupMediaWrap">
          <img src={imageUrl} alt={selectedAd.title} className="sarafanPopupMedia" />
        </div>
        <p className="sarafanPopupEyebrow">Сарафанные находки</p>
        <h3 className="h2 sarafanPopupTitle">{selectedAd.title}</h3>
        <p className="muted sarafanPopupDescription">{description}</p>
        <div className="sarafanPopupMeta muted">
          <span>{selectedAd.city || "Онлайн / без города"}</span>
        </div>
        <div className="sarafanPopupActions">
          <Link href={targetHref} className="btn btnPrimary sarafanPopupCta" onClick={onClose}>
            Перейти к объявлению
          </Link>
          <button type="button" className="btn btnGhost" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
