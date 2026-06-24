import { Link } from 'react-router-dom';
import { doctorStats, patients, reviewRecord } from '@/data/mockData';
import { formatDate, statusTone } from '@/utils/formatters';

export function DoctorDashboardPage() {
  const queueTone = statusTone(reviewRecord.status);

  return (
    <div className="d-grid gap-4">
      <section className="card docdai-surface docdai-card-accent border-0 rounded-4">
        <div className="card-body p-4 p-xl-5">
          <div className="d-flex flex-wrap justify-content-between gap-3 align-items-start">
            <div>
              <span className="badge text-bg-primary mb-3">Resumen del doctor</span>
              <h2 className="h3 mb-2">Cola de trabajo clínico y monitoreo de pacientes en un solo lugar.</h2>
              <p className="text-secondary mb-0">
                El OCR extrae los datos médicos, pero las actualizaciones finales del expediente siguen protegidas por validación humana.
              </p>
            </div>
            <Link to="/doctor/uploads" className="btn btn-primary">
              Cargar documento
            </Link>
          </div>
        </div>
      </section>

      <section className="row g-3">
        {doctorStats.map((stat) => (
          <div key={stat.label} className="col-12 col-md-4">
            <div className="card docdai-surface border-0 rounded-4 h-100">
              <div className="card-body p-4">
                <div className="text-secondary small mb-2">{stat.label}</div>
                <div className="display-6 fw-bold mb-2">{stat.value}</div>
                <div className="text-secondary">{stat.note}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="card docdai-surface border-0 rounded-4 h-100">
            <div className="card-body p-4 p-xl-5">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h3 className="h5 mb-1">Cola de validación</h3>
                  <p className="text-secondary mb-0">El último registro extraído está esperando confirmación.</p>
                </div>
                <span className={`badge text-bg-${queueTone}`}>{reviewRecord.status}</span>
              </div>

              <div className="d-grid gap-3">
                <div className="p-3 rounded-4 bg-light">
                  <div className="small text-secondary mb-1">Expediente</div>
                  <div className="fw-semibold">{reviewRecord.title}</div>
                </div>
                <div className="p-3 rounded-4 bg-light">
                  <div className="small text-secondary mb-1">Paciente</div>
                  <div className="fw-semibold">{reviewRecord.patientName}</div>
                </div>
                <div className="p-3 rounded-4 bg-light">
                  <div className="small text-secondary mb-1">Última actualización</div>
                  <div className="fw-semibold">{formatDate(reviewRecord.date)}</div>
                </div>
              </div>

              <div className="mt-4 d-flex gap-2 flex-wrap">
                <Link to="/doctor/review/rec-404" className="btn btn-outline-primary">
                  Revisar extracción
                </Link>
                <Link to="/doctor/patients" className="btn btn-link">
                  Abrir lista de pacientes
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card docdai-surface border-0 rounded-4 h-100">
            <div className="card-body p-4 p-xl-5">
              <h3 className="h5 mb-3">Pacientes recientes</h3>
              <div className="d-grid gap-3">
                {patients.slice(0, 3).map((patient) => (
                  <div key={patient.id} className="d-flex justify-content-between gap-3 align-items-center p-3 rounded-4 bg-light">
                    <div>
                      <div className="fw-semibold">{patient.name}</div>
                      <div className="small text-secondary">{patient.condition}</div>
                    </div>
                    <Link to={`/doctor/patients/${patient.id}`} className="btn btn-sm btn-outline-secondary">
                      Abrir
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
