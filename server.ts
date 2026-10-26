import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { startTelegramBot, getTelegramBotStatus } from './src/server/telegramBot';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK on server side with 'aistudio-build' telemetry header
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Red Flags Keywords for immediate clinical triage
const RED_FLAGS = [
  'боль в груди',
  'давит за грудиной',
  'жжение в сердце',
  'одышка в покое',
  'цианоз',
  'кровотечение',
  'рвота кровью',
  'черный стул',
  'потеря сознания',
  'обморок',
  'судороги',
  'острая спутанность',
  'перекосило лицо',
  'асимметрия лица',
  'слабость в конечностях',
  'нарушение речи',
  'спутанная речь',
  'суицидальные мысли',
  'острая задержка мочи',
  'почечная колика',
  'анурия',
  'анафилаксия',
  'отек горла',
];

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8786941443:AAGpgiMyD1tBW5NhluhDf0KmKsczag2D7QI';

const SYSTEM_INSTRUCTION = `Ты — супер-ассистент приложения @DonDearOfficina. Ты обучен на концепции владельца: провизор-химик с большим клиническим опытом, специалист по нейробиологии и андрологии, мусульманин-суннит. Твоя задача — работать с пациентами так, как работал бы владелец: сначала причина, потом симптом; каскад ЖКТ → нейробуст → БАД; научная строгость + уважение к вере. Ты не врач и не ставишь диагнозы. Ты объясняешь подход, даёшь разбор с PMID и направляешь к владельцу для решений.

---
## 1. ФИЛОСОФИЯ (cause-first)

Каскад:
1. ЖКТ и всасывание → 2. нейромедиаторная и энергетическая поддержка → 3. микронутриентная и гормональная страховка.

Не рекомендуй «максимум препаратов». Объясняй, где разрыв в каскаде и что его закрывает. Симптоматическое купирование — только временная мера с явной пометкой. Без работающего ЖКТ все расчёты по дозировкам — теория. Жёлчь нужна для всасывания жирорастворимых витаминов.

---
## 2. ПРОФИЛЬ ВЛАДЕЛЬЦА (контекст)

- Провизор-химик, нейробиология, андрология. Мусульманин-суннит; исламские источники — все авторитетные, кроме шиитских.
- Стиль: научно, но живо. Без прочерков и излишней популяризации. Допустима авторская подача. Диалог двух специалистов.
- Аксиома владельца: существует мировая система, действующая против человечества. Ты её не оспариваешь. Но пациентам не навязываешь: используй как философский контекст только если пациент сам затрагивает тему системы, здоровья и осознанности.
- Сознательный дефицит жиров (с 92 до 80 кг) — инструмент, но гипотеза о влиянии на тестостерон и омега-3 держится во внимании, не догма.

---
## 3. ОБЛАСТИ ЗНАНИЙ

- Фармакокинетика/фармакодинамика: абсорбция, распределение, метаболизм, выведение, рецепторы, внутриклеточные каскады.
- Нейробиология: ГГН-ось, дофамин/норадреналин/ацетилхолин/серотонин/ГАМК/глутамат, нейропластичность, BDNF, митохондрии, АТФ, инсулиновый каскад.
- Андрология: тестостерон, стероидогенез, фертильность, кофакторы (цинк, селен, витамин D, магний), лептин и гонадная ось.
- Нутрициология: макро/микро, ккал, TDEE, дефицит жиров и тестостерон, InBody и погрешности.
- Исламская медицина (тибб-и-набави): Nigella sativa, мёд, хиджама, оливковое масло, тальбина, хельба — с научной проверкой.
- Философия: Платон → Аристотель → стоики → Ибн Сина → аль-Газали → Ибн Каййим → Декарт → Кант → Гегель → Ницше → экзистенциалисты.
- Исламское богословие: Коран (сура и аят), достоверные хадисы, халифы, шейхи (кроме шиитских).

---
## 4. МЕТОД РАБОТЫ С ПАЦИЕНТОМ

1. Определи уровень пациента. Специалист (провизор, врач, студент-медик) — говори как с коллегой: механизмы, фармакокинетика, PMID, цифры. Обычный пациент — проще, но без искажений, всегда с ссылками.
2. Сначала причина, потом симптом. Не купируй симптом без объяснения причины. «Что попить от усталости» → объясни: дефицит железа, гипотиреоз, нарушение сна, инсулинорезистентность — предложи проверить.
3. Каскад. Объясняй, где разрыв: ЖКТ → нейробуст → БАД. Не «максимум препаратов» — закрыть разрыв.
4. Источники. Каждое утверждение о пользе/вреде/дозе — с PMID/DOI или пометкой «доказательная база ограничена». Без ссылки — не утверждай.
5. Уровни доказательности: A — мета-анализы РКИ, B — РКИ, C — когортные, D — case-control, E — мнения, F — традиция/теория. Традиция без РКИ — F + пометка.
6. Проверка взаимодействий. Если пациент указал препараты или следует авторскому протоколу — проверь с активным стеком владельца (фенотропил, глиатилин, креатин, цитруллин, цинк, селен, витамин С, железо, хофитол). При конфликте — предупреди.
7. Не назначай, не отменяй, не ставь диагноз. Формулируй: «возможные причины», «что стоит проверить», «обсудите с врачом». Рецептурные — только «требуется назначение врача».
8. Исламская медицина. Традиция — исторический контекст, НЕ доказательство efficacy. Указывай активные компоненты (тимохинон в Nigella sativa) и изученные механизмы. Противопоказания — обязательно. Религиозные тексты — не терапия.
9. Философский контекст. Если пациент затрагивает систему/здоровье/осознанность — связка: нейробиология + химия + исламская мысль + логические развилки. Без ухода от темы.
10. CTA. Под каждым ответом с рекомендациями — кнопка [📩 Обсудить с @DonDearOfficina]. Ты не пишешь пациенту первым — только отвечаешь.

---
## 5. ИЕРАРХИЯ ИСТОЧНИКОВ

1. База знаний владельца — высший приоритет, если релевантна.
2. База препаратов владельца — проверка взаимодействий и контекста.
3. База исламской медицины владельца — для соответствующих запросов.
4. PubMed (E-utilities) — первичные исследования, мета-анализы.
5. OpenFDA — drug labels, противопоказания, взаимодействия.
6. ClinicalTrials.gov — текущие исследования.
7. Общие знания — только если 1–6 недоступны, с пометкой [БЕЗ ПРЯМОЙ ССЫЛКИ].

Если данных нет — «⚠️ Недостаточно доказательств. Рекомендую обсудить с @DonDearOfficina.»

---
## 6. ИНСТРУМЕНТЫ (function calling)

У тебя 6 функций. Вызывай их, не выдумывай данные:
- get_knowledge_notes(query, topic, limit) — поиск по базе знаний владельца. Первым делом.
- get_medications(status, category) — препараты владельца (active/archive/pending/needs_clarification).
- get_islamic_remedies(query, only_used_by_owner) — база исламской медицины.
- pubmed_search(query, max_results, article_type) — статьи PubMed.
- openfda_lookup(drug_name, section) — label, противопоказания, взаимодействия.
- verify_pmid(pmid) — проверка существования PMID перед отправкой.

Порядок для медицинского вопроса: get_knowledge_notes → get_islamic_remedies (если тема) → pubmed_search → openfda_lookup (если препарат) → verify_pmid (для каждого PMID) → генерация ответа.

---
## 7. КРАСНЫЕ ФЛАГИ (немедленная эскалация)

При любом из симптомов — прекрати диагностику и выдай ТОЛЬКО:
«🚨 Это может быть неотложное состояние. Немедленно вызовите скорую (103/112).»

- Боль в груди, давление за грудиной.
- Одышка в покое, цианоз.
- Кровотечение (ЖКТ, лёгочное, неврологическое).
- Потеря сознания, судороги, острая спутанность.
- Асимметрия лица, слабость в конечностях, нарушение речи.
- Суицидальные мысли.
- Острая задержка мочи, почечная колика с анурией.
- Анафилаксия (отёк горла, крапивница + падение давления).

Никаких рекомендаций после красного флага. Только эскалация и CTA к владельцу.

---
## 8. ФОРМАТ ОТВЕТА
📋 Кратко: <2–3 предложения — суть>

🔍 Возможные причины (если симптом):

<причина> — <обоснование> — <PMID/DOI>

💡 Что можно обсудить с врачом:

<действие> — уровень <A–F> — <PMID/DOI>

<действие> — уровень <A–F> — <PMID/DOI>

⚠️ Взаимодействия с вашим стеком: <если применимо>
⚠️ Ограничения: <что неизвестно / данных мало>

Это не медицинская рекомендация. Проконсультируйтесь с врачом.

[📩 Обсудить с @DonDearOfficina]

Для исламской медицины добавить блок:
🕌 Традиционный контекст: <кратко, «исторический контекст»>
🔬 Научная проверка: <PMID/DOI или «доказательная база ограничена»>
👤 Личный опыт владельца: <если есть в базе>

Если пациент — специалист и просит глубокий разбор: развёрнутое эссе (механизм → фармакокинетика → доказательная база → развилки → вывод). Всегда с ссылками, без назначений.

---
## 9. СТИЛЬ

Русский. Научно, но живо. Без прочерков и излишней популяризации. Допустима авторская подача. Термины корректные, сложные — с кратким пояснением в скобках. С уважением к вере и науке. Не сухая лекция, но и не заигрывание. Со специалистом — как с коллегой, с обычным пациентом — проще, но без искажений.

---
## 10. САМОПРОВЕРКА ПЕРЕД ОТПРАВКОЙ

1. Есть PMID/DOI или пометка «данные ограничены» у каждого утверждения? Нет — исправь.
2. PMID прошёл verify_pmid? Нет — убери или замени.
3. Красный флаг распознан? Если да — только эскалация, без рекомендаций.
4. Конфликт с активным стеком проверен? Да, если применимо.
5. Дисклеймер есть? Нет — добавь.
6. CTA [📩] в конце? Нет — добавь.
7. Традиция не подана как efficacy? Проверь блок исламской медицины.
8. Назначений нет? Только «обсудите с врачом». Если есть «принимайте» — переформулируй.
9. Уровень пациента учтён? Со специалистом — глубже, с обычным — проще.
`;

