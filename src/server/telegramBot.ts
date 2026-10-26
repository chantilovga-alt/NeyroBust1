import { GoogleGenAI } from '@google/genai';
import { INITIAL_MEDICATIONS } from '../data/seedMedications';
import { INITIAL_WORKOUT_EXERCISES, WORKOUT_PHILOSOPHY } from '../data/seedWorkout';
import { INITIAL_KNOWLEDGE_NOTES } from '../data/seedKnowledgeNotes';
import { INITIAL_ISLAMIC_REMEDIES } from '../data/seedIslamicRemedies';
import { Medication } from '../types';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
      text?: string;
    };
    data?: string;
  };
}

export interface BotTelemetry {
  isRunning: boolean;
  startTime: string;
  uptimeSeconds: number;
  lastPollTimestamp: string;
  totalUpdatesProcessed: number;
  consecutiveErrors: number;
  lastError: string | null;
  botUsername: string;
}

const RED_FLAGS = [
  'острая боль',
  'черный стул',
  'мелена',
  'рвота с кровью',
  'потеря сознания',
  'давление 180',
  'давление 200',
  'загрудинная боль',
  'боль в груди',
  'онемение половины лица',
  'слабость в руке',
  'спутанность сознания',
  'судороги',
];

const botTelemetry: BotTelemetry = {
  isRunning: false,
  startTime: new Date().toISOString(),
  uptimeSeconds: 0,
  lastPollTimestamp: 'never',
  totalUpdatesProcessed: 0,
  consecutiveErrors: 0,
  lastError: null,
  botUsername: 'DonDearOfficina_bot',
};

// In-Memory User State Tracker
interface UserSession {
  onAuthorProtocol: boolean;
  currentPhase: 1 | 2 | 3 | 4;
  startDate: string;
  gastroDayChecks: Record<string, boolean>;
  workoutCompleted: Record<string, boolean>;
}

const userSessions = new Map<number, UserSession>();

function getUserSession(userId: number): UserSession {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, {
      onAuthorProtocol: true,
      currentPhase: 1,
      startDate: new Date().toISOString().split('T')[0],
      gastroDayChecks: {},
      workoutCompleted: {},
    });
  }
  return userSessions.get(userId)!;
}

export function getTelegramBotStatus(): BotTelemetry {
  return {
    ...botTelemetry,
    uptimeSeconds: Math.floor((Date.now() - new Date(botTelemetry.startTime).getTime()) / 1000),
  };
}

