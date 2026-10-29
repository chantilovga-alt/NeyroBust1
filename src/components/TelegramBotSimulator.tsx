import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Pill,
  Award,
  ExternalLink,
  Dumbbell,
  Activity,
  Flame,
  Scale,
  Droplets,
  User,
  HeartHandshake,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KnowledgeNote, Medication } from '../types';

interface BotMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  buttons?: { text: string; action: () => void; variant?: 'default' | 'danger' | 'success' | 'outline' }[];
  isRedFlag?: boolean;
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

export const TelegramBotSimulator: React.FC = () => {
  const {
    currentUser,
    medications,
    islamicRemedies,
    knowledgeNotes,
    workoutExercises,
    toggleWorkoutExercise,
    toggleAuthorProtocol,
    consumeInvite,
    triggerFunnel,
    funnelStages,
    funnelTriggers,
    advanceFunnelStep,
    funnelLeads,
  } = useApp();

  const [simChannel, setSimChannel] = useState<'telegram' | 'instagram'>('telegram');
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [weightList, setWeightList] = useState<Array<{ date: string; weight: number }>>([
    { date: '29.10.2026', weight: 81.2 },
    { date: '22.10.2026', weight: 82.0 },
    { date: '15.10.2026', weight: 82.8 },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Instagram Direct Messages State
  const [igMessages, setIgMessages] = useState<
    Array<{
      id: string;
      sender: 'user' | 'dondear';
      text: string;
      timestamp: string;
      leadMagnet?: {
        title: string;
        description: string;
        pdfName: string;
        ctaText: string;
        startArg: string;
      };
    }>
  >([
    {
      id: 'ig-seed-1',
      sender: 'user',
      text: 'КУРС',
      timestamp: '11:20',
    },
    {
      id: 'ig-seed-2',
      sender: 'dondear',
      text: 'Приветствую! На связи @DonDearOfficina — дипломированный провизор-химик.\n\nМатериалы авторского курса доступны в Telegram-боте. Перейдите по ссылке ниже:',
      timestamp: '11:20',
      leadMagnet: {
        title: '🎯 Авторский курс оптимизации нейросистемы',
        description: 'Каскадная триада: ЖКТ и желчеотток ➔ Нейробуст (6+ мес) ➔ Двухмесячный этап с Фенотропилом.',
        pdfName: 'Авторский_курс_DonDearOfficina.pdf',
        ctaText: '🚀 Открыть в Telegram @DonDearOfficina_bot',
        startArg: 'course',
      },
    },
  ]);
  const [igInput, setIgInput] = useState('');
  const [igIsTyping, setIgIsTyping] = useState(false);
  const igChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    igChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [igMessages, igIsTyping]);

  const addBotMessage = (
    text: string,
    buttons?: { text: string; action: () => void; variant?: 'default' | 'danger' | 'success' | 'outline' }[],
    isRedFlag = false
  ) => {
    const newMsg: BotMessage = {
      id: Date.now().toString() + Math.random(),
      sender: 'bot',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      buttons,
      isRedFlag,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const addUserMessage = (text: string) => {
    const newMsg: BotMessage = {
      id: Date.now().toString() + Math.random(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  // Main Menu Buttons according to User Specifications
  const getMainButtons = (): {
    text: string;
    action: () => void;
    variant?: 'default' | 'danger' | 'success' | 'outline';
  }[] => [
    { text: '🎯 Начать авторский курс', action: () => handleSelectSection('author_course'), variant: 'success' },
    { text: '📦 Вспомогательные препараты и БАДы', action: () => handleSelectSection('auxiliary_meds') },
    { text: '⚖️ Похудение и питание', action: () => handleSelectSection('nutrition') },
    { text: '🏋️ Система тренировок', action: () => handleSelectSection('workout') },
    { text: '📚 Материалы автора', action: () => handleSelectSection('knowledge') },
    { text: '👤 Мой профиль и прогресс', action: () => handleSelectSection('profile') },
    { text: '📩 Задать вопрос автору', action: () => handleSelectSection('dondear'), variant: 'outline' },
  ];

  const getBackButton = () => ({
    text: '◀️ В главное меню',
    action: () => returnToMainMenu(),
    variant: 'outline' as const,
  });

  const returnToMainMenu = () => {
    addUserMessage('◀️ В меню');
    addBotMessage('🏛 <b>Главное меню @DonDearOfficina_bot</b>\n\n<i>Выберите раздел:</i>', getMainButtons());
  };

  const handleStartCommand = (customArgs?: string) => {
    setMessages([]);
    addUserMessage(customArgs ? `/start ${customArgs}` : '/start');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let contextNote = '';

      if (customArgs) {
        const lowerArg = customArgs.toLowerCase();
        if (lowerArg === 'water' || lowerArg === 'voda' || lowerArg === 'gastro') {
          renderWaterBalanceHub();
          return;
        } else if (lowerArg === 'nutrition' || lowerArg === 'fats' || lowerArg === 'weight') {
          renderNutritionHub();
          return;
        } else if (lowerArg === 'course' || lowerArg === 'stack') {
          renderAuthorCourseHub();
          return;
        } else if (lowerArg.startsWith('inv_')) {
          const raw = customArgs.replace('inv_', '');
          const res = consumeInvite(raw);
          contextNote = res.success ? `\n\n🎉 ${res.message}` : `\n\n⚠️ ${res.message}`;
        }
      }

      const welcomeText =
        `👋 Здравствуйте, <b>${currentUser.first_name}</b>!\n\n` +
        `Добро пожаловать в Telegram-бот авторского курса дипломированного провизора-химика <b>@DonDearOfficina</b>.\n\n` +
        `<b>⚙️ Архитектура курса (Cause-First):</b>\n` +
        `• <b>1-й этап (1-й месяц):</b> ЖКТ, желчеотток и водный баланс\n` +
        `• <b>2-й этап (со 2-го месяца):</b> Комплекс «Нейробуст» (Глиатилин + Креатин + L-Цитруллин, длительно 6+ месяцев)\n` +
        `• <b>3-й этап (3-й и 4-й месяцы):</b> Двухмесячный этап с Фенотропилом\n\n` +
        `<i>Все остальные средства вынесены в каталог «Вспомогательные препараты и БАДы».</i>${contextNote}\n\n` +
        `По всем индивидуальным вопросам вы можете обратиться лично к автору: <b>@DonDearOfficina</b>.`;

      addBotMessage(welcomeText, getMainButtons());
    }, 250);
  };

  useEffect(() => {
    handleStartCommand();
  }, []);

  // Section Routing
  const handleSelectSection = (section: string) => {
    if (section === 'author_course') {
      addUserMessage('🎯 Начать авторский курс');
      renderAuthorCourseHub();
    } else if (section === 'auxiliary_meds') {
      addUserMessage('📦 Вспомогательные препараты и БАДы');
      renderAuxiliaryMedsHub();
    } else if (section === 'nutrition') {
      addUserMessage('⚖️ Похудение и питание');
      renderNutritionHub();
    } else if (section === 'knowledge') {
      addUserMessage('📚 Материалы автора');
      renderKnowledgeNotesHub();
    } else if (section === 'workout') {
      addUserMessage('🏋️ Система тренировок');
      renderWorkoutHub();
    } else if (section === 'dondear') {
      addUserMessage('📩 Связаться с @DonDearOfficina');
      renderDonDearContactHub();
    } else if (section === 'profile') {
      addUserMessage('👤 Мой профиль');
      renderProfileHub();
    }
  };

  // 1. АВТОРСКИЙ КУРС
  const renderAuthorCourseHub = () => {
    const isStarted = currentUser.on_author_protocol;
    const startStatus = isStarted
      ? '✅ <b>Авторский курс начат!</b>\n<i>Текущий этап: Месяц 1 (ЖКТ и желчеотток)</i>\n\n'
      : 'ℹ️ <i>Вы находитесь в режиме изучения программы. Ознакомьтесь с этапами ниже. Для фиксации участия нажмите кнопку «Подтвердить начало курса».</i>\n\n';

    const text =
      `<b>🎯 АВТОРСКИЙ КУРС @DonDearOfficina</b>\n` +
      `<i>Единая последовательная программа оптимизации нейросистемы</i>\n\n` +
      `${startStatus}` +
      `<b>1️⃣ Первый месяц — ЖКТ, желчеотток и водный баланс</b>\n` +
      `• Хофитол, Полисорб МП (минимум 3 недели), Энтерол.\n` +
      `• Водный баланс и электролиты (Регидрон, Адиарин Регидрокомплекс по показаниям дегидратации).\n` +
      `• Урсосан — альтернатива Хофитолу при конкрементах (строго с врачом по УЗИ).\n\n` +
      `<b>2️⃣ Со второго месяца — Комплекс «Нейробуст» (длительно 6+ месяцев)</b>\n` +
      `• Глиатилин + Креатин + L-Цитруллин.\n` +
      `• «Нейробуст» — это название связки этих трех молекул, а не 4-й препарат! Прием продолжается <b>не менее 6 месяцев</b> (месяцы 2–7+).\n\n` +
      `<b>3️⃣ С третьего месяца — Двухмесячный этап с Фенотропилом</b>\n` +
      `• Фенотропил (Фонтурацетам) ровно 2 месяца (3-й и 4-й месяцы курса).\n` +
      `• Базовый прием компонентов 2-го месяца продолжается параллельно!\n\n` +
      `<i>После курса: опции Пирацетам ➔ далее Ноопепт (вне базового курса).</i>`;

    const confirmButton = isStarted
      ? { text: '👤 Мой прогресс по курсу', action: () => renderProfileHub(), variant: 'default' as const }
      : {
          text: '✅ Подтвердить начало авторского курса',
          action: () => {
            toggleAuthorProtocol();
            addUserMessage('✅ Подтвердить начало авторского курса');
            addBotMessage(
              '🎉 <b>Начало авторского курса подтверждено!</b>\n\n' +
                'Ваш статус обновлен. Чек-листы и этапы зафиксированы в вашем профиле.',
              [
                { text: '🫄 Перейти к Этапу 1 (ЖКТ)', action: () => renderCourseStage1(), variant: 'success' },
                getBackButton(),
              ]
            );
          },
          variant: 'success' as const,
        };

    addBotMessage(text, [
      confirmButton,
      { text: '🫄 Этап 1: ЖКТ и желчеотток (1-й мес)', action: () => renderCourseStage1() },
      { text: '💧 Водный баланс и электролиты', action: () => renderWaterBalanceHub() },
      { text: '🧠 Этап 2: Комплекс «Нейробуст» (6+ мес)', action: () => renderCourseStage2() },
      { text: '⚡ Этап 3: Фенотропил (3-й и 4-й мес)', action: () => renderCourseStage3() },
      { text: '🔄 Схема-таймлайн курса', action: () => renderCourseTimeline() },
      getBackButton(),
    ]);
  };

  const renderCourseStage1 = () => {
    addUserMessage('🫄 Этап 1: ЖКТ и желчеотток');
    const text =
      `<b>🫄 ЭТАП 1: ЖКТ, ЖЕЛЧЕОТТОК И ФУНДАМЕНТ ВСАСЫВАНИЯ (1-Й МЕСЯЦ)</b>\n\n` +
      `<b>Концепция автора:</b>\n` +
      `Без работающего ЖКТ все расчеты по ноотропам бессмысленны. Если нарушен отток желчи, жирорастворимые молекулы транзитируются, а эндотоксин вызывает субклиническое нейровоспаление.\n\n` +
      `<b>📋 Базовый авторский стек:</b>\n` +
      `1. <b>Хофитол</b> (экстракт артишока) — 2 таб. 3 р/д за 20 мин до еды курсом 20–30 дней.\n` +
      `2. <b>Полисорб МП</b> — <b>минимум 3 недели</b> (отдельно от еды и Хофитола на 1.5–2 часа).\n` +
      `3. <b>Энтерол</b> (Saccharomyces boulardii) — 250 мг 2 р/д за 1 час до еды (14–30 дней).\n\n` +
      `<b>⚠️ Урсосан:</b> альтернатива Хофитолу при камнях в желчном пузыре. Строго обсуждается с лечащим врачом по УЗИ.\n\n` +
      `<i>Ребагит, Креон и Омез ДСР исключены автором из базового курса.</i>`;

    addBotMessage(text, [
      { text: '🌿 Хофитол', action: () => renderMedCardByName('Хофитол') },
      { text: '🌪️ Полисорб МП', action: () => renderMedCardByName('Полисорб МП') },
      { text: '🛡️ Энтерол', action: () => renderMedCardByName('Энтерол') },
      { text: '💧 Водный баланс и электролиты', action: () => renderWaterBalanceHub(), variant: 'success' },
      { text: '➡️ Этап 2: Комплекс «Нейробуст»', action: () => renderCourseStage2() },
      getBackButton(),
    ]);
  };

  const renderWaterBalanceHub = () => {
    addUserMessage('💧 Водный баланс и электролиты');
    const text =
      `<b>💧 ВОДНЫЙ БАЛАНС И ЭЛЕКТРОЛИТЫ В КУРСЕ ЖКТ</b>\n\n` +
      `<b>1. Обычное питье vs Электролиты:</b>\n` +
      `• Чистая вода — ежедневная базовая потребность. Универсального принудительного объема для всех не существует, объем зависит от массы, нагрузки и климата.\n` +
      `• Растворы электролитов — соли для направленной компенсации потерь при патологической дегидратации (диарея, рвота, лихорадка, обильный пот).\n\n` +
      `<b>2. Проверенные средства при дегидратации:</b>\n` +
      `• <b>Регидрон</b> (лекарственный препарат для пероральной регидратации)\n` +
      `• <b>Адиарин Регидрокомплекс</b> (гипоосмолярная формула с цинком по стандартам ВОЗ)\n\n` +
      `<b>🚨 КРАСНЫЕ ФЛАГИ — СРОЧНАЯ ПОМОЩЬ (103 / 112):</b>\n` +
      `Западение глазных яблок, сухой язык, отсутствие мочеиспускания > 6 часов, спутанность сознания ➔ немедленно вызывайте скорую помощь!\n\n` +
      `<b>⚠️ Важно:</b> Электролиты НЕ ЯВЛЯЮТСЯ средством для похудения или диуретиком.`;

    addBotMessage(text, [
      { text: '💧 Карточка: Регидрон', action: () => renderMedCardByName('Регидрон') },
      { text: '💧 Карточка: Адиарин Регидро', action: () => renderMedCardByName('Адиарин Регидрокомплекс') },
      { text: '⬅️ Назад к 1-му этапу ЖКТ', action: () => renderCourseStage1() },
      getBackButton(),
    ]);
  };

  const renderCourseStage2 = () => {
    addUserMessage('🧠 Этап 2: Комплекс «Нейробуст»');
    const text =
      `<b>🧠 ЭТАП 2: КОМПЛЕКС «НЕЙРОБУСТ» (СО 2-ГО МЕСЯЦА, 6+ МЕС)</b>\n\n` +
      `<b>Ключевой принцип автора:</b>\n` +
      `«Нейробуст» — это название связки трех компонентов: Глиатилин + Креатин + L-Цитруллин.\n\n` +
      `Они подключаются со 2-го месяца и принимаются <b>МИНИМУМ ШЕСТЬ МЕСЯЦЕВ</b> (месяцы 2–7+), закладывая устойчивую холинергическую и сосудистую базу!\n\n` +
      `• <b>Глиатилин</b> (холина альфосцерат) — 400 мг 2 р/д до еды (6+ мес)\n` +
      `• <b>Креатин моногидрат</b> — 5 г каждое утро натощак (6+ мес)\n` +
      `• <b>L-Цитруллин</b> — 3–5 г утром натощак (6+ мес)\n\n` +
      `<i>Эта база продолжается без перерыва на 3-м и 4-м месяцах!</i>`;

    addBotMessage(text, [
      { text: '🧠 Глиатилин', action: () => renderMedCardByName('Глиатилин') },
      { text: '⚡ Креатин моногидрат', action: () => renderMedCardByName('Креатин моногидрат') },
      { text: '🩸 L-Цитруллин', action: () => renderMedCardByName('L-Цитруллин') },
      { text: '➡️ Этап 3: Фенотропил', action: () => renderCourseStage3() },
      getBackButton(),
    ]);
  };

  const renderCourseStage3 = () => {
    addUserMessage('⚡ Этап 3: Фенотропил');
    const text =
      `<b>⚡ ЭТАП 3: ДВУХМЕСЯЧНЫЙ ЭТАП С ФЕНОТРОПИЛОМ (3-Й И 4-Й МЕСЯЦЫ)</b>\n\n` +
      `На третьем месяце авторского курса подключается Фенотропил.\n\n` +
      `• <b>Длительность: ровно 2 месяца</b> (3-й месяц старт, 4-й месяц продолжение).\n` +
      `• <b>Фенотропил:</b> 100 мг утром натощак курсом ровно 2 месяца.\n` +
      `• Принимается СТРОГО на фоне продолжающегося приема базы 2-го этапа (Глиатилин, Креатин, Цитруллин)!\n\n` +
      `<b>📌 Последующие варианты автора:</b>\n` +
      `После завершения этапа с Фенотропилом автором описана опция: сначала Пирацетам, затем <b>Ноопепт</b>. Они не являются обязательными и вынесены во вспомогательный каталог.`;

    addBotMessage(text, [
      { text: '💊 Фенотропил (2 мес)', action: () => renderMedCardByName('Фенотропил') },
      { text: '🔄 Схема-таймлайн', action: () => renderCourseTimeline() },
      { text: '⬅️ Этап 2 (Нейробуст)', action: () => renderCourseStage2() },
      getBackButton(),
    ]);
  };

  const renderCourseTimeline = () => {
    addUserMessage('🔄 Схема-таймлайн курса');
    const text =
      `<b>🔄 ОБЩАЯ СХЕМА-ТАЙМЛАЙН АВТОРСКОГО КУРСА</b>\n\n` +
      `┌─ <b>1-Й МЕСЯЦ: НАСТРОЙКА ЖКТ И ЖЕЛЧЕОТТОКА</b>\n` +
      `│  • Хофитол (2 таб. × 3 р/д за 20 мин)\n` +
      `│  • Полисорб МП (минимум 3 недели, отдельно на 1.5–2 ч)\n` +
      `│  • Энтерол (250 мг × 2 р/д за 1 ч)\n` +
      `│  • Водный баланс и электролиты при дегидратации\n` +
      `│  <i>(Урсосан — по согласованию с врачом при камнях)</i>\n` +
      `▼\n` +
      `┌─ <b>СО 2-ГО МЕСЯЦА: БАЗА «НЕЙРОБУСТ» (6+ МЕСЯЦЕВ)</b>\n` +
      `│  • Глиатилин (400 мг × 2 р/д) ➔ Месяцы 2–7+\n` +
      `│  • Креатин (5 г/сут утром) ➔ Месяцы 2–7+\n` +
      `│  • L-Цитруллин (3–5 г/сут утром) ➔ Месяцы 2–7+\n` +
      `▼\n` +
      `┌─ <b>3-Й И 4-Й МЕСЯЦЫ: ЭТАП С ФЕНОТРОПИЛОМ (РОВНО 2 МЕСЯЦА)</b>\n` +
      `│  • Фенотропил (100 мг утром натощак)\n` +
      `│  • <i>База (Глиатилин + Креатин + Цитруллин) продолжается!</i>\n` +
      `▼\n` +
      `┌─ <b>ДАЛЬНЕЙШИЕ ОПЦИИ АВТОРА</b>\n` +
      `│  • Пирацетам ➔ далее Ноопепт ➔ иные ноотропы\n` +
      `└  <i>(Вспомогательные средства)</i>`;

    addBotMessage(text, [
      { text: '🫄 К Этапу 1', action: () => renderCourseStage1() },
      { text: '🧠 К Этапу 2', action: () => renderCourseStage2() },
      { text: '⚡ К Этапу 3', action: () => renderCourseStage3() },
      getBackButton(),
    ]);
  };

  // 2. ПОХУДЕНИЕ И ПИТАНИЕ
  const renderNutritionHub = () => {
    addUserMessage('⚖️ Похудение и питание');
    const lastWeight = weightList[0];
    const text =
      `<b>⚖️ ПОХУДЕНИЕ И ПИТАНИЕ</b>\n` +
      `<i>Авторский подход @DonDearOfficina к композиции тела</i>\n\n` +
      `• <b>Текущий вес:</b> ${lastWeight ? `${lastWeight.weight} кг (от ${lastWeight.date})` : 'не внесен'}\n\n` +
      `<b>Подразделы:</b>\n` +
      `• <b>Снижение жиров в рационе</b> — авторский инструмент регуляции состава тела (материал готовится).\n` +
      `• <b>Энергетический баланс</b> — дефицит калорий и расход энергии.\n` +
      `• <b>Питание и гормоны</b> — сохранение стероидогенеза без критического дефицита ПНЖК.\n` +
      `• <b>Дневник веса</b> — отслеживание динамики.\n\n` +
      `<i>Для внесения веса отправьте число сообщением (например, <code>82.5</code> или <code>/weight 82.5</code>).</i>`;

    addBotMessage(text, [
      { text: '🥑 Снижение жиров в рационе', action: () => renderNutritionFats() },
      { text: '⚡ Энергобаланс и CICO', action: () => renderNutritionEnergy() },
      { text: '🧬 Питание и гормональная система', action: () => renderNutritionHormones() },
      { text: '📊 Дневник веса', action: () => renderWeightDiary() },
      { text: '📩 Спросить автора о питании', action: () => renderDonDearContactHub() },
      getBackButton(),
    ]);
  };

  const renderNutritionFats = () => {
    addUserMessage('🥑 Снижение жиров в рационе');
    const text =
      `<b>🥑 СНИЖЕНИЕ КОЛИЧЕСТВА ЖИРОВ В РАЦИОНЕ</b>\n` +
      `<i>[Статус: Авторский материал готовится к публикации]</i>\n\n` +
      `Снижение пищевых жиров — важный элемент авторской концепции оптимизации состава тела.\n\n` +
      `<b>Различие терминов:</b>\n` +
      `1. Снижение доли пищевых жиров — перераспределение макронутриентов.\n` +
      `2. Общий дефицит калорий — расход запасов энергии.\n` +
      `3. Снижение жировой массы тела — цель коррекции состава тела.\n\n` +
      `<b>⚠️ Предостережение:</b> Подход автора не предполагает полного исключения жиров или дефицита незаменимых жирных кислот (Омега-3). Экстремальные безжировые диеты опасны для гормональной системы.`;

    addBotMessage(text, [
      { text: '📊 Дневник веса', action: () => renderWeightDiary() },
      { text: '🔙 К питанию', action: () => renderNutritionHub() },
      getBackButton(),
    ]);
  };

  const renderNutritionEnergy = () => {
    addUserMessage('⚡ Энергетический баланс');
    const text =
      `<b>⚡ ЭНЕРГЕТИЧЕСКИЙ БАЛАНС И ПОЛНОЦЕННОСТЬ</b>\n\n` +
      `• Снижение жировой массы физиологически невозможно без умеренного дефицита энергии.\n` +
      `• Дефицит не должен быть чрезмерным (не более 15–20% от суточного TDEE), чтобы не спровоцировать замедление щитовидной железы и срыв.\n` +
      `• Достаточность белка защищает сухую мышечную массу.`;

    addBotMessage(text, [
      { text: '📊 Дневник веса', action: () => renderWeightDiary() },
      { text: '🔙 К питанию', action: () => renderNutritionHub() },
      getBackButton(),
    ]);
  };

  const renderNutritionHormones = () => {
    addUserMessage('🧬 Питание и гормоны');
    const text =
      `<b>🧬 ПИТАНИЕ И ГОРМОНАЛЬНАЯ СИСТЕМА</b>\n\n` +
      `• Холестерин — субстрат для синтеза тестостерона и кортизола.\n` +
      `• Контроль быстрых углеводов стабилизирует чувствительность к инсулину.\n` +
      `• Лептин подает сигнал насыщения в гипоталамус.\n\n` +
      `<i>Авторские материалы готовятся к публикации.</i>`;

    addBotMessage(text, [
      { text: '🔙 К питанию', action: () => renderNutritionHub() },
      getBackButton(),
    ]);
  };

  const renderWeightDiary = () => {
    addUserMessage('📊 Дневник веса');
    let listText = '';
    weightList.forEach((w, idx) => {
      listText += `${idx + 1}. <b>${w.date}</b>: ${w.weight} кг\n`;
    });

    const text =
      `<b>📊 ДНЕВНИК ВЕСА</b>\n\n` +
      `<b>История записей:</b>\n${listText}\n` +
      `<b>Чтобы добавить запись:</b>\n` +
      `Отправьте сообщение с числом (например: <code>81.5</code> или команду <code>/weight 81.5</code>).`;

    addBotMessage(text, [
      weightList.length > 0
        ? {
            text: '🗑️ Удалить последнюю запись',
            action: () => {
              setWeightList((prev) => prev.slice(1));
              addUserMessage('Удалить запись веса');
              addBotMessage('🗑️ Последняя запись удалена.');
            },
          }
        : { text: 'Внести вес', action: () => {} },
      { text: '🔙 К питанию', action: () => renderNutritionHub() },
      getBackButton(),
    ]);
  };

  // 3. ВСПОМОГАТЕЛЬНЫЕ ПРЕПАРАТЫ
  const renderAuxiliaryMedsHub = () => {
    addUserMessage('📦 Вспомогательные препараты и БАДы');
    const aux = medications.filter((m) => !m.is_main_course && m.status === 'active');

    const text =
      `<b>📦 ВСПОМОГАТЕЛЬНЫЕ ПРЕПАРАТЫ И БАДЫ</b>\n\n` +
      `Препараты, вынесенные автором за рамки базового курса:\n` +
      `• Средства водного баланса (Регидрон, Адиарин Регидрокомплекс)\n` +
      `• Последующие ноотропы автора (Пирацетам, <b>Ноопепт</b>)\n` +
      `• Микронутриенты (Цинк, Селен, Ферлатум Фол)\n` +
      `• Гастропротекторы (Урсосан, Ребагит, Креон)\n\n` +
      `<i>Выберите препарат для изучения 7 разделов описания:</i>`;

    const buttons = aux.slice(0, 8).map((m) => ({
      text: `💊 ${m.name}`,
      action: () => renderMedCard(m),
    }));

    addBotMessage(text, [
      ...buttons,
      { text: '🎯 Начать авторский курс', action: () => renderAuthorCourseHub(), variant: 'success' },
      getBackButton(),
    ]);
  };

  const renderMedCardByName = (name: string) => {
    const med = medications.find((m) => m.name.toLowerCase() === name.toLowerCase()) || medications[0];
    renderMedCard(med);
  };

  const renderMedCard = (m: Medication) => {
    addUserMessage(m.name);
    const legalLabel =
      m.legal_category_rf === 'medicine'
        ? 'Лекарственный препарат (ГРЛС)'
        : m.legal_category_rf === 'vitamin_mineral'
        ? 'Витаминно-минеральный комплекс'
        : 'БАД к пище';

    const text =
      `<b>1. Название:</b> <b>${m.name}</b>\n` +
      `<i>Активное вещество: ${m.active_ingredient || 'Уточняется'}\n` +
      `Категория: ${legalLabel}</i>\n\n` +
      `<b>2. Для чего используется:</b>\n` +
      `${m.purpose || m.notes || 'Информация уточняется'}\n\n` +
      `<b>3. Когда рассматривается применение:</b>\n` +
      `${m.when_considered || m.why_in_stack || 'По показаниям'}\n\n` +
      `<b>4. Как принимать по инструкции (производитель):</b>\n` +
      `${m.instruction_usage || m.dose || 'По официальной инструкции'}\n\n` +
      `<b>5. Личный опыт автора:</b>\n` +
      `${m.personal_experience || 'Наблюдение автора, не заменяет консультацию врача'}\n\n` +
      `<b>6. Ограничения и предостережения:</b>\n` +
      `${m.precautions || 'Противопоказания по инструкции'}\n\n` +
      `<b>7. Связь с основным курсом:</b>\n` +
      `${m.relation_to_main_course || 'Дополнительный компонент'}\n\n` +
      `<i>Это не медицинская рекомендация. По вопросам применения проконсультируйтесь со специалистом или напишите автору.</i>`;

    addBotMessage(text, [
      { text: `📩 Спросить автора про ${m.name}`, action: () => renderDonDearContactHub() },
      { text: '🔙 К вспомогательным БАДам', action: () => renderAuxiliaryMedsHub() },
      getBackButton(),
    ]);
  };

  // 4. ТРЕНИРОВКИ
  const renderWorkoutHub = () => {
    addUserMessage('🏋️ Система тренировок');
    const text =
      `<b>🏋️ СИСТЕМА ТРЕНИРОВОК С ПРИОРИТЕТОМ НОГ</b>\n` +
      `<b>Автор:</b> @DonDearOfficina | <b>Длительность:</b> 45–60 мин\n\n` +
      `• <b>Старт:</b> Каждое занятие начинается с икроножных мышц (мышечно-венозная помпа голени).\n` +
      `• <b>Приседания:</b> 2 тяжелых подхода приседаний в отказ для разгона кровотока малого таза.\n` +
      `• <b>Комплекс всего тела:</b> Грудь + спина + плечи + ноги + ягодичные.\n` +
      `• <b>Отдых:</b> 1.5–2 минуты между сетами.\n\n` +
      `<i>Чек-лист упражнений на сегодня:</i>`;

    addBotMessage(text, [
      { text: '🦶 1. Икроножные мышцы (2 подхода)', action: () => {} },
      { text: '🏋️ 2. Приседания в отказ (2 подхода)', action: () => {} },
      { text: '💪 3. Комплекс всего тела', action: () => {} },
      { text: '🍑 4. Ягодичные движения', action: () => {} },
      getBackButton(),
    ]);
  };

  // 5. БАЗА ЗНАНИЙ
  const renderKnowledgeNotesHub = () => {
    addUserMessage('📚 Материалы автора');
    const text =
      `<b>📚 МАТЕРИАЛЫ АВТОРА И БАЗА ЗНАНИЙ</b>\n\n` +
      `Авторские статьи и разборы дипломированного провизора-химика @DonDearOfficina:\n` +
      `• Разбор этапов курса и нейромедиаторов\n` +
      `• Взаимодействие микроэлементов (железо vs цинк)\n` +
      `• Исламская медицина в доказательной фармации\n\n` +
      `<i>Выберите материал для чтения:</i>`;

    const buttons = knowledgeNotes.slice(0, 6).map((n) => ({
      text: `📄 ${n.title.slice(0, 32)}...`,
      action: () => renderKnowledgeCard(n),
    }));

    addBotMessage(text, [...buttons, getBackButton()]);
  };

  const renderKnowledgeCard = (note: KnowledgeNote) => {
    addUserMessage(note.title);
    const text =
      `<b>📄 ${note.title}</b>\n` +
      `<i>Тема: ${note.topic} | Автор: @DonDearOfficina</i>\n\n` +
      `${note.body}\n\n` +
      `<i>Личный опыт автора и разбор открытых данных.</i>`;

    addBotMessage(text, [
      { text: '📩 Спросить автора', action: () => renderDonDearContactHub() },
      { text: '🔙 К материалам', action: () => renderKnowledgeNotesHub() },
      getBackButton(),
    ]);
  };

  // 6. ПРОФИЛЬ
  const renderProfileHub = () => {
    addUserMessage('👤 Мой профиль');
    const isStarted = currentUser.on_author_protocol;
    const lastWeight = weightList[0];

    const text =
      `<b>👤 МОЙ ПРОФИЛЬ И ПРОГРЕСС</b>\n\n` +
      `• <b>Пользователь:</b> ${currentUser.first_name} (@${currentUser.username || 'user'})\n` +
      `• <b>Статус участия в курсе:</b> ${isStarted ? '✅ Курс начат' : '⚪ Режим ознакомления'}\n` +
      `• <b>Текущий этап:</b> Месяц 1 (ЖКТ и желчеотток)\n` +
      `• <b>Последний вес:</b> ${lastWeight ? `${lastWeight.weight} кг (${lastWeight.date})` : 'не внесен'}\n\n` +
      `<i>Вы можете подтвердить или приостановить курс, а также вести дневник веса.</i>`;

    const toggleBtn = isStarted
      ? {
          text: '⏸ Приостановить курс',
          action: () => {
            toggleAuthorProtocol();
            addUserMessage('Приостановить курс');
            setTimeout(() => renderProfileHub(), 150);
          },
        }
      : {
          text: '✅ Подтвердить начало курса',
          action: () => {
            toggleAuthorProtocol();
            addUserMessage('Подтвердить начало курса');
            setTimeout(() => renderProfileHub(), 150);
          },
          variant: 'success' as const,
        };

    addBotMessage(text, [
      toggleBtn,
      { text: '📊 Дневник веса', action: () => renderWeightDiary() },
      { text: '🎯 К авторскому курсу', action: () => renderAuthorCourseHub() },
      getBackButton(),
    ]);
  };

  // 7. СВЯЗАТЬСЯ С АВТОРОМ
  const renderDonDearContactHub = () => {
    addUserMessage('📩 Связаться с @DonDearOfficina');
    const text =
      `📩 <b>СВЯЗЬ С АВТОРОМ КУРСА</b>\n\n` +
      `Автор курса — дипломированный провизор-химик <b>@DonDearOfficina</b>.\n\n` +
      `Консультации и разбор индивидуальных нюансов здоровья ведутся лично:\n` +
      `👉 <b><a href="https://t.me/DonDearOfficina">@DonDearOfficina</a></b> (t.me/DonDearOfficina)\n\n` +
      `<i>(В боте отключены генерации AI в целях безопасности пациентов. Все рекомендации обсуждаются лично.)</i>`;

    addBotMessage(text, [
      {
        text: '👉 Открыть чат t.me/DonDearOfficina',
        action: () => window.open('https://t.me/DonDearOfficina', '_blank'),
        variant: 'success',
      },
      getBackButton(),
    ]);
  };

  // Free text message handling
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    addUserMessage(text);

    // 1. Slash commands
    if (text.startsWith('/start')) {
      handleStartCommand(text.split(' ')[1]);
      return;
    }
    if (text.toLowerCase() === '/menu' || text.toLowerCase() === 'меню') {
      returnToMainMenu();
      return;
    }

    // 2. Red flags check
    const lower = text.toLowerCase();
    if (RED_FLAGS.some((rf) => lower.includes(rf))) {
      addBotMessage(
        `🚨 <b>ВНИМАНИЕ: ВОЗМОЖНО НЕОТЛОЖНОЕ СОСТОЯНИЕ</b>\n\n` +
          `Описанные вами симптомы могут требовать неотложной медицинской помощи.\n\n` +
          `Пожалуйста, немедленно свяжитесь со службой скорой помощи: <b>103</b> или <b>112</b>!\n\n` +
          `<i>Бот и автор не заменяют экстренную медицинскую службу.</i>`,
        [getBackButton()],
        true
      );
      return;
    }

    // 3. Weight logging (e.g. 82.5 or /weight 82.5)
    const weightMatch = text.match(/^\/weight\s+([0-9]+([.,][0-9]+)?)/i) || text.match(/^([0-9]{2,3}([.,][0-9]+)?)$/);
    if (weightMatch) {
      const val = parseFloat((weightMatch[1] || weightMatch[0]).replace(',', '.'));
      if (val >= 30 && val <= 300) {
        const today = new Date().toLocaleDateString('ru-RU');
        setWeightList((prev) => [{ date: today, weight: val }, ...prev]);
        addBotMessage(
          `⚖️ <b>Запись веса сохранена: ${val} кг</b>\n\nДата: ${today}\nЗапись сохранена в вашем дневнике веса.`,
          [
            { text: '📊 Открыть дневник веса', action: () => renderWeightDiary() },
            getBackButton(),
          ]
        );
        return;
      }
    }

    // 4. Default: Polite direct route to author
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(
        `📩 <b>Обращение к автору курса</b>\n\n` +
          `По всем индивидуальным вопросам, подбору добавок и анализам вы можете написать лично автору курса в Telegram:\n\n` +
          `👉 <b><a href="https://t.me/DonDearOfficina">@DonDearOfficina</a></b>\n\n` +
          `<i>(Бот не использует автоматические генерации ответов. Консультации ведет лично автор.)</i>`,
        [
          {
            text: '👉 Написать @DonDearOfficina',
            action: () => window.open('https://t.me/DonDearOfficina', '_blank'),
            variant: 'success',
          },
          { text: '🎯 Авторский курс', action: () => renderAuthorCourseHub() },
          getBackButton(),
        ]
      );
    }, 300);
  };

  const handleSendInstagramDM = (triggerWord: string) => {
    if (!triggerWord.trim()) return;
    const kw = triggerWord.trim().toUpperCase();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setIgMessages((prev) => [...prev, { id: 'ig-u-' + Date.now(), sender: 'user', text: kw, timestamp: time }]);
    setIgInput('');
    setIgIsTyping(true);

    let startParam = 'course';
    if (kw.includes('ЖКТ') || kw.includes('ВОДА')) startParam = 'water';
    if (kw.includes('ПОХУДЕНИЕ') || kw.includes('ЖИР')) startParam = 'nutrition';

    setTimeout(() => {
      setIgIsTyping(false);
      setIgMessages((prev) => [
        ...prev,
        {
          id: 'ig-d-' + Date.now(),
          sender: 'dondear',
          text:
            `Здравствуйте! Авторские материалы по теме «${kw}» доступны в нашем Telegram-боте:\n\n` +
            `Каскадная программа: ЖКТ ➔ Нейробуст ➔ Фенотропил.\n` +
            `По личным вопросам: @DonDearOfficina`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          leadMagnet: {
            title: `🎯 Материалы по запросу [${kw}]`,
            description: 'Официальный протокол и регламент этапов от дипломированного провизора.',
            pdfName: 'Авторский_курс_DonDearOfficina.pdf',
            ctaText: '🚀 Открыть в Telegram @DonDearOfficina_bot',
            startArg: startParam,
          },
        },
      ]);
    }, 350);
  };

  const bridgeFromInstagramToTelegram = (startArg: string) => {
    setSimChannel('telegram');
    handleStartCommand(startArg);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Left Column: Authentic Smartphone Frame */}
      <div className="w-full lg:w-[460px] flex-shrink-0 flex flex-col items-center">
        {/* Channel Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 mb-3 w-full max-w-[420px]">
          <button
            onClick={() => setSimChannel('telegram')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              simChannel === 'telegram' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📱 Telegram: @DonDearOfficina_bot</span>
          </button>
          <button
            onClick={() => setSimChannel('instagram')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              simChannel === 'instagram'
                ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📸 Instagram Direct</span>
          </button>
        </div>

        <div className="w-full max-w-[420px] bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-700/80 flex flex-col h-[760px]">
          {/* Top Notch */}
          <div className="w-full flex justify-between items-center px-5 pt-1 pb-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">12:30</span>
            <div className="w-20 h-4 bg-slate-800 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
            </div>
            <div className="flex items-center gap-1">
              <span>5G</span>
              <div className="w-4 h-2 border border-slate-400 rounded-xs flex p-0.5">
                <div className="w-full h-full bg-slate-300" />
              </div>
            </div>
          </div>

          {simChannel === 'telegram' ? (
            /* TELEGRAM INTERFACE */
            <>
              {/* Telegram Header */}
              <div className="bg-slate-800/90 backdrop-blur rounded-2xl px-4 py-3 flex items-center justify-between border border-slate-700/50 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-cyan-400/30">
                    DD
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-white">@DonDearOfficina_bot</h3>
                      <Award className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-[11px] text-cyan-400 font-medium">Дипломированный провизор • Авторский курс</p>
                  </div>
                </div>
                <button
                  onClick={() => handleStartCommand()}
                  title="Перезапустить бота (/start)"
                  className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto px-2 space-y-3 pr-1 text-sm scrollbar-thin scrollbar-thumb-slate-700">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-cyan-600 text-white rounded-br-none'
                          : msg.isRedFlag
                          ? 'bg-rose-950/80 text-rose-200 border border-rose-600/80 rounded-bl-none'
                          : 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-bl-none'
                      }`}
                    >
                      <div
                        className="prose prose-invert prose-sm max-w-none break-words"
                        dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}
                      />
                      <div className="text-[10px] text-right mt-1 opacity-60">{msg.timestamp}</div>
                    </div>

                    {/* Inline Buttons */}
                    {msg.buttons && msg.buttons.length > 0 && (
                      <div className="w-[88%] mt-2 space-y-1.5">
                        {msg.buttons.map((btn, bIdx) => {
                          let btnStyle =
                            'bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-slate-700/80';
                          if (btn.variant === 'danger') {
                            btnStyle = 'bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-600';
                          } else if (btn.variant === 'success') {
                            btnStyle =
                              'bg-emerald-900/70 hover:bg-emerald-800 text-emerald-100 border border-emerald-600';
                          } else if (btn.variant === 'outline') {
                            btnStyle = 'bg-transparent hover:bg-slate-800 text-slate-400 border border-slate-700';
                          }

                          return (
                            <button
                              key={bIdx}
                              onClick={btn.action}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between group active:scale-[0.98] ${btnStyle}`}
                            >
                              <span className="line-clamp-1">{btn.text}</span>
                              <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 rounded-2xl w-28 text-slate-400 text-xs">
                    <span className="text-[10px] text-cyan-400 font-semibold mr-1">Печатает</span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Telegram Input Bar */}
              <div className="pt-2">
                <div className="flex items-center gap-2 bg-slate-800/90 rounded-2xl px-3 py-1.5 border border-slate-700">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Сообщение автору или вес (напр. 82.5)..."
                    className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="w-8 h-8 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white flex items-center justify-center transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center px-2 pt-1 text-[11px] text-slate-500">
                  <span>Автор: @DonDearOfficina</span>
                  <button onClick={() => handleStartCommand()} className="text-cyan-400 hover:underline">
                    /start
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* INSTAGRAM DIRECT INTERFACE */
            <>
              {/* Instagram Header */}
              <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 rounded-2xl px-4 py-2.5 flex items-center justify-between border border-purple-800/40 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center">
                    <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      DD
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-xs text-white">DonDearOfficina</h3>
                      <div className="w-3.5 h-3.5 bg-cyan-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                        ✓
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">Дипломированный провизор-химик</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Direct Webhook
                </span>
              </div>

              {/* Trigger Chips */}
              <div className="px-2 pb-2">
                <p className="text-[10px] text-slate-400 mb-1">
                  Нажмите триггер или отправьте слово:
                </p>
                <div className="flex flex-wrap gap-1">
                  {['КУРС', 'ЖКТ', 'ВОДА', 'ПОХУДЕНИЕ', 'СТЕК'].map((kw) => (
                    <button
                      key={kw}
                      onClick={() => handleSendInstagramDM(kw)}
                      className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/50 text-[11px] font-semibold text-purple-200 transition active:scale-95"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instagram Messages */}
              <div className="flex-1 overflow-y-auto px-2 space-y-3 pr-1 text-sm scrollbar-thin scrollbar-thumb-slate-700">
                {igMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-bl-none'
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.text}</div>
                      <div className="text-[9px] text-right mt-1 opacity-50">{msg.timestamp}</div>
                    </div>

                    {msg.leadMagnet && (
                      <div className="w-[88%] mt-2 p-3 bg-gradient-to-br from-slate-800 to-purple-950/50 rounded-2xl border border-purple-500/40 shadow-lg">
                        <div className="text-xs font-bold text-white mb-1">
                          {msg.leadMagnet.title}
                        </div>
                        <p className="text-[11px] text-slate-300 mb-2 leading-snug">
                          {msg.leadMagnet.description}
                        </p>
                        <button
                          onClick={() => bridgeFromInstagramToTelegram(msg.leadMagnet!.startArg)}
                          className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
                        >
                          <span>{msg.leadMagnet.ctaText}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {igIsTyping && (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 rounded-2xl w-24 text-slate-400 text-xs">
                    <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                )}
                <div ref={igChatEndRef} />
              </div>

              {/* Instagram Input */}
              <div className="pt-2">
                <div className="flex items-center gap-2 bg-slate-800/90 rounded-2xl px-3 py-1.5 border border-purple-800/50">
                  <input
                    type="text"
                    value={igInput}
                    onChange={(e) => setIgInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendInstagramDM(igInput)}
                    placeholder="Напишите в Direct (КУРС, ВОДА, ПОХУДЕНИЕ)..."
                    className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSendInstagramDM(igInput)}
                    disabled={!igInput.trim()}
                    className="w-8 h-8 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white flex items-center justify-center transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Column: Information & Management Console */}
      <div className="flex-1 space-y-5 overflow-y-auto">
        {/* Course Card Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-2xl p-5 border border-indigo-500/30 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-2">
                <Activity className="w-3.5 h-3.5" />
                <span>Авторская система @DonDearOfficina</span>
              </span>
              <h2 className="text-lg font-bold text-white">Единый авторский курс оптимизации нейросистемы</h2>
              <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                Каскадный принцип Cause-First: ЖКТ, желчеотток и водный баланс (1-й месяц) ➔
                Комплекс «Нейробуст» (Глиатилин + Креатин + L-Цитруллин, база от 6 месяцев) ➔
                Двухмесячный этап с Фенотропилом (3-й и 4-й месяцы).
              </p>
            </div>
            <a
              href="https://t.me/DonDearOfficina"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Связаться с автором</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400">Этап 1 (1-й месяц)</span>
              <h4 className="font-semibold text-slate-200 mt-0.5">ЖКТ, желчеотток и вода</h4>
              <p className="text-[11px] text-slate-400 mt-1">Хофитол, Полисорб (мин 3 нед), Энтерол, Регидрон.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold text-cyan-400">Этап 2 (со 2-го месяца)</span>
              <h4 className="font-semibold text-slate-200 mt-0.5">Комплекс «Нейробуст»</h4>
              <p className="text-[11px] text-slate-400 mt-1">Глиатилин + Креатин + L-Цитруллин (длительно 6+ мес).</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold text-amber-400">Этап 3 (3-й и 4-й месяцы)</span>
              <h4 className="font-semibold text-slate-200 mt-0.5">Этап с Фенотропилом</h4>
              <p className="text-[11px] text-slate-400 mt-1">Ровно 2 месяца на фоне продолжающейся базы 2-го этапа.</p>
            </div>
          </div>
        </div>

        {/* Quick Testing Shortcuts */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 border border-slate-700">
          <h3 className="font-bold text-white text-sm mb-3">Быстрый переход по разделам бота:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <button
              onClick={() => handleSelectSection('author_course')}
              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-cyan-300 text-xs font-medium border border-slate-700 flex items-center gap-2 transition"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>🎯 Авторский курс</span>
            </button>
            <button
              onClick={() => handleSelectSection('nutrition')}
              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-amber-300 text-xs font-medium border border-slate-700 flex items-center gap-2 transition"
            >
              <Scale className="w-4 h-4 text-amber-400" />
              <span>⚖️ Похудение и питание</span>
            </button>
            <button
              onClick={() => renderWaterBalanceHub()}
              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-sky-300 text-xs font-medium border border-slate-700 flex items-center gap-2 transition"
            >
              <Droplets className="w-4 h-4 text-sky-400" />
              <span>💧 Водный баланс</span>
            </button>
            <button
              onClick={() => handleSelectSection('workout')}
              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-emerald-300 text-xs font-medium border border-slate-700 flex items-center gap-2 transition"
            >
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              <span>🏋️ Система тренировок</span>
            </button>
            <button
              onClick={() => handleSelectSection('auxiliary_meds')}
              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-indigo-300 text-xs font-medium border border-slate-700 flex items-center gap-2 transition"
            >
              <Pill className="w-4 h-4 text-indigo-400" />
              <span>📦 Каталог БАДов</span>
            </button>
            <button
              onClick={() => {
                addUserMessage('Острая боль за грудиной');
                handleSendMessage();
              }}
              className="px-3 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-medium border border-rose-500/30 flex items-center gap-2 transition"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>🚨 Тест: Экстренный случай</span>
            </button>
          </div>
        </div>

        {/* Safety & Author Contact Card */}
        <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700 text-xs text-slate-400 space-y-2">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Стандарты безопасности и коммуникации:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div>• <b>Личный контакт:</b> Консультации ведет лично автор @DonDearOfficina.</div>
            <div>• <b>Без AI-галлюцинаций:</b> Генеративные медицинские ассистенты отключены.</div>
            <div>• <b>Красные флаги:</b> При острой боли/инсульте — немедленная рекомендация 103/112.</div>
            <div>• <b>Постоянное хранение:</b> Прогресс и дневник веса сохраняются на диске.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
