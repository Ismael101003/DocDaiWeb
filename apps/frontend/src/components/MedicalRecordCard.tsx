import { Link } from 'react-router-dom';
import type { MedicalRecord } from '@/types/medical';
import { formatDate, statusTone } from '@/utils/formatters';
import { StatusBadge } from './StatusBadge';

interface MedicalRecordCardProps {
  record: MedicalRecord;
  to?: string;
}

export function MedicalRecordCard({ record, to }: MedicalRecordCardProps) {
  const tone = statusTone(record.status);

  const content = (
    <div className="card docdai-surface h-100 border-0 rounded-4">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between gap-3 align-items-start">
          <div>
            <h3 className="h6 mb-1">{record.title}</h3>
            <p className="mb-2 text-secondary">{record.summary}</p>
          </div>
          <StatusBadge confidence={record.confidence} label={record.status} />
        </div>

        <div className="small text-secondary d-flex flex-wrap gap-3 mb-3">
          <span>{record.patientName}</span>
          <span>{formatDate(record.date)}</span>
          <span>{record.source}</span>
        </div>

        <div className={`alert alert-${tone === 'warning' ? 'warning' : tone === 'danger' ? 'danger' : 'success'} mb-0`}>{record.details[0]}</div>
      </div>
    </div>
  );

  if (!to) {
    return content;
  }

  return <Link to={to}>{content}</Link>;
}
