import type { Evidence, MedicalInformationResponse, OcrBlock, ProcessingDocument } from '@/types/documents';

export type ReviewStatus = 'pending_review' | 'approved' | 'corrected' | 'rejected';

export interface ReviewField {
  id: string;
  evidence: Evidence;
  originalValue: string;
  value: string;
  status: ReviewStatus;
}

export interface ReviewFieldRequest {
  field: string;
  original_value: string;
  value: string;
  status: ReviewStatus;
  source_text: string;
  match_type: string;
  page: number | null;
  confidence: number | null;
}

export interface ReviewRequest {
  fields: ReviewFieldRequest[];
  reviewed_by?: string | null;
}

export interface ReviewSummary {
  total_fields: number;
  pending_fields: number;
  approved_fields: number;
  corrected_fields: number;
  rejected_fields: number;
}

export interface ReviewResponse {
  document_id: string;
  status: 'reviewing' | 'approved';
  reviewed_at: string;
  reviewed_by: string | null;
  patient_name: string | null;
  summary: ReviewSummary;
  parsed_information: MedicalInformationResponse;
}

export interface DocumentPage {
  number: number;
  src: string | null;
  label: string;
  blocks: OcrBlock[];
}

export type ReviewDocument = ProcessingDocument;
