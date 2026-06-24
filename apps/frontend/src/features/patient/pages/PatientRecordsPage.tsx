import { Link } from 'react-router-dom';
import { MedicalRecordCard } from '@/components/MedicalRecordCard';
import { patientRecordCards } from '@/data/mockData';

export function PatientRecordsPage() {
  return (
    <div className="d-grid gap-4">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
        <div>
          <h2 className="h4 mb-2">Expedientes médicos</h2>
          <p className="text-secondary mb-0">Una lista clara de tus registros estructurados y tu historial de documentos.</p>
        </div>
        <Link to="/patient/profile" className="btn btn-outline-secondary">
          Ver perfil
        </Link>
      </div>

      <div className="row g-4">
        {patientRecordCards.map((record) => (
          <div key={record.id} className="col-12 col-lg-6">
            <MedicalRecordCard record={record} to={`/patient/records/${record.id}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
