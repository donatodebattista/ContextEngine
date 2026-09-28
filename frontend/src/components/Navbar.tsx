import { Database, Sparkles, Server, Trash2, Cpu, ShieldCheck, Activity } from 'lucide-react';
import type { HealthStatus } from '../types';

interface NavbarProps {
  health: HealthStatus | null;
  documentCount: number;
  onClearChat: () => void;
  hasMessages: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  documentCount,
  onClearChat,
  hasMessages,
}) => {
  const isQdrantHealthy = health?.services.qdrant.status === 'ok';
  const isApiHealthy = health?.status === 'healthy';

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/[0.08] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0d0f18] rounded-[11px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#090a0f] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                ContextEngine
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v2.0 Production
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Arquitectura Hexagonal & RAG
            </p>
          </div>
        </div>

        {/* Live Service Indicators */}
        <div className="hidden md:flex items-center gap-2">
          {/* API Status */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isApiHealthy
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
            title={isApiHealthy ? 'API REST / SSE Operativa' : 'API no responde'}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>API</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isApiHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
          </div>

          {/* Qdrant Status */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isQdrantHealthy
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
            title={isQdrantHealthy ? 'Qdrant Vector DB conectado' : 'Qdrant no responde'}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Qdrant HNSW</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isQdrantHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
          </div>

          {/* Gemini AI Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Gemini 2.5 Flash</span>
          </div>

          {/* Indexed Docs Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-white/[0.06] text-xs font-medium text-slate-300">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>Documentos:</span>
            <span className="font-semibold text-white px-1.5 py-0.2 bg-zinc-700/60 rounded">
              {documentCount}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {hasMessages && (
            <button
              onClick={onClearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-zinc-800/40 hover:bg-zinc-800/80 border border-white/[0.06] rounded-lg transition-colors cursor-pointer"
              title="Limpiar historial de conversación"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400/80" />
              <span className="hidden sm:inline">Limpiar chat</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
