import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DocumentManager } from './components/DocumentManager';
import { ChatWorkspace } from './components/ChatWorkspace';
import { CitationInspector } from './components/CitationInspector';
import {
  fetchHealth,
  fetchDocuments,
  uploadFile,
  ingestRawText,
  deleteDocument,
  streamQuery,
} from './services/api.service';
import type { DocumentSummary, HealthStatus, Message, Citation } from './types';
import { PanelsTopLeft, Bookmark, Layers } from 'lucide-react';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>();
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const [topScore, setTopScore] = useState<number | undefined>();
  const [highlightedCitationIndex, setHighlightedCitationIndex] = useState<number | undefined>();

  // Mobile layout toggles
  const [mobileTab, setMobileTab] = useState<'docs' | 'chat' | 'citations'>('chat');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Initial load & polling health
  useEffect(() => {
    loadHealth();
    loadDocuments();

    const interval = setInterval(loadHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      console.error('Health check failed', err);
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
  };

  const handleUploadFile = async (file: File) => {
    await uploadFile(file);
    await loadDocuments();
  };

  const handleIngestText = async (text: string, filename: string) => {
    await ingestRawText(text, filename);
    await loadDocuments();
  };

  const handleDeleteDocument = async (id: string) => {
    await deleteDocument(id);
    await loadDocuments();
    if (selectedDocId === id) {
      setSelectedDocId(undefined);
    }
  };

  const handleClearChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setMessages([]);
    setActiveCitations([]);
    setTopScore(undefined);
    setHighlightedCitationIndex(undefined);
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleSendMessage = async (questionText: string) => {
    if (isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: questionText,
      timestamp: new Date().toISOString(),
    };

    const assistantMessageId = crypto.randomUUID();
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsStreaming(true);
    setActiveCitations([]);
    setTopScore(undefined);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedContent = '';

    await streamQuery({
      question: questionText,
      documentId: selectedDocId,
      signal: abortController.signal,
      onStart: () => {
        // Stream begun
      },
      onToken: (token) => {
        accumulatedContent += token;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent, isStreaming: true }
              : msg
          )
        );
      },
      onCitations: (citations, score) => {
        setActiveCitations(citations);
        setTopScore(score);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  citations,
                  topScore: score,
                }
              : msg
          )
        );
      },
      onDone: () => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      },
      onError: (err) => {
        console.error('Stream error:', err);
        setIsStreaming(false);
        abortControllerRef.current = null;
        const errorMessage = `⚠️ Error en la respuesta: ${err.message}`;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: accumulatedContent ? `${accumulatedContent}\n\n${errorMessage}` : errorMessage,
                  isStreaming: false,
                }
              : msg
          )
        );
      },
    });
  };

  const handleCitationClick = (citation: Citation) => {
    const idx = activeCitations.findIndex(
      (c) => c.documentId === citation.documentId && c.chunkIndex === citation.chunkIndex
    );
    if (idx !== -1) {
      setHighlightedCitationIndex(idx);
    }
    setMobileTab('citations');
  };

  const selectedDoc = documents.find((d) => d.documentId === selectedDocId);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#08090d] text-slate-100">
      {/* Top Navbar */}
      <Navbar
        health={health}
        documentCount={documents.length}
        onClearChat={handleClearChat}
        hasMessages={messages.length > 0}
      />

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-white/[0.08] bg-zinc-950/80 px-2 py-1.5 gap-1 shrink-0">
        <button
          onClick={() => setMobileTab('docs')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'docs'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Docs ({documents.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'chat'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PanelsTopLeft className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => setMobileTab('citations')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'citations'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Citas ({activeCitations.length})</span>
        </button>
      </div>

      {/*
        Main area: flex-1 takes exactly the remaining vertical space after navbar.
        overflow-hidden prevents any page-level scroll — each panel
        handles its own internal scroll independently.
      */}
      <main className="flex-1 overflow-hidden px-3 pb-4 pt-3 sm:px-4 sm:pb-5 sm:pt-4 md:px-5 md:pb-5 md:pt-4 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">
          {/* Left Column: Document Manager (4 cols on md, 3 cols on lg) */}
          <div
            className={`min-h-0 md:col-span-4 lg:col-span-3 ${
              mobileTab === 'docs' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
            }`}
          >
            <DocumentManager
              documents={documents}
              onUploadFile={handleUploadFile}
              onIngestText={handleIngestText}
              onDeleteDocument={handleDeleteDocument}
              isLoading={false}
              selectedDocId={selectedDocId}
              onSelectDoc={(id) => setSelectedDocId(id)}
            />
          </div>

          {/* Center Column: Chat Workspace (8 cols on md, 6 cols on lg) */}
          <div
            className={`min-h-0 md:col-span-8 lg:col-span-6 ${
              mobileTab === 'chat' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
            }`}
          >
            <ChatWorkspace
              messages={messages}
              onSendMessage={handleSendMessage}
              onStopStreaming={handleStopStreaming}
              isStreaming={isStreaming}
              onCitationClick={handleCitationClick}
              activeFilterDocName={selectedDoc?.filename}
              onClearFilter={() => setSelectedDocId(undefined)}
            />
          </div>

          {/* Right Column: Citation Inspector (3 cols on lg+) */}
          <div
            className={`min-h-0 hidden lg:flex lg:flex-col lg:col-span-3 ${
              mobileTab === 'citations' ? '!flex' : ''
            }`}
          >
            <CitationInspector
              citations={activeCitations}
              topScore={topScore}
              highlightedIndex={highlightedCitationIndex}
              onSelectCitation={(idx) => setHighlightedCitationIndex(idx)}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
