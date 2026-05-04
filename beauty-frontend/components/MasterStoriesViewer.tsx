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
        <div className="storiesViewerOverlay">
          <button className="btn btnGhost storiesViewerClose" onClick={() => setOpened(false)}>Закрыть</button>
          <div className="storiesViewerCounter">{index + 1} / {items.length}</div>
          <button className="btn btnGhost storiesViewerNav storiesViewerNavPrev" disabled={index === 0} onClick={() => setIndex((prev) => Math.max(0, prev - 1))}>←</button>
          <div className="storiesViewerMediaWrap">
            {current.media_type === "video" ? (
              <video className="storiesViewerMedia" src={current.media_url} controls playsInline preload="metadata" />
            ) : (
              <img className="storiesViewerMedia" src={current.media_url} alt="story" />
            )}
          </div>
          <button className="btn btnGhost storiesViewerNav storiesViewerNavNext" disabled={index >= items.length - 1} onClick={() => setIndex((prev) => Math.min(items.length - 1, prev + 1))}>→</button>
        </div>
      ) : null}
    </>
  );
}
