const LoginView = ({ onLogin }) => {
  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary p-3">
      <section className="card shadow-sm w-100" style={{ maxWidth: '440px' }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <h1 className="h3 mb-2">DocDaiWeb</h1>
            <p className="text-body-secondary">Accede a tu expediente medico</p>
          </div>
          <form className="vstack gap-3" onSubmit={onLogin}>
            <div>
              <label className="form-label" htmlFor="loginUser">Usuario</label>
              <input className="form-control" id="loginUser" type="text" placeholder="Email o username" autoComplete="username" />
            </div>
            <div>
              <label className="form-label" htmlFor="loginPassword">Contraseña</label>
              <input className="form-control" id="loginPassword" type="password" placeholder="Tu contraseña" autoComplete="current-password" />
            </div>
            <button className="btn btn-primary w-100" type="submit">
              Iniciar sesión
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default LoginView
