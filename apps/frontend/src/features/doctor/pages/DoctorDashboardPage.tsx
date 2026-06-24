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
              <span className="badge text-bg-primary mb-3">Doctor overview</span>
              <h2 className="h3 mb-2">Clinical work queue and patient monitoring in one place.</h2>
              <p className="text-secondary mb-0">
                OCR extracts medical data, but final chart updates stay gated behind human validation.
              </p>
            </div>
            <Link to="/doctor/uploads" className="btn btn-primary">
              Upload document
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
                  <h3 className="h5 mb-1">Validation queue</h3>
                  <p className="text-secondary mb-0">The most recent extracted record is waiting for confirmation.</p>
                </div>
                <span className={`badge text-bg-${queueTone}`}>{reviewRecord.status}</span>
              </div>

              <div className="d-grid gap-3">
                <div className="p-3 rounded-4 bg-light">
                  <div className="small text-secondary mb-1">Record</div>
                  <div className="fw-semibold">{reviewRecord.title}</div>
                </div>
                <div className="p-3 rounded-4 bg-light">
                  <div className="small text-secondary mb-1">Patient</div>
                  <div className="fw-semibold">{reviewRecord.patientName}</div>
                </div>
                <div className="p-3 rounded-4 bg-light">
                  <div className="small text-secondary mb-1">Last update</div>
                  <div className="fw-semibold">{formatDate(reviewRecord.date)}</div>
                </div>
              </div>

              <div className="mt-4 d-flex gap-2 flex-wrap">
                <Link to="/doctor/review/rec-404" className="btn btn-outline-primary">
                  Review extraction
                </Link>
                <Link to="/doctor/patients" className="btn btn-link">
                  Open patient list
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card docdai-surface border-0 rounded-4 h-100">
            <div className="card-body p-4 p-xl-5">
              <h3 className="h5 mb-3">Recent patients</h3>
              <div className="d-grid gap-3">
                {patients.slice(0, 3).map((patient) => (
                  <div key={patient.id} className="d-flex justify-content-between gap-3 align-items-center p-3 rounded-4 bg-light">
                    <div>
                      <div className="fw-semibold">{patient.name}</div>
                      <div className="small text-secondary">{patient.condition}</div>
                    </div>
                    <Link to={`/doctor/patients/${patient.id}`} className="btn btn-sm btn-outline-secondary">
                      Open
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
