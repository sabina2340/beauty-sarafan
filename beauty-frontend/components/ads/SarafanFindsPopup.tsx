"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getPopupAds, type PopupAdCard } from "@/lib/ads-api";

type Props = {
  delayMs?: number;
};

const POPUP_DELAY_MS = 3000;
const POPUP_ROTATION_KEY = "sarafan-popup-rotation-index";

function readRotationIndex(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const rawValue = window.sessionStorage.getItem(POPUP_ROTATION_KEY);
  const parsed = Number(rawValue ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function saveRotationIndex(value: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(POPUP_ROTATION_KEY, String(value));
}

function buildShortDescription(ad: PopupAdCard | null) {
  if (!ad) {
    return "";
  }

  const source = ad.short_description || ad.description || "Описание добавляется";
  return source.length > 180 ? `${source.slice(0, 177)}...` : source;
}

export function SarafanFindsPopup({ delayMs = POPUP_DELAY_MS }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PopupAdCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    setOpen(false);
    setLoading(true);

    getPopupAds()
      .then((data) => {
        if (!active) return;

        const nextItems = Array.isArray(data) ? data : [];
        setItems(nextItems);

        if (nextItems.length === 0) {
          setSelectedIndex(0);
          return;
        }

        const rotationIndex = readRotationIndex();
        const nextIndex = rotationIndex % nextItems.length;
        setSelectedIndex(nextIndex);
        saveRotationIndex(rotationIndex + 1);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setSelectedIndex(0);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  const selectedAd = useMemo(() => {
    if (!items.length) {
      return null;
    }
    return items[selectedIndex] ?? items[0] ?? null;
  }, [items, selectedIndex]);

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (loading || !selectedAd) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      setOpen(true);
      timerRef.current = null;
    }, delayMs);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [delayMs, loading, selectedAd, pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onClose = () => {
    setOpen(false);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  if (!open || !selectedAd) return null;

  const description = buildShortDescription(selectedAd);
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
        <p className="sarafanPopupEyebrow">Рекламное окно · Сарафанные находки</p>
        <h3 className="h2 sarafanPopupTitle">{selectedAd.title}</h3>
        <p className="muted sarafanPopupDescription">{description}</p>
        <div className="sarafanPopupMeta muted">
          <span>{selectedAd.city || "Онлайн / без города"}</span>
        </div>
        <div className="sarafanPopupActions">
          <Link href={targetHref} className="btn btnPrimary sarafanPopupCta" onClick={onClose}>
            Перейти к объявлению
          </Link>
          <button type="button" className="btn btnGhost sarafanPopupDismiss" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
