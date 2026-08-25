import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getPatient, getPatientMedicalRecord, listPatientDocuments, patientDocumentOriginalUrl } from '@/services/documents';
import { PatientActions } from '@/components/PatientActions';
import type { ClinicalPatient, PatientDocument, PatientMedicalRecord } from '@/types/documents';

type RecordState = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; patient: ClinicalPatient; record: PatientMedicalRecord };

const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) : 'No registrada';
const List = ({ title, items }: { title: string; items: string[] }) => <section className="card h-100 border-0 shadow-sm"><div className="card-body"><h2 className="h6 text-uppercase text-secondary">{title}</h2>{items.length ? <ul className="mb-0 ps-3">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="mb-0 text-secondary">Sin datos registrados.</p>}</div></section>;

export function PatientRecordPage() {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<RecordState>({ kind: 'loading' });
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  useEffect(() => {
    if (!patientId) return;
    let active = true;
    Promise.all([getPatient(patientId), getPatientMedicalRecord(patientId), listPatientDocuments(patientId)])
      .then(([patient, record, documentResponse]) => { if (active) { setState({ kind: 'ready', patient, record }); setDocuments(documentResponse.items); } })
      .catch((error: unknown) => active && setState({ kind: 'error', message: error instanceof Error ? error.message : 'No fue posible cargar el expediente.' }));
    return () => { active = false; };
  }, [patientId]);
  if (state.kind === 'loading') return <section className="card border-0 shadow-sm"><div className="card-body p-5" role="status">Cargando expediente clínico...</div></section>;
  if (state.kind === 'error') return <section className="alert alert-danger"><h1 className="h5">No fue posible abrir el expediente</h1><p className="mb-3">{state.message}</p><Link className="btn btn-outline-danger" to="/doctor/patients">Volver a pacientes</Link></section>;
  const { patient, record } = state;
  const completion = location.state as { action?: 'created' | 'updated' } | null;
  const updatePatient = (updated: ClinicalPatient) => setState((current) => current.kind === 'ready' ? { ...current, patient: updated } : current);
  return <section className="container-fluid">{completion?.action ? <div className="alert alert-success" role="status">{completion.action === 'created' ? 'Expediente creado.' : 'Expediente actualizado.'}</div> : null}<header className="ddw-patient-hero mb-4"><div className="d-flex flex-column flex-md-row justify-content-between gap-3"><div><span className="ddw-patient-hero__eyebrow">Expediente clínico digital</span><h1 className="ddw-patient-hero__title h2 mb-2">{patient.name ?? 'Paciente sin nombre'}</h1><p className="ddw-patient-hero__lead mb-0">{patient.age !== null ? `${patient.age} años` : 'Edad no registrada'} · Actualizado {dateLabel(record.updated_at ?? patient.updated_at)}</p></div><div className="d-flex flex-wrap align-items-start gap-2"><Link className="btn btn-light" to={`/doctor/patients/${patient.id}/upload`}>+ Escanear nuevo documento</Link><PatientActions patient={patient} onUpdated={updatePatient} onDeactivated={() => navigate('/doctor/patients', { replace: true })} /></div></div></header><div className="row g-4 mb-4"><div className="col-md-4"><List title="Identificadores" items={[patient.curp && `CURP: ${patient.curp}`, patient.nss && `NSS: ${patient.nss}`, patient.date_of_birth && `Nacimiento: ${dateLabel(patient.date_of_birth)}`].filter((item): item is string => Boolean(item))} /></div><div className="col-md-4"><List title="Médicos" items={record.doctors} /></div><div className="col-md-4"><List title="Instituciones" items={record.institutions} /></div></div><div className="row g-4"><div className="col-md-6"><List title="Diagnósticos" items={record.diagnoses} /></div><div className="col-md-6"><List title="Medicamentos" items={record.medications.map((item) => [item.name, item.dose, item.frequency, item.presentation].filter(Boolean).join(' · '))} /></div><div className="col-md-6"><List title="Fechas relevantes" items={record.dates} /></div><div className="col-md-6"><section className="card h-100 border-0 shadow-sm"><div className="card-body"><h2 className="h6 text-uppercase text-secondary">Documentos asociados</h2>{documents.length ? <ul className="list-unstyled mb-0 d-grid gap-2">{documents.map((document) => <li className="d-flex justify-content-between align-items-center gap-2" key={document.document_id}><span className="text-truncate">{document.filename}</span><a className="btn btn-sm btn-outline-primary flex-shrink-0" href={patientDocumentOriginalUrl(patient.id, document.document_id)} target="_blank" rel="noopener noreferrer">Ver documento</a></li>)}</ul> : <p className="mb-0 text-secondary">Sin documentos disponibles.</p>}</div></section></div></div></section>;
}
