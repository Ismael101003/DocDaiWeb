import { useState } from 'react'

const LoginView = ({ demoUsers, onLogin }) => {
  const [loginError, setLoginError] = useState('')

  const handleSubmit = (event) => {
    const formData = new FormData(event.currentTarget)
    const credentials = {
      user: formData.get('user').trim(),
      password: formData.get('password'),
    }
    const isValidLogin = onLogin(event, credentials)

    if (!isValidLogin) {
      setLoginError('Usuario o contrasena incorrectos.')
    }
  }

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary p-3">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-7 col-lg-5">
            <section className="card shadow-sm">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h1 className="h3 mb-2">DocDaiWeb</h1>
                  <p className="text-body-secondary">Accede a tu expediente medico</p>
                </div>
                <form className="vstack gap-3" onSubmit={handleSubmit}>
                  <div>
                    <label className="form-label" htmlFor="loginUser">Usuario</label>
                    <input className="form-control" id="loginUser" name="user" type="text" placeholder="Email o username" autoComplete="username" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="loginPassword">Contrasena</label>
                    <input className="form-control" id="loginPassword" name="password" type="password" placeholder="Tu contrasena" autoComplete="current-password" />
                  </div>
                  {loginError && <div className="alert alert-danger mb-0">{loginError}</div>}
                  <button className="btn btn-primary w-100" type="submit">
                    Iniciar sesion
                  </button>
                </form>
                <div className="border-top mt-4 pt-3">
                  <p className="small text-uppercase text-body-secondary mb-2">Usuarios demo</p>
                  {demoUsers.map((user) => (
                    <p className="small mb-1" key={user.id}>
                      <span className="fw-semibold">{user.role === 'doctor' ? 'Doctor' : 'Paciente'}:</span> {user.email} / {user.password}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default LoginView
