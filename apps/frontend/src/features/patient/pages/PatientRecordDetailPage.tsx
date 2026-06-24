import { useParams } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import { patientRecordCards } from '@/data/mockData';
import { formatDate, statusTone } from '@/utils/formatters';

export function PatientRecordDetailPage() {
  const { recordId } = useParams();
  const record = patientRecordCards.find((item) => item.id === recordId) ?? patientRecordCards[0];

  return (
    <div className="card docdai-surface border-0 rounded-4">
      <div className="card-body p-4 p-xl-5">
        <div className="d-flex flex-wrap justify-content-between gap-3 align-items-start mb-4">
          <div>
            <h2 className="h4 mb-2">Informe legible</h2>
            <p className="text-secondary mb-0">Resumen fácil de leer del registro extraído de tu expediente.</p>
          </div>
          <StatusBadge confidence={record.confidence} />
        </div>

        <div className="row g-4">
          <div className="col-12 col-xl-7">
            <div className="d-grid gap-3">
              <div className="p-3 rounded-4 bg-light">
                <div className="small text-secondary">Título</div>
                <div className="fw-semibold">{record.title}</div>
              </div>
              <div className="p-3 rounded-4 bg-light">
                <div className="small text-secondary">Registrado el</div>
                <div className="fw-semibold">{formatDate(record.date)}</div>
              </div>
              <div className="p-3 rounded-4 bg-light">
                <div className="small text-secondary">Estado</div>
                <div className="fw-semibold text-capitalize">{record.status}</div>
              </div>

              <div className="card border-0 bg-light rounded-4">
                <div className="card-body p-4">
                  <h3 className="h6 mb-3">Qué significa</h3>
                  <p className="text-secondary mb-0">{record.summary}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-5">
            <div className="card border-0 bg-light rounded-4 h-100">
              <div className="card-body p-4">
                <h3 className="h6 mb-3">Notas clínicas</h3>
                <div className="d-grid gap-3">
                  {record.details.map((item) => (
                    <div key={item} className="d-flex justify-content-between gap-3 align-items-start p-3 rounded-4 bg-white">
                      <span className="text-secondary">{item}</span>
                      <span className={`badge text-bg-${statusTone(record.status)}`}>{record.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
