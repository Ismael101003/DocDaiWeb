import { useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { DocumentsProvider } from './app/providers/DocumentsProvider.tsx'
import { DocumentsPage } from './features/doctor/pages/DocumentsPage.tsx'
import { DocumentUploadPage } from './features/doctor/pages/DocumentUploadPage.tsx'
import { OcrReviewPage } from './features/ocr-layout/pages/OcrReviewPage.tsx'
import { PatientRecordPage } from './features/doctor/pages/PatientRecordPage.tsx'
import useDarkMode from './hooks/useDarkMode.js'
import AppLayout from './layouts/AppLayout.jsx'
import LoginView from './views/LoginView.jsx'
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
  { label: 'Pacientes activos', value: 42, percent: 84, className: 'ddw-stat__bar--primary' },
  { label: 'OCR por validar', value: 9, percent: 45, className: 'ddw-stat__bar--warning' },
  { label: 'Altas recientes', value: 12, percent: 60, className: 'ddw-stat__bar--success' },
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

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const { isDark, toggleDarkMode } = useDarkMode()
  const location = useLocation()
  const navigate = useNavigate()
  const activeRole = currentUser?.role ?? 'doctor'
  const themeClassName = isDark ? 'dark-theme' : ''

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
    navigate(foundUser.role === 'doctor' ? '/doctor' : '/patient')
    return true
  }

  const handleLogout = () => {
    setCurrentUser(null)
    navigate('/login')
  }

  const routeByView = {
    'doctor-welcome': '/doctor', 'doctor-patients': '/doctor/patients', 'doctor-detail': '/doctor/patient-detail', 'doctor-documents': '/doctor/documents',
    'patient-welcome': '/patient', 'patient-full-detail': '/patient/full-detail', 'patient-studies': '/patient/studies',
  }
  const activeView = Object.entries(routeByView).find(([, path]) => path === location.pathname)?.[0] ?? (activeRole === 'doctor' ? 'doctor-welcome' : 'patient-welcome')

  if (!currentUser) {
    return (
      <div className={themeClassName}>
        <LoginView demoUsers={demoUsers} onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div className={themeClassName}>
      <DocumentsProvider>
        <AppLayout activeRole={activeRole} activeView={activeView} currentUser={currentUser} isDark={isDark} onLogout={handleLogout} onNavigate={(view) => navigate(routeByView[view])} onToggleDarkMode={toggleDarkMode}>
          <Routes>
            <Route path="/doctor" element={<DoctorWelcomeView doctorName={currentUser.name} stats={doctorStats} onScanDocument={() => navigate('/doctor/uploads')} onViewPatients={() => navigate('/doctor/patients')} />} />
            <Route path="/doctor/patients" element={<DoctorPatientsGridView onViewPatient={(patientId) => navigate(`/doctor/patients/${patientId}`)} />} />
            <Route path="/doctor/patients/:patientId" element={<PatientRecordPage />} />
            <Route path="/doctor/patients/:patientId/upload" element={<DocumentUploadPage />} />
            <Route path="/doctor/patient-detail" element={<DoctorPatientDetailView documents={ocrDocuments} patient={selectedPatient} onScanDocument={() => navigate('/doctor/uploads')} />} />
            <Route path="/doctor/uploads" element={<DocumentUploadPage />} />
            <Route path="/doctor/documents" element={<DocumentsPage />} />
            <Route path="/doctor/documents/:documentId/review" element={<OcrReviewPage />} />
            <Route path="/patient" element={<PatientWelcomeView patient={selectedPatient} userName={currentUser.name} />} />
            <Route path="/patient/full-detail" element={<PatientFullDetailView patient={selectedPatient} />} />
            <Route path="/patient/studies" element={<PatientStudiesHistoryView studies={patientStudies} />} />
            <Route path="*" element={<Navigate to={activeRole === 'doctor' ? '/doctor' : '/patient'} replace />} />
          </Routes>
        </AppLayout>
      </DocumentsProvider>
    </div>
  )
}

export default App
