import React, { useState } from 'react';
import { Bookmark, ChevronRight, Sparkles, Percent } from 'lucide-react';
import type { Citation } from '../types';

interface CitationInspectorProps {
  citations: Citation[];
  topScore?: number;
  highlightedIndex?: number;
  onSelectCitation?: (index: number) => void;
}

export const CitationInspector: React.FC<CitationInspectorProps> = ({
  citations,
  topScore,
  highlightedIndex,
  onSelectCitation,
}) => {
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'from-emerald-500 to-teal-400 text-emerald-400';
    if (score >= 0.7) return 'from-cyan-500 to-blue-400 text-cyan-400';
    return 'from-amber-500 to-yellow-400 text-amber-400';
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] bg-zinc-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Inspector de Citas & Fuentes
          </h2>
        </div>

        {citations.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{citations.length} fuentes</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {citations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center mb-3">
              <Bookmark className="w-6 h-6 text-zinc-600" />
            </div>
            <p className="text-xs font-medium text-slate-300 mb-1">
              Sin citas activas en esta consulta
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              Cuando el modelo responda basándose en tus documentos, verás aquí los fragmentos exactos y sus porcentajes de similitud semántica.
            </p>
          </div>
        ) : (
          <>
            {topScore !== undefined && topScore > 0 && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
                <span className="text-indigo-200 font-medium">Relevancia máxima:</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-cyan-400" />
                  {(topScore * 100).toFixed(1)}%
                </span>
              </div>
            )}

            {citations.map((citation, index) => {
              const isHighlighted = highlightedIndex === index;
              const isExpanded = expandedIndices[index] ?? false;
              const scorePercent = Math.min(Math.round(citation.similarityScore * 100), 100);
              const scoreColorClass = getScoreColor(citation.similarityScore);

              return (
                <div
                  key={`${citation.documentId}-${citation.chunkIndex}-${index}`}
                  onClick={() => {
                    onSelectCitation?.(index);
                    toggleExpand(index);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isHighlighted
                      ? 'bg-cyan-500/15 border-cyan-400/60 shadow-lg shadow-cyan-500/10'
                      : 'bg-zinc-900/50 hover:bg-zinc-850 border-white/[0.06] hover:border-zinc-700'
                  }`}
                >
                  {/* Top line: source badge and similarity */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                        Fuente {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {citation.filename}
                      </span>
                    </div>

                    <span className="text-xs font-bold shrink-0 flex items-center gap-1 text-slate-300">
                      <span className={scoreColorClass}>{scorePercent}%</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-2.5 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${scoreColorClass} transition-all duration-500`}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>

                  {/* Badges: Page and chunk */}
                  <div className="flex items-center gap-2 mb-2 text-[11px] text-slate-400">
                    {citation.pageNumber !== undefined && (
                      <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-white/[0.04] text-slate-300 font-medium">
                        Página {citation.pageNumber}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-white/[0.04] text-slate-400">
                      Chunk #{citation.chunkIndex}
                    </span>
                  </div>

                  {/* Snippet quote */}
                  <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-white/[0.04] text-xs font-mono text-slate-300 leading-relaxed">
                    <p className={isExpanded ? '' : 'line-clamp-3'}>
                      "{citation.snippet}"
                    </p>
                  </div>

                  <div className="flex items-center justify-end mt-2 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium">
                    <span className="flex items-center gap-0.5">
                      {isExpanded ? 'Ver menos' : 'Ver fragmento completo'}
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
