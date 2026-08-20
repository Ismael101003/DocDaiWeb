const PatientCard = ({ patient, onViewPatient }) => {
  return (
    <article className="card h-100 shadow-sm">
      <div className="card-body d-flex flex-column align-items-center text-center">
        <div className="bg-secondary-subtle rounded-circle p-4 mb-3">
          <span className="fs-3 text-secondary-emphasis lh-1">{patient.initials}</span>
        </div>
        <h3 className="h5 mb-1">{patient.name}</h3>
        <p className="text-body-secondary mb-3">{patient.age} anos</p>
        <button className="btn btn-outline-primary mt-auto" type="button" onClick={() => onViewPatient(patient.id)}>
          Ver paciente
        </button>
      </div>
    </article>
  )
}

export default PatientCard
