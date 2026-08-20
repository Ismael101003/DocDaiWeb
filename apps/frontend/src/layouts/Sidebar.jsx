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

const Sidebar = ({ activeRole, activeView, currentUser, isDark, onLogout, onNavigate, onToggleDarkMode }) => {
  const navigationItems = navigationByRole[activeRole]
  const roleLabel = activeRole === 'doctor' ? 'Doctor' : 'Paciente'

  return (
    <aside className="ddw-sidebar">
      <div className="offcanvas-lg offcanvas-start show" tabIndex="-1" id="docdaiSidebar" aria-labelledby="docdaiSidebarLabel">
        <div className="offcanvas-header border-bottom">
          <div className="ddw-sidebar__brand">
            <span className="ddw-sidebar__brand-icon" aria-hidden="true">Dx</span>
            <h1 className="ddw-sidebar__brand-text h5 mb-0" id="docdaiSidebarLabel">DocDaiWeb</h1>
          </div>
          <button className="btn-close d-lg-none" type="button" data-bs-dismiss="offcanvas" data-bs-target="#docdaiSidebar" aria-label="Cerrar menu" />
        </div>
        <div className="offcanvas-body d-flex flex-column p-3 gap-4">
          <div className="ddw-sidebar__session">
            <p className="ddw-sidebar__session-label mb-1">Sesion activa</p>
            <p className="fw-semibold mb-2">{currentUser.name}</p>
            <span className="badge text-bg-primary">{roleLabel}</span>
          </div>
          <nav className="ddw-sidebar__nav" aria-label="Navegacion principal">
            {navigationItems.map((item) => (
              <button
                className={`ddw-sidebar__link ${activeView === item.key ? 'active' : ''}`}
                type="button"
                key={item.key}
                onClick={() => onNavigate(item.key)}
              >
                <span className="ddw-sidebar__link-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="ddw-theme-switch">
            <span className="ddw-theme-switch__label">Modo oscuro</span>
            <button
              aria-checked={isDark}
              aria-label="Alternar modo oscuro"
              className="ddw-theme-switch__toggle"
              onClick={onToggleDarkMode}
              role="switch"
              type="button"
            />
          </div>
          <button className="btn btn-outline-danger ddw-logout-btn" type="button" onClick={onLogout}>
            Cerrar sesion
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
