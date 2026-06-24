import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const titleMap: Array<[RegExp, { title: string; subtitle: string }]> = [
  [/^\/doctor\/patients\/[^/]+$/, { title: 'Patient detail', subtitle: 'Timeline, files, and AI extraction preview' }],
  [/^\/doctor\/patients$/, { title: 'Patients', subtitle: 'Search and monitor the patient roster' }],
  [/^\/doctor\/uploads$/, { title: 'Upload documents', subtitle: 'Process scans, PDFs, and photos through OCR' }],
  [/^\/doctor\/review\/[^/]+$/, { title: 'Medical record review', subtitle: 'Approve or edit extracted clinical data' }],
  [/^\/doctor$/, { title: 'Doctor dashboard', subtitle: 'Clinical workload, review queue, and patient activity' }],
  [/^\/patient\/records\/[^/]+$/, { title: 'Record detail', subtitle: 'Readable report view for the patient' }],
  [/^\/patient\/records$/, { title: 'Medical records', subtitle: 'All structured records in one place' }],
  [/^\/patient\/profile$/, { title: 'Patient profile', subtitle: 'Personal information and care summary' }],
  [/^\/patient$/, { title: 'Patient dashboard', subtitle: 'Recent records and current status' }],
];

export function AppLayout() {
  const location = useLocation();

  const pageMeta = titleMap.find(([pattern]) => pattern.test(location.pathname))?.[1] ?? {
    title: 'Clinical workspace',
    subtitle: 'Structured records and OCR validation',
  };

  return (
    <div className="container-fluid px-0 docdai-shell">
      <div className="row g-0 min-vh-100">
        <Sidebar />

        <div className="col-12 col-lg-9 col-xxl-10 d-flex flex-column">
          <Topbar title={pageMeta.title} subtitle={pageMeta.subtitle} />

          <main className="flex-grow-1 p-3 p-md-4 p-xl-5">
            <div className="container-fluid px-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
