export type AsyncState = 'idle' | 'loading' | 'success' | 'error';
export type DocumentStage = 'stored' | 'prepared' | 'processed' | 'pending_human_review' | 'reviewing' | 'approved' | 'rejected';

export interface DocumentUploadResponse { document_id: string; filename: string; status: 'stored'; detail: string; }
export interface PrepareDocumentResponse { document_id: string; status: 'prepared'; pages: number; images: string[]; }
export interface OcrBlock { text: string; confidence: number | null; polygon: Array<[number, number]>; }
export interface OcrPage { page: number; text: string; confidence: number | null; blocks: OcrBlock[]; }
export interface OCRResponse { document_id: string; status: 'processed'; pages: number; text: string; confidence: number; processing_time: number; page_results: OcrPage[]; }
export interface Medication { name: string; dose: string | null; frequency: string | null; presentation?: string | null; indication?: string | null; }
export interface Evidence { field: string; value: string; source_text: string; match_type: string; page: number | null; confidence: number | null; status: string; }
export interface MedicalInformationResponse {
  patient: { name: string | null; age: number | null } | null;
  diagnoses: string[]; medications: Medication[]; dates: string[]; doctor: string | null; institution: string | null; evidence: Evidence[];
}
export interface ClinicalPatient {
  id: string; name: string | null; age: number | null; date_of_birth: string | null;
  curp: string | null; nss: string | null; created_at: string; updated_at: string; is_active: boolean;
}
export interface PatientMedicalRecord {
  patient_id: string; diagnoses: string[]; medications: Medication[]; dates: string[];
  doctors: string[]; institutions: string[]; documents: string[]; updated_at: string | null;
}
export interface FinalizeDocumentResponse {
  document_id: string; action: 'created' | 'updated' | 'ambiguous_match';
  status: 'finalized' | 'ambiguous_match'; match_identifier: string | null;
  patient: ClinicalPatient | null; record: PatientMedicalRecord | null;
  candidates: PatientMatchCandidate[];
}
export interface PatientMatchCandidate { id: string; name: string | null; age: number | null; date_of_birth: string | null; curp_hint: string | null; nss_hint: string | null; }
export interface PatientListItem { id: string; full_name: string; age: number | null; date_of_birth: string | null; curp: string | null; nss: string | null; }
export interface PatientListResponse { items: PatientListItem[]; }
export interface PatientUpdateRequest { name?: string; age?: number | null; date_of_birth?: string | null; curp?: string | null; nss?: string | null; }
export interface PatientDocument { document_id: string; filename: string; created_at: string | null; }
export interface PatientDocumentListResponse { items: PatientDocument[]; }
export interface ProcessingDocument {
  id: string; filename: string; size: number; createdAt: string; stage: DocumentStage;
  pages?: number; preparedImages?: string[]; ocr?: OCRResponse; parsed?: MedicalInformationResponse; previewUrl?: string; targetPatientId?: string; patientId?: string; patientName?: string;
}
export type PipelineStep = 'upload' | 'prepare' | 'ocr' | 'parse' | 'review';
export type PipelineStepState = 'pending' | 'processing' | 'completed' | 'error';
export interface ProcessingLogEvent { id: string; timestamp: string; kind: 'processing' | 'success' | 'error' | 'review'; message: string; }
