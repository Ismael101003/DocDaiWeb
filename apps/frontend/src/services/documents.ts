import type { ClinicalPatient, DocumentUploadResponse, FinalizeDocumentResponse, MedicalInformationResponse, OCRResponse, PatientListResponse, PatientMedicalRecord, PrepareDocumentResponse } from '@/types/documents';

const configuredApiUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8001';
export const API_BASE_URL = configuredApiUrl.replace(/\/$/, '').endsWith('/api/v1') ? configuredApiUrl.replace(/\/$/, '') : `${configuredApiUrl.replace(/\/$/, '')}/api/v1`;
const DEFAULT_TIMEOUT_MS = 120_000;
const OCR_TIMEOUT_MS = 10 * 60_000;

export class ApiError extends Error { constructor(message: string, public status?: number) { super(message); } }

const devLog = (event: string, metadata: Record<string, unknown> = {}) => {
  if (import.meta.env.DEV) console.info(`[DocDaiWeb] ${new Date().toISOString()} ${event}`, metadata);
};

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = typeof body === 'object' && body && 'detail' in body && typeof body.detail === 'string' ? body.detail : 'No fue posible completar la solicitud.';
      throw new ApiError(detail, response.status);
    }
    return body as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new ApiError('La solicitud excedió el tiempo de espera.');
    throw error;
  } finally { window.clearTimeout(timeout); }
}

export const uploadDocument = (file: File) => { const data = new FormData(); data.append('file', file); devLog('Subiendo documento', { size: file.size }); return request<DocumentUploadResponse>('/documents/upload', { method: 'POST', body: data }); };
export const prepareDocument = (id: string) => { devLog('Preparando documento', { documentId: id }); return request<PrepareDocumentResponse>(`/documents/${id}/prepare`, { method: 'POST' }); };
export const extractOCR = (id: string) => { devLog('Iniciando OCR', { documentId: id }); return request<OCRResponse>(`/documents/${id}/ocr`, { method: 'POST' }, OCR_TIMEOUT_MS); };
export const parseMedicalInformation = (id: string) => { devLog('Analizando información médica', { documentId: id }); return request<MedicalInformationResponse>(`/documents/${id}/parse`, { method: 'POST' }); };
export const finalizeDocument = (id: string, patientId?: string) => {
  devLog('Finalizando documento', { documentId: id, patientId: patientId ?? null });
  return request<FinalizeDocumentResponse>(`/documents/${encodeURIComponent(id)}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientId ? { patient_id: patientId } : {}),
  });
};
export const getPatient = (id: string) => request<ClinicalPatient>(`/patients/${encodeURIComponent(id)}`);
export const getPatientMedicalRecord = (id: string) => request<PatientMedicalRecord>(`/patients/${encodeURIComponent(id)}/medical-record`);
export const listPatients = () => request<PatientListResponse>('/patients/');
export const preparedPageUrl = (documentId: string, page: number) => `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/pages/${page}`;
