import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ProcessingDocument } from '@/types/documents';

interface DocumentsContextValue { documents: ProcessingDocument[]; activeDocument: ProcessingDocument | null; addDocument: (document: ProcessingDocument) => void; updateDocument: (id: string, patch: Partial<ProcessingDocument>) => void; selectDocument: (id: string) => void; }
const STORAGE_KEY = 'docdaiweb.processing.documents';
const Context = createContext<DocumentsContextValue | undefined>(undefined);
const readDocuments = (): ProcessingDocument[] => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ProcessingDocument[]; } catch { return []; } };

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<ProcessingDocument[]>(readDocuments);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const persist = (next: ProcessingDocument[]) => { setDocuments(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next.map(({ previewUrl: _previewUrl, ...document }) => document))); };
  const value = useMemo<DocumentsContextValue>(() => ({
    documents, activeDocument: documents.find((document) => document.id === selectedId) ?? documents[0] ?? null,
    addDocument: (document) => { persist([document, ...documents]); setSelectedId(document.id); },
    updateDocument: (id, patch) => persist(documents.map((document) => document.id === id ? { ...document, ...patch } : document)),
    selectDocument: setSelectedId,
  }), [documents, selectedId]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useDocuments = () => { const context = useContext(Context); if (!context) throw new Error('useDocuments debe usarse dentro de DocumentsProvider'); return context; };
