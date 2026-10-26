export type MedCategory = 'gastro' | 'neuroboost' | 'supplement';
export type MedStatus = 'active' | 'archive' | 'pending' | 'needs_clarification';
export type MedSource = 'author' | 'external';
export type PatientLinkStatus = 'invited' | 'active' | 'removed';
export type InviteStatus = 'active' | 'used' | 'expired' | 'revoked';
export type UserRole = 'user' | 'specialist' | 'owner';

export type EvidenceGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'none';

export type FunnelChannel = 'instagram' | 'telegram' | 'omnichannel';

export type AuditAction =
  | 'med_create'
  | 'med_update'
  | 'med_archive'
  | 'med_delete'
  | 'patient_invite'
  | 'patient_add'
  | 'patient_remove'
  | 'patient_message'
  | 'specialist_verify'
  | 'specialist_reject'
  | 'specialist_deactivate'
  | 'recommendation_create'
  | 'recommendation_update'
  | 'recommendation_delete'
  | 'knowledge_create'
  | 'knowledge_update'
  | 'knowledge_delete'
  | 'islamic_create'
  | 'islamic_update'
  | 'islamic_delete'
  | 'funnel_trigger'
  | 'funnel_step_send'
  | 'funnel_convert'
  | 'profile_update'
  | 'consent_grant'
  | 'consent_revoke'
  | 'broadcast_send'
  | 'login'
  | 'login_failed';

export interface FunnelStage {
  id: string;
  step_number: number;
  name: string;
  delay_label: string;
  title: string;
  body: string;
  lead_magnet_name?: string;
  lead_magnet_url?: string;
  cta_text: string;
  cta_link?: string;
}

export interface FunnelTrigger {
  id: number;
  keyword: string;
  channel: FunnelChannel;
  campaign_name: string;
  lead_magnet_title: string;
  lead_magnet_desc: string;
  is_active: boolean;
  total_leads: number;
  conversions: number;
}

export interface FunnelLead {
  id: number;
  channel: FunnelChannel;
  username: string;
  full_name: string;
  trigger_keyword: string;
  current_step: number;
  status: 'active' | 'completed' | 'converted';
  telegram_connected: boolean;
  telegram_id?: number;
  started_at: string;
  last_message_at: string;
}

export interface UserProfile {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  allergies?: string[];
  chronicDiseases?: string[];
  isPregnant?: boolean;
}

export interface User {
  id: number;
  telegram_id: number;
  username: string;
  first_name: string;
  role: UserRole;
  has_started_bot: boolean;
  blocked_bot: boolean;
  on_author_protocol: boolean;
  profile: UserProfile;
  consent_granted_at: string | null;
  consent_version: string | null;
  created_at: string;
  updated_at: string;
}

export type LegalCategoryRF = 'medicine' | 'vitamin_mineral' | 'supplement';

