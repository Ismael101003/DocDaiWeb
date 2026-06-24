import type {
  DoctorStat,
  MedicalDocument,
  MedicalRecord,
  PatientProfile,
  PatientSummary,
  ReviewField,
  TimelineEvent,
} from '@/types/medical';

export const doctorStats: DoctorStat[] = [
  {
    label: 'Patients under care',
    value: '128',
    note: '8 added this week',
  },
  {
    label: 'Files uploaded',
    value: '46',
    note: '12 processed today',
  },
  {
    label: 'Pending validations',
    value: '9',
    note: 'Human review required',
  },
];

export const patientStats: DoctorStat[] = [
  {
    label: 'Latest records',
    value: '14',
    note: '4 updated this month',
  },
  {
    label: 'Active care plans',
    value: '3',
    note: 'All synced to the chart',
  },
  {
    label: 'Review alerts',
    value: '1',
    note: 'Awaiting doctor confirmation',
  },
];

export const patients: PatientSummary[] = [
  {
    id: 'pt-2045',
    name: 'Maria Torres',
    age: 42,
    gender: 'Female',
    condition: 'Hypertension follow-up',
    lastVisit: '2026-05-28T09:00:00Z',
    status: 'monitoring',
    documents: 18,
  },
  {
    id: 'pt-2071',
    name: 'Luis Herrera',
    age: 56,
    gender: 'Male',
    condition: 'Diabetes management',
    lastVisit: '2026-06-11T11:30:00Z',
    status: 'review pending',
    documents: 24,
  },
  {
    id: 'pt-2088',
    name: 'Elena Cruz',
    age: 31,
    gender: 'Female',
    condition: 'Post-operative recovery',
    lastVisit: '2026-06-18T08:20:00Z',
    status: 'stable',
    documents: 9,
  },
  {
    id: 'pt-2099',
    name: 'Diego Navarro',
    age: 64,
    gender: 'Male',
    condition: 'Cardiology consult',
    lastVisit: '2026-06-21T14:10:00Z',
    status: 'monitoring',
    documents: 31,
  },
];

export const patientTimeline: TimelineEvent[] = [
  {
    id: 'evt-1',
    title: 'OCR imported lab report',
    date: '2026-06-20T10:15:00Z',
    description: 'CBC and chemistry panel were extracted with high confidence and mapped to the chart.',
    tone: 'success',
  },
  {
    id: 'evt-2',
    title: 'Medication plan updated',
    date: '2026-06-18T16:40:00Z',
    description: 'Amlodipine dosage was adjusted and flagged for doctor review before finalization.',
    tone: 'warning',
  },
  {
    id: 'evt-3',
    title: 'Blood pressure alert',
    date: '2026-06-14T07:55:00Z',
    description: 'Home monitoring recorded a spike above the target range and triggered a follow-up.',
    tone: 'danger',
  },
];

export const patientDocuments: MedicalDocument[] = [
  {
    id: 'doc-1',
    fileName: 'cbc_june_2026.pdf',
    type: 'Lab report',
    uploadedAt: '2026-06-20T10:15:00Z',
    status: 'processed',
    confidence: 96,
    summary: 'CBC values normalized into structured fields with no missing sections.',
  },
  {
    id: 'doc-2',
    fileName: 'radiology_scan.png',
    type: 'Image',
    uploadedAt: '2026-06-18T16:40:00Z',
    status: 'pending review',
    confidence: 84,
    summary: 'Radiology notes extracted with one uncertain line requiring manual validation.',
  },
  {
    id: 'doc-3',
    fileName: 'prescription_photo.jpg',
    type: 'Prescription',
    uploadedAt: '2026-06-14T07:55:00Z',
    status: 'flagged',
    confidence: 69,
    summary: 'Handwritten dosage line needs clinical verification before saving the record.',
  },
];

export const aiPreviewFields: ReviewField[] = [
  { label: 'Primary diagnosis', value: 'Essential hypertension', confidence: 95 },
  { label: 'Medication', value: 'Amlodipine 5 mg daily', confidence: 93 },
  { label: 'Follow-up', value: 'Blood pressure check in 14 days', confidence: 90 },
  { label: 'Risk note', value: 'Monitor headache and dizziness', confidence: 82 },
];

export const doctorReviewFields: ReviewField[] = [
  { label: 'Document type', value: 'Discharge summary', confidence: 98 },
  { label: 'Encounter date', value: 'Jun 20, 2026', confidence: 96 },
  { label: 'ICD-10 suggestion', value: 'I10 - Essential hypertension', confidence: 91 },
  { label: 'Medication list', value: 'Amlodipine, hydrochlorothiazide', confidence: 88 },
  { label: 'Next steps', value: 'Confirm dosage and note home readings', confidence: 86 },
];

export const reviewRecord: MedicalRecord = {
  id: 'rec-404',
  patientName: 'Maria Torres',
  title: 'Discharge summary OCR review',
  date: '2026-06-20T10:15:00Z',
  status: 'pending review',
  confidence: 91,
  source: 'Emergency department discharge PDF',
  summary:
    'Structured extraction is ready. A single medication dose line still needs approval before the chart is finalized.',
  details: [
    'Vitals normalized on arrival and remained stable throughout the visit.',
    'No contraindications were detected in the extracted allergy section.',
    'Medication dosage appears consistent with the handwritten note after OCR cleanup.',
  ],
};

export const doctorPatientOverview = {
  name: 'Maria Torres',
  initials: 'MT',
  lastUpdated: '2026-06-20T10:15:00Z',
  nextTouchpoint: 'Doctor validation pending',
  aiConfidence: 94,
};

export const patientRecordCards: MedicalRecord[] = [
  {
    id: 'pr-1',
    patientName: 'Maria Torres',
    title: 'Annual cardiology review',
    date: '2026-06-20T10:15:00Z',
    status: 'finalized',
    confidence: 96,
    source: 'Clinic visit summary',
    summary: 'Doctor reviewed the extracted report and confirmed the medication plan.',
    details: ['Blood pressure is improving.', 'Lifestyle counseling documented.', 'Continue monitoring at home.'],
  },
  {
    id: 'pr-2',
    patientName: 'Maria Torres',
    title: 'Lab results from June panel',
    date: '2026-06-18T16:40:00Z',
    status: 'finalized',
    confidence: 93,
    source: 'Lab PDF',
    summary: 'Structured CBC and chemistry data with trends from the last four weeks.',
    details: ['Kidney function within range.', 'Sodium slightly low but stable.', 'No urgent escalation needed.'],
  },
  {
    id: 'pr-3',
    patientName: 'Maria Torres',
    title: 'Medication refill request',
    date: '2026-06-14T07:55:00Z',
    status: 'requires edits',
    confidence: 71,
    source: 'Prescription photo',
    summary: 'A handwritten dose needs manual confirmation before release.',
    details: ['Medication line was partially obscured.', 'Review the dose with the prescribing doctor.', 'Awaiting approval.'],
  },
];

export const patientProfile: PatientProfile = {
  fullName: 'Maria Torres',
  patientId: 'PT-2045',
  dateOfBirth: '1984-03-12',
  bloodType: 'O+',
  allergies: 'Penicillin, latex',
  conditions: 'Hypertension, seasonal asthma',
  emergencyContact: 'Ana Torres · +52 55 1234 5678',
};
