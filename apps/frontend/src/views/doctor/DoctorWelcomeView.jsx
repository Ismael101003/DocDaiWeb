import StatBarList from '../../components/StatBarList.jsx'

const DoctorWelcomeView = ({ doctorName, stats }) => {
  return (
    <section className="container-fluid">
      <div className="row g-4 align-items-stretch">
        <div className="col-xl-5">
          <div className="h-100 p-4 bg-white border rounded">
            <p className="text-uppercase small text-body-secondary mb-2">Panel medico</p>
            <h1 className="display-6 mb-3">Bienvenido, Dr. {doctorName}</h1>
            <p className="lead text-body-secondary mb-0">Consulta pacientes, documentos OCR y validaciones pendientes desde un flujo simple.</p>
          </div>
        </div>
        <div className="col-xl-7">
          <article className="card h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="h5 mb-1">Estadisticas de pacientes</h2>
                  <p className="text-body-secondary mb-0">Resumen operativo de la semana</p>
                </div>
                <span className="badge text-bg-primary">Demo</span>
              </div>
              <StatBarList stats={stats} />
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

export default DoctorWelcomeView
