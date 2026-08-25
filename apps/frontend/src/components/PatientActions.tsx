import { useEffect, useState } from 'react';
import { deactivatePatient, updatePatient } from '@/services/documents';
import type { ClinicalPatient, PatientListItem, PatientUpdateRequest } from '@/types/documents';

type EditablePatient = ClinicalPatient | PatientListItem;
type Props = { patient: EditablePatient; onUpdated: (patient: ClinicalPatient) => void; onDeactivated: (patientId: string) => void };

const blankToNull = (value: string) => value.trim() || null;
const patientName = (patient: EditablePatient) => 'name' in patient ? patient.name ?? '' : patient.full_name;

export function PatientActions({ patient, onUpdated, onDeactivated }: Props) {
  const [mode, setMode] = useState<'edit' | 'deactivate' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: patientName(patient), age: patient.age?.toString() ?? '', date_of_birth: patient.date_of_birth ?? '', curp: patient.curp ?? '', nss: patient.nss ?? '' });
  useEffect(() => setForm({ name: patientName(patient), age: patient.age?.toString() ?? '', date_of_birth: patient.date_of_birth ?? '', curp: patient.curp ?? '', nss: patient.nss ?? '' }), [patient]);
  const close = () => { if (!busy) { setMode(null); setError(''); } };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    const payload: PatientUpdateRequest = { name: form.name.trim(), age: form.age ? Number(form.age) : null, date_of_birth: blankToNull(form.date_of_birth), curp: blankToNull(form.curp), nss: blankToNull(form.nss) };
    try { onUpdated(await updatePatient(patient.id, payload)); close(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No fue posible guardar los cambios.'); }
    finally { setBusy(false); }
  };
  const deactivate = async () => {
    setBusy(true); setError('');
    try { await deactivatePatient(patient.id); onDeactivated(patient.id); setMode(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No fue posible desactivar el expediente.'); }
    finally { setBusy(false); }
  };
  return <>
    <div className="d-flex flex-wrap gap-2"><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setMode('edit')}>Editar</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => setMode('deactivate')}>Desactivar</button></div>
    {mode ? <div className="ddw-modal-backdrop" role="presentation"><section className="ddw-modal card shadow-lg" role="dialog" aria-modal="true" aria-labelledby="patient-modal-title">
      {mode === 'edit' ? <form onSubmit={save}><div className="card-body p-4"><div className="d-flex justify-content-between gap-3"><div><h2 className="h5" id="patient-modal-title">Editar paciente</h2><p className="text-body-secondary small">Corrige datos administrativos tras validar la fuente clínica.</p></div><button className="btn-close" type="button" aria-label="Cerrar" onClick={close} /></div><div className="row g-3"><label className="col-12 form-label">Nombre<input required className="form-control mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="col-sm-4 form-label">Edad<input min="0" max="130" inputMode="numeric" className="form-control mt-1" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} /></label><label className="col-sm-8 form-label">Fecha de nacimiento<input type="date" className="form-control mt-1" value={form.date_of_birth} onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })} /></label><label className="col-sm-6 form-label">CURP<input maxLength={18} className="form-control mt-1" value={form.curp} onChange={(event) => setForm({ ...form, curp: event.target.value.toUpperCase() })} /></label><label className="col-sm-6 form-label">NSS<input maxLength={20} className="form-control mt-1" value={form.nss} onChange={(event) => setForm({ ...form, nss: event.target.value })} /></label></div>{error ? <div className="alert alert-danger mt-3 mb-0">{error}</div> : null}</div><div className="card-footer d-flex justify-content-end gap-2"><button className="btn btn-outline-secondary" type="button" onClick={close}>Cancelar</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button></div></form> : <div className="card-body p-4"><h2 className="h5" id="patient-modal-title">Desactivar expediente</h2><p>El expediente dejará de aparecer en la lista clínica. Esta acción conserva la trazabilidad y no elimina documentos ni historial.</p>{error ? <div className="alert alert-danger">{error}</div> : null}<div className="d-flex justify-content-end gap-2"><button className="btn btn-outline-secondary" type="button" onClick={close}>Cancelar</button><button className="btn btn-danger" type="button" disabled={busy} onClick={() => void deactivate()}>{busy ? 'Desactivando…' : 'Desactivar expediente'}</button></div></div>}
    </section></div> : null}
  </>;
}
