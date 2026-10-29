import fs from 'fs';
import path from 'path';

export interface UserSessionData {
  userId: number;
  username?: string;
  firstName?: string;
  confirmedStart: boolean;
  startedAt: string | null;
  currentPhase: 1 | 2 | 3 | 4;
  gastroDayChecks: Record<string, boolean>;
  workoutLogs: Record<string, { date: string; completedExercises: string[] }>;
  weightDiary: Array<{
    id: string;
    date: string;
    weightKg: number;
    notes?: string;
    createdAt: string;
  }>;
  lastActive: string;
}

export interface StoreSchema {
  version: number;
  updatedAt: string;
  users: Record<string, UserSessionData>;
  processedWebhookEvents: Record<string, string>; // eventId -> processedAt
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'neuroboost_store.json');
const BACKUP_FILE = path.join(DATA_DIR, 'neuroboost_store.backup.json');

class PersistentStorage {
  private data: StoreSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = {
      version: 1,
      updatedAt: new Date().toISOString(),
      users: {},
      processedWebhookEvents: {},
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.data = {
            version: parsed.version || 1,
            updatedAt: parsed.updatedAt || new Date().toISOString(),
            users: parsed.users || {},
            processedWebhookEvents: parsed.processedWebhookEvents || {},
          };
          console.log(`💾 [Storage] Loaded persistent store with ${Object.keys(this.data.users).length} user session(s).`);
        }
      } else {
        this.flushSync();
        console.log('💾 [Storage] Initialized new persistent store.');
      }
    } catch (err: any) {
      console.error('⚠️ [Storage] Error reading store, attempting recovery from backup:', err.message);
      if (fs.existsSync(BACKUP_FILE)) {
        try {
          const backupRaw = fs.readFileSync(BACKUP_FILE, 'utf-8');
          this.data = JSON.parse(backupRaw);
          console.log('💾 [Storage] Successfully recovered store from backup.');
        } catch {
          console.error('❌ [Storage] Backup recovery failed, initializing clean store.');
        }
      }
    }
  }

  private flushSync() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      this.data.updatedAt = new Date().toISOString();
      const content = JSON.stringify(this.data, null, 2);
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, content, 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
      // Also update backup
      fs.writeFileSync(BACKUP_FILE, content, 'utf-8');
    } catch (err: any) {
      console.error('❌ [Storage] Failed to flush store to disk:', err.message);
    }
  }

  public scheduleSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.flushSync();
    }, 1000);
  }

  public getUser(userId: number): UserSessionData {
    const key = String(userId);
    if (!this.data.users[key]) {
      this.data.users[key] = {
        userId,
        confirmedStart: false,
        startedAt: null,
        currentPhase: 1,
        gastroDayChecks: {},
        workoutLogs: {},
        weightDiary: [],
        lastActive: new Date().toISOString(),
      };
      this.scheduleSave();
    }
    return this.data.users[key];
  }

  public updateUser(userId: number, updater: (u: UserSessionData) => void): UserSessionData {
    const user = this.getUser(userId);
    updater(user);
    user.lastActive = new Date().toISOString();
    this.scheduleSave();
    return user;
  }

  public addWeightEntry(userId: number, weightKg: number, notes?: string) {
    return this.updateUser(userId, (u) => {
      if (!u.weightDiary) u.weightDiary = [];
      u.weightDiary.unshift({
        id: `wt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        date: new Date().toISOString().split('T')[0],
        weightKg,
        notes: notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      // Keep last 60 entries
      if (u.weightDiary.length > 60) {
        u.weightDiary = u.weightDiary.slice(0, 60);
      }
    });
  }

  public deleteWeightEntry(userId: number, entryId: string) {
    return this.updateUser(userId, (u) => {
      if (!u.weightDiary) return;
      u.weightDiary = u.weightDiary.filter((w) => w.id !== entryId);
    });
  }

  public recordWorkoutExercise(userId: number, exerciseKey: string, dateStr: string): boolean {
    let nowDone = false;
    this.updateUser(userId, (u) => {
      if (!u.workoutLogs) u.workoutLogs = {};
      if (!u.workoutLogs[dateStr]) {
        u.workoutLogs[dateStr] = { date: dateStr, completedExercises: [] };
      }
      const list = u.workoutLogs[dateStr].completedExercises;
      const idx = list.indexOf(exerciseKey);
      if (idx > -1) {
        list.splice(idx, 1);
        nowDone = false;
      } else {
        list.push(exerciseKey);
        nowDone = true;
      }
    });
    return nowDone;
  }

  public getWorkoutExercisesForDate(userId: number, dateStr: string): string[] {
    const u = this.getUser(userId);
    return u.workoutLogs?.[dateStr]?.completedExercises || [];
  }

  public isWebhookEventProcessed(eventId: string): boolean {
    return Boolean(this.data.processedWebhookEvents[eventId]);
  }

  public markWebhookEventProcessed(eventId: string) {
    this.data.processedWebhookEvents[eventId] = new Date().toISOString();
    // Keep max 1000 events to prevent growth
    const keys = Object.keys(this.data.processedWebhookEvents);
    if (keys.length > 1000) {
      for (let i = 0; i < keys.length - 1000; i++) {
        delete this.data.processedWebhookEvents[keys[i]];
      }
    }
    this.scheduleSave();
  }

  public getStats() {
    return {
      totalUsers: Object.keys(this.data.users).length,
      usersConfirmedCourse: Object.values(this.data.users).filter((u) => u.confirmedStart).length,
      totalWeightEntries: Object.values(this.data.users).reduce((acc, u) => acc + (u.weightDiary?.length || 0), 0),
      lastSaved: this.data.updatedAt,
    };
  }

  public close() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.flushSync();
  }
}

export const storage = new PersistentStorage();

// Handle graceful shutdown flush
process.on('SIGINT', () => {
  storage.close();
});
process.on('SIGTERM', () => {
  storage.close();
});
