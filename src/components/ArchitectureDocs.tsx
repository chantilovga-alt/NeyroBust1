import React from 'react';
import {
  Layers,
  Database,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertTriangle,
  FileText,
  Activity,
  Award,
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
          Медицинская система & Автоворонка (@DonDearOfficina, провизор • Бот @DonDearOfficinaAI)
        </h1>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
          Моноприложение для реализации авторского протокола оптимизации нервной системы и когнитивного потенциала.
          Включает сквозную автоворонку лидогенерации (Instagram Direct ➔ Telegram-бот <b>@DonDearOfficinaAI</b>),
          построенную на принципах доказательной фармации (Evidence-Based Medicine) дипломированного провизора @DonDearOfficina.
        </p>
      </div>

      {/* 3-Level Pyramid Architecture */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700/80 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>Авторская трехступенчатая пирамида буста</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Вектор схемы @DonDearOfficina строго детерминирован биохимической логикой:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-800/80 rounded-xl border border-emerald-500/30">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              Уровень 1: ЖКТ-фундамент
            </span>
            <p className="text-xs text-slate-300 mt-2">
              <b>Хофитол</b> (желчеотток, мицеллообразование жирорастворимых соединений), <b>Энтерол</b> (барьерная функция эпителия).
              Без адекватного желчеоттока и эмульгации гидрофобные ноотропы и витамины теряют биодоступность.
            </p>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-cyan-500/30">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              Уровень 2: Нейробуст
            </span>
            <p className="text-xs text-slate-300 mt-2">
              <b>Глиатилин</b> (донор холина для синапсов) + <b>Фенотропил</b> (дофаминергический модулятор) + <b>Креатин & L-Цитруллин</b> (ресинтез АТФ и церебральная гемодинамика).
              Стимуляция без субстрата холина ведет к астении.
            </p>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-amber-500/30">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Уровень 3: БАД-страховка
            </span>
            <p className="text-xs text-slate-300 mt-2">
              <b>Ферлатум Фол</b> (депо ферритина для тирозингидроксилазы), <b>Цинк</b> (тестостероновая ось), <b>Селен</b> (конверсия Т4→Т3), <b>Омега-3</b>.
              Биохимическая страховка синтеза нейромедиаторов.
            </p>
          </div>
        </div>
      </div>

      {/* Database Schema Visualizer */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700/80 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <span>Реляционная модель данных (PostgreSQL 15+)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
            <b className="text-cyan-400 font-mono block">users</b>
            <span className="text-slate-400 text-[11px] block mt-1">
              id, telegram_id, role, on_author_protocol, profile (JSONB), consent_version
            </span>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
            <b className="text-cyan-400 font-mono block">medications</b>
            <span className="text-slate-400 text-[11px] block mt-1">
              id, category, status (active/archive/needs_clarification), dose, schedule, evidence_refs
            </span>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
            <b className="text-cyan-400 font-mono block">specialists</b>
            <span className="text-slate-400 text-[11px] block mt-1">
              id, user_id, specialization[], telegram_link, documents (JSONB), status (verified)
            </span>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
            <b className="text-cyan-400 font-mono block">audit_log</b>
            <span className="text-slate-400 text-[11px] block mt-1">
              Append-only журнал. Триггер запрещает UPDATE/DELETE. payload_before / payload_after.
            </span>
          </div>
        </div>
      </div>

      {/* Security & Constraints Standards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700/80 space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ограничения Telegram API & Инвайты</span>
          </h3>
          <ul className="text-xs space-y-2 text-slate-400">
            <li>
              • <b>Telegram Bot API:</b> Бот принципиально не может писать пользователю первым. В Консоли Специалиста отправка сообщений активна только после <code>has_started_bot=true</code>.
            </li>
            <li>
              • <b>Инвайт-токены:</b> Генерируются криптографически (\`secrets.token_urlsafe(32)\`), в базе хранится только SHA-256 хеш. TTL 24 часа. Ссылка: <code>https://t.me/Bot?start=inv_...</code>.
            </li>
            <li>
              • <b>Защита от утечек:</b> Кража дампа базы данных не позволяет злоумышленнику использовать инвайты, так как сырой токен не сохраняется.
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700/80 space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Красные флаги (Red Flags) & Эскалация</span>
          </h3>
          <ul className="text-xs space-y-2 text-slate-400">
            <li>
              • При обнаружении ключевых симптомов (боль в груди, судороги, острое кровотечение, потеря сознания) диагностика <b>немедленно прекращается</b>.
            </li>
            <li>
              • Выводится экстренная кнопка вызова службы скорой помощи (112).
            </li>
            <li>
              • ИИ категорически запрещено выдумывать дозировки, несуществующие исследования или ставить клинические диагнозы.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
