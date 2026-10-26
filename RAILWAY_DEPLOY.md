# Инструкция по развертыванию NeuroBoost на Railway через GitHub (24/7 Без засыпания)

В проект встроена комплексная система **24/7 Uptime & Anti-Sleep**, которая гарантирует, что Telegram-бот **@DonDearOfficina_bot** и веб-приложение (Telegram Mini App) работают непрерывно, не засыпают и автоматически восстанавливаются при любых сетевых сбоях.

---

## 🛡️ Как реализована защита от засыпания

1. **Встроенный Anti-Sleep Heartbeat (Self-Ping каждые 4 минуты)**:
   - Сервер автоматически пингует свой собственный эндпоинт `/api/ping`.
   - Это создает постоянную активность сетевого стека, предотвращая сваливание контейнера в idle/sleep режим на облачных платформах.
2. **Watchdog Long-Polling Telegram**:
   - Если Telegram API временно недоступен или происходит сброс TLS-соединения, бот **не падает и не завершает процесс**, а выполняет авто-переподключение с экспоненциальной задержкой (от 1.5 до 15 секунд).
   - Каждые 3 минуты в логи пишется контрольный статус пульса (`💓 [Telegram Watchdog Heartbeat] Status: ONLINE`).
3. **Защита процесса (Anti-Crash Guard)**:
   - Встроены глобальные перехватчики `uncaughtException` и `unhandledRejection`, предотвращающие остановку Node.js при неожиданных ошибках сети.
4. **Автоматический перезапуск Railway (`railway.json`)**:
   - Политика перезапуска `ON_FAILURE` (до 10 повторов).
   - Healthcheck на эндпоинт `/api/health` со сбором телеметрии памяти, аптайма и статуса бота.

---

## 🚀 Пошаговая инструкция развертывания

### Шаг 1. Загрузка кода в GitHub

В папке проекта выполните команды в терминале:

```bash
# 1. Инициализация репозитория (если еще не создан)
git init

# 2. Добавление всех файлов (.env с секретами уже исключен через .gitignore)
git add .

# 3. Фиксация коммита
git commit -m "feat: neuroboost telegram bot 24/7 deployment for railway"

# 4. Переименование ветки в main
git branch -M main

# 5. Привязка вашего GitHub репозитория (замените URL на ваш)
git remote add origin https://github.com/ВАШ_ПОЛЬЗОВАТЕЛЬ/neuroboost-bot.git

# 6. Отправка в GitHub
git push -u origin main
```

---

### Шаг 2. Создание проекта на Railway

1. Перейдите на [railway.app](https://railway.app) и авторизуйтесь (через GitHub).
2. Нажмите кнопку **«+ New Project»**.
3. Выберите **«Deploy from GitHub repo»**.
4. Выберите ваш созданный репозиторий `neuroboost-bot`.
5. Railway автоматически обнаружит файл `railway.json` и начнет сборку (`npm run build`).

---

### Шаг 3. Настройка переменных окружения (Variables) в Railway

В панели Railway перейдите во вкладку **«Variables»** вашего сервиса и добавьте следующие ключи:

| Имя переменной | Значение | Описание |
| :--- | :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | `8786941443:AAGpgiMyD1tBW5NhluhDf0KmKsczag2D7QI` | Токен бота @DonDearOfficina_bot |
| `APP_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` | URL вашего приложения (или введите вручную после генерации домена) |
| `NODE_ENV` | `production` | Режим работы Node.js |
| `PORT` | `3000` | Порт сервера (Railway также задает его автоматически) |
| `GEMINI_API_KEY` | *(Опционально)* | Ваш ключ Gemini API для ответов AI-ассистента |

> 💡 **Совет:** Переменная `${{RAILWAY_PUBLIC_DOMAIN}}` в Railway автоматически подставит ваш созданный домен.

---

### Шаг 4. Включение публичного домена в Railway

1. В панели Railway перейдите в **Settings** (Настройки сервиса).
2. Прокрутите до раздела **Networking** -> **Public Networking**.
3. Нажмите кнопку **«Generate Domain»**.
4. Скопируйте созданный адрес вида: `https://neuroboost-production-xxxx.up.railway.app`.

---

### Шаг 5. Привязка меню Telegram Mini App в @BotFather

После получения домена на Railway обновите кнопку меню бота:

1. Откройте в Telegram **[@BotFather](https://t.me/BotFather)**.
2. Отправьте команду:
   ```text
   /setmenubutton
   ```
3. Выберите бота: `@DonDearOfficina_bot`.
4. Введите ваш адрес из Railway:
   ```text
   https://ваш-проект.up.railway.app
   ```
5. Введите название кнопки:
   ```text
   💊 NeuroBoost App
   ```

---

## 🔍 Проверка работоспособности 24/7

После завершения деплоя вы можете проверить статус в браузере или через curl:

- **Проверка статуса бота и сервера**:  
  `https://ваш-проект.up.railway.app/api/health`  
  *(Возвращает JSON с `serverUptimeSeconds`, `bot.isRunning: true`, количеством обработанных сообщений и объемом памяти)*.

- **Легковесный эндпоинт пинга**:  
  `https://ваш-проект.up.railway.app/api/ping`  
  *(Возвращает `PONG`)*.

---

## ⚡ Дополнительная страховка (Внешний бесплатный Uptime-монитор)

Хотя внутренний Anti-Sleep Heartbeat уже каждые 4 минуты поддерживает активность, вы можете бесплатно настроить внешний пинг (fail-safe 100% гарантия):

1. Зарегистрируйтесь на бесплатном сервисе [uptimerobot.com](https://uptimerobot.com) или [cron-job.org](https://cron-job.org).
2. Добавьте новый монитор:
   - **Type**: `HTTP(s)`
   - **URL**: `https://ваш-проект.up.railway.app/api/health`
   - **Monitoring Interval**: `5 minutes`
3. Теперь внешний сервис будет опрашивать сервер круглосуточно, исключая остановку даже на бесплатных тарифах любых хостингов.
