import { useState } from 'react';
import type { PatientMatchCandidate } from '@/types/documents';

type Props = { candidates: PatientMatchCandidate[]; busy: boolean; onLink: (patientId: string) => void; onCreateNew: () => void };
const dateLabel = (date: string | null) => date ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(date)) : 'No especificada en la receta';

export function AmbiguousPatientResolutionModal({ candidates, busy, onLink, onCreateNew }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return <div className="ddw-modal-backdrop" role="presentation"><section className="ddw-modal ddw-match-modal card shadow-lg" role="dialog" aria-modal="true" aria-labelledby="patient-match-title">
    <div className="card-body p-4"><span className="docdai-eyebrow">Decisión clínica requerida</span><h2 className="h4 mt-1" id="patient-match-title">¿A qué expediente pertenece este documento?</h2><p className="text-body-secondary">Se encontraron perfiles con datos similares. Revisa la información disponible antes de vincular el documento.</p>
      {candidates.length ? <div className="ddw-match-list" role="radiogroup" aria-label="Expedientes posibles">{candidates.map((candidate) => <label className={`ddw-match-candidate ${selectedId === candidate.id ? 'is-selected' : ''}`} key={candidate.id}><input className="visually-hidden" type="radio" name="patient-match" checked={selectedId === candidate.id} onChange={() => setSelectedId(candidate.id)} /><span><strong>{candidate.name ?? 'Nombre no especificado en la receta'}</strong><small>{candidate.age !== null ? `${candidate.age} años` : 'Edad no especificada'} · Nacimiento: {dateLabel(candidate.date_of_birth)}</small>{candidate.curp_hint || candidate.nss_hint ? <small>{[candidate.curp_hint && `CURP ${candidate.curp_hint}`, candidate.nss_hint && `NSS ${candidate.nss_hint}`].filter(Boolean).join(' · ')}</small> : null}</span><span className="ddw-match-candidate__mark" aria-hidden="true" /></label>)}</div> : <div className="alert alert-warning mb-0">No hay información suficiente para distinguir perfiles existentes. Puedes crear un expediente nuevo.</div>}
    </div><div className="card-footer d-flex flex-column flex-sm-row justify-content-between align-items-stretch gap-2"><button className="btn btn-outline-secondary" type="button" disabled={busy} onClick={onCreateNew}>Crear como nuevo paciente</button><button className="btn btn-primary" type="button" disabled={!selectedId || busy} onClick={() => selectedId && onLink(selectedId)}>{busy ? 'Resolviendo…' : 'Vincular a expediente seleccionado'}</button></div>
  </section></div>;
}
