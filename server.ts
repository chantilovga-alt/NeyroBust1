import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { startTelegramBot, getTelegramBotStatus } from './src/server/telegramBot';
import { storage } from './src/server/storage';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable rawBody capture for Instagram webhook HMAC-SHA256 signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Read Telegram Bot Token strictly from environment variables without hardcoded secrets
const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();

// Health check endpoint for Railway & uptime monitoring
app.get('/api/health', (_req: Request, res: Response) => {
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

// Readiness endpoint for container orchestrators
app.get('/api/readiness', (_req: Request, res: Response) => {
  const botStatus = getTelegramBotStatus();
  const isBotConfigured = Boolean(BOT_TOKEN && BOT_TOKEN.length > 15);
  const isHealthy = !isBotConfigured || botStatus.consecutiveErrors < 10;

  if (isHealthy) {
    res.status(200).json({
      status: 'ready',
      storage: 'persistent_disk_ok',
      botConfigured: isBotConfigured,
      botRunning: botStatus.isRunning,
      botUsername: botStatus.botUsername,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'degraded',
      error: botStatus.lastError || 'High error rate',
      consecutiveErrors: botStatus.consecutiveErrors,
    });
  }
});

// Lightweight ping endpoint for keep-alive monitoring
app.get('/api/ping', (_req: Request, res: Response) => {
  res.status(200).send('PONG');
});

// Telegram Bot Information endpoint (No token secrets or masked fragments exposed!)
app.get('/api/telegram/info', (_req: Request, res: Response) => {
  const isConfigured = Boolean(BOT_TOKEN && BOT_TOKEN.length > 15);
  const botStatus = getTelegramBotStatus();

  res.json({
    status: 'ok',
    botConfigured: isConfigured,
    botUsername: botStatus.botUsername || 'DonDearOfficina_bot',
    authorContact: '@DonDearOfficina',
    authorUrl: 'https://t.me/DonDearOfficina',
    commandsConfigured: true,
    pollingRunning: botStatus.isRunning,
  });
});

// Weight Diary API
app.get('/api/nutrition/weight', (req: Request, res: Response) => {
  const userId = Number(req.query.userId) || 1;
  const user = storage.getUser(userId);
  res.json({
    userId,
    weightDiary: user.weightDiary || [],
  });
});

app.post('/api/nutrition/weight', (req: Request, res: Response) => {
  const { userId, weightKg, notes } = req.body;
  const uid = Number(userId) || 1;
  const w = parseFloat(weightKg);

  if (!w || isNaN(w) || w < 20 || w > 350) {
    res.status(400).json({ error: 'Некорректный вес (допустимо от 20 до 350 кг)' });
    return;
  }

  const updatedUser = storage.addWeightEntry(uid, w, notes);
  res.json({
    success: true,
    weightDiary: updatedUser.weightDiary,
  });
});

app.delete('/api/nutrition/weight/:id', (req: Request, res: Response) => {
  const userId = Number(req.query.userId) || 1;
  const entryId = req.params.id;

  storage.deleteWeightEntry(userId, entryId);
  const user = storage.getUser(userId);
  res.json({
    success: true,
    weightDiary: user.weightDiary || [],
  });
});

// Instagram Webhook Integration (Meta Graph API)
// 1. Subscription verification challenge
app.get('/api/instagram/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.INSTAGRAM_VERIFY_TOKEN;

  if (mode === 'subscribe' && expectedToken && token === expectedToken) {
    console.log('✅ [Instagram Webhook] Hub challenge verified successfully.');
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Forbidden or invalid verify token' });
  }
});

// 2. Incoming messages with HMAC-SHA256 signature verification and trigger processing
app.post('/api/instagram/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  // Verify HMAC signature if app secret is configured
  if (appSecret && signature) {
    const rawBody = (req as any).rawBody;
    if (rawBody) {
      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex')}`;

      if (signature !== expectedSignature) {
        console.warn('⚠️ [Instagram Webhook] Invalid signature rejected.');
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }
    }
  }

  const body = req.body;
  if (body?.object === 'instagram' && Array.isArray(body?.entry)) {
    const botStatus = getTelegramBotStatus();
    const botUsername = botStatus.botUsername || 'DonDearOfficina_bot';

    for (const entry of body.entry) {
      if (Array.isArray(entry.messaging)) {
        for (const event of entry.messaging) {
          const mid = event.message?.mid || `${event.sender?.id}_${event.timestamp}`;
          if (storage.isWebhookEventProcessed(mid)) {
            continue;
          }

          const messageText = (event.message?.text || '').trim().toUpperCase();
          const senderId = event.sender?.id;

          // Process supported trigger keywords
          let targetStartParam = 'course';
          if (messageText.includes('ЖКТ') || messageText.includes('ВОДА')) {
            targetStartParam = 'water';
          } else if (messageText.includes('ПОХУДЕНИЕ') || messageText.includes('ЖИР')) {
            targetStartParam = 'nutrition';
          } else if (messageText.includes('КУРС') || messageText.includes('СТЕК')) {
            targetStartParam = 'course';
          }

          const deepLink = `https://t.me/${botUsername}?start=${targetStartParam}`;

          // If Instagram Graph API token is present, send direct message reply
          const pageAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
          if (pageAccessToken && senderId) {
            try {
              await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipient: { id: senderId },
                  message: {
                    text:
                      `Здравствуйте! Материалы авторской программы @DonDearOfficina доступны в Telegram:\n` +
                      `👉 ${deepLink}\n\n` +
                      `Для индивидуальных консультаций свяжитесь лично: @DonDearOfficina`,
                  },
                }),
              });
            } catch (err: any) {
              console.error('❌ [Instagram Webhook] Failed to send reply message:', err.message);
            }
          }

          storage.markWebhookEventProcessed(mid);
        }
      }
    }
  }

  res.status(200).send('EVENT_RECEIVED');
});