export interface Medication {
  id: number;
  owner_id: number;
  name: string;
  active_ingredient?: string;
  category: MedCategory;
  legal_category_rf?: LegalCategoryRF; // Законодательство РФ: Лекарственный препарат, Витамины/Минералы, БАД
  status: MedStatus;
  source: MedSource;
  dose?: string;
  schedule?: string;
  duration_course?: string; // Регламент курса: 2 месяца, 6-12 месяцев, 14-30 дней
  month_phase?: 1 | 2 | 3 | 4; // 1 = 1-й месяц: ЖКТ; 2 = Нейробуст старт; 3 = Микронутриенты & продолжение нейробуста; 4 = Раздел Поддержка
  start_date?: string;
  end_date?: string;
  actual_days?: number;
  missed_days?: number;
  notes?: string;
  why_in_stack?: string; // Личное объяснение автора: зачем и почему в стеке
  meta_analysis_summary?: string; // Объяснение и доказательная информация о метаанализах
  meta_analysis_refs?: string[]; // Ссылки на метаанализы (PMID/DOI)
  evidence_refs?: string[];
  clarification_note?: string;
  // 7 структурированных подразделов:
  purpose?: string; // 2. Для чего используется
  when_considered?: string; // 3. Когда рассматривается применение
  instruction_usage?: string; // 4. Как принимать по инструкции (производитель)
  personal_experience?: string; // 5. Личный опыт автора
  precautions?: string; // 6. Ограничения и предостережения
  relation_to_main_course?: string; // 7. Связь с основным курсом
  is_main_course?: boolean; // Входит ли в основной 4-месячный авторский курс
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface WorkoutExercise {
  id: string;
  muscle_group:
    | 'calves'
    | 'legs_squat'
    | 'chest'
    | 'back'
    | 'shoulders'
    | 'triceps'
    | 'legs_additional'
    | 'glutes'
    | 'optional_arms_core'
    | 'biceps_optional';
  muscle_title: string;
  name: string;
  sets: string;
  reps: string;
  notes: string;
  hormonal_mechanism: string;
  is_completed?: boolean;
}

export interface IslamicRemedy {
  id: number;
  name_ru: string;
  name_lat?: string;
  name_ar?: string;
  category: string;
  active_components: string;
  traditional_use: string; // Historical context ONLY, not efficacy
  scientific_evidence: string;
  evidence_level: EvidenceGrade;
  evidence_refs: string[];
  contraindications: string[];
  personal_experience?: string;
  personal_dose?: string;
  is_used_by_owner: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeNote {
  id: number;
  topic:
    | 'ЖКТ и всасывание'
    | 'Нейробиология'
    | 'Андрология'
    | 'Фармакология'
    | 'Биохакинг'
    | 'Разборы препаратов'
    | 'Протоколы'
    | 'Исламская медицина (доказательный разбор)';
  title: string;
  body: string;
  evidence_refs: string[];
  meta_analyses?: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssistantQueryRecord {
  id: number;
  user_id: number;
  question: string;
  answer: string;
  sources: { title: string; ref: string; type: string }[];
  is_red_flag: boolean;
  created_at: string;
}

export interface SpecialistDocument {
  type: string;
  file_id: string;
  org: string;
  date: string;
  status: 'pending' | 'verified' | 'rejected';
}

export interface Specialist {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  description: string;
  specialization: string[];
  telegram_link: string;
  photo_url?: string;
  documents: SpecialistDocument[];
  status: 'pending' | 'verified' | 'rejected' | 'deactivated';
  verified_by?: number;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Invite {
  id: number;
  raw_token?: string;
  token_hash: string;
  specialist_id: number;
  created_by: number;
  status: InviteStatus;
  max_uses: number;
  used_count: number;
  expires_at: string;
  created_at: string;
  used_at?: string;
  metadata?: Record<string, any>;
}

export interface SpecialistPatient {
  id: number;
  specialist_id: number;
  patient_id: number;
  patient_name?: string;
  patient_username?: string;
  patient_telegram_id?: number;
  status: PatientLinkStatus;
  invited_by: number;
  invite_id?: number;
  added_via: 'invite' | 'manual' | 'start_command';
  notes?: string;
  created_at: string;
  updated_at: string;
  removed_at?: string;
  last_message_at?: string;
}

export interface Recommendation {
  id: number;
  author_id: number;
  title: string;
  body: string;
  evidence_refs: string[];
  attachments: { type: string; url: string; caption?: string }[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: number;
  specialist_id: number;
  patient_id: number;
  direction: 'to_patient' | 'from_patient';
  telegram_msg_id?: number;
  body: string;
  delivered: boolean;
  error?: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  actor_id?: number;
  actor_name?: string;
  actor_role: 'user' | 'specialist' | 'owner' | 'system';
  action: AuditAction;
  target_type: string;
  target_id?: number;
  payload_before?: any;
  payload_after?: any;
  ip?: string;
  created_at: string;
}

export type FsmSection =
  | 'main'
  | 'gastro_month1'
  | 'medications'
  | 'workout'
  | 'knowledge'
  | 'assistant'
  | 'dondear'
  | 'profile'
  | 'specialist_console'
  | 'owner_console';
