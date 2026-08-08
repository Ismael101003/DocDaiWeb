import type { DocumentUploadResponse, MedicalInformationResponse, OCRResponse, PrepareDocumentResponse } from '@/types/documents';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';
const TIMEOUT_MS = 120_000;

class ApiError extends Error { constructor(message: string, public status?: number) { super(message); } }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
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

export const uploadDocument = (file: File) => { const data = new FormData(); data.append('file', file); return request<DocumentUploadResponse>('/documents/upload', { method: 'POST', body: data }); };
export const prepareDocument = (id: string) => request<PrepareDocumentResponse>(`/documents/${id}/prepare`, { method: 'POST' });
export const extractOCR = (id: string) => request<OCRResponse>(`/documents/${id}/ocr`, { method: 'POST' });
export const parseMedicalInformation = (id: string) => request<MedicalInformationResponse>(`/documents/${id}/parse`, { method: 'POST' });
