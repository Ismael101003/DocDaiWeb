import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import { doctorReviewFields, reviewRecord } from '@/data/mockData';

export function MedicalRecordReviewPage() {
  const { recordId } = useParams();
  const [reviewState, setReviewState] = useState<'idle' | 'approved' | 'editing'>('idle');

  return (
    <div className="card docdai-surface border-0 rounded-4">
      <div className="card-body p-4 p-xl-5">
        <div className="d-flex flex-wrap justify-content-between gap-3 align-items-start mb-4">
          <div>
            <h2 className="h4 mb-2">Revisión del expediente</h2>
            <p className="text-secondary mb-0">Confirma el registro extraído antes de escribirlo en el expediente del paciente.</p>
          </div>
          <StatusBadge confidence={reviewRecord.confidence} />
        </div>

        <div className="row g-4">
          <div className="col-12 col-xl-7">
            <div className="d-grid gap-3">
              <div className="p-3 rounded-4 bg-light">
                <div className="small text-secondary">ID del expediente</div>
                <div className="fw-semibold">{recordId ?? reviewRecord.id}</div>
              </div>
              <div className="p-3 rounded-4 bg-light">
                <div className="small text-secondary">Paciente</div>
                <div className="fw-semibold">{reviewRecord.patientName}</div>
              </div>
              <div className="p-3 rounded-4 bg-light">
                <div className="small text-secondary">Origen</div>
                <div className="fw-semibold">{reviewRecord.source}</div>
              </div>

              <div className="card border-0 bg-light rounded-4">
                <div className="card-body p-4">
                  <h3 className="h6 mb-3">Datos clínicos estructurados</h3>
                  <div className="d-grid gap-3">
                    {doctorReviewFields.map((field) => (
                      <div key={field.label} className="d-flex justify-content-between gap-3 align-items-center">
                        <div>
                          <div className="small text-secondary">{field.label}</div>
                          <div className="fw-semibold">{field.value}</div>
                        </div>
                        <StatusBadge confidence={field.confidence} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-5 d-grid gap-4">
            <div className="card border-0 bg-light rounded-4 h-100">
              <div className="card-body p-4">
                <h3 className="h6 mb-3">Resumen clínico</h3>
                <p className="text-secondary mb-3">{reviewRecord.summary}</p>
                <ul className="text-secondary mb-0 ps-3 d-grid gap-2">
                  {reviewRecord.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card border-0 bg-light rounded-4">
              <div className="card-body p-4">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <button type="button" className="btn btn-success" onClick={() => setReviewState('approved')}>
                    Aprobar
                  </button>
                  <button type="button" className="btn btn-outline-primary" onClick={() => setReviewState('editing')}>
                    Editar salida de IA
                  </button>
                  <Link to="/doctor/uploads" className="btn btn-link">
                    Volver a cargas
                  </Link>
                </div>

                {reviewState === 'approved' ? <div className="alert alert-success mb-0">El registro extraído fue aprobado y ya está listo para guardarse en el expediente.</div> : null}
                {reviewState === 'editing' ? <div className="alert alert-info mb-0">Abre el formulario de edición cuando la API esté conectada.</div> : null}
                {reviewState === 'idle' ? <div className="alert alert-warning mb-0">Revisa los niveles de confianza antes de guardar algo en el expediente.</div> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
