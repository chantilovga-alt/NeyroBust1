import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Medication,
  User,
  Specialist,
  SpecialistPatient,
  Invite,
  Recommendation,
  AuditLogEntry,
  IslamicRemedy,
  KnowledgeNote,
  AssistantQueryRecord,
  UserRole,
  FunnelChannel,
  FunnelStage,
  FunnelTrigger,
  FunnelLead,
  WorkoutExercise,
} from '../types';
import { INITIAL_MEDICATIONS } from '../data/seedMedications';
import {
  INITIAL_USERS,
  INITIAL_SPECIALISTS,
  INITIAL_SPECIALIST_PATIENTS,
  INITIAL_RECOMMENDATIONS,
  INITIAL_AUDIT_LOG,
} from '../data/seedData';
import { INITIAL_ISLAMIC_REMEDIES } from '../data/seedIslamicRemedies';
import { INITIAL_KNOWLEDGE_NOTES } from '../data/seedKnowledgeNotes';
import { INITIAL_WORKOUT_EXERCISES, WORKOUT_PHILOSOPHY } from '../data/seedWorkout';
import {
  INITIAL_FUNNEL_STAGES,
  INITIAL_FUNNEL_TRIGGERS,
  INITIAL_FUNNEL_LEADS,
} from '../data/seedFunnels';
import { DRUG_INTERACTIONS_MATRIX, RED_FLAGS_KEYWORDS } from '../data/scientificRefs';

interface AppContextType {
  // Navigation
  activeTab: 'bot' | 'miniapp' | 'specialist_console' | 'owner_console' | 'codebase' | 'architecture';
  setActiveTab: (tab: 'bot' | 'miniapp' | 'specialist_console' | 'owner_console' | 'codebase' | 'architecture') => void;

  // Active persona
  currentUser: User;
  switchUser: (role: UserRole) => void;

  // Medications CRUD & Status
  medications: Medication[];
  addMedication: (med: Omit<Medication, 'id' | 'created_at' | 'updated_at'>) => void;
  updateMedication: (id: number, updates: Partial<Medication>) => void;
  archiveMedication: (id: number, notes?: string) => void;
  deleteMedication: (id: number) => void;

  // Islamic Medicine DB & CRUD
  islamicRemedies: IslamicRemedy[];
  addIslamicRemedy: (remedy: Omit<IslamicRemedy, 'id' | 'created_at' | 'updated_at'>) => void;
  updateIslamicRemedy: (id: number, updates: Partial<IslamicRemedy>) => void;
  deleteIslamicRemedy: (id: number) => void;

  // Knowledge Base & Notes CRUD
  knowledgeNotes: KnowledgeNote[];
  addKnowledgeNote: (note: Omit<KnowledgeNote, 'id' | 'created_at' | 'updated_at'>) => void;
  updateKnowledgeNote: (id: number, updates: Partial<KnowledgeNote>) => void;
  deleteKnowledgeNote: (id: number) => void;

  // Workout System (Hormone activation & Stasis release)
  workoutExercises: WorkoutExercise[];
  workoutPhilosophy: typeof WORKOUT_PHILOSOPHY;
  toggleWorkoutExercise: (id: string) => void;

  // AI Super-Assistant & Copyable Summary
  lastAssistantSummary: string;
  setLastAssistantSummary: (summary: string) => void;
  queryAssistant: (question: string) => Promise<{ answer: string; isRedFlag: boolean; summary: string }>;

  // User Profile & Protocol
  toggleAuthorProtocol: () => void;
  updateUserProfile: (profile: Partial<User['profile']>) => void;
  revokeConsent: () => void;
  grantConsent: () => void;

  // Specialists & Moderation
  specialists: Specialist[];
  verifySpecialist: (specialistId: number, status: 'verified' | 'rejected' | 'deactivated') => void;
  updateSpecialistProfile: (specialistId: number, updates: Partial<Specialist>) => void;

