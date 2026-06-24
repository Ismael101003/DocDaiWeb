import { NavLink } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { homePathForRole, getInitials } from '@/utils/formatters';

const doctorLinks = [
  { label: 'Panel', to: '/doctor' },
  { label: 'Pacientes', to: '/doctor/patients' },
  { label: 'Cargas', to: '/doctor/uploads' },
  { label: 'Revisión IA', to: '/doctor/review/rec-404' },
];

const patientLinks = [
  { label: 'Panel', to: '/patient' },
  { label: 'Registros', to: '/patient/records' },
  { label: 'Perfil', to: '/patient/profile' },
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
            <div className="small text-white-50">Espacio de trabajo OCR clínico</div>
          </div>
        </div>

        <div className="rounded-4 bg-white bg-opacity-10 p-3 mb-4">
          <div className="small text-white-50 mb-1">Sesión iniciada como</div>
          <div className="fw-semibold">{user.name}</div>
          <div className="small text-white-50 text-capitalize">Portal de {user.role}</div>
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
        <div className="small text-white-50 mb-1">Estado de integración</div>
        <div className="fw-semibold">Listo para conectar la API</div>
        <div className="small text-white-50">La autenticación simulada y los datos locales siguen activos por ahora.</div>
      </div>
    </aside>
  );
}
