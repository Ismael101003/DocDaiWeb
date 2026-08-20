import PatientWelcomeView from './PatientWelcomeView.jsx'

const PatientSummaryView = ({ patient, userName }) => {
  return <PatientWelcomeView patient={patient} userName={userName} />
}

export default PatientSummaryView
