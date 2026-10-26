import React, { useState } from 'react';
import {
  Pill,
  BookOpen,
  UserCheck,
  Users,
  BarChart3,
  Send,
  ScrollText,
  AlertTriangle,
  Plus,
  Archive,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Dumbbell,
  Activity,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Medication, MedCategory, MedStatus, WorkoutExercise } from '../types';

export const OwnerConsole: React.FC = () => {
  const {
    currentUser,
    medications,
    addMedication,
    updateMedication,
    archiveMedication,
    deleteMedication,
    workoutExercises,
    workoutPhilosophy,
    islamicRemedies,
    addIslamicRemedy,
    updateIslamicRemedy,
    deleteIslamicRemedy,
    knowledgeNotes,
    addKnowledgeNote,
    updateKnowledgeNote,
    deleteKnowledgeNote,
    specialists,
    verifySpecialist,
    specialistPatients,
    recommendations,
    addRecommendation,
    updateRecommendation,
    deleteRecommendation,
    auditLogs,
    runBroadcast,
    funnelStages,
    funnelTriggers,
    funnelLeads,
    toggleFunnelTrigger,
    updateFunnelTrigger,
    updateFunnelStage,
    advanceFunnelStep,
  } = useApp();

  const [activeOwnerMenu, setActiveOwnerMenu] = useState<
    'meds' | 'workout' | 'knowledge' | 'specialists' | 'patients' | 'stats' | 'broadcast' | 'audit' | 'funnels'
  >('funnels');

  // Medication filtering
  const [medCategoryFilter, setMedCategoryFilter] = useState<string>('all');
  const [medStatusFilter, setMedStatusFilter] = useState<string>('all');
  const [medSearch, setMedSearch] = useState<string>('');

  // Medication Form Modal
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [editingMedId, setEditingMedId] = useState<number | null>(null);
  const [medFormName, setMedFormName] = useState('');
  const [medFormIngredient, setMedFormIngredient] = useState('');
  const [medFormCategory, setMedFormCategory] = useState<MedCategory>('neuroboost');
  const [medFormStatus, setMedFormStatus] = useState<MedStatus>('active');
  const [medFormDose, setMedFormDose] = useState('');
  const [medFormSchedule, setMedFormSchedule] = useState('');
  const [medFormNotes, setMedFormNotes] = useState('');
  const [medFormRefs, setMedFormRefs] = useState('');
  const [medFormClarification, setMedFormClarification] = useState('');

  // Recommendation Form Modal
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [editingRecId, setEditingRecId] = useState<number | null>(null);
  const [recTitle, setRecTitle] = useState('');
  const [recBody, setRecBody] = useState('');
  const [recRefs, setRecRefs] = useState('');

  // Broadcast
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastProgress, setBroadcastProgress] = useState<{ isSending: boolean; sent: number; total: number } | null>(null);

  // Filtered meds
  const filteredMeds = medications.filter((m) => {
    if (medCategoryFilter !== 'all' && m.category !== medCategoryFilter) return false;
    if (medStatusFilter !== 'all' && m.status !== medStatusFilter) return false;
    if (medSearch) {
      const q = medSearch.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchIng = m.active_ingredient?.toLowerCase().includes(q);
      return matchName || matchIng;
    }
    return true;
  });

  const handleOpenAddMedModal = () => {
    setEditingMedId(null);
    setMedFormName('');
    setMedFormIngredient('');
    setMedFormCategory('neuroboost');
    setMedFormStatus('active');
    setMedFormDose('');
    setMedFormSchedule('');
    setMedFormNotes('');
    setMedFormRefs('PMID: ');
    setMedFormClarification('');
    setIsMedModalOpen(true);
  };

  const handleOpenEditMedModal = (med: Medication) => {
    setEditingMedId(med.id);
    setMedFormName(med.name);
    setMedFormIngredient(med.active_ingredient || '');
    setMedFormCategory(med.category);
    setMedFormStatus(med.status);
    setMedFormDose(med.dose || '');
    setMedFormSchedule(med.schedule || '');
    setMedFormNotes(med.notes || '');
    setMedFormRefs(med.evidence_refs?.join(', ') || '');
    setMedFormClarification(med.clarification_note || '');
    setIsMedModalOpen(true);
  };

  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    const refsArray = medFormRefs
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    if (editingMedId) {
      updateMedication(editingMedId, {
        name: medFormName,
        active_ingredient: medFormIngredient,
        category: medFormCategory,
        status: medFormStatus,
        dose: medFormDose,
        schedule: medFormSchedule,
        notes: medFormNotes,
        evidence_refs: refsArray,
        clarification_note: medFormClarification,
      });
    } else {
      addMedication({
        owner_id: currentUser.id,
        name: medFormName,
        active_ingredient: medFormIngredient,
        category: medFormCategory,
        status: medFormStatus,
        source: 'author',
        dose: medFormDose,
        schedule: medFormSchedule,
        notes: medFormNotes,
        evidence_refs: refsArray,
        clarification_note: medFormClarification,
      });
    }
    setIsMedModalOpen(false);
  };

  const handleOpenAddRecModal = () => {
    setEditingRecId(null);
    setRecTitle('');
    setRecBody('');
    setRecRefs('PMID: ');
    setIsRecModalOpen(true);
  };

  const handleOpenEditRecModal = (r: (typeof recommendations)[0]) => {
    setEditingRecId(r.id);
    setRecTitle(r.title);
    setRecBody(r.body);
    setRecRefs(r.evidence_refs.join(', '));
    setIsRecModalOpen(true);
  };

  const handleSaveRec = (e: React.FormEvent) => {
    e.preventDefault();
    const refsArray = recRefs.split(',').map((r) => r.trim()).filter(Boolean);

    if (editingRecId) {
      updateRecommendation(editingRecId, {
        title: recTitle,
        body: recBody,
        evidence_refs: refsArray,
      });
    } else {
      addRecommendation({
        author_id: currentUser.id,
        title: recTitle,
        body: recBody,
        evidence_refs: refsArray,
        attachments: [],
        is_published: true,
      });
    }
    setIsRecModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Название', 'Категория', 'Статус', 'Действующее вещество', 'Доза', 'Режим', 'Обоснование'];
    const rows = medications.map((m) => [
      m.id,
      `"${m.name.replace(/"/g, '""')}"`,
      m.category,
      m.status,
      `"${(m.active_ingredient || '').replace(/"/g, '""')}"`,
      `"${(m.dose || '').replace(/"/g, '""')}"`,
      `"${(m.schedule || '').replace(/"/g, '""')}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `neuroboost_medications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    setBroadcastProgress({ isSending: true, sent: 0, total: 100 });
    // Simulate rate-limited 30 msg/sec sending
    await new Promise((r) => setTimeout(r, 600));
    setBroadcastProgress({ isSending: true, sent: 30, total: 100 });
    await new Promise((r) => setTimeout(r, 600));
    setBroadcastProgress({ isSending: true, sent: 60, total: 100 });
    await new Promise((r) => setTimeout(r, 600));
    setBroadcastProgress({ isSending: false, sent: 100, total: 100 });

    await runBroadcast(broadcastText);
    setTimeout(() => {
      setBroadcastProgress(null);
      setBroadcastText('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Owner Header */}
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👑</span>
              <h1 className="text-xl font-bold text-white">Панель модерации @DonDearOfficina</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                СУПЕРАДМИН
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Дипломированный провизор • Бот <b>@DonDearOfficinaAI</b>. Вложенность структуры меню строго ≤ 3 уровней.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" />
              <span>Экспорт базы (CSV)</span>
            </button>
          </div>
        </div>

        {/* Main Section Buttons + Admin Utilities + Marketing Funnels */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 mt-6 pt-5 border-t border-slate-700/60 text-xs font-semibold">
          <button
            onClick={() => setActiveOwnerMenu('funnels')}
            className={`px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeOwnerMenu === 'funnels'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                : 'bg-purple-950/40 text-pink-300 border border-pink-500/30 hover:bg-purple-900/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-pink-300" />
            <span>🚀 Автоворонка</span>
          </button>
          <button
            onClick={() => setActiveOwnerMenu('meds')}
            className={`px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeOwnerMenu === 'meds' ? 'bg-cyan-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>1. Препараты</span>
          </button>
          <button
            onClick={() => setActiveOwnerMenu('workout')}
            className={`px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeOwnerMenu === 'workout' ? 'bg-amber-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>2. Тренировки</span>
          </button>
          <button
            onClick={() => setActiveOwnerMenu('knowledge')}
            className={`px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeOwnerMenu === 'knowledge' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>3. База знаний</span>
          </button>
          <button
            onClick={() => setActiveOwnerMenu('specialists')}
            className={`px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeOwnerMenu === 'specialists' ? 'bg-cyan-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>4. Врачи</span>
          </button>
          <button
            onClick={() => setActiveOwnerMenu('patients')}
            className={`px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeOwnerMenu === 'patients' ? 'bg-cyan-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>5. Пациенты</span>
          </button>
          <button
            onClick={() => setActiveOwnerMenu('stats')}
            className={`px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeOwnerMenu === 'stats' ? 'bg-cyan-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Статистика</span>
          </button>
          <button
            onClick={() => setActiveOwnerMenu('broadcast')}
            className={`px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeOwnerMenu === 'broadcast' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Рассылка</span>
          </button>
          <button
            onClick={() => setActiveOwnerMenu('audit')}
            className={`px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeOwnerMenu === 'audit' ? 'bg-amber-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span>Аудит</span>
          </button>
        </div>
      </div>

      {/* 0. MARKETING AUTO-FUNNELS (INSTAGRAM DIRECT & TELEGRAM) */}
      {activeOwnerMenu === 'funnels' && (
        <div className="space-y-6">
          {/* Top Funnel KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-purple-500/30">
              <span className="text-xs text-purple-300 font-medium">Всего захвачено лидов</span>
              <div className="text-2xl font-bold text-white mt-1">
                {funnelTriggers.reduce((acc, t) => acc + t.total_leads, 0)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Instagram Direct + Telegram-бот @DonDearOfficinaAI
              </span>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-2xl border border-emerald-500/30">
              <span className="text-xs text-emerald-300 font-medium">Успешных конверсий</span>
              <div className="text-2xl font-bold text-white mt-1">
                {funnelTriggers.reduce((acc, t) => acc + t.conversions, 0)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Завершили онбординг / записались на личный аудит
              </span>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-2xl border border-cyan-500/30">
              <span className="text-xs text-cyan-300 font-medium">Конверсия воронки (CR)</span>
              <div className="text-2xl font-bold text-cyan-400 mt-1">
                {(
                  (funnelTriggers.reduce((acc, t) => acc + t.conversions, 0) /
                    Math.max(
                      1,
                      funnelTriggers.reduce((acc, t) => acc + t.total_leads, 0)
                    )) *
                  100
                ).toFixed(1)}
                %
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Высокий показатель благодаря cause-first контенту
              </span>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-2xl border border-amber-500/30">
              <span className="text-xs text-amber-300 font-medium">Целевой оффер провизора</span>
              <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                <span>Личный аудит протокола</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Связка с @DonDearOfficina (дипломированный провизор)
              </span>
            </div>
          </div>

          {/* 4 Pipeline Stages */}
          <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <span>🗺️</span>
                  <span>Каскадная архитектура 4 этапов автоворонки</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Пошаговое сопровождение лида: от ключевого слова в Instagram Direct до глубокого аудита в Telegram
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {funnelStages.map((stage) => (
                <div
                  key={stage.id}
                  className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/80 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Шаг {stage.step_number}
                      </span>
                      <span className="text-[10px] text-slate-400">{stage.delay_label}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{stage.name}</h4>
                    <p className="text-xs text-slate-300 font-medium mt-1">{stage.title}</p>
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-4 leading-relaxed whitespace-pre-line">
                      {stage.body}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1.5">
                    {stage.lead_magnet_name && (
                      <div className="flex items-center gap-1.5 text-pink-300 font-medium text-[10px] line-clamp-1">
                        <span>📄</span>
                        <span>{stage.lead_magnet_name}</span>
                      </div>
                    )}
                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-cyan-300 text-[10px] font-semibold text-center border border-slate-700/80">
                      CTA: {stage.cta_text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trigger Keywords Manager */}
          <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <span>⚡</span>
                  <span>Кодовые слова и триггеры (Instagram Direct & Telegram)</span>
                </h3>
                <p className="text-slate-400 text-xs">
                  При получении кодового слова в Direct или боте запускается персонализированный лид-магнит
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[11px] uppercase text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="p-3">Триггер (Слово)</th>
                    <th className="p-3">Канал</th>
                    <th className="p-3">Кампания & Лид-магнит</th>
                    <th className="p-3">Лиды</th>
                    <th className="p-3">Конверсии</th>
                    <th className="p-3">CR</th>
                    <th className="p-3">Статус</th>
                    <th className="p-3 text-right">Управление</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {funnelTriggers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3 font-mono font-bold text-pink-300 text-sm">
                        💬 {tr.keyword}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            tr.channel === 'instagram'
                              ? 'bg-pink-950/80 text-pink-300 border border-pink-700/50'
                              : tr.channel === 'telegram'
                              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/50'
                              : 'bg-purple-950/80 text-purple-300 border border-purple-700/50'
                          }`}
                        >
                          {tr.channel}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{tr.campaign_name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{tr.lead_magnet_title}</div>
                      </td>
                      <td className="p-3 font-bold text-slate-100">{tr.total_leads}</td>
                      <td className="p-3 font-bold text-emerald-400">{tr.conversions}</td>
                      <td className="p-3 font-semibold text-cyan-400">
                        {((tr.conversions / Math.max(1, tr.total_leads)) * 100).toFixed(1)}%
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tr.is_active ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {tr.is_active ? 'Активен' : 'Отключен'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toggleFunnelTrigger(tr.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        >
                          {tr.is_active ? 'Приостановить' : 'Активировать'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Funnel Leads Pipeline Table */}
          <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <span>👥</span>
                  <span>Текущие лиды в пайплайне воронки</span>
                </h3>
                <p className="text-slate-400 text-xs">
                  Отслеживание движения пользователя по шагам 1..4 и бесшовный переход из Instagram в Telegram
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[11px] uppercase text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="p-3">Пользователь</th>
                    <th className="p-3">Канал</th>
                    <th className="p-3">Триггер</th>
                    <th className="p-3">Текущий шаг</th>
                    <th className="p-3">Связка с Telegram</th>
                    <th className="p-3">Статус</th>
                    <th className="p-3">Последняя активность</th>
                    <th className="p-3 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {funnelLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3">
                        <div className="font-bold text-white">{lead.full_name}</div>
                        <div className="text-[11px] text-cyan-400 font-mono">@{lead.username}</div>
                      </td>
                      <td className="p-3">
                        <span className="capitalize font-semibold text-slate-300">{lead.channel}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-pink-300">
                        {lead.trigger_keyword}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-cyan-400">Шаг {lead.current_step}/4</span>
                          <span className="text-[10px] text-slate-400">
                            ({funnelStages.find((s) => s.step_number === lead.current_step)?.name || ''})
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-28 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${(lead.current_step / 4) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        {lead.telegram_connected ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>@DonDearOfficinaAI</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Ожидает клика в Direct</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            lead.status === 'converted'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          }`}
                        >
                          {lead.status === 'converted' ? '✅ Сконвертирован' : '⏳ В процессе'}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">
                        {new Date(lead.last_message_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => advanceFunnelStep(lead.id)}
                          disabled={lead.current_step >= 4}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition active:scale-95"
                        >
                          {lead.current_step >= 4 ? 'Завершено' : 'Продвинуть ➔'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 1. MEDICATIONS MANAGEMENT */}
      {activeOwnerMenu === 'meds' && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base">Единая база препаратов (Seed & Dynamic)</h3>
              <p className="text-slate-400 text-xs">
                Всего позиций в БД: <b>{medications.length}</b>. Препараты в статусе <code>needs_clarification</code> (Имплосорб) скрыты от пациентов до проверки.
              </p>
            </div>
            <button
              onClick={handleOpenAddMedModal}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить препарат</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                placeholder="Поиск по названию или веществу..."
                className="w-full bg-slate-900 text-slate-100 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <select
                value={medCategoryFilter}
                onChange={(e) => setMedCategoryFilter(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Все категории (ЖКТ, Нейробуст, БАД)</option>
                <option value="gastro">ЖКТ-фундамент</option>
                <option value="neuroboost">Нейробуст</option>
                <option value="supplement">БАД-поддержка</option>
              </select>
            </div>
            <div>
              <select
                value={medStatusFilter}
                onChange={(e) => setMedStatusFilter(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Все статусы (Active, Archive, Needs Clarification)</option>
                <option value="active">Active (В основном протоколе)</option>
                <option value="archive">Archive (Завершенные / архив)</option>
                <option value="needs_clarification">Needs Clarification (Только владелец)</option>
                <option value="pending">Pending (Куплено / в очереди)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="pb-3 font-semibold">Название & Вещество</th>
                  <th className="pb-3 font-semibold">Категория</th>
                  <th className="pb-3 font-semibold">Статус</th>
                  <th className="pb-3 font-semibold">Дозировка & Схема</th>
                  <th className="pb-3 font-semibold">Источники (PMID)</th>
                  <th className="pb-3 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredMeds.map((m) => {
                  let badge = 'bg-slate-800 text-slate-300';
                  if (m.status === 'active') badge = 'bg-emerald-950/60 text-emerald-400 border border-emerald-600/40';
                  else if (m.status === 'archive') badge = 'bg-slate-900 text-slate-400';
                  else if (m.status === 'needs_clarification')
                    badge = 'bg-rose-950/70 text-rose-300 border border-rose-600/60 font-bold';
                  else if (m.status === 'pending') badge = 'bg-amber-950/60 text-amber-300 border border-amber-600/40';

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-medium text-slate-200">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{m.name}</span>
                          {m.legal_category_rf && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                m.legal_category_rf === 'medicine'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-700/50'
                                  : m.legal_category_rf === 'vitamin_mineral'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                                  : 'bg-amber-950 text-amber-300 border border-amber-700/50'
                              }`}
                            >
                              {m.legal_category_rf === 'medicine'
                                ? '💊 ЛС (ГРЛС)'
                                : m.legal_category_rf === 'vitamin_mineral'
                                ? '🟢 Вит/Мин'
                                : '🟡 БАД'}
                            </span>
                          )}
                          {m.month_phase && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                m.month_phase === 1
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                                  : m.month_phase === 2
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
                                  : m.month_phase === 3
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                                  : 'bg-slate-800 text-amber-300 border border-amber-600/40'
                              }`}
                            >
                              {m.month_phase === 1
                                ? '🌿 Фаза 1 (ЖКТ)'
                                : m.month_phase === 2
                                ? '🧠 Фаза 2 (Нейро)'
                                : m.month_phase === 3
                                ? '🛡 Фаза 3 (Микро)'
                                : '📦 Поддержка'}
                            </span>
                          )}
                        </div>
                        {m.duration_course && (
                          <span className="block text-[10px] text-emerald-400 font-medium mt-0.5">
                            ⏱ Курс: {m.duration_course}
                          </span>
                        )}
                        {m.active_ingredient && (
                          <span className="block text-[11px] text-slate-400 font-normal">
                            {m.active_ingredient}
                          </span>
                        )}
                        {m.why_in_stack && (
                          <span className="block text-[11px] text-cyan-300/90 mt-0.5 line-clamp-1 italic">
                            В стеке: {m.why_in_stack}
                          </span>
                        )}
                        {m.meta_analysis_summary && (
                          <span className="block text-[10px] text-amber-300/80 mt-0.5 line-clamp-1">
                            Мета-анализ: {m.meta_analysis_summary}
                          </span>
                        )}
                        {m.clarification_note && (
                          <span className="block text-[10px] text-rose-400 mt-0.5">
                            ⚠️ {m.clarification_note}
                          </span>
                        )}
                      </td>
                      <td className="py-3 uppercase text-[10px] font-bold text-cyan-400">{m.category}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${badge}`}>{m.status}</span>
                      </td>
                      <td className="py-3 text-slate-300">
                        {m.dose || '—'}
                        {m.schedule && <span className="block text-[11px] text-slate-400">{m.schedule}</span>}
                      </td>
                      <td className="py-3 text-slate-400 max-w-[200px]">
                        <div className="truncate font-mono text-[11px] text-cyan-400">
                          {m.meta_analysis_refs?.join(', ') || m.evidence_refs?.join(', ') || '—'}
                        </div>
                      </td>
                      <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditMedModal(m)}
                          className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-200 transition"
                          title="Редактировать"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {m.status === 'active' && (
                          <button
                            onClick={() => archiveMedication(m.id)}
                            className="p-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-400 transition"
                            title="Перевести в архив"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMedication(m.id)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition"
                          title="Удалить"
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
        </div>
      )}

      {/* 2. WORKOUT PROTOCOL (ГОРМОНАЛЬНЫЙ ЗАПУСК & СНЯТИЕ ЗАСТОЕВ) */}
      {activeOwnerMenu === 'workout' && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🏋️‍♂️</span>
                <h3 className="font-bold text-white text-base">
                  {workoutPhilosophy.title}
                </h3>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Автор: @DonDearOfficina (дипломированный провизор). Регламент: 45–60 минут. Личный опыт, разбор открытых данных.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⏱ Длительность: 45–60 мин
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                🔄 Свободное чередование
              </span>
            </div>
          </div>

          {/* Quick Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80">
              <span className="text-amber-400 text-xs font-bold">1. Старт занятия</span>
              <div className="text-xs text-white font-semibold mt-1">Икры ➔ Приседания (2 подхода в отказ)</div>
              <p className="text-[10px] text-slate-400 mt-1">Запуск периферической венозной помпы голени и приток к малому тазу</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80">
              <span className="text-cyan-400 text-xs font-bold">2. Фулбоди охват</span>
              <div className="text-xs text-white font-semibold mt-1">2 Грудь, 2 Спина, 2 Плечи, 2 Ноги</div>
              <p className="text-[10px] text-slate-400 mt-1">Комплексная проработка всех основных мышечных групп тела</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80">
              <span className="text-pink-400 text-xs font-bold">3. Ягодицы отдельно</span>
              <div className="text-xs text-white font-semibold mt-1">Изолированный тазовый дренаж</div>
              <p className="text-[10px] text-slate-400 mt-1">Снятие венозного стаза простаты и стимуляция кровоснабжения ЖКТ</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80">
              <span className="text-emerald-400 text-xs font-bold">4. Интенсивность</span>
              <div className="text-xs text-white font-semibold mt-1">2 подхода в отказ + ротация</div>
              <p className="text-[10px] text-slate-400 mt-1">Активный отдых между тренажерами и плавная прогрессия весов</p>
            </div>
          </div>

          {/* Philosophy Banner */}
          <div className="bg-amber-950/30 border border-amber-600/30 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Физиологический базис: Почему ликвидация застоев первична</span>
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
              {workoutPhilosophy.core_concept}
            </p>
            <div className="pt-2 border-t border-amber-800/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-amber-200/90 font-medium">
              {workoutPhilosophy.biochemical_markers.map((bm, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-amber-400">✓</span>
                  <span>{bm}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exercises List */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📋</span>
              <span>Структура тренировочного протокола ({workoutExercises.length} упражнений)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {workoutExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2 hover:border-cyan-500/40 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                        {ex.muscle_title}
                      </span>
                      <h5 className="font-bold text-sm text-white mt-0.5">{ex.name}</h5>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                      {ex.sets} • {ex.reps}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    <b>Указания автора:</b> {ex.notes}
                  </p>

                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    <span className="font-semibold text-amber-400">Гормональный механизм: </span>
                    {ex.hormonal_mechanism}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. KNOWLEDGE NOTES & INTEGRATED ISLAMIC MEDICINE (БАЗА ЗНАНИЙ) */}
      {activeOwnerMenu === 'knowledge' && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">База знаний @DonDearOfficina (Раздел 3)</h3>
              <p className="text-slate-400 text-xs">
                Личные экспертные заметки владельца (Нейробиология, Андрология, Фармакология, Биохакинг, Протоколы).
              </p>
            </div>
            <button
              onClick={handleOpenAddRecModal}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Создать заметку</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {knowledgeNotes.map((note) => (
              <div key={note.id} className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                      [{note.topic}]
                    </span>
                    <h4 className="font-bold text-white text-sm">{note.title}</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{note.body}</p>
                <div className="text-[11px] text-cyan-400 font-mono">
                  Источники: {note.evidence_refs.join(' • ')}
                </div>
              </div>
            ))}
          </div>

          {/* Integrated Islamic Medicine Evidence Base */}
          <div className="mt-8 pt-6 border-t border-slate-700/80 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🕌</span>
                <h4 className="font-bold text-white text-sm">
                  Интегрированная база: Исламская медицина (доказательный разбор)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                  В составе Базы знаний
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Традиция как историко-культурный контекст, клиническая ценность — строго по РКИ (уровни A–F) со ссылками на PubMed/OpenFDA.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {islamicRemedies.map((item) => (
                <div key={item.id} className="p-3.5 bg-slate-900 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-white text-xs">
                        {item.name_ru} {item.name_ar && <span className="text-slate-400 font-normal">({item.name_ar})</span>}
                      </h5>
                      <span className="text-[10px] text-emerald-400 font-mono block">{item.name_lat}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-600/40">
                      Уровень: {item.evidence_level}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    <b>Молекулы:</b> {item.active_components}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    <b>РКИ:</b> {item.scientific_evidence}
                  </p>
                  <div className="text-[10px] text-cyan-400 font-mono truncate">
                    PMID: {item.evidence_refs.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. SPECIALISTS VERIFICATION */}
      {activeOwnerMenu === 'specialists' && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 space-y-4">
          <h3 className="font-bold text-white text-base">Белый список и аккредитация специалистов</h3>
          <p className="text-slate-400 text-xs">
            Только одобренные врачи (статус <code>verified</code>) попадают в каталог Раздела 6 и получают доступ к Консоли Специалиста.
          </p>

          <div className="space-y-4 pt-2">
            {specialists.map((s) => (
              <div key={s.id} className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{s.first_name}</h4>
                      <span className="text-xs text-cyan-400">(@{s.username})</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.status === 'verified'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-600/40'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{s.description}</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Специализация: {s.specialization.join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {s.status !== 'verified' && (
                      <button
                        onClick={() => verifySpecialist(s.id, 'verified')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Верифицировать</span>
                      </button>
                    )}
                    {s.status === 'verified' && (
                      <button
                        onClick={() => verifySpecialist(s.id, 'deactivated')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                      >
                        Деактивировать
                      </button>
                    )}
                    <button
                      onClick={() => verifySpecialist(s.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 text-xs font-semibold transition"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>

                {/* Documents List */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Прикрепленные документы:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {s.documents.map((d, dIdx) => (
                      <span
                        key={dIdx}
                        className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] text-slate-300 border border-slate-700"
                      >
                        📄 {d.type} ({d.org}) — <b>{d.status}</b>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. PATIENTS CRM */}
      {activeOwnerMenu === 'patients' && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 space-y-4">
          <h3 className="font-bold text-white text-base">Глобальный CRM пациентов всей системы</h3>
          <p className="text-slate-400 text-xs">
            Суперадмин видит реестр всех пациентов, статус их авторского протокола и прикрепление к врачам.
          </p>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="pb-3 font-semibold">Пациент</th>
                  <th className="pb-3 font-semibold">Telegram ID</th>
                  <th className="pb-3 font-semibold">Курирующий специалист</th>
                  <th className="pb-3 font-semibold">Авторский протокол</th>
                  <th className="pb-3 font-semibold">GDPR Consent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {specialistPatients.map((sp) => {
                  const spec = specialists.find((s) => s.id === sp.specialist_id);
                  return (
                    <tr key={sp.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-medium text-slate-200">
                        {sp.patient_name}
                        {sp.patient_username && (
                          <span className="block text-[11px] text-cyan-400">@{sp.patient_username}</span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-slate-400">{sp.patient_telegram_id || '—'}</td>
                      <td className="py-3 text-slate-300 font-semibold">{spec?.first_name || 'Не назначен'}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-cyan-950 text-cyan-300 border border-cyan-700/40 font-semibold">
                          💎 on_author_protocol=true
                        </span>
                      </td>
                      <td className="py-3 text-emerald-400 font-semibold">
                        ✅ v1.0-GDPR
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SYSTEM STATISTICS */}
      {activeOwnerMenu === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700">
              <span className="text-xs text-slate-400">Всего позиций в протоколе</span>
              <div className="text-2xl font-bold text-cyan-400 mt-1">{medications.length}</div>
              <p className="text-[11px] text-slate-500 mt-1">ЖКТ: 4 | Нейро: 14 | БАД: 15</p>
            </div>
            <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700">
              <span className="text-xs text-slate-400">Аккредитованных врачей</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {specialists.filter((s) => s.status === 'verified').length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Гос. дипломы верифицированы</p>
            </div>
            <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700">
              <span className="text-xs text-slate-400">Приверженность протоколу</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">87.5%</div>
              <p className="text-[11px] text-slate-500 mt-1">Доля пользователей с активным флагом</p>
            </div>
            <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700">
              <span className="text-xs text-slate-400">Записей в Append-only аудите</span>
              <div className="text-2xl font-bold text-indigo-400 mt-1">{auditLogs.length}</div>
              <p className="text-[11px] text-slate-500 mt-1">Триггер защищает от UPDATE/DELETE</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. BROADCAST */}
      {activeOwnerMenu === 'broadcast' && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 max-w-2xl space-y-4">
          <h3 className="font-bold text-white text-base">Массовая рассылка по пользователям бота</h3>
          <p className="text-slate-400 text-xs">
            Ограничение Telegram API: скорость рассылки строго <b>≤ 30 сообщений/сек</b>.
            Сообщения доставляются только пользователям, не заблокировавшим бота.
          </p>

          <form onSubmit={handleStartBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Текст уведомления / новый модуль протокола:
              </label>
              <textarea
                rows={5}
                required
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Здравствуйте! Эксперт @DonDearOfficina обновил раздел БАД: добавлены новые результаты мета-анализа по железу..."
                className="w-full bg-slate-900 text-slate-100 text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {broadcastProgress && (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-cyan-400 font-semibold">
                    {broadcastProgress.isSending ? 'Идет отправка (Rate Limit ≤ 30/s)...' : 'Рассылка завершена!'}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {broadcastProgress.sent} / {broadcastProgress.total} сообщений
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(broadcastProgress.sent / broadcastProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={broadcastProgress?.isSending}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              <span>Запустить контролируемую рассылку</span>
            </button>
          </form>
        </div>
      )}

      {/* 7. APPEND-ONLY AUDIT LOG */}
      {activeOwnerMenu === 'audit' && (
        <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Неизменяемый журнал аудита (Append-Only)</h3>
              <p className="text-slate-400 text-xs">
                Триггер PostgreSQL <code>trg_audit_immutable</code> блокирует любые модификации (UPDATE/DELETE).
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono bg-slate-900 text-slate-300 border border-slate-700">
              Записей: {auditLogs.length}
            </span>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="pb-2.5 font-semibold">Время (UTC)</th>
                  <th className="pb-2.5 font-semibold">Инициатор (Actor)</th>
                  <th className="pb-2.5 font-semibold">Действие (Action)</th>
                  <th className="pb-2.5 font-semibold">Тип объекта</th>
                  <th className="pb-2.5 font-semibold">Изменения (Payload)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-2.5 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 text-slate-200">
                      {log.actor_name || 'System'}
                      <span className="text-slate-500 text-[10px] block">[{log.actor_role}]</span>
                    </td>
                    <td className="py-2.5 text-cyan-400 font-bold">{log.action}</td>
                    <td className="py-2.5 text-slate-300">{log.target_type}</td>
                    <td className="py-2.5 text-slate-400 text-[11px] max-w-xs truncate">
                      {JSON.stringify(log.payload_after || log.payload_before || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT MEDICATION */}
      {isMedModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-white text-base">
                {editingMedId ? 'Редактировать препарат' : 'Добавить препарат в базу @DonDearOfficina'}
              </h4>
              <button
                onClick={() => setIsMedModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMedication} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Торговое название:</label>
                  <input
                    type="text"
                    required
                    value={medFormName}
                    onChange={(e) => setMedFormName(e.target.value)}
                    placeholder="Хофитол, Фенотропил..."
                    className="w-full bg-slate-800 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Действующее вещество:</label>
                  <input
                    type="text"
                    value={medFormIngredient}
                    onChange={(e) => setMedFormIngredient(e.target.value)}
                    placeholder="Холина альфосцерат, Цинк..."
                    className="w-full bg-slate-800 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Категория пирамиды:</label>
                  <select
                    value={medFormCategory}
                    onChange={(e) => setMedFormCategory(e.target.value as MedCategory)}
                    className="w-full bg-slate-800 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="gastro">ЖКТ-фундамент</option>
                    <option value="neuroboost">Нейробуст</option>
                    <option value="supplement">БАД-поддержка</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Статус:</label>
                  <select
                    value={medFormStatus}
                    onChange={(e) => setMedFormStatus(e.target.value as MedStatus)}
                    className="w-full bg-slate-800 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="active">Active (В активном протоколе)</option>
                    <option value="archive">Archive (В архиве)</option>
                    <option value="needs_clarification">Needs Clarification (Только эксперту)</option>
                    <option value="pending">Pending (Ожидает начала)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Дозировка:</label>
                  <input
                    type="text"
                    value={medFormDose}
                    onChange={(e) => setMedFormDose(e.target.value)}
                    placeholder="400 мг, 1 мерная ложка..."
                    className="w-full bg-slate-800 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Режим и время приема:</label>
                  <input
                    type="text"
                    value={medFormSchedule}
                    onChange={(e) => setMedFormSchedule(e.target.value)}
                    placeholder="Утром натощак, за 30 мин до еды..."
                    className="w-full bg-slate-800 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Клиническое обоснование роли:</label>
                <textarea
                  rows={2}
                  value={medFormNotes}
                  onChange={(e) => setMedFormNotes(e.target.value)}
                  placeholder="Биохимический механизм действия, рецепторы, цель..."
                  className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Источники доказательности (PMID / DOI):</label>
                <input
                  type="text"
                  value={medFormRefs}
                  onChange={(e) => setMedFormRefs(e.target.value)}
                  placeholder="PMID: 12637119, PMID: 21626398"
                  className="w-full bg-slate-800 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {medFormStatus === 'needs_clarification' && (
                <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-700/50">
                  <label className="block font-semibold text-rose-300 mb-1">
                    Что именно требует уточнения (clarification_note):
                  </label>
                  <input
                    type="text"
                    value={medFormClarification}
                    onChange={(e) => setMedFormClarification(e.target.value)}
                    placeholder="Не включать в active до уточнения состава..."
                    className="w-full bg-slate-900 text-rose-200 px-3 py-1.5 rounded-lg border border-rose-800"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMedModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Сохранить препарат
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT RECOMMENDATION */}
      {isRecModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-white text-base">
                {editingRecId ? 'Редактировать заметку' : 'Создать заметку для Раздела 7'}
              </h4>
              <button
                onClick={() => setIsRecModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRec} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Заголовок статьи:</label>
                <input
                  type="text"
                  required
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  placeholder="Архитектура трех уровней..."
                  className="w-full bg-slate-800 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Текст публикации:</label>
                <textarea
                  rows={6}
                  required
                  value={recBody}
                  onChange={(e) => setRecBody(e.target.value)}
                  placeholder="Текст разбора с биохимическими принципами..."
                  className="w-full bg-slate-800 text-slate-100 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ссылки на литературу (PMID / DOI):</label>
                <input
                  type="text"
                  value={recRefs}
                  onChange={(e) => setRecRefs(e.target.value)}
                  placeholder="PMID: 12637119, PMID: 23688172"
                  className="w-full bg-slate-800 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Опубликовать в боте
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
