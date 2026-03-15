export function adTypeLabel(value?: string) {
  switch ((value || "").toLowerCase()) {
    case "service":
      return "Частный мастер";
    case "cabinet":
      return "Кабинет";
    case "salon":
      return "Салон";
    default:
      return value || "Тип не указан";
  }
}

export function readableApiError(errorText: string) {
  if (errorText.includes("invalid request data")) return "Проверьте правильность заполнения формы.";
  if (errorText.includes("old password is incorrect")) return "Неверный текущий пароль.";
  if (errorText.includes("confirmation do not match")) return "Новый пароль и подтверждение не совпадают.";
  if (errorText.includes("must differ from old")) return "Новый пароль должен отличаться от текущего.";
  if (errorText.includes("personal data consent")) return "Нужно подтвердить согласие на обработку персональных данных.";
  if (errorText.includes("category_id")) return "Выберите направление работы.";
  if (errorText.includes("full_name")) return "Заполните поле «Как к вам обращаться»";
  if (errorText.includes("description")) return "Добавьте описание о себе.";
  if (errorText.includes("services")) return "Укажите ваши услуги.";
  if (errorText.includes("phone or social_links")) return "Укажите телефон или ссылку на мессенджер.";
  if (errorText.includes("сначала заполните профиль")) return "Сначала заполните и отправьте профиль мастера.";
  if (errorText.includes("модерации или отклонён")) return "Профиль пока не одобрен. После одобрения раздел объявлений откроется.";
  return errorText;
}

export function moderationStatusLabel(value?: string) {
  switch ((value || "").toLowerCase()) {
    case "pending":
      return "На модерации";
    case "approved":
      return "Одобрено";
    case "rejected":
      return "Отклонено";
    case "active":
      return "Активно";
    default:
      return value || "Статус не указан";
  }
}