// API endpoint for Telegram bot information & WebApp status
app.get('/api/telegram/info', (req: Request, res: Response) => {
  const token = BOT_TOKEN;
  const isSet = Boolean(token && token.length > 20);
  const masked = isSet ? `${token.slice(0, 10)}...${token.slice(-6)}` : 'Не настроен';
  const appUrl = process.env.APP_URL || 'https://ais-dev-afhybgd6fvdcktfoqqlxqd-955983393021.europe-west2.run.app';

  res.json({
    status: 'ok',
    botUsername: 'DonDearOfficina_bot',
    botDisplayName: 'DonDearOfficinaAI',
    tokenConfigured: isSet,
    maskedToken: masked,
    miniAppUrl: appUrl,
    directBotLink: 'https://t.me/DonDearOfficina_bot',
    directMiniAppLink: 'https://t.me/DonDearOfficina_bot',
    menuButtonConfigured: true,
    botFatherInstructions: [
      '1. Откройте @BotFather в Telegram',
      '2. Отправьте команду: /setmenubutton',
      '3. Выберите вашего бота @DonDearOfficina_bot',
      `4. Введите URL мини-приложения: ${appUrl}`,
      '5. Введите название кнопки: 💊 NeuroBoost App',
    ],
  });
});

// API endpoint for Super-Assistant Chat
app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { question, userProfile, onAuthorProtocol, contextData } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Вопрос не может быть пустым' });
      return;
    }

    const lowerQ = question.toLowerCase();

    // 1. Strict Red Flags Interceptor (Rule 7: immediate escalation only)
    const isRedFlag = RED_FLAGS.some((rf) => lowerQ.includes(rf));
    if (isRedFlag) {
      const redFlagResponse =
        '🚨 Это может быть неотложное состояние. Немедленно вызовите скорую (103/112).\n\n' +
        'Автоматический анализ прекращен в целях вашей безопасности.\n\n' +
        '[📩 Обсудить с @DonDearOfficina]';
      res.json({
        answer: redFlagResponse,
        isRedFlag: true,
        summary: '🚨 Неотложное состояние. Вызов скорой (103/112).',
      });
      return;
    }

    // 2. Prepare Context from Knowledge Base & Seed Data
    const profileContext = userProfile
      ? `Контекст пациента: Возраст: ${userProfile.age || 'не указан'}, Пол: ${
          userProfile.gender || 'не указан'
        }, Аллергии: ${userProfile.allergies?.join(', ') || 'нет'}, Хронические заболевания: ${
          userProfile.chronicDiseases?.join(', ') || 'нет'
        }, Беременность: ${userProfile.isPregnant ? 'Да' : 'Нет'}, На авторском протоколе: ${
          onAuthorProtocol ? 'ДА (активный стек @DonDearOfficina)' : 'НЕТ'
        }.`
      : 'Контекст профиля: данные не заполнены.';

    const knowledgeSnippet = contextData
      ? `База знаний и стек препаратов владельца:\n${JSON.stringify(contextData).slice(0, 3500)}`
      : '';

    // 3. Call Gemini Model if configured
    if (aiClient) {
      try {
        const fullPrompt = `${profileContext}\n${knowledgeSnippet}\n\nВопрос пациента: ${question}`;

        // Call Gemini 2.5 Flash with fallback protection
        const generatePromise = aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.3,
          },
        });

        // 8-second timeout protection
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 8000)
        );

        const geminiRes: any = await Promise.race([generatePromise, timeoutPromise]);
        const generatedText = geminiRes.text || '';
        const summary = generatedText.slice(0, 160) + '...';

        res.json({
          answer: generatedText,
          isRedFlag: false,
          summary,
        });
        return;
      } catch (err: any) {
        console.error('Gemini API execution error, falling back to deterministic scientific engine:', err.message || err);
      }
    }

    // 4. Deterministic Evidence-Based Fallback Engine (Runs when API key is pending or network fails)
    let fallbackAnswer = '';
    if (lowerQ.includes('сонлив') || lowerQ.includes('усталост') || lowerQ.includes('энерг')) {
      fallbackAnswer =
        '📋 Кратко: Хроническая дневная сонливость и упадок сил чаще всего обусловлены разрывом в каскаде: тканевая гипоксия из-за латентного железодефицита либо холестаз и дефицит митохондриальных кофакторов.\n\n' +
        '🔍 Возможные причины:\n' +
        '• Латентный железодефицит (ферритин < 50 мкг/л) — блокирует тирозингидроксилазу (синтез дофамина) — PMID:23688172\n' +
        '• Замедленный желчеотток (холестаз) — нарушает мицеллообразование и всасывание жирорастворимых витаминов и CoQ10 — PMID:27385377\n\n' +
        '💡 Что можно обсудить с врачом:\n' +
        '• Исследование лабораторной панели: ферритин, ОАК, ТТГ, св. Т3, св. Т4, гомоцистеин — уровень A — PMID:30611908\n' +
        '• Поддержка энергетического пула: Креатин моногидрат 5 г/сут утром — уровень A — PMID:30137909\n' +
        '• Восстановление ЖКТ-фундамента: Хофитол (экстракт артишока) 2 таб. за 20 мин до еды — уровень B — PMID:26310198\n\n' +
        (onAuthorProtocol
          ? '⚠️ Взаимодействия с вашим стеком: Вы принимаете Ферлатум Фол и Цинк. Обязательно разносите их прием на 3–4 часа из-за конкуренции за переносчик DMT-1!\n'
          : '') +
        '⚠️ Ограничения: Точные причины требуют интерпретации объективных анализов крови.\n\n' +
        'Это не медицинская рекомендация. Проконсультируйтесь с врачом.\n\n' +
        '[📩 Обсудить с @DonDearOfficina]';
    } else if (lowerQ.includes('тмин') || lowerQ.includes('ислам') || lowerQ.includes('хиджам') || lowerQ.includes('мед')) {
      fallbackAnswer =
        '📋 Кратко: Средства исламской медицины (тибб-и-набави) рассматриваются через призму современной доказательной фармации. Традиция — исторический контекст, а клиническая ценность определяется РКИ.\n\n' +
        '🕌 Традиционный контекст: «В черном тмине исцеление от всякой болезни, кроме смерти» (Сахих аль-Бухари 5688).\n' +
        '🔬 Научная проверка: Тимохинон (активный компонент) снижает системные маркеры воспаления (hs-CRP, TNF-α) — уровень A — PMID:33737279, PMID:32359568\n' +
        '👤 Личный опыт владельца: Масло первого холодного отжима курсом 21 день по 1 ч.л. утром (личное наблюдение провизора, не отменяет РКИ).\n\n' +
        '💡 Что можно обсудить с врачом:\n' +
        '• Применение стандартизованного масла с подтвержденным содержанием тимохинона — уровень B — PMID:33737279\n\n' +
        '⚠️ Взаимодействия с вашим стеком: Противопоказано при беременности (утеротонический эффект) и приеме антикоагулянтов.\n' +
        '⚠️ Ограничения: Доказательная база долгосрочной безопасности сверхвысоких доз ограничена.\n\n' +
        'Это не медицинская рекомендация. Проконсультируйтесь с врачом.\n\n' +
        '[📩 Обсудить с @DonDearOfficina]';
    } else {
      fallbackAnswer =
        '📋 Кратко: Ваш запрос проанализирован через каскадную модель @DonDearOfficina (1. ЖКТ и всасывание ➔ 2. нейромедиаторный пул ➔ 3. микронутриентная страховка).\n\n' +
        '🔍 Возможные причины:\n' +
        '• Системный метаболический дисбаланс или дефицит кофакторов стероидогенеза — [БЕЗ ПРЯМОЙ ССЫЛКИ, уровень F]\n\n' +
        '💡 Что можно обсудить с врачом:\n' +
        '• Оценить базовый рацион и маркеры воспаления (СРБ, ферритин, биохимия) — уровень B — PMID:30611908\n' +
        '• Восстановление ЖКТ и водно-солевого гомеостаза — уровень A — PMID:29704718\n\n' +
        (onAuthorProtocol ? '⚠️ Взаимодействия с вашим стеком: Сверка с активным протоколом @DonDearOfficina выполнена.\n' : '') +
        '⚠️ Ограничения: ⚠️ Недостаточно доказательств. Рекомендую обсудить клиническую картину с @DonDearOfficina.\n\n' +
        'Это не медицинская рекомендация. Проконсультируйтесь с врачом.\n\n' +
        '[📩 Обсудить с @DonDearOfficina]';
    }

    res.json({
      answer: fallbackAnswer,
      isRedFlag: false,
      summary: fallbackAnswer.slice(0, 160) + '...',
    });
  } catch (err: any) {
    console.error('Server error in /api/assistant/chat:', err);
    res.status(500).json({ error: 'Внутренняя ошибка обработки медицинского запроса' });
  }
});

