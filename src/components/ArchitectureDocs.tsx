import React from 'react';
import {
  Layers,
  Database,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Droplets,
} from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto text-slate-300">
      {/* Title */}
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700 backdrop-blur">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2 inline-block">
          Системная архитектура & Стандарты
        </span>
        <h1 className="text-2xl font-bold text-white mt-1">
          Медицинская система авторского курса @DonDearOfficina (Telegram: @DonDearOfficina_bot)
        </h1>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
          Архитектура нативного Telegram-бота и системы управления авторским курсом дипломированного провизора-химика <b>@DonDearOfficina</b>.
          Построен на принципах Cause-First: от фундамента ЖКТ и водно-солевого гомеостаза к длительной нейрометаболической базе.
          Все консультации ведутся лично автором без генеративных AI-ассистентов.
        </p>
      </div>

      {/* 3-Stage Course Architecture */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700/80 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>Единая трехэтапная программа курса @DonDearOfficina</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Последовательность этапов строго выстроена биохимической логикой всасывания и синаптической физиологии:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-800/80 rounded-xl border border-emerald-500/30">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              1-й месяц: ЖКТ, желчеотток и вода
            </span>
            <p className="text-xs text-slate-300 mt-2">
              <b>Хофитол</b> (холерез, эмульгация липидов), <b>Полисорб МП</b> (минимум 3 недели для детоксикации), <b>Энтерол</b> (барьерная функция энтероцитов).
              Подраздел водно-электролитного баланса (<b>Регидрон</b>, <b>Адиарин Регидрокомплекс</b> по показаниям дегидратации).
            </p>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-cyan-500/30">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              Со 2-го месяца: Комплекс «Нейробуст» (6+ мес)
            </span>
            <p className="text-xs text-slate-300 mt-2">
              <b>Глиатилин</b> (донор холина) + <b>Креатин</b> (АТФ) + <b>L-Цитруллин</b> (оксид азота, снятие венозного стаза).
              «Нейробуст» — название этой связки 3 компонентов, принимаемой <b>минимум 6 месяцев</b> (месяцы 2–7+).
            </p>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-amber-500/30">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              3-й и 4-й месяцы: Фенотропил (ровно 2 мес)
            </span>
            <p className="text-xs text-slate-300 mt-2">
              <b>Фенотропил</b> подключается на 3-м месяце и длится ровно 2 месяца.
              Прием базы 2-го этапа (Глиатилин, Креатин, Цитруллин) продолжается параллельно.
              Последующие авторские опции: Пирацетам ➔ Ноопепт.
            </p>
          </div>
        </div>
      </div>

      {/* Persistent Storage & Data Integrity */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700/80 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <span>Постоянное хранение данных (Persistent Disk Storage)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
            <b className="text-cyan-400 font-mono block">userSessions</b>
            <span className="text-slate-400 text-[11px] block mt-1">
              Постоянное хранение сессий Telegram, подтверждения старта курса, активного месяца и чек-листов на диске.
            </span>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
            <b className="text-cyan-400 font-mono block">weightDiary</b>
            <span className="text-slate-400 text-[11px] block mt-1">
              Дневник веса пользователя: дата, масса тела, примечания, сохранение и удаление собственных записей.
            </span>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
            <b className="text-cyan-400 font-mono block">workoutLogs</b>
            <span className="text-slate-400 text-[11px] block mt-1">
              Журнал тренировок с привязкой к конкретной дате: икры, приседания в отказ, верх тела, ягодичные.
            </span>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
            <b className="text-cyan-400 font-mono block">webhookIdempotency</b>
            <span className="text-slate-400 text-[11px] block mt-1">
              Реестр обработанных событий Instagram Graph Webhook для исключения повторной отправки сообщений.
            </span>
          </div>
        </div>
      </div>

      {/* Safety & Author Contact Standards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700/80 space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Безопасность и личный контакт</span>
          </h3>
          <ul className="text-xs space-y-2 text-slate-400">
            <li>
              • <b>Личный контакт:</b> Все консультации и вопросы направляются напрямую автору: <code>@DonDearOfficina</code>.
            </li>
            <li>
              • <b>Без AI-диагнозов:</b> Пользовательский AI-ассистент отключен; бот не генерирует клинических назначений.
            </li>
            <li>
              • <b>Защита токенов:</b> Токены Telegram и Meta Graph не сохраняются в коде и не передаются в публичные API.
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700/80 space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Красные флаги (Red Flags) & Скорая помощь</span>
          </h3>
          <ul className="text-xs space-y-2 text-slate-400">
            <li>
              • При упоминании острой боли, признаков инсульта, судорог или кровотечения бот немедленно направляет к службе 103/112.
            </li>
            <li>
              • Автор и бот не заменяют экстренные медицинские службы.
            </li>
            <li>
              • Водный баланс и электролиты не используются для мочегонных целей или сомнительного снижения веса.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
