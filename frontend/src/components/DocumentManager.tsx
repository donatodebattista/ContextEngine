import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Layers,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode2,
} from 'lucide-react';
import type { DocumentSummary } from '../types';

interface DocumentManagerProps {
  documents: DocumentSummary[];
  onUploadFile: (file: File) => Promise<void>;
  onIngestText: (text: string, filename: string) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  isLoading: boolean;
  selectedDocId?: string;
  onSelectDoc?: (docId: string | undefined) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  onUploadFile,
  onIngestText,
  onDeleteDocument,
  selectedDocId,
  onSelectDoc,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [rawText, setRawText] = useState('');
  const [textFilename, setTextFilename] = useState('nota-rapida.txt');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFileUpload(e.target.files[0]);
      e.target.value = ''; // reset
    }
  };

  const processFileUpload = async (file: File) => {
    setIsProcessing(true);
    setActionError(null);
    setProcessStatus(`Procesando ${file.name} (Chunking & Embeddings)...`);
    try {
      await onUploadFile(file);
      setProcessStatus('¡Documento indexado con éxito!');
      setTimeout(() => setProcessStatus(''), 2500);
    } catch (err: any) {
      setActionError(err.message || 'Error al procesar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || rawText.trim().length < 10) {
      setActionError('El texto debe tener al menos 10 caracteres.');
      return;
    }

    setIsProcessing(true);
    setActionError(null);
    setProcessStatus('Indexando contenido de texto...');
    try {
      await onIngestText(rawText, textFilename || 'nota.txt');
      setRawText('');
      setProcessStatus('¡Texto indexado correctamente!');
      setTimeout(() => setProcessStatus(''), 2500);
    } catch (err: any) {
      setActionError(err.message || 'Error al indexar texto');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Seguro que deseas eliminar este documento y sus vectores de Qdrant?')) {
      return;
    }
    setDeletingId(id);
    try {
      await onDeleteDocument(id);
      if (selectedDocId === id && onSelectDoc) {
        onSelectDoc(undefined);
      }
    } catch (err: any) {
      setActionError(err.message || 'Error al eliminar el documento');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden">
      {/* Header Tabs */}
      <div className="p-4 border-b border-white/[0.08] bg-zinc-950/40">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wide truncate">
              Base de Conocimiento
            </h2>
          </div>
          <span className="shrink-0 whitespace-nowrap text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">
            {documents.length} {documents.length === 1 ? 'doc' : 'docs'}
          </span>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900/80 rounded-xl border border-white/[0.05]">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Subir Archivo
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'text'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Ingesta de Texto
          </button>
        </div>
      </div>

      {/* Ingestion Area */}
      <div className="p-4 border-b border-white/[0.08] bg-zinc-900/20">
        {activeTab === 'upload' ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer group ${
              isDragging
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-zinc-700 hover:border-indigo-400/60 bg-zinc-900/40 hover:bg-indigo-500/[0.04]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.txt,.md,.json"
              className="hidden"
            />
            <div className="w-10 h-10 mx-auto rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all mb-2">
              <UploadCloud className="w-5 h-5 text-indigo-400 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-xs font-medium text-slate-200 mb-1">
              Arrastra tu PDF aquí o <span className="text-cyan-400 underline">haz clic</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Soporta PDF, Markdown, TXT y JSON (hasta 20MB)
            </p>
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} className="space-y-2.5">
            <input
              type="text"
              value={textFilename}
              onChange={(e) => setTextFilename(e.target.value)}
              placeholder="Nombre del documento (ej. requisitos.txt)"
              className="w-full px-3 py-1.5 text-xs bg-zinc-900/80 border border-zinc-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Pega aquí el contenido de texto que deseas que el motor RAG indexe..."
              rows={3}
              className="w-full px-3 py-2 text-xs bg-zinc-900/80 border border-zinc-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <button
              type="submit"
              disabled={isProcessing || !rawText.trim()}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {isProcessing ? 'Vectorizando...' : 'Indexar en Qdrant'}
            </button>
          </form>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-3 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-xs text-indigo-300 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
            <span>{processStatus || 'Procesando pipeline de ingesta...'}</span>
          </div>
        )}

        {/* Success / Error alerts */}
        {!isProcessing && processStatus && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{processStatus}</span>
          </div>
        )}

        {actionError && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </div>

      {/* Document Library / Search Filter */}
      <div className="p-3 border-b border-white/[0.06] bg-zinc-950/20">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar entre documentos indexados..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900/60 border border-zinc-800 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
          />
        </div>
      </div>

      {/* Document Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredDocs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <FileText className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
            <p>No hay documentos indexados aún.</p>
            <p className="text-[11px] text-zinc-600 mt-1">
              Sube un PDF o añade texto para que el RAG empiece a responder con contexto.
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isPdf = doc.filename.toLowerCase().endsWith('.pdf');
            const isSelected = selectedDocId === doc.documentId;

            return (
              <div
                key={doc.documentId}
                onClick={() => onSelectDoc?.(isSelected ? undefined : doc.documentId)}
                className={`p-3 rounded-xl border transition-all cursor-pointer group flex items-start justify-between gap-2 ${
                  isSelected
                    ? 'bg-indigo-500/15 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : 'bg-zinc-900/40 hover:bg-zinc-800/60 border-white/[0.04] hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isPdf
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}
                  >
                    {isPdf ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <FileCode2 className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                      {doc.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-indigo-300">
                        <Layers className="w-3 h-3 text-indigo-400" />
                        {doc.totalChunks} chunks
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(doc.documentId, e)}
                  disabled={deletingId === doc.documentId}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Eliminar de la base vectorial"
                >
                  {deletingId === doc.documentId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