  // Invites & Specialist Patients
  specialistPatients: SpecialistPatient[];
  invites: Invite[];
  generateInvite: (specialistId: number, maxUses?: number, ttlHours?: number) => { rawToken: string; deepLink: string };
  consumeInvite: (rawToken: string) => { success: boolean; message: string };
  addPatientManual: (specialistId: number, telegramId: number, notes?: string) => { success: boolean; message: string };
  removePatient: (specialistPatientId: number) => void;

  // Recommendations
  recommendations: Recommendation[];
  addRecommendation: (rec: Omit<Recommendation, 'id' | 'created_at' | 'updated_at'>) => void;
  updateRecommendation: (id: number, updates: Partial<Recommendation>) => void;
  deleteRecommendation: (id: number) => void;

  // Audit Log
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'created_at'>) => void;

  // Safety & Interactions
  checkRedFlags: (text: string) => boolean;
  checkDrugInteractions: (substanceName: string) => any[];

  // Broadcast
  runBroadcast: (messageText: string) => Promise<{ sent: number; total: number }>;

  // Marketing & Lead Funnels (Instagram & Telegram)
  funnelStages: FunnelStage[];
  funnelTriggers: FunnelTrigger[];
  funnelLeads: FunnelLead[];
  triggerFunnel: (
    channel: FunnelChannel,
    keyword: string,
    username: string,
    fullName?: string
  ) => { success: boolean; lead: FunnelLead; message: string; stage?: FunnelStage };
  advanceFunnelStep: (leadId: number) => void;
  updateFunnelTrigger: (id: number, updates: Partial<FunnelTrigger>) => void;
  toggleFunnelTrigger: (id: number) => void;
  updateFunnelStage: (id: string, updates: Partial<FunnelStage>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'bot' | 'miniapp' | 'specialist_console' | 'owner_console' | 'codebase' | 'architecture'>('bot');
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState<number>(4); // Default to Alex (Patient)

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const [medications, setMedications] = useState<Medication[]>(INITIAL_MEDICATIONS);
  const [islamicRemedies, setIslamicRemedies] = useState<IslamicRemedy[]>(INITIAL_ISLAMIC_REMEDIES);
  const [knowledgeNotes, setKnowledgeNotes] = useState<KnowledgeNote[]>(INITIAL_KNOWLEDGE_NOTES);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(INITIAL_WORKOUT_EXERCISES);
  const [specialists, setSpecialists] = useState<Specialist[]>(INITIAL_SPECIALISTS);
  const [specialistPatients, setSpecialistPatients] = useState<SpecialistPatient[]>(INITIAL_SPECIALIST_PATIENTS);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(INITIAL_RECOMMENDATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOG);
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>(INITIAL_FUNNEL_STAGES);
  const [funnelTriggers, setFunnelTriggers] = useState<FunnelTrigger[]>(INITIAL_FUNNEL_TRIGGERS);
  const [funnelLeads, setFunnelLeads] = useState<FunnelLead[]>(INITIAL_FUNNEL_LEADS);
  const [lastAssistantSummary, setLastAssistantSummary] = useState<string>(
    'Разбор состояния: тканевая гипоксия, дефицит ферритина для тирозингидроксилазы. Рекомендовано проверить депо железа и работу ЖКТ.'
  );

  const switchUser = (role: UserRole) => {
    const target = users.find((u) => u.role === role);
    if (target) {
      setCurrentUserId(target.id);
      if (role === 'owner') {
        setActiveTab('owner_console');
      } else if (role === 'specialist') {
        setActiveTab('specialist_console');
      } else {
        setActiveTab('bot');
      }
    }
  };

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'created_at'>) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Medications CRUD
  const addMedication = (med: Omit<Medication, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newMed: Medication = {
      ...med,
      id: Date.now(),
      created_at: now,
      updated_at: now,
    };
    setMedications((prev) => [newMed, ...prev]);
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'med_create',
      target_type: 'medication',
      target_id: newMed.id,
      payload_after: newMed,
    });
  };

  const updateMedication = (id: number, updates: Partial<Medication>) => {
    const oldMed = medications.find((m) => m.id === id);
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m))
    );
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'med_update',
      target_type: 'medication',
      target_id: id,
      payload_before: oldMed,
      payload_after: updates,
    });
  };

  const archiveMedication = (id: number, notes?: string) => {
    const oldMed = medications.find((m) => m.id === id);
    const now = new Date().toISOString();
    setMedications((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'archive',
              archived_at: now,
              notes: notes || m.notes,
              updated_at: now,
            }
          : m
      )
    );
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'med_archive',
      target_type: 'medication',
      target_id: id,
      payload_before: oldMed,
      payload_after: { status: 'archive', archived_at: now },
    });
  };

  const deleteMedication = (id: number) => {
    const oldMed = medications.find((m) => m.id === id);
    setMedications((prev) => prev.filter((m) => m.id !== id));
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'med_delete',
      target_type: 'medication',
      target_id: id,
      payload_before: oldMed,
    });
  };

  // Islamic Remedies CRUD
  const addIslamicRemedy = (remedy: Omit<IslamicRemedy, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newRemedy: IslamicRemedy = {
      ...remedy,
      id: Date.now(),
      created_at: now,
      updated_at: now,
    };
    setIslamicRemedies((prev) => [newRemedy, ...prev]);
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'islamic_create',
      target_type: 'islamic_remedy',
      target_id: newRemedy.id,
      payload_after: newRemedy,
    });
  };

  const updateIslamicRemedy = (id: number, updates: Partial<IslamicRemedy>) => {
    const oldItem = islamicRemedies.find((r) => r.id === id);
    setIslamicRemedies((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r))
    );
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'islamic_update',
      target_type: 'islamic_remedy',
      target_id: id,
      payload_before: oldItem,
      payload_after: updates,
    });
  };

  const deleteIslamicRemedy = (id: number) => {
    const oldItem = islamicRemedies.find((r) => r.id === id);
    setIslamicRemedies((prev) => prev.filter((r) => r.id !== id));
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'islamic_delete',
      target_type: 'islamic_remedy',
      target_id: id,
      payload_before: oldItem,
    });
  };

  // Knowledge Notes CRUD
  const addKnowledgeNote = (note: Omit<KnowledgeNote, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newNote: KnowledgeNote = {
      ...note,
      id: Date.now(),
      created_at: now,
      updated_at: now,
    };
    setKnowledgeNotes((prev) => [newNote, ...prev]);
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: '@DonDearOfficina',
      actor_role: 'owner',
      action: 'knowledge_create',
      target_type: 'knowledge_note',
      target_id: newNote.id,
      payload_after: newNote,
    });
  };

  const updateKnowledgeNote = (id: number, updates: Partial<KnowledgeNote>) => {
    const oldNote = knowledgeNotes.find((n) => n.id === id);
    setKnowledgeNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n))
    );
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: '@DonDearOfficina',
      actor_role: 'owner',
      action: 'knowledge_update',
      target_type: 'knowledge_note',
      target_id: id,
      payload_before: oldNote,
      payload_after: updates,
    });
  };

  const deleteKnowledgeNote = (id: number) => {
    const oldNote = knowledgeNotes.find((n) => n.id === id);
    setKnowledgeNotes((prev) => prev.filter((n) => n.id !== id));
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: '@DonDearOfficina',
      actor_role: 'owner',
      action: 'knowledge_delete',
      target_type: 'knowledge_note',
      target_id: id,
      payload_before: oldNote,
    });
  };

  const toggleWorkoutExercise = (id: string) => {
    setWorkoutExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, is_completed: !ex.is_completed } : ex))
    );
  };

  // Query AI Super-Assistant (via Server API or Client Fallback)
  const queryAssistant = async (question: string) => {
    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userProfile: currentUser.profile,
          onAuthorProtocol: currentUser.on_author_protocol,
          contextData: {
            medications: medications.filter((m) => m.status === 'active'),
            knowledgeNotes: knowledgeNotes.slice(0, 3),
            islamicRemedies: islamicRemedies.slice(0, 3),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.summary) {
        setLastAssistantSummary(data.summary);
      }
      return data;
    } catch (err) {
      console.warn('API route call error, invoking local scientific fallback:', err);
      // Local robust scientific fallback
      const lower = question.toLowerCase();
      const isRedFlag = RED_FLAGS_KEYWORDS.some((rf) => lower.includes(rf));

      if (isRedFlag) {
        return {
          answer:
            '🚨 <b>Это может быть неотложное состояние. Немедленно вызовите скорую (103/112).</b>\n\n' +
            'Автоматический анализ прекращен в целях вашей безопасности.',
          isRedFlag: true,
          summary: 'Критический симптом. Вызов скорой помощи.',
        };
      }

      const fallbackText =
        '📋 Кратко: Ваш запрос проанализирован через каскадную модель @DonDearOfficina: 1. ЖКТ и всасывание ➔ 2. нейромедиаторный пул ➔ 3. микронутриентная страховка.\n\n' +
        '🔍 Возможные причины:\n' +
        '• Тканевая гипоксия и латентный дефицит ферритина (< 50 мкг/л) — лимитирует синтез дофамина — PMID:23688172\n' +
        '• Нарушение эмульгации липидов из-за замедленного желчеоттока — PMID:27385377\n\n' +
        '💡 Что можно обсудить с врачом:\n' +
        '• Проверить лабораторную панель: ферритин, гомоцистеин, ТТГ, УЗИ ОБП — уровень A — PMID:30611908\n' +
        '• Креатин моногидрат 5 г/сут утром — энергетический буфер синапсов — уровень A — PMID:30137909\n\n' +
        (currentUser.on_author_protocol
          ? '⚠️ Взаимодействия с вашим стеком: Разносите прием препаратов железа (Ферлатум) и цинка на 3–4 часа (DMT-1 конкуренция)!\n'
          : '') +
        '⚠️ Ограничения: Точные причины требуют интерпретации объективных анализов крови.\n\n' +
        'Это не медицинская рекомендация. Проконсультируйтесь с врачом.\n\n' +
        '[📩 Обсудить с @DonDearOfficina]';

      setLastAssistantSummary(fallbackText.slice(0, 160) + '...');
      return {
        answer: fallbackText,
        isRedFlag: false,
        summary: fallbackText.slice(0, 160) + '...',
      };
    }
  };

  const toggleAuthorProtocol = () => {
    const nextState = !currentUser.on_author_protocol;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, on_author_protocol: nextState } : u))
    );
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'profile_update',
      target_type: 'user',
      target_id: currentUser.id,
      payload_after: { on_author_protocol: nextState },
    });
  };

  const updateUserProfile = (profileUpdates: Partial<User['profile']>) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              profile: { ...u.profile, ...profileUpdates },
              updated_at: new Date().toISOString(),
            }
          : u
      )
    );
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'profile_update',
      target_type: 'user',
      target_id: currentUser.id,
      payload_after: profileUpdates,
    });
  };

  const grantConsent = () => {
    const now = new Date().toISOString();
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? { ...u, consent_granted_at: now, consent_version: 'v1.0-GDPR' }
          : u
      )
    );
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'consent_grant',
      target_type: 'user',
      target_id: currentUser.id,
      payload_after: { consent_version: 'v1.0-GDPR', granted_at: now },
    });
  };

  const revokeConsent = () => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? { ...u, consent_granted_at: null, consent_version: null }
          : u
      )
    );
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'consent_revoke',
      target_type: 'user',
      target_id: currentUser.id,
    });
  };

  const verifySpecialist = (specialistId: number, status: 'verified' | 'rejected' | 'deactivated') => {
    setSpecialists((prev) =>
      prev.map((s) =>
        s.id === specialistId
          ? {
              ...s,
              status,
              verified_by: 1,
              verified_at: new Date().toISOString(),
            }
          : s
      )
    );
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: '@DonDearOfficina',
      actor_role: 'owner',
      action: status === 'verified' ? 'specialist_verify' : 'specialist_reject',
      target_type: 'specialist',
      target_id: specialistId,
      payload_after: { status },
    });
  };

  const updateSpecialistProfile = (specialistId: number, updates: Partial<Specialist>) => {
    setSpecialists((prev) =>
      prev.map((s) => (s.id === specialistId ? { ...s, ...updates } : s))
    );
  };

  const generateInvite = (specialistId: number, maxUses = 1, ttlHours = 24) => {
    const rawToken = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const tokenHash = 'sha256_' + rawToken.slice(0, 32);
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

    const newInvite: Invite = {
      id: Date.now(),
      raw_token: rawToken,
      token_hash: tokenHash,
      specialist_id: specialistId,
      created_by: currentUser.id,
      status: 'active',
      max_uses: maxUses,
      used_count: 0,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    setInvites((prev) => [newInvite, ...prev]);

    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'patient_invite',
      target_type: 'invite',
      target_id: newInvite.id,
      payload_after: { specialist_id: specialistId, max_uses: maxUses, expires_at: expiresAt },
    });

    const deepLink = `https://t.me/DonDearOfficinaAI?start=inv_${rawToken}`;
    return { rawToken, deepLink };
  };

  const consumeInvite = (rawToken: string) => {
    const invite = invites.find((i) => i.raw_token === rawToken || rawToken.includes(i.raw_token || ''));
    if (!invite || invite.status !== 'active') {
      return { success: false, message: 'Инвайт-ссылка недействительна или уже использована.' };
    }
    if (new Date(invite.expires_at) < new Date()) {
      return { success: false, message: 'Срок действия инвайт-ссылки истёк (TTL 24 ч).' };
    }
    if (invite.used_count >= invite.max_uses) {
      return { success: false, message: 'Лимит использований ссылки исчерпан.' };
    }

    const existing = specialistPatients.find(
      (sp) => sp.specialist_id === invite.specialist_id && sp.patient_id === currentUser.id
    );

    if (existing) {
      setSpecialistPatients((prev) =>
        prev.map((sp) => (sp.id === existing.id ? { ...sp, status: 'active', removed_at: undefined } : sp))
      );
    } else {
      const newSp: SpecialistPatient = {
        id: Date.now(),
        specialist_id: invite.specialist_id,
        patient_id: currentUser.id,
        patient_name: currentUser.first_name,
        patient_username: currentUser.username,
        patient_telegram_id: currentUser.telegram_id,
        status: 'active',
        invited_by: invite.created_by,
        invite_id: invite.id,
        added_via: 'invite',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSpecialistPatients((prev) => [newSp, ...prev]);
    }

    setInvites((prev) =>
      prev.map((i) =>
        i.id === invite.id
          ? {
              ...i,
              used_count: i.used_count + 1,
              status: i.used_count + 1 >= i.max_uses ? 'used' : 'active',
              used_at: new Date().toISOString(),
            }
          : i
      )
    );

    return { success: true, message: 'Вы успешно привязаны к вашему специалисту!' };
  };

  const addPatientManual = (specialistId: number, telegramId: number, notes?: string) => {
    const patientUser = users.find((u) => u.telegram_id === telegramId);
    if (!patientUser) {
      return {
        success: false,
        message: 'Пользователь с таким Telegram ID не найден в системе. Сначала он должен запустить бота (/start).',
      };
    }

    const existing = specialistPatients.find(
      (sp) => sp.specialist_id === specialistId && sp.patient_id === patientUser.id
    );
    if (existing && existing.status === 'active') {
      return { success: false, message: 'Пациент уже прикреплен к вашему списку.' };
    }

    const newSp: SpecialistPatient = {
      id: Date.now(),
      specialist_id: specialistId,
      patient_id: patientUser.id,
      patient_name: patientUser.first_name,
      patient_username: patientUser.username,
      patient_telegram_id: patientUser.telegram_id,
      status: 'active',
      invited_by: currentUser.id,
      added_via: 'manual',
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSpecialistPatients((prev) => [newSp, ...prev]);

    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'patient_add',
      target_type: 'specialist_patient',
      target_id: newSp.id,
      payload_after: { specialist_id: specialistId, patient_id: patientUser.id, method: 'manual' },
    });

    return { success: true, message: `Пациент ${patientUser.first_name} успешно добавлен!` };
  };

  const removePatient = (specialistPatientId: number) => {
    const sp = specialistPatients.find((item) => item.id === specialistPatientId);
    if (!sp) return;
    const now = new Date().toISOString();
    setSpecialistPatients((prev) =>
      prev.map((item) => (item.id === specialistPatientId ? { ...item, status: 'removed', removed_at: now } : item))
    );
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.username ? `@${currentUser.username}` : currentUser.first_name,
      actor_role: currentUser.role,
      action: 'patient_remove',
      target_type: 'specialist_patient',
      target_id: specialistPatientId,
      payload_after: { status: 'removed', removed_at: now },
    });
  };

  // Recommendations CRUD
  const addRecommendation = (rec: Omit<Recommendation, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newRec: Recommendation = {
      ...rec,
      id: Date.now(),
      created_at: now,
      updated_at: now,
    };
    setRecommendations((prev) => [newRec, ...prev]);
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: '@DonDearOfficina',
      actor_role: 'owner',
      action: 'recommendation_create',
      target_type: 'recommendation',
      target_id: newRec.id,
      payload_after: newRec,
    });
  };

  const updateRecommendation = (id: number, updates: Partial<Recommendation>) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r))
    );
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: '@DonDearOfficina',
      actor_role: 'owner',
      action: 'recommendation_update',
      target_type: 'recommendation',
      target_id: id,
      payload_after: updates,
    });
  };

  const deleteRecommendation = (id: number) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: '@DonDearOfficina',
      actor_role: 'owner',
      action: 'recommendation_delete',
      target_type: 'recommendation',
      target_id: id,
    });
  };

  const checkRedFlags = (text: string): boolean => {
    const lower = text.toLowerCase();
    return RED_FLAGS_KEYWORDS.some((flag) => lower.includes(flag));
  };

  const checkDrugInteractions = (substanceName: string) => {
    const lower = substanceName.toLowerCase();
    return DRUG_INTERACTIONS_MATRIX.filter(
      (di) => di.pair[0].toLowerCase().includes(lower) || di.pair[1].toLowerCase().includes(lower)
    );
  };

  const runBroadcast = async (messageText: string) => {
    const recipients = users.filter((u) => u.has_started_bot && !u.blocked_bot);
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: '@DonDearOfficina',
      actor_role: 'owner',
      action: 'broadcast_send',
      target_type: 'broadcast',
      payload_after: { recipient_count: recipients.length, text_preview: messageText.slice(0, 100) },
    });
    return { sent: recipients.length, total: users.length };
  };

  // Funnel Handlers (Instagram Direct & Telegram)
  const triggerFunnel = (
    channel: FunnelChannel,
    keyword: string,
    username: string,
    fullName: string = ''
  ) => {
    const cleanKw = keyword.trim().toUpperCase();
    const matchedTrigger =
      funnelTriggers.find(
        (t) =>
          t.is_active &&
          t.keyword.toUpperCase() === cleanKw &&
          (t.channel === channel || t.channel === 'omnichannel' || channel === 'omnichannel')
      ) ||
      funnelTriggers.find((t) => t.is_active && t.keyword.toUpperCase() === cleanKw) ||
      funnelTriggers[0];

    const stage1 = funnelStages.find((s) => s.step_number === 1) || funnelStages[0];
    const cleanUser = username.replace(/^@/, '');
    const existingIndex = funnelLeads.findIndex((l) => l.username.toLowerCase() === cleanUser.toLowerCase());

    let lead: FunnelLead;
    if (existingIndex >= 0) {
      lead = {
        ...funnelLeads[existingIndex],
        current_step: 1,
        trigger_keyword: matchedTrigger.keyword,
        last_message_at: new Date().toISOString(),
      };
      setFunnelLeads((prev) => prev.map((l, i) => (i === existingIndex ? lead : l)));
    } else {
      lead = {
        id: Date.now(),
        channel,
        username: cleanUser,
        full_name: fullName || `@${cleanUser}`,
        trigger_keyword: matchedTrigger.keyword,
        current_step: 1,
        status: 'active',
        telegram_connected: channel === 'telegram',
        started_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      };
      setFunnelLeads((prev) => [lead, ...prev]);
    }

    setFunnelTriggers((prev) =>
      prev.map((t) => (t.id === matchedTrigger.id ? { ...t, total_leads: t.total_leads + 1 } : t))
    );

    addAuditLog({
      actor_id: currentUser.id,
      actor_name: `@${cleanUser}`,
      actor_role: 'user',
      action: 'funnel_trigger',
      target_type: 'funnel_lead',
      target_id: lead.id,
      payload_after: { keyword: matchedTrigger.keyword, channel, stage: stage1.name },
    });

    return {
      success: true,
      lead,
      message: stage1.body,
      stage: stage1,
    };
  };

  const advanceFunnelStep = (leadId: number) => {
    setFunnelLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l;
        const nextStep = Math.min(l.current_step + 1, 4);
        const isConverted = nextStep === 4;
        return {
          ...l,
          current_step: nextStep,
          status: isConverted ? 'converted' : l.status,
          telegram_connected: nextStep >= 2 ? true : l.telegram_connected,
          last_message_at: new Date().toISOString(),
        };
      })
    );
  };

  const updateFunnelTrigger = (id: number, updates: Partial<FunnelTrigger>) => {
    setFunnelTriggers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const toggleFunnelTrigger = (id: number) => {
    setFunnelTriggers((prev) => prev.map((t) => (t.id === id ? { ...t, is_active: !t.is_active } : t)));
  };

  const updateFunnelStage = (id: string, updates: Partial<FunnelStage>) => {
    setFunnelStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        switchUser,
        medications,
        addMedication,
        updateMedication,
        archiveMedication,
        deleteMedication,
        islamicRemedies,
        addIslamicRemedy,
        updateIslamicRemedy,
        deleteIslamicRemedy,
        knowledgeNotes,
        addKnowledgeNote,
        updateKnowledgeNote,
        deleteKnowledgeNote,
        workoutExercises,
        workoutPhilosophy: WORKOUT_PHILOSOPHY,
        toggleWorkoutExercise,
        lastAssistantSummary,
        setLastAssistantSummary,
        queryAssistant,
        toggleAuthorProtocol,
        updateUserProfile,
        grantConsent,
        revokeConsent,
        specialists,
        verifySpecialist,
        updateSpecialistProfile,
        specialistPatients,
        invites,
        generateInvite,
        consumeInvite,
        addPatientManual,
        removePatient,
        recommendations,
        addRecommendation,
        updateRecommendation,
        deleteRecommendation,
        auditLogs,
        addAuditLog,
        checkRedFlags,
        checkDrugInteractions,
        runBroadcast,
        funnelStages,
        funnelTriggers,
        funnelLeads,
        triggerFunnel,
        advanceFunnelStep,
        updateFunnelTrigger,
        toggleFunnelTrigger,
        updateFunnelStage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
