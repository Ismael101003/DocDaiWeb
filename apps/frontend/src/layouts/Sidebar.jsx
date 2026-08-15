const navigationByRole = {
  doctor: [
    { key: 'doctor-welcome', label: 'Inicio', icon: '⌂' },
    { key: 'doctor-patients', label: 'Pacientes', icon: '□' },
  ],
  patient: [
    { key: 'patient-summary', label: 'Mi resumen', icon: '□' },
    { key: 'patient-full-detail', label: 'Ficha completa', icon: '☤' },
  ],
}

const Sidebar = ({ activeRole, activeView, onNavigate, onRoleChange, onLogout }) => {
  const navigationItems = navigationByRole[activeRole]

  return (
    <aside className="border-end bg-white">
      <div className="offcanvas-lg offcanvas-start show text-bg-light" tabIndex="-1" id="docdaiSidebar" aria-labelledby="docdaiSidebarLabel">
        <div className="offcanvas-header border-bottom">
          <h1 className="offcanvas-title h5" id="docdaiSidebarLabel">DocDaiWeb</h1>
          <button className="btn-close d-lg-none" type="button" data-bs-dismiss="offcanvas" data-bs-target="#docdaiSidebar" aria-label="Cerrar menu" />
        </div>
        <div className="offcanvas-body d-flex flex-column p-3">
          <div className="mb-4">
            <p className="small text-uppercase text-body-secondary mb-2">Rol activo</p>
            <div className="btn-group w-100" role="group" aria-label="Cambiar rol activo">
              <button className={`btn btn-sm ${activeRole === 'doctor' ? 'btn-primary' : 'btn-outline-primary'}`} type="button" onClick={() => onRoleChange('doctor')}>
                Doctor
              </button>
              <button className={`btn btn-sm ${activeRole === 'patient' ? 'btn-primary' : 'btn-outline-primary'}`} type="button" onClick={() => onRoleChange('patient')}>
                Paciente
              </button>
            </div>
          </div>
          <nav className="nav nav-pills flex-column gap-2" aria-label="Navegacion principal">
            {navigationItems.map((item) => (
              <button className={`nav-link text-start d-flex align-items-center gap-2 ${activeView === item.key ? 'active' : 'text-body'}`} type="button" key={item.key} onClick={() => onNavigate(item.key)}>
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <button className="btn btn-outline-danger mt-auto" type="button" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
