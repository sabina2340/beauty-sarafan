"use client";

import { MasterStoriesViewer } from "@/components/MasterStoriesViewer";
import type { MasterCard } from "@/lib/types";

type Props = {
  masters: MasterCard[];
};

export function StoriesFeed({ masters }: Props) {
  const items = Array.isArray(masters)
    ? masters.filter((master) => master.has_active_stories)
    : [];

  if (!items.length) return null;

  return (
    <section className="card storiesFeed" aria-label="Сторис мастеров">
      <h2 className="h3">Сторис</h2>
      <div className="storiesFeedRow">
        {items.map((master) => (
          <div key={master.user_id} className="storiesFeedItem">
            <MasterStoriesViewer
              masterId={String(master.user_id)}
              avatarUrl={master.avatar_url}
              fullName={master.full_name || master.login}
              hasActiveStories={master.has_active_stories}
            />
            <p className="storiesFeedName">{master.full_name || master.login}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
