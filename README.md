# NeuroBoost: Telegram Bot & Mini App (@DonDearOfficina)

Комплексная медицинско-фармацевтическая система от дипломированного провизора-химика **@DonDearOfficina**.

## 🧠 Ключевая концепция
1. **1-й месяц (ЖКТ и желчеотток):** Омез ДСР, Урсосан (УДХК), Хофитол, Креон 10 000, Ребагит.
2. **Система комплексных тренировок с приоритетом ног:** 45–60 минут, старт с икроножных мышц и приседаний в отказ для снятия застоев малого таза и мощного запуска гормонального фона.
3. **Нейробуст и микронутриенты длительного цикла:** Фенотропил (2 мес), Глиатилин, Креатин, Цитруллин (>6–12 мес), кофакторы (Ферлатум Фол, Цинк, D3+K2).
4. **Супер-Ассистент:** Экспертные разборы по модели Cause-First со ссылками на PubMed/PMID и уровнями доказательности A–F.

## 🛠️ Стек технологий
- **Backend:** Node.js (v20+), Express, `@google/genai` (Gemini 2.5 Flash), Live Long-Polling Telegram Bot API.
- **Frontend:** React 19, Vite, Tailwind CSS, Telegram WebApp SDK.
- **Production Build:** esbuild + Vite SSR/SPA bundle.
- **24/7 Uptime & Anti-Sleep:** Встроенный self-ping heartbeat каждые 4 мин, Telegram Watchdog с авто-переподключением.

## 🚀 Развертывание на Railway (24/7 Без засыпания)
Подробная пошаговая инструкция доступна в файле [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md).

```bash
# Сборка проекта
npm run build

# Запуск в проде
npm start
```

## 🤖 Подключение Telegram-бота
- Бот: **[@DonDearOfficina_bot](https://t.me/DonDearOfficina_bot)**
- Автор: **[@DonDearOfficina](https://t.me/DonDearOfficina)**
- Дисклеймер: *Личный опыт, разбор открытых данных.*
