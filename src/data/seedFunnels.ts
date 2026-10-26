import { FunnelStage, FunnelTrigger, FunnelLead } from '../types';

export const INITIAL_FUNNEL_STAGES: FunnelStage[] = [
  {
    id: 'step_1_lead_magnet',
    step_number: 1,
    name: 'Выдача лид-магнита',
    delay_label: 'Мгновенно при вводе кодового слова',
    title: '🎁 Ваш авторский гайд от провизора @DonDearOfficina готов!',
    body: `Приветствую! На связи @DonDearOfficina — дипломированный провизор.

Вы запросили доступ к авторской схеме буста нервной системы и разбору биохимии препаратов.
Ваш персональный гайд доступен по ссылке ниже.

Внутри:
1. Каскадная триада: почему стимуляция без ЖКТ и холина ведет к астении.
2. Полная схема 33 препаратов и добавок (дозировки, время, правила разнесения железа и цинка).
3. Список обязательных биомаркеров крови (ферритин, гомоцистеин, ТТГ).`,
    lead_magnet_name: 'PDF: Авторский протокол буста нервной системы (33 препарата).pdf',
    lead_magnet_url: 'https://t.me/DonDearOfficinaAI?start=dl_guide_stack',
    cta_text: '🚀 Открыть гайд в Telegram-боте @DonDearOfficinaAI',
    cta_link: 'https://t.me/DonDearOfficinaAI?start=ig_stack_magnet',
  },
  {
    id: 'step_2_education',
    step_number: 2,
    name: 'Образовательный блок: Каскад',
    delay_label: '+2 часа после скачивания гайда',
    title: '🧠 Главная ошибка 90% людей при приёме ноотропов',
    body: `Большинство начинают с «быстрых стимуляторов» (кофеин, модафинил, фенилпирацетам), надеясь на мгновенный фокус. 

Но как провизор объясню биохимический закон:
Стимулировать истощенный синапс без донора ацетилхолина (Глиатилин) и АТФ-буфера (Креатин) — это брать кредит под грабительский процент. Через 10–14 дней наступает синдром истощения.

Фундаментальный каскад @DonDearOfficina:
1. ЖКТ и желчеотток (Хофитол) ➔ всасывание жирорастворимых веществ.
2. Субстратное насыщение (Глиатилин 400 мг 2 р/день) ➔ пул ацетилхолина.
3. Энергетический буфер (Креатин 5 г + L-Цитруллин 3 г натощак).
4. Только потом — аккуратная стимуляция рецепторов.`,
    cta_text: '🤖 Запустить проверку симптомов в @DonDearOfficinaAI',
    cta_link: 'https://t.me/DonDearOfficinaAI?start=fsm_symp',
  },
  {
    id: 'step_3_triage',
    step_number: 3,
    name: 'Интерактивная диагностика & Взаимодействия',
    delay_label: 'День 2 (+24 часа)',
    title: '⚠️ Проверьте ваш текущий стек на фармацевтические конфликты',
    body: `Знали ли вы, что одновременный приём железа и цинка блокирует всасывание обоих минералов на 50% из-за конкуренции за переносчик DMT-1 в кишечнике?

В нашем боте @DonDearOfficinaAI работает алгоритм клинической сверки взаимодействий:
• Введите ваши симптомы и препараты.
• Бот проверит их по базам PubMed и OpenFDA.
• Если обнаружен красный флаг — предупредит мгновенно.`,
    cta_text: '🔬 Проверить совместимость препаратов',
    cta_link: 'https://t.me/DonDearOfficinaAI?start=check_interactions',
  },
  {
    id: 'step_4_conversion',
    step_number: 4,
    name: 'Оффер: Личный аудит у провизора',
    delay_label: 'День 3 (+48 часов)',
    title: '🤝 Индивидуальный аудит вашего протокола со мной лично',
    body: `Шаблонные схемы из интернета часто не работают, потому что у каждого свой уровень ферритина, состояние микробиоты и толерантность к ноотропам.

Как дипломированный провизор, я провожу персональный аудит:
1. Детальный разбор ваших анализов (ОАК, ферритин, гомоцистеин, гормональный профиль).
2. Выявление разрыва в каскаде (ЖКТ vs нейромедиаторы vs гормоны).
3. Составление персональной схемы приёма с точными таймингами и проверкой совместимости.

Количество мест в неделю ограничено ввиду глубокого погружения в каждый случай.`,
    cta_text: '📩 Записаться на аудит к @DonDearOfficina',
    cta_link: 'https://t.me/DonDearOfficina',
  },
];

