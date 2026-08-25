import { Link, useLocation, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getPatient, getPatientMedicalRecord } from '@/services/documents';
import type { ClinicalPatient, PatientMedicalRecord } from '@/types/documents';

type RecordState = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; patient: ClinicalPatient; record: PatientMedicalRecord };

const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) : 'No registrada';
const List = ({ title, items }: { title: string; items: string[] }) => <section className="card h-100 border-0 shadow-sm"><div className="card-body"><h2 className="h6 text-uppercase text-secondary">{title}</h2>{items.length ? <ul className="mb-0 ps-3">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="mb-0 text-secondary">Sin datos registrados.</p>}</div></section>;

export function PatientRecordPage() {
  const { patientId } = useParams();
  const location = useLocation();
  const [state, setState] = useState<RecordState>({ kind: 'loading' });
  useEffect(() => {
    if (!patientId) return;
    let active = true;
    Promise.all([getPatient(patientId), getPatientMedicalRecord(patientId)])
      .then(([patient, record]) => active && setState({ kind: 'ready', patient, record }))
      .catch((error: unknown) => active && setState({ kind: 'error', message: error instanceof Error ? error.message : 'No fue posible cargar el expediente.' }));
    return () => { active = false; };
  }, [patientId]);
  if (state.kind === 'loading') return <section className="card border-0 shadow-sm"><div className="card-body p-5" role="status">Cargando expediente clínico...</div></section>;
  if (state.kind === 'error') return <section className="alert alert-danger"><h1 className="h5">No fue posible abrir el expediente</h1><p className="mb-3">{state.message}</p><Link className="btn btn-outline-danger" to="/doctor/patients">Volver a pacientes</Link></section>;
  const { patient, record } = state;
  const completion = location.state as { action?: 'created' | 'updated' } | null;
  return <section className="container-fluid">{completion?.action ? <div className="alert alert-success" role="status">{completion.action === 'created' ? 'Expediente creado.' : 'Expediente actualizado.'}</div> : null}<header className="ddw-patient-hero mb-4"><div className="d-flex flex-column flex-md-row justify-content-between gap-3"><div><span className="ddw-patient-hero__eyebrow">Expediente clínico digital</span><h1 className="ddw-patient-hero__title h2 mb-2">{patient.name ?? 'Paciente sin nombre'}</h1><p className="ddw-patient-hero__lead mb-0">{patient.age !== null ? `${patient.age} años` : 'Edad no registrada'} · Actualizado {dateLabel(record.updated_at ?? patient.updated_at)}</p></div><Link className="btn btn-light align-self-md-start" to={`/doctor/patients/${patient.id}/upload`}>+ Escanear nuevo documento</Link></div></header><div className="row g-4 mb-4"><div className="col-md-4"><List title="Identificadores" items={[patient.curp && `CURP: ${patient.curp}`, patient.nss && `NSS: ${patient.nss}`, patient.date_of_birth && `Nacimiento: ${dateLabel(patient.date_of_birth)}`].filter((item): item is string => Boolean(item))} /></div><div className="col-md-4"><List title="Médicos" items={record.doctors} /></div><div className="col-md-4"><List title="Instituciones" items={record.institutions} /></div></div><div className="row g-4"><div className="col-md-6"><List title="Diagnósticos" items={record.diagnoses} /></div><div className="col-md-6"><List title="Medicamentos" items={record.medications.map((item) => [item.name, item.dose, item.frequency].filter(Boolean).join(' · '))} /></div><div className="col-md-6"><List title="Fechas relevantes" items={record.dates} /></div><div className="col-md-6"><List title="Documentos asociados" items={record.documents} /></div></div></section>;
}
