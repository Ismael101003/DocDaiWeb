import PatientCard from '../../components/PatientCard.jsx'

const DoctorPatientsGridView = ({ patients, onViewPatient }) => {
  return (
    <section className="container-fluid">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Pacientes</h1>
          <p className="text-body-secondary mb-0">Cuadricula responsive de pacientes asignados.</p>
        </div>
        <button className="btn btn-primary" type="button">Registrar paciente</button>
      </div>
      <div className="row g-4">
        {patients.map((patient) => (
          <div className="col-sm-6 col-md-4 col-xl-3" key={patient.id}>
            <PatientCard patient={patient} onViewPatient={onViewPatient} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default DoctorPatientsGridView
