import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ProcessingDocument } from '@/types/documents';

interface DocumentsContextValue { documents: ProcessingDocument[]; activeDocument: ProcessingDocument | null; addDocument: (document: ProcessingDocument) => void; updateDocument: (id: string, patch: Partial<ProcessingDocument>) => void; selectDocument: (id: string) => void; }
const Context = createContext<DocumentsContextValue | undefined>(undefined);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  // Clinical OCR data remains in memory; it is never persisted to browser storage.
  const [documents, setDocuments] = useState<ProcessingDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const value = useMemo<DocumentsContextValue>(() => ({
    documents, activeDocument: documents.find((document) => document.id === selectedId) ?? documents[0] ?? null,
    addDocument: (document) => { setDocuments((current) => [document, ...current]); setSelectedId(document.id); },
    updateDocument: (id, patch) => setDocuments((current) => current.map((document) => document.id === id ? { ...document, ...patch } : document)),
    selectDocument: setSelectedId,
  }), [documents, selectedId]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useDocuments = () => { const context = useContext(Context); if (!context) throw new Error('useDocuments debe usarse dentro de DocumentsProvider'); return context; };
