import { useMemo } from 'react';
import type { ProcessingDocument } from '@/types/documents';
import { preparedPageUrl } from '@/services/documents';
import type { DocumentPage } from '../types/ocrLayout.types';

const browserRenderable = (value?: string) => Boolean(value && /^(blob:|data:image\/|https?:\/\/)/.test(value));

export function useDocumentPages(document: ProcessingDocument | null): DocumentPage[] {
  return useMemo(() => {
    if (!document) return [];

    return Array.from({ length: document.pages ?? 1 }, (_, index) => {
    const prepared = document.preparedImages?.[index];
    const number = index + 1;
    const src = browserRenderable(prepared) ? prepared! : document.id ? preparedPageUrl(document.id, number) : index === 0 && browserRenderable(document.previewUrl) ? document.previewUrl! : null;
    return { number, src, label: `Página ${number}`, blocks: document.ocr?.page_results.find((page) => page.page === number)?.blocks ?? [] };
    });
  }, [document]);
}
