import type { ReviewField } from '../types/ocrLayout.types';

export type ReviewFieldGroup = { id: string; label: string; fields: ReviewField[]; medications?: Array<{ id: string; label: string; fields: ReviewField[] }> };
const labels: Record<string, string> = { 'patient.name': 'Nombre', 'patient.age': 'Edad', 'patient.curp': 'CURP', 'patient.nss': 'NSS', 'patient.date_of_birth': 'Fecha de nacimiento', doctor: 'Profesional', institution: 'Institución' };
const titleFor = (field: string) => {
  const medication = field.match(/^medications\[(\d+)]\.(.+)$/);
  if (medication) return `Medicamento ${Number(medication[1]) + 1} · ${titleFor(medication[2])}`;
  const diagnosis = field.match(/^diagnoses\[(\d+)]$/);
  if (diagnosis) return `Diagnóstico ${Number(diagnosis[1]) + 1}`;
  const date = field.match(/^dates\[(\d+)]$/);
  if (date) return `Fecha ${Number(date[1]) + 1}`;
  return labels[field] ?? field.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export function groupReviewFields(fields: ReviewField[]): ReviewFieldGroup[] {
  const patient = fields.filter((field) => field.evidence.field.startsWith('patient.'));
  const diagnoses = fields.filter((field) => field.evidence.field.startsWith('diagnoses['));
  const medicationMap = new Map<string, ReviewField[]>();
  fields.filter((field) => field.evidence.field.startsWith('medications[')).forEach((field) => { const match = field.evidence.field.match(/^medications\[(\d+)]\.(.+)$/); if (match) medicationMap.set(match[1], [...(medicationMap.get(match[1]) ?? []), field]); });
  const context = fields.filter((field) => field.evidence.field.startsWith('dates[') || field.evidence.field === 'doctor' || field.evidence.field === 'institution');
  const groups: ReviewFieldGroup[] = [];
  if (patient.length) groups.push({ id: 'patient', label: 'Paciente', fields: patient });
  if (diagnoses.length) groups.push({ id: 'diagnoses', label: 'Diagnósticos', fields: diagnoses });
  if (medicationMap.size) groups.push({ id: 'medications', label: 'Medicamentos', fields: [], medications: [...medicationMap.entries()].map(([index, medicationFields]) => ({ id: index, label: medicationFields.find((field) => field.evidence.field.endsWith('.name'))?.value || `Medicamento ${Number(index) + 1}`, fields: medicationFields })) });
  if (context.length) groups.push({ id: 'context', label: 'Fechas y lugar', fields: context });
  const groupedIds = new Set(groups.flatMap((group) => [...group.fields, ...(group.medications?.flatMap((medication) => medication.fields) ?? [])]).map((field) => field.id));
  const remaining = fields.filter((field) => !groupedIds.has(field.id));
  if (remaining.length) groups.push({ id: 'other', label: 'Otros datos clínicos', fields: remaining });
  return groups;
}

export { titleFor as reviewFieldLabel };
