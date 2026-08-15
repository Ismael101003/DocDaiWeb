import Footer from './Footer.jsx'
import Sidebar from './Sidebar.jsx'

const AppLayout = ({ activeRole, activeView, children, onLogout, onNavigate, onRoleChange }) => {
  return (
    <div className="min-vh-100 d-flex flex-column bg-body-tertiary">
      <header className="navbar bg-white border-bottom d-lg-none px-3">
        <button className="btn btn-outline-primary" type="button" data-bs-toggle="offcanvas" data-bs-target="#docdaiSidebar" aria-controls="docdaiSidebar">
          Menu
        </button>
        <span className="navbar-brand mb-0 h1">DocDaiWeb</span>
      </header>
      <div className="container-fluid flex-grow-1">
        <div className="row min-vh-100">
          <div className="col-lg-3 col-xl-2 px-0">
            <Sidebar activeRole={activeRole} activeView={activeView} onLogout={onLogout} onNavigate={onNavigate} onRoleChange={onRoleChange} />
          </div>
          <div className="col-lg-9 col-xl-10 px-0 d-flex flex-column">
            <main className="flex-grow-1 p-3 p-md-4">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
