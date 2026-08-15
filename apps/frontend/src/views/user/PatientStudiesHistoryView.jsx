const PatientStudiesHistoryView = ({ studies }) => {
  return (
    <section className="container-fluid">
      <div className="mb-4">
        <h1 className="h3 mb-1">Historial de estudios</h1>
        <p className="text-body-secondary mb-0">Registro de estudios realizados y resultados disponibles.</p>
      </div>
      <section className="card shadow-sm">
        <div className="card-body">
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
        </div>
      </section>
    </section>
  )
}

export default PatientStudiesHistoryView
