import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { DocumentsProvider } from '@/app/providers/DocumentsProvider';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { DashboardRouter } from '@/features/shared/pages/DashboardRouter';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { DoctorDashboardPage } from '@/features/doctor/pages/DoctorDashboardPage';
import { PatientsListPage } from '@/features/doctor/pages/PatientsListPage';
import { PatientDetailPage } from '@/features/doctor/pages/PatientDetailPage';
import { UploadDocumentPage } from '@/features/doctor/pages/UploadDocumentPage';
import { DocumentsPage } from '@/features/doctor/pages/DocumentsPage';
import { MedicalRecordReviewPage } from '@/features/doctor/pages/MedicalRecordReviewPage';
import { PatientDashboardPage } from '@/features/patient/pages/PatientDashboardPage';
import { PatientRecordsPage } from '@/features/patient/pages/PatientRecordsPage';
import { PatientRecordDetailPage } from '@/features/patient/pages/PatientRecordDetailPage';
import { PatientProfilePage } from '@/features/patient/pages/PatientProfilePage';
import { NotFoundPage } from '@/features/shared/pages/NotFoundPage';

export function AppRouter() {
  return (
    <AuthProvider>
      <DocumentsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DoctorDashboardPage />} />
            <Route path="patients" element={<PatientsListPage />} />
            <Route path="patients/:patientId" element={<PatientDetailPage />} />
            <Route path="uploads" element={<UploadDocumentPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="review/:recordId" element={<MedicalRecordReviewPage />} />
          </Route>

          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PatientDashboardPage />} />
            <Route path="records" element={<PatientRecordsPage />} />
            <Route path="records/:recordId" element={<PatientRecordDetailPage />} />
            <Route path="profile" element={<PatientProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      </DocumentsProvider>
    </AuthProvider>
  );
}
