import type { ReviewField } from '../types/ocrLayout.types';
import { ReviewStatus } from './ReviewStatus';
import { groupReviewFields, reviewFieldLabel } from '../utils/groupReviewFields';

export function ExtractionPanel({ fields, selectedId, onSelect }: { fields: ReviewField[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const groups = groupReviewFields(fields);
  const fieldButton = (field: ReviewField) => <button type="button" key={field.id} onClick={() => onSelect(field.id)} className={`docdai-extraction-field ${field.id === selectedId ? 'is-selected' : ''}`}><span><small>{reviewFieldLabel(field.evidence.field)}</small><strong>{field.value || 'No detectado'}</strong></span><ReviewStatus status={field.status} /></button>;
  return <section className="docdai-extraction-panel"><header><span className="docdai-eyebrow">Información extraída</span><h2>Campos para validar</h2></header>{fields.length ? <div className="docdai-field-groups">{groups.map((group) => <section className="docdai-field-group" key={group.id}><h3>{group.label}</h3>{group.medications?.map((medication) => <section className="docdai-medication-card" key={medication.id}><header><span>Medicamento</span><strong>{medication.label}</strong></header><div className="d-grid gap-2">{medication.fields.map(fieldButton)}</div></section>)}{group.fields.length ? <div className="d-grid gap-2">{group.fields.map(fieldButton)}</div> : null}</section>)}</div> : <p className="text-secondary mb-0">El parser no detectó campos con evidencia para revisar.</p>}</section>;
}
