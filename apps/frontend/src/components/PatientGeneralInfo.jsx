const PatientGeneralInfo = ({ patient }) => {
  return (
    <section className="card shadow-sm">
      <div className="card-body">
        <h2 className="h5 mb-3">Datos generales</h2>
        <dl className="row mb-0">
          <dt className="col-sm-4 text-body-secondary">Nombre</dt>
          <dd className="col-sm-8">{patient.name}</dd>
          <dt className="col-sm-4 text-body-secondary">Edad</dt>
          <dd className="col-sm-8">{patient.age} anos</dd>
          <dt className="col-sm-4 text-body-secondary">Diagnostico general</dt>
          <dd className="col-sm-8 mb-0">{patient.diagnosis}</dd>
        </dl>
      </div>
    </section>
  )
}

export default PatientGeneralInfo