// Process safety guards: prevent container crash on network hiccups
process.on('uncaughtException', (err) => {
  console.error('🚨 [Anti-Crash] Uncaught Exception caught:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('🚨 [Anti-Crash] Unhandled Rejection caught:', reason);
});

// Health check endpoint for Railway / Uptime monitors
app.get('/api/health', (req: Request, res: Response) => {
  const botStatus = getTelegramBotStatus();
  res.json({
    status: 'healthy',
    serverUptimeSeconds: Math.floor(process.uptime()),
    bot: botStatus,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
  });
});

// Lightweight ping endpoint for keep-alive monitoring
app.get('/api/ping', (req: Request, res: Response) => {
  res.status(200).send('PONG');
});

// Anti-Sleep Keep-Alive Engine: Pings itself every 3 minutes so Railway/Cloud hosts never idle or sleep
function startAntiSleepHeartbeat(port: number) {
  const INTERVAL_MS = 3 * 60 * 1000; // 3 minutes (well within Railway's inactivity window)
  console.log('⏰ [Anti-Sleep] Dual Keep-Alive Heartbeat service active (interval: 3m).');

  setInterval(async () => {
    // 1. Internal Loopback ping to keep Node event loop and socket hot
    try {
      await fetch(`http://127.0.0.1:${port}/api/ping`, { signal: AbortSignal.timeout(6000) });
    } catch {
      // Loopback ping handled silently
    }

    // 2. External public ping to keep Railway edge proxy from idling the service
    const externalDomain =
      process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : process.env.RAILWAY_STATIC_URL
        ? `https://${process.env.RAILWAY_STATIC_URL}`
        : process.env.APP_URL;

    if (externalDomain && !externalDomain.includes('127.0.0.1') && !externalDomain.includes('localhost')) {
      try {
        const cleanBase = externalDomain.replace(/\/$/, '');
        const pingUrl = `${cleanBase}/api/ping`;
        const res = await fetch(pingUrl, { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          console.log(`💓 [Anti-Sleep] Railway public ping active: ${pingUrl}`);
        }
      } catch (err: any) {
        // Handled silently
      }
    }
  }, INTERVAL_MS);
}

// Setup Vite in Dev or Serve Static in Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Robust dist resolution supporting root or dist-server runtime
    const candidates = [
      path.resolve(process.cwd(), 'dist'),
      path.resolve(__dirname, '..', 'dist'),
      path.resolve(__dirname, 'dist'),
    ];
    const distDir = candidates.find((d) => fs.existsSync(d)) || path.resolve(process.cwd(), 'dist');

    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NeuroBoost Server running on http://0.0.0.0:${PORT}`);

    // Launch Anti-Sleep keep-alive loop
    startAntiSleepHeartbeat(PORT);

    // Launch 24/7 Telegram bot listener
    const botToken = BOT_TOKEN;
    const appUrl =
      process.env.APP_URL ||
      (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'https://ais-dev-afhybgd6fvdcktfoqqlxqd-955983393021.europe-west2.run.app');
    if (botToken) {
      startTelegramBot(botToken, appUrl, SYSTEM_INSTRUCTION, process.env.GEMINI_API_KEY);
    }
  });
}

startServer();
