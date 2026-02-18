# Beauty Frontend (Stage 1)

Публичная часть:
- `/` — главная с CTA «Найти мастера»
- `/masters` — каталог мастеров с фильтрами `slug`, `city`, `q`
- `/masters/:id` — карточка мастера (описание, услуги, контакты, опционально объявления)

## Запуск

```bash
cp .env.example .env.local
npm install
npm run dev
```

Фронт ожидает API на `VITE_API_URL` (по умолчанию `http://localhost:8080`).
