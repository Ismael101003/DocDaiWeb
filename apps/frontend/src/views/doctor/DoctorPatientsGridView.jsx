import { useEffect, useState } from 'react'
import { listPatients } from '../../services/documents.ts'
import PatientCard from '../../components/PatientCard.jsx'

const DoctorPatientsGridView = ({ onViewPatient }) => {
  const [state, setState] = useState({ kind: 'loading', patients: [], message: '' })
  useEffect(() => {
    let active = true
    listPatients().then(({ items }) => {
      if (active) setState({ kind: 'ready', patients: items.map((patient) => ({ id: patient.id, name: patient.full_name, initials: patient.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), age: null })), message: '' })
    }).catch((error) => active && setState({ kind: 'error', patients: [], message: error instanceof Error ? error.message : 'No fue posible cargar los pacientes.' }))
    return () => { active = false }
  }, [])
  return (
    <section className="container-fluid">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Pacientes</h1>
          <p className="text-body-secondary mb-0">Expedientes disponibles en el backend.</p>
        </div>
        <span className="small text-secondary align-self-center">Los pacientes se crean al finalizar una revisión aprobada.</span>
      </div>
      {state.kind === 'loading' ? <p role="status">Cargando pacientes...</p> : null}
      {state.kind === 'error' ? <div className="alert alert-danger">{state.message}</div> : null}
      {state.kind === 'ready' && state.patients.length === 0 ? <div className="alert alert-secondary">No hay expedientes todavía. Procesa un documento para crear el primero.</div> : null}
      <div className="row g-4">
        {state.patients.map((patient) => (
          <div className="col-sm-6 col-md-4 col-xl-3" key={patient.id}>
            <PatientCard patient={patient} onViewPatient={onViewPatient} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default DoctorPatientsGridView
