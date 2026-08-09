import type { Evidence, OcrBlock, ProcessingDocument } from '@/types/documents';

export type ReviewStatus = 'pending_review' | 'approved' | 'corrected' | 'rejected';

export interface ReviewField {
  id: string;
  evidence: Evidence;
  originalValue: string;
  value: string;
  status: ReviewStatus;
}

export interface DocumentPage {
  number: number;
  src: string | null;
  label: string;
  blocks: OcrBlock[];
}

export type ReviewDocument = ProcessingDocument;
