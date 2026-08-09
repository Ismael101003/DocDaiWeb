import type { ReviewField } from '../types/ocrLayout.types';
import { ReviewStatus } from './ReviewStatus';

export function ExtractionPanel({ fields, selectedId, onSelect }: { fields: ReviewField[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return <section className="docdai-extraction-panel"><header><span className="docdai-eyebrow">Información extraída</span><h2>Campos para validar</h2></header>{fields.length ? <div className="d-grid gap-2">{fields.map((field) => <button type="button" key={field.id} onClick={() => onSelect(field.id)} className={`docdai-extraction-field ${field.id === selectedId ? 'is-selected' : ''}`}><span><small>{field.evidence.field}</small><strong>{field.value || 'No detectado'}</strong></span><ReviewStatus status={field.status} /></button>)}</div> : <p className="text-secondary mb-0">El parser no detectó campos con evidencia para revisar.</p>}</section>;
}
