import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Send,
  RotateCcw,
  Sparkles,
  Pill,
  Dumbbell,
  BookOpen,
  User,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Activity,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Medication, WorkoutExercise } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
        MainButton?: {
          text: string;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (cb: () => void) => void;
        };
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        themeParams?: Record<string, string>;
        isExpanded?: boolean;
      };
    };
  }
}

export const TelegramMiniApp: React.FC = () => {
  const {
    currentUser,
    medications,
    workoutExercises,
    workoutPhilosophy,
    toggleWorkoutExercise,
    knowledgeNotes,
    queryAssistant,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'course' | 'auxiliary' | 'workout' | 'assistant' | 'knowledge' | 'profile'>('course');
  const [deviceFrame, setDeviceFrame] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCommands, setCopiedCommands] = useState<boolean>(false);

  // Assistant Chat State
  const [assistantMessages, setAssistantMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; isRedFlag?: boolean }>>([
    {
      sender: 'assistant',
      text:
        '👋 Мир вам! Я — супер-ассистент приложения @DonDearOfficina (дипломированный провизор-химик, специалист по нейробиологии и андрологии).\n\n' +
        'Моя задача — работать с вами так, как работал бы владелец: сначала причина, потом симптом; каскад ЖКТ → нейробуст → БАД; научная строгость с ссылками на PMID и уважение к вере.\n\n' +
        'Задайте вопрос по ЖКТ, восстановлению энергии, взаимодействиям добавок или авторскому протоколу.',
    },
  ]);
  const [assistantInput, setAssistantInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auxiliary catalog filters
  const [auxCategory, setAuxCategory] = useState<'all' | 'nootropics' | 'minerals' | 'adaptogens' | 'gastro_extra' | 'antioxidants'>('all');
  const [auxSearch, setAuxSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);

  // Initialize Telegram WebApp SDK if inside Telegram client
  const [isInsideTelegram, setIsInsideTelegram] = useState(false);
  const [tgUser, setTgUser] = useState<{ id?: number; first_name?: string; username?: string }>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor('#0f172a');
        tg.setBackgroundColor('#020617');
        tg.enableClosingConfirmation();
      } catch (e) {
        // Ignored on older clients
      }

      const user = tg.initDataUnsafe?.user;
      if (user) {
        setIsInsideTelegram(true);
        setTgUser(user);
      }
    }
  }, []);

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
    } catch (e) {
      // not in telegram
    }
  };

  const handleSendAssistant = async (overridePrompt?: string) => {
    const q = overridePrompt || assistantInput;
    if (!q.trim() || isAsking) return;

    triggerHaptic('medium');
    setAssistantMessages((prev) => [...prev, { sender: 'user', text: q }]);
    if (!overridePrompt) setAssistantInput('');
    setIsAsking(true);

    try {
      const res = await queryAssistant(q);
      setAssistantMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: res.answer,
          isRedFlag: res.isRedFlag,
        },
      ]);
    } catch (e) {
      setAssistantMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: '⚠️ Не удалось получить ответ. Попробуйте еще раз или напишите напрямую @DonDearOfficina.',
        },
      ]);
    } finally {
      setIsAsking(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-afhybgd6fvdcktfoqqlxqd-955983393021.europe-west2.run.app';

  const copyBotFatherCommands = () => {
    const text =
      `/setmenubutton\n` +
      `@DonDearOfficina_bot\n` +
      `${currentAppUrl}\n` +
      `💊 NeuroBoost App`;
    navigator.clipboard.writeText(text);
    setCopiedCommands(true);
    setTimeout(() => setCopiedCommands(false), 2500);
  };

  const copyMiniAppUrl = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Auxiliary medications filtered
  const auxiliaryMeds = medications.filter((m) => m.is_main_course === false);
  const filteredAuxMeds = auxiliaryMeds.filter((m) => {
    const matchesSearch =
      !auxSearch ||
      m.name.toLowerCase().includes(auxSearch.toLowerCase()) ||
      (m.active_ingredient && m.active_ingredient.toLowerCase().includes(auxSearch.toLowerCase())) ||
      (m.purpose && m.purpose.toLowerCase().includes(auxSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (auxCategory === 'nootropics') {
      return ['пирацетам', 'ноопепт', 'пикамилон', 'фенибут', 'пантогам', 'глицин', 'мексидол'].some((k) =>
        m.name.toLowerCase().includes(k)
      );
    }
    if (auxCategory === 'minerals') {
      return ['цинк', 'магний', 'железо', 'витамин d', 'b-комплекс', 'медь', 'йод', 'селен', 'фолат'].some((k) =>
        m.name.toLowerCase().includes(k)
      );
    }
    if (auxCategory === 'adaptogens') {
      return ['тмин', 'родиола', 'ашваганда', 'женьшень', 'элеутерококк', 'левзея', 'ежовик'].some((k) =>
        m.name.toLowerCase().includes(k)
      );
    }
    if (auxCategory === 'gastro_extra') {
      return ['ребагит', 'креон', 'омез', 'урсосан', 'тримедат', 'дюспаталин'].some((k) =>
        m.name.toLowerCase().includes(k)
      );
    }
    if (auxCategory === 'antioxidants') {
      return ['глутатион', 'nac', 'ацетилцистеин', 'альфа-липоевая', 'коэнзим q10', 'астаксантин', 'ресвератрол'].some((k) =>
        m.name.toLowerCase().includes(k)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Telegram Bot Setup Banner */}
      <div className="bg-gradient-to-r from-sky-950/70 via-slate-900 to-indigo-950/70 p-5 rounded-2xl border border-sky-600/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <Smartphone className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white">
              Telegram Mini App (TMA): @DonDearOfficinaAI
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Bot Token Подключен
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Полноценное мини-приложение для Telegram на базе <b>Telegram WebApp SDK</b>.
            Поддерживает вызов из меню бота, жесты, системную тему Telegram, нативные кнопки и прямое обращение к AI-суперассистенту.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <button
            onClick={copyMiniAppUrl}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
            <span>{copiedLink ? 'Скопировано!' : 'URL Mini App'}</span>
          </button>

          <button
            onClick={copyBotFatherCommands}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition"
          >
            {copiedCommands ? <Check className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-sky-200" />}
            <span>Настроить в @BotFather</span>
          </button>

          <a
            href="https://t.me/DonDearOfficina_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition"
          >
            <span>Открыть бота (@DonDearOfficina_bot)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {!isInsideTelegram && (
            <button
              onClick={() => setDeviceFrame(!deviceFrame)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition"
            >
              <span>{deviceFrame ? '🖥 Развернуть' : '📱 Рамка телефона'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container - either Smartphone Mockup or Full Width */}
      <div className={`mx-auto transition-all ${deviceFrame && !isInsideTelegram ? 'max-w-[420px]' : 'max-w-5xl'}`}>
        <div className="bg-slate-950 rounded-[32px] border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[720px] max-h-[880px]">
          {/* Telegram Header Bar */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-sky-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-sky-500/30">
                DD
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>@DonDearOfficinaAI</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] text-sky-400">мини-приложение • WebApp</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {isInsideTelegram ? `id: ${tgUser.id || 'TG'}` : 'Web Mode'}
              </span>
            </div>
          </div>

          {/* Quick Tab Switcher inside Mini App */}
          <div className="bg-slate-900/90 border-b border-slate-800/80 px-2 py-1.5 flex items-center gap-1 overflow-x-auto text-[11px] font-semibold scrollbar-none">
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('course');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap transition ${
                activeTab === 'course' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎯</span>
              <span>Авторский курс</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('auxiliary');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap transition ${
                activeTab === 'auxiliary' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📦</span>
              <span>Вспомогательные БАДы</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('workout');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap transition ${
                activeTab === 'workout' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏋️‍♂️</span>
              <span>Тренировки</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('assistant');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap transition ${
                activeTab === 'assistant' ? 'bg-sky-500 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🤖</span>
              <span>AI-Ассистент</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('knowledge');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap transition ${
                activeTab === 'knowledge' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📚</span>
              <span>Знания</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('profile');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap transition ${
                activeTab === 'profile' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⚙️</span>
              <span>Профиль</span>
            </button>
          </div>

          {/* Mini App Body Views */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 1. UNIFIED AUTHOR COURSE TAB */}
            {activeTab === 'course' && (
              <div className="space-y-4">
                {/* Course Header Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/50 via-slate-900 to-indigo-950/50 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">Авторский курс @DonDearOfficina</h3>
                      <p className="text-[10px] text-cyan-400">Единая последовательная программа • Принцип Cause-First</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Все этапы выстроены в строгую физиологическую цепочку: от настройки желчеоттока и слизистого барьера ЖКТ
                    к насыщению пула ацетилхолина и длительной энергетической базе (6+ месяцев), и только затем к двухмесячной стимуляции Фенотропилом.
                  </p>
                </div>

                {/* STAGE 1: ЖКТ И ЖЕЛЧЕОТТОК */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-600/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🫄</span>
                      <div>
                        <h4 className="text-xs font-bold text-white">1-й месяц — «Настройка ЖКТ и желчеоттока»</h4>
                        <span className="text-[9px] text-emerald-400 font-semibold">Базовый фундамент усвоения</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-700/40">
                      Этап 1
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    При холестазе не формируются мицеллы, жирорастворимые кофакторы теряются, а бактериальный LPS вызывает микроглиальное нейровоспаление.
                  </p>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>1. Хофитол (Экстракт артишока)</span>
                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300">ЛС (ГРЛС)</span>
                      </div>
                      <div className="text-slate-400"><b>По инструкции:</b> 2–3 таб. 3 р/сут перед едой (2–3 недели).</div>
                      <div className="text-slate-300"><b>Личный опыт автора:</b> 2 таб. 3 р/сут строго за 20 мин до еды (20–30 дней).</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>2. Полисорб МП (Диоксид кремния)</span>
                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300">ЛС (ГРЛС)</span>
                      </div>
                      <div className="text-slate-400"><b>По инструкции:</b> водная суспензия за 1–1.5 ч до/после еды.</div>
                      <div className="text-emerald-300"><b>Личный опыт автора:</b> применяется в авторской концепции <b>минимум 3 недели</b>.</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>3. Энтерол (S. boulardii CNCM I-745)</span>
                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300">ЛС (ГРЛС)</span>
                      </div>
                      <div className="text-slate-400"><b>По инструкции:</b> 1–2 капс. 2 р/сут за 1 ч до еды.</div>
                      <div className="text-slate-300"><b>Личный опыт автора:</b> 250 мг 2 р/сут за 1 час до еды (14–30 дней).</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-600/30 text-[11px] space-y-1">
                      <div className="font-bold text-amber-300">⚠️ Альтернатива при камнях: Урсосан (УДХК)</div>
                      <p className="text-slate-300 leading-relaxed">
                        Предусмотрен автором как замена Хофитолу <b>только при наличии конкрементов в желчном пузыре</b>.
                        <b>Не является универсальной рекомендацией для пациентов</b> (только по УЗИ ОБП и с врачом).
                      </p>
                    </div>
                  </div>
                </div>

                {/* STAGE 2: НЕЙРОБУСТ И ОСНОВНЫЕ КОМПОНЕНТЫ (6+ МЕС) */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-sky-600/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🧠</span>
                      <div>
                        <h4 className="text-xs font-bold text-white">2-й месяц — «Подключение Нейробуста»</h4>
                        <span className="text-[9px] text-sky-400 font-semibold">База длительного действия (6+ месяцев)</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-bold border border-sky-700/40">
                      Этап 2
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-600/40 text-[11px] text-sky-200">
                    💡 <b>КРИТИЧЕСКИ ВАЖНО:</b> Цитруллин, Креатин и Глиатилин — компоненты длительного применения (<b>минимум 6 месяцев</b>, от 6 до 12 месяцев).
                    Второй месяц обозначает точку их подключения, а не завершение приёма!
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>1. Глиатилин (Холина альфосцерат)</span>
                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300">6+ месяцев</span>
                      </div>
                      <div className="text-slate-400"><b>По инструкции:</b> 400 мг 2–3 р/сут до еды.</div>
                      <div className="text-slate-300"><b>Личный опыт:</b> 400 мг 2 р/сут за 30 мин до еды. Насыщение пула ацетилхолина.</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>2. Креатин моногидрат</span>
                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300">6+ месяцев</span>
                      </div>
                      <div className="text-slate-400"><b>По инструкции:</b> 3–5 г в сутки с водой.</div>
                      <div className="text-slate-300"><b>Личный опыт:</b> 5 г каждое утро натощак. Энергетический буфер АТФ мозга.</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>3. L-Цитруллин</span>
                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300">6+ месяцев</span>
                      </div>
                      <div className="text-slate-400"><b>По инструкции:</b> 3–6 г в сутки.</div>
                      <div className="text-slate-300"><b>Личный опыт:</b> 3–5 г утром натощак. Синтез NO и венозный отток малого таза.</div>
                    </div>
                  </div>
                </div>

                {/* STAGE 3: ДВУХМЕСЯЧНЫЙ ЭТАП С ФЕНОТРОПИЛОМ (3-Й И 4-Й МЕСЯЦЫ) */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-600/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <div>
                        <h4 className="text-xs font-bold text-white">3-й и 4-й месяцы — «Этап с Фенотропилом»</h4>
                        <span className="text-[9px] text-purple-400 font-semibold">Двухмесячный курс рацетама</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-bold border border-purple-700/40">
                      Этап 3
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Продолжительность этапа — <b>ровно два месяца</b> (3-й месяц — начало, 4-й месяц — продолжение).
                    Для 4-го месяца не создается отдельный курс. Фенотропил принимается СТРОГО на фоне продолжающегося приема компонентов 2-го месяца (Глиатилин, Креатин, Цитруллин)!
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>Фенотропил (Фонтурацетам)</span>
                      <span className="text-[8px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300">2 месяца</span>
                    </div>
                    <div className="text-slate-400"><b>По инструкции:</b> 100–250 мг 1–2 р/сут утром после еды (курс 1–2 месяца). До 15:00.</div>
                    <div className="text-slate-300"><b>Личный опыт автора:</b> 100 мг утром натощак курсом ровно 2 месяца.</div>
                  </div>
                </div>

                {/* TIMELINE SCHEME */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <span>🔄</span>
                    <span>Таймлайн-схема авторской программы</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center pt-1 font-mono text-[10px]">
                    <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-700/40 text-emerald-300">
                      <div className="font-bold">1-й месяц</div>
                      <div className="text-[8px] text-slate-300 mt-0.5">Хофитол + Полисорб + Энтерол</div>
                    </div>
                    <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-700/40 text-sky-300">
                      <div className="font-bold">2-й месяц</div>
                      <div className="text-[8px] text-slate-300 mt-0.5">Старт Нейробуст (Глиатилин, Креатин...)</div>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-700/40 text-purple-300">
                      <div className="font-bold">3-й месяц</div>
                      <div className="text-[8px] text-slate-300 mt-0.5">Фенотропил (мес 1) + Стек 2-го мес</div>
                    </div>
                    <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-700/40 text-indigo-300">
                      <div className="font-bold">4-й месяц</div>
                      <div className="text-[8px] text-slate-300 mt-0.5">Фенотропил (мес 2) + Стек 2-го мес</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-cyan-300 text-center pt-1">
                    ⚡ Далее (5+ мес): Глиатилин, Креатин и Цитруллин продолжаются до 6–12 месяцев.
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setActiveTab('auxiliary');
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition"
                  >
                    <span>📦 Вспомогательные БАДы</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setActiveTab('workout');
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1.5 transition"
                  >
                    <span>🏋️‍♂️ Тренировки (Шаг 2)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. WORKOUT TAB */}
            {activeTab === 'workout' && (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-600/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏋️‍♂️</span>
                      <div>
                        <h3 className="text-xs font-bold text-white">{workoutPhilosophy.title}</h3>
                        <p className="text-[10px] text-amber-300">Длительность: 45–60 минут • 2 подхода в отказ</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-300 space-y-1">
                    <p><b>1. Начало:</b> Икры ➔ Приседания (2 подхода в отказ).</p>
                    <p><b>2. Фулбоди:</b> 2 грудь, 2 спина, 2 плечи, 2 доп. ноги, ягодицы отдельно.</p>
                    <p><b>3. Свободное чередование:</b> ротация тренажеров для активного отдыха.</p>
                  </div>
                </div>

                {/* Workout Exercise Checklist */}
                <div className="space-y-2">
                  {workoutExercises.map((ex) => (
                    <div
                      key={ex.id}
                      onClick={() => {
                        triggerHaptic('light');
                        toggleWorkoutExercise(ex.id);
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                        ex.is_completed
                          ? 'bg-emerald-950/20 border-emerald-700/60'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-wider">
                          {ex.muscle_title}
                        </span>
                        <h5 className="font-bold text-xs text-white mt-0.5">{ex.name}</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{ex.notes}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold whitespace-nowrap">
                          {ex.sets}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                            ex.is_completed ? 'bg-emerald-500 text-white' : 'border border-slate-700 text-transparent'
                          }`}
                        >
                          ✓
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. AUXILIARY MEDICATIONS & SUPPLEMENTS TAB */}
            {activeTab === 'auxiliary' && (
              <div className="space-y-3.5">
                {/* Auxiliary Header */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-600/30 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📦</span>
                    <div>
                      <h3 className="text-xs font-bold text-white">Вспомогательные препараты и БАДы</h3>
                      <p className="text-[10px] text-indigo-400">Каталог дополнительных средств (не входят в базовый курс)</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Эти средства не назначаются автоматически всем подряд, а рассматриваются индивидуально под конкретные задачи
                    (дефициты, мягкий выход после курса Фенотропила, гепатопротекция, адаптация к стрессу).
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={auxSearch}
                    onChange={(e) => setAuxSearch(e.target.value)}
                    placeholder="Поиск по названию, действию или назначению..."
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {auxSearch && (
                    <button
                      onClick={() => setAuxSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-semibold scrollbar-none">
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setAuxCategory('all');
                    }}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                      auxCategory === 'all' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Все ({auxiliaryMeds.length})
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setAuxCategory('nootropics');
                    }}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                      auxCategory === 'nootropics' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    🧠 Ноотропы (Ноопепт...)
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setAuxCategory('minerals');
                    }}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                      auxCategory === 'minerals' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    ⚡ Микроэлементы & Витамины
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setAuxCategory('adaptogens');
                    }}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                      auxCategory === 'adaptogens' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    🌿 Адаптогены & Травы
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setAuxCategory('gastro_extra');
                    }}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                      auxCategory === 'gastro_extra' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    🫄 ЖКТ (Ребагит, Креон, Омез)
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setAuxCategory('antioxidants');
                    }}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                      auxCategory === 'antioxidants' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    🛡️ Антиоксиданты & Защита
                  </button>
                </div>

                {/* List of Auxiliary Medications with 7 required points */}
                <div className="space-y-2">
                  {filteredAuxMeds.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl">
                      По вашему запросу ничего не найдено.
                    </div>
                  ) : (
                    filteredAuxMeds.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedMed(selectedMed?.id === m.id ? null : m);
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                          selectedMed?.id === m.id
                            ? 'bg-slate-900 border-cyan-500/70 shadow-lg shadow-cyan-950/30'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-bold text-xs text-white line-clamp-1">{m.name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {m.legal_category_rf && (
                              <span
                                className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                  m.legal_category_rf === 'medicine'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-700/40'
                                    : m.legal_category_rf === 'vitamin_mineral'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/40'
                                    : 'bg-amber-950 text-amber-300 border border-amber-700/40'
                                }`}
                              >
                                {m.legal_category_rf === 'medicine' ? 'ЛС' : m.legal_category_rf === 'vitamin_mineral' ? 'Вит/Мин' : 'БАД'}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {selectedMed?.id === m.id ? '▲' : '▼'}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {m.purpose || m.why_in_stack || m.notes}
                        </div>

                        {/* FULL 7-SUBPOINT VIEW WHEN EXPANDED */}
                        {selectedMed?.id === m.id && (
                          <div className="pt-2.5 border-t border-slate-800 text-[11px] space-y-2 mt-2">
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                              <div className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider">
                                1. Название препарата
                              </div>
                              <div className="text-white font-medium">{m.name} ({m.active_ingredient || '—'})</div>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                              <div className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider">
                                2. Для чего используется
                              </div>
                              <div className="text-slate-200">{m.purpose || m.why_in_stack || m.notes || '—'}</div>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                              <div className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider">
                                3. Когда рассматривается применение
                              </div>
                              <div className="text-slate-200">{m.when_considered || 'По индивидуальным показаниям'}</div>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                              <div className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider">
                                4. Как принимать по инструкции
                              </div>
                              <div className="text-slate-200">{m.instruction_usage || m.schedule || 'По инструкции производителя'}</div>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                              <div className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                                5. Личный опыт автора
                              </div>
                              <div className="text-slate-200">{m.personal_experience || m.clarification_note || 'Применяется вне базовой триады курса'}</div>
                            </div>

                            <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-600/30 space-y-1">
                              <div className="text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                                6. Предостережения и противопоказания
                              </div>
                              <div className="text-slate-300">{m.precautions || 'Требуется консультация специалиста'}</div>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                              <div className="text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                                7. Место относительно основного курса
                              </div>
                              <div className="text-slate-300">{m.relation_to_main_course || 'Вспомогательное средство. Не входит в базовый курс'}</div>
                            </div>

                            {m.meta_analysis_summary && (
                              <div className="text-[10px] text-amber-300/90 pt-1">
                                <b>Мета-анализ:</b> {m.meta_analysis_summary}
                              </div>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendAssistant(`Расскажи о совместимости вспомогательного средства ${m.name} с основным авторским курсом (Хофитол, Глиатилин, Креатин, Фенотропил)`);
                                setActiveTab('assistant');
                              }}
                              className="w-full mt-1 py-1.5 rounded-lg text-[10px] font-bold bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/30 flex items-center justify-center gap-1 transition"
                            >
                              <span>🤖 Спросить AI-ассистента о совместимости</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. SUPER-ASSISTANT TAB (USING USER'S PROMPT) */}
            {activeTab === 'assistant' && (
              <div className="flex flex-col h-full space-y-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-sky-600/30 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Супер-ассистент @DonDearOfficina</span>
                  </div>
                  Обучен на каскадной философии владельца (провизор-химик, нейробиология, андрология, исламская мысль).
                  Разбор с PMID, cause-first подход, проверка взаимодействий со стеком.
                </div>

                {/* Messages Feed */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
                  {assistantMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'bg-sky-600 text-white ml-6 rounded-tr-none'
                          : msg.isRedFlag
                          ? 'bg-rose-950/80 text-rose-200 border border-rose-600/60 rounded-tl-none'
                          : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isAsking && (
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-sky-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                      <span>Ассистент анализирует каскад и мета-анализы PubMed...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Quick Prompts */}
                <div className="flex items-center gap-1 overflow-x-auto text-[10px] pb-1 scrollbar-none">
                  <button
                    onClick={() => handleSendAssistant('Почему нельзя начинать со стимуляторов без настройки ЖКТ и холина?')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:text-white whitespace-nowrap"
                  >
                    🌿 Почему ЖКТ первичен?
                  </button>
                  <button
                    onClick={() => handleSendAssistant('Объясни правила разнесения железа и цинка из-за DMT-1')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:text-white whitespace-nowrap"
                  >
                    ⚡ Железо против Цинка
                  </button>
                  <button
                    onClick={() => handleSendAssistant('Научный разбор черного тмина: тимохинон и мета-анализы РКИ')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:text-white whitespace-nowrap"
                  >
                    🕌 Черный тмин (тибб-и-набави)
                  </button>
                </div>

                {/* Input Bar */}
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAssistant()}
                    placeholder="Спросить ассистента..."
                    disabled={isAsking}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => handleSendAssistant()}
                    disabled={isAsking || !assistantInput.trim()}
                    className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 5. KNOWLEDGE TAB */}
            {activeTab === 'knowledge' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400">
                  Экспертные заметки владельца (@DonDearOfficina):
                </div>

                <div className="space-y-2">
                  {knowledgeNotes.map((n) => (
                    <div key={n.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-sky-400 tracking-wider">
                        [{n.topic}]
                      </span>
                      <h4 className="font-bold text-xs text-white">{n.title}</h4>
                      <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">{n.body}</p>
                      <div className="text-[9px] text-cyan-400 font-mono">
                        {n.evidence_refs.join(' • ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-3.5">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                      {currentUser.first_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        {currentUser.first_name} {currentUser.username ? `(@${currentUser.username})` : ''}
                      </h3>
                      <p className="text-[11px] text-cyan-400 font-medium">Роль: {currentUser.role}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Следование авторскому стеку:</span>
                      <span className={currentUser.on_author_protocol ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {currentUser.on_author_protocol ? '💎 Активно' : 'Выключено'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Возраст / Пол:</span>
                      <span>{currentUser.profile.age || '—'} лет • {currentUser.profile.gender || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>📩</span>
                    <span>Прямая связь с владельцем</span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Дипломированный провизор @DonDearOfficina: разбор анализов, аудит стека, персональные развилки каскада.
                  </p>
                  <a
                    href="https://t.me/DonDearOfficina"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 rounded-xl text-center text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition"
                  >
                    Написать @DonDearOfficina в Telegram
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Mini App Bottom Bar (Telegram Style) */}
          <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Личный опыт, разбор открытых данных</span>
            </div>
            <a
              href="https://t.me/DonDearOfficina"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 font-semibold hover:underline"
            >
              @DonDearOfficina
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
