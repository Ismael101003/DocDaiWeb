import { Link } from 'react-router-dom';
import type { PatientSummary } from '@/types/medical';
import { formatDate, getInitials, statusTone } from '@/utils/formatters';

interface PatientCardProps {
  patient: PatientSummary;
  to?: string;
}

export function PatientCard({ patient, to }: PatientCardProps) {
  const body = (
    <div className="card docdai-surface h-100 border-0 rounded-4">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between gap-3">
          <div className="d-flex gap-3">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary fw-bold" style={{ width: '3rem', height: '3rem' }}>
              {getInitials(patient.name)}
            </div>
            <div>
              <h3 className="h6 mb-1">{patient.name}</h3>
              <p className="mb-1 text-secondary">{patient.condition}</p>
              <p className="mb-0 small text-secondary">
                {patient.age} years · {patient.gender}
              </p>
            </div>
          </div>
          <span className={`badge text-bg-${statusTone(patient.status)}`}>{patient.status}</span>
        </div>

        <hr className="my-3" />

        <div className="d-flex flex-wrap justify-content-between gap-3 small text-secondary">
          <span>Last visit: {formatDate(patient.lastVisit)}</span>
          <span>{patient.documents} documents</span>
        </div>
      </div>
    </div>
  );

  if (!to) {
    return body;
  }

  return <Link to={to}>{body}</Link>;
}
