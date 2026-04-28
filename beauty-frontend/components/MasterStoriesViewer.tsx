"use client";

import { useState } from "react";
import { getMasterStories } from "@/lib/api";
import type { StoryItem } from "@/lib/types";

type Props = {
  masterId: string;
  avatarUrl?: string;
  fullName?: string;
  hasActiveStories?: boolean;
};

export function MasterStoriesViewer({
  masterId,
  avatarUrl,
  fullName,
  hasActiveStories,
}: Props) {
  const [items, setItems] = useState<StoryItem[]>([]);
  const [opened, setOpened] = useState(false);
  const [index, setIndex] = useState(0);

  const openStories = async () => {
    if (!hasActiveStories) return;
    const loaded = await getMasterStories(masterId).catch(() => []);
    if (!loaded.length) return;
    setItems(loaded);
    setIndex(0);
    setOpened(true);
  };

  const current = items[index];

  return (
    <>
      <button
        type="button"
        onClick={openStories}
        style={{ background: "none", border: "none", padding: 0, cursor: hasActiveStories ? "pointer" : "default" }}
        aria-label="Открыть сторис мастера"
      >
        <img
          src={avatarUrl || "/logo-placeholder.png"}
          alt={fullName || "Мастер"}
          className={`masterAvatar ${avatarUrl ? "" : "avatarFallback"}`}
          style={hasActiveStories ? { outline: "3px solid #6b6bff", outlineOffset: 2 } : undefined}
        />
      </button>

      {opened && current ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <button className="btn btnGhost" style={{ position: "absolute", top: 16, right: 16 }} onClick={() => setOpened(false)}>Закрыть</button>
          <button className="btn btnGhost" disabled={index === 0} onClick={() => setIndex((prev) => Math.max(0, prev - 1))}>←</button>
          <div style={{ maxWidth: "90vw", maxHeight: "85vh", margin: "0 12px" }}>
            {current.media_type === "video" ? (
              <video src={current.media_url} controls playsInline preload="metadata" style={{ maxWidth: "90vw", maxHeight: "80vh" }} />
            ) : (
              <img src={current.media_url} alt="story" style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain" }} />
            )}
          </div>
          <button className="btn btnGhost" disabled={index >= items.length - 1} onClick={() => setIndex((prev) => Math.min(items.length - 1, prev + 1))}>→</button>
        </div>
      ) : null}
    </>
  );
}
