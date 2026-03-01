export function LoadingState({ text = "Загрузка..." }: { text?: string }) {
  return <p className="state stateLoading">{text}</p>;
}
