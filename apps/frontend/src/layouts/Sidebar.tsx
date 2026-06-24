import { NavLink } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { homePathForRole, getInitials } from '@/utils/formatters';

const doctorLinks = [
  { label: 'Dashboard', to: '/doctor' },
  { label: 'Patients', to: '/doctor/patients' },
  { label: 'Uploads', to: '/doctor/uploads' },
  { label: 'AI review', to: '/doctor/review/rec-404' },
];

const patientLinks = [
  { label: 'Dashboard', to: '/patient' },
  { label: 'Records', to: '/patient/records' },
  { label: 'Profile', to: '/patient/profile' },
];

export function Sidebar() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const links = user.role === 'doctor' ? doctorLinks : patientLinks;

  return (
    <aside className="col-12 col-lg-3 col-xxl-2 docdai-sidebar text-white px-3 px-xl-4 py-4 d-flex flex-column gap-4">
      <div>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white text-primary fw-bold" style={{ width: '3rem', height: '3rem' }}>
            {getInitials(user.name)}
          </div>
          <div>
            <div className="fw-bold">DocDaiWeb</div>
            <div className="small text-white-50">Clinical OCR workspace</div>
          </div>
        </div>

        <div className="rounded-4 bg-white bg-opacity-10 p-3 mb-4">
          <div className="small text-white-50 mb-1">Signed in as</div>
          <div className="fw-semibold">{user.name}</div>
          <div className="small text-white-50 text-capitalize">{user.role} portal</div>
        </div>

        <nav className="nav nav-pills flex-column gap-2">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === homePathForRole(user.role)} className={({ isActive }) => `docdai-sidebar-link nav-link ${isActive ? 'active' : ''}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto rounded-4 bg-white bg-opacity-10 p-3">
        <div className="small text-white-50 mb-1">Integration state</div>
        <div className="fw-semibold">Ready for API connection</div>
        <div className="small text-white-50">Mock auth and local data are active for now.</div>
      </div>
    </aside>
  );
}
