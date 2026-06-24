import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { patients } from '@/data/mockData';
import { formatDate, statusTone } from '@/utils/formatters';

export function PatientsListPage() {
  const [query, setQuery] = useState('');

  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return patients;
    }

    return patients.filter((patient) => {
      const searchBlob = `${patient.name} ${patient.condition} ${patient.id}`.toLowerCase();
      return searchBlob.includes(normalizedQuery);
    });
  }, [query]);

  return (
    <div className="card docdai-surface border-0 rounded-4">
      <div className="card-body p-4 p-xl-5">
        <div className="d-flex flex-wrap justify-content-between gap-3 align-items-start mb-4">
          <div>
            <h2 className="h4 mb-2">Patients</h2>
            <p className="text-secondary mb-0">Search across active clinical records, document counts, and care states.</p>
          </div>
          <div className="col-12 col-md-5 col-lg-4">
            <input
              type="search"
              className="form-control"
              placeholder="Search patients"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Patient</th>
                <th scope="col">Condition</th>
                <th scope="col">Status</th>
                <th scope="col">Last visit</th>
                <th scope="col">Documents</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <div className="fw-semibold">{patient.name}</div>
                    <div className="small text-secondary">
                      {patient.age} years · {patient.gender}
                    </div>
                  </td>
                  <td>{patient.condition}</td>
                  <td>
                    <span className={`badge text-bg-${statusTone(patient.status)}`}>{patient.status}</span>
                  </td>
                  <td>{formatDate(patient.lastVisit)}</td>
                  <td>{patient.documents}</td>
                  <td className="text-end">
                    <Link to={`/doctor/patients/${patient.id}`} className="btn btn-sm btn-outline-primary">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-secondary">
                    No patients match the current search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
