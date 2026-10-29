import { INITIAL_MEDICATIONS } from '../data/seedMedications';
import { INITIAL_WORKOUT_EXERCISES } from '../data/seedWorkout';
import { INITIAL_KNOWLEDGE_NOTES } from '../data/seedKnowledgeNotes';
import { INITIAL_ISLAMIC_REMEDIES } from '../data/seedIslamicRemedies';
import { Medication } from '../types';
import { storage } from './storage';

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
  'задержка мочи',
  'отек горла',
  'удушье',
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

export function getTelegramBotStatus(): BotTelemetry {
  if (botTelemetry.isRunning) {
    botTelemetry.uptimeSeconds = Math.floor(
      (Date.now() - new Date(botTelemetry.startTime).getTime()) / 1000
    );
  }
  return { ...botTelemetry };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function startTelegramBot(token: string) {
  if (!token || token.trim().length < 15) {
    console.error('❌ [Telegram Bot] Token is missing or invalid. Bot polling disabled.');
    botTelemetry.lastError = 'Token missing or invalid';
    return () => {};
  }

  const baseUrl = `https://api.telegram.org/bot${token}`;
  let offset = 0;
  let isRunning = true;
  botTelemetry.isRunning = true;
  botTelemetry.startTime = new Date().toISOString();

  console.log('🤖 [Telegram Bot] Initializing Native Telegram Bot for @DonDearOfficina...');

  async function apiCall(method: string, body: Record<string, any>): Promise<any> {
    try {
      const res = await fetch(`${baseUrl}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
      });
      return await res.json();
    } catch (err: any) {
      return { ok: false, description: err.message };
    }
  }

  async function sendMessage(
    chatId: number,
    text: string,
    replyMarkup?: any
  ): Promise<any> {
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };
    if (replyMarkup) payload.reply_markup = replyMarkup;

    let res = await apiCall('sendMessage', payload);
    if (!res?.ok && res?.description?.includes('can\'t parse entities')) {
      // Fallback without parse_mode if rich formatting causes syntax error
      payload.parse_mode = undefined;
      res = await apiCall('sendMessage', payload);
    }
    return res;
  }

  async function editMessage(
    chatId: number,
    messageId: number,
    text: string,
    replyMarkup?: any
  ): Promise<any> {
    const payload: any = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };
    if (replyMarkup) payload.reply_markup = replyMarkup;

    let res = await apiCall('editMessageText', payload);
    if (!res?.ok && res?.description?.includes('message is not modified')) {
      return res;
    }
    if (!res?.ok && res?.description?.includes('can\'t parse entities')) {
      payload.parse_mode = undefined;
      res = await apiCall('editMessageText', payload);
    }
    return res;
  }

  async function answerCallback(callbackQueryId: string, alertText?: string) {
    await apiCall('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text: alertText,
      show_alert: Boolean(alertText),
    });
  }

  // Identify bot identity and set official commands
  async function registerCommands() {
    try {
      const me = await apiCall('getMe', {});
      if (me?.ok && me?.result?.username) {
        botTelemetry.botUsername = me.result.username;
        console.log(`🤖 [Telegram Bot] Verified as @${botTelemetry.botUsername} (${me.result.first_name})`);
      }
    } catch (err: any) {
      console.error('⚠️ [Telegram Bot] getMe check failed:', err.message);
    }

    await apiCall('setMyCommands', {
      commands: [
        { command: 'start', description: '🎯 Главное меню и старт' },
        { command: 'course', description: '🎯 Программа авторского курса' },
        { command: 'auxiliary', description: '📦 Вспомогательные препараты и БАДы' },
        { command: 'nutrition', description: '⚖️ Похудение и питание' },
        { command: 'workout', description: '🏋️ Система тренировок' },
        { command: 'materials', description: '📚 Материалы автора' },
        { command: 'profile', description: '👤 Мой профиль и прогресс' },
        { command: 'weight', description: '⚖️ Внести вес (напр. /weight 82.5)' },
        { command: 'dondear', description: '📩 Связаться с @DonDearOfficina' },
      ],
    });
  }
  registerCommands().catch(() => {});

  // =========================================================================
  // 1. ГЛАВНОЕ МЕНЮ
  // =========================================================================
  function getMainMenuView(userId: number) {
    const user = storage.getUser(userId);
    const startStatus = user.confirmedStart
      ? `✅ <i>Курс начат: ${user.startedAt ? new Date(user.startedAt).toLocaleDateString('ru-RU') : 'активен'}</i>`
      : '⚪ <i>Курс не начат (режим ознакомления)</i>';

    const text =
      `👋 <b>Добро пожаловать в систему NeuroBoost!</b>\n\n` +
      `Официальный бот авторской программы дипломированного провизора-химика <a href="https://t.me/DonDearOfficina">@DonDearOfficina</a>.\n\n` +
      `<b>Статус:</b> ${startStatus}\n\n` +
      `<b>⚙️ Архитектура системы:</b>\n` +
      `• <b>🎯 Единый авторский курс</b> — последовательная программа:\n` +
      `   1️⃣ <b>1-й месяц:</b> ЖКТ, желчеотток и водный баланс\n` +
      `   2️⃣ <b>2-й месяц+:</b> Комплекс «Нейробуст» (Глиатилин + Креатин + L-Цитруллин, база от 6 мес)\n` +
      `   3️⃣ <b>3-й и 4-й месяцы:</b> Двухмесячный этап с Фенотропилом\n\n` +
      `• <b>📦 Вспомогательные препараты и БАДы</b> — каталог с 7 разделами описания\n` +
      `• <b>⚖️ Похудение и питание</b> — концепция снижения жиров и дневник веса\n` +
      `• <b>🏋️ Система тренировок</b> — комплекс с приоритетом икроножных мышц и ног\n` +
      `• <b>📚 Материалы автора</b> — статьи, разборы и исламская медицина\n\n` +
      `<i>Личный опыт автора, разбор открытых данных. По всем индивидуальным вопросам консультирует лично автор @DonDearOfficina.</i>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🎯 Начать авторский курс', callback_data: 'nav_course_root' }],
        [{ text: '📦 Вспомогательные препараты и БАДы', callback_data: 'nav_auxiliary_root' }],
        [{ text: '⚖️ Похудение и питание', callback_data: 'nav_nutrition_root' }],
        [
          { text: '🏋️ Система тренировок', callback_data: 'nav_workout' },
          { text: '📚 Материалы автора', callback_data: 'nav_materials' },
        ],
        [
          { text: '👤 Мой профиль и прогресс', callback_data: 'nav_profile' },
          { text: '📩 Задать вопрос автору', url: 'https://t.me/DonDearOfficina' },
        ],
      ],
    };

    return { text, keyboard };
  }

  // =========================================================================
  // 2. ЕДИНЫЙ АВТОРСКИЙ КУРС
  // =========================================================================
  function getCourseOverviewView(userId: number) {
    const user = storage.getUser(userId);

    const confirmationBlock = user.confirmedStart
      ? `✅ <b>Вы подтвердили участие в курсе!</b>\n<i>Дата старта: ${user.startedAt ? new Date(user.startedAt).toLocaleDateString('ru-RU') : 'активен'} | Текущий этап: Месяц ${user.currentPhase}</i>\n\n`
      : `ℹ️ <i>Вы находитесь в режиме ознакомления. Изучите этапы ниже. Когда будете готовы, нажмите кнопку «Подтвердить начало авторского курса».</i>\n\n`;

    const text =
      `<b>🎯 АВТОРСКИЙ КУРС @DonDearOfficina</b>\n` +
      `<i>Единая последовательная программа оптимизации нейросистемы</i>\n\n` +
      `${confirmationBlock}` +
      `Курс строится строго по каскадному принципу Cause-First:\n\n` +
      `<b>1️⃣ Первый месяц — ЖКТ, желчеотток и водный баланс</b>\n` +
      `• <i>Компоненты:</i> Хофитол, Полисорб МП (минимум 3 недели), Энтерол.\n` +
      `• <i>Подраздел:</i> Водный баланс и электролиты (Регидрон, Адиарин Регидрокомплекс по показаниям).\n` +
      `• <i>Альтернатива при камнях:</i> Урсосан (УДХК) — обсуждается с врачом строго по УЗИ.\n` +
      `• <i>Цель:</i> Запуск желчеоттока, эмульгация липидов, элиминация эндотоксинов и фундамент всасывания.\n\n` +
      `<b>2️⃣ Со второго месяца — Комплекс «Нейробуст» (длительная база 6+ месяцев)</b>\n` +
      `• <i>Компоненты:</i> Глиатилин + Креатин + L-Цитруллин.\n` +
      `• <b>ВАЖНО:</b> «Нейробуст» — это название связки этих 3 компонентов, а не отдельная 4-я таблетка! Прием продолжается <b>не менее 6 месяцев</b> (месяцы 2–7+).\n` +
      `• <i>Цель:</i> Насыщение пула ацетилхолина, энергетический буфер АТФ и эндотелиальный оксид азота.\n\n` +
      `<b>3️⃣ С третьего месяца — Двухмесячный этап с Фенотропилом</b>\n` +
      `• <i>Компоненты:</i> Фенотропил (Фонтурацетам).\n` +
      `• <i>Продолжительность:</i> <b>Ровно 2 месяца</b> (3-й и 4-й месяцы курса).\n` +
      `• <i>Условие:</i> Принимается СТРОГО на фоне продолжающегося приема базы 2-го этапа!\n\n` +
      `<i>После курса автором для отдельного рассмотрения описаны Пирацетам и затем Ноопепт (вне обязательного набора).</i>`;

    const confirmButton = user.confirmedStart
      ? [{ text: '👤 Мой прогресс и чек-листы', callback_data: 'nav_profile' }]
      : [{ text: '✅ Подтвердить начало авторского курса', callback_data: 'course_confirm_start' }];

    const keyboard = {
      inline_keyboard: [
        confirmButton,
        [
          { text: '🫄 Этап 1: ЖКТ и желчеотток', callback_data: 'course_stage_1' },
          { text: '💧 Водный баланс', callback_data: 'course_water_balance' },
        ],
        [
          { text: '🧠 Этап 2: Комплекс «Нейробуст» (6+ мес)', callback_data: 'course_stage_2' },
          { text: '⚡ Этап 3: Фенотропил (2 мес)', callback_data: 'course_stage_3' },
        ],
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
      `<b>🫄 ЭТАП 1: ЖКТ, ЖЕЛЧЕОТТОК И ФУНДАМЕНТ ВСАСЫВАНИЯ (1-Й МЕСЯЦ)</b>\n\n` +
      `<b>Концепция автора:</b>\n` +
      `Без работающего ЖКТ все расчеты по ноотропам и микронутриентам бессмысленны. Если нарушен отток желчи, жирорастворимые молекулы транзитируются, а бактериальный эндотоксин (ЛПС) вызывает субклиническое системное воспаление.\n\n` +
      `<b>📋 Базовые компоненты 1-го месяца:</b>\n\n` +
      `1. <b>ХОФИТОЛ</b> (экстракт артишока)\n` +
      `• <i>По инструкции:</i> 2–3 таб. 3 раза в сутки перед едой, курс 2–3 недели.\n` +
      `• <i>Личный опыт автора:</i> 2 таблетки 3 раза в день строго за 20 мин до еды курсом 20–30 дней.\n` +
      `• <i>Ограничения:</i> Обязательно исключить камни по УЗИ ОБП (риск обтурации).\n\n` +
      `2. <b>ПОЛИСОРБ МП</b> (коллоидный диоксид кремния)\n` +
      `• <i>По инструкции:</i> водная суспензия за 1–1.5 часа до/после еды и лекарств.\n` +
      `• <i>Личный опыт автора:</i> <b>минимум 3 недели</b> для глубокого снижения токсической нагрузки.\n` +
      `• <i>Ограничения:</i> Разносить по времени с Хофитолом и Энтеролом минимум на 1.5–2 часа!\n\n` +
      `3. <b>ЭНТЕРОЛ</b> (Saccharomyces boulardii)\n` +
      `• <i>По инструкции:</i> 1–2 капс. 2 раза в сутки за 1 час до еды, курс 7–30 дней.\n` +
      `• <i>Личный опыт автора:</i> 250 мг 2 раза в день за 1 час до еды (14–30 дней).\n\n` +
      `<b>⚠️ Урсосан (УДХК):</b>\n` +
      `Предусмотрен автором как условная альтернатива Хофитолу при наличии камней в желчном пузыре. <b>Не является универсальной рекомендацией</b>, строго обсуждается с лечащим врачом по УЗИ ОБП.\n\n` +
      `<i>Ребагит, Креон 10 000 и Омез ДСР исключены автором из базового набора.</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🌿 Хофитол', callback_data: 'med_view_1' },
          { text: '🌪️ Полисорб МП', callback_data: 'med_view_4' },
        ],
        [
          { text: '🛡️ Энтерол', callback_data: 'med_view_2' },
          { text: '⚠️ Урсосан (с врачом)', callback_data: 'med_view_10' },
        ],
        [{ text: '💧 Водный баланс и электролиты', callback_data: 'course_water_balance' }],
        [
          { text: '➡️ Этап 2: Комплекс «Нейробуст»', callback_data: 'course_stage_2' },
          { text: '🔙 К обзору курса', callback_data: 'nav_course_root' },
        ],
        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
      ],
    };

    return { text, keyboard };
  }

  // 2.2 Новый подраздел: Водный баланс и электролиты
  function getWaterBalanceView() {
    const text =
      `<b>💧 ВОДНЫЙ БАЛАНС И ЭЛЕКТРОЛИТЫ В КУРСЕ ЖКТ</b>\n\n` +
      `Поддержание оптимальной гидратации — ключевой фактор реологии желчи, эвакуации кишечного содержимого и работы почек.\n\n` +
      `<b>1. Обычное питье vs Восполнение электролитов:</b>\n` +
      `• <b>Чистая питьевая вода:</b> ежедневная базовая потребность. Норма индивидуальна и зависит от массы тела, климата и физической активности. Не существует универсальной принудительной цифры в литрах для каждого человека.\n` +
      `• <b>Растворы электролитов:</b> специализированные смеси солей (натрий, калий, цитрат, глюкоза), предназначенные для компенсации <i>патологических или экстремальных потерь жидкости</i>.\n\n` +
      `<b>2. Когда рассматриваются электролиты:</b>\n` +
      `• Диарейный синдром или расстройства пищеварения при очищении ЖКТ.\n` +
      `• Лихорадка, высокая температура.\n` +
      `• Интенсивное потоотделение в жару или при тяжелых силовых нагрузках.\n` +
      `• Признаки легкой дегидратации (сухость слизистых, жажда, слабость).\n\n` +
      `<b>3. Карточки проверенных средств:</b>\n` +
      `• <b>Регидрон</b> (лекарственный препарат) — классический состав пероральной регидратации.\n` +
      `• <b>Адиарин Регидрокомплекс</b> — специализированный гипоосмолярный состав с цинком (рекомендации ВОЗ/ESPGHAN).\n\n` +
      `<b>🚨 КРАСНЫЕ ФЛАГИ — СРОЧНАЯ МЕДИЦИНСКАЯ ПОМОЩЬ:</b>\n` +
      `При западении глаз, сухом языке без слюны, отсутствии мочеиспускания более 6–8 часов, спутанности сознания или неукротимой рвоте — <b>немедленно вызывайте скорую помощь (103/112)</b>! Самостоятельный прием растворов в этих состояниях опасен.\n\n` +
      `<b>⚠️ ВАЖНЫЕ ПРЕДОСТЕРЕЖЕНИЯ:</b>\n` +
      `• При гипертонии, сердечной или почечной недостаточности растворы солей принимаются только по согласованию с врачом.\n` +
      `• Электролиты <b>НЕ ЯВЛЯЮТСЯ</b> средством похудения, диуретиком или способом искусственной сгонки веса!`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '💧 Карточка: Регидрон', callback_data: 'med_view_40' },
          { text: '💧 Карточка: Адиарин Регидро', callback_data: 'med_view_41' },
        ],
        [
          { text: '⬅️ Назад к 1-му этапу ЖКТ', callback_data: 'course_stage_1' },
          { text: '🎯 К обзору курса', callback_data: 'nav_course_root' },
        ],
        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
      ],
    };

    return { text, keyboard };
  }

  // 2.3 Этап 2: Подключение Нейробуста (длительная база 6+ месяцев)
  function getStage2View() {
    const text =
      `<b>🧠 ЭТАП 2: КОМПЛЕКС «НЕЙРОБУСТ» (СО 2-ГО МЕСЯЦА, ДЛИТЕЛЬНО 6+ МЕС)</b>\n\n` +
      `<b>Важнейший принцип авторской концепции:</b>\n` +
      `«Нейробуст» — это не отдельная 4-я таблетка, а <b>синергетическая связка трех базовых компонентов</b>: Глиатилин + Креатин + L-Цитруллин.\n\n` +
      `Второй месяц обозначает <b>точку подключения</b> этих компонентов. По концепции автора, они принимаются <b>МИНИМУМ ШЕСТЬ МЕСЯЦЕВ</b> подряд (месяцы 2–7+), закладывая устойчивый фундамент нейропластичности и кровообращения!\n\n` +
      `<b>📋 Компоненты комплекса:</b>\n\n` +
      `1. <b>ГЛИАТИЛИН</b> (холина альфосцерат)\n` +
      `• <i>Длительность:</i> минимум 6 месяцев.\n` +
      `• <i>По инструкции:</i> 400 мг 2–3 раза в сутки до еды.\n` +
      `• <i>Личный опыт автора:</i> 400 мг 2 раза в день за 30 мин до еды в первой половине дня.\n` +
      `• <i>Роль:</i> Донор холина. Насыщает синаптический пул ацетилхолина задолго до стимуляторов.\n\n` +
      `2. <b>КРЕАТИН МОНОГИДРАТ</b>\n` +
      `• <i>Длительность:</i> минимум 6 месяцев.\n` +
      `• <i>По инструкции:</i> 3–5 г в сутки с водой.\n` +
      `• <i>Личный опыт автора:</i> 5 г каждое утро натощак.\n` +
      `• <i>Роль:</i> Ресинтез АТФ для нейронов и энергетическая база для тренировок.\n\n` +
      `3. <b>L-ЦИТРУЛЛИН</b>\n` +
      `• <i>Длительность:</i> минимум 6 месяцев.\n` +
      `• <i>По инструкции:</i> 3–6 г в сутки.\n` +
      `• <i>Личный опыт автора:</i> 3–5 г утром натощак совместно с креатином.\n` +
      `• <i>Роль:</i> Синтез оксида азота (NO), ликвидация тазового венозного застоя.\n\n` +
      `<i>Этот базовый стек продолжается без перерыва на 3-м и 4-м месяцах и далее!</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🧠 Глиатилин', callback_data: 'med_view_6' },
          { text: '⚡ Креатин', callback_data: 'med_view_7' },
        ],
        [
          { text: '🩸 L-Цитруллин', callback_data: 'med_view_8' },
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

  // 2.4 Этап 3: Двухмесячный этап с Фенотропилом
  function getStage3View() {
    const text =
      `<b>⚡ ЭТАП 3: ДВУХМЕСЯЧНЫЙ ЭТАП С ФЕНОТРОПИЛОМ (3-Й И 4-Й МЕСЯЦЫ)</b>\n\n` +
      `На третьем месяце авторского курса подключается Фенотропил.\n\n` +
      `<b>Регламент этапа:</b>\n` +
      `• <b>Продолжительность: ровно 2 месяца</b> (3-й месяц — старт, 4-й месяц — продолжение).\n` +
      `• Для 4-го месяца не создается отдельный курс — это единый двухмесячный блок.\n\n` +
      `<b>📋 ФЕНОТРОПИЛ (Фонтурацетам):</b>\n` +
      `• <i>По инструкции:</i> разовая доза 100–250 мг, суточная 200–300 мг утром после еды. Длительность курса лечения от 30 дней до 2 месяцев. Не принимать позднее 15:00.\n` +
      `• <i>Личный опыт автора:</i> 100 мг утром натощак курсом ровно 2 месяца.\n` +
      `• <b>Ключевое условие:</b> Фенотропил принимается СТРОГО на фоне продолжающегося насыщения холином (Глиатилин) и энергетической базы (Креатин + Цитруллин).\n\n` +
      `<b>🔄 Параллельная база:</b>\n` +
      `Компоненты 2-го этапа (Глиатилин, Креатин, Цитруллин) <b>продолжают приниматься параллельно</b>, так как их курс составляет минимум 6 месяцев!\n\n` +
      `<b>📌 Последующие варианты (вне основного курса):</b>\n` +
      `В концепции автора после завершения этапа с Фенотропилом описана последовательность: сначала Пирацетам, затем <b>Ноопепт</b>, а далее возможность рассмотрения других ноотропов. Они не назначаются автоматически и вынесены во вспомогательные средства.`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '💊 Карточка: Фенотропил', callback_data: 'med_view_5' }],
        [
          { text: '⬅️ Этап 2 (Нейробуст)', callback_data: 'course_stage_2' },
          { text: '🔄 Схема-таймлайн', callback_data: 'course_timeline' },
        ],
        [
          { text: '📦 Вспомогательные БАДы', callback_data: 'nav_auxiliary_root' },
          { text: '🔙 К обзору курса', callback_data: 'nav_course_root' },
        ],
        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
      ],
    };

    return { text, keyboard };
  }

  // 2.5 Схема-таймлайн курса
  function getCourseTimelineView() {
    const text =
      `<b>🔄 ОБЩАЯ СХЕМА-ТАЙМЛАЙН АВТОРСКОГО КУРСА</b>\n\n` +
      `┌─ <b>1-Й МЕСЯЦ: НАСТРОЙКА ЖКТ И ЖЕЛЧЕОТТОКА</b>\n` +
      `│  • Хофитол (2 таб. × 3 р/д за 20 мин)\n` +
      `│  • Полисорб МП (минимум 3 недели, отдельно на 1.5–2 ч)\n` +
      `│  • Энтерол (250 мг × 2 р/д за 1 ч)\n` +
      `│  • Водный баланс и электролиты при дегидратации\n` +
      `│  <i>(Урсосан — только по согласованию с врачом при камнях)</i>\n` +
      `▼\n` +
      `┌─ <b>СО 2-ГО МЕСЯЦА: БАЗА «НЕЙРОБУСТ» (ДЛИТЕЛЬНО 6+ МЕСЯЦЕВ)</b>\n` +
      `│  • Глиатилин (400 мг × 2 р/д утром/днем) ➔ Месяцы 2–7+\n` +
      `│  • Креатин моногидрат (5 г/сут утром) ➔ Месяцы 2–7+\n` +
      `│  • L-Цитруллин (3–5 г/сут утром) ➔ Месяцы 2–7+\n` +
      `▼\n` +
      `┌─ <b>3-Й И 4-Й МЕСЯЦЫ: ЭТАП С ФЕНОТРОПИЛОМ (РОВНО 2 МЕСЯЦА)</b>\n` +
      `│  • Фенотропил (100 мг утром натощак) ➔ Месяцы 3 и 4\n` +
      `│  • <i>Прием базы (Глиатилин + Креатин + Цитруллин) продолжается!</i>\n` +
      `▼\n` +
      `┌─ <b>ДАЛЬНЕЙШИЕ АВТОРСКИЕ ОПЦИИ (ВСПОМОГАТЕЛЬНЫЕ)</b>\n` +
      `│  • Рассмотрение: Пирацетам ➔ далее Ноопепт ➔ иные ноотропы\n` +
      `└  <i>(Не входят в обязательный базовый стек)</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🫄 Этап 1', callback_data: 'course_stage_1' },
          { text: '🧠 Этап 2', callback_data: 'course_stage_2' },
          { text: '⚡ Этап 3', callback_data: 'course_stage_3' },
        ],
        [
          { text: '🔙 К обзору курса', callback_data: 'nav_course_root' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  // =========================================================================
  // 3. НОВЫЙ РАЗДЕЛ: ПОХУДЕНИЕ И ПИТАНИЕ
  // =========================================================================
  function getNutritionMenuView(userId: number) {
    const user = storage.getUser(userId);
    const lastWeight = user.weightDiary?.[0];
    const weightNote = lastWeight
      ? `Текущий вес: <b>${lastWeight.weightKg} кг</b> (от ${lastWeight.date})`
      : `<i>Вес не внесен. Отправьте число (напр. <code>82.5</code> или команду <code>/weight 82.5</code>)</i>`;

    const text =
      `<b>⚖️ ПОХУДЕНИЕ И ПИТАНИЕ</b>\n` +
      `<i>Авторский подход @DonDearOfficina к оптимизации состава тела</i>\n\n` +
      `<b>Ваш дневник:</b> ${weightNote}\n\n` +
      `<b>Структура раздела:</b>\n` +
      `• <b>Авторская концепция питания:</b> баланс макронутриентов, плотность питательных веществ и связь с нейросистемой.\n` +
      `• <b>Снижение доли пищевых жиров:</b> один из ключевых инструментов автора при работе с составом тела.\n` +
      `• <b>Энергетический баланс:</b> различие между сокращением пищевых жиров, общим дефицитом калорий и снижением жировой массы.\n` +
      `• <b>Питание и гормоны:</b> поддержание стероидогенеза без экстремальных дефицитов незаменимых жирных кислот.\n` +
      `• <b>Дневник веса:</b> простое фиксирование динамики массы тела.\n\n` +
      `<i>Выберите интересующий подраздел:</i>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🥑 Снижение жиров в рационе', callback_data: 'nutr_fats' }],
        [
          { text: '🥗 Концепция питания', callback_data: 'nutr_concept' },
          { text: '⚡ Энергобаланс', callback_data: 'nutr_energy' },
        ],
        [
          { text: '🧬 Питание и гормоны', callback_data: 'nutr_hormones' },
          { text: '📊 Дневник веса', callback_data: 'nutr_diary' },
        ],
        [
          { text: '📩 Задать вопрос автору', url: 'https://t.me/DonDearOfficina' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  function getNutritionFatsView() {
    const text =
      `<b>🥑 СНИЖЕНИЕ КОЛИЧЕСТВА ЖИРОВ В РАЦИОНЕ</b>\n` +
      `<i>[Статус: Авторский материал готовится к публикации]</i>\n\n` +
      `<b>Ключевая идея автора:</b>\n` +
      `Снижение доли пищевых жиров — важный авторский инструмент регуляции состава тела и метаболической гибкости.\n\n` +
      `<b>Принципиальные различия понятий:</b>\n` +
      `1. <b>Снижение доли жиров в рационе</b> — перераспределение макронутриентов в пользу белка и сложных углеводов.\n` +
      `2. <b>Общий дефицит энергии (калорий)</b> — условие расхода эндогенных запасов энергии.\n` +
      `3. <b>Снижение жировой массы тела</b> — долгосрочная цель изменения состава тела.\n\n` +
      `<b>⚠️ Предостережение от крайностей:</b>\n` +
      `Подход автора не означает полного исключения жиров или провоцирования дефицита незаменимых полиненасыщенных жирных кислот (Омега-3, Омега-6). Экстремальные безжировые диеты нарушают усвоение жирорастворимых витаминов и синтез стероидных гормонов.\n\n` +
      `<i>Точные авторские нормативы, соотношения БЖУ и личный опыт будут опубликованы после утверждения автором.</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📊 Дневник веса', callback_data: 'nutr_diary' },
          { text: '🥗 Назад к питанию', callback_data: 'nav_nutrition_root' },
        ],
        [
          { text: '📩 Спросить автора', url: 'https://t.me/DonDearOfficina' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  function getNutritionConceptView() {
    const text =
      `<b>🥗 АВТОРСКАЯ КОНЦЕПЦИЯ ПИТАНИЯ</b>\n` +
      `<i>[Статус: Авторский материал готовится к публикации]</i>\n\n` +
      `Питание в системе @DonDearOfficina рассматривается не изолированно, а как часть каскада: работа ЖКТ ➔ усвоение нутриентов ➔ обеспечение нейростека субстратами ➔ физическая активность.\n\n` +
      `• Достаточный объем полноценного белка для синтеза нейромедиаторов и мышечной ткани.\n` +
      `• Сложные углеводы для стабильного гликемического профиля без провалов когнитивной концентрации.\n` +
      `• Контроль доли пищевых жиров для поддержания легкости пищеварения и оптимальной скорости пассажа.\n\n` +
      `<i>Подробный авторский разбор продуктов и режима питания находится в подготовке.</i>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🥑 Снижение жиров', callback_data: 'nutr_fats' }],
        [
          { text: '🔙 К питанию', callback_data: 'nav_nutrition_root' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  function getNutritionEnergyView() {
    const text =
      `<b>⚡ ЭНЕРГЕТИЧЕСКИЙ БАЛАНС И ПОЛНОЦЕННОСТЬ</b>\n\n` +
      `Основа изменения массы тела — соотношение поступившей и израсходованной энергии (CICO).\n\n` +
      `• Без энергетического дефицита снижение жировой массы физиологически невозможно.\n` +
      `• Дефицит не должен быть чрезмерным (обычно не более 15–20% от суточного расхода TDEE), чтобы не вызвать компенсаторный срыв и замедление метаболизма.\n` +
      `• Достаточность микронутриентов (витамины группы B, цинк, магний, железо) обеспечивает стабильность ферментных систем.`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📊 Дневник веса', callback_data: 'nutr_diary' },
          { text: '🔙 К питанию', callback_data: 'nav_nutrition_root' },
        ],
        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
      ],
    };

    return { text, keyboard };
  }

  function getNutritionHormonesView() {
    const text =
      `<b>🧬 ПИТАНИЕ И ГОРМОНАЛЬНАЯ СИСТЕМА</b>\n\n` +
      `Влияние рациона на эндокринный профиль:\n\n` +
      `• <b>Тестостерон и холестерин:</b> Холестерин является предшественником всех стероидных гормонов. Снижение жиров в рационе требует баланса, чтобы не нарушить эндогенный стероидогенез.\n` +
      `• <b>Инсулин:</b> Контроль простых сахаров снижает инсулинорезистентность и системное воспаление.\n` +
      `• <b>Лептин:</b> Сигнал сытости, падает при резком ограничении калорий, провоцируя сильный голод.\n\n` +
      `<i>Авторские материалы о связи питания, тренировок и гормонов готовятся автором к публикации.</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔙 К питанию', callback_data: 'nav_nutrition_root' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  function getWeightDiaryView(userId: number) {
    const user = storage.getUser(userId);
    const diary = user.weightDiary || [];

    let entriesText = '';
    if (diary.length === 0) {
      entriesText = '<i>Записей пока нет. Чтобы внести вес, просто отправьте боту сообщение с числом (например: <code>82.5</code> или команду <code>/weight 82.5</code>).</i>\n';
    } else {
      entriesText = '<b>Последние записи веса:</b>\n';
      diary.slice(0, 7).forEach((entry, idx) => {
        const note = entry.notes ? ` (${escapeHtml(entry.notes)})` : '';
        entriesText += `${idx + 1}. <b>${entry.date}</b>: ${entry.weightKg} кг${note}\n`;
      });
    }

    const text =
      `<b>📊 ДНЕВНИК ВЕСА И САМОЧУВСТВИЯ</b>\n\n` +
      `${entriesText}\n` +
      `<b>Как добавить запись:</b>\n` +
      `Отправьте боту вес сообщением: например, <code>82.5</code> или <code>/weight 82.5</code>\n\n` +
      `<i>Данные сохраняются на постоянном сервере и доступны в вашем профиле.</i>`;

    const keyboard = {
      inline_keyboard: [
        diary.length > 0
          ? [{ text: '🗑️ Удалить последнюю запись', callback_data: 'diary_delete_last' }]
          : [],
        [
          { text: '🔙 К питанию', callback_data: 'nav_nutrition_root' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  // =========================================================================
  // 4. ВСПОМОГАТЕЛЬНЫЙ КАТАЛОГ И КАРТОЧКИ ПРЕПАРАТОВ
  // =========================================================================
  function getAuxiliaryCatalogView(page: number = 0) {
    // Вспомогательные препараты: все, где is_main_course === false
    const auxiliaryMeds = INITIAL_MEDICATIONS.filter((m) => !m.is_main_course && m.status === 'active');
    const PAGE_SIZE = 8;
    const totalPages = Math.ceil(auxiliaryMeds.length / PAGE_SIZE);
    const currentPage = Math.max(0, Math.min(page, totalPages - 1));
    const pageItems = auxiliaryMeds.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    const buttons = pageItems.map((med) => [
      {
        text: `💊 ${med.name}`,
        callback_data: `med_view_${med.id}`,
      },
    ]);

    const navRow = [];
    if (currentPage > 0) {
      navRow.push({ text: '⬅️ Назад', callback_data: `aux_page_${currentPage - 1}` });
    }
    if (currentPage < totalPages - 1) {
      navRow.push({ text: 'Вперед ➡️', callback_data: `aux_page_${currentPage + 1}` });
    }

    const text =
      `<b>📦 ВСПОМОГАТЕЛЬНЫЕ ПРЕПАРАТЫ И БАДЫ</b>\n` +
      `<i>Страница ${currentPage + 1} из ${totalPages} (всего позиций: ${auxiliaryMeds.length})</i>\n\n` +
      `Препараты, вынесенные автором за рамки базового курса:\n` +
      `• Гастропротекторы и ферменты по индивидуальным показаниям\n` +
      `• Электролиты и средства гидратации при дегидратации\n` +
      `• Дополнительные ноотропы для отдельного рассмотрения (Пирацетам, <b>Ноопепт</b>)\n` +
      `• Микронутриенты, адаптогены и витамины\n\n` +
      `<i>Нажмите на препарат для детальной карточки:</i>`;

    const keyboard = {
      inline_keyboard: [
        ...buttons,
        navRow.length > 0 ? navRow : [],
        [{ text: '🎯 Начать авторский курс', callback_data: 'nav_course_root' }],
        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
      ],
    };

    return { text, keyboard };
  }

  function getMedDetailView(medId: number) {
    const med = INITIAL_MEDICATIONS.find((m) => m.id === medId);
    if (!med) {
      return {
        text: '⚠️ Препарат не найден в каталоге.',
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
      `<b>1. Название:</b> <b>${escapeHtml(med.name)}</b>\n` +
      `<i>Активное вещество: ${escapeHtml(med.active_ingredient || 'Уточняется')}\n` +
      `Категория: ${legalLabel} | Статус: ${isCourse}</i>\n\n` +
      `<b>2. Для чего используется:</b>\n` +
      `${escapeHtml(med.purpose || med.notes || 'Информация уточняется')}\n\n` +
      `<b>3. Когда рассматривается применение:</b>\n` +
      `${escapeHtml(med.when_considered || med.why_in_stack || 'По индивидуальным показаниям')}\n\n` +
      `<b>4. Как принимать по инструкции (производитель):</b>\n` +
      `${escapeHtml(med.instruction_usage || med.dose || 'Строго по официальной инструкции производителя')}\n\n` +
      `<b>5. Личный опыт автора:</b>\n` +
      `${escapeHtml(med.personal_experience || 'Наблюдение автора, не заменяет консультацию врача')}\n\n` +
      `<b>6. Ограничения и предостережения:</b>\n` +
      `${escapeHtml(med.precautions || 'Противопоказания по инструкции производителя')}\n\n` +
      `<b>7. Связь с основным курсом:</b>\n` +
      `${escapeHtml(med.relation_to_main_course || 'Дополнительный компонент вне основного курса')}\n\n` +
      `<i>Личный опыт автора не является универсальным назначением. Это не медицинская рекомендация. По вопросам применения проконсультируйтесь с врачом или напишите автору.</i>`;

    const backCallback = med.is_main_course ? 'nav_course_root' : 'nav_auxiliary_root';
    const backLabel = med.is_main_course ? '🔙 К авторскому курсу' : '🔙 Ко вспомогательным БАДам';

    const keyboard = {
      inline_keyboard: [
        [{ text: `📩 Спросить автора про ${med.name}`, url: 'https://t.me/DonDearOfficina' }],
        [
          { text: backLabel, callback_data: backCallback },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  // =========================================================================
  // 5. ТРЕНИРОВКИ, МАТЕРИАЛЫ, ПРОФИЛЬ
  // =========================================================================
  function getWorkoutView(userId: number) {
    const todayStr = new Date().toISOString().split('T')[0];
    const completedList = storage.getWorkoutExercisesForDate(userId, todayStr);

    const isDone = (k: string) => completedList.includes(k);

    const text =
      `<b>🏋️ СИСТЕМА ТРЕНИРОВОК С ПРИОРИТЕТОМ НОГ</b>\n` +
      `<b>Автор концепции:</b> @DonDearOfficina | <b>Длительность:</b> 45–60 мин\n\n` +
      `<b>Ключевые принципы автора:</b>\n` +
      `• <b>Приоритет голени:</b> Каждое занятие начинается с икроножных мышц (мышечно-венозная помпа голени).\n` +
      `• <b>Приседания:</b> Сразу после икр — 2 подхода приседаний в отказ для разгона кровотока в малом тазу.\n` +
      `• <b>Комплекс всего тела:</b> Грудь + спина + плечи + ноги + ягодичные.\n` +
      `• <b>Отдых между сетами:</b> 1.5–2 минуты для полноценного восстановления АТФ.\n\n` +
      `<b>Чек-лист на сегодня (${todayStr}):</b>\n` +
      `${isDone('calves') ? '✅' : '⚪'} 1. Икроножные мышцы (2 подхода, 15–25 повт.)\n` +
      `${isDone('squats') ? '✅' : '⚪'} 2. Приседания в отказ (2 подхода)\n` +
      `${isDone('upper') ? '✅' : '⚪'} 3. Верх тела (Грудь + Спина + Плечи)\n` +
      `${isDone('glutes') ? '✅' : '⚪'} 4. Ягодичные и доп. движения\n`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: isDone('calves') ? '✅ Икры' : '⚪ Икры', callback_data: 'toggle_work_calves' },
          { text: isDone('squats') ? '✅ Присед' : '⚪ Присед', callback_data: 'toggle_work_squats' },
        ],
        [
          { text: isDone('upper') ? '✅ Верх' : '⚪ Верх', callback_data: 'toggle_work_upper' },
          { text: isDone('glutes') ? '✅ Ягодицы' : '⚪ Ягодицы', callback_data: 'toggle_work_glutes' },
        ],
        [
          { text: '⏱️ Таймер 90 сек', callback_data: 'workout_timer_90' },
          { text: '⏱️ Таймер 120 сек', callback_data: 'workout_timer_120' },
        ],
        [
          { text: '📋 Список упражнений', callback_data: 'workout_list' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  function getMaterialsListView() {
    const text =
      `<b>📚 МАТЕРИАЛЫ АВТОРА И БАЗА ЗНАНИЙ</b>\n\n` +
      `Здесь собраны авторские разборы механизмов действия препаратов, биохимии и смежных направлений:\n\n` +
      `• Статьи по этапам курса и нейропластичности\n` +
      `• Разборы взаимодействий микроэлементов (железо vs цинк по DMT-1)\n` +
      `• Исламская медицина (тибб-и-набави) в контексте современной фармации\n\n` +
      `<i>Выберите интересующий раздел:</i>`;

    const artButtons = INITIAL_KNOWLEDGE_NOTES.slice(0, 6).map((note) => [
      { text: `📄 ${note.title.slice(0, 35)}...`, callback_data: `kb_art_${note.id}` },
    ]);

    const keyboard = {
      inline_keyboard: [
        ...artButtons,
        [{ text: '🕌 Исламская медицина', callback_data: 'nav_islamic' }],
        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
      ],
    };

    return { text, keyboard };
  }

  function getKnowledgeArticleView(artId: number) {
    const note = INITIAL_KNOWLEDGE_NOTES.find((n) => n.id === artId);
    if (!note) {
      return {
        text: '⚠️ Статья не найдена.',
        keyboard: { inline_keyboard: [[{ text: '🔙 К материалам', callback_data: 'nav_materials' }]] },
      };
    }

    const text =
      `<b>📄 ${escapeHtml(note.title)}</b>\n` +
      `<i>Автор: @DonDearOfficina | Тема: ${escapeHtml(note.topic)}</i>\n\n` +
      `${escapeHtml(note.body)}\n\n` +
      `<i>Личный опыт автора и разбор открытых данных. По вопросам обращайтесь к автору.</i>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📩 Спросить автора', url: 'https://t.me/DonDearOfficina' }],
        [
          { text: '🔙 К материалам', callback_data: 'nav_materials' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  function getIslamicListView() {
    const text =
      `<b>🕌 ИСЛАМСКАЯ МЕДИЦИНА (ТИББ-И-НАБАВИ)</b>\n\n` +
      `Традиционные средства сунны через призму современной фармации.\n` +
      `Традиция дает культурный и исторический контекст, а безопасность и применение согласуются с официальными инструкциями.\n\n` +
      `<i>Выберите средство:</i>`;

    const buttons = INITIAL_ISLAMIC_REMEDIES.slice(0, 6).map((rem) => [
      { text: `🌿 ${rem.name_ru}`, callback_data: `isl_view_${rem.id}` },
    ]);

    const keyboard = {
      inline_keyboard: [
        ...buttons,
        [
          { text: '🔙 К материалам', callback_data: 'nav_materials' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  function getIslamicDetailView(remId: number) {
    const rem = INITIAL_ISLAMIC_REMEDIES.find((r) => r.id === remId);
    if (!rem) {
      return {
        text: '⚠️ Запись не найдена.',
        keyboard: { inline_keyboard: [[{ text: '🔙 К списку', callback_data: 'nav_islamic' }]] },
      };
    }

    const contraText = Array.isArray(rem.contraindications)
      ? rem.contraindications.join(', ')
      : (rem.contraindications as any) || 'Индивидуальная непереносимость';

    const text =
      `<b>🌿 ${escapeHtml(rem.name_ru)}</b>\n` +
      `<i>${escapeHtml(rem.name_lat || '')}</i>\n\n` +
      `<b>🕌 Традиционный контекст:</b>\n${escapeHtml(rem.traditional_use || 'Традиционное применение')}\n\n` +
      `<b>🔬 Фармакологическое действие:</b>\n${escapeHtml(rem.scientific_evidence || 'Изучается')}\n\n` +
      `<b>⚠️ Ограничения и противопоказания:</b>\n${escapeHtml(contraText)}\n\n` +
      `<i>Это не медицинская рекомендация.</i>`;


    const keyboard = {
      inline_keyboard: [
        [{ text: '📩 Спросить автора', url: 'https://t.me/DonDearOfficina' }],
        [
          { text: '🔙 К исламской медицине', callback_data: 'nav_islamic' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  function getProfileView(userId: number) {
    const user = storage.getUser(userId);
    const confirmedText = user.confirmedStart
      ? `✅ <b>Курс начат:</b> ${user.startedAt ? new Date(user.startedAt).toLocaleDateString('ru-RU') : 'да'}`
      : `⚪ <b>Курс не начат</b> (режим ознакомления)`;

    const weight = user.weightDiary?.[0];
    const weightText = weight
      ? `${weight.weightKg} кг (${weight.date})`
      : 'не внесен';

    const text =
      `<b>👤 МОЙ ПРОФИЛЬ И ПРОГРЕСС</b>\n\n` +
      `• <b>ID пользователя:</b> <code>${userId}</code>\n` +
      `• <b>Статус участия:</b> ${confirmedText}\n` +
      `• <b>Текущий этап:</b> Месяц ${user.currentPhase}\n` +
      `• <b>Последний вес:</b> ${weightText}\n\n` +
      `<b>Управление участием:</b>\n` +
      `Вы можете подтвердить начало прохождения авторского курса, переключать этапы для ведения чек-листов или вносить вес.`;

    const confirmToggle = user.confirmedStart
      ? [{ text: '⏸ Приостановить курс', callback_data: 'profile_toggle_course' }]
      : [{ text: '✅ Подтвердить начало авторского курса', callback_data: 'course_confirm_start' }];

    const keyboard = {
      inline_keyboard: [
        confirmToggle,
        [
          { text: '1-й мес (ЖКТ)', callback_data: 'set_phase_1' },
          { text: '2-й мес (Нейробуст)', callback_data: 'set_phase_2' },
          { text: '3-й мес (Фенотропил)', callback_data: 'set_phase_3' },
        ],
        [
          { text: '📊 Дневник веса', callback_data: 'nutr_diary' },
          { text: '🏋️ Тренировки', callback_data: 'nav_workout' },
        ],
        [
          { text: '📩 Задать вопрос автору', url: 'https://t.me/DonDearOfficina' },
          { text: '🏠 Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };

    return { text, keyboard };
  }

  // =========================================================================
  // 6. MAIN POLLING LOOP & DISPATCHER
  // =========================================================================
  async function poll() {
    while (isRunning) {
      try {
        botTelemetry.lastPollTimestamp = new Date().toISOString();

        const response = await fetch(`${baseUrl}/getUpdates?offset=${offset}&timeout=15`, {
          signal: AbortSignal.timeout(22000),
        });

        if (response.status === 409) {
          botTelemetry.lastError = '409 Conflict: Another active bot instance is polling. Pausing 30s...';
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
            botTelemetry.lastError = '409 Conflict: Another bot instance is polling.';
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

            // --- A. INLINE CALLBACK QUERY HANDLER ---
            if (update.callback_query) {
              const cq = update.callback_query;
              const chatId = cq.message?.chat.id;
              const messageId = cq.message?.message_id;
              const action = cq.data || '';
              const userId = cq.from.id;

              await answerCallback(cq.id);
              if (!chatId || !messageId) continue;

              // Main navigation
              if (action === 'menu_main') {
                const view = getMainMenuView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Course
              else if (action === 'nav_course_root') {
                const view = getCourseOverviewView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'course_confirm_start') {
                storage.updateUser(userId, (u) => {
                  u.confirmedStart = true;
                  if (!u.startedAt) u.startedAt = new Date().toISOString();
                });
                await answerCallback(cq.id, '✅ Начало курса подтверждено!');
                const view = getCourseOverviewView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'profile_toggle_course') {
                storage.updateUser(userId, (u) => {
                  u.confirmedStart = !u.confirmedStart;
                });
                const view = getProfileView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'course_stage_1') {
                const view = getStage1View();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'course_water_balance') {
                const view = getWaterBalanceView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'course_stage_2') {
                const view = getStage2View();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'course_stage_3') {
                const view = getStage3View();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'course_timeline') {
                const view = getCourseTimelineView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Auxiliary Catalog
              else if (action === 'nav_auxiliary_root') {
                const view = getAuxiliaryCatalogView(0);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action.startsWith('aux_page_')) {
                const p = parseInt(action.replace('aux_page_', ''), 10) || 0;
                const view = getAuxiliaryCatalogView(p);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action.startsWith('med_view_')) {
                const medId = parseInt(action.replace('med_view_', ''), 10);
                const view = getMedDetailView(medId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Nutrition & Weight
              else if (action === 'nav_nutrition_root') {
                const view = getNutritionMenuView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'nutr_fats') {
                const view = getNutritionFatsView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'nutr_concept') {
                const view = getNutritionConceptView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'nutr_energy') {
                const view = getNutritionEnergyView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'nutr_hormones') {
                const view = getNutritionHormonesView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'nutr_diary') {
                const view = getWeightDiaryView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'diary_delete_last') {
                const user = storage.getUser(userId);
                if (user.weightDiary && user.weightDiary.length > 0) {
                  const firstId = user.weightDiary[0].id;
                  storage.deleteWeightEntry(userId, firstId);
                  await answerCallback(cq.id, '🗑️ Запись веса удалена');
                }
                const view = getWeightDiaryView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Workouts
              else if (action === 'nav_workout') {
                const view = getWorkoutView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action.startsWith('toggle_work_')) {
                const key = action.replace('toggle_work_', '');
                const todayStr = new Date().toISOString().split('T')[0];
                storage.recordWorkoutExercise(userId, key, todayStr);
                const view = getWorkoutView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'workout_timer_90') {
                await sendMessage(chatId, '⏱️ <b>Таймер отдыха запущен: 90 секунд!</b>\n\nВосстанавливайте дыхание, пейте воду.');
                setTimeout(() => {
                  sendMessage(chatId, '🔔 <b>90 секунд прошло! Время начинать подход!</b> 💪');
                }, 90000);
              } else if (action === 'workout_timer_120') {
                await sendMessage(chatId, '⏱️ <b>Таймер отдыха запущен: 120 секунд!</b>\n\nДлинная пауза для восстановления перед тяжелым подходом.');
                setTimeout(() => {
                  sendMessage(chatId, '🔔 <b>120 секунд прошло! Время следующего подхода!</b> 🔥');
                }, 120000);
              } else if (action === 'workout_list') {
                let exercisesText = `<b>🏋️ ПОЛНЫЙ ПЛАН УПРАЖНЕНИЙ</b>\n\n`;
                INITIAL_WORKOUT_EXERCISES.forEach((ex, idx) => {
                  exercisesText += `${idx + 1}. <b>${escapeHtml(ex.muscle_title)}</b>\n` +
                    `Движение: ${escapeHtml(ex.name)}\n` +
                    `Режим: ${escapeHtml(ex.sets)} | ${escapeHtml(ex.reps)}\n\n`;
                });
                const keyboard = {
                  inline_keyboard: [[{ text: '🔙 Назад к тренировкам', callback_data: 'nav_workout' }]],
                };
                await editMessage(chatId, messageId, exercisesText, keyboard);
              }
              // Materials & Islamic
              else if (action === 'nav_materials' || action === 'nav_knowledge') {
                const view = getMaterialsListView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action.startsWith('kb_art_')) {
                const artId = parseInt(action.replace('kb_art_', ''), 10);
                const view = getKnowledgeArticleView(artId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action === 'nav_islamic') {
                const view = getIslamicListView();
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action.startsWith('isl_view_')) {
                const remId = parseInt(action.replace('isl_view_', ''), 10);
                const view = getIslamicDetailView(remId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }
              // Profile
              else if (action === 'nav_profile') {
                const view = getProfileView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              } else if (action.startsWith('set_phase_')) {
                const p = parseInt(action.replace('set_phase_', ''), 10) as any;
                storage.updateUser(userId, (u) => {
                  u.currentPhase = p;
                });
                const view = getProfileView(userId);
                await editMessage(chatId, messageId, view.text, view.keyboard);
              }

              continue;
            }

            // --- B. TEXT MESSAGES & SLASH COMMANDS ---
            if (update.message && typeof update.message.text === 'string') {
              const msg = update.message;
              const chatId = msg.chat.id;
              const userId = msg.from.id;
              const text = update.message.text.trim();
              const lower = text.toLowerCase();

              // 1. Red Flags Check (Immediate clinical emergency notice)
              if (RED_FLAGS.some((rf) => lower.includes(rf))) {
                await sendMessage(
                  chatId,
                  `🚨 <b>ВНИМАНИЕ: ВОЗМОЖНО НЕОТЛОЖНОЕ СОСТОЯНИЕ</b>\n\n` +
                  `Описанные вами симптомы могут угрожать жизни или требовать срочной квалифицированной помощи.\n\n` +
                  `Пожалуйста, немедленно свяжитесь со службой скорой помощи: <b>103</b> или единым номером <b>112</b>!\n\n` +
                  `<i>Бот и автор не заменяют экстренную медицинскую службу. Не откладывайте вызов специалистов.</i>`
                );
                continue;
              }

              // 2. Start command with deep-link parameter support
              if (text.startsWith('/start')) {
                const param = text.split(' ')[1]?.trim().toLowerCase();
                if (param === 'gastro' || param === 'water' || param === 'voda') {
                  const view = getWaterBalanceView();
                  await sendMessage(chatId, view.text, view.keyboard);
                } else if (param === 'nutrition' || param === 'fats' || param === 'weight') {
                  const view = getNutritionMenuView(userId);
                  await sendMessage(chatId, view.text, view.keyboard);
                } else if (param === 'course' || param === 'stack') {
                  const view = getCourseOverviewView(userId);
                  await sendMessage(chatId, view.text, view.keyboard);
                } else {
                  const view = getMainMenuView(userId);
                  await sendMessage(chatId, view.text, view.keyboard);
                }
                continue;
              }

              // 3. Weight logging via command or direct number input
              const weightCmdMatch = text.match(/^\/weight\s+([0-9]+([.,][0-9]+)?)/i);
              const directNumMatch = text.match(/^([0-9]{2,3}([.,][0-9]+)?)$/);
              if (weightCmdMatch || directNumMatch) {
                const rawNum = (weightCmdMatch ? weightCmdMatch[1] : directNumMatch![1]).replace(',', '.');
                const val = parseFloat(rawNum);
                if (val >= 30 && val <= 300) {
                  storage.addWeightEntry(userId, val);
                  await sendMessage(
                    chatId,
                    `⚖️ <b>Запись веса сохранена: ${val} кг</b>\n\n` +
                    `Дата: ${new Date().toLocaleDateString('ru-RU')}\n` +
                    `Запись сохранена на сервере и доступна в дневнике веса.`,
                    {
                      inline_keyboard: [
                        [{ text: '📊 Открыть дневник веса', callback_data: 'nutr_diary' }],
                        [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
                      ],
                    }
                  );
                  continue;
                }
              }

              // 4. Standard Commands
              if (text === '/menu' || lower === 'меню' || lower === 'старт') {
                const view = getMainMenuView(userId);
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/course' || lower === 'курс') {
                const view = getCourseOverviewView(userId);
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/auxiliary' || lower === 'бады') {
                const view = getAuxiliaryCatalogView(0);
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/nutrition' || lower === 'питание' || lower === 'похудение') {
                const view = getNutritionMenuView(userId);
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/workout' || lower === 'тренировки') {
                const view = getWorkoutView(userId);
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/materials' || text === '/knowledge' || lower === 'материалы') {
                const view = getMaterialsListView();
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/islamic') {
                const view = getIslamicListView();
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/profile' || lower === 'профиль') {
                const view = getProfileView(userId);
                await sendMessage(chatId, view.text, view.keyboard);
              } else if (text === '/dondear' || text === '/assistant' || text === '/ask') {
                await sendMessage(
                  chatId,
                  `📩 <b>Связь с автором курса @DonDearOfficina</b>\n\n` +
                  `Дипломированный провизор-химик консультирует лично:\n` +
                  `👉 <b><a href="https://t.me/DonDearOfficina">@DonDearOfficina</a></b>\n\n` +
                  `<i>Бот не использует автоматические генерации и не заменяет специалиста. Нажмите кнопку ниже для перехода в диалог:</i>`,
                  {
                    inline_keyboard: [
                      [{ text: '📩 Написать @DonDearOfficina', url: 'https://t.me/DonDearOfficina' }],
                      [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
                    ],
                  }
                );
              } else {
                // Free text handler -> Polite direct route to author
                await sendMessage(
                  chatId,
                  `📩 <b>Обращение к автору курса</b>\n\n` +
                  `По всем вопросам применения программы, индивидуального состояния здоровья и нюансов добавок вы можете написать лично автору курса в Telegram:\n\n` +
                  `👉 <b><a href="https://t.me/DonDearOfficina">@DonDearOfficina</a></b>\n\n` +
                  `<i>(В боте отключены генерации AI-ассистента в целях безопасности. Консультации ведутся лично автором.)</i>`,
                  {
                    inline_keyboard: [
                      [{ text: '📩 Написать @DonDearOfficina', url: 'https://t.me/DonDearOfficina' }],
                      [
                        { text: '🎯 Авторский курс', callback_data: 'nav_course_root' },
                        { text: '🏠 Главное меню', callback_data: 'menu_main' },
                      ],
                    ],
                  }
                );
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

  // Periodic heartbeat
  const heartbeatTimer = setInterval(() => {
    if (!isRunning) return;
    const uptimeSec = Math.floor((Date.now() - new Date(botTelemetry.startTime).getTime()) / 1000);
    const healthNote = botTelemetry.consecutiveErrors > 0 ? ` [reconnecting: ${botTelemetry.consecutiveErrors}]` : ' [healthy]';
    console.log(
      `[Telegram Watchdog Heartbeat] Status: READY • Uptime: ${uptimeSec}s • Processed: ${botTelemetry.totalUpdatesProcessed}${healthNote}`
    );
  }, 180000);

  // Start polling loop
  poll();

  return () => {
    isRunning = false;
    botTelemetry.isRunning = false;
    clearInterval(heartbeatTimer);
  };
}
