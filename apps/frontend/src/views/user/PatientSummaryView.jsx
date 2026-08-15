import PatientGeneralInfo from '../../components/PatientGeneralInfo.jsx'

const PatientSummaryView = ({ patient, studies, onViewFullDetail }) => {
  return (
    <section className="container-fluid">
      <div className="mb-4">
        <h1 className="h3 mb-1">Mi resumen medico</h1>
        <p className="text-body-secondary mb-0">Informacion de solo lectura para consulta del paciente.</p>
      </div>
      <div className="row g-4">
        <div className="col-lg-4">
          <PatientGeneralInfo patient={patient} />
        </div>
        <div className="col-lg-8">
          <section className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Historial de estudios</h2>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Fecha</th>
                      <th scope="col">Estudio</th>
                      <th scope="col">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studies.map((study) => (
                      <tr key={study.id}>
                        <td>{study.date}</td>
                        <td>{study.type}</td>
                        <td>{study.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-end mt-4">
                <button className="btn btn-primary" type="button" onClick={onViewFullDetail}>
                  Ver diagnostico completo
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

export default PatientSummaryView
