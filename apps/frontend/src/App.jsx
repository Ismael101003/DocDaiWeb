import { useState } from 'react'
import AppLayout from './layouts/AppLayout.jsx'
import LoginView from './views/LoginView.jsx'
import DoctorOCRCorrectionView from './views/doctor/DoctorOCRCorrectionView.jsx'
import DoctorPatientDetailView from './views/doctor/DoctorPatientDetailView.jsx'
import DoctorPatientsGridView from './views/doctor/DoctorPatientsGridView.jsx'
import DoctorWelcomeView from './views/doctor/DoctorWelcomeView.jsx'
import PatientFullDetailView from './views/user/PatientFullDetailView.jsx'
import PatientStudiesHistoryView from './views/user/PatientStudiesHistoryView.jsx'
import PatientWelcomeView from './views/user/PatientWelcomeView.jsx'

const demoUsers = [
  {
    id: 'u-doctor',
    username: 'doctor',
    email: 'doctor@docdaiweb.test',
    password: 'doctor123',
    role: 'doctor',
    name: 'Alvarez',
  },
  {
    id: 'u-patient',
    username: 'paciente',
    email: 'paciente@docdaiweb.test',
    password: 'paciente123',
    role: 'patient',
    name: 'Ana Martinez',
  },
]

const doctorStats = [
  { label: 'Pacientes activos', value: 42, percent: 84, widthClass: 'w-100', className: 'bg-primary' },
  { label: 'OCR por validar', value: 9, percent: 45, widthClass: 'w-50', className: 'bg-warning' },
  { label: 'Altas recientes', value: 12, percent: 60, widthClass: 'w-75', className: 'bg-success' },
]

const patients = [
  {
    id: 'p-001',
    initials: 'AM',
    name: 'Ana Martinez',
    age: 34,
    bloodType: 'O+',
    allergies: 'Sin alergias registradas',
    diagnosis: 'Seguimiento por hipertension controlada.',
    treatment: 'Control mensual, dieta baja en sodio y actividad fisica moderada.',
    clinicalNotes: 'Paciente estable, con adherencia adecuada al tratamiento.',
  },
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
  patient: 'patient-welcome',
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [activeView, setActiveView] = useState(defaultViewByRole.doctor)
  const activeRole = currentUser?.role ?? 'doctor'

  const handleLogin = (event, credentials) => {
    event.preventDefault()
    const foundUser = demoUsers.find((user) => {
      const matchesUser = user.email === credentials.user || user.username === credentials.user
      return matchesUser && user.password === credentials.password
    })

    if (!foundUser) {
      return false
    }

    setCurrentUser(foundUser)
    setActiveView(defaultViewByRole[foundUser.role])
    return true
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setActiveView(defaultViewByRole.doctor)
  }

  const renderView = () => {
    const views = {
      'doctor-welcome': <DoctorWelcomeView doctorName={currentUser.name} stats={doctorStats} />,
      'doctor-patients': <DoctorPatientsGridView patients={patients} onViewPatient={() => setActiveView('doctor-detail')} />,
      'doctor-detail': <DoctorPatientDetailView documents={ocrDocuments} patient={selectedPatient} onScanDocument={() => setActiveView('doctor-ocr')} />,
      'doctor-ocr': <DoctorOCRCorrectionView documentName="biometria-hematica.pdf" extractedData={extractedData} />,
      'patient-welcome': <PatientWelcomeView patient={selectedPatient} userName={currentUser.name} />,
      'patient-full-detail': <PatientFullDetailView patient={selectedPatient} />,
      'patient-studies': <PatientStudiesHistoryView studies={patientStudies} />,
    }

    return views[activeView] ?? views[defaultViewByRole[activeRole]]
  }

  if (!currentUser) {
    return <LoginView demoUsers={demoUsers} onLogin={handleLogin} />
  }

  return (
    <AppLayout activeRole={activeRole} activeView={activeView} currentUser={currentUser} onLogout={handleLogout} onNavigate={setActiveView}>
      {renderView()}
    </AppLayout>
  )
}

export default App
