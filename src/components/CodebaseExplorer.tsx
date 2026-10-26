import React, { useState } from 'react';
import {
  FileCode,
  FolderTree,
  Download,
  Copy,
  Check,
  Terminal,
  Server,
  Database,
  Layers,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import JSZip from 'jszip';
import { PYTHON_CODEBASE, CodeFile } from '../codebase/pythonFiles';

export const CodebaseExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(PYTHON_CODEBASE[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const copyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadZipArchive = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      PYTHON_CODEBASE.forEach((file) => {
        zip.file(file.path, file.content);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'neuroboost_telegram_bot_python.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const filteredFiles = PYTHON_CODEBASE.filter((f) => {
    if (filterCategory === 'all') return true;
    return f.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with ZIP Download */}
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🐍</span>
            <h1 className="text-xl font-bold text-white">Исходный код моноприложения (Python 3.11 + aiogram 3.x)</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              ГОТОВО К ДЕПЛОЮ
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Полный монолит: асинхронный Telegram-бот, база PostgreSQL 15+ с append-only триггерами,
            планировщик регламентных задач APScheduler, FastAPI эндпоинты и Dockerfile.
          </p>
        </div>

        <button
          onClick={downloadZipArchive}
          disabled={isZipping}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-60 text-white font-semibold text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-600/20"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'Архивация...' : 'Скачать полный ZIP проекта'}</span>
        </button>
      </div>

      {/* Main Code Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Column: File Tree */}
        <div className="lg:col-span-4 bg-slate-900/80 rounded-2xl p-4 border border-slate-700 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <FolderTree className="w-4 h-4 text-cyan-400" />
              <span>Дерево файлов проекта</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">{filteredFiles.length} файлов</span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1 mb-3 text-[11px]">
            {['all', 'bot', 'db', 'cron', 'deploy'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg transition capitalize ${
                  filterCategory === cat
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
            {filteredFiles.map((f) => {
              const isSelected = selectedFile.path === f.path;
              return (
                <button
                  key={f.path}
                  onClick={() => setSelectedFile(f)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isSelected ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    />
                    <span className="truncate font-mono text-[11px]">{f.path}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase">{f.category}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
            Запуск: <code>docker compose up --build -d</code>
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-slate-800/80 px-4 py-3 flex items-center justify-between border-b border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white">{selectedFile.path}</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 font-semibold">
                  {selectedFile.language}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedFile.description}</p>
            </div>

            <button
              onClick={copyCode}
              className="px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>
          </div>

          {/* Code Window */}
          <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
            <pre>
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
