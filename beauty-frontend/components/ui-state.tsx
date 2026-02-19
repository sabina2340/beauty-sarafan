interface UiStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function UiState({ title, description, action }: UiStateProps) {
  return (
    <section className="ui-state" aria-live="polite">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </section>
  );
}
