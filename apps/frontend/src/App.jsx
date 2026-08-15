import { useState } from 'react'
import './App.css'
import AppLayout from './layouts/AppLayout.jsx'
import LoginView from './views/LoginView.jsx'
import DoctorOCRCorrectionView from './views/doctor/DoctorOCRCorrectionView.jsx'
import DoctorPatientDetailView from './views/doctor/DoctorPatientDetailView.jsx'
import DoctorPatientsGridView from './views/doctor/DoctorPatientsGridView.jsx'
import DoctorWelcomeView from './views/doctor/DoctorWelcomeView.jsx'
import PatientFullDetailView from './views/user/PatientFullDetailView.jsx'
import PatientSummaryView from './views/user/PatientSummaryView.jsx'

const doctorStats = [
  { label: 'Pacientes activos', value: 42, percent: 84, className: 'bg-primary' },
  { label: 'OCR por validar', value: 9, percent: 45, className: 'bg-warning' },
  { label: 'Altas recientes', value: 12, percent: 60, className: 'bg-success' },
]

const patients = [
  { id: 'p-001', initials: 'AM', name: 'Ana Martinez', age: 34, diagnosis: 'Seguimiento por hipertension controlada.' },
  { id: 'p-002', initials: 'CR', name: 'Carlos Ruiz', age: 51, diagnosis: 'Control metabolico y revision de laboratorio.' },
  { id: 'p-003', initials: 'LS', name: 'Laura Silva', age: 28, diagnosis: 'Evaluacion posterior a estudio de imagen.' },
  { id: 'p-004', initials: 'JM', name: 'Jorge Molina', age: 63, diagnosis: 'Monitoreo cardiologico trimestral.' },
]

const selectedPatient = patients[0]

const ocrDocuments = [
  { id: 'doc-001', name: 'Biometria hematica', date: '10 agosto 2026', status: 'Validado', statusClass: 'text-bg-success' },
  { id: 'doc-002', name: 'Radiografia de torax', date: '8 agosto 2026', status: 'Por revisar', statusClass: 'text-bg-warning' },
  { id: 'doc-003', name: 'Quimica sanguinea', date: '2 agosto 2026', status: 'Corregido', statusClass: 'text-bg-info' },
]

const patientStudies = [
  { id: 'study-001', date: '10 agosto 2026', type: 'Biometria hematica', result: 'Parametros generales dentro de rango esperado.' },
  { id: 'study-002', date: '8 agosto 2026', type: 'Radiografia de torax', result: 'Sin hallazgos agudos reportados.' },
  { id: 'study-003', date: '2 agosto 2026', type: 'Quimica sanguinea', result: 'Glucosa en observacion para seguimiento.' },
]

const extractedData = {
  patientName: selectedPatient.name,
  studyDate: '2026-08-10',
  studyType: 'Biometria hematica',
  doctor: 'Dr. Alvarez',
  findings: 'Texto extraido por OCR pendiente de validacion humana.',
}

const defaultViewByRole = {
  doctor: 'doctor-welcome',
  patient: 'patient-summary',
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeRole, setActiveRole] = useState('doctor')
  const [activeView, setActiveView] = useState(defaultViewByRole.doctor)

  const handleLogin = (event) => {
    event.preventDefault()
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setActiveRole('doctor')
    setActiveView(defaultViewByRole.doctor)
  }

  const handleRoleChange = (role) => {
    setActiveRole(role)
    setActiveView(defaultViewByRole[role])
  }

  const renderView = () => {
    const views = {
      'doctor-welcome': <DoctorWelcomeView doctorName="Alvarez" stats={doctorStats} />,
      'doctor-patients': <DoctorPatientsGridView patients={patients} onViewPatient={() => setActiveView('doctor-detail')} />,
      'doctor-detail': <DoctorPatientDetailView documents={ocrDocuments} patient={selectedPatient} onScanDocument={() => setActiveView('doctor-ocr')} />,
      'doctor-ocr': <DoctorOCRCorrectionView documentName="biometria-hematica.pdf" extractedData={extractedData} />,
      'patient-summary': <PatientSummaryView patient={selectedPatient} studies={patientStudies} onViewFullDetail={() => setActiveView('patient-full-detail')} />,
      'patient-full-detail': <PatientFullDetailView patient={selectedPatient} studies={patientStudies} />,
    }

    return views[activeView] ?? views[defaultViewByRole[activeRole]]
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />
  }

  return (
    <AppLayout activeRole={activeRole} activeView={activeView} onLogout={handleLogout} onNavigate={setActiveView} onRoleChange={handleRoleChange}>
      {renderView()}
    </AppLayout>
  )
}

export default App
