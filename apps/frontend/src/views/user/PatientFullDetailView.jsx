const PatientFullDetailView = ({ patient }) => {
  return (
    <section className="container-fluid">
      <div className="mb-4">
        <h1 className="h3 mb-1">Diagnostico completo</h1>
        <p className="text-body-secondary mb-0">Vista de solo lectura con el desglose detallado de la ficha medica.</p>
      </div>
      <div className="row g-4">
        <div className="col-xl-4">
          <section className="card shadow-sm h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Ficha medica</h2>
              <dl className="mb-0">
                <dt className="text-body-secondary">Paciente</dt>
                <dd>{patient.name}</dd>
                <dt className="text-body-secondary">Edad</dt>
                <dd>{patient.age} anos</dd>
                <dt className="text-body-secondary">Tipo de sangre</dt>
                <dd>{patient.bloodType}</dd>
                <dt className="text-body-secondary">Alergias</dt>
                <dd className="mb-0">{patient.allergies}</dd>
              </dl>
            </div>
          </section>
        </div>
        <div className="col-xl-8">
          <section className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Detalle clinico</h2>
              <dl className="mb-0">
                <dt className="text-body-secondary">Diagnostico actual</dt>
                <dd className="mb-0">{patient.diagnosis}</dd>
                <dt className="text-body-secondary mt-3">Tratamiento indicado</dt>
                <dd className="mb-0">{patient.treatment}</dd>
                <dt className="text-body-secondary mt-3">Notas clinicas</dt>
                <dd className="mb-0">{patient.clinicalNotes}</dd>
              </dl>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

export default PatientFullDetailView
