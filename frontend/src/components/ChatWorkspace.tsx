import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Square,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  Bookmark,
  Compass,
  ArrowRight,
} from 'lucide-react';
import type { Message, Citation } from '../types';

interface ChatWorkspaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  onCitationClick?: (citation: Citation) => void;
  activeFilterDocName?: string;
  onClearFilter?: () => void;
}

const STARTER_PROMPTS = [
  '¿De qué tratan los documentos que se encuentran indexados?',
  '¿Qué es la Arquitectura Hexagonal y cuáles son sus ventajas en este RAG?',
  'Resume los puntos clave de los textos subidos en viñetas ordenadas.',
  '¿Cómo previene el sistema las alucinaciones cuando no tiene contexto?',
];

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  messages,
  onSendMessage,
  onStopStreaming,
  isStreaming,
  onCitationClick,
  activeFilterDocName,
  onClearFilter,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden relative">
      {/* Active Filter notification banner */}
      {activeFilterDocName && (
        <div className="px-4 py-2 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Filtrando consultas exclusivamente sobre: <strong>{activeFilterDocName}</strong>
          </span>
          <button
            onClick={onClearFilter}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
          >
            Quitar filtro
          </button>
        </div>
      )}

      {/* Messages stream area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-xl shadow-indigo-500/30">
                <div className="w-full h-full bg-[#0a0c14] rounded-[15px] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#08090d]" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              ¿En qué puedo ayudarte hoy?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-8 leading-relaxed">
              Consulta en lenguaje natural sobre cualquier PDF o documento indexado.
              Las respuestas son fundamentadas con citas verificables y streaming en vivo.
            </p>

            {/* Quick Starters */}
            <div className="w-full space-y-2 text-left">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Consultas sugeridas</span>
              </div>
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="w-full p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/[0.05] hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <div
                key={message.id}
                className={`flex gap-3.5 sm:gap-4 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-[1px] shrink-0 shadow-md shadow-indigo-500/20 mt-1">
                    <div className="w-full h-full bg-[#0a0c14] rounded-[11px] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-cyan-400" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 shadow-lg ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-sm'
                      : 'glass-card border border-white/[0.07] text-slate-200 rounded-tl-sm'
                  }`}
                >
                  {/* User Question */}
                  {isUser ? (
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  ) : (
                    /* Assistant Markdown Answer */
                    <div className="text-xs sm:text-sm leading-relaxed prose prose-invert prose-indigo max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ inline, className, children, ...props }: any) {
                            const codeString = String(children).replace(/\n$/, '');
                            const codeId = `${message.id}-${codeString.slice(0, 10)}`;

                            if (inline) {
                              return (
                                <code
                                  className="px-1.5 py-0.5 rounded bg-zinc-800/90 text-cyan-300 font-mono text-[11px] sm:text-xs border border-white/[0.06]"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            }

                            return (
                              <div className="relative my-3 rounded-xl overflow-hidden border border-white/[0.08] bg-zinc-950/90">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-white/[0.06] text-[11px] text-slate-400 font-mono">
                                  <span>código</span>
                                  <button
                                    onClick={() => copyToClipboard(codeString, codeId)}
                                    className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                                  >
                                    {copiedCodeId === codeId ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-emerald-400">Copiado</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copiar</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="p-3 text-[11px] sm:text-xs font-mono text-slate-200 overflow-x-auto">
                                  <code>{children}</code>
                                </pre>
                              </div>
                            );
                          },
                          p({ children }: any) {
                            return <p className="mb-2.5 last:mb-0">{children}</p>;
                          },
                          ul({ children }: any) {
                            return <ul className="list-disc pl-5 mb-2.5 space-y-1">{children}</ul>;
                          },
                          ol({ children }: any) {
                            return <ol className="list-decimal pl-5 mb-2.5 space-y-1">{children}</ol>;
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>

                      {/* Streaming cursor */}
                      {message.isStreaming && (
                        <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse rounded-sm align-middle" />
                      )}

                      {/* In-answer Citations Pills */}
                      {message.citations && message.citations.length > 0 && !message.isStreaming && (
                        <div className="mt-4 pt-3 border-t border-white/[0.08]">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Bookmark className="w-3 h-3 text-cyan-400" />
                            Fuentes fundamentadas en esta respuesta:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {message.citations.map((c, i) => (
                              <button
                                key={i}
                                onClick={() => onCitationClick?.(c)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/[0.06] hover:border-cyan-500/40 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer group"
                                title={`Página ${c.pageNumber || 'N/A'} - Similitud: ${(c.similarityScore * 100).toFixed(1)}%`}
                              >
                                <span className="font-bold text-cyan-400">[{i + 1}]</span>
                                <span className="max-w-[140px] truncate">{c.filename}</span>
                                <span className="text-emerald-400 font-medium">
                                  {(c.similarityScore * 100).toFixed(0)}%
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`mt-2 text-[10px] text-right font-medium ${
                      isUser ? 'text-indigo-200/80' : 'text-slate-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 p-[1px] shrink-0 flex items-center justify-center mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-zinc-950/60 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? 'El modelo está respondiendo en vivo...'
                : 'Escribe tu pregunta sobre los documentos (Enter para enviar)...'
            }
            disabled={isStreaming}
            className="flex-1 max-h-32 min-h-[48px] py-3 pl-4 pr-12 text-xs sm:text-sm bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 resize-none transition-all shadow-inner"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/30 transition-all cursor-pointer"
              title="Detener generación"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              title="Enviar pregunta"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>
            Presiona <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-slate-300 font-mono">Enter</kbd> para enviar, <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-slate-300 font-mono">Shift+Enter</kbd> para salto de línea
          </span>
          <span className="hidden sm:inline">Embeddings: 3072 dims • Qdrant HNSW</span>
        </div>
      </div>
    </div>
  );
};