// Instagram funnel status endpoint
app.get('/api/instagram/status', (_req: Request, res: Response) => {
  const isConfigured = Boolean(
    process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_APP_SECRET
  );
  res.json({
    status: isConfigured ? 'Подключено' : 'Не подключено',
    isConfigured,
    triggerKeywords: ['КУРС', 'ЖКТ', 'ВОДА', 'ПОХУДЕНИЕ', 'СТЕК'],
    requirements: [
      'Meta Developer App с продуктом Messenger / Instagram Graph API',
      'Бизнес-аккаунт Instagram, привязанный к Facebook Page',
      'Переменные: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_APP_SECRET, INSTAGRAM_VERIFY_TOKEN',
    ],
  });
});

// Storage statistics endpoint
app.get('/api/storage/stats', (_req: Request, res: Response) => {
  res.json(storage.getStats());
});

// Safety guards: prevent unhandled errors from terminating process
process.on('uncaughtException', (err) => {
  console.error('🚨 [Anti-Crash] Uncaught Exception caught:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('🚨 [Anti-Crash] Unhandled Rejection caught:', reason);
});

// Anti-Sleep Keep-Alive Engine: Pings itself every 3 minutes so Railway/Cloud hosts never idle or sleep
function startAntiSleepHeartbeat(port: number) {
  const INTERVAL_MS = 3 * 60 * 1000;
  console.log('⏰ [Anti-Sleep] Dual Keep-Alive Heartbeat service active (interval: 3m).');

  setInterval(async () => {
    // 1. Internal Loopback ping to keep Node event loop and socket hot
    try {
      await fetch(`http://127.0.0.1:${port}/api/ping`, { signal: AbortSignal.timeout(6000) });
    } catch {}

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
      } catch {}
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
    const candidates = [
      path.resolve(process.cwd(), 'dist'),
      path.resolve(__dirname, '..', 'dist'),
      path.resolve(__dirname, 'dist'),
    ];
    const distDir = candidates.find((d) => fs.existsSync(d)) || path.resolve(process.cwd(), 'dist');

    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NeuroBoost Server running on http://0.0.0.0:${PORT}`);

    // Launch Anti-Sleep keep-alive loop
    startAntiSleepHeartbeat(PORT);

    // Launch Telegram bot listener if token is provided
    if (BOT_TOKEN && BOT_TOKEN.length > 15) {
      startTelegramBot(BOT_TOKEN);
    } else {
      console.warn('⚠️ [Telegram Bot] TELEGRAM_BOT_TOKEN is not provided in environment. Set TELEGRAM_BOT_TOKEN to start the bot.');
    }
  });
}

startServer();
