import type { Citation, DocumentSummary, HealthStatus } from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed with status ${res.status}`);
  return res.json();
}

export async function fetchDocuments(): Promise<DocumentSummary[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  const json = await res.json();
  return json.data || [];
}

export async function uploadFile(file: File): Promise<{ documentId: string; filename: string; totalChunks: number }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to upload document');
  }
  return json.data;
}

export async function ingestRawText(text: string, filename: string = 'notes.txt'): Promise<{ documentId: string; filename: string; totalChunks: number }> {
  const res = await fetch(`${API_BASE}/documents/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, filename }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to ingest text');
  }
  return json.data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Failed to delete document');
  }
}

export interface StreamQueryOptions {
  question: string;
  topK?: number;
  similarityThreshold?: number;
  documentId?: string;
  onStart?: () => void;
  onToken: (token: string) => void;
  onCitations: (citations: Citation[], topScore?: number) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export async function streamQuery({
  question,
  topK,
  similarityThreshold,
  documentId,
  onStart,
  onToken,
  onCitations,
  onDone,
  onError,
  signal,
}: StreamQueryOptions): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/query/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        topK,
        similarityThreshold,
        documentId,
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by browser or response has no body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // retain incomplete last line

      let currentEvent = '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          currentEvent = '';
          continue;
        }

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.replace('event:', '').trim();
        } else if (trimmed.startsWith('data:')) {
          const rawData = trimmed.replace('data:', '').trim();
          try {
            const data = JSON.parse(rawData);

            if (currentEvent === 'start') {
              onStart?.();
            } else if (currentEvent === 'token') {
              onToken(data.token || '');
            } else if (currentEvent === 'citations') {
              onCitations(data.citations || [], data.topScore);
            } else if (currentEvent === 'done') {
              onDone();
            } else if (currentEvent === 'error') {
              onError(new Error(data.error || 'Unknown SSE streaming error'));
            }
          } catch (e) {
            console.error('Failed to parse SSE line data:', rawData, e);
          }
        }
      }
    }

    onDone();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('Stream query aborted by user');
      onDone();
      return;
    }
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
