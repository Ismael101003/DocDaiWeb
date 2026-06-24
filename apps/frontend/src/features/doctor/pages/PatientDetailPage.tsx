import { Link, useParams } from 'react-router-dom';
import { MedicalTimeline } from '@/components/MedicalTimeline';
import { PatientCard } from '@/components/PatientCard';
import { StatusBadge } from '@/components/StatusBadge';
import { aiPreviewFields, patientDocuments, patientTimeline, patients } from '@/data/mockData';
import { formatDate, statusTone } from '@/utils/formatters';

export function PatientDetailPage() {
  const { patientId } = useParams();
  const patient = patients.find((item) => item.id === patientId) ?? patients[0];

  return (
    <div className="d-grid gap-4">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
        <div>
          <h2 className="h4 mb-2">Detalle del paciente</h2>
          <p className="text-secondary mb-0">Cronología, cargas y datos extraídos por IA para el expediente seleccionado.</p>
        </div>
        <Link to="/doctor/patients" className="btn btn-outline-secondary">
          Volver a la lista
        </Link>
      </div>

      <PatientCard patient={patient} />

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <MedicalTimeline events={patientTimeline} />
        </div>

        <div className="col-12 col-xl-5 d-grid gap-4">
          <div className="card docdai-surface border-0 rounded-4">
            <div className="card-body p-4 p-xl-5">
              <h3 className="h5 mb-3">Documentos cargados</h3>
              <div className="d-grid gap-3">
                {patientDocuments.map((document) => (
                  <div key={document.id} className="p-3 rounded-4 bg-light">
                    <div className="d-flex justify-content-between gap-3 align-items-start mb-2">
                      <div>
                        <div className="fw-semibold">{document.fileName}</div>
                        <div className="small text-secondary">{document.type} · {formatDate(document.uploadedAt)}</div>
                      </div>
                      <StatusBadge confidence={document.confidence} label={document.status} />
                    </div>
                    <div className="text-secondary">{document.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card docdai-surface border-0 rounded-4">
            <div className="card-body p-4 p-xl-5">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <h3 className="h5 mb-1">Datos extraídos por IA</h3>
                  <p className="text-secondary mb-0">Vista estructurada previa antes de guardar el expediente.</p>
                </div>
                <StatusBadge confidence={94} />
              </div>

              <div className="d-grid gap-3">
                {aiPreviewFields.map((field) => (
                  <div key={field.label} className="d-flex justify-content-between gap-3 align-items-center p-3 rounded-4 bg-light">
                    <div>
                      <div className="small text-secondary">{field.label}</div>
                      <div className="fw-semibold">{field.value}</div>
                    </div>
                    <span className={`badge text-bg-${statusTone(field.confidence >= 90 ? 'estable' : 'pendiente de revisión')}`}>{field.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
