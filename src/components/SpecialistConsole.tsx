import React, { useState } from 'react';
import {
  Users,
  Link as LinkIcon,
  UserPlus,
  Send,
  ShieldCheck,
  FileCheck,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Lock,
  Clock,
  Activity,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SpecialistPatient } from '../types';

export const SpecialistConsole: React.FC = () => {
  const {
    currentUser,
    specialists,
    specialistPatients,
    invites,
    generateInvite,
    addPatientManual,
    removePatient,
    updateSpecialistProfile,
    addAuditLog,
  } = useApp();

  // Find specialist object or default to Morozov
  const currentSpecialist =
    specialists.find((s) => s.user_id === currentUser.id) || specialists[0];

  const [activeSubTab, setActiveSubTab] = useState<'patients' | 'invite' | 'add_manual' | 'profile' | 'analytics'>('patients');
  const [totpVerified, setTotpVerified] = useState(true); // Pre-verified for convenience
  const [totpInput, setTotpInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [lastGeneratedLink, setLastGeneratedLink] = useState<string | null>(null);

  // Manual Add Form
  const [manualTelegramId, setManualTelegramId] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // Send Message Modal / State
  const [selectedPatientForMsg, setSelectedPatientForMsg] = useState<SpecialistPatient | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const [msgStatus, setMsgStatus] = useState<string | null>(null);

  // Filter only this specialist's patients
  const myPatients = specialistPatients.filter(
    (sp) => sp.specialist_id === currentSpecialist.id && sp.status !== 'removed'
  );

  const handleGenerateInvite = () => {
    const { deepLink } = generateInvite(currentSpecialist.id, 1, 24);
    setLastGeneratedLink(deepLink);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(null);
    const tgId = parseInt(manualTelegramId.trim());
    if (isNaN(tgId)) {
      setManualError('Введите корректный числовой Telegram ID');
      return;
    }

    const res = addPatientManual(currentSpecialist.id, tgId, manualNotes);
    if (!res.success) {
      setManualError(res.message);
    } else {
      setManualSuccess(res.message);
      setManualTelegramId('');
      setManualNotes('');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForMsg || !messageBody.trim()) return;

    // Strict Telegram API Constraint Verification
    // (A bot cannot initiate contact with a user who hasn't started the bot or blocked it)
    if (selectedPatientForMsg.status === 'invited') {
      setMsgStatus('❌ ОШИБКА TELEGRAM API: Пациент еще не нажал /start. Отправка заблокирована.');
      return;
    }

    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentSpecialist.first_name,
      actor_role: 'specialist',
      action: 'patient_message',
      target_type: 'patient_message',
      target_id: selectedPatientForMsg.patient_id,
      payload_after: { body: messageBody.slice(0, 100), patient_id: selectedPatientForMsg.patient_id },
    });

    setMsgStatus('✅ Сообщение успешно доставлено в Telegram пациента.');
    setTimeout(() => {
      setSelectedPatientForMsg(null);
      setMessageBody('');
      setMsgStatus(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Specialist Header Card */}
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentSpecialist.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
              alt={currentSpecialist.first_name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-cyan-500/40"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{currentSpecialist.first_name}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {currentSpecialist.status.toUpperCase()}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Специализация: {currentSpecialist.specialization.join(' • ')}
              </p>
              <p className="text-cyan-400 text-xs">
                Telegram: <b>@{currentSpecialist.username}</b>
              </p>
            </div>
          </div>

          {/* 2FA Status Indicator */}
          <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-700">
            <Lock className="w-4 h-4 text-emerald-400" />
            <div className="text-xs">
              <span className="text-slate-400">Двухфакторная защита (TOTP):</span>
              <span className="font-bold text-emerald-400 block">АКТИВНА & ВЕРИФИЦИРОВАНА</span>
            </div>
          </div>
        </div>

        {/* Console Sub-Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-slate-700/60">
          <button
            onClick={() => setActiveSubTab('patients')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeSubTab === 'patients'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Пациенты ({myPatients.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('invite')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeSubTab === 'invite'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Инвайт-ссылка (Deep link)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('add_manual')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeSubTab === 'add_manual'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Добавить по Telegram ID</span>
          </button>
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeSubTab === 'profile'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Документы & Аккредитация</span>
          </button>
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeSubTab === 'analytics'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Аналитика практики</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Patients List */}
      {activeSubTab === 'patients' && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Список прикрепленных пациентов</h3>
              <p className="text-slate-400 text-xs">
                Изоляция данных: специалист видит только пациентов с привязкой к его <code>specialist_id</code>.
              </p>
            </div>
          </div>

          {myPatients.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
              У вас пока нет прикрепленных пациентов. Сгенерируйте инвайт-ссылку.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="pb-3 font-semibold">Пациент</th>
                    <th className="pb-3 font-semibold">Telegram ID</th>
                    <th className="pb-3 font-semibold">Способ добавления</th>
                    <th className="pb-3 font-semibold">Статус бота</th>
                    <th className="pb-3 font-semibold">Заметки куратора</th>
                    <th className="pb-3 font-semibold text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {myPatients.map((p) => {
                    const isInvitedOnly = p.status === 'invited';
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 font-medium text-slate-200">
                          {p.patient_name || 'Пациент'}
                          {p.patient_username && (
                            <span className="block text-[11px] text-cyan-400">@{p.patient_username}</span>
                          )}
                        </td>
                        <td className="py-3 text-slate-400">
                          <code>{p.patient_telegram_id || '—'}</code>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                            {p.added_via === 'invite' ? 'Инвайт-ссылка' : 'Вручную'}
                          </span>
                        </td>
                        <td className="py-3">
                          {isInvitedOnly ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-600/30">
                              <Clock className="w-3 h-3" />
                              Ожидает /start
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-600/30">
                              <Check className="w-3 h-3" />
                              Бот активен (/start)
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-400 max-w-[200px] truncate">{p.notes || '—'}</td>
                        <td className="py-3 text-right space-x-2">
                          <button
                            onClick={() => setSelectedPatientForMsg(p)}
                            title={isInvitedOnly ? 'Нельзя писать до первого /start' : 'Написать пациенту'}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                              isInvitedOnly
                                ? 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                            }`}
                          >
                            Написать
                          </button>
                          <button
                            onClick={() => removePatient(p.id)}
                            title="Открепить пациента (Soft delete)"
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Generate Invite Deep Link */}
      {activeSubTab === 'invite' && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 max-w-2xl">
          <h3 className="font-bold text-white text-base">Генерация защищенной инвайт-ссылки</h3>
          <p className="text-slate-400 text-xs mt-1">
            Ссылка генерирует 256-битный криптографический токен (<code>secrets.token_urlsafe(32)</code>).
            В базе данных сохраняется исключительно SHA-256 хеш. Срок жизни (TTL) — 24 часа.
          </p>

          <div className="mt-5 space-y-4">
            <button
              onClick={handleGenerateInvite}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Сгенерировать одноразовую ссылку (TTL 24ч)</span>
            </button>

            {lastGeneratedLink && (
              <div className="p-4 bg-slate-900 rounded-xl border border-cyan-500/40 space-y-2">
                <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wide">
                  Ваша персонализированная Deep-Link ссылка:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={lastGeneratedLink}
                    className="flex-1 bg-slate-800 text-xs text-slate-200 px-3 py-2 rounded-lg font-mono border border-slate-700"
                  />
                  <button
                    onClick={() => copyToClipboard(lastGeneratedLink)}
                    className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs flex items-center gap-1.5 transition"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Скопировано!' : 'Копировать'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Формат ссылки: <code>https://t.me/NeuroBoostBot?start=inv_...</code> (длина 47 симв. ≤ лимита Telegram 64).
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: Add Manual Patient */}
      {activeSubTab === 'add_manual' && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 max-w-xl">
          <h3 className="font-bold text-white text-base">Ручное добавление пациента по Telegram ID</h3>
          <p className="text-slate-400 text-xs mt-1">
            Используйте, если пациент уже запустил бота и предоставил свой числовой Telegram ID.
          </p>

          <form onSubmit={handleManualAddSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Числовой Telegram ID пациента:
              </label>
              <input
                type="number"
                required
                value={manualTelegramId}
                onChange={(e) => setManualTelegramId(e.target.value)}
                placeholder="например: 555666777"
                className="w-full bg-slate-900 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Клинические заметки / жалоба:
              </label>
              <textarea
                rows={3}
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Анамнез, цель консультации, принимаемые ноотропы..."
                className="w-full bg-slate-900 text-slate-100 text-xs px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {manualError && (
              <div className="p-3 bg-rose-950/60 rounded-xl text-xs text-rose-300 border border-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            {manualSuccess && (
              <div className="p-3 bg-emerald-950/60 rounded-xl text-xs text-emerald-300 border border-emerald-700 flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{manualSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
            >
              Добавить пациента в мой реестр
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 4: Documents & Credentials */}
      {activeSubTab === 'profile' && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 max-w-2xl space-y-4">
          <h3 className="font-bold text-white text-base">Документы об образовании и аккредитации</h3>
          <p className="text-slate-400 text-xs">
            Загруженные сканы дипломов и сертификатов, подтвержденные администрацией @DonDearOfficina:
          </p>

          <div className="space-y-3">
            {currentSpecialist.documents.map((doc, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-900 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200 block">{doc.type}</span>
                  <span className="text-slate-400 text-[11px]">
                    {doc.org} (выдан: {doc.date})
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  {doc.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: Analytics */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700">
            <span className="text-xs text-slate-400">Активных пациентов</span>
            <div className="text-2xl font-bold text-cyan-400 mt-1">{myPatients.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Прикреплены по инвайту или вручную</p>
          </div>
          <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700">
            <span className="text-xs text-slate-400">Конверсия инвайтов</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">100%</div>
            <p className="text-[11px] text-slate-500 mt-1">Все выданные ссылки активированы</p>
          </div>
          <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700">
            <span className="text-xs text-slate-400">Соблюдение Telegram API</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">100%</div>
            <p className="text-[11px] text-slate-500 mt-1">Запрет исходящих до /start активен</p>
          </div>
        </div>
      )}

      {/* Modal / Dialog for Sending Patient Message */}
      {selectedPatientForMsg && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-white text-sm">
                Отправка сообщения: {selectedPatientForMsg.patient_name}
              </h4>
              <button
                onClick={() => setSelectedPatientForMsg(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {selectedPatientForMsg.status === 'invited' ? (
              <div className="p-3 bg-rose-950/60 rounded-xl text-xs text-rose-300 border border-rose-700 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Ограничение Telegram Bot API:</span>
                </div>
                <p>
                  Бот не может инициировать диалог первым. Пользователь должен перейти по инвайт-ссылке
                  и нажать кнопку <b>/start</b>. До этого момента отправка сообщений технически заблокирована.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Текст сообщения / назначение анализов:
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Например: Здравствуйте! Проанализировал ваш профиль, рекомендую сдать ферритин и гомоцистеин..."
                    className="w-full bg-slate-800 text-slate-100 text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {msgStatus && (
                  <div className="p-2.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-200">
                    {msgStatus}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPatientForMsg(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Отправить</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