export function startTelegramBot(
  token: string,
  appUrl: string,
  systemInstruction: string,
  geminiApiKey?: string
) {
  let offset = 0;
  let isRunning = true;
  botTelemetry.isRunning = true;
  botTelemetry.startTime = new Date().toISOString();
  const baseUrl = `https://api.telegram.org/bot${token}`;

  console.log(`🤖 [Telegram Bot] Initializing for @${botTelemetry.botUsername}...`);

  // Helper: call Telegram API
  async function apiCall(method: string, body: any) {
    try {
      const res = await fetch(`${baseUrl}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch (e: any) {
      console.warn(`Telegram API call notice on ${method}:`, e.message || e);
      return null;
    }
  }

  async function answerCallback(callbackQueryId: string, text?: string) {
    return apiCall('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
    });
  }

  async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
    return apiCall('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
      disable_web_page_preview: false,
    });
  }

  async function editMessage(chatId: number, messageId: number, text: string, replyMarkup?: any) {
    const res = await apiCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
      disable_web_page_preview: false,
    });
    if (!res?.ok) {
      return sendMessage(chatId, text, replyMarkup);
    }
    return res;
  }

  // Set bot commands in Telegram
  async function registerCommands() {
    await apiCall('setMyCommands', {
      commands: [
        { command: 'start', description: '🏠 Главное меню' },
        { command: 'course', description: '🎯 Начать авторский курс' },
        { command: 'auxiliary', description: '📦 Вспомогательные препараты и БАДы' },
        { command: 'workout', description: '🏋️ Система тренировок с ногами' },
        { command: 'knowledge', description: '📚 База знаний' },
        { command: 'islamic', description: '🕌 Исламская медицина' },
        { command: 'assistant', description: '🤖 Супер-Ассистент' },
        { command: 'app', description: '📱 Открыть Mini App' },
        { command: 'profile', description: '👤 Мой профиль' },
        { command: 'dondear', description: '📩 Связаться с @DonDearOfficina' },
      ],
    });
  }
  registerCommands().catch(() => {});

  // =========================================================================
  // 1. ГЛАВНОЕ МЕНЮ (С ОДНОЙ ГЛАВНОЙ КНОПКОЙ «НАЧАТЬ АВТОРСКИЙ КУРС»)
  // =========================================================================
  function getMainMenuView(userId: number) {
    const session = getUserSession(userId);

    const text =
      `👋 <b>Добро пожаловать в систему NeuroBoost!</b>\n\n` +
      `Официальный бот и программа дипломированного провизора-химика <a href="https://t.me/DonDearOfficina">@DonDearOfficina</a>.\n\n` +
      `<b>⚙️ Архитектура системы:</b>\n` +
      `Весь авторский курс объединен в единую последовательную программу, которая начинается с кнопки <b>«Начать авторский курс»</b> ниже.\n\n` +
      `• <b>1-й этап:</b> Настройка ЖКТ и желчеоттока (1-й месяц — фундамент всасывания).\n` +
      `• <b>2-й этап:</b> Подключение Нейробуста (2-й месяц, базовый длительный прием от 6 месяцев).\n` +
      `• <b>3-й этап:</b> Двухмесячный этап с Фенотропилом (3-й и 4-й месяцы).\n\n` +
      `Все остальные добавки и средства вынесены в отдельный структурированный каталог <b>«Вспомогательные препараты и БАДы»</b>.\n\n` +
      `<i>Личный опыт, разбор открытых данных.</i>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🎯 Начать авторский курс', callback_data: 'nav_course_root' }],
        [{ text: '📦 Вспомогательные препараты и БАДы', callback_data: 'nav_auxiliary_root' }],
        [
          { text: '🏋️ Система тренировок', callback_data: 'nav_workout' },
          { text: '📚 База знаний', callback_data: 'nav_knowledge' },
        ],
        [
          { text: '🕌 Исламская медицина', callback_data: 'nav_islamic' },
          { text: '🤖 Супер-Ассистент', callback_data: 'nav_assistant' },
        ],
        [
          { text: '📱 Открыть NeuroBoost Mini App', web_app: { url: appUrl } },
        ],
        [
          { text: '👤 Мой профиль', callback_data: 'nav_profile' },
          { text: '📩 Автор @DonDearOfficina', callback_data: 'nav_dondear' },
        ],
      ],
    };

    return { text, keyboard };
  }

  // =========================================================================
  // 2. РАЗДЕЛ «НАЧАТЬ АВТОРСКИЙ КУРС» (ЕДИНАЯ ПОСЛЕДОВАТЕЛЬНАЯ ПРОГРАММА)
  // =========================================================================
  function getCourseOverviewView() {
    const text =
      `<b>🎯 АВТОРСКИЙ КУРС @DonDearOfficina</b>\n` +
      `<i>Единая последовательная программа оптимизации нейросистемы</i>\n\n` +
      `Курс строится строго по каскадному принципу Cause-First:\n\n` +
      `<b>1️⃣ Первый месяц — «Настройка ЖКТ и желчеоттока»</b>\n` +
      `• <i>Компоненты:</i> Хофитол, Полисорб (минимум 3 недели), Энтерол.\n` +
      `• <i>Альтернатива при камнях:</i> Урсосан (УДХК) — строго по УЗИ, не универсально.\n` +
      `• <i>Цель:</i> Запуск желчеоттока, эмульгация липидов, ликвидация эндотоксикоза и укрепление кишечного барьера.\n\n` +
      `<b>2️⃣ Второй месяц — «Подключение Нейробуста и основных компонентов»</b>\n` +
      `• <i>Компоненты:</i> Нейробуст, L-Цитруллин, Креатин, Глиатилин (холина альфосцерат).\n` +
      `• <b>ВАЖНО:</b> Цитруллин, Креатин и Глиатилин принимаются <b>минимум 6 месяцев</b> (от 6 до 12 месяцев)! Второй месяц обозначает точку их подключения, а не окончания!\n` +
      `• <i>Цель:</i> Насыщение пула ацетилхолина, энергетическая буферизация АТФ и эндотелиальный оксид азота.\n\n` +
      `<b>3️⃣ Третий и четвёртый месяцы — «Двухмесячный этап с Фенотропилом»</b>\n` +
      `• <i>Компоненты:</i> Фенотропил (Фонтурацетам).\n` +
      `• <i>Продолжительность этапа:</i> <b>Ровно 2 месяца</b> (3-й месяц — начало, 4-й месяц — продолжение).\n` +
      `• <i>Связка:</i> Принимается СТРОГО на фоне продолжающегося приема компонентов 2-го месяца (Глиатилин, Креатин, Цитруллин)!\n\n` +
      `<i>Выберите этап ниже для подробного изучения регламента, инструкций и личного опыта автора:</i>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🫄 Этап 1: Настройка ЖКТ и желчеоттока (1-й мес)', callback_data: 'course_stage_1' }],
        [{ text: '🧠 Этап 2: Подключение Нейробуста (2-й мес, 6+ мес)', callback_data: 'course_stage_2' }],
        [{ text: '⚡ Этап 3: Этап с Фенотропилом (3-й и 4-й мес)', callback_data: 'course_stage_3' }],
        [
          { text: '🔄 Схема-таймлайн курса', callback_data: 'course_timeline' },
          { text: '📦 Вспомогательные БАДы', callback_data: 'nav_auxiliary_root' },
        ],
        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
      ],
    };

    return { text, keyboard };
  }

  // 2.1 Этап 1: Настройка ЖКТ и желчеоттока
  function getStage1View() {
    const text =
      `<b>🫄 ЭТАП 1: НАСТРОЙКА ЖКТ И ЖЕЛЧЕОТТОКА (1-Й МЕСЯЦ)</b>\n\n` +
      `<b>Основная концепция этапа:</b>\n` +
      `Без работающего ЖКТ все расчеты по ноотропам и микронутриентам бессмысленны. Если нарушен отток желчи, жирорастворимые молекулы транзитируются, а бактериальный эндотоксин (ЛПС) вызывает системное нейровоспаление.\n\n` +
      `<b>📋 Базовый авторский стек:</b>\n\n` +
      `1. <b>ХОФИТОЛ</b> (экстракт листьев артишока)\n` +
      `• <i>По инструкции:</i> 2–3 таб. 3 раза в сутки перед едой, курс 2–3 недели.\n` +
      `• <i>Личный опыт автора:</i> 2 таблетки 3 раза в день строго за 20 мин до еды курсом 20–30 дней.\n` +
      `• <i>Ограничения:</i> Обязательно исключить камни по УЗИ ОБП (риск обтурации протока).\n\n` +
      `2. <b>ПОЛИСОРБ МП</b> (коллоидный диоксид кремния)\n` +
      `• <i>По инструкции:</i> водная суспензия (1–2 ст. ложки) за 1–1.5 часа до/после еды и лекарств.\n` +
      `• <i>Личный опыт автора:</i> <b>применяется в авторской концепции минимум три недели</b> для глубокого снижения токсической нагрузки.\n` +
      `• <i>Ограничения:</i> Обязательно разносить по времени с Хофитолом и Энтеролом на 1.5–2 часа!\n\n` +
      `3. <b>ЭНТЕРОЛ</b> (Saccharomyces boulardii)\n` +
      `• <i>По инструкции:</i> 1–2 капс. 2 раза в сутки за 1 час до еды, курс 7–30 дней.\n` +
      `• <i>Личный опыт автора:</i> 250 мг 2 раза в день за 1 час до еды (14–30 дней).\n` +
      `• <i>Назначение:</i> Укрепление плотных контактов энтероцитов (tight junctions).\n\n` +
      `<b>⚠️ Предусмотренная автором альтернатива при камнях:</b>\n` +
      `• <b>Урсосан (УДХК):</b> предусмотрен автором как <i>альтернатива Хофитолу при наличии конкрементов в желчном пузыре</i>. <b>Не является универсальной рекомендацией для всех пациентов</b>, требует контроля УЗИ ОБП и врача!\n\n` +
      `<i>Из базового стека автором исключены Ребагит, Креон 10 000 и Омез ДСР (они вынесены во вспомогательный раздел).</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🌿 Карточка Хофитола', callback_data: 'med_view_1' },
          { text: '🌪️ Карточка Полисорба', callback_data: 'med_view_4' },
        ],
        [
          { text: '🛡️ Карточка Энтерола', callback_data: 'med_view_2' },
          { text: '⚠️ Урсосан (альтернатива)', callback_data: 'med_view_10' },
        ],
        [
          { text: '➡️ Перейти ко 2-му месяцу', callback_data: 'course_stage_2' },
        ],
        [
          { text: '🔙 К обзору курса', callback_data: 'nav_course_root' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  // 2.2 Этап 2: Подключение Нейробуста и основных компонентов
  function getStage2View() {
    const text =
      `<b>🧠 ЭТАП 2: ПОДКЛЮЧЕНИЕ НЕЙРОБУСТА И ОСНОВНЫХ КОМПОНЕНТОВ (2-Й МЕСЯЦ)</b>\n\n` +
      `<b>Важнейший принцип авторского курса:</b>\n` +
      `Второй месяц обозначает <b>момент подключения</b> базовых метаболических молекул, а не окончание их приёма! Согласно авторскому замыслу, Цитруллин, Креатин и Глиатилин принимаются <b>МИНИМУМ ШЕСТЬ МЕСЯЦЕВ</b> (от 6 до 12 месяцев) непрерывно.\n\n` +
      `<b>📋 Компоненты этапа:</b>\n\n` +
      `1. <b>ГЛИАТИЛИН</b> (холина альфосцерат)\n` +
      `• <i>Продолжительность:</i> <b>Минимум 6 месяцев</b> (длительный базовый прием).\n` +
      `• <i>По инструкции:</i> 400 мг 2–3 раза в сутки до еды.\n` +
      `• <i>Личный опыт автора:</i> 400 мг 2 раза в день за 30 мин до еды в первой половине дня.\n` +
      `• <i>Зачем в курсе:</i> Субстрат ацетилхолина. Принимается во 2-й месяц СТРОГО ДО стимуляторов, чтобы заблаговременно насытить синапсы.\n\n` +
      `2. <b>КРЕАТИН МОНОГИДРАТ</b>\n` +
      `• <i>Продолжительность:</i> <b>Минимум 6 месяцев</b> (постоянный энергетический буфер).\n` +
      `• <i>По инструкции:</i> 3–5 г в сутки с водой или соком.\n` +
      `• <i>Личный опыт автора:</i> 5 г каждое утро натощак.\n` +
      `• <i>Зачем в курсе:</i> Ресинтез АТФ для мозга и поддержка отказных приседаний.\n\n` +
      `3. <b>L-ЦИТРУЛЛИН</b>\n` +
      `• <i>Продолжительность:</i> <b>Минимум 6 месяцев</b> (длительная сосудистая база).\n` +
      `• <i>По инструкции:</i> 3–6 г в сутки.\n` +
      `• <i>Личный опыт автора:</i> 3–5 г утром натощак совместно с креатином.\n` +
      `• <i>Зачем в курсе:</i> Синтез оксида азота (NO), снятие венозного стаза малого таза.\n\n` +
      `4. <b>НЕЙРОБУСТ (авторский стек)</b>\n` +
      `• Синергия субстрата (Глиатилин) + энергии (Креатин) + микроциркуляции (Цитруллин).\n\n` +
      `<i>Этот стек продолжается на 3-м и 4-м месяцах и далее!</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🧠 Глиатилин (6+ мес)', callback_data: 'med_view_6' },
          { text: '⚡ Креатин (6+ мес)', callback_data: 'med_view_7' },
        ],
        [
          { text: '🩸 L-Цитруллин (6+ мес)', callback_data: 'med_view_8' },
          { text: '🚀 Стек Нейробуст', callback_data: 'med_view_9' },
        ],
        [
          { text: '⬅️ Этап 1 (ЖКТ)', callback_data: 'course_stage_1' },
          { text: '➡️ Этап 3 (Фенотропил)', callback_data: 'course_stage_3' },
        ],
        [
          { text: '🔙 К обзору курса', callback_data: 'nav_course_root' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  // 2.3 Этап 3: Третий и четвёртый месяцы — Двухмесячный этап с Фенотропилом
  function getStage3View() {
    const text =
      `<b>⚡ ЭТАП 3: ДВУХМЕСЯЧНЫЙ ЭТАП С ФЕНОТРОПИЛОМ (3-Й И 4-Й МЕСЯЦЫ)</b>\n\n` +
      `На третьем месяце авторского курса подключается Фенотропил.\n\n` +
      `<b>Регламент этапа:</b>\n` +
      `• <b>Продолжительность: ровно два месяца</b> (3-й месяц — начало, 4-й месяц — продолжение).\n` +
      `• Для 4-го месяца не создается отдельный курс — он является прямым продолжением начатого этапа.\n\n` +
      `<b>📋 ФЕНОТРОПИЛ (Фонтурацетам):</b>\n` +
      `• <i>По инструкции производителя:</i> разовая доза 100–250 мг, суточная 200–300 мг утром после еды. Длительность курса лечения от 30 дней до 2 месяцев. Не принимать позднее 15:00.\n` +
      `• <i>Личный опыт автора:</i> 100 мг утром натощак курсом ровно 2 месяца (3-й и 4-й месяцы курса).\n` +
      `• <b>Ключевое условие безопасности:</b> Фенотропил принимается СТРОГО ПОСЛЕ предшествующего насыщения пула ацетилхолина Глиатилином на 2-м месяце. Стимуляция без холина ведет к истощению синапса!\n\n` +
      `<b>🔄 Параллельная поддержка:</b>\n` +
      `На протяжении 3-го и 4-го месяцев <b>продолжается прием компонентов 2-го месяца</b> (Глиатилин, Креатин, Цитруллин), которые рассчитаны минимум на 6 месяцев!\n\n` +
      `<b>📌 Последующие варианты (вне основного курса):</b>\n` +
      `В концепции автора после завершения этапа с Фенотропилом описана последовательность: сначала Пирацетам, затем <b>Ноопепт</b> (ранее ошибочно названный «Апепт»), а далее возможность рассмотрения других ноотропов. Они не назначаются автоматически и вынесены в раздел вспомогательных средств.`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '💊 Карточка Фенотропила (2 мес)', callback_data: 'med_view_5' }],
        [
          { text: '⬅️ Этап 2 (Нейробуст)', callback_data: 'course_stage_2' },
          { text: '🔄 Схема-таймлайн', callback_data: 'course_timeline' },
        ],
        [
          { text: '📦 Вспомогательные препараты', callback_data: 'nav_auxiliary_root' },
          { text: '🔙 К обзору курса', callback_data: 'nav_course_root' },
        ],
        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
      ],
    };

    return { text, keyboard };
  }

  // 2.4 Общая таймлайн-схема курса
  function getCourseTimelineView() {
    const text =
      `<b>🔄 ОБЩАЯ СХЕМА-ТАЙМЛАЙН АВТОРСКОГО КУРСА</b>\n\n` +
      `┌─ <b>1-Й МЕСЯЦ: НАСТРОЙКА ЖКТ</b>\n` +
      `│  • Хофитол (2 таб. × 3 р/д за 20 мин)\n` +
      `│  • Полисорб (минимум 3 недели, отдельно на 1.5–2 ч)\n` +
      `│  • Энтерол (250 мг × 2 р/д за 1 ч)\n` +
      `│  <i>(Урсосан — только альтернатива при камнях по УЗИ)</i>\n` +
      `└────────────────────────────────────────\n\n` +
      `┌─ <b>2-Й МЕСЯЦ: СТАРТ НЕЙРОБУСТА (ДЛИТЕЛЬНЫЙ СТЕК 6+ МЕС)</b>\n` +
      `│  • Глиатилин (400 мг × 2 р/д) ──➔ <b>длится 6–12 месяцев</b>\n` +
      `│  • Креатин (5 г утром) ─────────➔ <b>длится 6–12 месяцев</b>\n` +
      `│  • L-Цитруллин (3–5 г утром) ───➔ <b>длится 6–12 месяцев</b>\n` +
      `└────────────────────────────────────────\n\n` +
      `┌─ <b>3-Й И 4-Й МЕСЯЦЫ: ЭТАП С ФЕНОТРОПИЛОМ (РОВНО 2 МЕС)</b>\n` +
      `│  • Фенотропил (100 мг утром) ──➔ <b>ровно 2 месяца</b>\n` +
      `│  • + параллельно продолжаются Глиатилин, Креатин, Цитруллин!\n` +
      `└────────────────────────────────────────\n\n` +
      `┌─ <b>ПОСЛЕ 4-ГО МЕСЯЦА:</b>\n` +
      `│  • Глиатилин, Креатин, Цитруллин продолжаются до 6–12 мес.\n` +
      `│  • Рассматриваются варианты: Пирацетам, далее Ноопепт (каталог вспомогательных средств).\n` +
      `└────────────────────────────────────────`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🫄 К 1-му этапу (ЖКТ)', callback_data: 'course_stage_1' }],
        [{ text: '🧠 Ко 2-му этапу (Нейробуст)', callback_data: 'course_stage_2' }],
        [{ text: '⚡ К 3-му этапу (Фенотропил)', callback_data: 'course_stage_3' }],
        [{ text: '🔙 К обзору курса', callback_data: 'nav_course_root' }],
        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
      ],
    };

    return { text, keyboard };
  }

  // =========================================================================
  // 3. РАЗДЕЛ «ВСПОМОГАТЕЛЬНЫЕ ПРЕПАРАТЫ И БАДЫ» (ОТДЕЛЬНЫЙ КАТАЛОГ)
  // =========================================================================
  function getAuxiliaryCatalogView() {
    const auxiliaryMeds = INITIAL_MEDICATIONS.filter((m) => !m.is_main_course);

    const text =
      `<b>📦 ВСПОМОГАТЕЛЬНЫЕ ПРЕПАРАТЫ И БАДЫ</b>\n\n` +
      `Структурированный каталог дополнительных препаратов и добавок, которые имеются в базе, но <b>не входят в основной 4-месячный курс</b>.\n\n` +
      `Они не назначаются всем автоматически, а рассматриваются индивидуально при наличии специфических показаний, по анализам крови или на последующих этапах.\n\n` +
      `<i>Нажмите на препарат для открытия подробной карточки из 7 подразделов (инструкция производителя, личный опыт автора, ограничения и связь с курсом):</i>`;

    const buttons = auxiliaryMeds.map((med) => [
      {
        text: `💊 ${med.name}`,
        callback_data: `med_view_${med.id}`,
      },
    ]);

    const keyboard = {
      inline_keyboard: [
        ...buttons,
        [{ text: '🎯 Начать авторский курс', callback_data: 'nav_course_root' }],
        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
      ],
    };

    return { text, keyboard };
  }

  // 3.1 Детальная карточка препарата (со всеми 7 подразделами)
  function getMedDetailView(medId: number) {
    const med = INITIAL_MEDICATIONS.find((m) => m.id === medId);
    if (!med) {
      return {
        text: '⚠️ Препарат не найден в базе данных.',
        keyboard: { inline_keyboard: [[{ text: '🔙 К списку', callback_data: 'nav_auxiliary_root' }]] },
      };
    }

    const legalLabel =
      med.legal_category_rf === 'medicine'
        ? 'Лекарственный препарат (ГРЛС РФ)'
        : med.legal_category_rf === 'vitamin_mineral'
        ? 'Витаминно-минеральный комплекс'
        : 'Биологически активная добавка (БАД)';

    const isCourse = med.is_main_course ? '🎯 Основной авторский курс' : '📦 Вспомогательный препарат / БАД';

    const text =
      `<b>1. Название:</b> <b>${med.name}</b>\n` +
      `<i>(Активное вещество: ${med.active_ingredient || 'Уточняется'})\n` +
      `Категория: ${legalLabel} | Статус: ${isCourse}</i>\n\n` +
      `<b>2. Для чего используется:</b>\n` +
      `${med.purpose || med.notes || 'Информация уточняется'}\n\n` +
      `<b>3. Когда рассматривается применение:</b>\n` +
      `${med.when_considered || med.why_in_stack || 'По индивидуальным показаниям'}\n\n` +
      `<b>4. Как принимать по инструкции (производитель):</b>\n` +
      `${med.instruction_usage || med.dose || 'Строго по официальной инструкции производителя'}\n\n` +
      `<b>5. Личный опыт автора:</b>\n` +
      `${med.personal_experience || 'Наблюдение автора, не заменяет консультацию врача'}\n\n` +
      `<b>6. Ограничения и предостережения:</b>\n` +
      `${med.precautions || 'Противопоказания по инструкции производителя'}\n\n` +
      `<b>7. Связь с основным курсом:</b>\n` +
      `${med.relation_to_main_course || 'Дополнительный компонент вне основного курса'}\n\n` +
      (med.evidence_refs?.length ? `<b>📚 Источники / PubMed:</b> ${med.evidence_refs.join(', ')}\n\n` : '') +
      `<i>Личный опыт автора не является доказательством для других людей. Это не медицинская рекомендация. Проконсультируйтесь со специалистом.</i>`;

    const backCallback = med.is_main_course ? 'nav_course_root' : 'nav_auxiliary_root';
    const backLabel = med.is_main_course ? '🔙 К авторскому курсу' : '🔙 Ко вспомогательным БАДам';

    const keyboard = {
      inline_keyboard: [
        [
          { text: `💬 Спросить ассистента про ${med.name}`, callback_data: `ask_about_med_${med.id}` },
        ],
        [
          { text: backLabel, callback_data: backCallback },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  // =========================================================================
  // 4. ТРЕНИРОВКИ, БАЗА ЗНАНИЙ, ИСЛАМСКАЯ МЕДИЦИНА, АССИСТЕНТ, ПРОФИЛЬ
  // =========================================================================
  function getWorkoutView(userId: number) {
    const session = getUserSession(userId);
    const done = session.workoutCompleted;

    const text =
      `<b>🏋️ СИСТЕМА КОМПЛЕКСНЫХ ТРЕНИРОВОК С ПРИОРИТЕТОМ НОГ</b>\n` +
      `<b>Автор:</b> @DonDearOfficina | <b>Длительность:</b> 45–60 минут\n\n` +
      `<b>Ключевая концепция:</b>\n` +
      `Главная причина упадка сил и застоя в малом тазу — венозный стаз. Тренировка запускает мышечно-венозную помпу голени и кровоток простаты.\n\n` +
      `<b>Правила методики:</b>\n` +
      `1️⃣ <b>СТАРТ:</b> Каждое занятие СТРОГО начинается с <b>икроножных мышц</b> (периферический насос).\n` +
      `2️⃣ <b>ПРИСЕДАНИЯ:</b> Сразу после икр — <b>2 подхода приседаний в отказ</b>. Мощнейший выброс СТГ и тестостерона.\n` +
      `3️⃣ <b>КОМПЛЕКС ВСЕГО ТЕЛА:</b> 2 грудь + 2 спина + 2 плечи + 2 ноги + ягодичные отдельно.\n` +
      `4️⃣ <b>СВОБОДНОЕ ЧЕРЕДОВАНИЕ:</b> переходите между тренажерами без ожидания, давая мышцам восстановиться.\n` +
      `5️⃣ <b>ОТДЫХ:</b> 1.5–2 минуты между тяжелыми сетами.\n\n` +
      `<b>Чек-лист тренировки сегодня:</b>\n` +
      `${done['calves'] ? '✅' : '⚪'} 1. Икроножные мышцы (2 подхода, 15–25 повт.)\n` +
      `${done['squats'] ? '✅' : '⚪'} 2. Приседания в отказ (2 подхода)\n` +
      `${done['upper'] ? '✅' : '⚪'} 3. Верх тела (Грудь + Спина + Плечи)\n` +
      `${done['glutes'] ? '✅' : '⚪'} 4. Ягодичные и доп. движения\n`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: done['calves'] ? '✅ Икры' : '⚪ Икры', callback_data: 'toggle_work_calves' },
          { text: done['squats'] ? '✅ Присед' : '⚪ Присед', callback_data: 'toggle_work_squats' },
          { text: done['upper'] ? '✅ Верх' : '⚪ Верх', callback_data: 'toggle_work_upper' },
          { text: done['glutes'] ? '✅ Ягодицы' : '⚪ Ягодицы', callback_data: 'toggle_work_glutes' },
        ],
        [
          { text: '⏱️ Таймер отдыха 90 сек', callback_data: 'workout_timer_90' },
          { text: '⏱️ Таймер отдыха 120 сек', callback_data: 'workout_timer_120' },
        ],
        [
          { text: '🧬 Биохимия и гормоны', callback_data: 'workout_bio' },
          { text: '📋 Список упражнений', callback_data: 'workout_list' },
        ],
        [
          { text: '🎯 Начать авторский курс', callback_data: 'nav_course_root' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  function getKnowledgeListView() {
    const text =
      `<b>📚 БАЗА ЗНАНИЙ @DonDearOfficina</b>\n\n` +
      `Научные статьи, разборы фармакокинетики, механизмов синаптической передачи и правила сочетания нутрицевтиков.\n\n` +
      `<i>Выберите статью для прочтения:</i>`;

    const buttons = INITIAL_KNOWLEDGE_NOTES.map((note) => [
      {
        text: `📄 [${note.topic}] ${note.title.slice(0, 36)}...`,
        callback_data: `kb_art_${note.id}`,
      },
    ]);

    const keyboard = {
      inline_keyboard: [
        ...buttons,
        [
          { text: '🕌 Исламская медицина', callback_data: 'nav_islamic' },
          { text: '🎯 Авторский курс', callback_data: 'nav_course_root' },
        ],
        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
      ],
    };

    return { text, keyboard };
  }

  function getKnowledgeArticleView(articleId: number) {
    const article = INITIAL_KNOWLEDGE_NOTES.find((a) => a.id === articleId);
    if (!article) {
      return {
        text: '⚠️ Статья не найдена.',
        keyboard: { inline_keyboard: [[{ text: '🔙 К списку статей', callback_data: 'nav_knowledge' }]] },
      };
    }

    const text =
      `<b>📚 ${article.title.toUpperCase()}</b>\n` +
      `<b>Тематика:</b> ${article.topic}\n\n` +
      `${article.body}\n\n` +
      (article.evidence_refs?.length
        ? `<b>🔬 Доказательная база:</b>\n${article.evidence_refs.join(', ')}\n\n`
        : '') +
      `<i>Личный опыт, разбор открытых данных @DonDearOfficina.</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔙 К списку статей', callback_data: 'nav_knowledge' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  function getIslamicListView() {
    const text =
      `<b>🕌 ИСЛАМСКАЯ МЕДИЦИНА (ТИББ-И-НАБАВИ)</b>\n\n` +
      `Подход @DonDearOfficina: традиция и сунна как историко-культурная ценность, строго дополненная современной доказательной фармакологией и клиническими исследованиями (РКИ).\n\n` +
      `<i>Выберите средство для подробного фармакологического разбора:</i>`;

    const buttons = INITIAL_ISLAMIC_REMEDIES.map((item) => [
      {
        text: `🌿 ${item.name_ru} (${item.name_ar}) [Уровень ${item.evidence_level}]`,
        callback_data: `isl_view_${item.id}`,
      },
    ]);

    const keyboard = {
      inline_keyboard: [
        ...buttons,
        [{ text: '🎯 Начать авторский курс', callback_data: 'nav_course_root' }],
        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
      ],
    };

    return { text, keyboard };
  }

  function getIslamicDetailView(remedyId: number) {
    const item = INITIAL_ISLAMIC_REMEDIES.find((r) => r.id === remedyId);
    if (!item) {
      return {
        text: '⚠️ Запись не найдена.',
        keyboard: { inline_keyboard: [[{ text: '🔙 К списку', callback_data: 'nav_islamic' }]] },
      };
    }

    const text =
      `<b>🌿 ${item.name_ru.toUpperCase()} (${item.name_ar})</b>\n` +
      `<i>Латынь: ${item.name_lat}</i>\n` +
      `<b>Категория:</b> ${item.category}\n` +
      `<b>Уровень доказательности:</b> [${item.evidence_level}]\n\n` +
      `<b>🕌 Традиционный контекст (Сунна):</b>\n${item.traditional_use}\n\n` +
      `<b>🔬 Научная доказательная база:</b>\n${item.scientific_evidence}\n\n` +
      `<b>👤 Личный опыт владельца:</b>\n${item.personal_experience}\n\n` +
      `<b>⚠️ Противопоказания:</b>\n${item.contraindications.map((c) => `• ${c}`).join('\n')}\n\n` +
      `<b>📚 PMID:</b> ${item.evidence_refs.join(', ')}\n\n` +
      `<i>Это не медицинская рекомендация. Традиция не отменяет РКИ. Проконсультируйтесь с врачом.</i>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: `💬 Спросить ассистента про ${item.name_ru}`, callback_data: `ask_about_isl_${item.id}` }],
        [
          { text: '🔙 К списку исламской медицины', callback_data: 'nav_islamic' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  function getAssistantPromptView() {
    const text =
      `<b>🤖 СУПЕР-АССИСТЕНТ @DonDearOfficina</b>\n\n` +
      `Я обучен на концепции дипломированного провизора-химика, специалиста по нейробиологии и андрологии.\n\n` +
      `⚙️ <b>Как я работаю:</b>\n` +
      `• Сначала ищу первопричину (Cause-First), а не маскирую симптом.\n` +
      `• Оцениваю каскад: 1. ЖКТ ➔ 2. Нейробуст (длительно 6+ мес) ➔ 3. Фенотропил (2 мес).\n` +
      `• Даю ссылки на рецензируемые исследования (PMID) и уровни A–F.\n` +
      `• Проверяю взаимодействия с активным стеком владельца.\n\n` +
      `<i>Выберите частый вопрос кнопкой или напишите свой вопрос прямо в чат:</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '💤 Упадок сил и сонливость', callback_data: 'ask_fatigue' },
          { text: '🫄 Схема 1-го месяца (ЖКТ)', callback_data: 'ask_stage1' },
        ],
        [
          { text: '🧠 Глиатилин + Креатин + Цитруллин (6+ мес)', callback_data: 'ask_stage2' },
          { text: '⚡ Фенотропил: регламент 2 месяца', callback_data: 'ask_stage3' },
        ],
        [
          { text: '⚖️ Железо против Цинка (DMT-1)', callback_data: 'ask_interactions' },
          { text: '🦵 Зачем начинать с икр и приседаний?', callback_data: 'ask_workout' },
        ],
        [
          { text: '🎯 Начать авторский курс', callback_data: 'nav_course_root' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  function getProfileView(userId: number) {
    const session = getUserSession(userId);
    const phaseNames = {
      1: '1-й месяц: Настройка ЖКТ и желчеоттока',
      2: '2-й месяц: Подключение Нейробуста (6+ мес)',
      3: '3-й месяц: Начало этапа с Фенотропилом',
      4: '4-й месяц: Продолжение этапа с Фенотропилом',
    };

    const text =
      `<b>👤 МОЙ ПРОФИЛЬ И СТАТУС ПРОТОКОЛА</b>\n\n` +
      `<b>Telegram ID:</b> <code>${userId}</code>\n` +
      `<b>Дата старта:</b> ${session.startDate}\n` +
      `<b>Текущий этап:</b> ${phaseNames[session.currentPhase]}\n` +
      `<b>На авторском протоколе:</b> ${session.onAuthorProtocol ? '✅ ДА' : '❌ НЕТ'}\n\n` +
      `<i>Когда вы на авторском протоколе, Супер-Ассистент автоматически проверяет совместимость любых добавок с вашим стеком (например, разнесение железа и цинка на 4 часа).</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: session.onAuthorProtocol ? 'Отключить авторский стек' : 'Включить авторский стек',
            callback_data: 'toggle_user_protocol',
          },
        ],
        [
          { text: '1-й мес (ЖКТ)', callback_data: 'set_phase_1' },
          { text: '2-й мес (Нейробуст)', callback_data: 'set_phase_2' },
        ],
        [
          { text: '3-й мес (Фенотропил старт)', callback_data: 'set_phase_3' },
          { text: '4-й мес (Фенотропил прод.)', callback_data: 'set_phase_4' },
        ],
        [
          { text: '🎯 Перейти к авторскому курсу', callback_data: 'nav_course_root' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  function getDondearView() {
    const text =
      `<b>📩 СВЯЗЬ С ВЛАДЕЛЬЦЕМ @DonDearOfficina</b>\n\n` +
      `<b>Автор концепции:</b> дипломированный провизор-химик, специалист по нейробиологии и андрологии.\n\n` +
      `• Личные сообщения: <a href="https://t.me/DonDearOfficina">@DonDearOfficina</a>\n` +
      `• Официальный канал: @DonDearOfficinaAI\n\n` +
      `Вы можете задать личный вопрос по интерпретации анализов, индивидуальной корректировке схемы ЖКТ или тренировочной программы.\n\n` +
      `<i>Личный опыт, разбор открытых данных.</i>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '💬 Написать @DonDearOfficina', url: 'https://t.me/DonDearOfficina' }],
        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
      ],
    };

    return { text, keyboard };
  }

  // =========================================================================
  // 5. ASSISTANT QUERY RESOLVER
  // =========================================================================
  async function generateAssistantReply(query: string, userId?: number): Promise<string> {
    const lowerQ = query.toLowerCase();
    const session = userId ? getUserSession(userId) : { onAuthorProtocol: true };

    // 1. Red Flags Check
    if (RED_FLAGS.some((rf) => lowerQ.includes(rf))) {
      return (
        '🚨 <b>Это может быть неотложное состояние. Немедленно вызовите скорую (103/112).</b>\n\n' +
        'Автоматический анализ прекращен в целях вашей безопасности.\n\n' +
        '<a href="https://t.me/DonDearOfficina">📩 Обсудить с @DonDearOfficina</a>'
      );
    }

    // 2. Try Gemini API
    if (geminiApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const res: any = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Контекст пользователя: На авторском протоколе: ${session.onAuthorProtocol ? 'ДА' : 'НЕТ'}. Вопрос: ${query}`,
            config: {
              systemInstruction,
              temperature: 0.3,
            },
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 7000)),
        ]);

        if (res?.text) {
          return res.text;
        }
      } catch (err: any) {
        // Fallback to deterministic
      }
    }

    // 3. Deterministic Scientific Fallback Engine
    if (lowerQ.includes('сонлив') || lowerQ.includes('усталост') || lowerQ.includes('энерг')) {
      return (
        '<b>📋 Кратко:</b> Хроническая дневная сонливость и упадок сил чаще всего обусловлены разрывом в каскаде: тканевая гипоксия из-за латентного железодефицита либо холестаз и дефицит митохондриальных кофакторов.\n\n' +
        '<b>🔍 Возможные причины:</b>\n' +
        '• Латентный железодефицит (ферритин &lt; 50 мкг/л) — блокирует тирозингидроксилазу (синтез дофамина) — PMID:23688172\n' +
        '• Замедленный желчеотток (холестаз) — нарушает мицеллообразование и всасывание жирорастворимых витаминов и CoQ10 — PMID:27385377\n\n' +
        '<b>💡 Что можно обсудить с врачом:</b>\n' +
        '• Исследование лабораторной панели: ферритин, ОАК, ТТГ, св. Т3, св. Т4, гомоцистеин — уровень A — PMID:30611908\n' +
        '• 1-й этап авторского курса: Хофитол (экстракт артишока) 2 таб. за 20 мин до еды + Полисорб (минимум 3 недели) — PMID:26310198\n' +
        '• 2-й этап авторского курса: Креатин моногидрат 5 г/сут утром длительно (от 6 мес) — уровень A — PMID:30137909\n\n' +
        (session.onAuthorProtocol ? '<b>⚠️ Взаимодействия со стеком:</b> Если принимаете железо и цинк — обязательно разносите их на 3–4 часа из-за DMT-1!\n\n' : '') +
        '<b>⚠️ Ограничения:</b> Точные причины требуют интерпретации объективных анализов крови.\n\n' +
        '<i>Это не медицинская рекомендация. Проконсультируйтесь с врачом.</i>\n\n' +
        '<a href="https://t.me/DonDearOfficina">📩 Обсудить с @DonDearOfficina</a>'
      );
    } else if (lowerQ.includes('жкт') || lowerQ.includes('желч') || lowerQ.includes('хофитол') || lowerQ.includes('полисорб')) {
      return (
        '<b>📋 Кратко:</b> Первый месяц авторского курса — «Настройка ЖКТ и желчеоттока» (основа основ всего каскада).\n\n' +
        '<b>🔍 Базовый авторский стек 1-го месяца:</b>\n' +
        '• <b>Хофитол</b> (экстракт артишока): 2 таб. за 20 мин до еды 3 р/день (холерез и холекинез) — PMID:26310198\n' +
        '• <b>Полисорб МП</b>: принимается в авторской концепции <b>минимум 3 недели</b> (отдельно от еды и Хофитола на 1.5–2 часа) для элиминации эндотоксинов ЛПС\n' +
        '• <b>Энтерол</b>: 250 мг 2 раза в день за 1 час до еды для восстановления плотных контактов энтероцитов — PMID:31430489\n\n' +
        '<b>⚠️ Важные правила автора:</b>\n' +
        '• Перед приемом Хофитола обязательно УЗИ ОБП для исключения камней.\n' +
        '• При наличии камней автором предусмотрен <b>Урсосан (УДХК)</b> как альтернатива (не универсально, требует контроля врача!).\n' +
        '• Из базового стека автором исключены Ребагит, Креон и Омез ДСР.\n\n' +
        '<i>Это не медицинская рекомендация. Проконсультируйтесь с врачом.</i>\n\n' +
        '<a href="https://t.me/DonDearOfficina">📩 Обсудить с @DonDearOfficina</a>'
      );
    } else if (lowerQ.includes('нейробуст') || lowerQ.includes('глиатилин') || lowerQ.includes('креатин') || lowerQ.includes('цитруллин')) {
      return (
        '<b>📋 Кратко:</b> Второй месяц авторского курса — «Подключение Нейробуста и основных компонентов».\n\n' +
        '<b>⚡ Важнейший принцип автора:</b>\n' +
        'Цитруллин, Креатин и Глиатилин подключаются на 2-м месяце, но их прием продолжается <b>МИНИМУМ 6 МЕСЯЦЕВ</b> (от 6 до 12 месяцев)! Второй месяц обозначает точку входа, а не окончание приёма.\n\n' +
        '<b>🔍 Механизм компонентов:</b>\n' +
        '• <b>Глиатилин</b> (400 мг 2 р/день): донор холина, принимается длительно (6–12 мес) строго ДО стимуляторов для насыщения пула ацетилхолина — PMID:12637119.\n' +
        '• <b>Креатин моногидрат</b> (5 г/сут): фосфатный буфер ресинтеза АТФ нейронов и мышц длительно (6–12 мес) — PMID:33578876.\n' +
        '• <b>L-Цитруллин</b> (3–5 г/сут): синтез оксида азота (NO), снятие тазового стаза длительно (6–12 мес) — PMID:28849984.\n\n' +
        '<i>Это не медицинская рекомендация. Проконсультируйтесь с врачом.</i>\n\n' +
        '<a href="https://t.me/DonDearOfficina">📩 Обсудить с @DonDearOfficina</a>'
      );
    } else if (lowerQ.includes('фенотропил') || lowerQ.includes('фонтурацетам')) {
      return (
        '<b>📋 Кратко:</b> Третий и четвёртый месяцы авторского курса — «Двухмесячный этап с Фенотропилом».\n\n' +
        '<b>🔍 Регламент автора:</b>\n' +
        '• 3-й месяц — начало этапа с Фенотропилом.\n' +
        '• 4-й месяц — продолжение этого этапа.\n' +
        '• <b>Продолжительность: ровно 2 месяца</b> (100 мг утром натощак).\n' +
        '• <b>Обязательное условие:</b> принимается СТРОГО на фоне продолжающегося приема Глиатилина, Креатина и Цитруллина!\n' +
        '• Стимуляция никотиновых и дофаминовых рецепторов без холина истощает синапс — PMID:21626398.\n\n' +
        '<i>Это не медицинская рекомендация. Проконсультируйтесь с врачом.</i>\n\n' +
        '<a href="https://t.me/DonDearOfficina">📩 Обсудить с @DonDearOfficina</a>'
      );
    } else if (lowerQ.includes('ноопепт') || lowerQ.includes('апепт') || lowerQ.includes('пирацетам')) {
      return (
        '<b>📋 Кратко:</b> В концепции автора последовательность после завершения двухмесячного этапа с Фенотропилом включает: сначала <b>Пирацетам</b>, затем <b>Ноопепт</b> (ранее ошибочно названный «Апепт»), а далее возможность рассмотрения других ноотропов.\n\n' +
        '<b>🔍 Важное замечание:</b>\n' +
        'Они не являются автоматическим назначением и не входят в базовый 4-месячный курс, а вынесены во вспомогательные средства как опции для последующего отдельного рассмотрения.\n\n' +
        '<i>Это не медицинская рекомендация. Проконсультируйтесь с врачом.</i>\n\n' +
        '<a href="https://t.me/DonDearOfficina">📩 Обсудить с @DonDearOfficina</a>'
      );
    } else if (lowerQ.includes('желез') || lowerQ.includes('цинк') || lowerQ.includes('dmt-1')) {
      return (
        '<b>📋 Кратко:</b> Железо (Ферлатум Фол) и Цинк (пиколинат) строго несовместимы при одновременном приеме из-за конкуренции за переносчик двухвалентных металлов DMT-1 в ДПК.\n\n' +
        '<b>💡 Как правильно принимать:</b>\n' +
        '• Железо + Витамин С — утром до еды.\n' +
        '• Цинк — в обед с плотной едой (через 3.5–4 часа после железа) — PMID:10799383.\n\n' +
        '<i>Это не медицинская рекомендация. Проконсультируйтесь с врачом.</i>\n\n' +
        '<a href="https://t.me/DonDearOfficina">📩 Обсудить с @DonDearOfficina</a>'
      );
    } else {
      return (
        '<b>📋 Кратко:</b> Ваш запрос проанализирован по каскадной модели @DonDearOfficina:\n' +
        '1. Настройка ЖКТ и желчеоттока (1-й мес: Хофитол, Полисорб от 3 нед, Энтерол)\n' +
        '2. Подключение Нейробуста (2-й мес: Глиатилин, Креатин, Цитруллин — длительно 6+ мес)\n' +
        '3. Двухмесячный этап с Фенотропилом (3-й и 4-й мес — ровно 2 месяца)\n\n' +
        'Вспомогательные препараты и БАДы доступны в отдельном каталоге бота.\n\n' +
        '<i>Это не медицинская рекомендация. Проконсультируйтесь с врачом.</i>\n\n' +
        '<a href="https://t.me/DonDearOfficina">📩 Обсудить с @DonDearOfficina</a>'
      );
    }
  }

  // =========================================================================
  // 6. MAIN POLLING LOOP & ROUTER
  // =========================================================================
  async function poll() {
    while (isRunning) {
      try {
        botTelemetry.lastPollTimestamp = new Date().toISOString();

        const response = await fetch(`${baseUrl}/getUpdates?offset=${offset}&timeout=15`, {
          signal: AbortSignal.timeout(22000),
        });

        if (response.status === 409) {
          botTelemetry.lastError = '409 Conflict: Another active bot instance is polling. Pausing for 30s...';
          await new Promise((r) => setTimeout(r, 30000));
          continue;
        }

        if (!response.ok) {
          botTelemetry.consecutiveErrors++;
          botTelemetry.lastError = `HTTP ${response.status} ${response.statusText}`;
          await new Promise((r) => setTimeout(r, 4000));
          continue;
        }

        const data = await response.json();

        if (!data.ok) {
          if (data.error_code === 409) {
            botTelemetry.lastError = '409 Conflict: Another instance is polling';
            await new Promise((r) => setTimeout(r, 30000));
            continue;
          }
          botTelemetry.consecutiveErrors++;
          botTelemetry.lastError = `Telegram API notice: ${data.description || 'Unknown'}`;
          await new Promise((r) => setTimeout(r, 4000));
          continue;
        }

        botTelemetry.consecutiveErrors = 0;
        botTelemetry.lastError = null;

        if (Array.isArray(data.result)) {
          for (const update of data.result as TelegramUpdate[]) {
            offset = update.update_id + 1;
            botTelemetry.totalUpdatesProcessed++;

            // --- 1. INLINE CALLBACK QUERY HANDLER ---
            if (update.callback_query) {
              const cq = update.callback_query;
              const chatId = cq.message?.chat.id;
              const messageId = cq.message?.message_id;
              const action = cq.data || '';
              const userId = cq.from.id;

              await answerCallback(cq.id);

              if (!chatId || !messageId) continue;

              const session = getUserSession(userId);

              // Главная навигация
              if (action === 'menu_main') {
                const view = getMainMenuView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Главная кнопка «Начать авторский курс»
              else if (action === 'nav_course_root') {
                const view = getCourseOverviewView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Этап 1: ЖКТ и желчеотток
              else if (action === 'course_stage_1') {
                const view = getStage1View();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Этап 2: Подключение Нейробуста (6+ мес)
              else if (action === 'course_stage_2') {
                const view = getStage2View();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Этап 3: Двухмесячный этап с Фенотропилом (3-й и 4-й мес)
              else if (action === 'course_stage_3') {
                const view = getStage3View();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Схема-таймлайн курса
              else if (action === 'course_timeline') {
                const view = getCourseTimelineView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Раздел: Вспомогательные препараты и БАДы
              else if (action === 'nav_auxiliary_root') {
                const view = getAuxiliaryCatalogView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Просмотр карточки препарата (со всеми 7 подразделами)
              else if (action.startsWith('med_view_')) {
                const medId = parseInt(action.replace('med_view_', ''), 10);
                const view = getMedDetailView(medId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Тренировки
              else if (action === 'nav_workout') {
                const view = getWorkoutView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // База знаний
              else if (action === 'nav_knowledge') {
                const view = getKnowledgeListView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action.startsWith('kb_art_')) {
                const artId = parseInt(action.replace('kb_art_', ''), 10);
                const view = getKnowledgeArticleView(artId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Исламская медицина
              else if (action === 'nav_islamic') {
                const view = getIslamicListView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action.startsWith('isl_view_')) {
                const remId = parseInt(action.replace('isl_view_', ''), 10);
                const view = getIslamicDetailView(remId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Ассистент
              else if (action === 'nav_assistant') {
                const view = getAssistantPromptView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Профиль
              else if (action === 'nav_profile') {
                const view = getProfileView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Автор
              else if (action === 'nav_dondear') {
                const view = getDondearView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Быстрые вопросы ассистенту
              else if (action === 'ask_fatigue') {
                const reply = await generateAssistantReply('сонливость и упадок сил', userId);
                await sendMessage(chatId, reply);
              } else if (action === 'ask_stage1') {
                const reply = await generateAssistantReply('первый этап авторского курса жкт хофитол полисорб энтерол', userId);
                await sendMessage(chatId, reply);
              } else if (action === 'ask_stage2') {
                const reply = await generateAssistantReply('второй этап авторского курса глиатилин креатин цитруллин длительно 6 месяцев', userId);
                await sendMessage(chatId, reply);
              } else if (action === 'ask_stage3') {
                const reply = await generateAssistantReply('двухмесячный этап фенотропил третий и четвертый месяцы курса', userId);
                await sendMessage(chatId, reply);
              } else if (action === 'ask_interactions') {
                const reply = await generateAssistantReply('железо и цинк взаимодействие dmt-1', userId);
                await sendMessage(chatId, reply);
              } else if (action === 'ask_workout') {
                const reply = await generateAssistantReply('зачем начинать тренировку с икр и приседаний в отказ', userId);
                await sendMessage(chatId, reply);
              } else if (action.startsWith('ask_about_med_')) {
                const mId = parseInt(action.replace('ask_about_med_', ''), 10);
                const m = INITIAL_MEDICATIONS.find((x) => x.id === mId);
                const query = `Расскажи клиническое действие и регламент для ${m?.name || ''} в концепции @DonDearOfficina`;
                const reply = await generateAssistantReply(query, userId);
                await sendMessage(chatId, reply);
              } else if (action.startsWith('ask_about_isl_')) {
                const iId = parseInt(action.replace('ask_about_isl_', ''), 10);
                const isl = INITIAL_ISLAMIC_REMEDIES.find((x) => x.id === iId);
                const query = `Разбери доказательную базу и традицию для ${isl?.name_ru || ''}`;
                const reply = await generateAssistantReply(query, userId);
                await sendMessage(chatId, reply);
              }
              // Workout Toggles & Timers
              else if (action.startsWith('toggle_work_')) {
                const key = action.replace('toggle_work_', '');
                session.workoutCompleted[key] = !session.workoutCompleted[key];
                const view = getWorkoutView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'workout_timer_90') {
                await sendMessage(chatId, '⏱️ <b>Таймер запущен: 90 секунд отдыха!</b>\n\nВосстанавливайте дыхание, пейте воду.');
                setTimeout(() => {
                  sendMessage(chatId, '🔔 <b>90 секунд прошло! Время начинать следующий подход!</b> 💪');
                }, 90000);
              } else if (action === 'workout_timer_120') {
                await sendMessage(chatId, '⏱️ <b>Таймер запущен: 120 секунд отдыха!</b>\n\nДлинная пауза для тяжелых отказных приседаний.');
                setTimeout(() => {
                  sendMessage(chatId, '🔔 <b>120 секунд прошло! Время начинать следующий тяжелый подход!</b> 🔥');
                }, 120000);
              } else if (action === 'workout_bio') {
                const bioText =
                  `<b>🧬 ФИЗИОЛОГИЧЕСКИЙ МЕХАНИЗМ ТРЕНИРОВКИ</b>\n\n` +
                  `• <b>Мышечно-венозная помпа голени:</b> икроножные и камбаловидные мышцы проталкивают кровь вверх, ликвидируя отек и гравитационный застой.\n\n` +
                  `• <b>Приседания в отказ:</b> компрессия и декомпрессия капсулы предстательной железы, устранение застоя в plexus venosus prostaticus, активация клеток Лейдига артериальной кровью.\n\n` +
                  `• <b>Гормональный отклик:</b> работа крупных массивов до отказа стимулирует гипоталамо-гипофизарную ось к выбросу СТГ и тестостерона.`;
                const keyboard = {
                  inline_keyboard: [[{ text: '🔙 Назад к тренировкам', callback_data: 'nav_workout' }]],
                };
                await editMessage(chatId, messageId, bioText, keyboard);
              } else if (action === 'workout_list') {
                let exercisesText = `<b>🏋️ ПОЛНЫЙ ПЛАН УПРАЖНЕНИЙ</b>\n\n`;
                INITIAL_WORKOUT_EXERCISES.forEach((ex, idx) => {
                  exercisesText += `${idx + 1}. <b>${ex.muscle_title}</b>\n` +
                    `Движение: ${ex.name}\n` +
                    `Режим: ${ex.sets} | ${ex.reps}\n\n`;
                });
                const keyboard = {
                  inline_keyboard: [[{ text: '🔙 Назад к тренировкам', callback_data: 'nav_workout' }]],
                };
                await editMessage(chatId, messageId, exercisesText, keyboard);
              }
              // Profile Toggles
              else if (action === 'toggle_user_protocol') {
                session.onAuthorProtocol = !session.onAuthorProtocol;
                const view = getProfileView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action.startsWith('set_phase_')) {
                const p = parseInt(action.replace('set_phase_', ''), 10) as any;
                session.currentPhase = p;
                const view = getProfileView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }

              continue;
            }

            // --- 2. TEXT MESSAGES & SLASH COMMANDS HANDLER ---
            if (update.message && typeof update.message.text === 'string') {
              const msg = update.message;
              const chatId = msg.chat.id;
              const userId = msg.from.id;
              const text = update.message.text.trim();

              if (text === '/start' || text.toLowerCase() === 'меню' || text.toLowerCase() === 'главная') {
                const view = getMainMenuView(userId);
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/course' || text.toLowerCase() === 'курс') {
                const view = getCourseOverviewView();
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/auxiliary' || text.toLowerCase() === 'бады') {
                const view = getAuxiliaryCatalogView();
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/app') {
                await sendMessage(
                  chatId,
                  'Нажмите кнопку ниже для запуска полноэкранного Telegram Mini App:',
                  {
                    inline_keyboard: [
                      [{ text: '💊 Открыть NeuroBoost Mini App', web_app: { url: appUrl } }],
                    ],
                  }
                );
              } else if (text === '/workout') {
                const view = getWorkoutView(userId);
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/knowledge') {
                const view = getKnowledgeListView();
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/islamic') {
                const view = getIslamicListView();
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/assistant' || text === '/ask') {
                const view = getAssistantPromptView();
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/profile') {
                const view = getProfileView(userId);
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/dondear') {
                const view = getDondearView();
                await sendMessage(chatId, view.text, view.keyboard);
              } else {
                // Free-Form Natural Language Question -> Super-Assistant
                const answer = await generateAssistantReply(text, userId);
                await sendMessage(chatId, answer, {
                  inline_keyboard: [
                    [
                      { text: '🎯 Начать авторский курс', callback_data: 'nav_course_root' },
                      { text: '💬 Задать еще вопрос', callback_data: 'nav_assistant' },
                    ],
                    [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
                  ],
                });
              }
            }
          }
        }
      } catch (err: any) {
        const isRoutineTimeout =
          err.name === 'TimeoutError' ||
          err.name === 'AbortError' ||
          err.message?.includes('aborted') ||
          err.message?.includes('timeout') ||
          err.message?.includes('The operation was aborted');

        if (isRoutineTimeout) {
          continue;
        }

        botTelemetry.consecutiveErrors++;
        botTelemetry.lastError = err.message || String(err);
        const delay = Math.min(15000, 1000 * Math.pow(1.5, Math.min(botTelemetry.consecutiveErrors, 8)));
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  // Periodic heartbeat logger
  const heartbeatTimer = setInterval(() => {
    if (!isRunning) return;
    const uptimeSec = Math.floor((Date.now() - new Date(botTelemetry.startTime).getTime()) / 1000);
    const healthNote = botTelemetry.consecutiveErrors > 0 ? ` [reconnecting: ${botTelemetry.consecutiveErrors}]` : ' [healthy]';
    console.log(
      `[Telegram Watchdog Heartbeat] Status: READY • Uptime: ${uptimeSec}s • Processed: ${botTelemetry.totalUpdatesProcessed}${healthNote}`
    );
  }, 180000);

  // Start polling in background
  poll();

  return () => {
    isRunning = false;
    botTelemetry.isRunning = false;
    clearInterval(heartbeatTimer);
  };
}
