export type UploadStatus = 'idle' | 'processing' | 'success' | 'error';

export interface DoctorStat {
  label: string;
  value: string;
  note: string;
}

export interface PatientSummary {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  lastVisit: string;
  status: 'estable' | 'en seguimiento' | 'pendiente de revisión';
  documents: number;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
}

export interface MedicalDocument {
  id: string;
  fileName: string;
  type: string;
  uploadedAt: string;
  status: 'procesado' | 'pendiente de revisión' | 'marcado';
  confidence: number;
  summary: string;
}

export interface MedicalRecord {
  id: string;
  patientName: string;
  title: string;
  date: string;
  status: 'finalizado' | 'pendiente de revisión' | 'requiere cambios';
  confidence: number;
  source: string;
  summary: string;
  details: string[];
}

export interface ReviewField {
  label: string;
  value: string;
  confidence: number;
}

export interface PatientProfile {
  fullName: string;
  patientId: string;
  dateOfBirth: string;
  bloodType: string;
  allergies: string;
  conditions: string;
  emergencyContact: string;
}
