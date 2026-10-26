import React from 'react';
import {
  MessageSquare,
  Stethoscope,
  ShieldAlert,
  FileCode,
  Layers,
  Sparkles,
  Users,
  ChevronDown,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { TelegramBotSimulator } from './components/TelegramBotSimulator';
import { TelegramMiniApp } from './components/TelegramMiniApp';
import { SpecialistConsole } from './components/SpecialistConsole';
import { OwnerConsole } from './components/OwnerConsole';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { UserRole } from './types';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, switchUser } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 font-bold text-white text-base">
              NB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">NeuroBoost</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                  aiogram 3.x • PG15+
                </span>
              </div>
              <p className="text-[11px] text-cyan-400 font-medium">
                Личный опыт, разбор открытых данных • @DonDearOfficinaAI
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/70 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('bot')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                activeTab === 'bot'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Симулятор бота @DonDearOfficinaAI</span>
            </button>

            <button
              onClick={() => setActiveTab('miniapp')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition relative ${
                activeTab === 'miniapp'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Telegram Mini App</span>
              <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                TMA
              </span>
            </button>

            <button
              onClick={() => setActiveTab('specialist_console')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                activeTab === 'specialist_console'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Консоль Специалиста</span>
            </button>

            <button
              onClick={() => setActiveTab('owner_console')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                activeTab === 'owner_console'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="text-amber-400">👑</span>
              <span>Консоль Владельца</span>
            </button>

            <button
              onClick={() => setActiveTab('codebase')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                activeTab === 'codebase'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Код Python 3.11</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                activeTab === 'architecture'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Архитектура</span>
            </button>
          </nav>

          {/* Quick Persona Switcher for Reviewer Convenience */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 hidden sm:inline">Роль:</span>
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
              <button
                onClick={() => switchUser('user')}
                title="Переключиться на Пациента"
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                  currentUser.role === 'user' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Пациент
              </button>
              <button
                onClick={() => switchUser('specialist')}
                title="Переключиться на Врача"
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                  currentUser.role === 'specialist' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Врач
              </button>
              <button
                onClick={() => switchUser('owner')}
                title="Переключиться на @DonDearOfficina"
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                  currentUser.role === 'owner' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Владелец
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden px-4 py-2 border-t border-slate-800 overflow-x-auto gap-1 text-xs">
          <button
            onClick={() => setActiveTab('bot')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'bot' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Бот
          </button>
          <button
            onClick={() => setActiveTab('miniapp')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'miniapp' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            <span>📱 Mini App</span>
          </button>
          <button
            onClick={() => setActiveTab('specialist_console')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'specialist_console' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Специалист
          </button>
          <button
            onClick={() => setActiveTab('owner_console')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'owner_console' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Владелец
          </button>
          <button
            onClick={() => setActiveTab('codebase')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'codebase' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Python 3.11 Код
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'architecture' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Архитектура
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'bot' && <TelegramBotSimulator />}
        {activeTab === 'miniapp' && <TelegramMiniApp />}
        {activeTab === 'specialist_console' && <SpecialistConsole />}
        {activeTab === 'owner_console' && <OwnerConsole />}
        {activeTab === 'codebase' && <CodebaseExplorer />}
        {activeTab === 'architecture' && <ArchitectureDocs />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            NeuroBoost System • Личный опыт, разбор открытых данных • Telegram-бот: <b>@DonDearOfficinaAI</b>
          </span>
          <span className="text-[11px] text-slate-500">
            Стек: Python 3.11 • aiogram 3.x • PostgreSQL 15+ • SQLAlchemy 2.0 • Redis
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
