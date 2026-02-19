'use client';

import { UiState } from '@/components/ui-state';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <UiState
      title="Не удалось открыть карточку мастера"
      description="Попробуйте снова через пару секунд."
      action={
        <button className="secondary-btn" onClick={reset}>
          Повторить
        </button>
      }
    />
  );
}
