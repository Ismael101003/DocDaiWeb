import { Link } from 'react-router-dom';
import { patientRecordCards, patientStats, patientProfile } from '@/data/mockData';
import { formatDate, statusTone } from '@/utils/formatters';

export function PatientDashboardPage() {
  return (
    <div className="d-grid gap-4">
      <section className="card docdai-surface docdai-card-accent border-0 rounded-4">
        <div className="card-body p-4 p-xl-5">
          <div className="d-flex flex-wrap justify-content-between gap-3 align-items-start">
            <div>
              <span className="badge text-bg-primary mb-3">Resumen del paciente</span>
              <h2 className="h3 mb-2">Tus registros de salud, presentados en un resumen clínico legible.</h2>
              <p className="text-secondary mb-0">
                Revisa documentos recientes, acciones próximas y notas compartidas por tu equipo de atención.
              </p>
            </div>
            <Link to="/patient/records" className="btn btn-primary">
              Ver expedientes
            </Link>
          </div>
        </div>
      </section>

      <section className="row g-3">
        {patientStats.map((stat) => (
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
                  <h3 className="h5 mb-1">Expedientes recientes</h3>
                  <p className="text-secondary mb-0">Los registros se muestran con un lenguaje fácil de leer de un vistazo.</p>
                </div>
                <Link to="/patient/records" className="btn btn-outline-primary btn-sm">
                  Abrir todos
                </Link>
              </div>

              <div className="d-grid gap-3">
                {patientRecordCards.slice(0, 2).map((record) => (
                  <div key={record.id} className="p-3 rounded-4 bg-light">
                    <div className="d-flex justify-content-between gap-3 align-items-start mb-2">
                      <div>
                        <div className="fw-semibold">{record.title}</div>
                        <div className="small text-secondary">{formatDate(record.date)}</div>
                      </div>
                      <span className={`badge text-bg-${statusTone(record.status)}`}>{record.status}</span>
                    </div>
                    <p className="text-secondary mb-0">{record.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card docdai-surface border-0 rounded-4 h-100">
            <div className="card-body p-4 p-xl-5">
              <h3 className="h5 mb-3">Resumen personal</h3>
              <div className="p-3 rounded-4 bg-light mb-3">
                <div className="small text-secondary mb-1">Paciente</div>
                <div className="fw-semibold">{patientProfile.fullName}</div>
                <div className="text-secondary">ID {patientProfile.patientId}</div>
              </div>
              <div className="d-grid gap-3 small">
                <div className="d-flex justify-content-between gap-3"><span className="text-secondary">Tipo de sangre</span><span className="fw-semibold">{patientProfile.bloodType}</span></div>
                <div className="d-flex justify-content-between gap-3"><span className="text-secondary">Alergias</span><span className="fw-semibold text-end">{patientProfile.allergies}</span></div>
                <div className="d-flex justify-content-between gap-3"><span className="text-secondary">Condiciones</span><span className="fw-semibold text-end">{patientProfile.conditions}</span></div>
                <div className="d-flex justify-content-between gap-3"><span className="text-secondary">Contacto de emergencia</span><span className="fw-semibold text-end">{patientProfile.emergencyContact}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
