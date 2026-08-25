import StatBarList from '../../components/StatBarList.jsx'

const DoctorWelcomeView = ({ doctorName, stats, onScanDocument, onViewPatients }) => {
  return (
    <section className="container-fluid">
      <div className="row g-4 align-items-stretch">
        <div className="col-xl-5">
          <div className="ddw-hero">
            <p className="ddw-hero__eyebrow mb-2">Panel medico</p>
            <h1 className="display-6 ddw-hero__title mb-3">Bienvenido, Dr. {doctorName}</h1>
            <p className="lead ddw-hero__lead mb-4">Inicia una digitalización o consulta expedientes clínicos.</p>
            <div className="d-flex flex-wrap gap-2"><button type="button" className="btn btn-light btn-lg" onClick={onScanDocument}>+ Escanear / subir documento</button><button type="button" className="btn btn-outline-light" onClick={onViewPatients}>Ver pacientes</button></div>
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
