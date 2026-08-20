import PatientGeneralInfo from '../../components/PatientGeneralInfo.jsx'

const PatientWelcomeView = ({ patient, userName }) => {
  return (
    <section className="container-fluid">
      <div className="row g-4 align-items-stretch">
        <div className="col-xl-5">
          <div className="ddw-patient-hero">
            <p className="ddw-patient-hero__eyebrow mb-2">Panel del paciente</p>
            <h1 className="display-6 ddw-patient-hero__title mb-3">Bienvenido, {userName}</h1>
            <p className="lead text-body-secondary mb-0">Consulta tu informacion general, diagnostico completo e historial de estudios.</p>
          </div>
        </div>
        <div className="col-xl-7">
          <PatientGeneralInfo patient={patient} />
        </div>
      </div>
    </section>
  )
}

export default PatientWelcomeView
