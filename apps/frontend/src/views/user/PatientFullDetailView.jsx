const PatientFullDetailView = ({ patient, studies }) => {
  return (
    <section className="container-fluid">
      <div className="mb-4">
        <h1 className="h3 mb-1">Ficha medica completa</h1>
        <p className="text-body-secondary mb-0">Desglose de historial clinico y seguimiento del paciente.</p>
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
                <dd>{patient.age} años</dd>
                <dt className="text-body-secondary">Diagnostico actual</dt>
                <dd className="mb-0">{patient.diagnosis}</dd>
              </dl>
            </div>
          </section>
        </div>
        <div className="col-xl-8">
          <section className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Historial clinico</h2>
              <div className="vstack gap-3">
                {studies.map((study) => (
                  <article className="border rounded p-3" key={study.id}>
                    <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                      <h3 className="h6 mb-0">{study.type}</h3>
                      <span className="text-body-secondary">{study.date}</span>
                    </div>
                    <p className="mb-0 mt-2">{study.result}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

export default PatientFullDetailView
