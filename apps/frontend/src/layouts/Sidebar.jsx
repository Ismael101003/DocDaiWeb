const navigationByRole = {
  doctor: [
    { key: 'doctor-welcome', label: 'Inicio', icon: 'IN' },
    { key: 'doctor-patients', label: 'Pacientes', icon: 'PA' },
    { key: 'doctor-detail', label: 'Detalle clinico', icon: 'DC' },
    { key: 'doctor-ocr', label: 'Correccion OCR', icon: 'OC' },
  ],
  patient: [
    { key: 'patient-welcome', label: 'Inicio', icon: 'IN' },
    { key: 'patient-full-detail', label: 'Diagnostico completo', icon: 'DX' },
    { key: 'patient-studies', label: 'Historial de estudios', icon: 'HE' },
  ],
}

const Sidebar = ({ activeRole, activeView, currentUser, onNavigate, onLogout }) => {
  const navigationItems = navigationByRole[activeRole]
  const roleLabel = activeRole === 'doctor' ? 'Doctor' : 'Paciente'

  return (
    <aside className="border-end bg-white">
      <div className="offcanvas-lg offcanvas-start show text-bg-light" tabIndex="-1" id="docdaiSidebar" aria-labelledby="docdaiSidebarLabel">
        <div className="offcanvas-header border-bottom">
          <h1 className="offcanvas-title h5" id="docdaiSidebarLabel">DocDaiWeb</h1>
          <button className="btn-close d-lg-none" type="button" data-bs-dismiss="offcanvas" data-bs-target="#docdaiSidebar" aria-label="Cerrar menu" />
        </div>
        <div className="offcanvas-body d-flex flex-column p-3">
          <div className="border rounded p-3 mb-4 bg-white">
            <p className="small text-uppercase text-body-secondary mb-1">Sesion activa</p>
            <p className="fw-semibold mb-1">{currentUser.name}</p>
            <span className="badge text-bg-primary">{roleLabel}</span>
          </div>
          <nav className="nav nav-pills flex-column gap-2" aria-label="Navegacion principal">
            {navigationItems.map((item) => (
              <button className={`nav-link text-start d-flex align-items-center gap-2 ${activeView === item.key ? 'active' : 'text-body'}`} type="button" key={item.key} onClick={() => onNavigate(item.key)}>
                <span className="badge text-bg-light text-body border" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <button className="btn btn-outline-danger mt-auto" type="button" onClick={onLogout}>
            Cerrar sesion
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
