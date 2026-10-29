# Инструкция по развертыванию NeuroBoost на Railway (24/7 Без засыпания)

Telegram-бот **@DonDearOfficina_bot** подготовлен для непрерывной круглосуточной работы в облаке Railway с защитой от ухода в спящий режим и автоматическим перезапуском при сбоях.

---

## 🛡️ Архитектура устойчивости 24/7

1. **Dual Anti-Sleep Keep-Alive**:
   - Внутренний loopback-пинг (`http://127.0.0.1:3000/api/ping`) каждые 3 минуты держит сокет и event loop Node.js активными.
   - Внешний публичный пинг (`${APP_URL}/api/ping`) через edge-прокси Railway предотвращает idle-таймауты контейнера.
2. **Watchdog Long-Polling**:
   - Автоматический перехват сетевых таймаутов, Telegram 429 и TLS-сбросов с экспоненциальной задержкой переподключения (1.5–15 сек).
   - Защита от дублирующих сессий polling (обработка 409 Conflict).
3. **Anti-Crash Guards**:
   - Глобальные обработчики `process.on('uncaughtException')` и `process.on('unhandledRejection')`.
4. **Конфигурация Railway (`railway.json`)**:
   - Политика перезапуска `ON_FAILURE` (до 10 повторов).
   - Healthcheck на эндпоинт `/api/health`.

---

## 🚀 Пошаговая инструкция развертывания

### Шаг 1. Подготовка репозитория GitHub

1. Репозиторий должен быть переведен в режим **Private** в настройках GitHub:
   - Перейдите в GitHub ➔ `Settings` репозитория ➔ раздел `Danger Zone` ➔ `Change visibility` ➔ **Make private**.
2. Убедитесь, что файл `.env` не попадает в git (он добавлен в `.gitignore`).
3. Зафиксируйте и отправьте изменения:
   ```bash
   git add .
   git commit -m "feat: complete native telegram bot with persistent storage"
   git push origin main
   ```

---

### Шаг 2. Создание проекта на Railway

1. Перейдите на [railway.app](https://railway.app) и авторизуйтесь через GitHub.
2. Нажмите кнопку **«+ New Project»**.
3. Выберите **«Deploy from GitHub repo»**.
4. Выберите ваш репозиторий `neuroboost-bot` (или `NeyroBust1`).
5. Если репозиторий приватный, предоставьте Railway доступ к чтению репозитория через GitHub App интеграцию.

---

### Шаг 3. Добавление постоянного диска (Persistent Volume)

Для сохранения сессий Telegram, дневника веса и чек-листов между перезапусками контейнера:
1. В настройках сервиса в Railway перейдите во вкладку **Volumes**.
2. Нажмите **«Add Volume»**.
3. Укажите точку монтирования: `/app/data` (или путь, соответствующий рабочей директории приложения).

---

### Шаг 4. Настройка переменных окружения (Variables) в Railway

В панели Railway перейдите во вкладку **«Variables»** сервиса и добавьте следующие ключи:

| Имя переменной | Пример значения | Описание |
| :--- | :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | *ваш_токен_из_BotFather* | Секретный токен бота от @BotFather (не публикуйте его в чатах и git!) |
| `APP_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` | Публичный URL сервиса для keep-alive пинга |
| `NODE_ENV` | `production` | Режим работы Node.js |
| `PORT` | `3000` | Порт сервера |
| `INSTAGRAM_ACCESS_TOKEN` | *(Опционально)* | Meta Graph API токен для автоворонки Direct |
| `INSTAGRAM_APP_SECRET` | *(Опционально)* | Meta App Secret для HMAC-SHA256 верификации webhook |
| `INSTAGRAM_VERIFY_TOKEN` | *(Опционально)* | Токен подтверждения подписки Meta Webhook |

> ⚠️ **Важно по безопасности:** Если старый токен когда-либо публиковался в открытом доступе, отзовите его в **[@BotFather](https://t.me/BotFather)** командой `/revoke`, получите новый и вставьте исключительно в Variables панели хостинга!

---

### Шаг 5. Включение публичного домена в Railway

1. Перейдите в **Settings** сервиса на Railway.
2. В разделе **Networking** ➔ **Public Networking** нажмите **«Generate Domain»**.
3. Скопируйте созданный URL вида: `https://neuroboost-production.up.railway.app`.
4. Проверьте работоспособность эндпоинта здоровья: `https://neuroboost-production.up.railway.app/api/health`.

---

### Шаг 6. Настройка команд в @BotFather

Команды бота автоматически регистрируются в Telegram API при старте сервиса. Вы также можете обновить описание профиля в [@BotFather](https://t.me/BotFather):

1. Команда `/setdescription`:
   ```text
   Официальный бот авторского курса дипломированного провизора-химика @DonDearOfficina: этапы ЖКТ, Нейробуст (6+ мес), Фенотропил (2 мес), водный баланс, похудение и питание, система тренировок.
   ```
2. Команда `/setcommands`:
   ```text
   start - Главное меню и старт курса
   course - 🎯 Программа авторского курса
   auxiliary - 📦 Вспомогательные препараты и БАДы
   nutrition - ⚖️ Похудение и питание
   workout - 🏋️ Система тренировок
   materials - 📚 Материалы автора
   profile - 👤 Мой профиль и прогресс
   weight - ⚖️ Внести вес (напр. /weight 82.5)
   dondear - 📩 Связаться с @DonDearOfficina
   ```