export const INITIAL_FUNNEL_TRIGGERS: FunnelTrigger[] = [
  {
    id: 1,
    keyword: 'СТЕК',
    channel: 'instagram',
    campaign_name: 'Instagram Direct: СТЕК ➔ Выдача гайда ➔ Бот @DonDearOfficinaAI',
    lead_magnet_title: 'Гайд по авторскому протоколу буста нервной системы (33 препарата)',
    lead_magnet_desc: 'Мгновенная отправка в Direct при комментарии или сообщении с триггером СТЕК',
    is_active: true,
    total_leads: 184,
    conversions: 42,
  },
  {
    id: 2,
    keyword: 'ФЕРРИТИН',
    channel: 'omnichannel',
    campaign_name: 'Омничейн: Железодефицит и дофаминовый драйв',
    lead_magnet_title: 'Чек-лист лабораторной диагностики скрытого железодефицита',
    lead_magnet_desc: 'Разбор связи ферритина с тирозингидроксилазой и правила приема Ферлатум Фол',
    is_active: true,
    total_leads: 96,
    conversions: 28,
  },
  {
    id: 3,
    keyword: 'БУСТ',
    channel: 'instagram',
    campaign_name: 'Instagram Reels: Когнитивный буст без истощения',
    lead_magnet_title: 'Схема фосфатного буфера: Креатин + L-Цитруллин + Холин',
    lead_magnet_desc: 'Быстрый протокол для предпринимателей и IT-специалистов',
    is_active: true,
    total_leads: 142,
    conversions: 35,
  },
  {
    id: 4,
    keyword: 'ЖКТ',
    channel: 'telegram',
    campaign_name: 'Telegram Channel: ЖКТ-фундамент всасывания',
    lead_magnet_title: 'Протокол оптимизации желчеоттока и подготовки кишечника к ноотропам',
    lead_magnet_desc: 'Разбор роли артишока (Хофитол) и Saccharomyces boulardii (Энтерол)',
    is_active: true,
    total_leads: 78,
    conversions: 19,
  },
];

export const INITIAL_FUNNEL_LEADS: FunnelLead[] = [
  {
    id: 1,
    channel: 'instagram',
    username: 'mikhail_dev',
    full_name: 'Михаил Ковалев (IT Lead)',
    trigger_keyword: 'СТЕК',
    current_step: 4,
    status: 'converted',
    telegram_connected: true,
    telegram_id: 611223344,
    started_at: '2026-10-18T10:00:00Z',
    last_message_at: '2026-10-21T09:00:00Z',
  },
  {
    id: 2,
    channel: 'instagram',
    username: 'anna_biohack',
    full_name: 'Анна Васильева',
    trigger_keyword: 'ФЕРРИТИН',
    current_step: 3,
    status: 'active',
    telegram_connected: true,
    telegram_id: 722334455,
    started_at: '2026-10-19T14:30:00Z',
    last_message_at: '2026-10-20T16:00:00Z',
  },
  {
    id: 3,
    channel: 'telegram',
    username: 'sergey_finance',
    full_name: 'Сергей Петров',
    trigger_keyword: 'БУСТ',
    current_step: 2,
    status: 'active',
    telegram_connected: true,
    telegram_id: 833445566,
    started_at: '2026-10-20T12:00:00Z',
    last_message_at: '2026-10-21T08:00:00Z',
  },
  {
    id: 4,
    channel: 'instagram',
    username: 'elena_wellness',
    full_name: 'Елена Кузнецова',
    trigger_keyword: 'ЖКТ',
    current_step: 1,
    status: 'active',
    telegram_connected: false,
    started_at: '2026-10-21T11:20:00Z',
    last_message_at: '2026-10-21T11:20:00Z',
  },
];
